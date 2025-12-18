@echo off
REM PhilJS DevTools Extension Build Script for Windows

echo Building PhilJS DevTools Extension...

REM Create dist directory
if not exist dist mkdir dist

REM Chrome/Edge build
echo Building for Chrome/Edge...
if not exist dist\chrome mkdir dist\chrome
copy manifest.json dist\chrome\ >nul
copy *.html dist\chrome\ >nul
copy *.js dist\chrome\ >nul
copy *.css dist\chrome\ >nul
if exist icons xcopy /E /I /Y icons dist\chrome\icons >nul

REM Firefox build
echo Building for Firefox...
if not exist dist\firefox mkdir dist\firefox
copy manifest-firefox.json dist\firefox\manifest.json >nul
copy *.html dist\firefox\ >nul
copy *.js dist\firefox\ >nul
copy background-firefox.js dist\firefox\background.js >nul
copy *.css dist\firefox\ >nul
if exist icons xcopy /E /I /Y icons dist\firefox\icons >nul

echo.
echo Build complete!
echo Chrome/Edge: dist\chrome
echo Firefox: dist\firefox
echo.
echo To create ZIP files, use your preferred ZIP tool or:
echo   - For Chrome: Zip the contents of dist\chrome
echo   - For Firefox: Zip the contents of dist\firefox
echo.
echo Note: If icons are missing, open generate-icons.html in a browser
echo and save the canvases as PNG files in the icons\ directory
