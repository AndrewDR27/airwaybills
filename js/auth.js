// Authentication system with role-based access
// Uses localStorage for now (can be swapped for backend API later)

const AUTH_STORAGE_KEY = 'awb_auth';
const USERS_STORAGE_KEY = 'awb_users';

// Get current user
function getCurrentUser() {
    const authData = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!authData) return null;
    
    try {
        const auth = JSON.parse(authData);
        if (!auth.isAuthenticated || !auth.userId) return null;
        
        // Get user from users storage
        const users = getAllUsers();
        return users.find(u => u.id === auth.userId) || null;
    } catch (e) {
        console.error('Error getting current user:', e);
        return null;
    }
}

// Check if user is authenticated
function isAuthenticated() {
    const user = getCurrentUser();
    return user !== null;
}

// Login
function login(email, password) {
    const users = getAllUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
        return { success: false, message: 'User not found' };
    }
    
    // For now, simple password check (in production, use hashed passwords)
    // Using email as password for demo (replace with proper auth)
    const storedPassword = localStorage.getItem(`user_password_${user.id}`);
    if (storedPassword && storedPassword !== password) {
        return { success: false, message: 'Invalid password' };
    }
    
    // Set authentication
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        isAuthenticated: true,
        userId: user.id,
        loginTime: new Date().toISOString()
    }));
    
    return { success: true, user: user };
}

// Register new user
function register(userData) {
    const users = getAllUsers();
    
    // Check if email already exists
    if (users.some(u => u.email === userData.email)) {
        return { success: false, message: 'Email already registered' };
    }
    
    // Create new user
    const User = window.User || (typeof require !== 'undefined' ? require('../models/user.js') : null);
    if (!User) {
        // Fallback if User class not loaded
        const newUser = {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            email: userData.email,
            name: userData.name,
            role: userData.role,
            company: userData.company || '',
            createdAt: new Date().toISOString(),
            isActive: true
        };
        users.push(newUser);
    } else {
        const newUser = new User(userData);
        users.push(newUser);
    }
    
    // Save users
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    
    // Store password (in production, hash this!)
    if (userData.password) {
        localStorage.setItem(`user_password_${users[users.length - 1].id}`, userData.password);
    }
    
    // Auto-login after registration
    const registeredUser = users[users.length - 1];
    login(userData.email, userData.password);
    
    return { success: true, user: registeredUser };
}

// Logout
function logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    // Also remove old auth keys for backward compatibility
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    // Redirect to login
    window.location.href = 'login.html';
}

// Get all users (for admin/invitation purposes)
function getAllUsers() {
    const usersData = localStorage.getItem(USERS_STORAGE_KEY);
    if (!usersData) {
        // Initialize with default users for demo
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
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
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
function getUserById(userId) {
    const users = getAllUsers();
    return users.find(u => u.id === userId);
}

// Get user by email
function getUserByEmail(email) {
    const users = getAllUsers();
    return users.find(u => u.email === email);
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

// Export for use in other files
if (typeof window !== 'undefined') {
    window.getCurrentUser = getCurrentUser;
    window.isAuthenticated = isAuthenticated;
    window.login = login;
    window.register = register;
    window.logout = logout;
    window.getAllUsers = getAllUsers;
    window.getUserById = getUserById;
    window.getUserByEmail = getUserByEmail;
    window.requireAuth = requireAuth;
    window.requireRole = requireRole;
}
