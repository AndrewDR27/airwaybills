// Authentication system with role-based access
// Uses Upstash Redis database via API
// localStorage fallback allowed on localhost for development

// Import usersAPI (will be loaded as module or available globally)
let usersAPI = null;

// Check if running on localhost (for development)
function isLocalhost() {
    if (typeof window === 'undefined') return false;
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
}

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
    // Check cache first
    if (currentUserCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
        return currentUserCache;
    }
    
    // Try localStorage as fallback (always try on localhost, or if no API available)
    const shouldUseLocalStorage = isLocalhost() || !usersAPI;
    if (shouldUseLocalStorage) {
        try {
            const authData = localStorage.getItem('awb_auth');
            if (authData) {
                const auth = JSON.parse(authData);
                if (auth.isAuthenticated && auth.userId) {
                    const users = JSON.parse(localStorage.getItem('awb_users') || '[]');
                    const user = users.find(u => u.id === auth.userId);
                    if (user) {
                        currentUserCache = user;
                        cacheTimestamp = Date.now();
                        console.log('getCurrentUser: Found user in localStorage', user.email);
                        return user;
                    } else {
                        console.log('getCurrentUser: User ID', auth.userId, 'not found in users array. Available IDs:', users.map(u => u.id));
                    }
                } else {
                    console.log('getCurrentUser: Auth data invalid or missing userId', auth);
                }
            } else {
                console.log('getCurrentUser: No auth data in localStorage');
            }
        } catch (e) {
            console.error('Error getting current user from cache:', e);
        }
    }
    
    return null;
}

// Get current user from API (async) - requires API, fallback on localhost
async function getCurrentUserAsync() {
    if (!usersAPI) {
        // Always fallback to localStorage if API not available (for localhost development)
        console.log('📦 API not available: Using localStorage fallback');
        const user = getCurrentUser();
        if (user) {
            return user;
        }
        // If still not found and on localhost, that's okay - return null
        if (isLocalhost()) {
            return null;
        }
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
            // API returned null - preserve existing cache if available
            console.log('API returned null user, preserving existing cache if available');
            if (currentUserCache) {
                return currentUserCache;
            }
            // Try localStorage fallback on localhost
            if (isLocalhost()) {
                return getCurrentUser();
            }
            return null;
        }
    } catch (error) {
        console.error('Error fetching current user from API:', error);
        if (isLocalhost()) {
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
    if (isLocalhost()) {
        return 'localhost';
    }
    return null; // No fallback in production
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
        if (isLocalhost()) {
            return 'localhost';
        }
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
        if (isLocalhost()) {
            console.log('📦 Localhost: Falling back to localStorage');
            return 'localhost';
        }
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
        if (isLocalhost()) {
            console.log('📦 Localhost: Using localStorage login');
            return loginLocalStorage(email, password);
        }
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
        if (isLocalhost()) {
            console.log('📦 Localhost: Falling back to localStorage login');
            return loginLocalStorage(email, password);
        }
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
    if (!usersAPI) {
        if (isLocalhost()) {
            return registerLocalStorage(userData);
        }
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
        if (isLocalhost()) {
            return registerLocalStorage(userData);
        }
        return { 
            success: false, 
            message: error.message || 'Registration failed. Please check your connection and try again.' 
        };
    }
}

// Login using localStorage (fallback - only on localhost)
function loginLocalStorage(email, password) {
    const users = getAllUsersLocalStorage();
    const user = users.find(u => u.email === email && u.isActive !== false);
    
    if (!user) {
        return { success: false, message: 'Invalid email or password' };
    }
    
    // Check password
    const storedPassword = localStorage.getItem(`user_password_${user.id}`);
    if (storedPassword !== password) {
        return { success: false, message: 'Invalid email or password' };
    }
    
    // Set current user cache
    currentUserCache = user;
    cacheTimestamp = Date.now();
    
    // Store auth data in localStorage
    try {
        localStorage.setItem('awb_auth', JSON.stringify({
            isAuthenticated: true,
            userId: user.id,
            email: user.email,
            role: user.role
        }));
    } catch (e) {
        console.warn('Could not store auth data:', e);
    }
    
    return { 
        success: true, 
        user: user,
        message: 'Login successful'
    };
}

// Register using localStorage (fallback - only on localhost)
function registerLocalStorage(userData) {
    const users = getAllUsersLocalStorage();
    
    if (users.some(u => u.email === userData.email)) {
        return { success: false, message: 'Email already registered' };
    }
    
    const User = window.User || (typeof require !== 'undefined' ? require('../models/user.js') : null);
    let newUser;
    
    if (!User) {
        newUser = {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            email: userData.email,
            name: userData.name,
            role: userData.role,
            company: userData.company || '',
            createdAt: new Date().toISOString(),
            isActive: true
        };
    } else {
        newUser = new User(userData);
    }
    
    users.push(newUser);
    localStorage.setItem('awb_users', JSON.stringify(users));
    
    if (userData.password) {
        localStorage.setItem(`user_password_${newUser.id}`, userData.password);
    }
    
    loginLocalStorage(userData.email, userData.password);
    
    return { success: true, user: newUser };
}

// Logout
async function logout() {
    if (usersAPI) {
        try {
            // Get session token before clearing auth
            const authData = JSON.parse(localStorage.getItem('awb_auth') || '{}');
            const sessionToken = authData.sessionToken;
            
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
    
    // Clear cache
    currentUserCache = null;
    cacheTimestamp = 0;
    
    // Clear all auth-related localStorage items
    localStorage.removeItem('awb_auth');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    
    // Also remove current user from awb_users array to prevent getCurrentUser() from finding them
    try {
        const authData = JSON.parse(localStorage.getItem('awb_auth') || '{}');
        const userId = authData.userId;
        if (userId) {
            const users = JSON.parse(localStorage.getItem('awb_users') || '[]');
            // Don't remove the user from the array (for caching), but ensure auth is cleared
            // The getCurrentUser() function checks auth.isAuthenticated, so this should be enough
        }
    } catch (e) {
        // Ignore errors
    }
    
    // Ensure awb_auth is definitely removed (in case of any race conditions)
    localStorage.removeItem('awb_auth');
    
    // Redirect to login
    window.location.href = 'login.html';
}

// Get all users (for admin/invitation purposes) - requires API, fallback on localhost
async function getAllUsers() {
    if (!usersAPI) {
        if (isLocalhost()) {
            return getAllUsersLocalStorage();
        }
        throw new Error('Database API not available. Please ensure the database is configured.');
    }
    
    try {
        const users = await usersAPI.getAll();
        return users;
    } catch (error) {
        console.error('Error fetching users from API:', error);
        if (isLocalhost()) {
            return getAllUsersLocalStorage();
        }
        throw error;
    }
}

// Get all users from localStorage (fallback - only on localhost)
function getAllUsersLocalStorage() {
    const usersData = localStorage.getItem('awb_users');
    if (!usersData) {
        const defaultUsers = [
            {
                id: 'admin1',
                email: 'admin@example.com',
                name: 'Admin User',
                role: 'issuing-carrier-agent',
                company: 'ABC Logistics',
                createdAt: new Date().toISOString(),
                isActive: true
            }
        ];
        localStorage.setItem('awb_users', JSON.stringify(defaultUsers));
        localStorage.setItem('user_password_admin1', 'admin123');
        return defaultUsers;
    }
    
    try {
        return JSON.parse(usersData);
    } catch (e) {
        console.error('Error parsing users:', e);
        return [];
    }
}

// Get user by ID - requires API, fallback on localhost
async function getUserById(userId) {
    if (!usersAPI) {
        if (isLocalhost()) {
            const users = getAllUsersLocalStorage();
            return users.find(u => u.id === userId);
        }
        throw new Error('Database API not available. Please ensure the database is configured.');
    }
    
    try {
        return await usersAPI.getById(userId);
    } catch (error) {
        console.error('Error fetching user from API:', error);
        if (isLocalhost()) {
            const users = getAllUsersLocalStorage();
            return users.find(u => u.id === userId);
        }
        throw error;
    }
}

// Get user by email - requires API, fallback on localhost
async function getUserByEmail(email) {
    if (!usersAPI) {
        if (isLocalhost()) {
            const users = getAllUsersLocalStorage();
            return users.find(u => u.email === email);
        }
        throw new Error('Database API not available. Please ensure the database is configured.');
    }
    
    try {
        return await usersAPI.getByEmail(email);
    } catch (error) {
        console.error('Error fetching user from API:', error);
        if (isLocalhost()) {
            const users = getAllUsersLocalStorage();
            return users.find(u => u.email === email);
        }
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
