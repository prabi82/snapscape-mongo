@echo off
echo Killing any running Node.js processes...
taskkill /F /IM node.exe 2>nul
if %ERRORLEVEL% EQU 0 (
  echo Node.js processes terminated successfully.
) else (
  echo No Node.js processes were running.
)

echo Starting development server...
npm run dev 