# SnapScape Deployment Script (PowerShell)
# This script commits changes to main branch and deploys to Vercel

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SnapScape Deployment Script (PowerShell)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to handle errors
function Handle-Error {
    param($message)
    Write-Host "ERROR: $message" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Handle-Error "package.json not found. Please run this script from the project root."
}

try {
    # Step 1: Check git status
    Write-Host "[1/8] Checking git status..." -ForegroundColor Yellow
    $gitStatus = git status --porcelain
    if ($LASTEXITCODE -ne 0) {
        Handle-Error "Git command failed"
    }

    if ($gitStatus) {
        Write-Host "Changes detected, proceeding with commit..." -ForegroundColor Green
        
        # Step 2: Add all changes
        Write-Host "[2/8] Adding all changes to git..." -ForegroundColor Yellow
        git add .
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "Failed to add changes"
        }
        
        # Step 3: Commit changes
        Write-Host "[3/8] Committing changes..." -ForegroundColor Yellow
        $commitMessage = Read-Host "Enter commit message (or press Enter for default)"
        if ([string]::IsNullOrWhiteSpace($commitMessage)) {
            $commitMessage = "Deploy: Update application with latest changes"
        }
        
        git commit -m $commitMessage
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "Failed to commit changes"
        }
        
        # Step 4: Push to main branch
        Write-Host "[4/8] Pushing to main branch..." -ForegroundColor Yellow
        git push origin main
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "Failed to push to main branch"
        }
    } else {
        Write-Host "No changes to commit." -ForegroundColor Green
    }

    # Step 5: Clean previous build
    Write-Host "[5/8] Cleaning previous build..." -ForegroundColor Yellow
    if (Test-Path ".next") {
        Remove-Item -Recurse -Force ".next"
        Write-Host "Previous build cleaned." -ForegroundColor Green
    } else {
        Write-Host "No previous build found." -ForegroundColor Green
    }

    # Step 6: Build the application
    Write-Host "[6/8] Building the application..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Handle-Error "Build failed"
    }

    # Step 7: Check if Vercel CLI is available
    Write-Host "[7/8] Checking Vercel CLI..." -ForegroundColor Yellow
    $vercelCheck = Get-Command vercel -ErrorAction SilentlyContinue
    if (-not $vercelCheck) {
        Handle-Error "Vercel CLI not found. Please install it with: npm install -g vercel`nThen run: vercel login"
    }

    # Step 8: Deploy to Vercel
    Write-Host "[8/8] Deploying to Vercel production..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes..." -ForegroundColor Cyan
    vercel --prod --yes
    if ($LASTEXITCODE -ne 0) {
        Handle-Error "Vercel deployment failed"
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your application has been deployed to production." -ForegroundColor Green
    Write-Host "Check the Vercel dashboard for the deployment URL." -ForegroundColor Green
    Write-Host ""

} catch {
    Handle-Error "An unexpected error occurred: $($_.Exception.Message)"
}

Read-Host "Press Enter to exit" 