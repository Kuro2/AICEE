@echo off
title AICEE - Backend API (Port 5000)
cd /d "%~dp0"
if not exist node_modules (
  echo [AICEE] Dang cai dat thu vien Backend...
  call npm install
)
echo ========================================================
echo [AICEE] Dang khoi dong Backend API tai http://localhost:5000
echo ========================================================
call npm run dev
if %errorlevel% neq 0 (
  echo.
  echo [Loi] Backend API gap loi khi khoi dong.
)
pause
