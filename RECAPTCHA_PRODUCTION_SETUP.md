# reCAPTCHA Production Setup Guide

## Issue Description
The current reCAPTCHA configuration is causing 400 Bad Request errors on the production site (snapscape.app) because the reCAPTCHA site key is configured for localhost/development domains only.

## Root Cause
The hardcoded reCAPTCHA site key `6LegLkMrAAAAAOSRdKTQ33Oa6UT4EzOvqdhsSpM3` in the code is likely registered for localhost domains only, not for the production domain `snapscape.app`.

## Solution Steps

### 1. Create Production reCAPTCHA Keys

1. Go to the [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin/create)
2. Sign in with your Google account
3. Click "Create" to register a new site
4. Configure the new site:
   - **Label**: SnapScape Production
   - **reCAPTCHA type**: reCAPTCHA v3
   - **Domains**: Add the following domains:
     - `snapscape.app`
     - `www.snapscape.app`
     - `localhost` (for local testing)
     - `127.0.0.1` (for local testing)
   - Accept the Terms of Service
   - Click "Submit"

5. You will receive two keys:
   - **Site Key** (for client-side, starts with `6L...`)
   - **Secret Key** (for server-side, starts with `6L...`)

### 2. Update Vercel Environment Variables

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your SnapScape project
3. Go to Settings > Environment Variables
4. Add/Update the following variables:

   **For Production Environment:**
   ```
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY = [Your new production site key]
   RECAPTCHA_SECRET_KEY = [Your new production secret key]
   ```

   **For Development Environment (optional):**
   ```
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY = 6LegLkMrAAAAAOSRdKTQ33Oa6UT4EzOvqdhsSpM3
   RECAPTCHA_SECRET_KEY = [Your development secret key]
   ```

5. Save the environment variables
6. Redeploy the application

### 3. Test the Fix

1. After deployment, try registering a new account on snapscape.app
2. Check the browser console for any reCAPTCHA errors
3. Verify that the registration process completes successfully

### 4. Alternative Quick Fix (Temporary)

If you need an immediate fix while setting up new keys:

1. Go to the [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Find your existing site key `6LegLkMrAAAAAOSRdKTQ33Oa6UT4EzOvqdhsSpM3`
3. Click on it to edit
4. Add `snapscape.app` and `www.snapscape.app` to the domains list
5. Save the changes

## Environment Variables Reference

The application now uses environment variables instead of hardcoded keys:

- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`: Client-side site key (visible to users)
- `RECAPTCHA_SECRET_KEY`: Server-side secret key (kept secure)

## Verification

After implementing the fix, you should see:
- No more 400 Bad Request errors for `/api/verify-recaptcha`
- Successful user registration
- reCAPTCHA verification working properly

## Security Notes

1. **Never expose the secret key** in client-side code
2. **Use separate keys** for development and production
3. **Regularly monitor** reCAPTCHA usage in the admin console
4. **Set appropriate score thresholds** based on your traffic patterns

## Troubleshooting

If you still encounter issues:

1. Check the browser console for detailed error messages
2. Verify the domain configuration in reCAPTCHA admin console
3. Ensure environment variables are properly set in Vercel
4. Check server logs for reCAPTCHA verification details

## Contact

If you need assistance with this setup, please refer to:
- [Google reCAPTCHA Documentation](https://developers.google.com/recaptcha/docs/v3)
- [Vercel Environment Variables Guide](https://vercel.com/docs/concepts/projects/environment-variables) 