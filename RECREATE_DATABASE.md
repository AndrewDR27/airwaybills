# Recreate Upstash Redis Database

If your Upstash database was deleted, follow these steps to recreate it and update your Vercel environment variables.

## Step 1: Create New Upstash Redis Database

1. **Go to Upstash Console:**
   - Visit: https://console.upstash.com
   - Sign in (or create account if needed)

2. **Create New Database:**
   - Click **"Create Database"** or **"+"** button
   - Choose **"Redis"** (if prompted)
   - Fill in:
     - **Name:** `airwaybills` (or any name you prefer)
     - **Type:** `Regional` (recommended) or `Global`
     - **Region:** Choose closest to your users (e.g., `us-east-1`)
     - **Tier:** `Free` (10,000 commands/day, 256 MB storage)

3. **Click "Create"**

4. **Wait for Database to be Ready:**
   - Status should show "Active" (usually takes 10-30 seconds)

---

## Step 2: Get Your Database Credentials

Once the database is created:

1. **Click on your database** to open details

2. **Find the REST API section:**
   - Look for **"REST API"** or **"REST Endpoint"**
   - You'll see:
     - **REST URL** (starts with `https://`)
     - **REST Token** (long string)

3. **Copy both values:**
   - REST URL: `https://xxxxx.upstash.io`
   - REST Token: `AXxxxxx...` (long string)

**⚠️ Important:** Keep these safe - you'll need them in the next step!

---

## Step 3: Update Vercel Environment Variables

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Click on your **airwaybills** project

2. **Navigate to Environment Variables:**
   - Go to **Settings** → **Environment Variables**

3. **Update Existing Variables:**
   - Find `UPSTASH_REDIS_REST_URL`
     - Click the **pencil/edit icon** ✏️
     - Replace the value with your **new REST URL**
     - Make sure **Production** is selected
     - Click **Save**

   - Find `UPSTASH_REDIS_REST_TOKEN`
     - Click the **pencil/edit icon** ✏️
     - Replace the value with your **new REST Token**
     - Make sure **Production** is selected
     - Click **Save**

4. **If Variables Don't Exist:**
   - Click **"Add New"**
   - Add `UPSTASH_REDIS_REST_URL` with your REST URL
   - Select **Production** (and **Preview** if you want)
   - Click **Save**
   - Repeat for `UPSTASH_REDIS_REST_TOKEN`

**⚠️ Important:** 
- Variable names are **case-sensitive** - must be exactly:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
- Make sure **Production** environment is selected
- Also check if you need to set them for **Preview** environment

---

## Step 4: Redeploy Your Project

After updating environment variables:

1. **Go to Deployments Tab:**
   - In Vercel Dashboard → Your Project
   - Click **"Deployments"** tab

2. **Redeploy:**
   - Find the latest deployment
   - Click the **three dots (⋯)** menu
   - Click **"Redeploy"**
   - Confirm redeploy

3. **Wait for Deployment:**
   - Status should change to "Building" → "Ready"
   - Usually takes 1-2 minutes

**Alternative:** Make a small change (like adding a space) and push to GitHub to trigger auto-deploy.

---

## Step 5: Verify Database is Working

### Test 1: Check API Response

1. Visit your live site: `https://your-site.vercel.app`
2. Open browser console (F12)
3. Run this test:
   ```javascript
   fetch('/api/users?action=all')
     .then(r => {
       console.log('Status:', r.status);
       return r.json();
     })
     .then(data => {
       if (Array.isArray(data)) {
         console.log('✅ Database working! Users:', data.length);
       } else {
         console.log('✅ Database connected!', data);
       }
     })
     .catch(e => console.error('❌ Error:', e))
   ```

**Expected:**
- ✅ Status 200 = Database is working!
- ❌ Status 503 = Still not configured (check variables again)

### Test 2: Try Logging In

1. Go to your login page
2. Try to log in with existing credentials
3. If login works, database is connected!

### Test 3: Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project
2. Click **"Functions"** tab
3. Click on `/api/users`
4. Check recent logs for errors
5. Should see successful requests (not 503 errors)

---

## Step 6: Restore Your Data (If Needed)

If you had data in the old database and it's gone:

### Option A: Export from LocalStorage (if available)

If you have the site open locally with data:

1. Open browser console
2. Run:
   ```javascript
   // Export users
   const users = JSON.parse(localStorage.getItem('awb_users') || '[]');
   console.log('Users:', JSON.stringify(users, null, 2));
   
   // Export contacts
   const contacts = JSON.parse(localStorage.getItem('awbContacts') || '[]');
   console.log('Contacts:', JSON.stringify(contacts, null, 2));
   
   // Copy the output and save it
   ```

3. Then you can manually recreate the data via your app's UI

### Option B: Start Fresh

If you don't have backups, you'll need to:
- Recreate users via the admin setup or registration
- Re-add contacts, airlines, destinations, etc. via the UI

---

## Troubleshooting

### Issue: Still getting 503 errors after updating variables

**Check:**
1. Variable names are exactly correct (case-sensitive)
2. Values don't have extra spaces (copy-paste carefully)
3. Production environment is selected
4. You've redeployed after updating

**Fix:**
- Remove and re-add the variables
- Double-check the REST URL and Token from Upstash
- Redeploy again

### Issue: Database shows as "Paused"

**Fix:**
- In Upstash console, click "Resume" on your database
- Wait 10-30 seconds for it to activate
- Test again

### Issue: Can't find REST API credentials in Upstash

**Location:**
- Click on your database
- Look for "REST API" tab or section
- Or check "Details" → "REST API"
- Should show REST URL and REST Token

---

## Quick Checklist

- [ ] Created new Upstash Redis database
- [ ] Database status is "Active"
- [ ] Copied REST URL and REST Token
- [ ] Updated `UPSTASH_REDIS_REST_URL` in Vercel
- [ ] Updated `UPSTASH_REDIS_REST_TOKEN` in Vercel
- [ ] Selected Production environment for both
- [ ] Redeployed project in Vercel
- [ ] Tested API endpoint (status 200)
- [ ] Tested login functionality

---

## Need Help?

If you're still having issues:
1. Check Vercel function logs for specific error messages
2. Verify the REST URL and Token are correct in Upstash
3. Make sure you're testing on the production URL (not localhost)
4. Try removing and re-adding the environment variables
