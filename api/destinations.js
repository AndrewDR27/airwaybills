// Vercel serverless function for destinations API
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

const DESTINATIONS_KEY = 'awb_destinations';

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
                message: 'Add "Upstash for Redis" integration in Vercel. It will automatically add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.'
            });
            return;
        }
    }

    try {
        if (req.method === 'GET') {
            const destinations = await redis.get(DESTINATIONS_KEY) || [];
            res.status(200).json(Array.isArray(destinations) ? destinations : []);
        } else if (req.method === 'POST') {
            const destinations = (await redis.get(DESTINATIONS_KEY)) || [];
            const newDestination = {
                id: req.body.id || `dest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...req.body,
                created_at: new Date().toISOString()
            };
            destinations.push(newDestination);
            await redis.set(DESTINATIONS_KEY, destinations);
            res.status(201).json(newDestination);
        } else if (req.method === 'PUT') {
            const destinations = (await redis.get(DESTINATIONS_KEY)) || [];
            const index = destinations.findIndex(d => d.id === req.body.id);
            if (index >= 0) {
                destinations[index] = { ...destinations[index], ...req.body };
                await redis.set(DESTINATIONS_KEY, destinations);
                res.status(200).json(destinations[index]);
            } else {
                res.status(404).json({ error: 'Destination not found' });
            }
        } else if (req.method === 'DELETE') {
            const destinations = (await redis.get(DESTINATIONS_KEY)) || [];
            const filtered = destinations.filter(d => d.id !== req.query.id);
            await redis.set(DESTINATIONS_KEY, filtered);
            res.status(200).json({ success: true });
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
