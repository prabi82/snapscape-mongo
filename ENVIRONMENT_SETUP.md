# Environment Variables Setup

This document outlines the environment variables required for the SnapScape application to function properly in production.

## Required Environment Variables

### Email Service Configuration
The application requires email service configuration for user verification and password reset functionality:

```
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=465
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-email-password
```

### reCAPTCHA Configuration
For spam protection and security:

```
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
```

### Database Configuration
MongoDB connection:

```
MONGODB_URI=your-mongodb-connection-string
```

### Authentication Configuration
NextAuth.js configuration:

```
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-nextauth-secret
```

### Cloudinary Configuration
For image uploads:

```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Security Notes

1. **Never commit sensitive credentials to the repository**
2. **Use environment variables for all sensitive configuration**
3. **Rotate credentials regularly**
4. **Use different credentials for development and production**

## Vercel Deployment

To set environment variables in Vercel:

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable with appropriate values for production

## Local Development

Create a `.env.local` file in the project root with your development values:

```
EMAIL_HOST=your-dev-smtp-server.com
EMAIL_PORT=465
EMAIL_USER=your-dev-email@domain.com
EMAIL_PASSWORD=your-dev-email-password
# ... other variables
```

**Note:** The `.env.local` file is already in `.gitignore` and will not be committed to the repository. 