/**
 * PhilJS Native - Capacitor Integration
 *
 * Provides a unified bridge to Capacitor plugins with lifecycle management,
 * plugin bridging, and native API wrappers for mobile development.
 */
import { type Signal } from 'philjs-core';
/**
 * Capacitor plugin registration
 */
export interface CapacitorPlugin<T = unknown> {
    name: string;
    web?: T;
    native?: T;
    instance?: T;
}
/**
 * Plugin bridge message
 */
export interface PluginMessage<T = unknown> {
    pluginId: string;
    methodName: string;
    args: T[];
    callbackId?: string;
}
/**
 * Plugin bridge response
 */
export interface PluginResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
    callbackId?: string;
}
/**
 * Lifecycle event types
 */
export type LifecycleEvent = 'appStateChange' | 'pause' | 'resume' | 'backButton' | 'keyboardWillShow' | 'keyboardDidShow' | 'keyboardWillHide' | 'keyboardDidHide';
/**
 * App state
 */
export interface AppState {
    isActive: boolean;
    isBackground: boolean;
}
/**
 * Capacitor configuration
 */
export interface CapacitorConfig {
    appId: string;
    appName: string;
    webDir?: string;
    plugins?: Record<string, unknown>;
    server?: {
        url?: string;
        cleartext?: boolean;
        androidScheme?: 'http' | 'https';
        iosScheme?: string;
    };
    android?: {
        allowMixedContent?: boolean;
        captureInput?: boolean;
        webContentsDebuggingEnabled?: boolean;
    };
    ios?: {
        contentInset?: 'automatic' | 'scrollableAxes' | 'never' | 'always';
        allowsLinkPreview?: boolean;
        scrollEnabled?: boolean;
    };
}
/**
 * Check if running in Capacitor
 */
export declare function isCapacitor(): boolean;
/**
 * Check if running on native platform
 */
export declare function isNativePlatform(): boolean;
/**
 * Get Capacitor platform
 */
export declare function getCapacitorPlatform(): 'ios' | 'android' | 'web';
/**
 * Get Capacitor instance
 */
export declare function getCapacitor(): any;
/**
 * Register a Capacitor plugin
 */
export declare function registerPlugin<T>(name: string, config: Omit<CapacitorPlugin<T>, 'name'>): CapacitorPlugin<T>;
/**
 * Get a registered plugin
 */
export declare function getPlugin<T>(name: string): T | undefined;
/**
 * Check if plugin is available
 */
export declare function hasPlugin(name: string): boolean;
/**
 * Call a plugin method
 */
export declare function callPlugin<T, R>(pluginName: string, methodName: string, ...args: T[]): Promise<R>;
/**
 * Plugin bridge for direct native communication
 */
export declare class PluginBridge {
    private static instance;
    private messageQueue;
    private isReady;
    private constructor();
    static getInstance(): PluginBridge;
    private setupBridge;
    private processQueue;
    private sendToNative;
    /**
     * Send a message to native
     */
    send<T, R>(pluginId: string, methodName: string, ...args: T[]): Promise<R>;
}
export declare const pluginBridge: PluginBridge;
/**
 * Device info
 */
export interface DeviceInfo {
    platform: 'ios' | 'android' | 'web';
    uuid: string;
    model: string;
    manufacturer: string;
    osVersion: string;
    isVirtual: boolean;
    memUsed: number;
    diskFree: number;
    diskTotal: number;
    batteryLevel: number;
    isCharging: boolean;
}
/**
 * Get device information
 */
export declare function getDeviceInfo(): Promise<DeviceInfo>;
/**
 * Splash screen control
 */
export declare const SplashScreen: {
    show(options?: {
        autoHide?: boolean;
        fadeInDuration?: number;
    }): Promise<void>;
    hide(options?: {
        fadeOutDuration?: number;
    }): Promise<void>;
};
/**
 * Status bar control
 */
export declare const CapacitorStatusBar: {
    setStyle(options: {
        style: "Dark" | "Light" | "Default";
    }): Promise<void>;
    setBackgroundColor(options: {
        color: string;
    }): Promise<void>;
    show(): Promise<void>;
    hide(): Promise<void>;
    getInfo(): Promise<{
        visible: boolean;
        style: string;
    }>;
};
/**
 * App state signal
 */
export declare const appState: Signal<AppState>;
/**
 * Add lifecycle event listener
 */
export declare function addLifecycleListener(event: LifecycleEvent, callback: (data?: any) => void): () => void;
/**
 * Hook for app state changes
 */
export declare function useAppState(): AppState;
/**
 * Hook for pause event
 */
export declare function useOnPause(callback: () => void): void;
/**
 * Hook for resume event
 */
export declare function useOnResume(callback: () => void): void;
/**
 * Hook for back button (Android)
 */
export declare function useBackButton(callback: (data: {
    canGoBack: boolean;
}) => void): void;
/**
 * Exit the app (Android only)
 */
export declare function exitApp(): Promise<void>;
/**
 * Get app info
 */
export declare function getAppInfo(): Promise<{
    name: string;
    id: string;
    build: string;
    version: string;
}>;
/**
 * Get app launch URL (deep link)
 */
export declare function getLaunchUrl(): Promise<{
    url: string;
} | null>;
/**
 * Open URL in external browser
 */
export declare function openUrl(url: string): Promise<void>;
/**
 * Initialize Capacitor integration
 */
export declare function initCapacitor(config?: Partial<CapacitorConfig>): Promise<void>;
export * from './plugins/index.js';
//# sourceMappingURL=index.d.ts.map