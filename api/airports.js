// Vercel serverless function for airports API
// Single list combining origins and destinations; each airport can have terminals by airline

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

const AIRPORTS_KEY = 'awb_airports';
const ORIGINS_KEY = 'awb_origins';
const DESTINATIONS_KEY = 'awb_destinations';

function toAirport(item, id, terminals = []) {
    return {
        id: id || item.id,
        airportCode: (item.airportCode || '').trim().toUpperCase() || item.id,
        cityName: item.cityName || '',
        stateName: item.stateName || '',
        airportName: item.airportName || '',
        terminals: Array.isArray(terminals) ? terminals : [],
        created_at: item.created_at || new Date().toISOString()
    };
}

export default async function handler(req, res) {
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
        }
        res.status(503).json({ error: 'Database not configured' });
        return;
    }

    try {
        if (req.method === 'GET') {
            let airports = await redis.get(AIRPORTS_KEY);
            if (!Array.isArray(airports) || airports.length === 0) {
                const origins = (await redis.get(ORIGINS_KEY)) || [];
                const destinations = (await redis.get(DESTINATIONS_KEY)) || [];
                const byCode = new Map();
                (Array.isArray(destinations) ? destinations : []).forEach(d => {
                    const code = (d.airportCode || d.id || '').toString().trim().toUpperCase().slice(0, 3) || d.id;
                    byCode.set(code, toAirport(d, d.id, []));
                });
                (Array.isArray(origins) ? origins : []).forEach(o => {
                    const code = (o.airportCode || o.id || '').toString().trim().toUpperCase().slice(0, 3) || o.id;
                    if (!byCode.has(code)) {
                        byCode.set(code, toAirport(o, o.id, []));
                    }
                });
                airports = Array.from(byCode.values());
                await redis.set(AIRPORTS_KEY, airports);
            }
            res.status(200).json(Array.isArray(airports) ? airports : []);
            return;
        }

        if (req.method === 'POST') {
            const airports = (await redis.get(AIRPORTS_KEY)) || [];
            const body = req.body || {};
            const newAirport = toAirport(body, body.id || `airport_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`, body.terminals || []);
            newAirport.id = newAirport.id || `airport_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
            airports.push(newAirport);
            await redis.set(AIRPORTS_KEY, airports);
            res.status(201).json(newAirport);
            return;
        }

        if (req.method === 'PUT') {
            const airports = (await redis.get(AIRPORTS_KEY)) || [];
            const index = airports.findIndex(a => a.id === (req.body && req.body.id));
            if (index >= 0) {
                const next = { ...airports[index], ...req.body };
                if (Array.isArray(req.body.terminals)) next.terminals = req.body.terminals;
                airports[index] = next;
                await redis.set(AIRPORTS_KEY, airports);
                res.status(200).json(airports[index]);
            } else {
                res.status(404).json({ error: 'Airport not found' });
            }
            return;
        }

        if (req.method === 'DELETE') {
            const airports = (await redis.get(AIRPORTS_KEY)) || [];
            const filtered = airports.filter(a => a.id !== req.query.id);
            await redis.set(AIRPORTS_KEY, filtered);
            res.status(200).json({ success: true });
            return;
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Airports API error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
