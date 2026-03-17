# Database Diagnostic Guide

If your site is deployed but the database isn't working, follow these steps:

## Quick Check: Is the Database Active?

### Step 1: Check Vercel Environment Variables

1. Go to **Vercel Dashboard** → Your Project
2. Navigate to **Settings** → **Environment Variables**
3. Check if these variables exist:
   - `UPSTASH_REDIS_REST_URL` (or `KV_REST_API_URL`)
   - `UPSTASH_REDIS_REST_TOKEN` (or `KV_REST_API_TOKEN`)

**If they're missing → Go to Step 2**
**If they exist → Go to Step 3**

---

## Step 2: Add Upstash Redis Database

### Option A: Via Vercel Marketplace (Recommended)

1. Go to **Vercel Dashboard** → Your Project
2. Click on **Storage** tab (or **Settings** → **Storage**)
3. Click **"Browse Marketplace"** or **"Add Integration"**
4. Search for **"Upstash Redis"**
5. Click **"Add"** or **"Install"**
6. Follow prompts to create a new Redis database
7. Vercel will automatically add the environment variables

### Option B: Manual Setup

1. Go to https://console.upstash.com
2. Sign up/login
3. Create a new Redis database
4. Copy the **REST URL** and **REST Token**
5. In Vercel: **Settings** → **Environment Variables**
6. Add:
   - `UPSTASH_REDIS_REST_URL` = Your REST URL
   - `UPSTASH_REDIS_REST_TOKEN` = Your REST Token
7. Make sure to select **Production** environment (and Preview if needed)

---

## Step 3: Check if Database is Paused

1. Go to https://console.upstash.com
2. Find your Redis database
3. Check the status:
   - **Active** ✅ = Good
   - **Paused** ⏸️ = Click "Resume" to reactivate
   - **Deleted** ❌ = Create a new one

**Note:** Free tier databases auto-pause after 7 days of inactivity. Just click "Resume" to reactivate.

---

## Step 4: Redeploy After Changes

After adding/changing environment variables:

1. Go to **Vercel Dashboard** → **Deployments**
2. Click the **three dots (⋯)** on the latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

**OR** make a small change and push to GitHub to trigger auto-deploy.

---

## Step 5: Test the Database

### Test via Browser Console

1. Visit your live site
2. Open browser console (F12)
3. Run this test:
   ```javascript
   fetch('/api/users?action=all')
     .then(r => r.json())
     .then(data => console.log('✅ Database working!', data))
     .catch(e => console.error('❌ Database error:', e))
   ```

### Expected Results:

- **Status 200** = ✅ Database is working!
- **Status 503** = ❌ Environment variables missing or database not configured
- **Network error** = ❌ API endpoint not found (deployment issue)

---

## Step 6: Check Deployment Logs

1. Go to **Vercel Dashboard** → **Deployments**
2. Click on the latest deployment
3. Click **"View Build Logs"**
4. Look for:
   - ✅ "Deployment successful"
   - ❌ Any errors about environment variables
   - ❌ Any errors about database connection

---

## Common Issues & Solutions

### Issue: "Database not configured" error

**Solution:**
- Environment variables are missing or incorrect
- Follow Step 2 to add them
- Make sure to redeploy after adding

### Issue: "503 Service Unavailable"

**Solution:**
- Database might be paused
- Go to Upstash console and resume it
- Or environment variables are wrong - double-check them

### Issue: Database was working but stopped

**Solution:**
- Free tier databases auto-pause after 7 days of inactivity
- Go to Upstash console → Resume the database
- No data is lost, it just needs to be reactivated

### Issue: Environment variables exist but still not working

**Solution:**
1. Check variable names match exactly (case-sensitive):
   - `UPSTASH_REDIS_REST_URL` (not `upstash_redis_rest_url`)
   - `UPSTASH_REDIS_REST_TOKEN` (not `upstash_redis_rest_token`)
2. Make sure they're set for **Production** environment
3. Redeploy after any changes

---

## Quick Fix Checklist

- [ ] Environment variables exist in Vercel
- [ ] Variable names are correct (case-sensitive)
- [ ] Variables are set for Production environment
- [ ] Upstash Redis database exists and is Active (not Paused)
- [ ] Project has been redeployed after adding variables
- [ ] Test API call returns status 200

---

## Still Not Working?

1. **Check Upstash Console:**
   - Go to https://console.upstash.com
   - Check if database exists
   - Check if it's active (not paused)
   - Check usage/limits (free tier: 10,000 commands/day)

2. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Your Project → **Functions** tab
   - Click on any API function (e.g., `/api/users`)
   - Check the logs for errors

3. **Verify Environment Variables:**
   - In Vercel: Settings → Environment Variables
   - Make sure values are correct (no extra spaces)
   - Try removing and re-adding them

4. **Test Locally:**
   - Create `.env` file with the same variables
   - Run `npm start`
   - Test if database works locally
   - If it works locally but not in production, it's a Vercel config issue

---

## Need Help?

If you're still stuck:
1. Check the browser console for specific error messages
2. Check Vercel function logs for server-side errors
3. Verify the Upstash database is active in their console
4. Make sure you're testing on the production URL (not localhost)
