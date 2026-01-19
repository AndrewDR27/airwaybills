// Vercel serverless function for contacts API
// Uses Upstash Redis for persistent storage

import { Redis } from '@upstash/redis';

// Support both Vercel KV (old) and Upstash Redis (new) environment variable names
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const redis = redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken,
      })
    : null;

const CONTACTS_KEY = 'awb_contacts';

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
            res.status(503).json({ 
                error: 'Database not configured. Please set up Upstash Redis via Vercel Marketplace.',
                message: 'Add "Upstash for Redis" integration in Vercel.'
            });
            return;
        }
    }

    try {
        const { type, userId } = req.query;

        if (req.method === 'GET') {
            const contacts = await redis.get(CONTACTS_KEY) || [];
            
            if (type) {
                // Filter by type (Shipper, Consignee, etc.)
                const filtered = contacts.filter(c => c.type === type);
                res.status(200).json(filtered);
            } else if (userId) {
                // Get contacts for a specific user (if contacts are user-specific)
                const userContacts = contacts.filter(c => c.userId === userId);
                res.status(200).json(userContacts);
            } else {
                res.status(200).json(Array.isArray(contacts) ? contacts : []);
            }
        } else if (req.method === 'POST') {
            // Create new contact
            const contacts = (await redis.get(CONTACTS_KEY)) || [];
            const newContact = {
                id: req.body.id || `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...req.body,
                createdAt: new Date().toISOString()
            };
            contacts.push(newContact);
            await redis.set(CONTACTS_KEY, contacts);
            res.status(201).json(newContact);
        } else if (req.method === 'PUT') {
            // Update existing contact
            const contacts = (await redis.get(CONTACTS_KEY)) || [];
            const index = contacts.findIndex(c => c.id === req.body.id);
            
            if (index >= 0) {
                contacts[index] = { ...contacts[index], ...req.body };
                await redis.set(CONTACTS_KEY, contacts);
                res.status(200).json(contacts[index]);
            } else {
                res.status(404).json({ error: 'Contact not found' });
            }
        } else if (req.method === 'DELETE') {
            // Delete contact
            const contacts = (await redis.get(CONTACTS_KEY)) || [];
            const filtered = contacts.filter(c => c.id !== req.query.id);
            await redis.set(CONTACTS_KEY, filtered);
            res.status(200).json({ success: true });
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
