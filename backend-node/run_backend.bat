@echo off
title AICEE - Backend API
cd /d "%~dp0"
if not exist node_modules (
  echo [AICEE] Installing Backend libraries...
  npm install
)
echo [AICEE] Starting Backend API at port 5000...
npm run dev
pause
