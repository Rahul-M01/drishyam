@echo off
title Drishyam
echo ========================================
echo         Starting Drishyam
echo ========================================
echo.

set ELECTRON_RUN_AS_NODE=
set OLLAMA_API_KEY=ollama-local

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

:: Start Ollama in the background if not already running
curl -s http://localhost:11434/ >nul 2>&1
if %errorlevel% neq 0 (
    echo [Ollama] Starting...
    start /B "" ollama serve >nul 2>&1
    timeout /t 3 /nobreak >nul
) else (
    echo [Ollama] Already running.
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
