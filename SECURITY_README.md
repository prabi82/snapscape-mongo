# Security Guide - Removing Sensitive Information

This document contains instructions for removing sensitive information from the Git repository.

## Credentials Management

We've identified and removed hardcoded credentials from the following files:
- check-admin-users.js (MongoDB credentials)
- ensure-admin-users.js (MongoDB credentials)
- create-admin-user.js (MongoDB credentials)
- test-cloudinary files (Cloudinary API keys)

## Preventing Future Exposure

1. We've updated the `.gitignore` file to exclude sensitive files
2. We've created a `.gitattributes` file to mark potential sensitive files
3. All credential files now use environment variables instead of hardcoded values

## Cleaning Git History with BFG

To completely remove sensitive information from Git history, follow these steps:

### Prerequisites
- Java installed on your system
- BFG Repo Cleaner (downloaded as bfg.jar)

### Step 1: Create a fresh clone
```
git clone --mirror https://github.com/prabi82/snapscape-mongo.git snapscape-mongo-mirror.git
cd snapscape-mongo-mirror.git
```

### Step 2: Run BFG to remove sensitive data
```
java -jar path/to/bfg.jar --replace-text ../password-patterns.txt
```

### Step 3: Clean and push changes
```
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push
```

## Environment Variables

Always use environment variables for sensitive information:
```
# MongoDB
MONGODB_URI=mongodb+srv://username:password@hostname/database

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Security Best Practices

1. Never hardcode credentials in source code
2. Use environment variables for all secrets
3. Regularly rotate API keys and passwords
4. Use .env.local for local development (excluded from Git)
5. Set up proper environment variables in deployment platforms (Vercel) 