// @ts-nocheck
/**
 * PhilJS Native - Capacitor Integration
 *
 * Provides a unified bridge to Capacitor plugins with lifecycle management,
 * plugin bridging, and native API wrappers for mobile development.
 */

import { signal, effect, batch, type Signal } from 'philjs-core';

// ============================================================================
// Types
// ============================================================================

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
export type LifecycleEvent =
  | 'appStateChange'
  | 'pause'
  | 'resume'
  | 'backButton'
  | 'keyboardWillShow'
  | 'keyboardDidShow'
  | 'keyboardWillHide'
  | 'keyboardDidHide';

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

// ============================================================================
// Capacitor Detection
// ============================================================================

/**
 * Check if running in Capacitor
 */
export function isCapacitor(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor;
}

/**
 * Check if running on native platform
 */
export function isNativePlatform(): boolean {
  if (!isCapacitor()) return false;
  const platform = getCapacitorPlatform();
  return platform === 'ios' || platform === 'android';
}

/**
 * Get Capacitor platform
 */
export function getCapacitorPlatform(): 'ios' | 'android' | 'web' {
  if (typeof window === 'undefined') return 'web';
  const capacitor = (window as any).Capacitor;
  if (!capacitor) return 'web';
  return capacitor.getPlatform?.() || 'web';
}

/**
 * Get Capacitor instance
 */
export function getCapacitor(): any {
  if (typeof window === 'undefined') return null;
  return (window as any).Capacitor;
}

// ============================================================================
// Plugin Bridge
// ============================================================================

/**
 * Plugin registry
 */
const pluginRegistry = new Map<string, CapacitorPlugin>();

/**
 * Callback registry for async operations
 */
const callbackRegistry = new Map<string, (response: PluginResponse) => void>();

/**
 * Generate unique callback ID
 */
let callbackCounter = 0;
function generateCallbackId(): string {
  return `callback_${++callbackCounter}_${Date.now()}`;
}

/**
 * Register a Capacitor plugin
 */
export function registerPlugin<T>(
  name: string,
  config: Omit<CapacitorPlugin<T>, 'name'>
): CapacitorPlugin<T> {
  const plugin: CapacitorPlugin<T> = {
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
export function getPlugin<T>(name: string): T | undefined {
  const plugin = pluginRegistry.get(name);
  return plugin?.instance as T | undefined;
}

/**
 * Check if plugin is available
 */
export function hasPlugin(name: string): boolean {
  return pluginRegistry.has(name);
}

/**
 * Call a plugin method
 */
export async function callPlugin<T, R>(
  pluginName: string,
  methodName: string,
  ...args: T[]
): Promise<R> {
  const plugin = getPlugin<any>(pluginName);

  if (!plugin) {
    throw new Error(`Plugin "${pluginName}" is not registered`);
  }

  const method = plugin[methodName];

  if (typeof method !== 'function') {
    throw new Error(`Method "${methodName}" not found on plugin "${pluginName}"`);
  }

  try {
    const result = await method.apply(plugin, args);
    return result as R;
  } catch (error) {
    const pluginError = error as Error;
    throw new Error(`Plugin error [${pluginName}.${methodName}]: ${pluginError.message}`);
  }
}

/**
 * Plugin bridge for direct native communication
 */
export class PluginBridge {
  private static instance: PluginBridge;
  private messageQueue: PluginMessage[] = [];
  private isReady = false;

  private constructor() {
    this.setupBridge();
  }

  static getInstance(): PluginBridge {
    if (!PluginBridge.instance) {
      PluginBridge.instance = new PluginBridge();
    }
    return PluginBridge.instance;
  }

  private setupBridge(): void {
    if (typeof window === 'undefined') return;

    // Listen for native responses
    (window as any).__capacitorCallback = (response: PluginResponse) => {
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

  private processQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendToNative(message);
      }
    }
  }

  private sendToNative(message: PluginMessage): void {
    if (typeof window === 'undefined') return;

    const capacitor = getCapacitor();
    if (capacitor?.toNative) {
      capacitor.toNative(message.pluginId, message.methodName, message.args);
    }
  }

  /**
   * Send a message to native
   */
  async send<T, R>(
    pluginId: string,
    methodName: string,
    ...args: T[]
  ): Promise<R> {
    return new Promise((resolve, reject) => {
      const callbackId = generateCallbackId();

      callbackRegistry.set(callbackId, (response) => {
        if (response.success) {
          resolve(response.data as R);
        } else {
          reject(new Error(response.error?.message || 'Unknown error'));
        }
      });

      const message: PluginMessage<T> = {
        pluginId,
        methodName,
        args,
        callbackId,
      };

      if (this.isReady) {
        this.sendToNative(message);
      } else {
        this.messageQueue.push(message);
      }
    });
  }
}

// Export singleton
export const pluginBridge = PluginBridge.getInstance();

// ============================================================================
// Native API Wrappers
// ============================================================================

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
export async function getDeviceInfo(): Promise<DeviceInfo> {
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
    return await callPlugin<never, DeviceInfo>('Device', 'getInfo');
  } catch {
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

function generateUUID(): string {
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
  async show(options?: { autoHide?: boolean; fadeInDuration?: number }): Promise<void> {
    if (!isCapacitor()) return;
    try {
      await callPlugin('SplashScreen', 'show', options);
    } catch {
      // Ignore if plugin not available
    }
  },

  async hide(options?: { fadeOutDuration?: number }): Promise<void> {
    if (!isCapacitor()) return;
    try {
      await callPlugin('SplashScreen', 'hide', options);
    } catch {
      // Ignore if plugin not available
    }
  },
};

/**
 * Status bar control
 */
export const CapacitorStatusBar = {
  async setStyle(options: { style: 'Dark' | 'Light' | 'Default' }): Promise<void> {
    if (!isNativePlatform()) return;
    try {
      await callPlugin('StatusBar', 'setStyle', options);
    } catch {
      // Ignore if plugin not available
    }
  },

  async setBackgroundColor(options: { color: string }): Promise<void> {
    if (!isNativePlatform()) return;
    try {
      await callPlugin('StatusBar', 'setBackgroundColor', options);
    } catch {
      // Ignore if plugin not available
    }
  },

  async show(): Promise<void> {
    if (!isNativePlatform()) return;
    try {
      await callPlugin('StatusBar', 'show');
    } catch {
      // Ignore if plugin not available
    }
  },

  async hide(): Promise<void> {
    if (!isNativePlatform()) return;
    try {
      await callPlugin('StatusBar', 'hide');
    } catch {
      // Ignore if plugin not available
    }
  },

  async getInfo(): Promise<{ visible: boolean; style: string }> {
    if (!isNativePlatform()) {
      return { visible: true, style: 'Default' };
    }
    try {
      return await callPlugin('StatusBar', 'getInfo');
    } catch {
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
export const appState: Signal<AppState> = signal({
  isActive: true,
  isBackground: false,
});

/**
 * Lifecycle event listeners
 */
const lifecycleListeners = new Map<LifecycleEvent, Set<Function>>();

/**
 * Add lifecycle event listener
 */
export function addLifecycleListener(
  event: LifecycleEvent,
  callback: (data?: any) => void
): () => void {
  if (!lifecycleListeners.has(event)) {
    lifecycleListeners.set(event, new Set());
  }

  lifecycleListeners.get(event)!.add(callback);

  // Set up native listener if first listener for this event
  if (lifecycleListeners.get(event)!.size === 1) {
    setupNativeLifecycleListener(event);
  }

  return () => {
    lifecycleListeners.get(event)?.delete(callback);
  };
}

/**
 * Set up native lifecycle listener
 */
function setupNativeLifecycleListener(event: LifecycleEvent): void {
  if (!isCapacitor()) {
    // Set up web equivalents
    setupWebLifecycleListener(event);
    return;
  }

  const capacitor = getCapacitor();
  if (!capacitor?.Plugins?.App) return;

  const App = capacitor.Plugins.App;

  switch (event) {
    case 'appStateChange':
      App.addListener('appStateChange', (state: { isActive: boolean }) => {
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
      App.addListener('backButton', (data: { canGoBack: boolean }) => {
        emitLifecycleEvent('backButton', data);
      });
      break;
  }
}

/**
 * Set up web lifecycle listeners
 */
function setupWebLifecycleListener(event: LifecycleEvent): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

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
function emitLifecycleEvent(event: LifecycleEvent, data?: any): void {
  lifecycleListeners.get(event)?.forEach((callback) => {
    try {
      callback(data);
    } catch (error) {
      console.error(`Lifecycle event error [${event}]:`, error);
    }
  });
}

/**
 * Hook for app state changes
 */
export function useAppState(): AppState {
  return appState();
}

/**
 * Hook for pause event
 */
export function useOnPause(callback: () => void): void {
  effect(() => {
    const unsubscribe = addLifecycleListener('pause', callback);
    return unsubscribe;
  });
}

/**
 * Hook for resume event
 */
export function useOnResume(callback: () => void): void {
  effect(() => {
    const unsubscribe = addLifecycleListener('resume', callback);
    return unsubscribe;
  });
}

/**
 * Hook for back button (Android)
 */
export function useBackButton(
  callback: (data: { canGoBack: boolean }) => void
): void {
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
export async function exitApp(): Promise<void> {
  if (!isCapacitor()) return;

  try {
    await callPlugin('App', 'exitApp');
  } catch {
    // Ignore if not available
  }
}

/**
 * Get app info
 */
export async function getAppInfo(): Promise<{
  name: string;
  id: string;
  build: string;
  version: string;
}> {
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
  } catch {
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
export async function getLaunchUrl(): Promise<{ url: string } | null> {
  if (!isCapacitor()) return null;

  try {
    return await callPlugin('App', 'getLaunchUrl');
  } catch {
    return null;
  }
}

/**
 * Open URL in external browser
 */
export async function openUrl(url: string): Promise<void> {
  if (!isCapacitor()) {
    window.open(url, '_blank');
    return;
  }

  try {
    await callPlugin('Browser', 'open', { url });
  } catch {
    window.open(url, '_blank');
  }
}

// ============================================================================
// Capacitor Initialization
// ============================================================================

/**
 * Initialize Capacitor integration
 */
export async function initCapacitor(config?: Partial<CapacitorConfig>): Promise<void> {
  // Hide splash screen after initialization
  await SplashScreen.hide({ fadeOutDuration: 200 });

  // Set up default lifecycle listeners
  addLifecycleListener('appStateChange', () => {});

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
