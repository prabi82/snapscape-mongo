# Email Configuration Setup

This directory contains template files for setting up email functionality in the SnapScape application. 
For security reasons, the actual email configuration files are not included in the repository.

## Available Templates

- `send-gmail-test-template.js` - Template for Gmail SMTP configuration
- `send-test-email-template.js` - Template for generic SMTP configuration

## Setup Instructions

1. Choose the appropriate template based on your email provider
2. Make a copy of the template and rename it:
   - Copy `send-gmail-test-template.js` to `send-gmail-test.js`
   - Copy `send-test-email-template.js` to `send-test-email.js`
   
3. Edit the copied files and replace the placeholder values with your actual credentials
   ```javascript
   // For Gmail
   auth: {
     user: 'YOUR_GMAIL_ADDRESS@gmail.com', // replace with your Gmail address
     pass: 'YOUR_APP_PASSWORD', // replace with your app password
   }
   
   // For generic SMTP
   auth: {
     user: 'YOUR_EMAIL_USERNAME',
     pass: 'YOUR_EMAIL_PASSWORD',
   }
   ```

4. Test your configuration by running the script:
   ```
   node src/lib/send-gmail-test.js
   ```
   or
   ```
   node src/lib/send-test-email.js
   ```

## Security Notes

- Never commit email credentials to public repositories
- Consider using environment variables for storing sensitive information
- The template files use placeholders and should be safe to commit
- The actual configuration files with real credentials are in `.gitignore` 