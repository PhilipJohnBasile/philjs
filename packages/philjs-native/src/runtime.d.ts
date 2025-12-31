/**
 * PhilJS Native Runtime
 *
 * Core runtime for cross-platform mobile app development.
 * Provides platform detection, native bridge communication, and app lifecycle management.
 */
import { type Signal } from 'philjs-core';
/**
 * Supported platforms
 */
export type Platform = 'ios' | 'android' | 'web';
/**
 * Platform-specific information
 */
export interface PlatformInfo {
    platform: Platform;
    version: string;
    isNative: boolean;
    isWeb: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    deviceType: 'phone' | 'tablet' | 'desktop';
    screenWidth: number;
    screenHeight: number;
    pixelRatio: number;
    colorScheme: 'light' | 'dark';
}
/**
 * Detect the current platform
 */
export declare function detectPlatform(): Platform;
/**
 * Get detailed platform information
 */
export declare function getPlatformInfo(): PlatformInfo;
/**
 * Reactive platform info signal
 */
export declare const platformInfo: Signal<PlatformInfo>;
/**
 * Message sent to native layer
 */
export interface NativeBridgeMessage {
    id: string;
    module: string;
    method: string;
    args: any[];
}
/**
 * Response from native layer
 */
export interface NativeBridgeResponse {
    id: string;
    success: boolean;
    result?: any;
    error?: string;
}
/**
 * Native bridge for communication with platform APIs
 */
export declare class NativeBridge {
    private static instance;
    private pendingCalls;
    private messageId;
    private eventListeners;
    private constructor();
    /**
     * Get the singleton instance
     */
    static getInstance(): NativeBridge;
    /**
     * Call a native module method
     */
    call<T = any>(module: string, method: string, ...args: any[]): Promise<T>;
    /**
     * Handle response from native layer
     */
    private handleNativeResponse;
    /**
     * Web fallback for native methods
     */
    private webFallback;
    /**
     * Subscribe to native events
     */
    on(event: string, callback: Function): () => void;
    /**
     * Emit event to listeners (called from native)
     */
    emit(event: string, data: any): void;
}
export declare const nativeBridge: NativeBridge;
/**
 * Native component configuration
 */
export interface NativeComponentConfig {
    name: string;
    render: (props: any) => any;
    defaultProps?: Record<string, any>;
    nativeTag?: string;
}
/**
 * Register a native component
 */
export declare function registerNativeComponent(name: string, component: NativeComponentConfig['render'], options?: Omit<NativeComponentConfig, 'name' | 'render'>): void;
/**
 * Get a registered native component
 */
export declare function getNativeComponent(name: string): NativeComponentConfig | undefined;
/**
 * Check if a component is registered
 */
export declare function hasNativeComponent(name: string): boolean;
/**
 * Get all registered component names
 */
export declare function getRegisteredComponents(): string[];
/**
 * App state
 */
export type AppState = 'active' | 'background' | 'inactive';
/**
 * App lifecycle events
 */
export interface AppLifecycleEvents {
    onStateChange?: (state: AppState) => void;
    onMemoryWarning?: () => void;
    onDeepLink?: (url: string) => void;
    onNotification?: (notification: any) => void;
}
/**
 * App configuration
 */
export interface NativeAppConfig {
    /**
     * Root component to render
     */
    root: () => any;
    /**
     * Initial route (for navigation)
     */
    initialRoute?: string;
    /**
     * App lifecycle event handlers
     */
    lifecycle?: AppLifecycleEvents;
    /**
     * Theme configuration
     */
    theme?: {
        light?: Record<string, string>;
        dark?: Record<string, string>;
    };
    /**
     * Enable strict mode
     */
    strict?: boolean;
}
/**
 * Native app instance
 */
export interface NativeApp {
    /**
     * Current app state
     */
    state: Signal<AppState>;
    /**
     * Platform information
     */
    platform: Signal<PlatformInfo>;
    /**
     * Render the app
     */
    render(): void;
    /**
     * Unmount the app
     */
    unmount(): void;
    /**
     * Navigate to a route
     */
    navigate(route: string, params?: Record<string, any>): void;
}
/**
 * Create a native mobile app
 */
export declare function createNativeApp(config: NativeAppConfig): NativeApp;
/**
 * Execute code only on specific platforms
 */
export declare function onPlatform<T>(handlers: {
    ios?: () => T;
    android?: () => T;
    web?: () => T;
    native?: () => T;
    default?: () => T;
}): T | undefined;
/**
 * Select a value based on platform
 */
export declare function platformSelect<T>(options: {
    ios?: T;
    android?: T;
    web?: T;
    native?: T;
    default: T;
}): T;
/**
 * Screen dimensions
 */
export interface Dimensions {
    width: number;
    height: number;
    scale: number;
}
/**
 * Get current screen dimensions
 */
export declare function getDimensions(): Dimensions;
/**
 * Reactive dimensions signal
 */
export declare const dimensions: Signal<Dimensions>;
export type { Signal, };
//# sourceMappingURL=runtime.d.ts.map