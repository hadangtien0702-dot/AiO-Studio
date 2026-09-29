@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Lan dau: dang cai thu vien...
  call npm install
)
start "" http://localhost:3000/checkout-demo.html
node server.mjs
pause
