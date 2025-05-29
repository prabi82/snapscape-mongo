SnapScape Deployment Guide
Prerequisites
Node.js and npm installed
Git configured
Access to the SnapScape repository and Vercel account

Deployment Steps
1. Prepare the Code
Apply to layout.tsx
git checkout devgit pull origin dev

2. Pre-Deployment Checks
Ensure all code changes are tested locally
Verify environment variables in .env.local and .env.production
Check Cloudinary configuration is correct

3. Install Vercel CLI (if not already installed)
Apply to layout.tsx
npm install -g vercel
4. Authenticate with Vercel
Apply to layout.tsx
vercel login
Choose the appropriate authentication method (GitHub, GitLab, etc.)

5. Common Build Issues to Check Before Deployment
Next.js Client Components using Server Hooks:
Ensure all useSearchParams() hooks are wrapped in Suspense boundaries
Check for any other hooks that require Suspense boundaries

6. Deploy Using the Script
Apply to layout.tsx
./deploy.ps1
The script handles:
Cleaning previous builds
Building the application
Deploying to Vercel

7. Manual Deployment (if script fails)
Apply to layout.tsx
# Clean up previous buildsif (Test-Path ".next") { Remove-Item -Path ".next" -Recurse -Force }# Build the applicationnpm run build# Deploy to Vercelvercel --prod --yes

8. Troubleshooting
Build errors:
Check the build logs for specific component errors
Look for hooks that need Suspense boundaries
Address any TypeScript or linting errors
Deployment errors:
Verify Vercel authentication
Check project configuration in vercel.json
Confirm environment variables are set in Vercel dashboard

9. Post-Deployment Verification
Visit the deployed URL to confirm functionality
Test critical features (authentication, photo submission, ratings)
Verify database connections and API endpoints
Important Notes
The deploy.ps1 script contains fallback logic if builds fail
Vercel projects have a 50MB output size limit
Remember to check Cloudinary initialization in deployed environment