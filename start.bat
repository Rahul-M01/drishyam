@echo off
title Drishyam
echo ========================================
echo         Starting Drishyam
echo ========================================
echo.

:: Unset this so Electron runs as Electron, not Node
set ELECTRON_RUN_AS_NODE=

:: Check for Java
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Java is not installed or not in PATH.
    echo Please install Java 21 and try again.
    pause
    exit /b 1
)

:: Check for Node
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js and try again.
    pause
    exit /b 1
)

:: Install root dependencies if needed
if not exist "node_modules\electron" (
    echo [Setup] Installing Electron...
    call npm install
    echo.
)

:: Install frontend dependencies and build if needed
if not exist "frontend\dist" (
    echo [Frontend] Building...
    cd frontend
    if not exist "node_modules" call npm install
    call npm run build
    cd ..
    echo.
)

:: Launch Electron app
echo [App] Launching Drishyam...
node_modules\.bin\electron.cmd .
