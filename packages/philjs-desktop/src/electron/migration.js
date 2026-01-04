/**
 * Migration helpers for Electron to Tauri
 */
import { BrowserWindow } from './browser-window.js';
import { ipcMain, ipcRenderer } from './ipc.js';
import { app } from './app.js';
// Migration warnings
const migrationWarnings = new Set();
function warn(message) {
    if (!migrationWarnings.has(message)) {
        migrationWarnings.add(message);
        console.warn(`[PhilJS Migration] ${message}`);
    }
}
/**
 * Electron to Tauri API mapper
 */
export const ElectronToTauriMapper = {
    /**
     * Map Electron require to Tauri imports
     */
    mapRequire(module) {
        const mappings = {
            electron: {
                app,
                BrowserWindow,
                ipcMain,
                ipcRenderer,
            },
            'electron/main': {
                app,
                BrowserWindow,
                ipcMain,
            },
            'electron/renderer': {
                ipcRenderer,
            },
        };
        if (mappings[module]) {
            return mappings[module];
        }
        warn(`Module "${module}" is not available in Tauri`);
        return {};
    },
    /**
     * Check API compatibility
     */
    checkCompatibility(api) {
        const compatibility = {
            // Fully supported
            'BrowserWindow': { supported: true },
            'ipcMain.handle': { supported: true },
            'ipcMain.on': { supported: true },
            'ipcRenderer.invoke': { supported: true },
            'ipcRenderer.send': { supported: true },
            'app.quit': { supported: true },
            'app.getVersion': { supported: true },
            'app.getName': { supported: true },
            // Partially supported
            'ipcRenderer.sendSync': { supported: false, alternative: 'ipcRenderer.invoke' },
            'BrowserWindow.loadURL': { supported: true },
            'dialog.showOpenDialog': { supported: true },
            'dialog.showSaveDialog': { supported: true },
            'shell.openExternal': { supported: true, alternative: 'Shell.openUrl' },
            // Not supported
            'protocol.registerHttpProtocol': { supported: false, alternative: 'Tauri custom protocol' },
            'session': { supported: false },
            'webContents.downloadURL': { supported: false, alternative: 'Tauri download API' },
            'powerMonitor': { supported: false },
            'powerSaveBlocker': { supported: false },
            'systemPreferences': { supported: false },
            'TouchBar': { supported: false },
            'net': { supported: false, alternative: 'fetch' },
        };
        return compatibility[api] || { supported: false };
    },
    /**
     * Get migration guide for an API
     */
    getMigrationGuide(api) {
        const guides = {
            'BrowserWindow': `
BrowserWindow is mostly compatible. Key differences:
- Use 'frame' instead of 'titleBarStyle' for frameless windows
- webPreferences.nodeIntegration is always false in Tauri
- Use Tauri's invoke system instead of remote module
      `,
            'ipcMain/ipcRenderer': `
IPC is compatible with some differences:
- sendSync is not available, use invoke instead
- Preload scripts work differently, use contextBridge
- Channel names are the same
      `,
            'dialog': `
Dialog API is mostly compatible:
- showOpenDialog and showSaveDialog work the same
- showMessageBox maps to Tauri's message/confirm dialogs
      `,
            'shell': `
Shell API differences:
- shell.openExternal -> Shell.openUrl
- shell.openPath -> Shell.openPath
- shell.showItemInFolder is not available
      `,
            'autoUpdater': `
Auto-updater migration:
- Use Tauri's updater plugin
- Update manifest format is different
- Use checkForUpdates and installUpdate from lifecycle
      `,
        };
        return guides[api] || 'No migration guide available for this API.';
    },
};
/**
 * Create a migration helper
 */
export function createMigrationHelper() {
    return {
        /**
         * Wrap an Electron-style require
         */
        require(module) {
            return ElectronToTauriMapper.mapRequire(module);
        },
        /**
         * Check if code uses unsupported APIs
         */
        analyzeCode(code) {
            const issues = [];
            const lines = code.split('\n');
            const patterns = [
                { pattern: /remote\.require/g, api: 'remote.require', suggestion: 'Use Tauri invoke' },
                { pattern: /\.sendSync\(/g, api: 'sendSync', suggestion: 'Use invoke instead' },
                { pattern: /nodeIntegration:\s*true/g, api: 'nodeIntegration', suggestion: 'Not supported in Tauri' },
                { pattern: /shell\.showItemInFolder/g, api: 'showItemInFolder', suggestion: 'Not available in Tauri' },
                { pattern: /powerMonitor/g, api: 'powerMonitor', suggestion: 'Not available in Tauri' },
                { pattern: /protocol\.register/g, api: 'protocol', suggestion: 'Use Tauri custom protocol' },
            ];
            lines.forEach((line, index) => {
                patterns.forEach(({ pattern, api, suggestion }) => {
                    if (pattern.test(line)) {
                        issues.push({ api, line: index + 1, suggestion });
                    }
                });
            });
            return issues;
        },
        /**
         * Generate compatibility report
         */
        generateReport(usedApis) {
            let report = '# Electron to Tauri Migration Report\n\n';
            const supported = [];
            const unsupported = [];
            const partial = [];
            usedApis.forEach(api => {
                const { supported: isSupported, alternative } = ElectronToTauriMapper.checkCompatibility(api);
                if (isSupported) {
                    supported.push(api);
                }
                else if (alternative) {
                    partial.push(`${api} -> ${alternative}`);
                }
                else {
                    unsupported.push(api);
                }
            });
            report += '## Fully Supported APIs\n';
            report += supported.map(a => `- ${a}`).join('\n') + '\n\n';
            report += '## Partially Supported APIs\n';
            report += partial.map(a => `- ${a}`).join('\n') + '\n\n';
            report += '## Unsupported APIs\n';
            report += unsupported.map(a => `- ${a}`).join('\n') + '\n\n';
            return report;
        },
    };
}
//# sourceMappingURL=migration.js.map