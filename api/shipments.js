// Vercel serverless function for shipments API
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

const SHIPMENTS_KEY = 'awb_shipments';

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
        const { action, spaceId, awbNumber, userId } = req.query;

        if (req.method === 'GET') {
            const shipments = await redis.get(SHIPMENTS_KEY) || [];
            
            if (action === 'all') {
                res.status(200).json(Array.isArray(shipments) ? shipments : []);
            } else if (action === 'user') {
                // Get shipments for a specific user
                const userShipments = shipments.filter(s => 
                    s.createdBy === userId || 
                    s.participants?.some(p => p.userId === userId)
                );
                res.status(200).json(userShipments);
            } else if (spaceId) {
                // Get shipment by spaceId
                const shipment = shipments.find(s => s.spaceId === spaceId);
                if (shipment) {
                    res.status(200).json(shipment);
                } else {
                    res.status(404).json({ error: 'Shipment not found' });
                }
            } else if (awbNumber) {
                // Get shipment by AWB number
                const shipment = shipments.find(s => s.awbNumber === awbNumber);
                if (shipment) {
                    res.status(200).json(shipment);
                } else {
                    res.status(404).json({ error: 'Shipment not found' });
                }
            } else {
                res.status(200).json(Array.isArray(shipments) ? shipments : []);
            }
        } else if (req.method === 'POST') {
            // Create new shipment
            const shipments = (await redis.get(SHIPMENTS_KEY)) || [];
            const newShipment = {
                ...req.body,
                createdAt: req.body.createdAt || new Date().toISOString()
            };
            shipments.push(newShipment);
            await redis.set(SHIPMENTS_KEY, shipments);
            res.status(201).json(newShipment);
        } else if (req.method === 'PUT') {
            // Update existing shipment
            const shipments = (await redis.get(SHIPMENTS_KEY)) || [];
            const index = shipments.findIndex(s => s.spaceId === req.body.spaceId);
            
            if (index >= 0) {
                shipments[index] = { ...shipments[index], ...req.body };
                await redis.set(SHIPMENTS_KEY, shipments);
                res.status(200).json(shipments[index]);
            } else {
                res.status(404).json({ error: 'Shipment not found' });
            }
        } else if (req.method === 'DELETE') {
            // Delete shipment (soft delete by setting status)
            const shipments = (await redis.get(SHIPMENTS_KEY)) || [];
            const index = shipments.findIndex(s => s.spaceId === req.query.spaceId);
            
            if (index >= 0) {
                shipments[index] = {
                    ...shipments[index],
                    status: 'deleted',
                    deletedAt: new Date().toISOString(),
                    deletedBy: req.query.userId
                };
                await redis.set(SHIPMENTS_KEY, shipments);
                res.status(200).json({ success: true });
            } else {
                res.status(404).json({ error: 'Shipment not found' });
            }
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
