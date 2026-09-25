@echo off
title AICEE - Frontend React Web (Port 3000)
cd /d "%~dp0"
if not exist node_modules (
  echo [AICEE] Dang cai dat thu vien Frontend...
  call npm install
)
echo ========================================================
echo [AICEE] Dang khoi dong Frontend tai http://localhost:3000
echo ========================================================
call npm start
if %errorlevel% neq 0 (
  echo.
  echo [Loi] Frontend Web gap loi khi khoi dong.
)
pause
