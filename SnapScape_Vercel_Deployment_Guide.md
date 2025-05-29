# SnapScape Vercel Deployment Guide

## 🚀 Automated Deployment (Recommended)

### Quick Start
The easiest way to deploy SnapScape is using the automated deployment scripts:

#### Method 1: Windows Batch Script
```bash
# Double-click or run from command prompt:
deploy.bat
```

#### Method 2: PowerShell Script (Cursor/IDE Compatible)
```powershell
# From terminal or Cursor:
powershell -ExecutionPolicy Bypass -File deploy.ps1

# Or directly:
.\deploy.ps1
```

#### Method 3: Cursor IDE Task
1. Press `Ctrl+Shift+P`
2. Type "Tasks: Run Task"
3. Select "Deploy to Vercel"

## 📋 Prerequisites

Before using the deployment scripts, ensure you have:

- [x] **Node.js and npm** installed
- [x] **Git** configured with GitHub access
- [x] **Vercel CLI** installed: `npm install -g vercel`
- [x] **Vercel account** logged in: `vercel login`
- [x] **Project directory**: `C:\xampp\htdocs\snapscape-stable`

## 🔧 One-Time Setup

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Verify Setup
```bash
vercel whoami
vercel list
```

## 🎯 What the Deployment Scripts Do

Both `deploy.bat` and `deploy.ps1` perform these steps automatically:

1. **✅ Check Git Status** - Detect uncommitted changes
2. **📝 Add & Commit Changes** - Stage and commit with custom message
3. **⬆️ Push to Main Branch** - Upload to GitHub repository
4. **🧹 Clean Previous Build** - Remove old `.next` folder
5. **🔨 Build Application** - Run `npm run build` with validation
6. **🔍 Verify Vercel CLI** - Ensure deployment tools are ready
7. **🚀 Deploy to Production** - Execute `vercel --prod --yes`
8. **🎉 Success Confirmation** - Display deployment URL and status

## 🛠️ Manual Deployment (Fallback)

If automated scripts fail, use these manual steps:

```bash
# 1. Commit and push changes
git add .
git commit -m "Deploy: Your commit message"
git push origin main

# 2. Clean and build
if exist .next rmdir /s /q .next
npm run build

# 3. Deploy to Vercel
vercel --prod --yes
```

## ✅ Build Success Indicators

Look for these positive signs during deployment:

- `✓ Compiled successfully`
- `✓ Collecting page data`
- `✓ Generating static pages`
- `✓ Finalizing page optimization`
- `✅ Cloudinary initialized successfully`
- No TypeScript or linting errors

## 🚨 Troubleshooting

### Vercel CLI Issues
```bash
# Reinstall Vercel CLI
npm uninstall -g vercel
npm install -g vercel
vercel login
```

### Build Failures
```bash
# Clear dependencies and rebuild
rmdir /s /q node_modules
del package-lock.json
npm install
npm run build
```

### Git Push Problems
```bash
# Check git configuration
git status
git remote -v

# Force push if needed (use carefully)
git push origin main --force
```

### PowerShell Execution Policy
```powershell
# If PowerShell script is blocked
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 🌐 Production Environment

### Current URLs
- **Production**: https://snapscape-mongo-ng6o63fqb-prabikrishna-gmailcoms-projects.vercel.app
- **Vercel Dashboard**: https://vercel.com/dashboard

### Environment Variables
Ensure these are configured in Vercel Dashboard:
- Database connection strings
- Cloudinary credentials
- Google OAuth credentials
- Email service credentials
- NextAuth secret

## 📊 Deployment Checklist

### Pre-Deployment
- [ ] All changes tested locally (`npm run dev`)
- [ ] No console errors in browser
- [ ] Critical features working (auth, uploads, competitions)
- [ ] Environment variables updated if needed

### Post-Deployment
- [ ] Visit production URL to verify
- [ ] Test user authentication (Google OAuth)
- [ ] Test photo submission and voting
- [ ] Test admin functions
- [ ] Check competition reminders functionality
- [ ] Verify no runtime errors in browser console

## 🔄 Deployment Workflow

### Development Process
1. Make changes locally
2. Test with `npm run dev`
3. Run deployment script (`deploy.bat` or `deploy.ps1`)
4. Verify production deployment
5. Test critical functionality

### Emergency Rollback
```bash
# Find previous commit
git log --oneline -5

# Reset to previous version
git reset --hard <previous-commit-hash>
git push origin main --force

# Redeploy
vercel --prod --yes
```

## 📞 Quick Commands

```bash
# Check deployment status
vercel --version
vercel whoami
vercel list

# Quick build test
npm run build

# Check git status
git status
git branch

# View recent commits
git log --oneline -5
```

## 🔐 Security Notes

- Never commit sensitive environment variables
- Keep dependencies updated
- Monitor Vercel usage and logs
- Regularly rotate API keys and secrets

---

**Last Updated**: January 2025  
**Deployment Method**: Automated Scripts (`deploy.bat` / `deploy.ps1`)  
**Vercel CLI**: Latest version  
**Node.js**: Check with `node --version` 