# Deployment Guide - Hosting Your Airway Bills App

This guide will walk you through deploying your application to Vercel and connecting your GoDaddy domain.

## Option 1: Vercel (Recommended - Free & Easy)

### Step 1: Prepare Your Repository

1. **Initialize Git (if not already done)**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create a `.gitignore` file** (if you don't have one):
   ```
   node_modules/
   .env
   *.log
   .DS_Store
   ```

3. **Push to GitHub**
   - Create a new repository on GitHub (don't initialize with README)
   - Follow GitHub's instructions to push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy to Vercel

1. **Sign up/Login to Vercel**
   - Go to https://vercel.com
   - Sign up/Login with your GitHub account (easiest option)

2. **Import Your Project**
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Select the repository you just pushed

3. **Configure Project Settings**
   - **Framework Preset:** Other (or leave as default)
   - **Root Directory:** `./` (root)
   - **Build Command:** Leave empty (no build needed)
   - **Output Directory:** Leave empty (root directory)
   - **Install Command:** Leave empty (or `npm install` if you want, but not needed for static files)

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment (usually takes 1-2 minutes)
   - Your site will be live at `your-project-name.vercel.app`

5. **Set up Redirects (for routing)**
   - After deployment, go to your project settings
   - Or create a `vercel.json` file in your project root (see below)

### Step 3: Connect Your GoDaddy Domain

1. **In Vercel Dashboard:**
   - Go to your project → "Settings" → "Domains"
   - Click "Add Domain"
   - Enter your domain (e.g., `yourdomain.com`)
   - Vercel will show you the DNS records you need to add

2. **In GoDaddy:**
   - Log into your GoDaddy account
   - Go to "My Products" → "DNS" or "Domain Manager"
   - Find your domain and click "DNS" or "Manage DNS"
   - **Update DNS Records:**
     - **For root domain (@):**
       - Type: `A`
       - Name: `@` (or leave blank)
       - Value: `76.76.21.21` (Vercel's IP - Vercel will show you the exact IP)
     - **For www subdomain:**
       - Type: `CNAME`
       - Name: `www`
       - Value: `cname.vercel-dns.com` (Vercel will show you the exact value)
   
   **OR** (Easier method - if Vercel supports it):
   - Change nameservers to Vercel's (Vercel will provide these in the domain settings)
   - This lets Vercel manage all DNS

3. **Wait for DNS propagation** (can take 24-48 hours, usually faster)
   - Vercel will show the status in the dashboard
   - Once verified, it will automatically provision SSL

4. **Enable HTTPS** (automatic with Vercel)
   - Vercel automatically provisions SSL certificates
   - Check "Settings" → "Domains" to verify SSL status

### Step 4: Create vercel.json (Optional but Recommended)

Create this file in your project root to handle routing:

```json
{
  "rewrites": [
    {
      "source": "/",
      "destination": "/login.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

This ensures:
- Root URL (`/`) redirects to `login.html`
- Security headers are added

---

## Option 2: Netlify (Alternative)

### Pros:
- Free
- Integrated with GitHub

### Cons:
- No server-side redirects (need to use `index.html` as entry point)
- Limited routing options

### Steps:

1. **Push code to GitHub** (same as Step 1 above)

2. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: `main` (or `master`)
   - Folder: `/ (root)`
   - Click Save

3. **Your site will be at:** `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

4. **For custom domain:**
   - Create a file named `CNAME` in your repo root with just your domain name:
     ```
     yourdomain.com
     ```
   - In GoDaddy DNS, add:
     - Type: `CNAME`
     - Name: `@` or `www`
     - Value: `YOUR_USERNAME.github.io`

---

## Option 3: GitHub Pages (Free, but Limited)

---

## Option 4: Render/Railway (For Node.js Server)

If you need the Express server running:

### Render:
1. Sign up at https://render.com
2. Create new "Web Service"
3. Connect GitHub repo
4. Build command: `npm install`
5. Start command: `npm start`
6. Add custom domain in Render dashboard

### Railway:
1. Sign up at https://railway.app
2. New Project → Deploy from GitHub
3. Select your repo
4. Railway auto-detects Node.js
5. Add custom domain

---

## Recommended: Vercel Setup

I recommend Vercel because:
- ✅ Free tier is generous
- ✅ Easy custom domain setup
- ✅ Automatic HTTPS
- ✅ Easy redirects/routing
- ✅ Fast CDN (global edge network)
- ✅ No server needed (your app works as static files)
- ✅ Great GitHub integration
- ✅ Automatic deployments on git push

---

## Quick Start Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel account created (or logged in)
- [ ] Site deployed on Vercel
- [ ] `vercel.json` created (optional)
- [ ] Custom domain added in Vercel
- [ ] DNS updated in GoDaddy
- [ ] Wait for DNS propagation
- [ ] Test your live site!

---

## Troubleshooting

**DNS not working?**
- Wait 24-48 hours for propagation
- Use https://dnschecker.org to check globally
- Clear browser cache

**Site not loading?**
- Check Vercel deployment logs
- Verify all files are in the repository
- Check browser console for errors

**HTTPS issues?**
- Vercel handles this automatically
- Wait a few minutes after adding domain
- Check domain status in Vercel dashboard

---

## Need Help?

If you run into issues, check:
- Vercel docs: https://vercel.com/docs
- GoDaddy DNS help: https://www.godaddy.com/help
