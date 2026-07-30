@echo off
title MISTER-DR Delivery - Dev Mode
color 0B
echo.
echo  ╔══════════════════════════════════════╗
echo  ║   MISTER-DR Delivery (Dev Mode)      ║
echo  ║   Backend:  http://localhost:4000     ║
echo  ║   Frontend: http://localhost:3001     ║
echo  ╚══════════════════════════════════════╝
echo.

if not exist ".env" (
  echo   [!] No .env found. Run "start.bat" first to setup.
  pause
  exit /b 1
)

echo   [1/2] Starting backend server...
start "MISTER-DR API" /min node server/index.js
timeout /t 2 >nul

echo   [2/2] Starting frontend dev server...
start "MISTER-DR Frontend" /min node web/node_modules/vite/bin/vite.js --config web/vite.config.ts --host

echo.
echo   ✓ Backend:   http://localhost:4000
echo   ✓ Frontend:  http://localhost:3001
echo.
echo   Press any key to stop all...
pause >nul

taskkill /F /FI "WINDOWTITLE eq MISTER-DR API*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq MISTER-DR Frontend*" >nul 2>&1
echo   ✓ Stopped!
