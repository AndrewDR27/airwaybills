// Authentication system with role-based access
// Uses Upstash Redis database via API
// Database required everywhere (localhost and production)
// Note: localStorage is still used for session tokens (awb_auth) for authentication

// Import usersAPI (will be loaded as module or available globally)
let usersAPI = null;

// Initialize API on load
if (typeof window !== 'undefined') {
    // Try to import usersAPI if available
    if (window.usersAPI) {
        usersAPI = window.usersAPI;
    } else {
        // Will be set when api.js loads
        window.addEventListener('apiReady', () => {
            usersAPI = window.usersAPI;
        });
    }
}

// Cache for current user (for synchronous access)
let currentUserCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60000; // 1 minute

// Get current user (synchronous - uses cache, localStorage fallback on localhost)
function getCurrentUser() {
    // Check cache first (if valid and recent)
    if (currentUserCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
        // Verify cache is still valid by checking awb_auth
        const authData = localStorage.getItem('awb_auth');
        if (authData) {
            try {
                const auth = JSON.parse(authData);
                if (auth.isAuthenticated && auth.userId === currentUserCache.id) {
                    return currentUserCache;
                }
            } catch (e) {
                // Invalid auth - clear cache
                currentUserCache = null;
                cacheTimestamp = 0;
            }
        } else {
            // No auth data - clear cache
            currentUserCache = null;
            cacheTimestamp = 0;
            return null;
        }
    }
    
    // Check if awb_auth exists - if not, user is logged out
    const authData = localStorage.getItem('awb_auth');
    if (!authData) {
        // No auth data means user is logged out - clear cache and return null
        currentUserCache = null;
        cacheTimestamp = 0;
        return null;
    }
    
    // Parse auth data to verify it's valid
    let auth;
    try {
        auth = JSON.parse(authData);
        if (!auth.isAuthenticated || !auth.userId) {
            // Invalid auth data - clear cache and return null
            currentUserCache = null;
            cacheTimestamp = 0;
            return null;
        }
    } catch (e) {
        // Invalid JSON - clear cache and return null
        currentUserCache = null;
        cacheTimestamp = 0;
        return null;
    }
    
    // If API is available and we have a cached user, return it
    if (usersAPI && currentUserCache && currentUserCache.id === auth.userId) {
        console.log('getCurrentUser: Returning cached user', currentUserCache.email);
        return currentUserCache;
    }
    
    // Database required - no localStorage fallback
    if (!usersAPI) {
        console.error('❌ Database API not available. Cannot proceed without database.');
        return null;
    }
    
    return null;
}

// Get current user from API (async) - requires database
async function getCurrentUserAsync() {
    if (!usersAPI) {
        throw new Error('Database API not available. Please ensure the database is configured.');
    }
    
    try {
        const user = await usersAPI.getCurrent();
        if (user) {
            console.log('💾 Storage: Using database (Upstash Redis)');
            currentUserCache = user;
            cacheTimestamp = Date.now();
            // Store session token and user in localStorage (for cache and localhost fallback)
            try {
                const existingAuth = JSON.parse(localStorage.getItem('awb_auth') || '{}');
                localStorage.setItem('awb_auth', JSON.stringify({
                    isAuthenticated: true,
                    userId: user.id,
                    sessionToken: existingAuth.sessionToken || null // Preserve session token
                }));
                // Also store user in awb_users array for getCurrentUser() to find
                const users = JSON.parse(localStorage.getItem('awb_users') || '[]');
                const index = users.findIndex(u => u.id === user.id);
                if (index >= 0) {
                    users[index] = user;
                } else {
                    users.push(user);
                }
                localStorage.setItem('awb_users', JSON.stringify(users));
            } catch (e) {
                console.warn('Could not update localStorage:', e);
            }
            return user;
        } else {
            // API returned null - user is not authenticated
            // Clear cache to prevent returning stale user data
            currentUserCache = null;
            cacheTimestamp = 0;
            
            return null;
        }
    } catch (error) {
        console.error('Error fetching current user from API:', error);
        if (canUseLocalStorage()) {
            console.log('📦 Localhost: Falling back to localStorage');
            return getCurrentUser();
        }
        throw error; // Require API in production
    }
}

// Check which storage is being used
function getStorageSource() {
    if (usersAPI && typeof usersAPI.getAll === 'function') {
        return 'database';
    }
    return null; // Database required
}

// Get storage source with async check
async function getStorageSourceAsync() {
    // Wait a bit for API to load if it's not ready yet
    if (!usersAPI) {
        // Wait for apiReady event
        await new Promise((resolve) => {
            if (window.usersAPI) {
                usersAPI = window.usersAPI;
                resolve();
            } else {
                window.addEventListener('apiReady', () => {
                    usersAPI = window.usersAPI;
                    resolve();
                }, { once: true });
                // Timeout after 1 second
                setTimeout(resolve, 1000);
            }
        });
    }
    
    if (!usersAPI) {
        throw new Error('Database API not available. Please ensure the database is configured.');
    }
    
    try {
        // Try to fetch from API with a short timeout
        const testPromise = usersAPI.getAll();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 3000)
        );
        
        await Promise.race([testPromise, timeoutPromise]);
        console.log('API test successful, using database');
        return 'database';
    } catch (error) {
        console.error('API test failed:', error.message);
        throw new Error('Database connection failed. Please check your connection and try again.');
    }
}

// Check if user is authenticated
function isAuthenticated() {
    const user = getCurrentUser();
    return user !== null;
}

// Login - requires API, fallback on localhost
async function login(email, password) {
    console.log('Login called with email:', email);
    
    if (!usersAPI) {
        return { 
            success: false, 
            message: 'Database API not available. Please ensure the database is configured.' 
        };
    }
    
    try {
        console.log('Attempting API login...');
        const result = await usersAPI.login(email, password);
        console.log('API login result:', result);
        
        if (result && result.success && result.user) {
            currentUserCache = result.user;
            cacheTimestamp = Date.now();
            // Store session token and user in localStorage (for cache and localhost fallback)
            try {
                localStorage.setItem('awb_auth', JSON.stringify({
                    isAuthenticated: true,
                    userId: result.user.id,
                    email: result.user.email,
                    role: result.user.role,
                    sessionToken: result.sessionToken || null // Store session token
                }));
                // Also store user in awb_users array for getCurrentUser() to find
                const users = JSON.parse(localStorage.getItem('awb_users') || '[]');
                const index = users.findIndex(u => u.id === result.user.id);
                if (index >= 0) {
                    users[index] = result.user;
                } else {
                    users.push(result.user);
                }
                localStorage.setItem('awb_users', JSON.stringify(users));
            } catch (e) {
                console.warn('Could not store session token:', e);
            }
            return result;
        } else {
            console.warn('API login returned unsuccessful result:', result);
            return result || { success: false, message: 'Invalid email or password' };
        }
    } catch (error) {
        console.error('Error logging in via API:', error);
        if (error.message && error.message.includes('Invalid email or password')) {
            return { success: false, message: error.message };
        }
        return { 
            success: false, 
            message: `Database connection error: ${error.message}. Please check your connection and try again.` 
        };
    }
}

// Register new user - requires API, fallback on localhost
async function register(userData) {
    // Wait for API to be ready if it's not available yet (but only wait a short time)
    if (!usersAPI) {
        // Wait for apiReady event (max 1 second)
        await new Promise((resolve) => {
            if (window.usersAPI) {
                usersAPI = window.usersAPI;
                resolve();
            } else {
                window.addEventListener('apiReady', () => {
                    usersAPI = window.usersAPI;
                    resolve();
                }, { once: true });
                // Timeout after 1 second
                setTimeout(resolve, 1000);
            }
        });
    }
    
    // If still no API and on localhost, use localStorage
    if (!usersAPI) {
        return { 
            success: false, 
            message: 'Database API not available. Please ensure the database is configured.' 
        };
    }
    
    try {
        const newUser = await usersAPI.register(userData);
        if (newUser) {
            // Auto-login after registration
            const loginResult = await login(userData.email, userData.password);
            return { success: true, user: newUser };
        }
        return { success: false, message: 'Registration failed' };
    } catch (error) {
        console.error('Error registering via API:', error);
        return { 
            success: false, 
            message: error.message || 'Registration failed. Please check your connection and try again.' 
        };
    }
}

// Note: localStorage fallback functions removed - database required everywhere

// Logout
async function logout() {
    // Get session token and user ID BEFORE clearing auth data
    const authData = JSON.parse(localStorage.getItem('awb_auth') || '{}');
    const sessionToken = authData.sessionToken;
    
    // Clear cache FIRST to prevent getCurrentUser() from returning cached user
    currentUserCache = null;
    cacheTimestamp = 0;
    
    // Logout from API if available
    if (usersAPI) {
        try {
            // Logout with session token
            if (sessionToken) {
                try {
                    await fetch(`${window.location.origin}/api/users?action=logout`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionToken })
                    });
                } catch (e) {
                    console.error('Error logging out session:', e);
                }
            } else {
                // Fallback to old logout method
                await usersAPI.logout();
            }
        } catch (error) {
            console.error('Error logging out via API:', error);
        }
    }
    
    // Clear all auth-related localStorage items
    localStorage.removeItem('awb_auth');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    
    // Clear any session-related data
    if (sessionToken) {
        localStorage.removeItem(`session_${sessionToken}`);
    }
    
    // Force clear cache again (in case anything was set during API call)
    currentUserCache = null;
    cacheTimestamp = 0;
    
    // Redirect to login
    window.location.href = 'login.html';
}

// Get all users (for admin/invitation purposes) - requires API, fallback on localhost
async function getAllUsers() {
    if (!usersAPI) {
        throw new Error('Database API not available. Please ensure the database is configured.');
    }
    
    try {
        const users = await usersAPI.getAll();
        return users;
    } catch (error) {
        console.error('Error fetching users from API:', error);
        throw error;
    }
}

// Get user by ID - requires API, fallback on localhost
async function getUserById(userId) {
    if (!usersAPI) {
        throw new Error('Database API not available. Please ensure the database is configured.');
    }
    
    try {
        return await usersAPI.getById(userId);
    } catch (error) {
        console.error('Error fetching user from API:', error);
        throw error;
    }
}

// Get user by email - requires API, fallback on localhost
async function getUserByEmail(email) {
    if (!usersAPI) {
        throw new Error('Database API not available. Please ensure the database is configured.');
    }
    
    try {
        return await usersAPI.getByEmail(email);
    } catch (error) {
        console.error('Error fetching user from API:', error);
        throw error;
    }
}

// Require authentication (redirect to login if not authenticated)
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Require specific role
function requireRole(requiredRole) {
    if (!requireAuth()) return false;
    
    const user = getCurrentUser();
    if (user.role !== requiredRole) {
        alert(`Access denied. This page requires ${getRoleLabel(requiredRole)} role.`);
        window.location.href = '/dashboard.html';
        return false;
    }
    return true;
}

// Initialize API when available
if (typeof window !== 'undefined') {
    // Check if api.js has loaded
    const checkAPI = setInterval(() => {
        if (window.usersAPI) {
            usersAPI = window.usersAPI;
            clearInterval(checkAPI);
            // Refresh current user from API (but don't clear cache if it fails)
            getCurrentUserAsync().catch(error => {
                // Silently fail - don't clear existing cache
                console.log('Background user refresh failed, keeping existing cache:', error.message);
            });
        }
    }, 100);
    
    // Stop checking after 5 seconds
    setTimeout(() => clearInterval(checkAPI), 5000);
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.getCurrentUser = getCurrentUser;
    window.getCurrentUserAsync = getCurrentUserAsync;
    window.isAuthenticated = isAuthenticated;
    window.login = login;
    window.register = register;
    window.logout = logout;
    window.getAllUsers = getAllUsers;
    window.getUserById = getUserById;
    window.getUserByEmail = getUserByEmail;
    window.getStorageSource = getStorageSource;
    window.getStorageSourceAsync = getStorageSourceAsync;
    window.requireAuth = requireAuth;
    window.requireRole = requireRole;
}
