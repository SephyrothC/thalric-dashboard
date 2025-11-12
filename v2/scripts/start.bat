@echo off
echo ==================================
echo    Thalric Dashboard v2.0
echo    Starting application...
echo ==================================
echo.

REM Check if node_modules exists
if not exist "..\server\node_modules" (
    echo Installing dependencies...

    REM Install server dependencies
    echo Installing server dependencies...
    cd ..\server
    call npm install

    REM Install client dependencies
    echo Installing client dependencies...
    cd ..\client
    call npm install

    cd ..\scripts
    echo Dependencies installed!
    echo.
)

REM Build client
echo Building frontend...
cd ..\client
call npm run build
echo Frontend built!
echo.

REM Start server
echo Starting server...
echo.
echo Dashboard will be available at:
echo   Main Dashboard: http://localhost:3000
echo   Tablet Viewer:   http://localhost:3000/viewer
echo.
echo To access from tablet on same network:
echo   Find your local IP with: ipconfig
echo   Then access: http://YOUR_LOCAL_IP:3000/viewer
echo.
echo Press Ctrl+C to stop the server
echo.

cd ..\server
call npm start
