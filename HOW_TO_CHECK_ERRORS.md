# How to Check API Errors in Vercel

## Option 1: Check Deployment Logs (Easiest)

1. Go to **Vercel Dashboard** → Your Project
2. Click **"Deployments"** tab
3. Click on the **latest deployment** (most recent one)
4. Click **"View Build Logs"** or **"View Function Logs"**
5. Look for errors related to `/api/users`

## Option 2: Check Real-Time Logs

1. Go to **Vercel Dashboard** → Your Project
2. Click **"Deployments"** tab
3. Click on the **latest deployment**
4. Look for **"Functions"** section or **"Runtime Logs"**
5. Try creating an admin again while watching the logs

## Option 3: Check Browser Console (Quickest)

1. Visit your site: `https://your-site.vercel.app/create-admin.html`
2. Open browser console (F12)
3. Try creating an admin
4. Look for the error in the console
5. Check the **Network** tab:
   - Click "Network" tab
   - Try creating admin again
   - Click on the `/api/users?action=register` request
   - Check the "Response" tab for the error message

## Option 4: Use the Debug Tool

1. Visit: `https://your-site.vercel.app/debug-admin-error.html`
2. Click "Test Create Admin (with detailed error)"
3. It will show you the exact error message

## What to Look For

Common errors you might see:

- **503 Service Unavailable** = Database not configured
- **500 Internal Server Error** = Server-side error (check logs)
- **400 Bad Request** = Validation error (missing fields, duplicate email)
- **Network Error** = API endpoint not found or CORS issue

## If Functions Tab is Empty

If you don't see functions listed:
1. Functions only appear after they've been called at least once
2. Try accessing `/api/users?action=all` in your browser
3. Then check the Functions tab again
4. Or check the Deployments → Latest → Logs instead
