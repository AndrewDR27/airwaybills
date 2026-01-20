// API service for server-side data storage
// Database required in production, localStorage fallback allowed on localhost for development

const API_BASE_URL = window.location.origin;

// Check if running on localhost (for development)
function isLocalhost() {
    if (typeof window === 'undefined') return false;
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
}

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
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return getAirlinesFromLocalStorage();
            }
            throw error; // Require database in production
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
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return createAirlineInLocalStorage(airline);
            }
            throw error; // Require database in production
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
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return updateAirlineInLocalStorage(airline);
            }
            throw error; // Require database in production
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
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return deleteAirlineFromLocalStorage(id);
            }
            throw error; // Require database in production
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
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return getDestinationsFromLocalStorage();
            }
            throw error; // Require database in production
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
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return createDestinationInLocalStorage(destination);
            }
            throw error; // Require database in production
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
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return updateDestinationInLocalStorage(destination);
            }
            throw error; // Require database in production
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
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return deleteDestinationFromLocalStorage(id);
            }
            throw error; // Require database in production
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
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return getTerminalsFromLocalStorage();
            }
            throw error; // Require database in production
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
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return createTerminalInLocalStorage(terminal);
            }
            throw error; // Require database in production
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
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return updateTerminalInLocalStorage(terminal);
            }
            throw error; // Require database in production
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
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return deleteTerminalFromLocalStorage(id);
            }
            throw error; // Require database in production
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
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return getUsersFromLocalStorage();
            }
            throw error; // Require database in production
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
            if (!response.ok) throw new Error('Failed to fetch current user');
            return await response.json();
        } catch (error) {
            console.error('Error fetching current user:', error);
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return getCurrentUserFromLocalStorage();
            }
            throw error; // Require database in production
        }
    },

    async getById(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users?userId=${userId}`);
            if (!response.ok) throw new Error('Failed to fetch user');
            return await response.json();
        } catch (error) {
            console.error('Error fetching user:', error);
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return getUsersFromLocalStorage().find(u => u.id === userId);
            }
            throw error; // Require database in production
        }
    },

    async getByEmail(email) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users?email=${encodeURIComponent(email)}`);
            if (!response.ok) throw new Error('Failed to fetch user');
            return await response.json();
        } catch (error) {
            console.error('Error fetching user:', error);
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return getUsersFromLocalStorage().find(u => u.email === email);
            }
            throw error; // Require database in production
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
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return updateUserInLocalStorage(user);
            }
            throw error; // Require database in production
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
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return deleteUserFromLocalStorage(userId);
            }
            throw error; // Require database in production
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
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return getShipmentsFromLocalStorage();
            }
            throw error; // Require database in production
        }
    },

    async getByUser(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/shipments?action=user&userId=${userId}`);
            if (!response.ok) throw new Error('Failed to fetch user shipments');
            return await response.json();
        } catch (error) {
            console.error('Error fetching user shipments:', error);
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return getShipmentsFromLocalStorage().filter(s => 
                    s.createdBy === userId || s.participants?.some(p => p.userId === userId)
                );
            }
            throw error; // Require database in production
        }
    },

    async getBySpaceId(spaceId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/shipments?spaceId=${spaceId}`);
            if (!response.ok) throw new Error('Failed to fetch shipment');
            return await response.json();
        } catch (error) {
            console.error('Error fetching shipment:', error);
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return getShipmentsFromLocalStorage().find(s => s.spaceId === spaceId);
            }
            throw error; // Require database in production
        }
    },

    async getByAWB(awbNumber) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/shipments?awbNumber=${awbNumber}`);
            if (!response.ok) throw new Error('Failed to fetch shipment');
            return await response.json();
        } catch (error) {
            console.error('Error fetching shipment:', error);
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return getShipmentsFromLocalStorage().find(s => s.awbNumber === awbNumber);
            }
            throw error; // Require database in production
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
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return createShipmentInLocalStorage(shipment);
            }
            throw error; // Require database in production
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
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return updateShipmentInLocalStorage(shipment);
            }
            throw error; // Require database in production
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
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return deleteShipmentFromLocalStorage(spaceId);
            }
            throw error; // Require database in production
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
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return getContactsFromLocalStorage(type);
            }
            throw error; // Require database in production
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
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return createContactInLocalStorage(contact);
            }
            throw error; // Require database in production
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
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return updateContactInLocalStorage(contact);
            }
            throw error; // Require database in production
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
            if (isLocalhost()) {
                console.log('📦 Localhost: Falling back to localStorage');
                return deleteContactFromLocalStorage(id);
            }
            throw error; // Require database in production
        }
    }
};

// LocalStorage fallback functions (only used on localhost for development)
function getAirlinesFromLocalStorage() {
    try {
        const contacts = JSON.parse(localStorage.getItem('awbContacts') || '[]');
        return contacts.filter(c => c.type === 'Airline');
    } catch {
        return [];
    }
}

function saveAirlinesToLocalStorage(airlines) {
    try {
        const contacts = JSON.parse(localStorage.getItem('awbContacts') || '[]');
        const otherContacts = contacts.filter(c => c.type !== 'Airline');
        localStorage.setItem('awbContacts', JSON.stringify([...otherContacts, ...airlines]));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function createAirlineInLocalStorage(airline) {
    const airlines = getAirlinesFromLocalStorage();
    const newAirline = { ...airline, id: airline.id || `airline_${Date.now()}` };
    airlines.push(newAirline);
    saveAirlinesToLocalStorage(airlines);
    return newAirline;
}

function updateAirlineInLocalStorage(airline) {
    const airlines = getAirlinesFromLocalStorage();
    const index = airlines.findIndex(a => a.id === airline.id);
    if (index >= 0) {
        airlines[index] = airline;
        saveAirlinesToLocalStorage(airlines);
    }
    return airline;
}

function deleteAirlineFromLocalStorage(id) {
    const airlines = getAirlinesFromLocalStorage();
    const filtered = airlines.filter(a => a.id !== id);
    saveAirlinesToLocalStorage(filtered);
    return { success: true };
}

function getDestinationsFromLocalStorage() {
    try {
        return JSON.parse(localStorage.getItem('awbDestinations') || '[]');
    } catch {
        return [];
    }
}

function saveDestinationsToLocalStorage(destinations) {
    try {
        localStorage.setItem('awbDestinations', JSON.stringify(destinations));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function createDestinationInLocalStorage(destination) {
    const destinations = getDestinationsFromLocalStorage();
    const newDest = { ...destination, id: destination.id || `dest_${Date.now()}` };
    destinations.push(newDest);
    saveDestinationsToLocalStorage(destinations);
    return newDest;
}

function updateDestinationInLocalStorage(destination) {
    const destinations = getDestinationsFromLocalStorage();
    const index = destinations.findIndex(d => d.id === destination.id);
    if (index >= 0) {
        destinations[index] = destination;
        saveDestinationsToLocalStorage(destinations);
    }
    return destination;
}

function deleteDestinationFromLocalStorage(id) {
    const destinations = getDestinationsFromLocalStorage();
    const filtered = destinations.filter(d => d.id !== id);
    saveDestinationsToLocalStorage(filtered);
    return { success: true };
}

function getTerminalsFromLocalStorage() {
    try {
        return JSON.parse(localStorage.getItem('awb_terminals') || '[]');
    } catch {
        return [];
    }
}

function saveTerminalsToLocalStorage(terminals) {
    try {
        localStorage.setItem('awb_terminals', JSON.stringify(terminals));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function createTerminalInLocalStorage(terminal) {
    const terminals = getTerminalsFromLocalStorage();
    const newTerminal = { ...terminal, id: terminal.id || `terminal_${Date.now()}` };
    terminals.push(newTerminal);
    saveTerminalsToLocalStorage(terminals);
    return newTerminal;
}

function updateTerminalInLocalStorage(terminal) {
    const terminals = getTerminalsFromLocalStorage();
    const index = terminals.findIndex(t => t.id === terminal.id);
    if (index >= 0) {
        terminals[index] = terminal;
        saveTerminalsToLocalStorage(terminals);
    }
    return terminal;
}

function deleteTerminalFromLocalStorage(id) {
    const terminals = getTerminalsFromLocalStorage();
    const filtered = terminals.filter(t => t.id !== id);
    saveTerminalsToLocalStorage(filtered);
    return { success: true };
}

function getUsersFromLocalStorage() {
    try {
        return JSON.parse(localStorage.getItem('awb_users') || '[]');
    } catch {
        return [];
    }
}

function getCurrentUserFromLocalStorage() {
    try {
        const authData = JSON.parse(localStorage.getItem('awb_auth') || '{}');
        if (!authData.userId) return null;
        const users = getUsersFromLocalStorage();
        return users.find(u => u.id === authData.userId) || null;
    } catch {
        return null;
    }
}

function updateUserInLocalStorage(user) {
    const users = getUsersFromLocalStorage();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
        users[index] = user;
        localStorage.setItem('awb_users', JSON.stringify(users));
    }
    return user;
}

function deleteUserFromLocalStorage(userId) {
    const users = getUsersFromLocalStorage();
    const filtered = users.filter(u => u.id !== userId);
    localStorage.setItem('awb_users', JSON.stringify(filtered));
    return { success: true };
}

function getShipmentsFromLocalStorage() {
    try {
        return JSON.parse(localStorage.getItem('awb_shipments') || '[]');
    } catch {
        return [];
    }
}

function createShipmentInLocalStorage(shipment) {
    const shipments = getShipmentsFromLocalStorage();
    shipments.push(shipment);
    localStorage.setItem('awb_shipments', JSON.stringify(shipments));
    return shipment;
}

function updateShipmentInLocalStorage(shipment) {
    const shipments = getShipmentsFromLocalStorage();
    const index = shipments.findIndex(s => s.spaceId === shipment.spaceId);
    if (index >= 0) {
        shipments[index] = shipment;
        localStorage.setItem('awb_shipments', JSON.stringify(shipments));
    }
    return shipment;
}

function deleteShipmentFromLocalStorage(spaceId) {
    const shipments = getShipmentsFromLocalStorage();
    const filtered = shipments.filter(s => s.spaceId !== spaceId);
    localStorage.setItem('awb_shipments', JSON.stringify(filtered));
    return { success: true };
}

function getContactsFromLocalStorage(type = null) {
    try {
        const contacts = JSON.parse(localStorage.getItem('awbContacts') || '[]');
        return type ? contacts.filter(c => c.type === type) : contacts;
    } catch {
        return [];
    }
}

function createContactInLocalStorage(contact) {
    const contacts = getContactsFromLocalStorage();
    contacts.push(contact);
    localStorage.setItem('awbContacts', JSON.stringify(contacts));
    return contact;
}

function updateContactInLocalStorage(contact) {
    const contacts = getContactsFromLocalStorage();
    const index = contacts.findIndex(c => c.id === contact.id);
    if (index >= 0) {
        contacts[index] = contact;
        localStorage.setItem('awbContacts', JSON.stringify(contacts));
    }
    return contact;
}

function deleteContactFromLocalStorage(id) {
    const contacts = getContactsFromLocalStorage();
    const filtered = contacts.filter(c => c.id !== id);
    localStorage.setItem('awbContacts', JSON.stringify(filtered));
    return { success: true };
}

// Expose APIs globally for non-module scripts (after all APIs are defined)
if (typeof window !== 'undefined') {
    window.usersAPI = usersAPI;
    window.shipmentsAPI = shipmentsAPI;
    window.contactsAPI = contactsAPI;
    window.airlinesAPI = airlinesAPI;
    window.destinationsAPI = destinationsAPI;
    window.terminalsAPI = terminalsAPI;
    
    // Dispatch event when APIs are ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.dispatchEvent(new Event('apiReady'));
        });
    } else {
        window.dispatchEvent(new Event('apiReady'));
    }
}
