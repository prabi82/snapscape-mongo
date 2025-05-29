# SnapScape Vercel Deployment Guide

## 📋 Prerequisites

- [x] Node.js and npm installed
- [x] Git configured with GitHub access
- [x] Vercel CLI installed globally: `npm install -g vercel`
- [x] Vercel account connected to GitHub repository
- [x] Environment variables configured in Vercel dashboard

## 🚀 Standard Deployment Process

### Step 1: Prepare Your Changes
```bash
# Navigate to project directory
cd C:\xampp\htdocs\snapscape-stable

# Check current branch and status
git status
git branch
```

### Step 2: Work on Development Branch
```bash
# Switch to dev branch for development
git checkout dev
git pull origin dev

# Make your changes...
# Test locally with: npm run dev
```

### Step 3: Commit Your Changes
```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Description of changes made"

# Push to dev branch
git push origin dev
```

### Step 4: Deploy to Production
```bash
# Switch to main branch (connected to production)
git checkout main

# Merge dev changes into main
git merge dev

# Push to main branch
git push origin main

# Clean previous builds
if exist .next rmdir /s /q .next

# Build the application
npm run build

# Deploy to Vercel production
vercel --prod --yes
```

## 🛠️ Alternative: Using Deploy Script

If the `deploy.ps1` script is available:

```bash
# From main branch
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

## 🔍 Build Verification Checklist

### ✅ Successful Build Indicators:
- [ ] `✓ Compiled successfully`
- [ ] `✓ Collecting page data`
- [ ] `✓ Generating static pages`
- [ ] `✓ Finalizing page optimization`
- [ ] Cloudinary initialization successful
- [ ] No TypeScript errors
- [ ] No linting errors

### ✅ Successful Deployment Indicators:
- [ ] Vercel CLI shows version (e.g., `Vercel CLI 41.7.6`)
- [ ] Inspect URL provided
- [ ] Production URL provided
- [ ] No error messages during deployment

## 🚨 Troubleshooting Common Issues

### Build Failures
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next

# Try build again
npm run build
```

### Git Push Issues
```bash
# If git push hangs, check authentication
git config --list | grep user

# Force push if needed (use carefully)
git push origin main --force

# Check remote URL
git remote -v
```

### Vercel Authentication Issues
```bash
# Re-login to Vercel
vercel login

# Check current user
vercel whoami

# List projects
vercel list
```

### Environment Variables
- Verify all required environment variables are set in Vercel dashboard
- Check `.env.local.example` for required variables
- Ensure Cloudinary credentials are properly configured

## 📊 Build Output Analysis

### Typical Build Size Expectations:
- **Main page**: ~4.7 kB + 137 kB First Load JS
- **Competition pages**: ~9.7 kB + 148 kB First Load JS
- **Admin pages**: ~3-6 kB + 130-146 kB First Load JS
- **Total routes**: ~100+ pages generated

### Performance Indicators:
- All pages should show `○ (Static)` or `ƒ (Dynamic)`
- Middleware size: ~53.7 kB
- No bundle size warnings

## 🔄 Branch Management

### Development Workflow:
1. **dev branch**: Development and testing
2. **main branch**: Production deployment
3. **feature branches**: For specific features (optional)

### Branch Commands:
```bash
# Create feature branch
git checkout -b feature/new-feature

# Switch between branches
git checkout dev
git checkout main

# Merge feature into dev
git checkout dev
git merge feature/new-feature

# Delete feature branch
git branch -d feature/new-feature
```

## 📝 Deployment Checklist

### Pre-Deployment:
- [ ] All changes tested locally
- [ ] No console errors in browser
- [ ] All features working as expected
- [ ] Database connections verified
- [ ] Environment variables updated if needed

### During Deployment:
- [ ] Build completes without errors
- [ ] All pages generate successfully
- [ ] Cloudinary initialization successful
- [ ] Vercel deployment completes

### Post-Deployment:
- [ ] Visit production URL to verify
- [ ] Test critical features:
  - [ ] User authentication
  - [ ] Photo submission
  - [ ] Competition viewing
  - [ ] Admin functions (if applicable)
- [ ] Check for any runtime errors
- [ ] Verify database connectivity

## 🌐 Production URLs

### Current Production:
- **Main URL**: https://snapscape-mongo-ng6o63fqb-prabikrishna-gmailcoms-projects.vercel.app
- **Inspect URL**: https://vercel.com/prabikrishna-gmailcoms-projects/snapscape-mongo/

### Custom Domain (if configured):
- Update this section when custom domain is set up

## 📞 Emergency Procedures

### Rollback to Previous Version:
```bash
# Find previous commit hash
git log --oneline -10

# Reset to previous commit
git reset --hard <previous-commit-hash>

# Force push (use with caution)
git push origin main --force

# Redeploy
vercel --prod --yes
```

### Quick Hotfix:
```bash
# Make urgent fix directly on main
git checkout main

# Make minimal changes
# Test quickly

# Commit and deploy
git add .
git commit -m "Hotfix: urgent issue description"
git push origin main
vercel --prod --yes
```

## 📈 Monitoring and Maintenance

### Regular Checks:
- Monitor Vercel dashboard for deployment status
- Check application logs for errors
- Verify database performance
- Monitor Cloudinary usage

### Monthly Tasks:
- Update dependencies: `npm update`
- Review and clean up old branches
- Check Vercel usage limits
- Backup important data

## 🔐 Security Notes

- Never commit sensitive environment variables
- Regularly rotate API keys and secrets
- Keep dependencies updated for security patches
- Monitor for unusual activity in logs

---

**Last Updated**: January 2025
**Deployment Tool**: Vercel CLI 41.7.6
**Node.js Version**: Check with `node --version`
**Next.js Version**: 15.2.0 