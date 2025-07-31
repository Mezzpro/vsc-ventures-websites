@echo off
echo.
echo =====================================
echo GitHub Repository Setup for VSCode Ventures
echo =====================================
echo.

REM Check if .env file exists
if not exist ".env" (
    echo ERROR: .env file not found!
    echo.
    echo Please run setup-env.bat first to create your .env file
    echo Or create a .env file manually based on .env.example
    echo.
    pause
    exit /b 1
)

echo Starting repository setup...
echo.

REM Run the Node.js script (it will load .env automatically)
node scripts/github-setup.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =====================================
    echo Setup completed successfully!
    echo =====================================
    echo.
    echo To push future updates, use:
    echo   push-to-github.bat
    echo.
) else (
    echo.
    echo Setup failed! Check the error messages above.
    echo.
)

pause