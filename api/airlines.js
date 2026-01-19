// Vercel serverless function for airlines API
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

const AIRLINES_KEY = 'awb_airlines';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // If Redis is not configured, return empty or error
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
            // Get all airlines from Redis
            const airlines = await redis.get(AIRLINES_KEY) || [];
            res.status(200).json(Array.isArray(airlines) ? airlines : []);
        } else if (req.method === 'POST') {
            // Create new airline
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
        } else if (req.method === 'PUT') {
            // Update existing airline
            const airlines = (await redis.get(AIRLINES_KEY)) || [];
            const index = airlines.findIndex(a => a.id === req.body.id);
            if (index >= 0) {
                airlines[index] = { ...airlines[index], ...req.body };
                await redis.set(AIRLINES_KEY, airlines);
                res.status(200).json(airlines[index]);
            } else {
                res.status(404).json({ error: 'Airline not found' });
            }
        } else if (req.method === 'DELETE') {
            // Delete airline
            const airlines = (await redis.get(AIRLINES_KEY)) || [];
            const filtered = airlines.filter(a => a.id !== req.query.id);
            await redis.set(AIRLINES_KEY, filtered);
            res.status(200).json({ success: true });
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
