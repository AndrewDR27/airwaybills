require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Data storage for localhost (using JSON files)
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper functions for localhost data storage
function readDataFile(key) {
    const filePath = path.join(DATA_DIR, `${key}.json`);
    if (!fs.existsSync(filePath)) {
        return [];
    }
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${key}:`, error);
        return [];
    }
}

function writeDataFile(key, data) {
    const filePath = path.join(DATA_DIR, `${key}.json`);
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`Error writing ${key}:`, error);
        return false;
    }
}

// CORS middleware
app.use('/api', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    next();
});

// Users API
app.get('/api/users', async (req, res) => {
    try {
        const { action, userId, email } = req.query;
        const users = readDataFile('users');
        const auth = readDataFile('auth')[0] || null;

        if (action === 'all') {
            const safeUsers = users.map(u => {
                const { password, ...safeUser } = u;
                return safeUser;
            });
            res.json(safeUsers);
        } else if (action === 'current') {
            if (!auth || !auth.userId) {
                res.json(null);
                return;
            }
            const user = users.find(u => u.id === auth.userId);
            if (user) {
                const { password, ...safeUser } = user;
                res.json(safeUser);
            } else {
                res.json(null);
            }
        } else if (userId) {
            const user = users.find(u => u.id === userId);
            if (user) {
                const { password, ...safeUser } = user;
                res.json(safeUser);
            } else {
                res.status(404).json({ error: 'User not found' });
            }
        } else if (email) {
            const user = users.find(u => u.email === email);
            if (user) {
                const { password, ...safeUser } = user;
                res.json(safeUser);
            } else {
                res.status(404).json({ error: 'User not found' });
            }
        } else {
            res.status(400).json({ error: 'Missing action, userId, or email parameter' });
        }
    } catch (error) {
        console.error('Users API error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const { action } = req.query;
        const users = readDataFile('users');
        const passwords = readDataFile('passwords') || {};

        if (action === 'register') {
            if (users.some(u => u.email === req.body.email)) {
                res.status(400).json({ error: 'Email already registered' });
                return;
            }

            const newUser = {
                id: req.body.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                email: req.body.email,
                name: req.body.name,
                role: req.body.role,
                company: req.body.company || '',
                createdAt: new Date().toISOString(),
                isActive: true
            };

            users.push(newUser);
            passwords[newUser.id] = req.body.password;
            writeDataFile('users', users);
            writeDataFile('passwords', passwords);

            const { password, ...safeUser } = newUser;
            res.status(201).json(safeUser);
        } else if (action === 'login') {
            const user = users.find(u => u.email === req.body.email);
            if (!user) {
                res.status(401).json({ success: false, message: 'Invalid email or password' });
                return;
            }

            if (passwords[user.id] !== req.body.password) {
                res.status(401).json({ success: false, message: 'Invalid email or password' });
                return;
            }

            const authData = {
                isAuthenticated: true,
                userId: user.id,
                email: user.email,
                role: user.role,
                timestamp: Date.now()
            };
            writeDataFile('auth', [authData]);

            const { password, ...safeUser } = user;
            res.json({ success: true, user: safeUser });
        } else if (action === 'logout') {
            writeDataFile('auth', []);
            res.json({ success: true });
        } else {
            res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error('Users API error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

app.put('/api/users', async (req, res) => {
    try {
        const users = readDataFile('users');
        const passwords = readDataFile('passwords') || {};
        const index = users.findIndex(u => u.id === req.body.id);

        if (index >= 0) {
            if (req.body.password) {
                passwords[req.body.id] = req.body.password;
                writeDataFile('passwords', passwords);
            }
            users[index] = { ...users[index], ...req.body };
            delete users[index].password;
            writeDataFile('users', users);

            const { password, ...safeUser } = users[index];
            res.json(safeUser);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Users API error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

app.delete('/api/users', async (req, res) => {
    try {
        const users = readDataFile('users');
        const passwords = readDataFile('passwords') || {};
        const filtered = users.filter(u => u.id !== req.query.userId);
        delete passwords[req.query.userId];
        writeDataFile('users', filtered);
        writeDataFile('passwords', passwords);
        res.json({ success: true });
    } catch (error) {
        console.error('Users API error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

// Airlines API
app.get('/api/airlines', async (req, res) => {
    try {
        const airlines = readDataFile('airlines');
        res.json(airlines);
    } catch (error) {
        console.error('Airlines API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/airlines', async (req, res) => {
    try {
        const airlines = readDataFile('airlines');
        const newAirline = {
            id: req.body.id || `airline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...req.body,
            type: 'Airline',
            created_at: new Date().toISOString()
        };
        airlines.push(newAirline);
        writeDataFile('airlines', airlines);
        res.status(201).json(newAirline);
    } catch (error) {
        console.error('Airlines API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/airlines', async (req, res) => {
    try {
        const airlines = readDataFile('airlines');
        const index = airlines.findIndex(a => a.id === req.body.id);
        if (index >= 0) {
            airlines[index] = { ...airlines[index], ...req.body };
            writeDataFile('airlines', airlines);
            res.json(airlines[index]);
        } else {
            res.status(404).json({ error: 'Airline not found' });
        }
    } catch (error) {
        console.error('Airlines API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/airlines', async (req, res) => {
    try {
        const airlines = readDataFile('airlines');
        const filtered = airlines.filter(a => a.id !== req.query.id);
        writeDataFile('airlines', filtered);
        res.json({ success: true });
    } catch (error) {
        console.error('Airlines API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Destinations API
app.get('/api/destinations', async (req, res) => {
    try {
        const destinations = readDataFile('destinations');
        res.json(destinations);
    } catch (error) {
        console.error('Destinations API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/destinations', async (req, res) => {
    try {
        const destinations = readDataFile('destinations');
        const newDestination = {
            id: req.body.id || `dest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...req.body,
            created_at: new Date().toISOString()
        };
        destinations.push(newDestination);
        writeDataFile('destinations', destinations);
        res.status(201).json(newDestination);
    } catch (error) {
        console.error('Destinations API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/destinations', async (req, res) => {
    try {
        const destinations = readDataFile('destinations');
        const index = destinations.findIndex(d => d.id === req.body.id);
        if (index >= 0) {
            destinations[index] = { ...destinations[index], ...req.body };
            writeDataFile('destinations', destinations);
            res.json(destinations[index]);
        } else {
            res.status(404).json({ error: 'Destination not found' });
        }
    } catch (error) {
        console.error('Destinations API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/destinations', async (req, res) => {
    try {
        const destinations = readDataFile('destinations');
        const filtered = destinations.filter(d => d.id !== req.query.id);
        writeDataFile('destinations', filtered);
        res.json({ success: true });
    } catch (error) {
        console.error('Destinations API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Terminals API
app.get('/api/terminals', async (req, res) => {
    try {
        const terminals = readDataFile('terminals');
        res.json(terminals);
    } catch (error) {
        console.error('Terminals API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/terminals', async (req, res) => {
    try {
        const terminals = readDataFile('terminals');
        const newTerminal = {
            id: req.body.id || `terminal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...req.body,
            created_at: new Date().toISOString()
        };
        terminals.push(newTerminal);
        writeDataFile('terminals', terminals);
        res.status(201).json(newTerminal);
    } catch (error) {
        console.error('Terminals API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/terminals', async (req, res) => {
    try {
        const terminals = readDataFile('terminals');
        const index = terminals.findIndex(t => t.id === (req.query.id || req.body.id));
        if (index >= 0) {
            terminals[index] = { ...terminals[index], ...req.body };
            writeDataFile('terminals', terminals);
            res.json(terminals[index]);
        } else {
            res.status(404).json({ error: 'Terminal not found' });
        }
    } catch (error) {
        console.error('Terminals API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/terminals', async (req, res) => {
    try {
        const terminals = readDataFile('terminals');
        const filtered = terminals.filter(t => t.id !== req.query.id);
        writeDataFile('terminals', filtered);
        res.json({ success: true });
    } catch (error) {
        console.error('Terminals API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Shipments API
app.get('/api/shipments', async (req, res) => {
    try {
        const { action, spaceId, awbNumber, userId } = req.query;
        const shipments = readDataFile('shipments');

        if (action === 'all') {
            res.json(shipments);
        } else if (action === 'user') {
            const userShipments = shipments.filter(s => 
                s.createdBy === userId || 
                s.participants?.some(p => p.userId === userId)
            );
            res.json(userShipments);
        } else if (spaceId) {
            const shipment = shipments.find(s => s.spaceId === spaceId);
            if (shipment) {
                res.json(shipment);
            } else {
                res.status(404).json({ error: 'Shipment not found' });
            }
        } else if (awbNumber) {
            const shipment = shipments.find(s => s.awbNumber === awbNumber);
            if (shipment) {
                res.json(shipment);
            } else {
                res.status(404).json({ error: 'Shipment not found' });
            }
        } else {
            res.json(shipments);
        }
    } catch (error) {
        console.error('Shipments API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/shipments', async (req, res) => {
    try {
        const shipments = readDataFile('shipments');
        const newShipment = {
            ...req.body,
            createdAt: req.body.createdAt || new Date().toISOString()
        };
        shipments.push(newShipment);
        writeDataFile('shipments', shipments);
        res.status(201).json(newShipment);
    } catch (error) {
        console.error('Shipments API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/shipments', async (req, res) => {
    try {
        const shipments = readDataFile('shipments');
        const index = shipments.findIndex(s => s.spaceId === req.body.spaceId);
        if (index >= 0) {
            shipments[index] = { ...shipments[index], ...req.body };
            writeDataFile('shipments', shipments);
            res.json(shipments[index]);
        } else {
            res.status(404).json({ error: 'Shipment not found' });
        }
    } catch (error) {
        console.error('Shipments API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/shipments', async (req, res) => {
    try {
        const shipments = readDataFile('shipments');
        const index = shipments.findIndex(s => s.spaceId === req.query.spaceId);
        if (index >= 0) {
            shipments[index] = {
                ...shipments[index],
                status: 'deleted',
                deletedAt: new Date().toISOString(),
                deletedBy: req.query.userId
            };
            writeDataFile('shipments', shipments);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Shipment not found' });
        }
    } catch (error) {
        console.error('Shipments API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Contacts API
app.get('/api/contacts', async (req, res) => {
    try {
        const { type, userId } = req.query;
        const contacts = readDataFile('contacts');

        if (type) {
            const filtered = contacts.filter(c => c.type === type);
            res.json(filtered);
        } else if (userId) {
            const userContacts = contacts.filter(c => c.userId === userId);
            res.json(userContacts);
        } else {
            res.json(contacts);
        }
    } catch (error) {
        console.error('Contacts API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/contacts', async (req, res) => {
    try {
        const contacts = readDataFile('contacts');
        const newContact = {
            id: req.body.id || `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...req.body,
            created_at: new Date().toISOString()
        };
        contacts.push(newContact);
        writeDataFile('contacts', contacts);
        res.status(201).json(newContact);
    } catch (error) {
        console.error('Contacts API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/contacts', async (req, res) => {
    try {
        const contacts = readDataFile('contacts');
        const index = contacts.findIndex(c => c.id === req.body.id);
        if (index >= 0) {
            contacts[index] = { ...contacts[index], ...req.body };
            writeDataFile('contacts', contacts);
            res.json(contacts[index]);
        } else {
            res.status(404).json({ error: 'Contact not found' });
        }
    } catch (error) {
        console.error('Contacts API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/contacts', async (req, res) => {
    try {
        const contacts = readDataFile('contacts');
        const filtered = contacts.filter(c => c.id !== req.query.id);
        writeDataFile('contacts', filtered);
        res.json({ success: true });
    } catch (error) {
        console.error('Contacts API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route for root - redirect to login
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📄 Login page: http://localhost:${PORT}/login.html`);
    console.log(`📋 Dashboard: http://localhost:${PORT}/dashboard.html`);
    console.log(`💾 Data stored in: ${DATA_DIR}`);
});
