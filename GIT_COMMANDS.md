# Git Commands to Complete Setup

Run these commands in your terminal (the same one where you ran `git init`):

## Step 1: Set Your Git Identity

Replace with your actual GitHub email and name:

```bash
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"
```

**Example:**
```bash
git config --global user.email "vince@example.com"
git config --global user.name "Vince"
```

## Step 2: Complete the Commit

Now that your identity is set, commit again:

```bash
git commit -m "Initial commit"
```

## Step 3: Update Remote URL

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name:

```bash
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

**Example:**
If your GitHub username is `vince123` and your repo is `airwaybills`:
```bash
git remote set-url origin https://github.com/vince123/airwaybills.git
```

## Step 4: Push to GitHub

```bash
git push -u origin main
```

When prompted:
- **Username:** Your GitHub username
- **Password:** Use a Personal Access Token (not your GitHub password)
  - Get one at: https://github.com/settings/tokens
  - Click "Generate new token (classic)"
  - Check the `repo` scope
  - Copy the token and use it as your password

---

## All Commands in Order:

```bash
# 1. Set your identity
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"

# 2. Commit
git commit -m "Initial commit"

# 3. Update remote (replace with your actual GitHub URL)
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 4. Push
git push -u origin main
```
