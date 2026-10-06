@echo off
title DeliverAI - Starting...
color 0A
echo.
echo  ================================================
echo   DeliverAI - AI agents for every project phase
echo  ================================================
echo.

set REPO=C:\Users\vikram.f.sharma\DeliverAI-repo
set GITBASH=C:\Users\vikram.f.sharma\AppData\Local\Programs\Git\bin\bash.exe

if not exist "%GITBASH%" (
  echo  ERROR: Git Bash not found at %GITBASH%
  echo  Please install Git from https://git-scm.com
  pause
  exit
)

if not exist "%REPO%\mcp-server\node_modules" (
  echo  [1/3] Installing MCP Server dependencies...
  cd /d "%REPO%\mcp-server" && call npm install --silent
) else (
  echo  [1/3] MCP Server dependencies OK
)

if not exist "%REPO%\backend\node_modules" (
  echo  [2/3] Installing Backend dependencies...
  cd /d "%REPO%\backend" && call npm install --silent
) else (
  echo  [2/3] Backend dependencies OK
)

if not exist "%REPO%\frontend\node_modules" (
  echo  [3/3] Installing Frontend dependencies - this takes 2-3 mins first time...
  cd /d "%REPO%\frontend" && call npm install --silent
) else (
  echo  [3/3] Frontend dependencies OK
)

echo.
echo  Starting services...
echo.

start "DeliverAI-MCP" "%GITBASH%" --login -c "cd /c/Users/vikram.f.sharma/DeliverAI-repo/mcp-server && node server.js; exec bash"
timeout /t 4 /nobreak >nul

start "DeliverAI-Backend" "%GITBASH%" --login -c "cd /c/Users/vikram.f.sharma/DeliverAI-repo/backend && node server.js; exec bash"
timeout /t 3 /nobreak >nul

start "DeliverAI-Frontend" "%GITBASH%" --login -c "cd /c/Users/vikram.f.sharma/DeliverAI-repo/frontend && npm start; exec bash"

echo  ================================================
echo   All services starting...
echo.
echo   App:      http://localhost:3000
echo   Backend:  http://localhost:3005
echo   MCP:      http://localhost:3002
echo  ================================================
echo.
echo  Browser opens in 15 seconds...
echo  You can close this window after browser opens.
echo.
timeout /t 15 /nobreak >nul
start http://localhost:3000
