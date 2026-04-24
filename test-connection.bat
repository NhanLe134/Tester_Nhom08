@echo off
echo Testing Frontend + Backend Connection...
echo.

REM Test Backend
echo 1. Testing Backend (http://localhost:5000/api/health)...
curl -s http://localhost:5000/api/health > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend is running!
    curl -s http://localhost:5000/api/health
) else (
    echo [ERROR] Backend is NOT running!
    echo.
    echo Fix: Run 'cd backend && npm start' in another terminal
    exit /b 1
)

echo.

REM Test Frontend
echo 2. Testing Frontend (http://localhost:5173)...
curl -s -o nul -w "%%{http_code}" http://localhost:5173 > temp.txt 2>&1
set /p STATUS=<temp.txt
del temp.txt

if "%STATUS%"=="200" (
    echo [OK] Frontend is running!
    echo    HTTP Status: %STATUS%
) else (
    echo [ERROR] Frontend is NOT running!
    echo    HTTP Status: %STATUS%
    echo.
    echo Fix: Run 'cd frontend && npm run dev' in another terminal
    exit /b 1
)

echo.
echo All services are running!
echo.
echo Next steps:
echo    1. Open http://localhost:5173 in your browser
echo    2. Login with: admin / Admin123
echo.
pause
