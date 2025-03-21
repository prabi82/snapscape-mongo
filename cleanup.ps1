# PowerShell script to clean up Next.js build artifacts
Write-Host "Starting Next.js build cleanup..." -ForegroundColor Cyan

# Check if .next directory exists
if (Test-Path ".\.next") {
  Write-Host ".next directory found, removing it..." -ForegroundColor Yellow
  
  # Try to kill any processes that might be locking files
  Write-Host "Stopping any node processes that might be locking files..." -ForegroundColor Yellow
  Get-Process | Where-Object { $_.ProcessName -eq "node" } | ForEach-Object { 
    Write-Host "Killing process: $($_.Id)" -ForegroundColor Red
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue 
  }
  
  # Wait a moment for processes to terminate
  Start-Sleep -Seconds 2
  
  # Remove .next directory
  try {
    Remove-Item -Path ".\.next" -Recurse -Force -ErrorAction Stop
    Write-Host ".next directory successfully removed!" -ForegroundColor Green
  }
  catch {
    Write-Host "Error removing .next directory: $_" -ForegroundColor Red
    Write-Host "Trying alternative approach..." -ForegroundColor Yellow
    
    # Use the rimraf npm package
    npm exec rimraf .next
    
    if (Test-Path ".\.next") {
      Write-Host "Could not remove .next directory. Please try restarting your computer." -ForegroundColor Red
    } else {
      Write-Host ".next directory successfully removed with rimraf!" -ForegroundColor Green
    }
  }
}
else {
  Write-Host ".next directory does not exist, no cleanup needed." -ForegroundColor Green
}

# Check for app-paths-manifest.json file specifically
$manifestPath = ".\.next\server\app-paths-manifest.json"
if (Test-Path $manifestPath) {
  Write-Host "app-paths-manifest.json still exists, trying to remove it specifically..." -ForegroundColor Yellow
  Remove-Item -Path $manifestPath -Force -ErrorAction SilentlyContinue
  if (-not (Test-Path $manifestPath)) {
    Write-Host "app-paths-manifest.json successfully removed!" -ForegroundColor Green
  }
}

Write-Host "`nNext.js cleanup completed." -ForegroundColor Cyan
Write-Host "Now run: npm run dev" -ForegroundColor Green 