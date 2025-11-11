# GitHub Setup Guide

Your repository is initialized and ready! Follow these steps to push to GitHub.

## Step 1: Create a GitHub Repository

### Option A: Via GitHub Website (Easiest)

1. Go to [github.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Fill in:
   - **Repository name**: `secretsanta` (or your preferred name)
   - **Description**: "Secret Santa gift exchange management app"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. Click **"Create repository"**

### Option B: Via GitHub CLI (if installed)

```bash
gh repo create secretsanta --public --source=. --remote=origin --push
```

## Step 2: Connect Local Repository to GitHub

After creating the repository on GitHub, you'll see a page with commands. Use these:

```bash
cd /Users/chriswilliamson/projects/secretsanta

# Add the remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/secretsanta.git

# Or if you prefer SSH (if you have SSH keys set up):
# git remote add origin git@github.com:YOUR_USERNAME/secretsanta.git

# Push to GitHub
git push -u origin main
```

## Step 3: Verify

1. Go to your GitHub repository page
2. You should see all your files there
3. Make sure `backend/database.sqlite` and `.env` files are NOT visible (they should be ignored)

## Future Updates

After making changes:

```bash
git add .
git commit -m "Your commit message"
git push
```

## Troubleshooting

**"Repository not found"**: Check that you've created the repo on GitHub first
**"Permission denied"**: Make sure you're authenticated with GitHub (check `gh auth status` or configure SSH keys)
**"Remote origin already exists"**: Run `git remote remove origin` first, then add it again

