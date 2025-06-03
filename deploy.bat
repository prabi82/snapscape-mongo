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

:: Generate timestamp for commit message
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /format:list') do if not "%%I"=="" set dt=%%I
set YYYY=%dt:~0,4%
set MM=%dt:~4,2%
set DD=%dt:~6,2%
set HH=%dt:~8,2%
set Min=%dt:~10,2%
set timestamp=%YYYY%-%MM%-%DD% %HH%:%Min%

if %size% equ 0 (
    echo No changes to commit.
    del temp_status.txt
) else (
    echo Changes detected, proceeding with commit...
    echo.
    echo Files to be committed:
    type temp_status.txt
    echo.
    
    :: Count modified files for commit message
    for /f %%A in ('find /c /v "" ^< temp_status.txt') do set file_count=%%A
    
    :: Auto-generate intelligent commit message based on changed files
    set change_description=Platform updates and improvements
    
    :: Check for specific types of changes
    findstr /i "analytics" temp_status.txt >nul
    if not errorlevel 1 set change_description=Added analytics dashboard and reporting features
    
    findstr /i "debug" temp_status.txt >nul
    if not errorlevel 1 set change_description=Added notification debug tools and system diagnostics
    
    findstr /i "notification" temp_status.txt >nul
    if not errorlevel 1 set change_description=Enhanced notification system and user preferences
    
    findstr /i "rating" temp_status.txt >nul
    if not errorlevel 1 set change_description=Fixed rating system and voting functionality
    
    findstr /i "admin" temp_status.txt >nul
    if not errorlevel 1 set change_description=Enhanced admin interfaces and management tools
    
    findstr /i "judge" temp_status.txt >nul
    if not errorlevel 1 set change_description=Added judge dashboard and role management features
    
    findstr /i "competition" temp_status.txt >nul
    if not errorlevel 1 set change_description=Updated competition management and status handling
    
    findstr /i "deploy" temp_status.txt >nul
    if not errorlevel 1 set change_description=Updated deployment scripts and automation tools
    
    :: Check for comprehensive changes (simplified)
    findstr /i "analytics.*debug.*admin" temp_status.txt >nul
    if not errorlevel 1 set change_description=Major platform updates: analytics, debug tools, and admin enhancements
    
    :: Step 2: Add all changes
    echo [2/8] Adding all changes to git...
    git add .
    if %errorlevel% neq 0 (
        echo ERROR: Failed to add changes
        del temp_status.txt
        pause
        exit /b 1
    )
    
    :: Step 3: Commit changes with auto-generated message
    echo [3/8] Committing changes...
    set commit_message=Deploy: %change_description% - %file_count% files [%timestamp%]
    echo Commit message: %commit_message%
    
    git commit -m "%commit_message%"
    if %errorlevel% neq 0 (
        echo ERROR: Failed to commit changes
        del temp_status.txt
        pause
        exit /b 1
    )
    
    :: Clean up temp file
    del temp_status.txt
    
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