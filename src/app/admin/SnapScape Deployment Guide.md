SnapScape Deployment Guide

## Prerequisites
- Node.js and npm installed
- Git configured
- Access to the SnapScape repository and Vercel account
- Domain access for snapscape.app (if deploying to production)

## Deployment Steps

### 1. Prepare the Code
```bash
git checkout dev
git pull origin dev
```

### 2. Pre-Deployment Checks
- Ensure all code changes are tested locally
- Verify environment variables in .env.local and .env.production
- Check Cloudinary configuration is correct
- Verify MongoDB connection strings for all environments
- Test admin user authentication and redirection locally

### 3. Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### 4. Authenticate with Vercel
```bash
vercel login
```
Choose the appropriate authentication method (GitHub, GitLab, etc.)

### 5. Common Build Issues to Check Before Deployment
- Next.js Client Components using Server Hooks:
  - Ensure all useSearchParams() hooks are wrapped in Suspense boundaries
  - Check for any other hooks that require Suspense boundaries
- Verify admin middleware redirects are working correctly
- Test session handling and token validation

### 6. Deploy Using the Script
```bash
./deploy.ps1
```
The script handles:
- Cleaning previous builds
- Building the application
- Deploying to Vercel

### 7. Manual Deployment (if script fails)
```powershell
# Clean up previous builds
if (Test-Path ".next") { Remove-Item -Path ".next" -Recurse -Force }
# Build the application
npm run build
# Deploy to Vercel
vercel --prod --yes
```

### 8. Deploying to snapscape.app

#### A. Initial Setup
1. Configure domain in Vercel:
   - Go to Vercel dashboard
   - Select the SnapScape project
   - Navigate to Settings > Domains
   - Add snapscape.app as a production domain
   - Follow Vercel's DNS configuration instructions

2. Environment Variables:
   - Ensure NEXTAUTH_URL is set to https://snapscape.app
   - Verify all MongoDB connection strings are correct
   - Check Cloudinary configuration
   - Set appropriate NODE_ENV for production

#### B. Deployment Process
1. Deploy to Production:
   ```bash
   vercel --prod
   ```
   Or use the deploy script:
   ```bash
   ./deploy.ps1
   ```

2. Verify Deployment:
   - Visit https://snapscape.app
   - Test admin login and redirection
   - Check user authentication flows
   - Verify photo uploads and competitions

#### C. Post-Deployment Tasks
1. Clear Browser Cache:
   - Instruct users to clear their browser cache if experiencing issues
   - Provide the reset session URL: https://snapscape.app/auth/reset-session

2. Monitor Logs:
   - Check Vercel deployment logs for any errors
   - Monitor MongoDB connection status
   - Verify Cloudinary uploads

### 9. Troubleshooting

#### Build Errors
- Check the build logs for specific component errors
- Look for hooks that need Suspense boundaries
- Address any TypeScript or linting errors

#### Deployment Errors
- Verify Vercel authentication
- Check project configuration in vercel.json
- Confirm environment variables are set in Vercel dashboard

#### Common Issues on snapscape.app
1. Admin Redirection Issues:
   - Check middleware.ts configuration
   - Verify JWT token validation
   - Test admin role assignment
   - Use the debug token page: https://snapscape.app/auth/debug-token

2. Session Problems:
   - Clear browser cache and cookies
   - Use the reset session page
   - Check NEXTAUTH_SECRET configuration

3. Database Connection:
   - Verify MongoDB connection strings
   - Check network connectivity
   - Monitor database performance

### 10. Post-Deployment Verification
- Visit the deployed URL to confirm functionality
- Test critical features:
  - Authentication (both user and admin)
  - Photo submission
  - Ratings system
  - Admin dashboard access
- Verify database connections and API endpoints
- Test on multiple browsers and devices

## Important Notes
- The deploy.ps1 script contains fallback logic if builds fail
- Vercel projects have a 50MB output size limit
- Remember to check Cloudinary initialization in deployed environment
- Keep deployment logs for troubleshooting
- Monitor error rates and performance metrics
- Regular backups of MongoDB data
- Document any environment-specific configurations