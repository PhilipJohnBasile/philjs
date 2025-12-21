/**
 * PhilJS Native Runtime
 *
 * Core runtime for cross-platform mobile app development.
 * Provides platform detection, native bridge communication, and app lifecycle management.
 */

import { signal, effect, batch, type Signal } from 'philjs-core';

// ============================================================================
// Platform Detection
// ============================================================================

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
export function detectPlatform(): Platform {
  // Check for native bridges
  if (typeof (globalThis as any).__PHILJS_IOS__ !== 'undefined') {
    return 'ios';
  }
  if (typeof (globalThis as any).__PHILJS_ANDROID__ !== 'undefined') {
    return 'android';
  }
  // Fall back to web
  return 'web';
}

/**
 * Get detailed platform information
 */
export function getPlatformInfo(): PlatformInfo {
  const platform = detectPlatform();
  const isNative = platform !== 'web';

  // Default values for SSR/testing
  let screenWidth = 375;
  let screenHeight = 812;
  let pixelRatio = 2;
  let colorScheme: 'light' | 'dark' = 'light';
  let deviceType: 'phone' | 'tablet' | 'desktop' = 'phone';

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
    } else if (screenWidth >= 768) {
      deviceType = 'tablet';
    }
  }

  // Get version from native bridge or navigator
  let version = '1.0.0';
  if (isNative) {
    version = (globalThis as any).__PHILJS_VERSION__ || '1.0.0';
  } else if (typeof navigator !== 'undefined') {
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
export const platformInfo: Signal<PlatformInfo> = signal(getPlatformInfo());

// Update platform info on resize/orientation change
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    platformInfo.set(getPlatformInfo());
  });

  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => {
    platformInfo.set(getPlatformInfo());
  });
}

// ============================================================================
// Native Bridge
// ============================================================================

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
export class NativeBridge {
  private static instance: NativeBridge;
  private pendingCalls = new Map<string, { resolve: Function; reject: Function }>();
  private messageId = 0;
  private eventListeners = new Map<string, Set<Function>>();

  private constructor() {
    // Set up global callback for native responses
    if (typeof globalThis !== 'undefined') {
      (globalThis as any).__philjsNativeCallback = this.handleNativeResponse.bind(this);
    }
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): NativeBridge {
    if (!NativeBridge.instance) {
      NativeBridge.instance = new NativeBridge();
    }
    return NativeBridge.instance;
  }

  /**
   * Call a native module method
   */
  async call<T = any>(module: string, method: string, ...args: any[]): Promise<T> {
    const platform = detectPlatform();

    if (platform === 'web') {
      // Return mock/web fallback
      return this.webFallback<T>(module, method, args);
    }

    const id = `${++this.messageId}`;

    const message: NativeBridgeMessage = {
      id,
      module,
      method,
      args,
    };

    return new Promise<T>((resolve, reject) => {
      this.pendingCalls.set(id, { resolve, reject });

      // Send message to native layer
      if (platform === 'ios') {
        (window as any).webkit?.messageHandlers?.philjs?.postMessage(message);
      } else if (platform === 'android') {
        (window as any).PhilJSNative?.postMessage(JSON.stringify(message));
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
  private handleNativeResponse(response: NativeBridgeResponse): void {
    const pending = this.pendingCalls.get(response.id);
    if (!pending) return;

    this.pendingCalls.delete(response.id);

    if (response.success) {
      pending.resolve(response.result);
    } else {
      pending.reject(new Error(response.error || 'Unknown native error'));
    }
  }

  /**
   * Web fallback for native methods
   */
  private async webFallback<T>(module: string, method: string, args: any[]): Promise<T> {
    // Provide web-compatible fallbacks for common native APIs
    switch (`${module}.${method}`) {
      case 'Storage.getItem':
        return localStorage.getItem(args[0]) as T;
      case 'Storage.setItem':
        localStorage.setItem(args[0], args[1]);
        return undefined as T;
      case 'Storage.removeItem':
        localStorage.removeItem(args[0]);
        return undefined as T;
      case 'Clipboard.getString':
        return await navigator.clipboard.readText() as T;
      case 'Clipboard.setString':
        await navigator.clipboard.writeText(args[0]);
        return undefined as T;
      case 'Share.share':
        if (navigator.share) {
          await navigator.share(args[0]);
        }
        return undefined as T;
      case 'Haptics.impact':
        if (navigator.vibrate) {
          navigator.vibrate(args[0] === 'heavy' ? 100 : args[0] === 'medium' ? 50 : 25);
        }
        return undefined as T;
      default:
        console.warn(`No web fallback for ${module}.${method}`);
        return undefined as T;
    }
  }

  /**
   * Subscribe to native events
   */
  on(event: string, callback: Function): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);

    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  /**
   * Emit event to listeners (called from native)
   */
  emit(event: string, data: any): void {
    this.eventListeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in native event listener for ${event}:`, error);
      }
    });
  }
}

// Export singleton getter
export const nativeBridge = NativeBridge.getInstance();

// ============================================================================
// Native Component Registry
// ============================================================================

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
 * Registry for native components
 */
const componentRegistry = new Map<string, NativeComponentConfig>();

/**
 * Register a native component
 */
export function registerNativeComponent(
  name: string,
  component: NativeComponentConfig['render'],
  options: Omit<NativeComponentConfig, 'name' | 'render'> = {}
): void {
  componentRegistry.set(name, {
    name,
    render: component,
    ...options,
  });
}

/**
 * Get a registered native component
 */
export function getNativeComponent(name: string): NativeComponentConfig | undefined {
  return componentRegistry.get(name);
}

/**
 * Check if a component is registered
 */
export function hasNativeComponent(name: string): boolean {
  return componentRegistry.has(name);
}

/**
 * Get all registered component names
 */
export function getRegisteredComponents(): string[] {
  return Array.from(componentRegistry.keys());
}

// ============================================================================
// App Lifecycle
// ============================================================================

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
export function createNativeApp(config: NativeAppConfig): NativeApp {
  const appState = signal<AppState>('active');
  let isRendered = false;
  let cleanupFns: (() => void)[] = [];

  // Set up app state listeners
  if (typeof document !== 'undefined') {
    const handleVisibilityChange = () => {
      const state: AppState = document.hidden ? 'background' : 'active';
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

  const unsubscribeDeepLink = nativeBridge.on('deepLink', (url: string) => {
    config.lifecycle?.onDeepLink?.(url);
  });
  cleanupFns.push(unsubscribeDeepLink);

  const unsubscribeNotification = nativeBridge.on('notification', (notification: any) => {
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

  const app: NativeApp = {
    state: appState,
    platform: platformInfo,

    render() {
      if (isRendered) return;
      isRendered = true;

      // This would integrate with philjs-core's render system
      // For native, we'd send the component tree to the native layer
      const platform = detectPlatform();

      if (platform === 'web') {
        // Web rendering - would use philjs-core hydrate/render
        console.log('[PhilJS Native] Rendering in web mode');
      } else {
        // Native rendering - send to native bridge
        nativeBridge.call('App', 'render', {
          component: config.root.toString(),
          initialRoute: config.initialRoute,
        });
      }
    },

    unmount() {
      if (!isRendered) return;
      isRendered = false;

      // Run all cleanup functions
      cleanupFns.forEach(fn => fn());
      cleanupFns = [];
    },

    navigate(route: string, params?: Record<string, any>) {
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
export function onPlatform<T>(handlers: {
  ios?: () => T;
  android?: () => T;
  web?: () => T;
  native?: () => T;
  default?: () => T;
}): T | undefined {
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
export function platformSelect<T>(options: {
  ios?: T;
  android?: T;
  web?: T;
  native?: T;
  default: T;
}): T {
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

// ============================================================================
// Dimensions Hook
// ============================================================================

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
export function getDimensions(): Dimensions {
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
export const dimensions: Signal<Dimensions> = signal(getDimensions());

// Update dimensions on resize
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    dimensions.set(getDimensions());
  });
}

// ============================================================================
// Types Export
// ============================================================================

export type {
  Signal,
};
