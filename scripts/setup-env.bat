@echo off
echo.
echo =====================================
echo Environment Setup - VSCode Ventures
echo =====================================
echo.
echo This will help you create a .env file with your GitHub token
echo and other configuration settings.
echo.

node scripts/create-env.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =====================================
    echo Environment setup completed!
    echo =====================================
    echo.
    echo Next: Run setup-github.bat to create your repository
    echo.
) else (
    echo.
    echo Setup failed! Check the error messages above.
    echo.
)

pause