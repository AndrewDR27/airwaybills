// API service for server-side data storage
// Database required everywhere (localhost and production)

const API_BASE_URL = window.location.origin;

// Note: APIs are exported below and will be exposed to window at the end of the file

// Airlines API
export const airlinesAPI = {
    async getAll() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/airlines`);
            if (!response.ok) throw new Error('Failed to fetch airlines');
            return await response.json();
        } catch (error) {
            console.error('Error fetching airlines:', error);
            throw error; // Database required
        }
    },

    async create(airline) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/airlines`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(airline)
            });
            if (!response.ok) throw new Error('Failed to create airline');
            return await response.json();
        } catch (error) {
            console.error('Error creating airline:', error);
            throw error; // Database required
        }
    },

    async update(airline) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/airlines`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(airline)
            });
            if (!response.ok) throw new Error('Failed to update airline');
            return await response.json();
        } catch (error) {
            console.error('Error updating airline:', error);
            throw error; // Database required
        }
    },

    async delete(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/airlines?id=${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete airline');
            return { success: true };
        } catch (error) {
            console.error('Error deleting airline:', error);
            throw error; // Database required
        }
    }
};

// Destinations API
export const destinationsAPI = {
    async getAll() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/destinations`);
            if (!response.ok) throw new Error('Failed to fetch destinations');
            return await response.json();
        } catch (error) {
            console.error('Error fetching destinations:', error);
            // Database required - no localStorage fallback
            throw error;
        }
    },

    async create(destination) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/destinations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(destination)
            });
            if (!response.ok) throw new Error('Failed to create destination');
            return await response.json();
        } catch (error) {
            console.error('Error creating destination:', error);
            // Database required - no localStorage fallback
            throw error;
        }
    },

    async update(destination) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/destinations`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(destination)
            });
            if (!response.ok) throw new Error('Failed to update destination');
            return await response.json();
        } catch (error) {
            console.error('Error updating destination:', error);
            // Database required - no localStorage fallback
            throw error;
        }
    },

    async delete(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/destinations?id=${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete destination');
            return { success: true };
        } catch (error) {
            console.error('Error deleting destination:', error);
            // Database required - no localStorage fallback
            throw error;
        }
    }
};

// Terminals API
export const terminalsAPI = {
    async getAll() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/terminals`);
            if (!response.ok) throw new Error('Failed to fetch terminals');
            return await response.json();
        } catch (error) {
            console.error('Error fetching terminals:', error);
            // Database required - no localStorage fallback
            throw error;
        }
    },

    async create(terminal) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/terminals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(terminal)
            });
            if (!response.ok) throw new Error('Failed to create terminal');
            return await response.json();
        } catch (error) {
            console.error('Error creating terminal:', error);
            // Database required - no localStorage fallback
            throw error;
        }
    },

    async update(terminal) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/terminals`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(terminal)
            });
            if (!response.ok) throw new Error('Failed to update terminal');
            return await response.json();
        } catch (error) {
            console.error('Error updating terminal:', error);
            // Database required - no localStorage fallback
            throw error;
        }
    },

    async delete(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/terminals?id=${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete terminal');
            return { success: true };
        } catch (error) {
            console.error('Error deleting terminal:', error);
            // Database required - no localStorage fallback
            throw error;
        }
    }
};

// Users API
export const usersAPI = {
    async getAll() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users?action=all`);
            if (!response.ok) throw new Error('Failed to fetch users');
            return await response.json();
        } catch (error) {
            console.error('Error fetching users:', error);
            // Database required - no localStorage fallback
            throw error;
        }
    },

    async getCurrent() {
        try {
            // Get session token from localStorage (for API request only, not as data source)
            const authData = JSON.parse(localStorage.getItem('awb_auth') || '{}');
            const sessionToken = authData.sessionToken;
            
            // Build URL with session token
            const url = sessionToken 
                ? `${API_BASE_URL}/api/users?action=current&sessionToken=${encodeURIComponent(sessionToken)}`
                : `${API_BASE_URL}/api/users?action=current`;
            
            const response = await fetch(url);
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Failed to fetch current user (${response.status})`;
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.error || errorJson.message) {
                        errorMessage = errorJson.error || errorJson.message;
                    }
                } catch (e) {
                    // Not JSON, use text as is
                    if (errorText) {
                        errorMessage = errorText;
                    }
                }
                const error = new Error(errorMessage);
                error.status = response.status;
                throw error;
            }
            const userData = await response.json();
            return userData;
        } catch (error) {
            console.error('Error fetching current user:', error);
            // Database required - no localStorage fallback
            throw error;
        }
    },

    async getById(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users?userId=${userId}`);
            if (!response.ok) throw new Error('Failed to fetch user');
            return await response.json();
        } catch (error) {
            console.error('Error fetching user:', error);
            // Database required - no localStorage fallback
            throw error;
        }
    },

    async getByEmail(email) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users?email=${encodeURIComponent(email)}`);
            if (!response.ok) throw new Error('Failed to fetch user');
            return await response.json();
        } catch (error) {
            console.error('Error fetching user:', error);
            // Database required - no localStorage fallback
            throw error;
        }
    },

    async register(userData) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users?action=register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to register user');
            }
            return await response.json();
        } catch (error) {
            console.error('Error registering user:', error);
            throw error; // Don't fallback - registration should fail if API is down
        }
    },

    async login(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users?action=login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Login failed');
            }
            return await response.json();
        } catch (error) {
            console.error('Error logging in:', error);
            throw error; // Don't fallback - login should fail if API is down
        }
    },

    async logout() {
        try {
            // Get session token before clearing
            const authData = JSON.parse(localStorage.getItem('awb_auth') || '{}');
            const sessionToken = authData.sessionToken;
            
            if (sessionToken) {
                await fetch(`${API_BASE_URL}/api/users?action=logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionToken })
                });
            } else {
                await fetch(`${API_BASE_URL}/api/users?action=logout`, { method: 'POST' });
            }
        } catch (error) {
            console.error('Error logging out:', error);
            // Still clear local session token even if API call fails
        } finally {
            // Clear local session token
            localStorage.removeItem('awb_auth');
        }
    },

    async update(user) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });
            if (!response.ok) throw new Error('Failed to update user');
            return await response.json();
        } catch (error) {
            console.error('Error updating user:', error);
            // Database required - no localStorage fallback
            throw error;
        }
    },

    async delete(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users?userId=${userId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete user');
            return { success: true };
        } catch (error) {
            console.error('Error deleting user:', error);
            // Database required - no localStorage fallback
            throw error;
        }
    }
};

// Shipments API
export const shipmentsAPI = {
    async getAll() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/shipments?action=all`);
            if (!response.ok) throw new Error('Failed to fetch shipments');
            return await response.json();
        } catch (error) {
            console.error('Error fetching shipments:', error);
            // Database required - no localStorage fallback
            throw error;
        }
    },

    async getByUser(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/shipments?action=user&userId=${userId}`);
            if (!response.ok) throw new Error('Failed to fetch user shipments');
            return await response.json();
        } catch (error) {
            console.error('Error fetching user shipments:', error);
            // Database required - no localStorage fallback
            throw error;
        }
    },

    async getBySpaceId(spaceId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/shipments?spaceId=${spaceId}`);
            if (!response.ok) throw new Error('Failed to fetch shipment');
            return await response.json();
        } catch (error) {
            console.error('Error fetching shipment:', error);
            // Database required - no localStorage fallback
            throw error;
        }
    },

    async getByAWB(awbNumber) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/shipments?awbNumber=${awbNumber}`);
            if (!response.ok) throw new Error('Failed to fetch shipment');
            return await response.json();
        } catch (error) {
            console.error('Error fetching shipment:', error);
            // Database required - no localStorage fallback
            throw error;
        }
    },

    async create(shipment) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/shipments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(shipment)
            });
            if (!response.ok) throw new Error('Failed to create shipment');
            return await response.json();
        } catch (error) {
            console.error('Error creating shipment:', error);
            // Database required - no localStorage fallback
            throw error;
        }
    },

    async update(shipment) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/shipments`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(shipment)
            });
            if (!response.ok) throw new Error('Failed to update shipment');
            return await response.json();
        } catch (error) {
            console.error('Error updating shipment:', error);
            // Database required - no localStorage fallback
            throw error;
        }
    },

    async delete(spaceId, userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/shipments?spaceId=${spaceId}&userId=${userId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete shipment');
            return { success: true };
        } catch (error) {
            console.error('Error deleting shipment:', error);
            // Database required - no localStorage fallback
            throw error;
        }
    }
};

// Contacts API
export const contactsAPI = {
    async getAll(type = null) {
        try {
            const url = type 
                ? `${API_BASE_URL}/api/contacts?type=${type}`
                : `${API_BASE_URL}/api/contacts`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch contacts');
            return await response.json();
        } catch (error) {
            console.error('Error fetching contacts:', error);
            // Database required - no localStorage fallback
            throw error;
        }
    },

    async create(contact) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/contacts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contact)
            });
            if (!response.ok) throw new Error('Failed to create contact');
            return await response.json();
        } catch (error) {
            console.error('Error creating contact:', error);
            // Database required - no localStorage fallback
            throw error;
        }
    },

    async update(contact) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/contacts`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contact)
            });
            if (!response.ok) throw new Error('Failed to update contact');
            return await response.json();
        } catch (error) {
            console.error('Error updating contact:', error);
            // Database required - no localStorage fallback
            throw error;
        }
    },

    async delete(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/contacts?id=${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete contact');
            return { success: true };
        } catch (error) {
            console.error('Error deleting contact:', error);
            // Database required - no localStorage fallback
            throw error;
        }
    }
};

// Note: localStorage is still used for session tokens (awb_auth) for authentication
// but NOT as a data source - all data comes from the database

// Expose APIs globally for non-module scripts (after all APIs are defined)
if (typeof window !== 'undefined') {
    console.log('🔧 api.js: Exposing APIs to window object');
    window.usersAPI = usersAPI;
    window.shipmentsAPI = shipmentsAPI;
    window.contactsAPI = contactsAPI;
    window.airlinesAPI = airlinesAPI;
    window.destinationsAPI = destinationsAPI;
    window.terminalsAPI = terminalsAPI;
    
    console.log('🔧 api.js: APIs exposed. usersAPI available:', !!window.usersAPI);
    
    // Dispatch event when APIs are ready
    const dispatchReady = () => {
        console.log('🔧 api.js: Dispatching apiReady event');
        window.dispatchEvent(new Event('apiReady'));
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', dispatchReady);
    } else {
        dispatchReady();
    }
} else {
    console.error('❌ api.js: window is undefined - cannot expose APIs');
}
