# PhilJS DevTools Installation Guide

## Quick Start

### 1. Generate Icons (First Time Only)

Before installing, you need to generate the icon PNG files:

1. Open `generate-icons.html` in your browser
2. Open the browser console (F12)
3. Right-click on each canvas (16x16, 48x48, 128x128)
4. Select "Save Image As..."
5. Save in the `icons/` folder as:
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`

Alternatively, you can use any SVG to PNG converter with the SVG files in the `icons/` folder.

### 2. Install in Chrome/Edge

1. Open Chrome or Edge browser
2. Navigate to `chrome://extensions` (Chrome) or `edge://extensions` (Edge)
3. Enable **Developer mode** (toggle in top right corner)
4. Click **Load unpacked**
5. Navigate to this `extension` folder and select it
6. The extension is now installed!

### 3. Install in Firefox

#### Temporary Installation (Development)

1. Open Firefox
2. Navigate to `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on...**
4. Navigate to `manifest-firefox.json` in this folder and select it
5. The extension is now loaded (until browser restart)

#### Permanent Installation

For permanent installation in Firefox, you need to:
1. Build the extension as a ZIP file
2. Submit to [addons.mozilla.org](https://addons.mozilla.org)
3. Wait for Mozilla review and signing

Or use the Firefox Developer Edition with signing disabled:
1. Open `about:config`
2. Set `xpinstall.signatures.required` to `false`
3. Load the extension as described in "Temporary Installation"

## Verify Installation

1. Open any webpage (or a PhilJS app)
2. Open DevTools (F12 or Right-click → Inspect)
3. Look for a **PhilJS** tab in DevTools

If you see the PhilJS tab, installation was successful!

## Using the Extension

1. Open a PhilJS application in your browser
2. Open DevTools (F12)
3. Click the **PhilJS** tab
4. The extension will show "Disconnected" until it detects a PhilJS app
5. Once connected, you'll see:
   - Signals panel
   - Components panel
   - Performance panel
   - Time Travel panel
   - Network panel

## Building for Distribution

To create distributable ZIP files:

### On Mac/Linux:
```bash
chmod +x build.sh
./build.sh
```

### On Windows:
```batch
build.bat
```

This will create:
- `dist/philjs-devtools-chrome.zip` - For Chrome/Edge
- `dist/philjs-devtools-firefox.zip` - For Firefox

## Troubleshooting

### Icons Not Loading

If icons don't appear:
1. Make sure you've generated the PNG files (see step 1)
2. Check that `icons/icon16.png`, `icons/icon48.png`, and `icons/icon128.png` exist
3. Reload the extension in `chrome://extensions`

### Extension Not Appearing in DevTools

1. Make sure Developer mode is enabled
2. Check that the extension is enabled (checkbox in `chrome://extensions`)
3. Try reloading the page and opening DevTools again

### "Disconnected" Status

If the extension shows "Disconnected":
1. Make sure you're viewing a PhilJS application
2. Check the browser console for any errors
3. Verify that `window.__PHILJS__` exists (type in console)
4. Reload the page

### Content Script Errors

If you see errors about `chrome.runtime`:
1. Make sure you're using the correct manifest for your browser
   - `manifest.json` for Chrome/Edge
   - `manifest-firefox.json` for Firefox
2. Check that all files are in the correct location
3. Reload the extension

## Development Mode

For development:

1. Make changes to any file
2. Go to `chrome://extensions`
3. Click the refresh icon (⟳) on the PhilJS DevTools card
4. Reload your test page
5. The changes should be reflected

**Tip**: Keep the DevTools console open to see any errors or debug messages.

## Permissions Explained

The extension requires these permissions:

- **activeTab**: To access the page content when DevTools is open
- **scripting**: To inject the monitoring script into pages
- **storage**: To save extension preferences (future feature)
- **host_permissions (<all_urls>)**: To work on any website

The extension:
- Only activates when you open DevTools
- Only monitors pages with PhilJS applications
- Does not send data outside your browser
- Does not modify page content (except for highlighting)

## Next Steps

After installation:

1. Read the main [README.md](README.md) for feature documentation
2. Try the extension on a PhilJS demo app
3. Explore each panel (Signals, Components, Performance, Time Travel)
4. Check out the example PhilJS apps in the main repository

## Support

Having issues?

1. Check the [README.md](README.md) troubleshooting section
2. Open an issue on the PhilJS GitHub repository
3. Ask in the PhilJS community discussions

## Uninstalling

To remove the extension:

1. Go to `chrome://extensions` or `edge://extensions`
2. Find PhilJS DevTools
3. Click **Remove**
4. Confirm removal

For Firefox:
1. Go to `about:addons`
2. Find PhilJS DevTools
3. Click **Remove**

---

Happy debugging! 🎉
