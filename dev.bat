@echo off
title MISTER-DR Delivery - Dev Mode
color 0B
echo.
echo  ╔══════════════════════════════════════╗
echo  ║   MISTER-DR Delivery (Dev Mode)      ║
echo  ║   Server: localhost:4000             ║
echo  ║   Frontend: localhost:3001           ║
echo  ╚══════════════════════════════════════╝
echo.

set NODE=node

echo   Starting backend server...
start "delivery-server" /min "%NODE%" server/index.js
timeout /t 2 >nul

echo   Starting frontend dev server...
start "delivery-frontend" /min "%NODE%" web/node_modules/vite/bin/vite.js --config web/vite.config.ts

echo.
echo   Server:  http://localhost:4000
echo   Frontend: http://localhost:3001
echo.
echo   Press any key to stop all...
pause >nul

taskkill /F /FI "WINDOWTITLE eq delivery-server*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq delivery-frontend*" >nul 2>&1
echo   Stopped!
