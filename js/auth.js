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
    
    // Try localStorage as fallback (only on localhost)
    if (isLocalhost()) {
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
                        return user;
                    }
                }
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
        if (isLocalhost()) {
            console.log('📦 Localhost: Using localStorage (development)');
            return getCurrentUser();
        }
        throw new Error('Database API not available. Please ensure the database is configured.');
    }
    
    try {
        const user = await usersAPI.getCurrent();
        if (user) {
            console.log('💾 Storage: Using database (Upstash Redis)');
            currentUserCache = user;
            cacheTimestamp = Date.now();
            // Store session token in localStorage (for API requests only, not as data source)
            try {
                const existingAuth = JSON.parse(localStorage.getItem('awb_auth') || '{}');
                localStorage.setItem('awb_auth', JSON.stringify({
                    isAuthenticated: true,
                    userId: user.id,
                    sessionToken: existingAuth.sessionToken || null // Preserve session token
                }));
            } catch (e) {
                console.warn('Could not update localStorage session token:', e);
            }
        }
        return user;
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
            // Store session token in localStorage (for API requests only)
            try {
                localStorage.setItem('awb_auth', JSON.stringify({
                    isAuthenticated: true,
                    userId: result.user.id,
                    email: result.user.email,
                    role: result.user.role,
                    sessionToken: result.sessionToken || null // Store session token
                }));
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
    localStorage.removeItem('awb_auth');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    
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
            // Refresh current user from API
            getCurrentUserAsync();
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
