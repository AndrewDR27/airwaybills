# Upstash Redis Setup (Simpler than Supabase!)

This app now uses **Upstash Redis** (via Vercel Marketplace) to store airlines, destinations, and terminals server-side. It's much simpler than Supabase!

## Quick Setup (3 minutes)

### Step 1: Add Upstash Redis via Vercel Marketplace

1. Go to your **Vercel Dashboard** → Your Project
2. Click on **Storage** tab (or go to **Settings** → **Storage**)
3. Click **"Browse Marketplace"** or **"Add Integration"**
4. Search for **"Upstash Redis"**
5. Click **"Add"** or **"Install"**
6. Follow the prompts to create a new Redis database

**That's it!** Vercel will automatically:
- Create the Redis database
- Add the environment variables (`KV_REST_API_URL` and `KV_REST_API_TOKEN`)
- Configure everything for you

### Step 2: Install the Package

The code needs the Upstash Redis package. Add it to your project:

```bash
npm install @upstash/redis
```

Or if you're using Vercel, it might auto-install. Check your `package.json` - if `@upstash/redis` is listed, you're good!

### Step 3: Deploy

After adding Upstash Redis via the marketplace, Vercel will automatically redeploy. Your API endpoints will now work!

## How It Works

- **Airlines** are stored under the key `awb_airlines`
- **Airports** are stored under the key `awb_airports` (each airport can have terminals-by-airline; origins/destinations were merged into this)

All data is stored as JSON arrays in Redis, which is perfect for this use case.

## Testing

1. Add a new airline or airport (with terminal details) via the UI
2. Refresh the page - data should persist
3. Open in a different browser - data should be visible there too! 🎉

## Pricing

Upstash Redis has a **generous free tier**:
- 10,000 commands per day
- 256 MB storage
- Perfect for small to medium apps

## Troubleshooting

If you see errors about "Database not configured":
1. Make sure you added Upstash Redis via Vercel Marketplace
2. Check that environment variables are set in Vercel (Settings → Environment Variables)
3. Redeploy your project after adding the integration

## Why Upstash Redis vs Supabase?

| Feature | Upstash Redis | Supabase |
|---------|---------------|----------|
| Setup | ✅ 1 click via Vercel | ⚠️ Manual setup required |
| Complexity | ✅ Simple key-value | ⚠️ Full SQL database |
| Perfect for | ✅ Simple lists/arrays | ⚠️ Complex relationships |
| Our use case | ✅ Perfect fit! | ⚠️ Overkill |

For storing simple lists of airlines, destinations, and terminals, **Upstash Redis is the perfect choice!**
