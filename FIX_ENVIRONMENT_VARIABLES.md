# Fix Environment Variables - Remove Duplicates

You have two sets of database variables, but the code only uses the ones **without** the `airwaybills_` prefix.

## What the Code Needs

The code looks for these variable names:
- `KV_REST_API_URL` (or `UPSTASH_REDIS_REST_URL`)
- `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_TOKEN`)

## What You Currently Have

**Set 1 (with prefix - NOT USED):**
- `airwaybills_KV_REST_API_URL` ❌
- `airwaybills_KV_REST_API_TOKEN` ❌
- `airwaybills_KV_REST_API_READ_ONLY_TOKEN` ❌
- `airwaybills_REDIS_URL` ❌
- `airwaybills_KV_URL` ❌

**Set 2 (without prefix - CORRECT):**
- `KV_REST_API_URL` ✅
- `KV_REST_API_TOKEN` ✅
- `KV_REST_API_READ_ONLY_TOKEN` (not used)
- `KV_REDIS_URL` (not used)
- `KV_URL` (not used)

## Steps to Fix

### Step 1: Get Your Upstash Credentials

1. Go to https://console.upstash.com
2. Click on your "airwaybills" database
3. Find the **REST API** section
4. Copy:
   - **REST URL** (starts with `https://`)
   - **REST Token** (long string)

### Step 2: Update the Correct Variables

In Vercel Dashboard → Settings → Environment Variables:

1. **Find `KV_REST_API_URL`** (the one WITHOUT `airwaybills_` prefix)
   - Click the **three dots (⋯)** → **Edit**
   - Paste your **REST URL** from Upstash
   - Make sure **Production** is selected
   - Click **Save**

2. **Find `KV_REST_API_TOKEN`** (the one WITHOUT `airwaybills_` prefix)
   - Click the **three dots (⋯)** → **Edit**
   - Paste your **REST Token** from Upstash
   - Make sure **Production** is selected
   - Click **Save**

### Step 3: Delete the Duplicate Variables (Optional but Recommended)

You can delete the variables with the `airwaybills_` prefix since they're not being used:

1. For each variable starting with `airwaybills_`:
   - Click the **three dots (⋯)** → **Delete**
   - Confirm deletion

**Variables to delete:**
- `airwaybills_KV_REST_API_URL`
- `airwaybills_KV_REST_API_READ_ONLY_TOKEN`
- `airwaybills_REDIS_URL`
- `airwaybills_KV_REST_API_TOKEN`
- `airwaybills_KV_URL`

### Step 4: Clean Up Unused Variables (Optional)

These variables exist but aren't used by the code:
- `KV_REST_API_READ_ONLY_TOKEN` (not needed)
- `KV_REDIS_URL` (not needed)
- `KV_URL` (not needed)

You can delete these too to keep things clean, or leave them (they won't hurt).

### Step 5: Redeploy

After updating variables:

1. Go to **Deployments** tab
2. Click **three dots (⋯)** on latest deployment
3. Click **Redeploy**
4. Wait 1-2 minutes

## Important Notes

- **Variable names are case-sensitive**: `KV_REST_API_URL` not `kv_rest_api_url`
- **No prefix needed**: The code doesn't look for `airwaybills_` prefix
- **Production environment**: Make sure variables are set for Production
- **Values must match Upstash**: Copy the exact REST URL and Token from Upstash console

## Quick Checklist

- [ ] Got REST URL from Upstash console
- [ ] Got REST Token from Upstash console
- [ ] Updated `KV_REST_API_URL` (without prefix) with REST URL
- [ ] Updated `KV_REST_API_TOKEN` (without prefix) with REST Token
- [ ] Both set for Production environment
- [ ] Redeployed project
- [ ] Tested admin creation

## Why This Happened

The `airwaybills_` prefixed variables were likely created automatically by Vercel when you added the Upstash integration via the marketplace. However, the code was written to use the standard variable names without prefixes.

## After Fixing

Once you update the correct variables and redeploy:
1. The 500 errors should stop
2. You should see 503 "Database not configured" if values are wrong
3. Or it should work if values are correct!

Try creating an admin again after redeploying.
