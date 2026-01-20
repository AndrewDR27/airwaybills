# Database Setup for Airlines, Destinations, and Terminals

This application now stores airlines, destinations, and terminals server-side using Supabase (a free PostgreSQL database service).

## Quick Setup (5 minutes)

### Step 1: Create a Supabase Account
1. Go to https://supabase.com
2. Sign up for a free account
3. Create a new project

### Step 2: Create Database Tables

Run these SQL commands in the Supabase SQL Editor:

```sql
-- Airlines table
CREATE TABLE IF NOT EXISTS airlines (
    id TEXT PRIMARY KEY,
    type TEXT DEFAULT 'Airline',
    companyName TEXT,
    contactName TEXT,
    email TEXT,
    phone TEXT,
    iataCode TEXT,
    icaoCode TEXT,
    awbp TEXT,
    airlineAbbreviation TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zipCode TEXT,
    country TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Destinations table
CREATE TABLE IF NOT EXISTS destinations (
    id TEXT PRIMARY KEY,
    airportCode TEXT,
    airportName TEXT,
    cityName TEXT,
    stateName TEXT,
    countryCode TEXT,
    countryName TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Terminals table
CREATE TABLE IF NOT EXISTS terminals (
    id TEXT PRIMARY KEY,
    terminalCode TEXT,
    terminalName TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (optional, for future auth)
ALTER TABLE airlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminals ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for now (you can restrict later)
CREATE POLICY "Allow public access" ON airlines FOR ALL USING (true);
CREATE POLICY "Allow public access" ON destinations FOR ALL USING (true);
CREATE POLICY "Allow public access" ON terminals FOR ALL USING (true);
```

### Step 3: Get Your Supabase Credentials

1. In Supabase, go to **Settings** → **API**
2. Copy your:
   - **Project URL** (this is your `SUPABASE_URL`)
   - **anon/public key** (this is your `SUPABASE_ANON_KEY`)

### Step 4: Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these two variables:
   - `SUPABASE_URL` = Your Supabase project URL
   - `SUPABASE_ANON_KEY` = Your Supabase anon key

### Step 5: Redeploy

After adding the environment variables, Vercel will automatically redeploy. Or you can manually trigger a redeploy.

## Migration from LocalStorage

If you have existing data in localStorage, you can:

1. Export the data from your browser's localStorage
2. Use the Supabase dashboard to import the data
3. Or create a migration script to copy data from localStorage to Supabase

## Testing

After setup:
1. Add a new airline/destination/terminal via the UI
2. Check Supabase dashboard → Table Editor to see the data
3. Refresh the page - data should persist
4. Open in a different browser - data should be visible there too

## Alternative: Use a Different Database

If you prefer MongoDB, Firebase, or another database, you can modify the API functions in:
- `api/airlines.js`
- `api/destinations.js`
- `api/terminals.js`

The frontend code in `js/api.js` will work with any backend that provides the same API endpoints.
