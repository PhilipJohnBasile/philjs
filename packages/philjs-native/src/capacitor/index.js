// @ts-nocheck
/**
 * PhilJS Native - Capacitor Integration
 *
 * Provides a unified bridge to Capacitor plugins with lifecycle management,
 * plugin bridging, and native API wrappers for mobile development.
 */
import { signal, effect, batch } from 'philjs-core';
// ============================================================================
// Capacitor Detection
// ============================================================================
/**
 * Check if running in Capacitor
 */
export function isCapacitor() {
    if (typeof window === 'undefined')
        return false;
    return !!window.Capacitor;
}
/**
 * Check if running on native platform
 */
export function isNativePlatform() {
    if (!isCapacitor())
        return false;
    const platform = getCapacitorPlatform();
    return platform === 'ios' || platform === 'android';
}
/**
 * Get Capacitor platform
 */
export function getCapacitorPlatform() {
    if (typeof window === 'undefined')
        return 'web';
    const capacitor = window.Capacitor;
    if (!capacitor)
        return 'web';
    return capacitor.getPlatform?.() || 'web';
}
/**
 * Get Capacitor instance
 */
export function getCapacitor() {
    if (typeof window === 'undefined')
        return null;
    return window.Capacitor;
}
// ============================================================================
// Plugin Bridge
// ============================================================================
/**
 * Plugin registry
 */
const pluginRegistry = new Map();
/**
 * Callback registry for async operations
 */
const callbackRegistry = new Map();
/**
 * Generate unique callback ID
 */
let callbackCounter = 0;
function generateCallbackId() {
    return `callback_${++callbackCounter}_${Date.now()}`;
}
/**
 * Register a Capacitor plugin
 */
export function registerPlugin(name, config) {
    const plugin = {
        name,
        ...config,
    };
    // Try to get native plugin if available
    if (isCapacitor()) {
        const capacitor = getCapacitor();
        if (capacitor?.Plugins?.[name]) {
            plugin.instance = capacitor.Plugins[name];
        }
    }
    // Fall back to web implementation
    if (!plugin.instance && config.web) {
        plugin.instance = config.web;
    }
    pluginRegistry.set(name, plugin);
    return plugin;
}
/**
 * Get a registered plugin
 */
export function getPlugin(name) {
    const plugin = pluginRegistry.get(name);
    return plugin?.instance;
}
/**
 * Check if plugin is available
 */
export function hasPlugin(name) {
    return pluginRegistry.has(name);
}
/**
 * Call a plugin method
 */
export async function callPlugin(pluginName, methodName, ...args) {
    const plugin = getPlugin(pluginName);
    if (!plugin) {
        throw new Error(`Plugin "${pluginName}" is not registered`);
    }
    const method = plugin[methodName];
    if (typeof method !== 'function') {
        throw new Error(`Method "${methodName}" not found on plugin "${pluginName}"`);
    }
    try {
        const result = await method.apply(plugin, args);
        return result;
    }
    catch (error) {
        const pluginError = error;
        throw new Error(`Plugin error [${pluginName}.${methodName}]: ${pluginError.message}`);
    }
}
/**
 * Plugin bridge for direct native communication
 */
export class PluginBridge {
    static instance;
    messageQueue = [];
    isReady = false;
    constructor() {
        this.setupBridge();
    }
    static getInstance() {
        if (!PluginBridge.instance) {
            PluginBridge.instance = new PluginBridge();
        }
        return PluginBridge.instance;
    }
    setupBridge() {
        if (typeof window === 'undefined')
            return;
        // Listen for native responses
        window.__capacitorCallback = (response) => {
            if (response.callbackId) {
                const callback = callbackRegistry.get(response.callbackId);
                if (callback) {
                    callback(response);
                    callbackRegistry.delete(response.callbackId);
                }
            }
        };
        // Mark bridge as ready
        this.isReady = true;
        // Process queued messages
        this.processQueue();
    }
    processQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            if (message) {
                this.sendToNative(message);
            }
        }
    }
    sendToNative(message) {
        if (typeof window === 'undefined')
            return;
        const capacitor = getCapacitor();
        if (capacitor?.toNative) {
            capacitor.toNative(message.pluginId, message.methodName, message.args);
        }
    }
    /**
     * Send a message to native
     */
    async send(pluginId, methodName, ...args) {
        return new Promise((resolve, reject) => {
            const callbackId = generateCallbackId();
            callbackRegistry.set(callbackId, (response) => {
                if (response.success) {
                    resolve(response.data);
                }
                else {
                    reject(new Error(response.error?.message || 'Unknown error'));
                }
            });
            const message = {
                pluginId,
                methodName,
                args,
                callbackId,
            };
            if (this.isReady) {
                this.sendToNative(message);
            }
            else {
                this.messageQueue.push(message);
            }
        });
    }
}
// Export singleton
export const pluginBridge = PluginBridge.getInstance();
/**
 * Get device information
 */
export async function getDeviceInfo() {
    if (!isCapacitor()) {
        // Return web defaults
        return {
            platform: 'web',
            uuid: generateUUID(),
            model: navigator.userAgent,
            manufacturer: 'Unknown',
            osVersion: navigator.platform,
            isVirtual: false,
            memUsed: 0,
            diskFree: 0,
            diskTotal: 0,
            batteryLevel: 1,
            isCharging: false,
        };
    }
    try {
        return await callPlugin('Device', 'getInfo');
    }
    catch {
        return {
            platform: getCapacitorPlatform(),
            uuid: generateUUID(),
            model: 'Unknown',
            manufacturer: 'Unknown',
            osVersion: 'Unknown',
            isVirtual: false,
            memUsed: 0,
            diskFree: 0,
            diskTotal: 0,
            batteryLevel: 1,
            isCharging: false,
        };
    }
}
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
/**
 * Splash screen control
 */
export const SplashScreen = {
    async show(options) {
        if (!isCapacitor())
            return;
        try {
            await callPlugin('SplashScreen', 'show', options);
        }
        catch {
            // Ignore if plugin not available
        }
    },
    async hide(options) {
        if (!isCapacitor())
            return;
        try {
            await callPlugin('SplashScreen', 'hide', options);
        }
        catch {
            // Ignore if plugin not available
        }
    },
};
/**
 * Status bar control
 */
export const CapacitorStatusBar = {
    async setStyle(options) {
        if (!isNativePlatform())
            return;
        try {
            await callPlugin('StatusBar', 'setStyle', options);
        }
        catch {
            // Ignore if plugin not available
        }
    },
    async setBackgroundColor(options) {
        if (!isNativePlatform())
            return;
        try {
            await callPlugin('StatusBar', 'setBackgroundColor', options);
        }
        catch {
            // Ignore if plugin not available
        }
    },
    async show() {
        if (!isNativePlatform())
            return;
        try {
            await callPlugin('StatusBar', 'show');
        }
        catch {
            // Ignore if plugin not available
        }
    },
    async hide() {
        if (!isNativePlatform())
            return;
        try {
            await callPlugin('StatusBar', 'hide');
        }
        catch {
            // Ignore if plugin not available
        }
    },
    async getInfo() {
        if (!isNativePlatform()) {
            return { visible: true, style: 'Default' };
        }
        try {
            return await callPlugin('StatusBar', 'getInfo');
        }
        catch {
            return { visible: true, style: 'Default' };
        }
    },
};
// ============================================================================
// Lifecycle Hooks
// ============================================================================
/**
 * App state signal
 */
export const appState = signal({
    isActive: true,
    isBackground: false,
});
/**
 * Lifecycle event listeners
 */
const lifecycleListeners = new Map();
/**
 * Add lifecycle event listener
 */
export function addLifecycleListener(event, callback) {
    if (!lifecycleListeners.has(event)) {
        lifecycleListeners.set(event, new Set());
    }
    lifecycleListeners.get(event).add(callback);
    // Set up native listener if first listener for this event
    if (lifecycleListeners.get(event).size === 1) {
        setupNativeLifecycleListener(event);
    }
    return () => {
        lifecycleListeners.get(event)?.delete(callback);
    };
}
/**
 * Set up native lifecycle listener
 */
function setupNativeLifecycleListener(event) {
    if (!isCapacitor()) {
        // Set up web equivalents
        setupWebLifecycleListener(event);
        return;
    }
    const capacitor = getCapacitor();
    if (!capacitor?.Plugins?.App)
        return;
    const App = capacitor.Plugins.App;
    switch (event) {
        case 'appStateChange':
            App.addListener('appStateChange', (state) => {
                batch(() => {
                    appState.set({
                        isActive: state.isActive,
                        isBackground: !state.isActive,
                    });
                });
                emitLifecycleEvent('appStateChange', state);
            });
            break;
        case 'pause':
            App.addListener('pause', () => {
                emitLifecycleEvent('pause');
            });
            break;
        case 'resume':
            App.addListener('resume', () => {
                emitLifecycleEvent('resume');
            });
            break;
        case 'backButton':
            App.addListener('backButton', (data) => {
                emitLifecycleEvent('backButton', data);
            });
            break;
    }
}
/**
 * Set up web lifecycle listeners
 */
function setupWebLifecycleListener(event) {
    if (typeof window === 'undefined' || typeof document === 'undefined')
        return;
    switch (event) {
        case 'appStateChange':
        case 'pause':
        case 'resume':
            document.addEventListener('visibilitychange', () => {
                const isActive = document.visibilityState === 'visible';
                batch(() => {
                    appState.set({
                        isActive,
                        isBackground: !isActive,
                    });
                });
                emitLifecycleEvent('appStateChange', { isActive });
                emitLifecycleEvent(isActive ? 'resume' : 'pause');
            });
            break;
        case 'backButton':
            window.addEventListener('popstate', () => {
                emitLifecycleEvent('backButton', { canGoBack: window.history.length > 1 });
            });
            break;
    }
}
/**
 * Emit lifecycle event
 */
function emitLifecycleEvent(event, data) {
    lifecycleListeners.get(event)?.forEach((callback) => {
        try {
            callback(data);
        }
        catch (error) {
            console.error(`Lifecycle event error [${event}]:`, error);
        }
    });
}
/**
 * Hook for app state changes
 */
export function useAppState() {
    return appState();
}
/**
 * Hook for pause event
 */
export function useOnPause(callback) {
    effect(() => {
        const unsubscribe = addLifecycleListener('pause', callback);
        return unsubscribe;
    });
}
/**
 * Hook for resume event
 */
export function useOnResume(callback) {
    effect(() => {
        const unsubscribe = addLifecycleListener('resume', callback);
        return unsubscribe;
    });
}
/**
 * Hook for back button (Android)
 */
export function useBackButton(callback) {
    effect(() => {
        const unsubscribe = addLifecycleListener('backButton', callback);
        return unsubscribe;
    });
}
// ============================================================================
// App Control
// ============================================================================
/**
 * Exit the app (Android only)
 */
export async function exitApp() {
    if (!isCapacitor())
        return;
    try {
        await callPlugin('App', 'exitApp');
    }
    catch {
        // Ignore if not available
    }
}
/**
 * Get app info
 */
export async function getAppInfo() {
    if (!isCapacitor()) {
        return {
            name: document?.title || 'App',
            id: 'com.app.web',
            build: '1',
            version: '1.0.0',
        };
    }
    try {
        return await callPlugin('App', 'getInfo');
    }
    catch {
        return {
            name: 'App',
            id: 'com.app.unknown',
            build: '1',
            version: '1.0.0',
        };
    }
}
/**
 * Get app launch URL (deep link)
 */
export async function getLaunchUrl() {
    if (!isCapacitor())
        return null;
    try {
        return await callPlugin('App', 'getLaunchUrl');
    }
    catch {
        return null;
    }
}
/**
 * Open URL in external browser
 */
export async function openUrl(url) {
    if (!isCapacitor()) {
        window.open(url, '_blank');
        return;
    }
    try {
        await callPlugin('Browser', 'open', { url });
    }
    catch {
        window.open(url, '_blank');
    }
}
// ============================================================================
// Capacitor Initialization
// ============================================================================
/**
 * Initialize Capacitor integration
 */
export async function initCapacitor(config) {
    // Hide splash screen after initialization
    await SplashScreen.hide({ fadeOutDuration: 200 });
    // Set up default lifecycle listeners
    addLifecycleListener('appStateChange', () => { });
    // Log platform info
    if (process.env.NODE_ENV === 'development') {
        console.log(`[PhilJS Native] Platform: ${getCapacitorPlatform()}`);
        console.log(`[PhilJS Native] Is Native: ${isNativePlatform()}`);
    }
}
// ============================================================================
// Exports
// ============================================================================
export * from './plugins/index.js';
//# sourceMappingURL=index.js.map