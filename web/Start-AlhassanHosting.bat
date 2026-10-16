@echo off
title Alhassan Hosting
cd /d "%USERPROFILE%\Downloads\AlhassanHosting-MVP\AlhassanHosting\web"

start "Alhassan API" cmd /k "node server\index.cjs"
timeout /t 2 /nobreak >nul
start "Alhassan Website" cmd /k "npm run dev"

timeout /t 5 /nobreak >nul
start "" "http://127.0.0.1:5173"

exit