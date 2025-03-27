# SnapScape MongoDB - Local Development Setup

This guide will help you set up your local development environment for the SnapScape MongoDB application.

## Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Git
- A code editor (VS Code recommended)
- Access to MongoDB Atlas
- Google Cloud Console access (for Google Auth)
- Cloudinary account

## Step 1: Clone the Repository

```bash
git clone https://github.com/prabi82/snapscape-mongo.git
cd snapscape-mongo
```

## Step 2: Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your_nextauth_secret
MONGODB_URI=your_mongodb_connection_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application" as the Application Type
6. Add "http://localhost:3001" as an authorized JavaScript origin
7. Add "http://localhost:3001/api/auth/callback/google" as an authorized redirect URI
8. Click "Create" and copy your Client ID and Client Secret to the `.env.local` file

### MongoDB Setup

1. Create or access your MongoDB Atlas cluster
2. Ensure your IP address is whitelisted in MongoDB Atlas
   - Go to Network Access in Atlas and add your current IP
3. Create a database user if you don't have one already
4. Get your connection string from MongoDB Atlas
   - Format: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority`
5. Replace `<username>`, `<password>`, `<cluster>`, and `<database>` with your values
6. Add the connection string to the `.env.local` file

### Cloudinary Setup

1. Access your Cloudinary dashboard
2. Copy your Cloud Name, API Key, and API Secret
3. Add these values to the `.env.local` file

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Clean Cache and Build

```bash
# Remove Next.js cache directory if it exists
if (Test-Path ".next") { Remove-Item -Recurse -Force .next }

# Clean npm cache
npm cache clean --force

# Build the application
npm run build
```

## Step 5: Start Development Server

```bash
npm run dev
```

The application should now be running at http://localhost:3001

## Troubleshooting

### Connection Issues with MongoDB

- Verify your IP address is whitelisted in MongoDB Atlas
- Check that your connection string is correct and includes the database name
- Ensure your MongoDB user has the proper permissions

### Google Authentication Issues

- Make sure the redirect URIs match exactly (http://localhost:3001/api/auth/callback/google)
- Verify the Client ID and Secret are correctly copied to your `.env.local` file
- Check that the Google OAuth API is enabled in your Google Cloud Console

### Cloudinary Issues

- Verify your API key, secret, and cloud name are correct
- Ensure your account has sufficient upload credits

## Automated Setup

For convenience, you can run the included PowerShell script to automate these steps:

```bash
./setup-local-env.ps1
```

Remember to edit the `.env.local` file with your actual credentials after running the script. 