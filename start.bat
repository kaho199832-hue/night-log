@echo off
echo ナイトCRM を起動します...
start "NightCRM Server" cmd /k "cd /d %~dp0server && node index.js"
timeout /t 2 /nobreak > nul
start "NightCRM Client" cmd /k "cd /d %~dp0client && npm run dev"
echo.
echo サーバー: http://localhost:3001
echo クライアント: http://localhost:5173
echo.
pause
