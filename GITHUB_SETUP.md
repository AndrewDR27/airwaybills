# How to Push Your Code to GitHub

Follow these steps to get your code on GitHub and ready for deployment.

## Step 1: Install Git (if not already installed)

1. **Download Git for Windows:**
   - Go to https://git-scm.com/download/win
   - Download the installer
   - Run the installer with default settings (just click "Next" through all prompts)

2. **Verify Installation:**
   - Open a new PowerShell or Command Prompt window
   - Type: `git --version`
   - You should see a version number (e.g., `git version 2.42.0`)

## Step 2: Create a GitHub Account (if you don't have one)

1. Go to https://github.com
2. Click "Sign up"
3. Create your account (it's free)

## Step 3: Create a New Repository on GitHub

1. **Log into GitHub**
2. **Click the "+" icon** in the top right corner
3. **Select "New repository"**
4. **Fill in the details:**
   - Repository name: `airwaybills` (or whatever you want to call it)
   - Description: (optional) "Airway Bills PDF Form Application"
   - **Make it Public** (or Private if you prefer)
   - **DO NOT** check "Initialize this repository with a README" (we already have files)
   - **DO NOT** add .gitignore or license (we'll use existing files)
5. **Click "Create repository"**

## Step 4: Initialize Git in Your Project Folder

Open PowerShell or Command Prompt in your project folder and run these commands:

```powershell
# Navigate to your project folder (if not already there)
cd "C:\Users\vince\OneDrive\Desktop\airwaybills"

# Initialize git repository
git init

# Add all files to git
git add .

# Create your first commit
git commit -m "Initial commit - ready for deployment"

# Add your GitHub repository as remote (replace YOUR_USERNAME and YOUR_REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

**Important:** Replace `YOUR_USERNAME` with your GitHub username and `YOUR_REPO_NAME` with the repository name you created in Step 3.

## Step 5: Authenticate with GitHub

When you run `git push`, you'll be prompted to authenticate:

### Option A: Personal Access Token (Recommended)
1. GitHub will prompt for username and password
2. **Username:** Your GitHub username
3. **Password:** You need to use a Personal Access Token (not your GitHub password)
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - Give it a name like "Airway Bills Deployment"
   - Select expiration (90 days or no expiration)
   - Check the `repo` scope (full control of private repositories)
   - Click "Generate token"
   - **Copy the token immediately** (you won't see it again!)
   - Use this token as your password when pushing

### Option B: GitHub CLI (Alternative)
- Install GitHub CLI: https://cli.github.com
- Run `gh auth login` and follow prompts

## Quick Reference Commands

Once set up, here are the commands you'll use:

```powershell
# Check status of your files
git status

# Add all changed files
git add .

# Commit changes with a message
git commit -m "Description of what you changed"

# Push to GitHub
git push

# Pull latest changes (if working from multiple computers)
git pull
```

## Troubleshooting

**"git is not recognized"**
- Git is not installed or not in PATH
- Install Git from https://git-scm.com/download/win
- Restart your terminal after installation

**"Authentication failed"**
- Make sure you're using a Personal Access Token, not your GitHub password
- Generate a new token at https://github.com/settings/tokens

**"Repository not found"**
- Check that the repository name and username are correct
- Make sure the repository exists on GitHub
- Verify you have access to the repository

**"Permission denied"**
- Make sure you're logged into the correct GitHub account
- Check that your Personal Access Token has the `repo` scope

## Next Steps

Once your code is on GitHub:
1. ✅ Your code is backed up
2. ✅ Ready to deploy to Vercel
3. ✅ Can share with others
4. ✅ Version control is set up

Then proceed to the Vercel deployment steps in `DEPLOYMENT.md`!
