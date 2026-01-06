/**
 * @philjs/capacitor - Capacitor Integration for PhilJS
 *
 * Comprehensive Capacitor plugin integration with PhilJS signals.
 * Provides reactive hooks for all major Capacitor native APIs.
 *
 * @example
 * ```tsx
 * import {
 *   useDevice,
 *   useNetwork,
 *   useCamera,
 *   useGeolocation,
 *   useHaptics,
 *   usePushNotifications,
 * } from '@philjs/capacitor';
 *
 * function App() {
 *   const device = useDevice();
 *   const network = useNetwork();
 *   const { position, watchPosition } = useGeolocation();
 *
 *   return (
 *     <div>
 *       <p>Platform: {device().platform}</p>
 *       <p>Network: {network().connected ? 'Online' : 'Offline'}</p>
 *     </div>
 *   );
 * }
 * ```
 */

import { signal, computed, effect, batch, type Signal, type Computed } from '@philjs/core';

// ============================================================================
// TYPES
// ============================================================================

// Device Types
export interface DeviceInfo {
  model: string;
  platform: 'ios' | 'android' | 'web';
  operatingSystem: string;
  osVersion: string;
  manufacturer: string;
  isVirtual: boolean;
  webViewVersion: string;
}

export interface BatteryInfo {
  batteryLevel: number;
  isCharging: boolean;
}

// Network Types
export interface NetworkStatus {
  connected: boolean;
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown';
}

// Geolocation Types
export interface Position {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

// Camera Types
export interface CameraOptions {
  quality?: number;
  width?: number;
  height?: number;
  source?: 'camera' | 'photos' | 'prompt';
  resultType?: 'uri' | 'base64' | 'dataUrl';
  saveToGallery?: boolean;
  correctOrientation?: boolean;
  direction?: 'rear' | 'front';
}

export interface Photo {
  base64String?: string;
  dataUrl?: string;
  path?: string;
  webPath?: string;
  exif?: any;
  format: string;
  saved: boolean;
}

// Storage Types
export interface StorageResult<T> {
  value: T | null;
}

// Notification Types
export interface LocalNotification {
  id: number;
  title: string;
  body: string;
  schedule?: {
    at?: Date;
    repeats?: boolean;
    every?: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second';
    count?: number;
  };
  sound?: string;
  smallIcon?: string;
  largeIcon?: string;
  iconColor?: string;
  attachments?: { id: string; url: string }[];
  actionTypeId?: string;
  extra?: any;
}

export interface PushNotification {
  title?: string;
  body?: string;
  data?: any;
  id: string;
  badge?: number;
  notification?: any;
}

export interface PushNotificationToken {
  value: string;
}

// Haptics Types
export type HapticsImpactStyle = 'heavy' | 'medium' | 'light';
export type HapticsNotificationType = 'success' | 'warning' | 'error';

// Keyboard Types
export interface KeyboardInfo {
  keyboardHeight: number;
}

// App Types
export interface AppState {
  isActive: boolean;
}

export interface AppInfo {
  name: string;
  id: string;
  build: string;
  version: string;
}

export interface AppUrlOpen {
  url: string;
}

// Motion Types
export interface MotionOrientationEventResult {
  alpha: number;
  beta: number;
  gamma: number;
}

export interface AccelerationData {
  x: number;
  y: number;
  z: number;
}

// Share Types
export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
  dialogTitle?: string;
  files?: string[];
}

export interface ShareResult {
  activityType?: string;
}

// Dialog Types
export interface AlertOptions {
  title: string;
  message: string;
  buttonTitle?: string;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  okButtonTitle?: string;
  cancelButtonTitle?: string;
}

export interface PromptOptions {
  title: string;
  message: string;
  okButtonTitle?: string;
  cancelButtonTitle?: string;
  inputPlaceholder?: string;
  inputText?: string;
}

export interface PromptResult {
  value: string;
  cancelled: boolean;
}

// Toast Types
export interface ToastOptions {
  text: string;
  duration?: 'short' | 'long';
  position?: 'top' | 'center' | 'bottom';
}

// Filesystem Types
export type Directory =
  | 'documents'
  | 'data'
  | 'library'
  | 'cache'
  | 'external'
  | 'externalStorage';

export interface WriteFileOptions {
  path: string;
  data: string;
  directory?: Directory;
  encoding?: 'utf8' | 'ascii' | 'utf16';
  recursive?: boolean;
}

export interface ReadFileResult {
  data: string;
}

// Browser Types
export interface BrowserOpenOptions {
  url: string;
  windowName?: string;
  toolbarColor?: string;
  presentationStyle?: 'fullscreen' | 'popover';
}

// Clipboard Types
export interface ClipboardWriteOptions {
  string?: string;
  url?: string;
  image?: string;
  label?: string;
}

export interface ClipboardReadResult {
  type: 'text/plain' | 'text/html' | 'image/png';
  value: string;
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

interface CapacitorState {
  device: DeviceInfo | null;
  battery: BatteryInfo | null;
  network: NetworkStatus;
  position: Position | null;
  keyboardHeight: number;
  appState: AppState;
  initialized: boolean;
}

const state: CapacitorState = {
  device: null,
  battery: null,
  network: { connected: true, connectionType: 'unknown' },
  position: null,
  keyboardHeight: 0,
  appState: { isActive: true },
  initialized: false,
};

const deviceSignal: Signal<DeviceInfo | null> = signal(null);
const batterySignal: Signal<BatteryInfo | null> = signal(null);
const networkSignal: Signal<NetworkStatus> = signal({ connected: true, connectionType: 'unknown' });
const positionSignal: Signal<Position | null> = signal(null);
const keyboardHeightSignal: Signal<number> = signal(0);
const appStateSignal: Signal<AppState> = signal({ isActive: true });
const pushTokenSignal: Signal<string | null> = signal(null);
const notificationsSignal: Signal<PushNotification[]> = signal([]);

// ============================================================================
// DEVICE HOOKS
// ============================================================================

/**
 * Get device information
 */
export function useDevice(): Signal<DeviceInfo | null> {
  effect(async () => {
    try {
      const { Device } = await import('@capacitor/device');
      const info = await Device.getInfo();
      deviceSignal.set({
        model: info.model,
        platform: info.platform as 'ios' | 'android' | 'web',
        operatingSystem: info.operatingSystem,
        osVersion: info.osVersion,
        manufacturer: info.manufacturer,
        isVirtual: info.isVirtual,
        webViewVersion: info.webViewVersion,
      });
    } catch (e) {
      // Fallback for web
      deviceSignal.set({
        model: 'web',
        platform: 'web',
        operatingSystem: 'web',
        osVersion: '',
        manufacturer: '',
        isVirtual: false,
        webViewVersion: '',
      });
    }
  });

  return deviceSignal;
}

/**
 * Get device ID
 */
export async function getDeviceId(): Promise<string> {
  try {
    const { Device } = await import('@capacitor/device');
    const id = await Device.getId();
    return id.identifier;
  } catch {
    return 'web-' + Math.random().toString(36).slice(2);
  }
}

/**
 * Get battery information
 */
export function useBattery(): Signal<BatteryInfo | null> {
  effect(async () => {
    try {
      const { Device } = await import('@capacitor/device');
      const info = await Device.getBatteryInfo();
      batterySignal.set({
        batteryLevel: info.batteryLevel ?? 1,
        isCharging: info.isCharging ?? false,
      });
    } catch {
      batterySignal.set({ batteryLevel: 1, isCharging: false });
    }
  });

  return batterySignal;
}

/**
 * Get language code
 */
export async function getLanguageCode(): Promise<string> {
  try {
    const { Device } = await import('@capacitor/device');
    const lang = await Device.getLanguageCode();
    return lang.value;
  } catch {
    return navigator.language || 'en';
  }
}

/**
 * Get language tag
 */
export async function getLanguageTag(): Promise<string> {
  try {
    const { Device } = await import('@capacitor/device');
    const lang = await Device.getLanguageTag();
    return lang.value;
  } catch {
    return navigator.language || 'en-US';
  }
}

// ============================================================================
// NETWORK HOOKS
// ============================================================================

/**
 * Get network status
 */
export function useNetwork(): Signal<NetworkStatus> {
  effect(async () => {
    try {
      const { Network } = await import('@capacitor/network');
      const status = await Network.getStatus();
      networkSignal.set({
        connected: status.connected,
        connectionType: status.connectionType as NetworkStatus['connectionType'],
      });

      Network.addListener('networkStatusChange', (status) => {
        networkSignal.set({
          connected: status.connected,
          connectionType: status.connectionType as NetworkStatus['connectionType'],
        });
      });
    } catch {
      // Fallback for web
      networkSignal.set({
        connected: navigator.onLine,
        connectionType: navigator.onLine ? 'wifi' : 'none',
      });

      window.addEventListener('online', () => {
        networkSignal.set({ connected: true, connectionType: 'wifi' });
      });
      window.addEventListener('offline', () => {
        networkSignal.set({ connected: false, connectionType: 'none' });
      });
    }
  });

  return networkSignal;
}

/**
 * Computed online status
 */
export function useOnline(): Computed<boolean> {
  const network = useNetwork();
  return computed(() => network.get().connected);
}

// ============================================================================
// GEOLOCATION HOOKS
// ============================================================================

/**
 * Get geolocation
 */
export function useGeolocation(options?: GeolocationOptions): {
  position: Signal<Position | null>;
  error: Signal<Error | null>;
  loading: Signal<boolean>;
  getCurrentPosition: () => Promise<Position>;
  watchPosition: () => Promise<string>;
  clearWatch: (id: string) => Promise<void>;
} {
  const error = signal<Error | null>(null);
  const loading = signal(false);

  const getCurrentPosition = async (): Promise<Position> => {
    loading.set(true);
    error.set(null);

    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 10000,
        maximumAge: options?.maximumAge ?? 0,
      });

      const position: Position = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        altitude: pos.coords.altitude,
        altitudeAccuracy: pos.coords.altitudeAccuracy,
        heading: pos.coords.heading,
        speed: pos.coords.speed,
        timestamp: pos.timestamp,
      };

      positionSignal.set(position);
      return position;
    } catch (e) {
      error.set(e as Error);
      throw e;
    } finally {
      loading.set(false);
    }
  };

  const watchPosition = async (): Promise<string> => {
    const { Geolocation } = await import('@capacitor/geolocation');
    const watchId = await Geolocation.watchPosition(
      {
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 10000,
        maximumAge: options?.maximumAge ?? 0,
      },
      (pos, err) => {
        if (err) {
          error.set(err as Error);
          return;
        }
        if (pos) {
          positionSignal.set({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            altitudeAccuracy: pos.coords.altitudeAccuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: pos.timestamp,
          });
        }
      }
    );
    return watchId;
  };

  const clearWatch = async (id: string): Promise<void> => {
    const { Geolocation } = await import('@capacitor/geolocation');
    await Geolocation.clearWatch({ id });
  };

  return {
    position: positionSignal,
    error,
    loading,
    getCurrentPosition,
    watchPosition,
    clearWatch,
  };
}

/**
 * Check geolocation permissions
 */
export async function checkGeolocationPermissions(): Promise<'granted' | 'denied' | 'prompt'> {
  try {
    const { Geolocation } = await import('@capacitor/geolocation');
    const result = await Geolocation.checkPermissions();
    return result.location as 'granted' | 'denied' | 'prompt';
  } catch {
    return 'prompt';
  }
}

/**
 * Request geolocation permissions
 */
export async function requestGeolocationPermissions(): Promise<'granted' | 'denied' | 'prompt'> {
  try {
    const { Geolocation } = await import('@capacitor/geolocation');
    const result = await Geolocation.requestPermissions();
    return result.location as 'granted' | 'denied' | 'prompt';
  } catch {
    return 'denied';
  }
}

// ============================================================================
// CAMERA HOOKS
// ============================================================================

/**
 * Camera operations
 */
export function useCamera(): {
  takePicture: (options?: CameraOptions) => Promise<Photo>;
  pickImages: (options?: CameraOptions) => Promise<Photo[]>;
  checkPermissions: () => Promise<{ camera: string; photos: string }>;
  requestPermissions: () => Promise<{ camera: string; photos: string }>;
} {
  const takePicture = async (options?: CameraOptions): Promise<Photo> => {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');

    const result = await Camera.getPhoto({
      quality: options?.quality ?? 90,
      width: options?.width,
      height: options?.height,
      source: options?.source === 'camera'
        ? CameraSource.Camera
        : options?.source === 'photos'
          ? CameraSource.Photos
          : CameraSource.Prompt,
      resultType: options?.resultType === 'base64'
        ? CameraResultType.Base64
        : options?.resultType === 'dataUrl'
          ? CameraResultType.DataUrl
          : CameraResultType.Uri,
      saveToGallery: options?.saveToGallery ?? false,
      correctOrientation: options?.correctOrientation ?? true,
    });

    return {
      base64String: result.base64String,
      dataUrl: result.dataUrl,
      path: result.path,
      webPath: result.webPath,
      exif: result.exif,
      format: result.format,
      saved: result.saved ?? false,
    };
  };

  const pickImages = async (options?: CameraOptions): Promise<Photo[]> => {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');

    const results = await Camera.pickImages({
      quality: options?.quality ?? 90,
      width: options?.width,
      height: options?.height,
    });

    return results.photos.map((photo) => ({
      path: photo.path,
      webPath: photo.webPath,
      exif: photo.exif,
      format: photo.format,
      saved: false,
    }));
  };

  const checkPermissions = async () => {
    const { Camera } = await import('@capacitor/camera');
    const result = await Camera.checkPermissions();
    return { camera: result.camera, photos: result.photos };
  };

  const requestPermissions = async () => {
    const { Camera } = await import('@capacitor/camera');
    const result = await Camera.requestPermissions();
    return { camera: result.camera, photos: result.photos };
  };

  return { takePicture, pickImages, checkPermissions, requestPermissions };
}

// ============================================================================
// STORAGE HOOKS
// ============================================================================

/**
 * Preferences storage (async key-value)
 */
export function useStorage(): {
  get: <T>(key: string) => Promise<T | null>;
  set: <T>(key: string, value: T) => Promise<void>;
  remove: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  keys: () => Promise<string[]>;
} {
  return {
    get: async <T>(key: string): Promise<T | null> => {
      const { Preferences } = await import('@capacitor/preferences');
      const { value } = await Preferences.get({ key });
      return value ? JSON.parse(value) as T : null;
    },
    set: async <T>(key: string, value: T): Promise<void> => {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.set({ key, value: JSON.stringify(value) });
    },
    remove: async (key: string): Promise<void> => {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.remove({ key });
    },
    clear: async (): Promise<void> => {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.clear();
    },
    keys: async (): Promise<string[]> => {
      const { Preferences } = await import('@capacitor/preferences');
      const { keys } = await Preferences.keys();
      return keys;
    },
  };
}

/**
 * Signal-based storage with automatic persistence
 */
export function usePersistedSignal<T>(
  key: string,
  defaultValue: T
): [Signal<T>, (value: T) => Promise<void>] {
  const state = signal<T>(defaultValue);

  // Load initial value
  effect(async () => {
    const storage = useStorage();
    const stored = await storage.get<T>(key);
    if (stored !== null) {
      state.set(stored);
    }
  });

  const setValue = async (value: T): Promise<void> => {
    state.set(value);
    const storage = useStorage();
    await storage.set(key, value);
  };

  return [state, setValue];
}

// ============================================================================
// HAPTICS HOOKS
// ============================================================================

/**
 * Haptic feedback
 */
export function useHaptics(): {
  impact: (style?: HapticsImpactStyle) => Promise<void>;
  notification: (type?: HapticsNotificationType) => Promise<void>;
  vibrate: (duration?: number) => Promise<void>;
  selectionStart: () => Promise<void>;
  selectionChanged: () => Promise<void>;
  selectionEnd: () => Promise<void>;
} {
  return {
    impact: async (style: HapticsImpactStyle = 'medium'): Promise<void> => {
      try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        const styleMap = {
          heavy: ImpactStyle.Heavy,
          medium: ImpactStyle.Medium,
          light: ImpactStyle.Light,
        };
        await Haptics.impact({ style: styleMap[style] });
      } catch {
        // Fallback: vibrate if available
        if ('vibrate' in navigator) {
          navigator.vibrate(style === 'heavy' ? 50 : style === 'medium' ? 30 : 10);
        }
      }
    },
    notification: async (type: HapticsNotificationType = 'success'): Promise<void> => {
      try {
        const { Haptics, NotificationType } = await import('@capacitor/haptics');
        const typeMap = {
          success: NotificationType.Success,
          warning: NotificationType.Warning,
          error: NotificationType.Error,
        };
        await Haptics.notification({ type: typeMap[type] });
      } catch {
        if ('vibrate' in navigator) {
          navigator.vibrate([10, 50, 10]);
        }
      }
    },
    vibrate: async (duration = 300): Promise<void> => {
      try {
        const { Haptics } = await import('@capacitor/haptics');
        await Haptics.vibrate({ duration });
      } catch {
        if ('vibrate' in navigator) {
          navigator.vibrate(duration);
        }
      }
    },
    selectionStart: async (): Promise<void> => {
      try {
        const { Haptics } = await import('@capacitor/haptics');
        await Haptics.selectionStart();
      } catch {}
    },
    selectionChanged: async (): Promise<void> => {
      try {
        const { Haptics } = await import('@capacitor/haptics');
        await Haptics.selectionChanged();
      } catch {}
    },
    selectionEnd: async (): Promise<void> => {
      try {
        const { Haptics } = await import('@capacitor/haptics');
        await Haptics.selectionEnd();
      } catch {}
    },
  };
}

// ============================================================================
// KEYBOARD HOOKS
// ============================================================================

/**
 * Keyboard management
 */
export function useKeyboard(): {
  height: Signal<number>;
  isVisible: Computed<boolean>;
  show: () => Promise<void>;
  hide: () => Promise<void>;
  setAccessoryBarVisible: (visible: boolean) => Promise<void>;
  setScroll: (options: { isDisabled: boolean }) => Promise<void>;
  setResizeMode: (mode: 'body' | 'ionic' | 'native' | 'none') => Promise<void>;
} {
  effect(async () => {
    try {
      const { Keyboard } = await import('@capacitor/keyboard');

      Keyboard.addListener('keyboardWillShow', (info) => {
        keyboardHeightSignal.set(info.keyboardHeight);
      });

      Keyboard.addListener('keyboardWillHide', () => {
        keyboardHeightSignal.set(0);
      });
    } catch {}
  });

  return {
    height: keyboardHeightSignal,
    isVisible: computed(() => keyboardHeightSignal.get() > 0),
    show: async (): Promise<void> => {
      const { Keyboard } = await import('@capacitor/keyboard');
      await Keyboard.show();
    },
    hide: async (): Promise<void> => {
      const { Keyboard } = await import('@capacitor/keyboard');
      await Keyboard.hide();
    },
    setAccessoryBarVisible: async (visible: boolean): Promise<void> => {
      const { Keyboard } = await import('@capacitor/keyboard');
      await Keyboard.setAccessoryBarVisible({ isVisible: visible });
    },
    setScroll: async (options: { isDisabled: boolean }): Promise<void> => {
      const { Keyboard } = await import('@capacitor/keyboard');
      await Keyboard.setScroll(options);
    },
    setResizeMode: async (mode: 'body' | 'ionic' | 'native' | 'none'): Promise<void> => {
      const { Keyboard, KeyboardResize } = await import('@capacitor/keyboard');
      const modeMap = {
        body: KeyboardResize.Body,
        ionic: KeyboardResize.Ionic,
        native: KeyboardResize.Native,
        none: KeyboardResize.None,
      };
      await Keyboard.setResizeMode({ mode: modeMap[mode] });
    },
  };
}

// ============================================================================
// APP LIFECYCLE HOOKS
// ============================================================================

/**
 * App lifecycle and state
 */
export function useApp(): {
  state: Signal<AppState>;
  info: () => Promise<AppInfo>;
  exitApp: () => Promise<void>;
  getState: () => Promise<{ isActive: boolean }>;
  getLaunchUrl: () => Promise<AppUrlOpen | null>;
  minimizeApp: () => Promise<void>;
} {
  effect(async () => {
    try {
      const { App } = await import('@capacitor/app');

      App.addListener('appStateChange', (state) => {
        appStateSignal.set({ isActive: state.isActive });
      });

      const state = await App.getState();
      appStateSignal.set({ isActive: state.isActive });
    } catch {}
  });

  return {
    state: appStateSignal,
    info: async (): Promise<AppInfo> => {
      const { App } = await import('@capacitor/app');
      return await App.getInfo();
    },
    exitApp: async (): Promise<void> => {
      const { App } = await import('@capacitor/app');
      await App.exitApp();
    },
    getState: async (): Promise<{ isActive: boolean }> => {
      const { App } = await import('@capacitor/app');
      return await App.getState();
    },
    getLaunchUrl: async (): Promise<AppUrlOpen | null> => {
      const { App } = await import('@capacitor/app');
      const result = await App.getLaunchUrl();
      return result ? { url: result.url } : null;
    },
    minimizeApp: async (): Promise<void> => {
      const { App } = await import('@capacitor/app');
      await App.minimizeApp();
    },
  };
}

/**
 * Listen for app URL open events (deep links)
 */
export function useAppUrlOpen(callback: (url: string) => void): void {
  effect(async () => {
    const { App } = await import('@capacitor/app');

    App.addListener('appUrlOpen', (event) => {
      callback(event.url);
    });
  });
}

/**
 * Listen for back button (Android)
 */
export function useBackButton(callback: () => void): void {
  effect(async () => {
    const { App } = await import('@capacitor/app');

    App.addListener('backButton', () => {
      callback();
    });
  });
}

// ============================================================================
// STATUS BAR HOOKS
// ============================================================================

/**
 * Status bar management
 */
export function useStatusBar(): {
  setStyle: (style: 'dark' | 'light' | 'default') => Promise<void>;
  setBackgroundColor: (color: string) => Promise<void>;
  show: () => Promise<void>;
  hide: () => Promise<void>;
  setOverlaysWebView: (overlays: boolean) => Promise<void>;
} {
  return {
    setStyle: async (style: 'dark' | 'light' | 'default'): Promise<void> => {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      const styleMap = {
        dark: Style.Dark,
        light: Style.Light,
        default: Style.Default,
      };
      await StatusBar.setStyle({ style: styleMap[style] });
    },
    setBackgroundColor: async (color: string): Promise<void> => {
      const { StatusBar } = await import('@capacitor/status-bar');
      await StatusBar.setBackgroundColor({ color });
    },
    show: async (): Promise<void> => {
      const { StatusBar } = await import('@capacitor/status-bar');
      await StatusBar.show();
    },
    hide: async (): Promise<void> => {
      const { StatusBar } = await import('@capacitor/status-bar');
      await StatusBar.hide();
    },
    setOverlaysWebView: async (overlays: boolean): Promise<void> => {
      const { StatusBar } = await import('@capacitor/status-bar');
      await StatusBar.setOverlaysWebView({ overlay: overlays });
    },
  };
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

/**
 * Local notifications
 */
export function useLocalNotifications(): {
  schedule: (notifications: LocalNotification[]) => Promise<{ notifications: { id: number }[] }>;
  getPending: () => Promise<{ notifications: LocalNotification[] }>;
  cancel: (ids: number[]) => Promise<void>;
  registerActionTypes: (types: any[]) => Promise<void>;
  checkPermissions: () => Promise<{ display: string }>;
  requestPermissions: () => Promise<{ display: string }>;
} {
  return {
    schedule: async (notifications) => {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const result = await LocalNotifications.schedule({ notifications });
      return result;
    },
    getPending: async () => {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      return await LocalNotifications.getPending();
    },
    cancel: async (ids) => {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.cancel({ notifications: ids.map(id => ({ id })) });
    },
    registerActionTypes: async (types) => {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.registerActionTypes({ types });
    },
    checkPermissions: async () => {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      return await LocalNotifications.checkPermissions();
    },
    requestPermissions: async () => {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      return await LocalNotifications.requestPermissions();
    },
  };
}

/**
 * Push notifications
 */
export function usePushNotifications(): {
  token: Signal<string | null>;
  notifications: Signal<PushNotification[]>;
  register: () => Promise<void>;
  getDeliveredNotifications: () => Promise<PushNotification[]>;
  removeDeliveredNotifications: (ids: string[]) => Promise<void>;
  removeAllDeliveredNotifications: () => Promise<void>;
  checkPermissions: () => Promise<{ receive: string }>;
  requestPermissions: () => Promise<{ receive: string }>;
} {
  const register = async (): Promise<void> => {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    await PushNotifications.register();

    PushNotifications.addListener('registration', (token) => {
      pushTokenSignal.set(token.value);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      notificationsSignal.set([...notificationsSignal.get(), notification as PushNotification]);
    });
  };

  return {
    token: pushTokenSignal,
    notifications: notificationsSignal,
    register,
    getDeliveredNotifications: async () => {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const result = await PushNotifications.getDeliveredNotifications();
      return result.notifications as PushNotification[];
    },
    removeDeliveredNotifications: async (ids) => {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      await PushNotifications.removeDeliveredNotifications({ notifications: ids.map(id => ({ id })) });
    },
    removeAllDeliveredNotifications: async () => {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      await PushNotifications.removeAllDeliveredNotifications();
    },
    checkPermissions: async () => {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      return await PushNotifications.checkPermissions();
    },
    requestPermissions: async () => {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      return await PushNotifications.requestPermissions();
    },
  };
}

// ============================================================================
// SHARE
// ============================================================================

/**
 * Native share
 */
export function useShare(): {
  share: (options: ShareOptions) => Promise<ShareResult>;
  canShare: () => Promise<boolean>;
} {
  return {
    share: async (options) => {
      const { Share } = await import('@capacitor/share');
      return await Share.share(options);
    },
    canShare: async () => {
      const { Share } = await import('@capacitor/share');
      const result = await Share.canShare();
      return result.value;
    },
  };
}

// ============================================================================
// CLIPBOARD
// ============================================================================

/**
 * Clipboard operations
 */
export function useClipboard(): {
  write: (options: ClipboardWriteOptions) => Promise<void>;
  read: () => Promise<ClipboardReadResult>;
} {
  return {
    write: async (options) => {
      const { Clipboard } = await import('@capacitor/clipboard');
      await Clipboard.write(options);
    },
    read: async () => {
      const { Clipboard } = await import('@capacitor/clipboard');
      return await Clipboard.read();
    },
  };
}

// ============================================================================
// BROWSER
// ============================================================================

/**
 * In-app browser
 */
export function useBrowser(): {
  open: (options: BrowserOpenOptions) => Promise<void>;
  close: () => Promise<void>;
} {
  return {
    open: async (options) => {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open(options);
    },
    close: async () => {
      const { Browser } = await import('@capacitor/browser');
      await Browser.close();
    },
  };
}

// ============================================================================
// DIALOG
// ============================================================================

/**
 * Native dialogs
 */
export function useDialog(): {
  alert: (options: AlertOptions) => Promise<void>;
  confirm: (options: ConfirmOptions) => Promise<{ value: boolean }>;
  prompt: (options: PromptOptions) => Promise<PromptResult>;
} {
  return {
    alert: async (options) => {
      const { Dialog } = await import('@capacitor/dialog');
      await Dialog.alert(options);
    },
    confirm: async (options) => {
      const { Dialog } = await import('@capacitor/dialog');
      return await Dialog.confirm(options);
    },
    prompt: async (options) => {
      const { Dialog } = await import('@capacitor/dialog');
      return await Dialog.prompt(options);
    },
  };
}

// ============================================================================
// TOAST
// ============================================================================

/**
 * Toast notifications
 */
export function useToast(): {
  show: (options: ToastOptions) => Promise<void>;
} {
  return {
    show: async (options) => {
      const { Toast } = await import('@capacitor/toast');
      await Toast.show(options);
    },
  };
}

// ============================================================================
// FILESYSTEM
// ============================================================================

/**
 * Filesystem operations
 */
export function useFilesystem(): {
  readFile: (options: { path: string; directory?: Directory; encoding?: string }) => Promise<ReadFileResult>;
  writeFile: (options: WriteFileOptions) => Promise<{ uri: string }>;
  appendFile: (options: { path: string; data: string; directory?: Directory; encoding?: string }) => Promise<void>;
  deleteFile: (options: { path: string; directory?: Directory }) => Promise<void>;
  mkdir: (options: { path: string; directory?: Directory; recursive?: boolean }) => Promise<void>;
  rmdir: (options: { path: string; directory?: Directory; recursive?: boolean }) => Promise<void>;
  readdir: (options: { path: string; directory?: Directory }) => Promise<{ files: { name: string; type: 'file' | 'directory'; uri: string }[] }>;
  stat: (options: { path: string; directory?: Directory }) => Promise<{ type: string; size: number; ctime: number; mtime: number; uri: string }>;
  rename: (options: { from: string; to: string; directory?: Directory; toDirectory?: Directory }) => Promise<void>;
  copy: (options: { from: string; to: string; directory?: Directory; toDirectory?: Directory }) => Promise<{ uri: string }>;
  checkPermissions: () => Promise<{ publicStorage: string }>;
  requestPermissions: () => Promise<{ publicStorage: string }>;
} {
  const getDirectory = async (dir?: Directory) => {
    const { Directory } = await import('@capacitor/filesystem');
    const map = {
      documents: Directory.Documents,
      data: Directory.Data,
      library: Directory.Library,
      cache: Directory.Cache,
      external: Directory.External,
      externalStorage: Directory.ExternalStorage,
    };
    return dir ? map[dir] : Directory.Documents;
  };

  return {
    readFile: async (options) => {
      const { Filesystem, Encoding } = await import('@capacitor/filesystem');
      return await Filesystem.readFile({
        path: options.path,
        directory: await getDirectory(options.directory),
        encoding: options.encoding === 'utf8' ? Encoding.UTF8 : Encoding.ASCII,
      });
    },
    writeFile: async (options) => {
      const { Filesystem, Encoding } = await import('@capacitor/filesystem');
      return await Filesystem.writeFile({
        path: options.path,
        data: options.data,
        directory: await getDirectory(options.directory),
        encoding: options.encoding === 'utf8' ? Encoding.UTF8 : Encoding.ASCII,
        recursive: options.recursive,
      });
    },
    appendFile: async (options) => {
      const { Filesystem, Encoding } = await import('@capacitor/filesystem');
      await Filesystem.appendFile({
        path: options.path,
        data: options.data,
        directory: await getDirectory(options.directory),
        encoding: options.encoding === 'utf8' ? Encoding.UTF8 : Encoding.ASCII,
      });
    },
    deleteFile: async (options) => {
      const { Filesystem } = await import('@capacitor/filesystem');
      await Filesystem.deleteFile({
        path: options.path,
        directory: await getDirectory(options.directory),
      });
    },
    mkdir: async (options) => {
      const { Filesystem } = await import('@capacitor/filesystem');
      await Filesystem.mkdir({
        path: options.path,
        directory: await getDirectory(options.directory),
        recursive: options.recursive ?? false,
      });
    },
    rmdir: async (options) => {
      const { Filesystem } = await import('@capacitor/filesystem');
      await Filesystem.rmdir({
        path: options.path,
        directory: await getDirectory(options.directory),
        recursive: options.recursive ?? false,
      });
    },
    readdir: async (options) => {
      const { Filesystem } = await import('@capacitor/filesystem');
      return await Filesystem.readdir({
        path: options.path,
        directory: await getDirectory(options.directory),
      });
    },
    stat: async (options) => {
      const { Filesystem } = await import('@capacitor/filesystem');
      return await Filesystem.stat({
        path: options.path,
        directory: await getDirectory(options.directory),
      });
    },
    rename: async (options) => {
      const { Filesystem } = await import('@capacitor/filesystem');
      await Filesystem.rename({
        from: options.from,
        to: options.to,
        directory: await getDirectory(options.directory),
        toDirectory: await getDirectory(options.toDirectory),
      });
    },
    copy: async (options) => {
      const { Filesystem } = await import('@capacitor/filesystem');
      return await Filesystem.copy({
        from: options.from,
        to: options.to,
        directory: await getDirectory(options.directory),
        toDirectory: await getDirectory(options.toDirectory),
      });
    },
    checkPermissions: async () => {
      const { Filesystem } = await import('@capacitor/filesystem');
      return await Filesystem.checkPermissions();
    },
    requestPermissions: async () => {
      const { Filesystem } = await import('@capacitor/filesystem');
      return await Filesystem.requestPermissions();
    },
  };
}

// ============================================================================
// MOTION
// ============================================================================

/**
 * Motion and accelerometer
 */
export function useMotion(): {
  orientation: Signal<MotionOrientationEventResult | null>;
  acceleration: Signal<AccelerationData | null>;
  startOrientationListener: () => Promise<void>;
  stopOrientationListener: () => Promise<void>;
  startAccelerationListener: () => Promise<void>;
  stopAccelerationListener: () => Promise<void>;
} {
  const orientation = signal<MotionOrientationEventResult | null>(null);
  const acceleration = signal<AccelerationData | null>(null);
  let orientationHandler: any = null;
  let accelerationHandler: any = null;

  return {
    orientation,
    acceleration,
    startOrientationListener: async () => {
      const { Motion } = await import('@capacitor/motion');
      orientationHandler = await Motion.addListener('orientation', (event) => {
        orientation.set({
          alpha: event.alpha,
          beta: event.beta,
          gamma: event.gamma,
        });
      });
    },
    stopOrientationListener: async () => {
      if (orientationHandler) {
        await orientationHandler.remove();
        orientationHandler = null;
      }
    },
    startAccelerationListener: async () => {
      const { Motion } = await import('@capacitor/motion');
      accelerationHandler = await Motion.addListener('accel', (event) => {
        acceleration.set({
          x: event.acceleration.x,
          y: event.acceleration.y,
          z: event.acceleration.z,
        });
      });
    },
    stopAccelerationListener: async () => {
      if (accelerationHandler) {
        await accelerationHandler.remove();
        accelerationHandler = null;
      }
    },
  };
}

// ============================================================================
// SCREEN ORIENTATION
// ============================================================================

/**
 * Screen orientation
 */
export function useScreenOrientation(): {
  orientation: Signal<'portrait' | 'landscape' | 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary'>;
  lock: (orientation: 'portrait' | 'landscape' | 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary') => Promise<void>;
  unlock: () => Promise<void>;
} {
  const orientation = signal<any>('portrait');

  effect(async () => {
    try {
      const { ScreenOrientation } = await import('@capacitor/screen-orientation');
      const current = await ScreenOrientation.orientation();
      orientation.set(current.type);

      ScreenOrientation.addListener('screenOrientationChange', (info) => {
        orientation.set(info.type);
      });
    } catch {}
  });

  return {
    orientation,
    lock: async (type) => {
      const { ScreenOrientation } = await import('@capacitor/screen-orientation');
      await ScreenOrientation.lock({ orientation: type });
    },
    unlock: async () => {
      const { ScreenOrientation } = await import('@capacitor/screen-orientation');
      await ScreenOrientation.unlock();
    },
  };
}

// ============================================================================
// SPLASH SCREEN
// ============================================================================

/**
 * Splash screen control
 */
export function useSplashScreen(): {
  show: (options?: { autoHide?: boolean; fadeInDuration?: number; fadeOutDuration?: number; showDuration?: number }) => Promise<void>;
  hide: (options?: { fadeOutDuration?: number }) => Promise<void>;
} {
  return {
    show: async (options) => {
      const { SplashScreen } = await import('@capacitor/splash-screen');
      await SplashScreen.show(options);
    },
    hide: async (options) => {
      const { SplashScreen } = await import('@capacitor/splash-screen');
      await SplashScreen.hide(options);
    },
  };
}

// ============================================================================
// ACTION SHEET
// ============================================================================

/**
 * Native action sheet
 */
export function useActionSheet(): {
  showActions: (options: {
    title?: string;
    message?: string;
    options: { title: string; style?: 'default' | 'destructive' | 'cancel'; icon?: string }[];
  }) => Promise<{ index: number }>;
} {
  return {
    showActions: async (options) => {
      const { ActionSheet, ActionSheetButtonStyle } = await import('@capacitor/action-sheet');
      const result = await ActionSheet.showActions({
        title: options.title,
        message: options.message,
        options: options.options.map((opt) => ({
          title: opt.title,
          style: opt.style === 'destructive'
            ? ActionSheetButtonStyle.Destructive
            : opt.style === 'cancel'
              ? ActionSheetButtonStyle.Cancel
              : ActionSheetButtonStyle.Default,
          icon: opt.icon,
        })),
      });
      return result;
    },
  };
}

// ============================================================================
// TEXT ZOOM
// ============================================================================

/**
 * Text zoom (iOS accessibility)
 */
export function useTextZoom(): {
  get: () => Promise<{ value: number }>;
  getPreferred: () => Promise<{ value: number }>;
  set: (options: { value: number }) => Promise<void>;
} {
  return {
    get: async () => {
      const { TextZoom } = await import('@capacitor/text-zoom');
      return await TextZoom.get();
    },
    getPreferred: async () => {
      const { TextZoom } = await import('@capacitor/text-zoom');
      return await TextZoom.getPreferred();
    },
    set: async (options) => {
      const { TextZoom } = await import('@capacitor/text-zoom');
      await TextZoom.set(options);
    },
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if running on native platform
 */
export function isNativePlatform(): boolean {
  return typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor.isNativePlatform();
}

/**
 * Get platform
 */
export function getPlatform(): 'ios' | 'android' | 'web' {
  if (typeof (window as any).Capacitor !== 'undefined') {
    return (window as any).Capacitor.getPlatform();
  }
  return 'web';
}

/**
 * Check if plugin is available
 */
export async function isPluginAvailable(name: string): Promise<boolean> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor.isPluginAvailable(name);
  } catch {
    return false;
  }
}

/**
 * Convert file URI to web URL
 */
export async function convertFileSrc(filePath: string): Promise<string> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor.convertFileSrc(filePath);
  } catch {
    return filePath;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  deviceSignal,
  batterySignal,
  networkSignal,
  positionSignal,
  keyboardHeightSignal,
  appStateSignal,
  pushTokenSignal,
  notificationsSignal,
};
