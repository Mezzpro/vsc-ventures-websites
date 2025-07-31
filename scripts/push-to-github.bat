@echo off
echo.
echo =====================================
echo Push to GitHub - VSCode Ventures
echo =====================================
echo.

REM Run the Node.js push script
node scripts/github-push.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =====================================
    echo Push completed successfully!
    echo =====================================
    echo.
) else (
    echo.
    echo Push failed! Check the error messages above.
    echo.
)

pause