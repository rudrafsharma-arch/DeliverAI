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
set OUTPUT_DIR=C:\Users\vikram.f.sharma\DeliverAI-repo\projects

if not exist "%GITBASH%" (
  echo  ERROR: Git Bash not found
  echo  Please install Git from https://git-scm.com
  pause & exit
)

if not exist "%REPO%\.env" (
  echo  Creating .env from template...
  copy "%REPO%\.env.template" "%REPO%\.env" >nul
)

if not exist "%REPO%\mcp-server\node_modules" (
  echo  Installing MCP Server dependencies...
  cd /d "%REPO%\mcp-server" && call npm install --silent
)
if not exist "%REPO%\backend\node_modules" (
  echo  Installing Backend dependencies...
  cd /d "%REPO%\backend" && call npm install --silent
)
if not exist "%REPO%\frontend\node_modules" (
  echo  Installing Frontend dependencies...
  cd /d "%REPO%\frontend" && call npm install --silent
)

echo  Starting services...
start "DeliverAI-MCP" "%GITBASH%" --login -c "cd /c/Users/vikram.f.sharma/DeliverAI-repo/mcp-server && node server.js; exec bash"
timeout /t 4 /nobreak >nul
start "DeliverAI-Backend" "%GITBASH%" --login -c "cd /c/Users/vikram.f.sharma/DeliverAI-repo/backend && node server.js; exec bash"
timeout /t 3 /nobreak >nul
start "DeliverAI-Frontend" "%GITBASH%" --login -c "cd /c/Users/vikram.f.sharma/DeliverAI-repo/frontend && npm start; exec bash"

echo.
echo  ================================================
echo   App:      http://localhost:3000
echo   Backend:  http://localhost:3005
echo   MCP:      http://localhost:3002
echo  ================================================
echo.
echo  Browser opens in 15 seconds...
timeout /t 15 /nobreak >nul
start http://localhost:3000
