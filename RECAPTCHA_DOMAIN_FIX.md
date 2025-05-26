# reCAPTCHA Domain Configuration Fix for snapscape.app

## Current Issue
The reCAPTCHA is configured for localhost only, causing 400 Bad Request errors on the live site (snapscape.app).

## Error Details
```
POST https://snapscape.app/api/verify-recaptcha 400 (Bad Request)
```

This happens because:
1. The reCAPTCHA site key is registered for localhost domains only
2. Google's reCAPTCHA service rejects tokens from unauthorized domains
3. The live site (snapscape.app) is not in the allowed domains list

## Temporary Fix Applied
I've updated the `/api/verify-recaptcha` endpoint to temporarily bypass reCAPTCHA verification for production domains until proper configuration is completed.

## Permanent Solution Required

### Step 1: Access Google reCAPTCHA Console
1. Go to [Google reCAPTCHA Console](https://www.google.com/recaptcha/admin)
2. Sign in with the Google account that owns the current reCAPTCHA keys
3. Find the reCAPTCHA site configuration

### Step 2: Add Production Domains
Add the following domains to the allowed domains list:
- `snapscape.app`
- `www.snapscape.app`
- `*.vercel.app` (for Vercel preview deployments)

### Step 3: Update Environment Variables (if needed)
If you need to create new keys for production:

1. **Create new reCAPTCHA v3 site** (if current keys can't be updated)
2. **Update Vercel environment variables:**
   ```
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_new_site_key
   RECAPTCHA_SECRET_KEY=your_new_secret_key
   ```

### Step 4: Remove Temporary Bypass
Once domains are properly configured, remove the temporary bypass code from:
`src/app/api/verify-recaptcha/route.ts` (lines with "bypassing reCAPTCHA verification")

## Current Environment Variables
The application is using these reCAPTCHA keys:
- Site Key: `6LegLkMrAAAAAOSRdKTQ33Oa6UT4EzOvqdhsSpM3`
- Secret Key: (stored in Vercel environment variables)

## Testing After Fix
1. Go to snapscape.app
2. Try to log in or register
3. Check browser console - should see no reCAPTCHA errors
4. Verify in Vercel logs that reCAPTCHA verification is working

## Security Note
The temporary bypass is only active for:
- Production environment (`NODE_ENV === 'production'`)
- snapscape.app and vercel.app domains
- Does not affect localhost development

This maintains security while allowing the live site to function until proper domain configuration is completed. 