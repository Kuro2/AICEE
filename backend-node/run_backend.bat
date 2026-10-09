@echo off
chcp 65001 >nul
title AICEE - Backend API (Port 5000)
cd /d "%~dp0"
echo Dang khoi dong Backend API tai http://localhost:5000 ...
npm start
pause
