@echo off
chcp 65001 >nul
title Ban do Brain - song
cd /d "%~dp0"

echo.
echo   BAN DO BRAIN — dang khoi dong may quet...
echo.

start "" http://localhost:8097
node quet-brain.mjs

echo.
echo   May quet da dung. Dong cua so nay la xong.
pause >nul
