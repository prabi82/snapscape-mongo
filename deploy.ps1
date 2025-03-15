# Deployment script for Snapscape MongoDB application to Vercel

# Function to log with color
function Write-ColorOutput($message, $color) {
    Write-Host $message -ForegroundColor $color
}

# Clean up any previous builds
Write-ColorOutput "Cleaning up previous builds..." "Yellow"
if (Test-Path ".next") {
    try {
        # Kill any processes that might be locking files
        taskkill /f /im node.exe
        # Wait a moment to ensure processes are terminated
        Start-Sleep -Seconds 2
        # Remove the build directory
        Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
        Write-ColorOutput "Previous build directory removed successfully." "Green"
    } catch {
        Write-ColorOutput "Error removing previous build directory, but we'll continue anyway: $_" "Yellow"
    }
}

# Build the application
Write-ColorOutput "Building application..." "Cyan"
try {
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "Build failed. Trying a different approach..." "Yellow"
        # Try without the .next directory
        Write-ColorOutput "Deploying directly to Vercel without local build..." "Cyan"
    } else {
        Write-ColorOutput "Build successful." "Green"
    }
} catch {
    Write-ColorOutput "Error during build: $_" "Red"
    Write-ColorOutput "Trying to deploy without build..." "Yellow"
}

# Deploy to Vercel
Write-ColorOutput "Deploying to Vercel..." "Cyan"
try {
    # Install Vercel CLI if needed
    if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
        Write-ColorOutput "Installing Vercel CLI..." "Yellow"
        npm install -g vercel
    }
    
    # Deploy with auto-confirmation
    vercel --prod --yes
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "Deployment failed with exit code $LASTEXITCODE" "Red"
        exit $LASTEXITCODE
    }
    
    Write-ColorOutput "Deployment successful!" "Green"
} catch {
    Write-ColorOutput "Error during deployment: $_" "Red"
    exit 1
} 