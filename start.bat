@echo off
title MISTER-DR Delivery
color 0A
echo.
echo  ╔══════════════════════════════════════╗
echo  ║   MISTER-DR Delivery (Production)    ║
echo  ║   http://localhost:4000              ║
echo  ╚══════════════════════════════════════╝
echo.

if not exist ".env" (
  echo   [!] No .env found. Running setup wizard...
  echo.
  node setup.js
  echo.
)

echo   [1/2] Building frontend...
cd web && node ../node_modules/vite/bin/vite.js build && cd ..
if %errorlevel% neq 0 (
  echo   [X] Build failed!
  pause
  exit /b 1
)

echo   [2/2] Starting server...
echo.
node server/index.js
pause
