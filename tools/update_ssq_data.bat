@echo off
setlocal
cd /d "%~dp0.."

echo [1/1] Updating SSQ CSV from 500star...
node scripts\fetch-ssq-history.js --source 500star --output data\ssq_history.csv
if errorlevel 1 (
  echo.
  echo Update failed.
  pause
  exit /b 1
)

echo.
echo Update completed: data\ssq_history.csv
pause
