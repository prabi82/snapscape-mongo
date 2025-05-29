# Simple SnapScape Deployment Guide

## 🚀 Quick Deployment (Choose One Method)

### Method 1: Using Batch Script (Windows)
```bash
# Simply double-click or run:
deploy.bat
```

### Method 2: Using PowerShell Script
```powershell
# Right-click and "Run with PowerShell" or run:
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

### Method 3: Manual Step-by-Step

#### Prerequisites
- Ensure you're in the project directory: `C:\xampp\htdocs\snapscape-stable`
- Vercel CLI installed: `npm install -g vercel`
- Logged into Vercel: `vercel login`

#### Steps

1. **Check and commit changes:**
```bash
git status
git add .
git commit -m "Your commit message here"
git push origin main
```

2. **Clean and build:**
```bash
# Clean previous build
if exist .next rmdir /s /q .next

# Build application
npm run build
```

3. **Deploy to Vercel:**
```bash
vercel --prod --yes
```

## 🔧 Troubleshooting

### If Vercel CLI is not installed:
```bash
npm install -g vercel
vercel login
```

### If build fails:
```bash
# Clear node modules and reinstall
rmdir /s /q node_modules
del package-lock.json
npm install
npm run build
```

### If git push fails:
```bash
# Check git status
git status
git remote -v

# Force push if needed (use carefully)
git push origin main --force
```

### If Vercel deployment hangs:
- Press `Ctrl+C` to cancel
- Try again with: `vercel --prod`
- Or use the Vercel dashboard to deploy from GitHub

## 📋 Deployment Checklist

Before deploying:
- [ ] All changes tested locally
- [ ] No console errors
- [ ] Environment variables updated in Vercel dashboard if needed
- [ ] Google OAuth credentials updated if needed

After deploying:
- [ ] Visit production URL to verify
- [ ] Test user authentication
- [ ] Test critical features
- [ ] Check for any runtime errors

## 🌐 Production URLs

- **Current Production**: https://snapscape-mongo-ng6o63fqb-prabikrishna-gmailcoms-projects.vercel.app
- **Vercel Dashboard**: https://vercel.com/dashboard

## 📞 Quick Commands Reference

```bash
# Check current status
git status
git branch

# Quick commit and push
git add . && git commit -m "Update" && git push origin main

# Quick build and deploy
npm run build && vercel --prod --yes

# Check Vercel status
vercel --version
vercel whoami
vercel list
```

---

**Note**: The automated scripts (`deploy.bat` and `deploy.ps1`) handle all these steps automatically with error checking and user-friendly output. 