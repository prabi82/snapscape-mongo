# Local Development Setup for Snapscape

This guide will help you set up the Snapscape application for local development on a new machine.

## Prerequisites

1. Node.js and npm (latest LTS version recommended)
2. Git
3. MongoDB (or access to a MongoDB instance)
4. A code editor (VS Code recommended)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd snapscape-mongo
git checkout dev
```

### 2. Set Up Environment Variables

1. Create a `.env.local` file in the project root
2. Add the following environment variables to your `.env.local` file:

```
# Copy the variables from .env.template and fill in your values
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
# In PowerShell:
npm run dev

# In Bash or other shells:
npm run dev
```

The application should now be running at http://localhost:3001

## Troubleshooting

### Next.js Build Cache Issues

If you encounter build errors like `TypeError: Cannot read properties of undefined (reading 'clientModules')`, try:

```bash
# Remove the .next directory
rm -rf .next

# Clear npm cache
npm cache clean --force

# Rebuild the application
npm run build
npm run dev
```

### MongoDB Connection Issues

- Verify your MongoDB connection string in `.env.local`
- Ensure your IP address is whitelisted in MongoDB Atlas
- Check that your MongoDB user has the correct permissions

### Google Authentication Issues

- Ensure your Google Cloud Console OAuth credentials are set up correctly
- Add `http://localhost:3001` to the authorized JavaScript origins
- Add `http://localhost:3001/api/auth/callback/google` to the authorized redirect URIs

## Working with PowerShell on Windows

Note that PowerShell doesn't support the `&&` operator for command chaining. Run commands separately:

```powershell
cd C:\path\to\snapscape-mongo
npm run dev
``` 