# Deployment script for Snapscape MongoDB application to Vercel
# Supports multiple environments:
# - Production: snapscape.app
# - Testing/Sandbox: snapscape.omanisesrvers.com

param (
    [Parameter(Mandatory=$true)]
    [ValidateSet('production', 'testing')]
    [string]$Environment
)

# Function to log with color
function Write-ColorOutput($message, $color) {
    Write-Host $message -ForegroundColor $color
}

# Display target environment
if ($Environment -eq 'production') {
    Write-ColorOutput "Deploying to PRODUCTION environment (snapscape.app)..." "Magenta"
    $envFlag = "--prod"
    $targetAlias = "snapscape.app"
} else {
    Write-ColorOutput "Deploying to TESTING environment (snapscape.omanisesrvers.com)..." "Yellow"
    $envFlag = "--preview"
    $targetAlias = "snapscape.omanisesrvers.com"
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
Write-ColorOutput "Deploying to Vercel ($targetAlias)..." "Cyan"
try {
    # Install Vercel CLI if needed
    if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
        Write-ColorOutput "Installing Vercel CLI..." "Yellow"
        npm install -g vercel
    }
    
    # Deploy with the specific environment flag and target the correct alias
    vercel $envFlag --yes
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "Deployment failed with exit code $LASTEXITCODE" "Red"
        exit $LASTEXITCODE
    }
    
    # Assign the deployment to the correct alias/domain
    Write-ColorOutput "Setting domain alias to $targetAlias..." "Cyan"
    vercel alias set latest $targetAlias
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "Alias setting failed with exit code $LASTEXITCODE" "Red"
    } else {
        Write-ColorOutput "Deployment to $targetAlias successful!" "Green"
    }
} catch {
    Write-ColorOutput "Error during deployment: $_" "Red"
    exit 1
} 