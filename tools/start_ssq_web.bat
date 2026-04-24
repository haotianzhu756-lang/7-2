@echo off
setlocal
cd /d "%~dp0.."

echo Starting web server at http://localhost:5173 ...
node server.js
