@echo off
title AICEE - Frontend React Web
cd /d "%~dp0"
if not exist node_modules (
  echo [AICEE] Installing Frontend libraries...
  npm install
)
echo [AICEE] Starting Frontend at port 3000...
npm start
pause
