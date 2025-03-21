# Google OAuth Setup Guide for SnapScape

## Issue Summary

The authentication system is facing two key issues:

1. **Build Error**: The `.next/server/app-paths-manifest.json` file was missing or corrupted, causing build failures.
2. **Google OAuth Configuration**: The Google OAuth credentials are missing, leading to the error: `client_id is required`.

## Solution Steps

### 1. Fix Build Issues

We've created and executed a cleanup script (`cleanup.ps1`) that:
- Stops any Node.js processes that might be locking files
- Removes the `.next` directory to clear corrupted build artifacts
- Restarts the development server with a fresh build

### 2. Set Up Google OAuth Credentials

To properly enable Google authentication, follow these steps:

1. **Create Google OAuth Credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application" as the Application Type
   - Set an appropriate name like "SnapScape Development"

2. **Configure Authorized Origins**:
   - Add `http://localhost:3002` to "Authorized JavaScript origins"
   
3. **Configure Redirect URIs**:
   - Add `http://localhost:3002/api/auth/callback/google` to "Authorized redirect URIs"
   - This is the callback URL that NextAuth.js uses to complete the authentication process

4. **Add Credentials to Environment File**:
   - Once created, copy your Client ID and Client Secret
   - Add them to `.env.development.local` file:
     ```
     GOOGLE_CLIENT_ID="your_client_id_here"
     GOOGLE_CLIENT_SECRET="your_client_secret_here"
     ```

5. **Restart Your Development Server**:
   - Stop the current server (if running)
   - Run `npm run dev`

## Environment Files Explained

When running locally, Next.js loads environment variables from these files in order (later files override earlier ones):

1. `.env` (lowest priority)
2. `.env.local` 
3. `.env.development`
4. `.env.development.local` (highest priority for development)

Your local development should use `.env.development.local` with these settings:
- `NEXTAUTH_URL="http://localhost:3002"`
- `NEXTAUTH_SECRET="your_secret_here"`
- `GOOGLE_CLIENT_ID="your_client_id_here"`
- `GOOGLE_CLIENT_SECRET="your_client_secret_here"`

## Testing Authentication

Once set up:
1. Navigate to http://localhost:3002/auth/login
2. Click "Sign in with Google"
3. Complete the Google authentication flow
4. You should be redirected back to your application

## Troubleshooting

If you continue to face issues:
1. Check the server logs for detailed error messages
2. Ensure your OAuth credentials are correctly set in `.env.development.local`
3. Verify the redirect URI matches exactly what's configured in Google Cloud Console
4. Try running the cleanup script again: `.\cleanup.ps1`

## Production Configuration

For production deployment:
1. Create separate OAuth credentials with production URLs
2. Configure the Vercel environment variables with production values 