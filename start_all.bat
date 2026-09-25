@echo off
title AICEE - Khoi dong he thong
echo ========================================================
echo          KHOI DONG HE THONG AICEE (CYBER SECURITY)
echo ========================================================
echo.

echo [1/2] Dang mo Backend (Node.js API)...
start "AICEE - Backend API (Port 5000)" cmd /k "cd /d "%~dp0backend-node" && if not exist node_modules (echo Dang cai dat thu vien backend... && npm install) && echo Khoi dong Backend... && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/2] Dang mo Frontend (React App)...
start "AICEE - Frontend Web (Port 3000)" cmd /k "cd /d "%~dp0frontend" && if not exist node_modules (echo Dang cai dat thu vien frontend... && npm install) && echo Khoi dong Frontend... && npm start"

echo.
echo ========================================================
echo He thong dang duoc khoi dong trong 2 cua so rieng biet:
echo   - Backend API: http://localhost:5000
echo   - Frontend Web: http://localhost:3000
echo ========================================================
pause
