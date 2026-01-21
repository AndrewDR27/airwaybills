// Vercel serverless function for origins API
// Uses Upstash Redis (via Vercel Marketplace) for persistent storage

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

const ORIGINS_KEY = 'awb_origins';

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
            });
            return;
        }
    }

    try {
        if (req.method === 'GET') {
            const origins = await redis.get(ORIGINS_KEY) || [];
            res.status(200).json(Array.isArray(origins) ? origins : []);
        } else if (req.method === 'POST') {
            const origins = (await redis.get(ORIGINS_KEY)) || [];
            const newOrigin = {
                id: req.body.id || `orig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...req.body,
                created_at: new Date().toISOString()
            };
            origins.push(newOrigin);
            await redis.set(ORIGINS_KEY, origins);
            res.status(201).json(newOrigin);
        } else if (req.method === 'PUT') {
            const origins = (await redis.get(ORIGINS_KEY)) || [];
            const index = origins.findIndex(o => o.id === req.body.id);
            if (index >= 0) {
                origins[index] = { ...origins[index], ...req.body };
                await redis.set(ORIGINS_KEY, origins);
                res.status(200).json(origins[index]);
            } else {
                res.status(404).json({ error: 'Origin not found' });
            }
        } else if (req.method === 'DELETE') {
            const origins = (await redis.get(ORIGINS_KEY)) || [];
            const filtered = origins.filter(o => o.id !== req.query.id);
            await redis.set(ORIGINS_KEY, filtered);
            res.status(200).json({ success: true });
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
