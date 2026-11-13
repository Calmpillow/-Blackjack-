@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 or newer is required.
  echo Install it from https://nodejs.org/ and run this file again.
  pause
  exit /b 1
)
node --check manager.js
if errorlevel 1 (pause & exit /b 1)
echo Starting Velvet North Control. Keep this window open while using the control website.
node manager.js --open
pause
