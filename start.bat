@echo off
title DeliverAI
color 0A
echo.
echo  ================================================
echo   DeliverAI - AI agents for every project phase
echo  ================================================
echo.

set REPO=C:Usersikram.f.sharmaDeliverAI-repo
set GITBASH=C:Usersikram.f.sharmaAppDataLocalProgramsGitinash.exe

if not exist "%GITBASH%" (
  echo ERROR: Git Bash not found at %GITBASH%
  pause
  exit
)

echo [1/4] Checking dependencies...
if not exist "%REPO%mcp-server
ode_modules" (
  echo Installing MCP server...
  cd /d "%REPO%mcp-server" && call npm install --silent
)
if not exist "%REPO%ackend
ode_modules" (
  echo Installing backend...
  cd /d "%REPO%ackend" && call npm install --silent
)
if not exist "%REPO%rontend
ode_modules" (
  echo Installing frontend - this takes 2-3 minutes first time...
  cd /d "%REPO%rontend" && call npm install --silent
)
echo All dependencies ready.
echo.

echo [2/4] Starting MCP Server on port 3002...
start "DeliverAI-MCP" "%GITBASH%" --login -c "cd /c/Users/vikram.f.sharma/DeliverAI-repo/mcp-server && node server.js; exec bash"
timeout /t 4 /nobreak >nul

echo [3/4] Starting Backend on port 3005...
start "DeliverAI-Backend" "%GITBASH%" --login -c "cd /c/Users/vikram.f.sharma/DeliverAI-repo/backend && node server.js; exec bash"
timeout /t 3 /nobreak >nul

echo [4/4] Starting Frontend on port 3000...
start "DeliverAI-Frontend" "%GITBASH%" --login -c "cd /c/Users/vikram.f.sharma/DeliverAI-repo/frontend && npm start; exec bash"

echo.
echo  ================================================
echo   DeliverAI is starting...
echo   App:     http://localhost:3000
echo   Backend: http://localhost:3005
echo   MCP:     http://localhost:3002
echo  ================================================
echo.
echo  Browser will open in 15 seconds...
echo  You can close this window.
echo.
timeout /t 15 /nobreak >nul
start http://localhost:3000