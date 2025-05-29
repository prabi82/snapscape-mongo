@echo off
echo ========================================
echo SnapScape Deployment Script
echo ========================================
echo.

:: Check if we're in the right directory
if not exist "package.json" (
    echo ERROR: package.json not found. Please run this script from the project root.
    pause
    exit /b 1
)

:: Step 1: Check git status
echo [1/8] Checking git status...
git status --porcelain > temp_status.txt
if %errorlevel% neq 0 (
    echo ERROR: Git command failed
    del temp_status.txt 2>nul
    pause
    exit /b 1
)

:: Check if there are changes to commit
for /f %%i in ("temp_status.txt") do set size=%%~zi
del temp_status.txt

if %size% equ 0 (
    echo No changes to commit.
) else (
    echo Changes detected, proceeding with commit...
    
    :: Step 2: Add all changes
    echo [2/8] Adding all changes to git...
    git add .
    if %errorlevel% neq 0 (
        echo ERROR: Failed to add changes
        pause
        exit /b 1
    )
    
    :: Step 3: Commit changes
    echo [3/8] Committing changes...
    set /p commit_message="Enter commit message (or press Enter for default): "
    if "%commit_message%"=="" set commit_message=Deploy: Update application with latest changes
    
    git commit -m "%commit_message%"
    if %errorlevel% neq 0 (
        echo ERROR: Failed to commit changes
        pause
        exit /b 1
    )
    
    :: Step 4: Push to main branch
    echo [4/8] Pushing to main branch...
    git push origin main
    if %errorlevel% neq 0 (
        echo ERROR: Failed to push to main branch
        pause
        exit /b 1
    )
)

:: Step 5: Clean previous build
echo [5/8] Cleaning previous build...
if exist ".next" (
    rmdir /s /q ".next"
    echo Previous build cleaned.
) else (
    echo No previous build found.
)

:: Step 6: Install dependencies (optional, uncomment if needed)
:: echo [6/8] Installing dependencies...
:: npm install
:: if %errorlevel% neq 0 (
::     echo ERROR: Failed to install dependencies
::     pause
::     exit /b 1
:: )

:: Step 6: Build the application
echo [6/8] Building the application...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

:: Step 7: Check if Vercel CLI is available
echo [7/8] Checking Vercel CLI...
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Vercel CLI not found. Please install it with: npm install -g vercel
    echo Then run: vercel login
    pause
    exit /b 1
)

:: Step 8: Deploy to Vercel
echo [8/8] Deploying to Vercel production...
echo This may take a few minutes...
vercel --prod --yes
if %errorlevel% neq 0 (
    echo ERROR: Vercel deployment failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ Deployment completed successfully!
echo ========================================
echo.
echo Your application has been deployed to production.
echo Check the Vercel dashboard for the deployment URL.
echo.
pause 