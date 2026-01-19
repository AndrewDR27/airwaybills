// Authentication system with role-based access
// Uses Upstash Redis database via API

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

// Get current user (synchronous - uses cache)
function getCurrentUser() {
    // Check cache first
    if (currentUserCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
        return currentUserCache;
    }
    
    // Try localStorage as fallback
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
    
    return null;
}

// Get current user from API (async)
async function getCurrentUserAsync() {
    if (!usersAPI) {
        // Fallback to localStorage
        console.log('📦 Storage: Using localStorage (localhost)');
        return getCurrentUser();
    }
    
    try {
        const user = await usersAPI.getCurrent();
        if (user) {
            console.log('💾 Storage: Using database (Upstash Redis)');
            currentUserCache = user;
            cacheTimestamp = Date.now();
            // Update localStorage cache
            try {
                localStorage.setItem('awb_auth', JSON.stringify({
                    isAuthenticated: true,
                    userId: user.id
                }));
                const users = JSON.parse(localStorage.getItem('awb_users') || '[]');
                const index = users.findIndex(u => u.id === user.id);
                if (index >= 0) {
                    users[index] = user;
                } else {
                    users.push(user);
                }
                localStorage.setItem('awb_users', JSON.stringify(users));
            } catch (e) {
                console.warn('Could not update localStorage cache:', e);
            }
        }
        return user;
    } catch (error) {
        console.error('Error fetching current user from API:', error);
        console.log('📦 Storage: Falling back to localStorage (localhost)');
        return getCurrentUser(); // Fallback to cache
    }
}

// Check which storage is being used
function getStorageSource() {
    if (usersAPI && typeof usersAPI.getAll === 'function') {
        // Try a quick API call to see if it works
        return 'database'; // Assume database if API is available
    }
    return 'localhost';
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
        console.log('usersAPI not available');
        return 'localhost';
    }
    
    try {
        // Try to fetch from API with a short timeout
        const testPromise = usersAPI.getAll();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 3000)
        );
        
        const result = await Promise.race([testPromise, timeoutPromise]);
        console.log('API test successful, using database');
        return 'database';
    } catch (error) {
        console.log('API test failed, using localhost:', error.message);
        return 'localhost';
    }
}

// Check if user is authenticated
function isAuthenticated() {
    const user = getCurrentUser();
    return user !== null;
}

// Login
async function login(email, password) {
    console.log('Login called with email:', email);
    
    // Always try API first if available
    if (usersAPI) {
        try {
            console.log('Attempting API login...');
            const result = await usersAPI.login(email, password);
            console.log('API login result:', result);
            
            if (result && result.success && result.user) {
                currentUserCache = result.user;
                cacheTimestamp = Date.now();
                // Update localStorage cache
                try {
                    localStorage.setItem('awb_auth', JSON.stringify({
                        isAuthenticated: true,
                        userId: result.user.id,
                        email: result.user.email,
                        role: result.user.role
                    }));
                    const users = JSON.parse(localStorage.getItem('awb_users') || '[]');
                    const index = users.findIndex(u => u.id === result.user.id);
                    if (index >= 0) {
                        users[index] = result.user;
                    } else {
                        users.push(result.user);
                    }
                    localStorage.setItem('awb_users', JSON.stringify(users));
                } catch (e) {
                    console.warn('Could not update localStorage cache:', e);
                }
                return result;
            } else {
                console.warn('API login returned unsuccessful result:', result);
                // Don't fallback - API said user not found/invalid
                return result || { success: false, message: 'Invalid email or password' };
            }
        } catch (error) {
            console.error('Error logging in via API:', error);
            // Only fallback if it's a network/API error, not a "user not found" error
            if (error.message && error.message.includes('Invalid email or password')) {
                return { success: false, message: error.message };
            }
            // For network errors, try localStorage fallback
            console.log('Falling back to localStorage login...');
            return loginLocalStorage(email, password);
        }
    } else {
        console.log('usersAPI not available, using localStorage login...');
        // Fallback to localStorage
        return loginLocalStorage(email, password);
    }
}

// Login using localStorage (fallback)
function loginLocalStorage(email, password) {
    console.log('loginLocalStorage called for:', email);
    const users = getAllUsersLocalStorage(); // Use synchronous version
    console.log('Found users in localStorage:', users ? users.length : 0);
    
    if (!Array.isArray(users)) {
        console.error('users is not an array:', typeof users, users);
        return { success: false, message: 'Error accessing user data' };
    }
    
    const user = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
        console.log('User not found in localStorage');
        return { success: false, message: 'User not found' };
    }
    
    console.log('Found user:', user.email, 'role:', user.role);
    const storedPassword = localStorage.getItem(`user_password_${user.id}`);
    if (storedPassword && storedPassword !== password) {
        console.log('Password mismatch');
        return { success: false, message: 'Invalid password' };
    }
    
    localStorage.setItem('awb_auth', JSON.stringify({
        isAuthenticated: true,
        userId: user.id,
        email: user.email,
        role: user.role,
        loginTime: new Date().toISOString()
    }));
    
    currentUserCache = user;
    cacheTimestamp = Date.now();
    
    console.log('LocalStorage login successful');
    return { success: true, user: user };
}

// Register new user
async function register(userData) {
    if (!usersAPI) {
        // Fallback to localStorage
        return registerLocalStorage(userData);
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
        // Fallback to localStorage
        return registerLocalStorage(userData);
    }
}

// Register using localStorage (fallback)
function registerLocalStorage(userData) {
    const users = getAllUsersLocalStorage(); // Use synchronous version
    
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
            await usersAPI.logout();
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

// Get all users (for admin/invitation purposes)
async function getAllUsers() {
    if (!usersAPI) {
        return getAllUsersLocalStorage();
    }
    
    try {
        const users = await usersAPI.getAll();
        // Update localStorage cache
        try {
            localStorage.setItem('awb_users', JSON.stringify(users));
        } catch (e) {
            console.warn('Could not update localStorage cache:', e);
        }
        return users;
    } catch (error) {
        console.error('Error fetching users from API:', error);
        return getAllUsersLocalStorage();
    }
}

// Get all users from localStorage (fallback)
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

// Get user by ID
async function getUserById(userId) {
    if (!usersAPI) {
        const users = getAllUsersLocalStorage();
        return users.find(u => u.id === userId);
    }
    
    try {
        return await usersAPI.getById(userId);
    } catch (error) {
        console.error('Error fetching user from API:', error);
        const users = getAllUsersLocalStorage();
        return users.find(u => u.id === userId);
    }
}

// Get user by email
async function getUserByEmail(email) {
    if (!usersAPI) {
        const users = getAllUsersLocalStorage();
        return users.find(u => u.email === email);
    }
    
    try {
        return await usersAPI.getByEmail(email);
    } catch (error) {
        console.error('Error fetching user from API:', error);
        const users = getAllUsersLocalStorage();
        return users.find(u => u.email === email);
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
