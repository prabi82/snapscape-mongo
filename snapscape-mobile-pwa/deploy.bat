@echo off
echo ========================================
echo   SnapScape Mobile PWA Deployment
echo ========================================
echo.

echo [1/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Running linter...
call npm run lint
if %errorlevel% neq 0 (
    echo Warning: Linting issues found, but continuing...
)

echo.
echo [3/4] Building PWA...
call npm run build
if %errorlevel% neq 0 (
    echo Error: Build failed
    pause
    exit /b 1
)

echo.
echo [4/4] Deploying to Vercel...
call npx vercel --prod --yes
if %errorlevel% neq 0 (
    echo Error: Deployment failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo   PWA Deployment Completed Successfully!
echo ========================================
echo.
echo Your SnapScape Mobile PWA is now live!
echo.
pause 