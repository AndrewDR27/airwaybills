// API service for server-side data storage
// This abstracts the API calls so we can easily switch between localStorage and server-side storage

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
            // Fallback to localStorage
            return getAirlinesFromLocalStorage();
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
            const result = await response.json();
            // Also save to localStorage as backup
            saveAirlinesToLocalStorage([...getAirlinesFromLocalStorage(), result]);
            return result;
        } catch (error) {
            console.error('Error creating airline:', error);
            // Fallback to localStorage
            return createAirlineInLocalStorage(airline);
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
            const result = await response.json();
            // Also update localStorage
            updateAirlineInLocalStorage(result);
            return result;
        } catch (error) {
            console.error('Error updating airline:', error);
            // Fallback to localStorage
            return updateAirlineInLocalStorage(airline);
        }
    },

    async delete(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/airlines?id=${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete airline');
            // Also delete from localStorage
            deleteAirlineFromLocalStorage(id);
            return { success: true };
        } catch (error) {
            console.error('Error deleting airline:', error);
            // Fallback to localStorage
            return deleteAirlineFromLocalStorage(id);
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
            return getDestinationsFromLocalStorage();
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
            const result = await response.json();
            saveDestinationsToLocalStorage([...getDestinationsFromLocalStorage(), result]);
            return result;
        } catch (error) {
            console.error('Error creating destination:', error);
            return createDestinationInLocalStorage(destination);
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
            const result = await response.json();
            updateDestinationInLocalStorage(result);
            return result;
        } catch (error) {
            console.error('Error updating destination:', error);
            return updateDestinationInLocalStorage(destination);
        }
    },

    async delete(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/destinations?id=${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete destination');
            deleteDestinationFromLocalStorage(id);
            return { success: true };
        } catch (error) {
            console.error('Error deleting destination:', error);
            return deleteDestinationFromLocalStorage(id);
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
            return getTerminalsFromLocalStorage();
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
            const result = await response.json();
            saveTerminalsToLocalStorage([...getTerminalsFromLocalStorage(), result]);
            return result;
        } catch (error) {
            console.error('Error creating terminal:', error);
            return createTerminalInLocalStorage(terminal);
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
            const result = await response.json();
            updateTerminalInLocalStorage(result);
            return result;
        } catch (error) {
            console.error('Error updating terminal:', error);
            return updateTerminalInLocalStorage(terminal);
        }
    },

    async delete(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/terminals?id=${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete terminal');
            deleteTerminalFromLocalStorage(id);
            return { success: true };
        } catch (error) {
            console.error('Error deleting terminal:', error);
            return deleteTerminalFromLocalStorage(id);
        }
    }
};

// LocalStorage fallback functions
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

// Users API
export const usersAPI = {
    async getAll() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users?action=all`);
            if (!response.ok) throw new Error('Failed to fetch users');
            return await response.json();
        } catch (error) {
            console.error('Error fetching users:', error);
            return getUsersFromLocalStorage();
        }
    },

    async getCurrent() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users?action=current`);
            if (!response.ok) throw new Error('Failed to fetch current user');
            return await response.json();
        } catch (error) {
            console.error('Error fetching current user:', error);
            return getCurrentUserFromLocalStorage();
        }
    },

    async getById(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users?userId=${userId}`);
            if (!response.ok) throw new Error('Failed to fetch user');
            return await response.json();
        } catch (error) {
            console.error('Error fetching user:', error);
            return getUsersFromLocalStorage().find(u => u.id === userId);
        }
    },

    async getByEmail(email) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users?email=${encodeURIComponent(email)}`);
            if (!response.ok) throw new Error('Failed to fetch user');
            return await response.json();
        } catch (error) {
            console.error('Error fetching user:', error);
            return getUsersFromLocalStorage().find(u => u.email === email);
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
            await fetch(`${API_BASE_URL}/api/users?action=logout`, { method: 'POST' });
            logoutFromLocalStorage();
        } catch (error) {
            console.error('Error logging out:', error);
            logoutFromLocalStorage(); // Fallback to localStorage logout
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
            return updateUserInLocalStorage(user);
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
            return deleteUserFromLocalStorage(userId);
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
            return getShipmentsFromLocalStorage();
        }
    },

    async getByUser(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/shipments?action=user&userId=${userId}`);
            if (!response.ok) throw new Error('Failed to fetch user shipments');
            return await response.json();
        } catch (error) {
            console.error('Error fetching user shipments:', error);
            return getShipmentsFromLocalStorage().filter(s => 
                s.createdBy === userId || s.participants?.some(p => p.userId === userId)
            );
        }
    },

    async getBySpaceId(spaceId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/shipments?spaceId=${spaceId}`);
            if (!response.ok) throw new Error('Failed to fetch shipment');
            return await response.json();
        } catch (error) {
            console.error('Error fetching shipment:', error);
            return getShipmentsFromLocalStorage().find(s => s.spaceId === spaceId);
        }
    },

    async getByAWB(awbNumber) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/shipments?awbNumber=${awbNumber}`);
            if (!response.ok) throw new Error('Failed to fetch shipment');
            return await response.json();
        } catch (error) {
            console.error('Error fetching shipment:', error);
            return getShipmentsFromLocalStorage().find(s => s.awbNumber === awbNumber);
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
            const result = await response.json();
            saveShipmentToLocalStorage(result);
            return result;
        } catch (error) {
            console.error('Error creating shipment:', error);
            return createShipmentInLocalStorage(shipment);
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
            const result = await response.json();
            updateShipmentInLocalStorage(result);
            return result;
        } catch (error) {
            console.error('Error updating shipment:', error);
            return updateShipmentInLocalStorage(shipment);
        }
    },

    async delete(spaceId, userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/shipments?spaceId=${spaceId}&userId=${userId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete shipment');
            deleteShipmentFromLocalStorage(spaceId);
            return { success: true };
        } catch (error) {
            console.error('Error deleting shipment:', error);
            return deleteShipmentFromLocalStorage(spaceId);
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
            return getContactsFromLocalStorage(type);
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
            const result = await response.json();
            saveContactToLocalStorage(result);
            return result;
        } catch (error) {
            console.error('Error creating contact:', error);
            return createContactInLocalStorage(contact);
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
            const result = await response.json();
            updateContactInLocalStorage(result);
            return result;
        } catch (error) {
            console.error('Error updating contact:', error);
            return updateContactInLocalStorage(contact);
        }
    },

    async delete(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/contacts?id=${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete contact');
            deleteContactFromLocalStorage(id);
            return { success: true };
        } catch (error) {
            console.error('Error deleting contact:', error);
            return deleteContactFromLocalStorage(id);
        }
    }
};

// LocalStorage fallback functions for Users
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

function logoutFromLocalStorage() {
    localStorage.removeItem('awb_auth');
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

// LocalStorage fallback functions for Shipments
function getShipmentsFromLocalStorage() {
    try {
        return JSON.parse(localStorage.getItem('awb_shipments') || '[]');
    } catch {
        return [];
    }
}

function saveShipmentToLocalStorage(shipment) {
    const shipments = getShipmentsFromLocalStorage();
    shipments.push(shipment);
    localStorage.setItem('awb_shipments', JSON.stringify(shipments));
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

// LocalStorage fallback functions for Contacts
function getContactsFromLocalStorage(type = null) {
    try {
        const contacts = JSON.parse(localStorage.getItem('awbContacts') || '[]');
        return type ? contacts.filter(c => c.type === type) : contacts;
    } catch {
        return [];
    }
}

function saveContactToLocalStorage(contact) {
    const contacts = getContactsFromLocalStorage();
    contacts.push(contact);
    localStorage.setItem('awbContacts', JSON.stringify(contacts));
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
