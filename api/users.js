// Vercel serverless function for users API
// Uses Upstash Redis for persistent storage

import { Redis } from '@upstash/redis';

// Support both Vercel KV (old) and Upstash Redis (new) environment variable names
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

// Debug logging (only in development or when explicitly enabled)
const DEBUG_DB = process.env.DEBUG_DB === 'true';

if (DEBUG_DB) {
    console.log('Environment variables check:');
    console.log('UPSTASH_REDIS_REST_URL:', process.env.UPSTASH_REDIS_REST_URL ? 'SET' : 'NOT SET');
    console.log('KV_REST_API_URL:', process.env.KV_REST_API_URL ? 'SET' : 'NOT SET');
    console.log('UPSTASH_REDIS_REST_TOKEN:', process.env.UPSTASH_REDIS_REST_TOKEN ? 'SET' : 'NOT SET');
    console.log('KV_REST_API_TOKEN:', process.env.KV_REST_API_TOKEN ? 'SET' : 'NOT SET');
    console.log('redisUrl found:', !!redisUrl);
    console.log('redisToken found:', !!redisToken);
}

const redis = redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken,
      })
    : null;

if (DEBUG_DB) {
    console.log('Redis client created:', !!redis);
}

const USERS_KEY = 'awb_users';
const AUTH_KEY = 'awb_auth'; // Deprecated - kept for backward compatibility

// Helper function to generate session token
function generateSessionToken() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
}

// Helper function to get session key
function getSessionKey(token) {
    return `awb_session:${token}`;
}

// Helper function to get user sessions key
function getUserSessionsKey(userId) {
    return `awb_user_sessions:${userId}`;
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (!redis) {
        if (req.method === 'GET') {
            res.status(200).json([]);
            return;
        } else {
            // Provide more detailed error information
            const errorDetails = {
                error: 'Database not configured',
                message: 'Upstash Redis environment variables are missing or invalid.',
                details: {
                    hasUrl: !!redisUrl,
                    hasToken: !!redisToken,
                    urlSource: process.env.UPSTASH_REDIS_REST_URL ? 'UPSTASH_REDIS_REST_URL' : 
                               (process.env.KV_REST_API_URL ? 'KV_REST_API_URL' : 'none'),
                    tokenSource: process.env.UPSTASH_REDIS_REST_TOKEN ? 'UPSTASH_REDIS_REST_TOKEN' : 
                                (process.env.KV_REST_API_TOKEN ? 'KV_REST_API_TOKEN' : 'none')
                },
                solution: 'Please verify in Vercel Dashboard → Settings → Environment Variables that KV_REST_API_URL and KV_REST_API_TOKEN are set for Production environment, then redeploy.'
            };
            res.status(503).json(errorDetails);
            return;
        }
    }

    try {
        // Handle different endpoints based on query params
        const { action, userId, email } = req.query;

        if (req.method === 'GET') {
            if (action === 'all') {
                // Get all users
                const users = await redis.get(USERS_KEY) || [];
                // Don't return passwords
                const safeUsers = users.map(u => {
                    const { password, ...safeUser } = u;
                    return safeUser;
                });
                res.status(200).json(Array.isArray(safeUsers) ? safeUsers : []);
            } else if (action === 'current') {
                // Get current authenticated user using session token
                const sessionToken = req.query.sessionToken || req.headers['x-session-token'];
                
                if (!sessionToken) {
                    // Fallback to old AUTH_KEY for backward compatibility (but log warning)
                    const authData = await redis.get(AUTH_KEY);
                    if (!authData || !authData.userId) {
                        res.status(200).json(null);
                        return;
                    }
                    const users = await redis.get(USERS_KEY) || [];
                    const user = users.find(u => u.id === authData.userId);
                    if (user) {
                        const { password, ...safeUser } = user;
                        res.status(200).json(safeUser);
                    } else {
                        res.status(200).json(null);
                    }
                    return;
                }
                
                // Validate session token
                const sessionKey = getSessionKey(sessionToken);
                const sessionData = await redis.get(sessionKey);
                
                if (!sessionData || !sessionData.userId) {
                    res.status(200).json(null);
                    return;
                }
                
                // Get user data
                const users = await redis.get(USERS_KEY) || [];
                const user = users.find(u => u.id === sessionData.userId);
                
                if (user) {
                    const { password, ...safeUser } = user;
                    res.status(200).json(safeUser);
                } else {
                    // User not found - invalidate session
                    await redis.del(sessionKey);
                    res.status(200).json(null);
                }
            } else if (userId) {
                // Get user by ID
                const users = await redis.get(USERS_KEY) || [];
                const user = users.find(u => u.id === userId);
                if (user) {
                    const { password, ...safeUser } = user;
                    res.status(200).json(safeUser);
                } else {
                    res.status(404).json({ error: 'User not found' });
                }
            } else if (email) {
                // Get user by email
                const users = await redis.get(USERS_KEY) || [];
                const user = users.find(u => u.email === email);
                if (user) {
                    const { password, ...safeUser } = user;
                    res.status(200).json(safeUser);
                } else {
                    res.status(404).json({ error: 'User not found' });
                }
            } else {
                res.status(400).json({ error: 'Missing action, userId, or email parameter' });
            }
        } else if (req.method === 'POST') {
            if (action === 'register') {
                // Register new user
                const users = (await redis.get(USERS_KEY)) || [];
                
                // Check if email already exists
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
                    isActive: true,
                    password: req.body.password // In production, hash this!
                };

                users.push(newUser);
                await redis.set(USERS_KEY, users);
                
                // Store password separately (in production, use proper hashing)
                await redis.set(`user_password_${newUser.id}`, req.body.password);

                const { password, ...safeUser } = newUser;
                res.status(201).json(safeUser);
            } else if (action === 'login') {
                // Login - check credentials
                const users = await redis.get(USERS_KEY) || [];
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
                
                // Also store session token in user's session list (for cleanup)
                const userSessionsKey = getUserSessionsKey(user.id);
                const userSessions = await redis.get(userSessionsKey) || [];
                userSessions.push(sessionToken);
                await redis.set(userSessionsKey, userSessions);
                
                // Keep old AUTH_KEY for backward compatibility (but this is deprecated)
                // TODO: Remove this after migration period
                const authData = {
                    isAuthenticated: true,
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                    timestamp: Date.now()
                };
                await redis.set(AUTH_KEY, authData);

                const { password, ...safeUser } = user;
                res.status(200).json({ 
                    success: true, 
                    user: safeUser,
                    sessionToken: sessionToken // Return session token to client
                });
            } else if (action === 'logout') {
                // Logout - clear session token
                const sessionToken = req.body.sessionToken || req.query.sessionToken || req.headers['x-session-token'];
                
                if (sessionToken) {
                    const sessionKey = getSessionKey(sessionToken);
                    const sessionData = await redis.get(sessionKey);
                    
                    if (sessionData && sessionData.userId) {
                        // Remove from user's session list
                        const userSessionsKey = getUserSessionsKey(sessionData.userId);
                        const userSessions = await redis.get(userSessionsKey) || [];
                        const filteredSessions = userSessions.filter(t => t !== sessionToken);
                        await redis.set(userSessionsKey, filteredSessions);
                    }
                    
                    await redis.del(sessionKey);
                }
                
                // Also clear old AUTH_KEY for backward compatibility
                await redis.del(AUTH_KEY);
                res.status(200).json({ success: true });
            } else {
                res.status(400).json({ error: 'Invalid action' });
            }
        } else if (req.method === 'PUT') {
            // Update user
            const users = (await redis.get(USERS_KEY)) || [];
            const index = users.findIndex(u => u.id === req.body.id);
            
            if (index >= 0) {
                // Preserve password if not being updated
                if (!req.body.password) {
                    const existingPassword = await redis.get(`user_password_${users[index].id}`);
                    if (existingPassword) {
                        await redis.set(`user_password_${users[index].id}`, existingPassword);
                    }
                } else {
                    // Update password
                    await redis.set(`user_password_${req.body.id}`, req.body.password);
                }

                users[index] = { ...users[index], ...req.body };
                // Don't store password in user object
                delete users[index].password;
                await redis.set(USERS_KEY, users);

                const { password, ...safeUser } = users[index];
                res.status(200).json(safeUser);
            } else {
                res.status(404).json({ error: 'User not found' });
            }
        } else if (req.method === 'DELETE') {
            // Delete user
            const users = (await redis.get(USERS_KEY)) || [];
            const filtered = users.filter(u => u.id !== req.query.userId);
            await redis.set(USERS_KEY, filtered);
            await redis.del(`user_password_${req.query.userId}`);
            res.status(200).json({ success: true });
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
