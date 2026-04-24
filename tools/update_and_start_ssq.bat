@echo off
setlocal
cd /d "%~dp0.."

echo [1/2] Updating SSQ CSV from 500star...
node scripts\fetch-ssq-history.js --source 500star --output data\ssq_history.csv
if errorlevel 1 (
  echo.
  echo Update failed. Server not started.
  pause
  exit /b 1
)

echo.
echo [2/2] Starting web server at http://localhost:5173 ...
node server.js
