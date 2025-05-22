# Setting up reCAPTCHA for SnapScape

This guide describes how to set up Google reCAPTCHA v3 for the SnapScape application to protect the login and registration forms from bots.

## 1. Register for reCAPTCHA

1. Go to the [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin/create)
2. Sign in with your Google account
3. Register a new site with the following details:
   - Label: SnapScape
   - reCAPTCHA type: reCAPTCHA v3
   - Domains: snapscape.app (and any other domains where you'll host the application)
   - Accept the Terms of Service
   - Click "Submit"
4. You will receive two keys:
   - Site Key (for the client-side implementation)
   - Secret Key (for the server-side verification)

## 2. Add Keys to Environment Variables

Add the following variables to your `.env.local` file:

```
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_from_google
RECAPTCHA_SECRET_KEY=your_secret_key_from_google
```

## 3. Deploy to Vercel

When deploying to Vercel, add these environment variables in the Vercel dashboard:

1. Go to your Vercel project
2. Navigate to Settings > Environment Variables
3. Add the following variables:
   - `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` = your site key
   - `RECAPTCHA_SECRET_KEY` = your secret key
4. Save and redeploy the application

## 4. How reCAPTCHA v3 Works

Unlike reCAPTCHA v2, which shows a checkbox that users must click, reCAPTCHA v3:

- Runs invisibly in the background
- Returns a score from 0.0 to 1.0 based on interactions with your site
- Higher scores (closer to 1.0) indicate more legitimate user behavior
- The current score threshold is set to 0.5 (configurable in the code)

## 5. Test reCAPTCHA

After deployment, verify that reCAPTCHA is working correctly by:

1. Attempting to login or register
2. Check server logs to view reCAPTCHA scores (in development)
3. Verify that bot submissions are being blocked

## Troubleshooting

- If verification is failing, check server logs for potential issues with the secret key
- Make sure the domain where the application is hosted is added to the allowed domains list in the reCAPTCHA admin console
- If you need to adjust the score threshold, modify it in the `src/app/api/verify-recaptcha/route.ts` file 