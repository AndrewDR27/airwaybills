# Local development: run server and log in with real database

Use this to run the app on localhost and log in with the same Redis database as production, **without pushing code**.

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment (use real Redis credentials)

Create a `.env` file in the project root (same folder as `server.js`).  
**Do not commit `.env`** — it is already in `.gitignore`.

Copy your **production** Redis credentials from Vercel:

- Vercel → your project → **Settings** → **Environment Variables**
- Copy the Redis URL and token (they may be named with an `airwaybills_` prefix or `KV_REST_*` / `UPSTASH_*`).

In `.env`, add (use the names that match Vercel):

```env
# Option A – if Vercel uses these names:
airwaybills_KV_REST_API_URL=https://xxxxx.upstash.io
airwaybills_KV_REST_API_TOKEN=your_token_here

# Option B – or use these (server.js also checks these):
KV_REST_API_URL=https://xxxxx.upstash.io
KV_REST_API_TOKEN=your_token_here

# Option C – or:
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

Optional: set port (default is 3000):

```env
PORT=3000
```

## 3. Start the server

```bash
npm run dev
```

Or:

```bash
npm start
```

You should see something like:

- `Server running at http://localhost:3000`
- `Database: Upstash Redis connected`

If you see **"Redis not configured"**, fix your `.env` (correct variable names and values).

## 4. Open the app and log in

1. In your browser go to: **http://localhost:3000**
2. You’ll be redirected to the login page.
3. Log in with **real** user credentials (same users as in production, stored in Redis).

The frontend uses `window.location.origin`, so on localhost all API calls go to `http://localhost:3000/api/...` — no extra config needed.

## 5. Test without pushing

- Code changes are only on your machine until you `git push`.
- The app uses the **same Redis database** as production, so you’re reading/writing real data. To avoid affecting production, use a **separate Upstash Redis** database for local and point your local `.env` to that database’s URL and token.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Database not configured" | Add valid `*_REST_API_URL` and `*_REST_API_TOKEN` (or `UPSTASH_*`) to `.env`. |
| "Invalid email or password" | Use an email/password that exists in Redis (e.g. create an admin in production or via create-admin.html once the server is running). |
| Port in use | Set `PORT=3001` (or another port) in `.env`. |
| Changes not visible | Hard refresh (Ctrl+Shift+R) or clear cache; ensure you’re on http://localhost:3000. |
