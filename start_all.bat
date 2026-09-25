@echo off
title AICEE - Khoi dong he thong
echo ========================================================
echo          KHOI DONG HE THONG AICEE (CYBER SECURITY)
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"

echo [1/2] Dang mo Backend (Node.js API)...
start "AICEE - Backend API (Port 5000)" "%ROOT_DIR%backend-node\run_backend.bat"

timeout /t 2 >nul 2>&1 || ping 127.0.0.1 -n 3 >nul

echo [2/2] Dang mo Frontend (React App)...
start "AICEE - Frontend Web (Port 3000)" "%ROOT_DIR%frontend\run_frontend.bat"

echo.
echo ========================================================
echo He thong dang duoc khoi dong trong 2 cua so rieng biet:
echo   - Backend API: http://localhost:5000
echo   - Frontend Web: http://localhost:3000
echo ========================================================
echo.
echo Nhan phim bat ky de dong cua so quan ly nay (2 cua so ung dung van chay ngam)...
pause >nul
