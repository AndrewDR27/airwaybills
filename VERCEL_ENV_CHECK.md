# Vercel Environment & Configuration Check

## Potential Issues:

### 1. **Build Settings in Vercel Dashboard**

Go to your Vercel project → **Settings** → **General**:

- **Framework Preset:** Should be "Other" or "Vite" (not "Next.js" or "Create React App")
- **Root Directory:** Should be `./` (root)
- **Build Command:** Should be **EMPTY** (no build needed for static files)
- **Output Directory:** Should be **EMPTY** or `.` (root)
- **Install Command:** Can be empty or `npm install` (but not needed if no build)

### 2. **Environment Variables**

Your app uses `server.js` which reads `process.env.PORT`, but:
- **For static sites on Vercel, you don't need environment variables**
- Vercel automatically provides `PORT` if needed
- The `.env` file is only for local development

**You don't need to set any environment variables in Vercel** for this static site.

### 3. **The Real Issue**

The "Cannot GET /login.html" error suggests:
1. **Files aren't on GitHub** - Check: https://github.com/AndrewDR27/airwaybills
2. **Vercel hasn't deployed the latest commit** - Check deployment shows commit `b1c757c`
3. **Build is failing** - Check deployment logs in Vercel dashboard

## Quick Fix Steps:

1. **Verify files on GitHub:**
   - Go to: https://github.com/AndrewDR27/airwaybills
   - Click on `login.html` - does it open?

2. **Check Vercel Build Settings:**
   - Project → Settings → General
   - Set Framework Preset to "Other"
   - Clear Build Command (leave empty)
   - Clear Output Directory (leave empty)

3. **Redeploy:**
   - Go to Deployments tab
   - Click "Redeploy" on latest deployment
   - Or make a small change and push to trigger auto-deploy

4. **Check Deployment Logs:**
   - Open the latest deployment
   - Click "View Build Logs"
   - Look for any errors about missing files

## Most Likely Issue:

The files probably aren't actually committed to GitHub. Run this to verify:

```bash
git ls-files | grep "\.html$"
```

This should list all HTML files. If `login.html` isn't in the list, it wasn't committed.
