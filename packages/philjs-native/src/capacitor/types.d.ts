/**
 * PhilJS Native - Capacitor Type Definitions
 *
 * Complete type definitions for Capacitor APIs to enable proper TypeScript
 * checking without @ts-nocheck directives.
 */
declare global {
    interface Window {
        Capacitor?: CapacitorGlobal;
        __capacitorCallback?: (response: PluginResponse) => void;
    }
}
/**
 * Main Capacitor global object
 */
export interface CapacitorGlobal {
    getPlatform: () => CapacitorPlatform;
    isNativePlatform: () => boolean;
    isPluginAvailable: (name: string) => boolean;
    Plugins: CapacitorPlugins;
    toNative: (pluginId: string, methodName: string, args: unknown[]) => void;
    fromNative: (response: PluginResponse) => void;
    registerPlugin: <T>(name: string, implementation?: T) => T;
    DEBUG?: boolean;
}
/**
 * Capacitor platform type
 */
export type CapacitorPlatform = 'ios' | 'android' | 'web';
/**
 * Plugin response from native
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
 * Available Capacitor plugins
 */
export interface CapacitorPlugins {
    App?: AppPlugin;
    Device?: DevicePlugin;
    Camera?: CameraPlugin;
    Geolocation?: GeolocationPlugin;
    Filesystem?: FilesystemPlugin;
    LocalNotifications?: LocalNotificationsPlugin;
    PushNotifications?: PushNotificationsPlugin;
    StatusBar?: StatusBarPlugin;
    SplashScreen?: SplashScreenPlugin;
    Keyboard?: KeyboardPlugin;
    Haptics?: HapticsPlugin;
    Share?: SharePlugin;
    Browser?: BrowserPlugin;
    Clipboard?: ClipboardPlugin;
    Network?: NetworkPlugin;
    Storage?: StoragePlugin;
    Preferences?: PreferencesPlugin;
    Toast?: ToastPlugin;
    [key: string]: unknown;
}
/**
 * Plugin listener handle for cleanup
 */
export interface PluginListenerHandle {
    remove: () => Promise<void>;
}
/**
 * App state change event
 */
export interface AppStateChangeEvent {
    isActive: boolean;
}
/**
 * App URL open event
 */
export interface AppUrlOpenEvent {
    url: string;
}
/**
 * App restored result
 */
export interface AppRestoredResult {
    pluginId: string;
    methodName: string;
    success: boolean;
    data?: unknown;
    error?: {
        message: string;
    };
}
/**
 * App launch URL
 */
export interface AppLaunchUrl {
    url: string;
}
/**
 * App info
 */
export interface AppInfo {
    name: string;
    id: string;
    build: string;
    version: string;
}
/**
 * App plugin interface
 */
export interface AppPlugin {
    exitApp: () => Promise<void>;
    getInfo: () => Promise<AppInfo>;
    getState: () => Promise<AppStateChangeEvent>;
    getLaunchUrl: () => Promise<AppLaunchUrl | null>;
    minimizeApp: () => Promise<void>;
    addListener: (eventName: 'appStateChange' | 'appUrlOpen' | 'appRestoredResult' | 'backButton' | 'pause' | 'resume', listener: (event: unknown) => void) => Promise<PluginListenerHandle>;
    removeAllListeners: () => Promise<void>;
}
/**
 * Device info
 */
export interface DeviceInfo {
    name?: string;
    model: string;
    platform: CapacitorPlatform;
    operatingSystem: 'ios' | 'android' | 'windows' | 'mac' | 'unknown';
    osVersion: string;
    manufacturer: string;
    isVirtual: boolean;
    memUsed?: number;
    diskFree?: number;
    diskTotal?: number;
    realDiskFree?: number;
    realDiskTotal?: number;
    webViewVersion: string;
}
/**
 * Battery info
 */
export interface BatteryInfo {
    batteryLevel: number;
    isCharging: boolean;
}
/**
 * Language code result
 */
export interface LanguageCodeResult {
    value: string;
}
/**
 * Device ID result
 */
export interface DeviceIdResult {
    identifier: string;
}
/**
 * Device plugin interface
 */
export interface DevicePlugin {
    getInfo: () => Promise<DeviceInfo>;
    getBatteryInfo: () => Promise<BatteryInfo>;
    getLanguageCode: () => Promise<LanguageCodeResult>;
    getId: () => Promise<DeviceIdResult>;
}
/**
 * Camera source
 */
export type CameraSource = 'Prompt' | 'Camera' | 'Photos';
/**
 * Camera result type
 */
export type CameraResultType = 'uri' | 'base64' | 'dataUrl';
/**
 * Camera direction
 */
export type CameraDirection = 'Rear' | 'Front';
/**
 * Camera options
 */
export interface CameraOptions {
    quality?: number;
    allowEditing?: boolean;
    resultType?: CameraResultType;
    saveToGallery?: boolean;
    width?: number;
    height?: number;
    preserveAspectRatio?: boolean;
    correctOrientation?: boolean;
    source?: CameraSource;
    direction?: CameraDirection;
    presentationStyle?: 'fullscreen' | 'popover';
    promptLabelHeader?: string;
    promptLabelCancel?: string;
    promptLabelPhoto?: string;
    promptLabelPicture?: string;
}
/**
 * Camera photo
 */
export interface CameraPhoto {
    base64String?: string;
    dataUrl?: string;
    path?: string;
    webPath?: string;
    exif?: Record<string, unknown>;
    format: string;
    saved: boolean;
}
/**
 * Gallery photo
 */
export interface GalleryPhoto {
    path?: string;
    webPath: string;
    format: string;
}
/**
 * Gallery photos result
 */
export interface GalleryPhotos {
    photos: GalleryPhoto[];
}
/**
 * Permission status
 */
export interface PermissionStatus {
    camera: 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied';
    photos: 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied' | 'limited';
}
/**
 * Camera plugin interface
 */
export interface CameraPlugin {
    getPhoto: (options: CameraOptions) => Promise<CameraPhoto>;
    pickImages: (options: {
        quality?: number;
        limit?: number;
    }) => Promise<GalleryPhotos>;
    pickLimitedLibraryPhotos: () => Promise<GalleryPhotos>;
    getLimitedLibraryPhotos: () => Promise<GalleryPhotos>;
    checkPermissions: () => Promise<PermissionStatus>;
    requestPermissions: (permissions?: {
        permissions: Array<'camera' | 'photos'>;
    }) => Promise<PermissionStatus>;
}
/**
 * Position options
 */
export interface PositionOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
}
/**
 * Position coordinates
 */
export interface Coordinates {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
}
/**
 * Position result
 */
export interface Position {
    timestamp: number;
    coords: Coordinates;
}
/**
 * Watch position callback ID
 */
export type WatchCallbackId = string;
/**
 * Geolocation plugin interface
 */
export interface GeolocationPlugin {
    getCurrentPosition: (options?: PositionOptions) => Promise<Position>;
    watchPosition: (options: PositionOptions, callback: (position: Position | null, err?: unknown) => void) => Promise<WatchCallbackId>;
    clearWatch: (options: {
        id: WatchCallbackId;
    }) => Promise<void>;
    checkPermissions: () => Promise<{
        location: 'prompt' | 'granted' | 'denied';
        coarseLocation: 'prompt' | 'granted' | 'denied';
    }>;
    requestPermissions: (permissions?: {
        permissions: Array<'location' | 'coarseLocation'>;
    }) => Promise<{
        location: 'prompt' | 'granted' | 'denied';
        coarseLocation: 'prompt' | 'granted' | 'denied';
    }>;
}
/**
 * Filesystem directory
 */
export type FilesystemDirectory = 'Documents' | 'Data' | 'Library' | 'Cache' | 'External' | 'ExternalStorage';
/**
 * Filesystem encoding
 */
export type FilesystemEncoding = 'utf8' | 'ascii' | 'utf16';
/**
 * Read file options
 */
export interface ReadFileOptions {
    path: string;
    directory?: FilesystemDirectory;
    encoding?: FilesystemEncoding;
}
/**
 * Read file result
 */
export interface ReadFileResult {
    data: string;
}
/**
 * Write file options
 */
export interface WriteFileOptions {
    path: string;
    data: string;
    directory?: FilesystemDirectory;
    encoding?: FilesystemEncoding;
    recursive?: boolean;
}
/**
 * Write file result
 */
export interface WriteFileResult {
    uri: string;
}
/**
 * Append file options
 */
export interface AppendFileOptions {
    path: string;
    data: string;
    directory?: FilesystemDirectory;
    encoding?: FilesystemEncoding;
}
/**
 * Delete file options
 */
export interface DeleteFileOptions {
    path: string;
    directory?: FilesystemDirectory;
}
/**
 * Make directory options
 */
export interface MkdirOptions {
    path: string;
    directory?: FilesystemDirectory;
    recursive?: boolean;
}
/**
 * Remove directory options
 */
export interface RmdirOptions {
    path: string;
    directory?: FilesystemDirectory;
    recursive?: boolean;
}
/**
 * Read directory options
 */
export interface ReaddirOptions {
    path: string;
    directory?: FilesystemDirectory;
}
/**
 * File info
 */
export interface FileInfo {
    name: string;
    type: 'file' | 'directory';
    size: number;
    ctime: number;
    mtime: number;
    uri: string;
}
/**
 * Read directory result
 */
export interface ReaddirResult {
    files: FileInfo[];
}
/**
 * Stat options
 */
export interface StatOptions {
    path: string;
    directory?: FilesystemDirectory;
}
/**
 * Stat result
 */
export interface StatResult {
    type: 'file' | 'directory';
    size: number;
    ctime: number;
    mtime: number;
    uri: string;
}
/**
 * Copy options
 */
export interface CopyOptions {
    from: string;
    to: string;
    directory?: FilesystemDirectory;
    toDirectory?: FilesystemDirectory;
}
/**
 * Copy result
 */
export interface CopyResult {
    uri: string;
}
/**
 * Rename options
 */
export interface RenameOptions {
    from: string;
    to: string;
    directory?: FilesystemDirectory;
    toDirectory?: FilesystemDirectory;
}
/**
 * Filesystem plugin interface
 */
export interface FilesystemPlugin {
    readFile: (options: ReadFileOptions) => Promise<ReadFileResult>;
    writeFile: (options: WriteFileOptions) => Promise<WriteFileResult>;
    appendFile: (options: AppendFileOptions) => Promise<void>;
    deleteFile: (options: DeleteFileOptions) => Promise<void>;
    mkdir: (options: MkdirOptions) => Promise<void>;
    rmdir: (options: RmdirOptions) => Promise<void>;
    readdir: (options: ReaddirOptions) => Promise<ReaddirResult>;
    stat: (options: StatOptions) => Promise<StatResult>;
    getUri: (options: {
        path: string;
        directory: FilesystemDirectory;
    }) => Promise<{
        uri: string;
    }>;
    rename: (options: RenameOptions) => Promise<void>;
    copy: (options: CopyOptions) => Promise<CopyResult>;
    checkPermissions: () => Promise<{
        publicStorage: 'prompt' | 'granted' | 'denied';
    }>;
    requestPermissions: () => Promise<{
        publicStorage: 'prompt' | 'granted' | 'denied';
    }>;
}
/**
 * Local notification schedule
 */
export interface LocalNotificationSchedule {
    at?: Date;
    repeats?: boolean;
    every?: 'year' | 'month' | 'two-weeks' | 'week' | 'day' | 'hour' | 'minute' | 'second';
    count?: number;
    on?: {
        year?: number;
        month?: number;
        day?: number;
        weekday?: number;
        hour?: number;
        minute?: number;
        second?: number;
    };
}
/**
 * Local notification
 */
export interface LocalNotification {
    title: string;
    body: string;
    id: number;
    schedule?: LocalNotificationSchedule;
    sound?: string;
    smallIcon?: string;
    largeIcon?: string;
    iconColor?: string;
    attachments?: {
        id: string;
        url: string;
    }[];
    actionTypeId?: string;
    extra?: Record<string, unknown>;
    threadIdentifier?: string;
    summaryArgument?: string;
    group?: string;
    groupSummary?: boolean;
    channelId?: string;
    ongoing?: boolean;
    autoCancel?: boolean;
    inboxList?: string[];
    largeBody?: string;
}
/**
 * Local notifications plugin interface
 */
export interface LocalNotificationsPlugin {
    schedule: (options: {
        notifications: LocalNotification[];
    }) => Promise<{
        notifications: {
            id: number;
        }[];
    }>;
    pending: () => Promise<{
        notifications: {
            id: number;
        }[];
    }>;
    cancel: (options: {
        notifications: {
            id: number;
        }[];
    }) => Promise<void>;
    registerActionTypes: (options: {
        types: {
            id: string;
            actions: {
                id: string;
                title: string;
            }[];
        }[];
    }) => Promise<void>;
    areEnabled: () => Promise<{
        value: boolean;
    }>;
    getDeliveredNotifications: () => Promise<{
        notifications: {
            id: number;
            title: string;
            body: string;
        }[];
    }>;
    removeDeliveredNotifications: (options: {
        notifications: {
            id: number;
        }[];
    }) => Promise<void>;
    removeAllDeliveredNotifications: () => Promise<void>;
    createChannel: (options: {
        id: string;
        name: string;
        importance?: number;
        description?: string;
    }) => Promise<void>;
    deleteChannel: (options: {
        id: string;
    }) => Promise<void>;
    listChannels: () => Promise<{
        channels: {
            id: string;
            name: string;
        }[];
    }>;
    checkPermissions: () => Promise<{
        display: 'prompt' | 'granted' | 'denied';
    }>;
    requestPermissions: () => Promise<{
        display: 'prompt' | 'granted' | 'denied';
    }>;
    addListener: (eventName: 'localNotificationReceived' | 'localNotificationActionPerformed', listener: (notification: unknown) => void) => Promise<PluginListenerHandle>;
}
/**
 * Push notifications plugin interface
 */
export interface PushNotificationsPlugin {
    register: () => Promise<void>;
    unregister: () => Promise<void>;
    getDeliveredNotifications: () => Promise<{
        notifications: {
            id: string;
            data: Record<string, unknown>;
        }[];
    }>;
    removeDeliveredNotifications: (options: {
        notifications: {
            id: string;
        }[];
    }) => Promise<void>;
    removeAllDeliveredNotifications: () => Promise<void>;
    createChannel: (options: {
        id: string;
        name: string;
        importance?: number;
        description?: string;
    }) => Promise<void>;
    deleteChannel: (options: {
        id: string;
    }) => Promise<void>;
    listChannels: () => Promise<{
        channels: {
            id: string;
            name: string;
        }[];
    }>;
    checkPermissions: () => Promise<{
        receive: 'prompt' | 'granted' | 'denied';
    }>;
    requestPermissions: () => Promise<{
        receive: 'prompt' | 'granted' | 'denied';
    }>;
    addListener: (eventName: 'registration' | 'registrationError' | 'pushNotificationReceived' | 'pushNotificationActionPerformed', listener: (data: unknown) => void) => Promise<PluginListenerHandle>;
}
/**
 * Status bar style
 */
export type StatusBarStyle = 'Dark' | 'Light' | 'Default';
/**
 * Status bar animation
 */
export type StatusBarAnimation = 'Fade' | 'Slide' | 'None';
/**
 * Status bar info
 */
export interface StatusBarInfo {
    visible: boolean;
    style: StatusBarStyle;
    color?: string;
    overlays?: boolean;
}
/**
 * Status bar plugin interface
 */
export interface StatusBarPlugin {
    setStyle: (options: {
        style: StatusBarStyle;
    }) => Promise<void>;
    setBackgroundColor: (options: {
        color: string;
    }) => Promise<void>;
    show: (options?: {
        animation?: StatusBarAnimation;
    }) => Promise<void>;
    hide: (options?: {
        animation?: StatusBarAnimation;
    }) => Promise<void>;
    getInfo: () => Promise<StatusBarInfo>;
    setOverlaysWebView: (options: {
        overlay: boolean;
    }) => Promise<void>;
}
/**
 * Splash screen show options
 */
export interface SplashScreenShowOptions {
    autoHide?: boolean;
    fadeInDuration?: number;
    fadeOutDuration?: number;
    showDuration?: number;
}
/**
 * Splash screen hide options
 */
export interface SplashScreenHideOptions {
    fadeOutDuration?: number;
}
/**
 * Splash screen plugin interface
 */
export interface SplashScreenPlugin {
    show: (options?: SplashScreenShowOptions) => Promise<void>;
    hide: (options?: SplashScreenHideOptions) => Promise<void>;
}
/**
 * Keyboard style
 */
export type KeyboardStyle = 'Dark' | 'Light' | 'Default';
/**
 * Keyboard resize mode
 */
export type KeyboardResize = 'Body' | 'Ionic' | 'Native' | 'None';
/**
 * Keyboard info
 */
export interface KeyboardInfo {
    keyboardHeight: number;
}
/**
 * Keyboard plugin interface
 */
export interface KeyboardPlugin {
    show: () => Promise<void>;
    hide: () => Promise<void>;
    setAccessoryBarVisible: (options: {
        isVisible: boolean;
    }) => Promise<void>;
    setScroll: (options: {
        isDisabled: boolean;
    }) => Promise<void>;
    setStyle: (options: {
        style: KeyboardStyle;
    }) => Promise<void>;
    setResizeMode: (options: {
        mode: KeyboardResize;
    }) => Promise<void>;
    getResizeMode: () => Promise<{
        mode: KeyboardResize;
    }>;
    addListener: (eventName: 'keyboardWillShow' | 'keyboardDidShow' | 'keyboardWillHide' | 'keyboardDidHide', listener: (info: KeyboardInfo) => void) => Promise<PluginListenerHandle>;
}
/**
 * Impact style
 */
export type ImpactStyle = 'Heavy' | 'Medium' | 'Light';
/**
 * Notification type
 */
export type NotificationType = 'Success' | 'Warning' | 'Error';
/**
 * Haptics plugin interface
 */
export interface HapticsPlugin {
    impact: (options?: {
        style?: ImpactStyle;
    }) => Promise<void>;
    notification: (options?: {
        type?: NotificationType;
    }) => Promise<void>;
    vibrate: (options?: {
        duration?: number;
    }) => Promise<void>;
    selectionStart: () => Promise<void>;
    selectionChanged: () => Promise<void>;
    selectionEnd: () => Promise<void>;
}
/**
 * Share options
 */
export interface ShareOptions {
    title?: string;
    text?: string;
    url?: string;
    dialogTitle?: string;
    files?: string[];
}
/**
 * Share result
 */
export interface ShareResult {
    activityType?: string;
}
/**
 * Share plugin interface
 */
export interface SharePlugin {
    share: (options: ShareOptions) => Promise<ShareResult>;
    canShare: () => Promise<{
        value: boolean;
    }>;
}
/**
 * Browser open options
 */
export interface BrowserOpenOptions {
    url: string;
    windowName?: string;
    toolbarColor?: string;
    presentationStyle?: 'fullscreen' | 'popover';
    width?: number;
    height?: number;
}
/**
 * Browser plugin interface
 */
export interface BrowserPlugin {
    open: (options: BrowserOpenOptions) => Promise<void>;
    close: () => Promise<void>;
    addListener: (eventName: 'browserFinished' | 'browserPageLoaded', listener: () => void) => Promise<PluginListenerHandle>;
}
/**
 * Clipboard write options
 */
export interface ClipboardWriteOptions {
    string?: string;
    url?: string;
    image?: string;
    label?: string;
}
/**
 * Clipboard read result
 */
export interface ClipboardReadResult {
    value: string;
    type: string;
}
/**
 * Clipboard plugin interface
 */
export interface ClipboardPlugin {
    write: (options: ClipboardWriteOptions) => Promise<void>;
    read: () => Promise<ClipboardReadResult>;
}
/**
 * Network connection type
 */
export type ConnectionType = 'wifi' | 'cellular' | 'none' | 'unknown';
/**
 * Network status
 */
export interface NetworkStatus {
    connected: boolean;
    connectionType: ConnectionType;
}
/**
 * Network plugin interface
 */
export interface NetworkPlugin {
    getStatus: () => Promise<NetworkStatus>;
    addListener: (eventName: 'networkStatusChange', listener: (status: NetworkStatus) => void) => Promise<PluginListenerHandle>;
}
/**
 * Storage get result
 */
export interface StorageGetResult {
    value: string | null;
}
/**
 * Storage keys result
 */
export interface StorageKeysResult {
    keys: string[];
}
/**
 * Storage plugin interface
 */
export interface StoragePlugin {
    get: (options: {
        key: string;
    }) => Promise<StorageGetResult>;
    set: (options: {
        key: string;
        value: string;
    }) => Promise<void>;
    remove: (options: {
        key: string;
    }) => Promise<void>;
    clear: () => Promise<void>;
    keys: () => Promise<StorageKeysResult>;
    migrate: () => Promise<{
        migrated: string[];
        existing: string[];
    }>;
}
/**
 * Preferences plugin interface (alias for Storage in Capacitor 4+)
 */
export type PreferencesPlugin = StoragePlugin;
/**
 * Toast position
 */
export type ToastPosition = 'top' | 'center' | 'bottom';
/**
 * Toast duration
 */
export type ToastDuration = 'short' | 'long';
/**
 * Toast show options
 */
export interface ToastShowOptions {
    text: string;
    duration?: ToastDuration;
    position?: ToastPosition;
}
/**
 * Toast plugin interface
 */
export interface ToastPlugin {
    show: (options: ToastShowOptions) => Promise<void>;
}
/**
 * Check if value is CapacitorGlobal
 */
export declare function isCapacitorGlobal(value: unknown): value is CapacitorGlobal;
/**
 * Check if Capacitor is available in window
 */
export declare function hasCapacitor(): boolean;
export {};
//# sourceMappingURL=types.d.ts.map