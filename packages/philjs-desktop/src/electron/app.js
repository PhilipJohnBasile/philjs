/**
 * Electron App Compatibility Layer
 * Provides app module API on top of Tauri
 */
import { getAppName, getAppVersion } from '../tauri/app.js';
import { onAppReady, onBeforeQuit, onWillQuit, quitApp } from '../lifecycle.js';
import { isTauri } from '../tauri/context.js';
const appEventHandlers = new Map();
// App state
let appIsReady = false;
let appIsQuitting = false;
/**
 * app - Electron app module compatibility
 */
export const app = {
    /**
     * Check if app is ready
     */
    isReady() {
        return appIsReady;
    },
    /**
     * Wait for app to be ready
     */
    whenReady() {
        if (appIsReady) {
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            onAppReady(() => {
                appIsReady = true;
                resolve();
            });
        });
    },
    /**
     * Get app name
     */
    getName() {
        // Sync version - returns cached or default
        return document.title || 'PhilJS App';
    },
    /**
     * Get app name async
     */
    async getNameAsync() {
        return getAppName();
    },
    /**
     * Set app name
     */
    setName(name) {
        document.title = name;
    },
    /**
     * Get app version
     */
    getVersion() {
        // Return from meta tag or default
        const meta = document.querySelector('meta[name="version"]');
        return meta?.getAttribute('content') || '0.0.0';
    },
    /**
     * Get app version async
     */
    async getVersionAsync() {
        return getAppVersion();
    },
    /**
     * Get app path
     */
    getPath(name) {
        // In Tauri, paths need async API - return placeholder
        console.warn('[app] getPath requires async API in Tauri');
        return '';
    },
    /**
     * Get app path async
     */
    async getPathAsync(name) {
        if (!isTauri()) {
            return '';
        }
        const pathModule = await import('@tauri-apps/api/path');
        const pathMap = {
            home: pathModule.homeDir,
            appData: pathModule.appDataDir,
            userData: pathModule.appDataDir,
            temp: pathModule.tempDir,
            desktop: pathModule.desktopDir,
            documents: pathModule.documentDir,
            downloads: pathModule.downloadDir,
            music: pathModule.audioDir,
            pictures: pathModule.pictureDir,
            videos: pathModule.videoDir,
            logs: pathModule.appLogDir,
            cache: pathModule.appCacheDir,
        };
        const pathFn = pathMap[name];
        if (pathFn) {
            return pathFn();
        }
        throw new Error(`Unknown path name: ${name}`);
    },
    /**
     * Set path
     */
    setPath(name, path) {
        console.warn('[app] setPath is not supported in Tauri');
    },
    /**
     * Get locale
     */
    getLocale() {
        return navigator.language || 'en-US';
    },
    /**
     * Quit the app
     */
    quit() {
        appIsQuitting = true;
        this.emit('before-quit');
        this.emit('will-quit');
        quitApp();
        this.emit('quit');
    },
    /**
     * Exit the app
     */
    exit(exitCode = 0) {
        quitApp(exitCode);
    },
    /**
     * Relaunch the app
     */
    async relaunch() {
        if (!isTauri()) {
            window.location.reload();
            return;
        }
        const { relaunch } = await import('@tauri-apps/plugin-process');
        await relaunch();
    },
    /**
     * Check if app is quitting
     */
    isQuitting() {
        return appIsQuitting;
    },
    /**
     * Focus the app
     */
    focus() {
        window.focus();
    },
    /**
     * Hide the app (macOS)
     */
    hide() {
        console.warn('[app] hide is only available on macOS');
    },
    /**
     * Show the app (macOS)
     */
    show() {
        console.warn('[app] show is only available on macOS');
    },
    /**
     * Set about panel options (macOS)
     */
    setAboutPanelOptions(options) {
        console.warn('[app] setAboutPanelOptions is only available on macOS');
    },
    /**
     * Show about panel (macOS)
     */
    showAboutPanel() {
        console.warn('[app] showAboutPanel is only available on macOS');
    },
    /**
     * Set badge count (macOS/Linux)
     */
    setBadgeCount(count) {
        console.warn('[app] setBadgeCount is only available on macOS/Linux');
        return false;
    },
    /**
     * Get badge count
     */
    getBadgeCount() {
        return 0;
    },
    /**
     * Check if running as single instance
     */
    requestSingleInstanceLock() {
        console.warn('[app] Single instance lock requires Tauri plugin');
        return true;
    },
    /**
     * Release single instance lock
     */
    releaseSingleInstanceLock() {
        // No-op
    },
    /**
     * Set login item settings
     */
    setLoginItemSettings(settings) {
        console.warn('[app] Use AutoLaunch API for login items');
    },
    /**
     * Get login item settings
     */
    getLoginItemSettings() {
        return { openAtLogin: false };
    },
    // Event emitter methods
    on(event, handler) {
        if (!appEventHandlers.has(event)) {
            appEventHandlers.set(event, new Set());
            // Hook into lifecycle events
            switch (event) {
                case 'ready':
                    onAppReady(() => this.emit('ready'));
                    break;
                case 'before-quit':
                    onBeforeQuit(() => this.emit('before-quit'));
                    break;
                case 'will-quit':
                    onWillQuit(() => this.emit('will-quit'));
                    break;
            }
        }
        appEventHandlers.get(event).add(handler);
        return this;
    },
    once(event, handler) {
        const wrapper = (...args) => {
            this.removeListener(event, wrapper);
            handler(...args);
        };
        return this.on(event, wrapper);
    },
    removeListener(event, handler) {
        appEventHandlers.get(event)?.delete(handler);
        return this;
    },
    removeAllListeners(event) {
        if (event) {
            appEventHandlers.delete(event);
        }
        else {
            appEventHandlers.clear();
        }
        return this;
    },
    emit(event, ...args) {
        const handlers = appEventHandlers.get(event);
        if (handlers && handlers.size > 0) {
            handlers.forEach(handler => handler(...args));
            return true;
        }
        return false;
    },
    listenerCount(event) {
        return appEventHandlers.get(event)?.size || 0;
    },
};
// Initialize
if (typeof window !== 'undefined') {
    // Mark as ready when DOM is loaded
    if (document.readyState === 'complete') {
        appIsReady = true;
        setTimeout(() => app.emit('ready'), 0);
    }
    else {
        window.addEventListener('DOMContentLoaded', () => {
            appIsReady = true;
            app.emit('ready');
        });
    }
}
export default app;
//# sourceMappingURL=app.js.map