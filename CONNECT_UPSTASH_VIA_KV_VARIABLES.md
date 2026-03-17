# Connect Upstash Database Using KV Variables

Your code supports both `KV_REST_API_URL` (Vercel KV naming) and `UPSTASH_REDIS_REST_URL` (Upstash naming). Since Vercel shows "KV Redis" variables, you can use those!

## Step 1: Get Your Upstash Database Credentials

1. **Go to Upstash Console:**
   - Visit: https://console.upstash.com
   - Sign in if needed

2. **Open Your Database:**
   - Click on **"airwaybills"** database
   - Make sure it shows **"Active"** ✅

3. **Get REST API Credentials:**
   - Look for **"REST API"** section
   - You'll see:
     - **REST URL** - looks like: `https://xxxxx-xxxxx.upstash.io`
     - **REST Token** - a long string

4. **Copy Both Values**

---

## Step 2: Update Vercel KV Variables

Since Vercel shows "KV Redis" variables, you can use those:

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Click on your **airwaybills** project

2. **Navigate to Environment Variables:**
   - Click **"Settings"** → **"Environment Variables"**

3. **Update the KV Variables:**

   **For `KV_REST_API_URL`:**
   - Find it in the list (or add if missing)
   - Click the **pencil/edit icon** ✏️
   - **Value:** Paste your **REST URL** from Upstash
   - **Environment:** Select **Production** (and **Preview** if needed)
   - Click **"Save"**

   **For `KV_REST_API_TOKEN`:**
   - Find it in the list (or add if missing)
   - Click the **pencil/edit icon** ✏️
   - **Value:** Paste your **REST Token** from Upstash
   - **Environment:** Select **Production** (and **Preview** if needed)
   - Click **"Save"**

**✅ That's it!** The code will automatically use these variables because it checks for `KV_REST_API_URL` first.

---

## Alternative: Use Upstash Variable Names

If you prefer to use the Upstash naming (also works):

1. **Add New Variables:**
   - Click **"Add New"**
   - **Key:** `UPSTASH_REDIS_REST_URL`
   - **Value:** Your REST URL from Upstash
   - **Environment:** Production
   - Click **"Save"**

   - Click **"Add New"** again
   - **Key:** `UPSTASH_REDIS_REST_TOKEN`
   - **Value:** Your REST Token from Upstash
   - **Environment:** Production
   - Click **"Save"**

**Note:** The code checks for both naming conventions, so either works!

---

## Step 3: Redeploy

After updating variables:

1. Go to **"Deployments"** tab
2. Click **three dots (⋯)** on latest deployment
3. Click **"Redeploy"**
4. Wait 1-2 minutes for deployment to complete

---

## Step 4: Test Connection

Visit your site and run this in browser console (F12):

```javascript
fetch('/api/users?action=all')
  .then(r => {
    console.log('Status:', r.status);
    return r.json();
  })
  .then(data => {
    if (r.status === 200) {
      console.log('✅ Database connected!', data);
    } else {
      console.log('⚠️ Response:', data);
    }
  })
  .catch(e => console.error('❌ Error:', e))
```

**Expected:** Status 200 = ✅ Working!

---

## Which Variables to Use?

**Both work!** The code checks in this order:
1. `UPSTASH_REDIS_REST_URL` (if exists, use it)
2. `KV_REST_API_URL` (fallback)

So you can use:
- ✅ `KV_REST_API_URL` + `KV_REST_API_TOKEN` (Vercel KV naming)
- ✅ `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (Upstash naming)
- ✅ Both (code will use Upstash names first)

**Recommendation:** Since Vercel already shows KV variables, just update those with your Upstash credentials. Easier and cleaner!

---

## Quick Checklist

- [ ] Got REST URL from Upstash console
- [ ] Got REST Token from Upstash console
- [ ] Updated `KV_REST_API_URL` in Vercel
- [ ] Updated `KV_REST_API_TOKEN` in Vercel
- [ ] Selected Production environment
- [ ] Redeployed project
- [ ] Tested API (status 200)

---

## Troubleshooting

### Still getting 503 errors?

1. **Check variable names:**
   - `KV_REST_API_URL` (not `kv_rest_api_url`)
   - `KV_REST_API_TOKEN` (not `kv_rest_api_token`)

2. **Check values:**
   - REST URL should start with `https://` and end with `.upstash.io`
   - REST Token should be a long string (no spaces)

3. **Check environment:**
   - Make sure **Production** is selected
   - Redeploy after updating

4. **Verify in Upstash:**
   - Database status should be "Active"
   - Credentials should match what you copied

---

## Summary

Since your code supports both naming conventions, you can:
- Use the existing `KV_REST_API_URL` and `KV_REST_API_TOKEN` variables
- Just update them with your new Upstash database credentials
- Redeploy and you're done!

No need to create new variables unless you want to use the Upstash naming specifically.
