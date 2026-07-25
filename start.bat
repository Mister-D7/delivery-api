@echo off
title MISTER-DR Delivery
color 0A
echo.
echo  ╔══════════════════════════════════════╗
echo  ║   MISTER-DR Delivery                 ║
echo  ╚══════════════════════════════════════╝
echo.

set NODE=node

if not exist ".env" (
  echo   No .env found. Running setup wizard...
  echo.
  "%NODE%" setup.js
  echo.
)

echo   Starting server...
"%NODE%" server/index.js
pause
