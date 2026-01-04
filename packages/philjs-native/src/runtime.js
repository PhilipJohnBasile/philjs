/**
 * PhilJS Native Runtime
 *
 * Core runtime for cross-platform mobile app development.
 * Provides platform detection, native bridge communication, and app lifecycle management.
 */
import { signal, effect, batch } from '@philjs/core';
/**
 * Detect the current platform
 */
export function detectPlatform() {
    // Check for native bridges
    if (typeof globalThis.__PHILJS_IOS__ !== 'undefined') {
        return 'ios';
    }
    if (typeof globalThis.__PHILJS_ANDROID__ !== 'undefined') {
        return 'android';
    }
    // Fall back to web
    return 'web';
}
/**
 * Get detailed platform information
 */
export function getPlatformInfo() {
    const platform = detectPlatform();
    const isNative = platform !== 'web';
    // Default values for SSR/testing
    let screenWidth = 375;
    let screenHeight = 812;
    let pixelRatio = 2;
    let colorScheme = 'light';
    let deviceType = 'phone';
    if (typeof window !== 'undefined') {
        screenWidth = window.innerWidth;
        screenHeight = window.innerHeight;
        pixelRatio = window.devicePixelRatio || 1;
        // Detect color scheme
        if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
            colorScheme = 'dark';
        }
        // Detect device type
        if (screenWidth >= 1024) {
            deviceType = 'desktop';
        }
        else if (screenWidth >= 768) {
            deviceType = 'tablet';
        }
    }
    // Get version from native bridge or navigator
    let version = '1.0.0';
    if (isNative) {
        version = globalThis.__PHILJS_VERSION__ || '1.0.0';
    }
    else if (typeof navigator !== 'undefined') {
        // Extract version from user agent (simplified)
        const match = navigator.userAgent.match(/\d+\.\d+(\.\d+)?/);
        if (match) {
            version = match[0];
        }
    }
    return {
        platform,
        version,
        isNative,
        isWeb: !isNative,
        isIOS: platform === 'ios',
        isAndroid: platform === 'android',
        deviceType,
        screenWidth,
        screenHeight,
        pixelRatio,
        colorScheme,
    };
}
/**
 * Reactive platform info signal
 */
export const platformInfo = signal(getPlatformInfo());
// Update platform info on resize/orientation change
if (typeof window !== 'undefined') {
    window.addEventListener('resize', () => {
        platformInfo.set(getPlatformInfo());
    });
    window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => {
        platformInfo.set(getPlatformInfo());
    });
}
/**
 * Native bridge for communication with platform APIs
 */
export class NativeBridge {
    static instance;
    pendingCalls = new Map();
    messageId = 0;
    eventListeners = new Map();
    constructor() {
        // Set up global callback for native responses
        if (typeof globalThis !== 'undefined') {
            globalThis.__philjsNativeCallback = this.handleNativeResponse.bind(this);
        }
    }
    /**
     * Get the singleton instance
     */
    static getInstance() {
        if (!NativeBridge.instance) {
            NativeBridge.instance = new NativeBridge();
        }
        return NativeBridge.instance;
    }
    /**
     * Call a native module method
     */
    async call(module, method, ...args) {
        const platform = detectPlatform();
        if (platform === 'web') {
            // Return mock/web fallback
            return this.webFallback(module, method, args);
        }
        const id = `${++this.messageId}`;
        const message = {
            id,
            module,
            method,
            args,
        };
        return new Promise((resolve, reject) => {
            this.pendingCalls.set(id, { resolve, reject });
            // Send message to native layer
            if (platform === 'ios') {
                window.webkit?.messageHandlers?.philjs?.postMessage(message);
            }
            else if (platform === 'android') {
                window.PhilJSNative?.postMessage(JSON.stringify(message));
            }
            // Timeout after 30 seconds
            setTimeout(() => {
                if (this.pendingCalls.has(id)) {
                    this.pendingCalls.delete(id);
                    reject(new Error(`Native call timed out: ${module}.${method}`));
                }
            }, 30000);
        });
    }
    /**
     * Handle response from native layer
     */
    handleNativeResponse(response) {
        const pending = this.pendingCalls.get(response.id);
        if (!pending)
            return;
        this.pendingCalls.delete(response.id);
        if (response.success) {
            pending.resolve(response.result);
        }
        else {
            pending.reject(new Error(response.error || 'Unknown native error'));
        }
    }
    /**
     * Web fallback for native methods
     */
    async webFallback(module, method, args) {
        // Provide web-compatible fallbacks for common native APIs
        switch (`${module}.${method}`) {
            case 'Storage.getItem':
                return localStorage.getItem(args[0]);
            case 'Storage.setItem':
                localStorage.setItem(args[0], args[1]);
                return undefined;
            case 'Storage.removeItem':
                localStorage.removeItem(args[0]);
                return undefined;
            case 'Clipboard.getString':
                return await navigator.clipboard.readText();
            case 'Clipboard.setString':
                await navigator.clipboard.writeText(args[0]);
                return undefined;
            case 'Share.share':
                if (navigator.share) {
                    await navigator.share(args[0]);
                }
                return undefined;
            case 'Haptics.impact':
                if (navigator.vibrate) {
                    navigator.vibrate(args[0] === 'heavy' ? 100 : args[0] === 'medium' ? 50 : 25);
                }
                return undefined;
            default:
                console.warn(`No web fallback for ${module}.${method}`);
                return undefined;
        }
    }
    /**
     * Subscribe to native events
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event).add(callback);
        return () => {
            this.eventListeners.get(event)?.delete(callback);
        };
    }
    /**
     * Emit event to listeners (called from native)
     */
    emit(event, data) {
        this.eventListeners.get(event)?.forEach(callback => {
            try {
                callback(data);
            }
            catch (error) {
                console.error(`Error in native event listener for ${event}:`, error);
            }
        });
    }
}
// Export singleton getter
export const nativeBridge = NativeBridge.getInstance();
/**
 * Registry for native components
 */
const componentRegistry = new Map();
/**
 * Register a native component
 */
export function registerNativeComponent(name, component, options = {}) {
    componentRegistry.set(name, {
        name,
        render: component,
        ...options,
    });
}
/**
 * Get a registered native component
 */
export function getNativeComponent(name) {
    return componentRegistry.get(name);
}
/**
 * Check if a component is registered
 */
export function hasNativeComponent(name) {
    return componentRegistry.has(name);
}
/**
 * Get all registered component names
 */
export function getRegisteredComponents() {
    return Array.from(componentRegistry.keys());
}
/**
 * Create a native mobile app
 */
export function createNativeApp(config) {
    const appState = signal('active');
    let isRendered = false;
    let cleanupFns = [];
    // Set up app state listeners
    if (typeof document !== 'undefined') {
        const handleVisibilityChange = () => {
            const state = document.hidden ? 'background' : 'active';
            appState.set(state);
            config.lifecycle?.onStateChange?.(state);
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        cleanupFns.push(() => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        });
    }
    // Listen for native lifecycle events
    const unsubscribeMemory = nativeBridge.on('memoryWarning', () => {
        config.lifecycle?.onMemoryWarning?.();
    });
    cleanupFns.push(unsubscribeMemory);
    const unsubscribeDeepLink = nativeBridge.on('deepLink', (url) => {
        config.lifecycle?.onDeepLink?.(url);
    });
    cleanupFns.push(unsubscribeDeepLink);
    const unsubscribeNotification = nativeBridge.on('notification', (notification) => {
        config.lifecycle?.onNotification?.(notification);
    });
    cleanupFns.push(unsubscribeNotification);
    // Create theme effect
    if (config.theme) {
        const cleanup = effect(() => {
            const info = platformInfo();
            const colors = info.colorScheme === 'dark'
                ? config.theme?.dark
                : config.theme?.light;
            if (colors && typeof document !== 'undefined') {
                const root = document.documentElement;
                for (const [key, value] of Object.entries(colors)) {
                    root.style.setProperty(`--${key}`, value);
                }
            }
        });
        cleanupFns.push(cleanup);
    }
    const app = {
        state: appState,
        platform: platformInfo,
        render() {
            if (isRendered)
                return;
            isRendered = true;
            // This would integrate with @philjs/core's render system
            // For native, we'd send the component tree to the native layer
            const platform = detectPlatform();
            if (platform === 'web') {
                // Web rendering - would use @philjs/core hydrate/render
                console.log('[PhilJS Native] Rendering in web mode');
            }
            else {
                // Native rendering - send to native bridge
                nativeBridge.call('App', 'render', {
                    component: config.root.toString(),
                    initialRoute: config.initialRoute,
                });
            }
        },
        unmount() {
            if (!isRendered)
                return;
            isRendered = false;
            // Run all cleanup functions
            cleanupFns.forEach(fn => fn());
            cleanupFns = [];
        },
        navigate(route, params) {
            nativeBridge.call('Navigation', 'navigate', route, params);
        },
    };
    return app;
}
// ============================================================================
// Platform-specific Execution
// ============================================================================
/**
 * Execute code only on specific platforms
 */
export function onPlatform(handlers) {
    const platform = detectPlatform();
    if (platform === 'ios' && handlers.ios) {
        return handlers.ios();
    }
    if (platform === 'android' && handlers.android) {
        return handlers.android();
    }
    if (platform === 'web' && handlers.web) {
        return handlers.web();
    }
    if (platform !== 'web' && handlers.native) {
        return handlers.native();
    }
    if (handlers.default) {
        return handlers.default();
    }
    return undefined;
}
/**
 * Select a value based on platform
 */
export function platformSelect(options) {
    const platform = detectPlatform();
    if (platform === 'ios' && options.ios !== undefined) {
        return options.ios;
    }
    if (platform === 'android' && options.android !== undefined) {
        return options.android;
    }
    if (platform === 'web' && options.web !== undefined) {
        return options.web;
    }
    if (platform !== 'web' && options.native !== undefined) {
        return options.native;
    }
    return options.default;
}
/**
 * Get current screen dimensions
 */
export function getDimensions() {
    if (typeof window !== 'undefined') {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            scale: window.devicePixelRatio || 1,
        };
    }
    return {
        width: 375,
        height: 812,
        scale: 2,
    };
}
/**
 * Reactive dimensions signal
 */
export const dimensions = signal(getDimensions());
// Update dimensions on resize
if (typeof window !== 'undefined') {
    window.addEventListener('resize', () => {
        dimensions.set(getDimensions());
    });
}
//# sourceMappingURL=runtime.js.map