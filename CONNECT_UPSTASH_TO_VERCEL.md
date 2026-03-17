# Connect Upstash Database to Vercel

You've created a paid Upstash Redis database called "airwaybills". Now let's connect it to your Vercel project.

## Step 1: Get Your Database Credentials from Upstash

1. **Go to Upstash Console:**
   - Visit: https://console.upstash.com
   - Sign in if needed

2. **Open Your Database:**
   - Find and click on **"airwaybills"** database
   - Make sure it shows status **"Active"** ✅

3. **Get REST API Credentials:**
   - Look for **"REST API"** section (usually on the main page or in "Details")
   - You'll see two values:
     - **REST URL** - looks like: `https://xxxxx-xxxxx.upstash.io`
     - **REST Token** - a long string starting with `AXxxxxx...` or similar

4. **Copy Both Values:**
   - Click the copy icon next to each value
   - Keep them handy for the next step

---

## Step 2: Update Vercel Environment Variables

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Click on your **airwaybills** project

2. **Navigate to Environment Variables:**
   - Click **"Settings"** (in the top menu)
   - Click **"Environment Variables"** (in the left sidebar)

3. **Update or Add Variables:**

   **For `UPSTASH_REDIS_REST_URL`:**
   - If it exists: Click the **pencil/edit icon** ✏️ next to it
   - If it doesn't exist: Click **"Add New"** button
   - **Key:** `UPSTASH_REDIS_REST_URL`
   - **Value:** Paste your REST URL from Upstash
   - **Environment:** Select **Production** (and **Preview** if you want)
   - Click **"Save"**

   **For `UPSTASH_REDIS_REST_TOKEN`:**
   - If it exists: Click the **pencil/edit icon** ✏️ next to it
   - If it doesn't exist: Click **"Add New"** button
   - **Key:** `UPSTASH_REDIS_REST_TOKEN`
   - **Value:** Paste your REST Token from Upstash
   - **Environment:** Select **Production** (and **Preview** if you want)
   - Click **"Save"**

**⚠️ Important:**
- Variable names are **case-sensitive** - must be exactly:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
- Make sure **Production** is selected (this is your live site)
- Double-check there are no extra spaces when pasting

---

## Step 3: Redeploy Your Project

After updating environment variables, you must redeploy:

1. **Go to Deployments:**
   - Click **"Deployments"** tab (top menu)

2. **Redeploy:**
   - Find the latest deployment
   - Click the **three dots (⋯)** menu on the right
   - Click **"Redeploy"**
   - Confirm by clicking **"Redeploy"** again

3. **Wait for Deployment:**
   - Status will show "Building..." then "Ready"
   - Usually takes 1-2 minutes
   - You'll see a green checkmark ✅ when done

**Alternative:** Make a small change (add a space to any file) and push to GitHub to trigger auto-deploy.

---

## Step 4: Verify Connection

### Test 1: Check API Response

1. Visit your live site: `https://your-site.vercel.app`
2. Open browser console (Press F12)
3. Run this test:
   ```javascript
   fetch('/api/users?action=all')
     .then(r => {
       console.log('Status:', r.status);
       return r.json();
     })
     .then(data => {
       if (r.status === 200) {
         console.log('✅ Database connected! Users:', Array.isArray(data) ? data.length : 'OK');
       } else {
         console.log('⚠️ Response:', data);
       }
     })
     .catch(e => console.error('❌ Error:', e))
   ```

**Expected Results:**
- ✅ **Status 200** = Database is connected and working!
- ❌ **Status 503** = Still not connected (check variables again)
- ❌ **Network error** = API endpoint issue (check deployment)

### Test 2: Try Logging In

1. Go to your login page: `https://your-site.vercel.app/login.html`
2. Try to log in
3. If login works, database is connected!

### Test 3: Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project
2. Click **"Functions"** tab
3. Click on `/api/users` function
4. Check recent logs:
   - ✅ Should see successful requests
   - ❌ Should NOT see "Database not configured" errors

---

## Troubleshooting

### Issue: Still getting 503 errors

**Check:**
1. Variable names are exactly correct (case-sensitive):
   - `UPSTASH_REDIS_REST_URL` (not `upstash_redis_rest_url`)
   - `UPSTASH_REDIS_REST_TOKEN` (not `upstash_redis_rest_token`)

2. Values are correct:
   - REST URL should start with `https://` and end with `.upstash.io`
   - REST Token should be a long string (no spaces)

3. Environment is selected:
   - Make sure **Production** is checked
   - Also check **Preview** if you want it for preview deployments

4. You've redeployed:
   - Environment variables only take effect after redeploy
   - Check deployment status is "Ready"

**Fix:**
- Remove the variables and re-add them
- Double-check the values from Upstash console
- Redeploy again

### Issue: Can't find REST API credentials

**In Upstash Console:**
1. Click on your "airwaybills" database
2. Look for tabs: **"Details"**, **"REST API"**, or **"Connect"**
3. REST URL and Token should be visible there
4. If you see "REST API" tab, click it to see credentials

### Issue: Database shows as "Paused"

**Fix:**
- In Upstash console, click **"Resume"** on your database
- Wait 10-30 seconds
- Status should change to "Active"
- Test again

---

## Quick Checklist

- [ ] Opened "airwaybills" database in Upstash console
- [ ] Copied REST URL (starts with `https://`)
- [ ] Copied REST Token (long string)
- [ ] Updated `UPSTASH_REDIS_REST_URL` in Vercel
- [ ] Updated `UPSTASH_REDIS_REST_TOKEN` in Vercel
- [ ] Selected Production environment for both
- [ ] Redeployed project in Vercel
- [ ] Deployment status shows "Ready"
- [ ] Tested API endpoint (status 200)
- [ ] Tested login functionality

---

## What's Next?

Once connected:
- Your database is now active and ready to use
- All data (users, contacts, shipments, etc.) will be stored in Upstash
- Data persists across deployments and browser sessions
- You can access your data from the Upstash console anytime

**Note:** Since this is a new database, you'll need to:
- Create admin/user accounts (via admin setup or registration)
- Add contacts, airlines, destinations, etc. via your app's UI

---

## Need Help?

If you're still having issues:
1. Check Vercel function logs for specific error messages
2. Verify credentials in Upstash console match what you pasted
3. Make sure you're testing on production URL (not localhost)
4. Try removing and re-adding environment variables
