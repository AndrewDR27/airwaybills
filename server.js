require('dotenv').config();
const express = require('express');
const path = require('path');
const { Redis } = require('@upstash/redis');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Connect to Upstash Redis database (same as production)
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const redis = redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken,
      })
    : null;

if (!redis) {
    console.error('❌ WARNING: Upstash Redis not configured!');
    console.error('Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your .env file');
    console.error('These should match your Vercel environment variables');
}

// Helper functions for session management (same as api/users.js)
function generateSessionToken() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
}

function getSessionKey(token) {
    return `awb_session:${token}`;
}

const USERS_KEY = 'awb_users';

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
        if (!redis) {
            res.status(503).json({ error: 'Database not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env file' });
            return;
        }

        const { action, userId, email, sessionToken } = req.query;
        const users = (await redis.get(USERS_KEY)) || [];

        if (action === 'all') {
            const safeUsers = users.map(u => {
                const { password, ...safeUser } = u;
                return safeUser;
            });
            res.json(Array.isArray(safeUsers) ? safeUsers : []);
        } else if (action === 'current') {
            if (sessionToken) {
                // Use session token (new method)
                const sessionKey = getSessionKey(sessionToken);
                const sessionData = await redis.get(sessionKey);
                
                if (!sessionData || !sessionData.userId) {
                    res.json(null);
                    return;
                }
                
                const user = users.find(u => u.id === sessionData.userId);
                if (user) {
                    const { password, ...safeUser } = user;
                    res.json(safeUser);
                } else {
                    res.json(null);
                }
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
        if (!redis) {
            res.status(503).json({ error: 'Database not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env file' });
            return;
        }

        const { action } = req.query;
        const users = (await redis.get(USERS_KEY)) || [];

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
            await redis.set(USERS_KEY, users);
            
            // Store password separately (in production, use proper hashing)
            await redis.set(`user_password_${newUser.id}`, req.body.password);

            const { password, ...safeUser } = newUser;
            res.status(201).json(safeUser);
        } else if (action === 'login') {
            // Login - check credentials
            const users = (await redis.get(USERS_KEY)) || [];
            console.log('Login attempt for email:', req.body.email);
            console.log('Total users in database:', users.length);
            
            // Case-insensitive email matching
            const user = users.find(u => u.email && u.email.toLowerCase() === req.body.email.toLowerCase());
            
            if (!user) {
                console.log('User not found in database');
                console.log('Available emails:', users.map(u => u.email).filter(Boolean));
                res.status(401).json({ success: false, message: 'Invalid email or password' });
                return;
            }

            console.log('User found:', user.email, 'role:', user.role);
            const storedPassword = await redis.get(`user_password_${user.id}`);
            
            if (!storedPassword) {
                console.log('No password stored for user:', user.id);
                res.status(401).json({ success: false, message: 'Invalid email or password' });
                return;
            }
            
            if (storedPassword !== req.body.password) {
                console.log('Password mismatch');
                console.log('Stored password length:', storedPassword.length);
                console.log('Provided password length:', req.body.password.length);
                res.status(401).json({ success: false, message: 'Invalid email or password' });
                return;
            }
            
            console.log('Login successful for:', user.email);

            // Generate unique session token
            const sessionToken = generateSessionToken();
            
            // Store session data with token as key
            const sessionData = {
                userId: user.id,
                email: user.email,
                role: user.role,
                timestamp: Date.now(),
                expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
            };
            
            const sessionKey = getSessionKey(sessionToken);
            await redis.set(sessionKey, sessionData);

            const { password, ...safeUser } = user;
            res.json({ 
                success: true, 
                user: safeUser,
                sessionToken: sessionToken
            });
        } else if (action === 'logout') {
            const sessionToken = req.body.sessionToken;
            if (sessionToken) {
                const sessionKey = getSessionKey(sessionToken);
                await redis.del(sessionKey);
            }
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
const AIRLINES_KEY = 'awb_airlines';

app.get('/api/airlines', async (req, res) => {
    console.log('=== Airlines API GET called ===');
    try {
        if (!redis) {
            console.error('Airlines API: Redis not configured');
            res.status(503).json({ error: 'Database not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env file' });
            return;
        }
        console.log('Airlines API: Redis is configured, fetching from key:', AIRLINES_KEY);
        const airlines = await redis.get(AIRLINES_KEY);
        console.log('Airlines API: Raw result from Redis:', typeof airlines, airlines === null ? 'null' : airlines === undefined ? 'undefined' : Array.isArray(airlines) ? `array with ${airlines.length} items` : 'not an array');
        const result = Array.isArray(airlines) ? airlines : (airlines || []);
        console.log('Airlines API: Returning', result.length, 'airlines');
        res.json(result);
    } catch (error) {
        console.error('Airlines API ERROR:', error.message);
        console.error('Airlines API ERROR stack:', error.stack);
        res.status(500).json({ error: 'Internal server error', message: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined });
    }
});

app.post('/api/airlines', async (req, res) => {
    try {
        if (!redis) {
            res.status(503).json({ error: 'Database not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env file' });
            return;
        }
        const airlines = (await redis.get(AIRLINES_KEY)) || [];
        const newAirline = {
            id: req.body.id || `airline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...req.body,
            type: 'Airline',
            created_at: new Date().toISOString()
        };
        airlines.push(newAirline);
        await redis.set(AIRLINES_KEY, airlines);
        res.status(201).json(newAirline);
    } catch (error) {
        console.error('Airlines API error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

app.put('/api/airlines', async (req, res) => {
    try {
        if (!redis) {
            res.status(503).json({ error: 'Database not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env file' });
            return;
        }
        const airlines = (await redis.get(AIRLINES_KEY)) || [];
        const index = airlines.findIndex(a => a.id === req.body.id);
        if (index >= 0) {
            airlines[index] = { ...airlines[index], ...req.body };
            await redis.set(AIRLINES_KEY, airlines);
            res.json(airlines[index]);
        } else {
            res.status(404).json({ error: 'Airline not found' });
        }
    } catch (error) {
        console.error('Airlines API error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

app.delete('/api/airlines', async (req, res) => {
    try {
        if (!redis) {
            res.status(503).json({ error: 'Database not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env file' });
            return;
        }
        const airlines = (await redis.get(AIRLINES_KEY)) || [];
        const filtered = airlines.filter(a => a.id !== req.query.id);
        await redis.set(AIRLINES_KEY, filtered);
        res.json({ success: true });
    } catch (error) {
        console.error('Airlines API error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
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
const CONTACTS_KEY = 'awb_contacts';

app.get('/api/contacts', async (req, res) => {
    console.log('=== Contacts API GET called ===');
    try {
        if (!redis) {
            console.error('Contacts API: Redis not configured');
            res.status(503).json({ error: 'Database not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env file' });
            return;
        }

        const { type, userId } = req.query;
        console.log('Contacts API: Fetching from Redis, key:', CONTACTS_KEY);
        const contacts = await redis.get(CONTACTS_KEY);
        console.log('Contacts API: Raw result from Redis:', typeof contacts, contacts === null ? 'null' : contacts === undefined ? 'undefined' : Array.isArray(contacts) ? `array with ${contacts.length} items` : 'not an array');
        const contactsArray = Array.isArray(contacts) ? contacts : (contacts || []);

        if (type) {
            const filtered = contactsArray.filter(c => c && c.type === type);
            console.log('Contacts API: Returning', filtered.length, 'contacts filtered by type:', type);
            res.json(Array.isArray(filtered) ? filtered : []);
        } else if (userId) {
            const userContacts = contactsArray.filter(c => c && c.userId === userId);
            console.log('Contacts API: Returning', userContacts.length, 'contacts for user:', userId);
            res.json(Array.isArray(userContacts) ? userContacts : []);
        } else {
            console.log('Contacts API: Returning', contactsArray.length, 'contacts');
            res.json(Array.isArray(contactsArray) ? contactsArray : []);
        }
    } catch (error) {
        console.error('Contacts API ERROR:', error.message);
        console.error('Contacts API ERROR stack:', error.stack);
        res.status(500).json({ error: 'Internal server error', message: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined });
    }
});

app.post('/api/contacts', async (req, res) => {
    try {
        if (!redis) {
            res.status(503).json({ error: 'Database not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env file' });
            return;
        }

        const contacts = (await redis.get(CONTACTS_KEY)) || [];
        const newContact = {
            id: req.body.id || `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...req.body,
            createdAt: new Date().toISOString()
        };
        contacts.push(newContact);
        await redis.set(CONTACTS_KEY, contacts);
        res.status(201).json(newContact);
    } catch (error) {
        console.error('Contacts API error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

app.put('/api/contacts', async (req, res) => {
    try {
        if (!redis) {
            res.status(503).json({ error: 'Database not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env file' });
            return;
        }

        const contacts = (await redis.get(CONTACTS_KEY)) || [];
        const index = contacts.findIndex(c => c.id === req.body.id);
        if (index >= 0) {
            contacts[index] = { ...contacts[index], ...req.body };
            await redis.set(CONTACTS_KEY, contacts);
            res.json(contacts[index]);
        } else {
            res.status(404).json({ error: 'Contact not found' });
        }
    } catch (error) {
        console.error('Contacts API error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

app.delete('/api/contacts', async (req, res) => {
    try {
        if (!redis) {
            res.status(503).json({ error: 'Database not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env file' });
            return;
        }

        const contacts = (await redis.get(CONTACTS_KEY)) || [];
        const filtered = contacts.filter(c => c.id !== req.query.id);
        await redis.set(CONTACTS_KEY, filtered);
        res.json({ success: true });
    } catch (error) {
        console.error('Contacts API error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
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
    if (redis) {
        console.log(`💾 Database: Upstash Redis connected`);
    } else {
        console.log(`⚠️  Database: Redis not configured - check .env file`);
    }
});
