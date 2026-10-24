@echo off
cd /d "%~dp0"
node "%~dp0scripts\launch-local.mjs"
if errorlevel 1 (
  echo Unable to start NOIR. Run npm ci and npm run build first, and check port 3000.
  pause
  exit /b 1
)
start "" "http://127.0.0.1:3000/"
