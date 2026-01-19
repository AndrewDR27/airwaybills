// Vercel serverless function for terminals API
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

const TERMINALS_KEY = 'awb_terminals';

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
            const terminals = await redis.get(TERMINALS_KEY) || [];
            res.status(200).json(Array.isArray(terminals) ? terminals : []);
        } else if (req.method === 'POST') {
            const terminals = (await redis.get(TERMINALS_KEY)) || [];
            const newTerminal = {
                id: req.body.id || `terminal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...req.body,
                created_at: new Date().toISOString()
            };
            terminals.push(newTerminal);
            await redis.set(TERMINALS_KEY, terminals);
            res.status(201).json(newTerminal);
        } else if (req.method === 'PUT') {
            const terminals = (await redis.get(TERMINALS_KEY)) || [];
            const index = terminals.findIndex(t => t.id === (req.query.id || req.body.id));
            if (index >= 0) {
                terminals[index] = { ...terminals[index], ...req.body };
                await redis.set(TERMINALS_KEY, terminals);
                res.status(200).json(terminals[index]);
            } else {
                res.status(404).json({ error: 'Terminal not found' });
            }
        } else if (req.method === 'DELETE') {
            const terminals = (await redis.get(TERMINALS_KEY)) || [];
            const filtered = terminals.filter(t => t.id !== req.query.id);
            await redis.set(TERMINALS_KEY, filtered);
            res.status(200).json({ success: true });
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
