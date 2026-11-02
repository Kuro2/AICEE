@echo off
chcp 65001 >nul
title AICEE - Frontend Web (Port 3000)
cd /d "%~dp0"
echo Dang khoi dong Frontend React Web tai http://localhost:3000 ...
npm start
pause
