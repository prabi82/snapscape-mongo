# Troubleshooting Cloudinary in Vercel Deployments

## Testing Steps

1. **Visit the Enhanced Test Page**:
   - Go to: https://snapscape-mongo-84gux9n9p-prabikrishna-gmailcoms-projects.vercel.app/test-upload
   - Click "Check Cloudinary Configuration" to see detailed diagnostics
   - Try the different connection methods in "Advanced Testing Methods"

2. **Check Vercel Logs**:
   - Go to: https://vercel.com/prabikrishna-gmailcoms-projects/snapscape-mongo/logs
   - Look for error messages related to Cloudinary
   - Filter for "Cloudinary" to see initialization errors

## Common Issues and Solutions

### 1. API Secret Format
- Vercel might need the raw secret value, not a URL
- Remove `cloudinary://` prefix if present in your API secret
- The secret should be a plain string without any URL formatting

### 2. Special Characters
- Some special characters need encoding in environment variables
- If characters like `@`, `:`, or `/` are in your secret, they might need special handling
- Try URL encoding these characters or use the Vercel dashboard to set the variable

### 3. Cloudinary URL Alternative
- If individual variables don't work, try adding `CLOUDINARY_URL` as a single variable
- Format: `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`
- This can sometimes work when individual variables fail

### 4. Quotation Marks
- Environment variables shouldn't have quotes around them
- Remove any quotes that might be included in your variables
- In Vercel dashboard, enter values without quotes

### 5. Credentials Mismatch
- Verify credentials match exactly with your Cloudinary dashboard
- Even a single character difference will cause authentication failures
- Double-check by copy-pasting directly from Cloudinary

## How to Update Environment Variables

### Via Vercel Dashboard
1. Go to: https://vercel.com/prabikrishna-gmailcoms-projects/snapscape-mongo/settings/environment-variables
2. Find and edit the Cloudinary variables
3. Save changes and redeploy

### Via Vercel CLI
```bash
# Update API secret
npx vercel env add CLOUDINARY_API_SECRET

# Update API key
npx vercel env add CLOUDINARY_API_KEY

# Update cloud name
npx vercel env add CLOUDINARY_CLOUD_NAME

# Add Cloudinary URL (alternative method)
npx vercel env add CLOUDINARY_URL
```

## Verifying Fix
After updating variables, check:
1. The test upload page at `/test-upload`
2. Try uploading a test image
3. Check Vercel logs for any remaining errors 