// Centralized environment detection and localStorage management
// Ensures localStorage is ONLY used on localhost, NEVER in production

/**
 * Check if running in production environment
 * @returns {boolean} true if production, false otherwise
 */
export function isProduction() {
    if (typeof window === 'undefined') return false;
    const origin = window.location.origin;
    const hostname = window.location.hostname;
    
    // Explicit production domain checks
    return origin.includes('vercel.app') ||
           origin.includes('netlify.app') ||
           origin.includes('github.io') ||
           hostname.includes('.vercel.app') ||
           hostname.includes('.netlify.app') ||
           hostname === 'airwaybills.vercel.app' ||
           // If not localhost and not empty, assume production
           (hostname !== 'localhost' && 
            hostname !== '127.0.0.1' && 
            hostname !== '0.0.0.0' &&
            hostname !== '');
}

/**
 * Check if running on localhost (for development)
 * @returns {boolean} true if localhost, false otherwise
 */
export function isLocalhost() {
    if (typeof window === 'undefined') return false;
    const hostname = window.location.hostname;
    return hostname === 'localhost' || 
           hostname === '127.0.0.1' || 
           hostname === '0.0.0.0' ||
           hostname === '';
}

/**
 * Check if localStorage can be used (ONLY on localhost, NEVER in production)
 * @returns {boolean} true if localStorage allowed, false otherwise
 */
export function canUseLocalStorage() {
    // NEVER allow localStorage in production
    if (isProduction()) {
        return false;
    }
    // Only allow on localhost
    return isLocalhost();
}

/**
 * Clear all localStorage data when accessing production
 * This prevents old localStorage data from interfering with database operations
 */
export function clearLocalStorageOnProduction() {
    if (isProduction()) {
        console.log('🧹 Production detected: Clearing localStorage data');
        
        // Clear all app-specific localStorage items
        const keysToRemove = [
            'awb_auth',
            'awb_users',
            'awb_shipments',
            'awb_contacts',
            'awb_airlines',
            'awb_destinations',
            'awb_terminals',
            'isAuthenticated',
            'username'
        ];
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        // Also clear any keys that start with our prefix
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('awb_') || 
                key.startsWith('user_password_') ||
                key.startsWith('session_')) {
                localStorage.removeItem(key);
            }
        });
        
        console.log('✅ localStorage cleared for production use');
    }
}

// Make functions available globally for non-module scripts
if (typeof window !== 'undefined') {
    window.isProduction = isProduction;
    window.isLocalhost = isLocalhost;
    window.canUseLocalStorage = canUseLocalStorage;
    window.clearLocalStorageOnProduction = clearLocalStorageOnProduction;
}
