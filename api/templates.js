// Vercel serverless function for templates API
// Uses Upstash Redis for persistent storage

import { Redis } from '@upstash/redis';

const redisUrl = process.env.airwaybills_KV_REST_API_URL ||
                 process.env.KV_REST_API_URL ||
                 process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.airwaybills_KV_REST_API_TOKEN ||
                   process.env.KV_REST_API_TOKEN ||
                   process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = redisUrl && redisToken
    ? new Redis({ url: redisUrl, token: redisToken })
    : null;

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (!redis) {
        res.status(503).json({ error: 'Database not configured' });
        return;
    }

    try {
        if (req.method === 'GET') {
            const userId = req.query.userId;
            if (!userId) {
                res.status(400).json({ error: 'userId required' });
                return;
            }

            const key = `awb_templates:${userId}`;
            const raw = await redis.get(key);
            const templates = raw && typeof raw === 'object'
                ? raw
                : (typeof raw === 'string' ? JSON.parse(raw || '{}') : {});

            res.status(200).json(templates);
        } else if (req.method === 'POST') {
            const { userId, templates } = req.body;
            if (!userId || templates === undefined) {
                res.status(400).json({ error: 'userId and templates required' });
                return;
            }

            const key = `awb_templates:${userId}`;
            await redis.set(key, templates);
            res.status(200).json({ success: true });
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Templates API error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
