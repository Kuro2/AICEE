@echo off
chcp 65001 >nul
title AICEE - Khoi dong he thong
echo ========================================================
echo          KHOI DONG HE THONG AICEE (CYBER SECURITY)
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"

echo [1/2] Dang khoi dong Backend API tren cong 5000...
start "AICEE - Backend API (Port 5000)" cmd /k "cd /d "%ROOT_DIR%backend-node" && npm start"

timeout /t 3 >nul 2>&1 || ping 127.0.0.1 -n 4 >nul

echo [2/2] Dang khoi dong Frontend Web tren cong 3000...
start "AICEE - Frontend Web (Port 3000)" cmd /k "cd /d "%ROOT_DIR%frontend" && npm start"

echo.
echo ========================================================
echo He thong dang chay tren 2 cua so doc lap:
echo   - Backend API:  http://localhost:5000
echo   - Frontend Web: http://localhost:3000
echo ========================================================
echo.
echo Nhan phim bat ky de dong trinh khoi chay (2 cua so ung dung van tiep tuc chay)...
pause >nul
