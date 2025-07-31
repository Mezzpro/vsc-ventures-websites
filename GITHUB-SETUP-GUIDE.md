# GitHub Setup Guide for VSCode Ventures

## 📋 Prerequisites

1. **GitHub Account**: Make sure you have a GitHub account
2. **GitHub Personal Access Token**: You'll need a token with 'repo' permissions

## 🔑 Getting Your GitHub Token

1. Go to [GitHub Settings - Tokens](https://github.com/settings/tokens)
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name like "VSCode Ventures Deploy"
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
5. Click "Generate token"
6. **COPY THE TOKEN NOW** (you won't see it again!)

## 🚀 Initial Setup (One Time Only)

### Step 1: Create .env File (Recommended)

Run this to create your .env file with all settings:
```cmd
cd C:\Users\Owner\Desktop\Projects\vscode-venture\docs\pg-docs\vsc-ventures-websites
scripts\setup-env.bat
```

This will:
- Ask for your GitHub token
- Ask for your GitHub username
- Create a .env file with all settings
- Keep your token secure

### Step 2: Create GitHub Repository

After creating your .env file, run:
```cmd
scripts\setup-github.bat
```

### Alternative: Manual Setup (Without .env)

1. **Set your GitHub token**:
   ```cmd
   set GITHUB_TOKEN=ghp_YourTokenHere
   ```

2. **Run the setup script**:
   ```cmd
   cd C:\Users\Owner\Desktop\Projects\vscode-venture\docs\pg-docs\vsc-ventures-websites
   scripts\setup-github.bat
   ```

### Option 2: Using Node.js Directly

1. **Set your GitHub token**:
   ```cmd
   set GITHUB_TOKEN=ghp_YourTokenHere
   ```

2. **Optional: Set your GitHub username** (if repo already exists):
   ```cmd
   set GITHUB_USERNAME=YourGitHubUsername
   ```

3. **Run the setup**:
   ```cmd
   cd C:\Users\Owner\Desktop\Projects\vscode-venture\docs\pg-docs\vsc-ventures-websites
   node scripts/github-setup.js
   ```

## 📤 Pushing Updates (Regular Use)

After the initial setup, use this to push changes:

### Option 1: Using Batch File
```cmd
scripts\push-to-github.bat
```

### Option 2: Using Node.js
```cmd
node scripts/github-push.js
```

The script will:
- Show you what files changed
- Ask for a commit message
- Pull latest changes
- Push to GitHub
- Trigger Cloudflare deployment automatically

## 🔧 Troubleshooting

### "GITHUB_TOKEN not found"
Make sure you set the token:
```cmd
set GITHUB_TOKEN=ghp_YourTokenHere
```

### "Repository already exists"
This is fine! The script will connect to the existing repo. Just make sure to set your username:
```cmd
set GITHUB_USERNAME=YourGitHubUsername
```

### "Permission denied"
Your token might not have the right permissions. Create a new token with `repo` scope.

### "Failed to push"
Try pulling first:
```cmd
git pull origin main --rebase
```

## 💡 Quick Commands Reference

```cmd
# First time setup (with .env - recommended)
scripts\setup-env.bat      # Create .env file
scripts\setup-github.bat   # Create repo and push

# First time setup (without .env)
set GITHUB_TOKEN=ghp_YourTokenHere
scripts\setup-github.bat

# Regular pushes
scripts\push-to-github.bat

# Check status
git status

# View remote URL
git remote -v
```

## 🔒 Security Best Practices

1. **Use .env file**: Keeps your token secure and out of command history
2. **Never commit .env**: It's already in .gitignore
3. **Token permissions**: Only give the minimum required permissions (repo)
4. **Rotate tokens**: Change your token periodically for security

## 🎯 What Happens Next?

1. **GitHub**: Your code is pushed to `https://github.com/YourUsername/vsc-ventures-websites`
2. **Cloudflare**: Automatically detects the push and starts deployment
3. **Live Site**: Your changes go live in ~5 minutes at `alpha-workspace.com`

## 📝 Important Notes

- Keep your GitHub token secret! Never commit it to the repository
- The token is only needed on your local machine
- Cloudflare will use its own authentication to pull from GitHub
- All ventures are in the same repository but deploy to different domains