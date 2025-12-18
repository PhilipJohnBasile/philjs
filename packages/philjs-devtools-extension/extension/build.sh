#!/bin/bash

# PhilJS DevTools Extension Build Script

echo "Building PhilJS DevTools Extension..."

# Create dist directory
mkdir -p dist

# Chrome/Edge build
echo "Building for Chrome/Edge..."
mkdir -p dist/chrome
cp manifest.json dist/chrome/
cp *.html dist/chrome/
cp *.js dist/chrome/
cp *.css dist/chrome/
cp -r icons dist/chrome/ 2>/dev/null || echo "Note: Icon PNGs not found. Generate them using generate-icons.html"

# Create Chrome zip
cd dist/chrome
zip -r ../philjs-devtools-chrome.zip .
cd ../..

# Firefox build
echo "Building for Firefox..."
mkdir -p dist/firefox
cp manifest-firefox.json dist/firefox/manifest.json
cp *.html dist/firefox/
cp *.js dist/firefox/
cp background-firefox.js dist/firefox/background.js
cp *.css dist/firefox/
cp -r icons dist/firefox/ 2>/dev/null || echo "Note: Icon PNGs not found. Generate them using generate-icons.html"

# Create Firefox zip
cd dist/firefox
zip -r ../philjs-devtools-firefox.zip .
cd ../..

echo "Build complete!"
echo "Chrome/Edge: dist/philjs-devtools-chrome.zip"
echo "Firefox: dist/philjs-devtools-firefox.zip"
echo ""
echo "Note: If icons are missing, open generate-icons.html in a browser"
echo "and save the canvases as PNG files in the icons/ directory"
