# SnapScape MongoDB Local Environment Setup Script

Write-Host "🚀 Starting SnapScape MongoDB local environment setup..." -ForegroundColor Cyan

# Step 1: Clone repository (commented out as you likely have already done this)
# Write-Host "Cloning repository..." -ForegroundColor Green
# git clone https://github.com/prabi82/snapscape-mongo.git
# cd snapscape-mongo

# Step 2: Create .env.local file
Write-Host "Creating .env.local file template..." -ForegroundColor Green
$envContent = @"
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your_nextauth_secret
MONGODB_URI=your_mongodb_connection_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
"@

$envContent | Out-File -FilePath ".env.local" -Encoding utf8
Write-Host "✅ .env.local template created successfully." -ForegroundColor Green
Write-Host "⚠️ IMPORTANT: Edit the .env.local file with your actual credentials before proceeding." -ForegroundColor Yellow

# Step 3: Install dependencies
Write-Host "Installing project dependencies..." -ForegroundColor Green
try {
    npm install
    Write-Host "✅ Dependencies installed successfully." -ForegroundColor Green
} catch {
    Write-Host "❌ Error installing dependencies: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Clean Next.js cache and rebuild
Write-Host "Cleaning Next.js cache and rebuilding..." -ForegroundColor Green
try {
    if (Test-Path ".next") {
        Remove-Item -Recurse -Force .next
        Write-Host "✅ .next directory removed." -ForegroundColor Green
    }
    
    npm cache clean --force
    Write-Host "✅ npm cache cleaned." -ForegroundColor Green
    
    npm run build
    Write-Host "✅ Build completed successfully." -ForegroundColor Green
} catch {
    Write-Host "❌ Error during cleaning/building: $_" -ForegroundColor Red
    exit 1
}

# Step 5: Start the development server
Write-Host "Starting development server..." -ForegroundColor Green
Write-Host "✅ Setup complete! Starting the development server at http://localhost:3001" -ForegroundColor Green

Write-Host @"

📋 IMPORTANT REMINDERS:

For Google Auth:
- Set http://localhost:3001 as an authorized JavaScript origin in Google Cloud Console
- Add http://localhost:3001/api/auth/callback/google as an authorized redirect URI

For MongoDB:
- Make sure your IP address is whitelisted in MongoDB Atlas
- Verify that the connection string includes the correct database name

For Cloudinary:
- Check that the API key, secret and cloud name are correct
- Verify that your account has sufficient upload credits

You can now start the development server with:
npm run dev

"@ -ForegroundColor Yellow

# Uncomment the following line if you want the script to automatically start the dev server
# npm run dev 