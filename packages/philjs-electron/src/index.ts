/**
 * @philjs/electron - Electron Integration for PhilJS
 *
 * Comprehensive Electron integration with PhilJS signals.
 * Provides reactive hooks for all major Electron APIs.
 *
 * @example
 * ```tsx
 * import {
 *   useElectron,
 *   useWindow,
 *   useDialog,
 *   useMenu,
 *   useTray,
 *   useAutoUpdater,
 * } from '@philjs/electron';
 *
 * function App() {
 *   const { isElectron, invoke } = useElectron();
 *   const { isMaximized, minimize, maximize, close } = useWindow();
 *
 *   return (
 *     <div>
 *       {isElectron && (
 *         <div className="titlebar">
 *           <button onClick={minimize}>-</button>
 *           <button onClick={maximize}>{isMaximized() ? '◱' : '□'}</button>
 *           <button onClick={close}>×</button>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */

import { signal, computed, effect, batch, type Signal, type Computed } from '@philjs/core';

// ============================================================================
// TYPES
// ============================================================================

// IPC Types
export interface IpcRenderer {
  send: (channel: string, ...args: any[]) => void;
  on: (channel: string, listener: (...args: any[]) => void) => void;
  once: (channel: string, listener: (...args: any[]) => void) => void;
  removeListener: (channel: string, listener: (...args: any[]) => void) => void;
  removeAllListeners: (channel: string) => void;
  invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>;
  sendSync: <T = any>(channel: string, ...args: any[]) => T;
}

// Window Types
export interface WindowState {
  isMaximized: boolean;
  isMinimized: boolean;
  isFullscreen: boolean;
  isFocused: boolean;
  isVisible: boolean;
  isAlwaysOnTop: boolean;
  bounds: WindowBounds;
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowOptions {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  resizable?: boolean;
  movable?: boolean;
  minimizable?: boolean;
  maximizable?: boolean;
  closable?: boolean;
  focusable?: boolean;
  alwaysOnTop?: boolean;
  fullscreenable?: boolean;
  skipTaskbar?: boolean;
  frame?: boolean;
  transparent?: boolean;
  vibrancy?: 'appearance-based' | 'light' | 'dark' | 'titlebar' | 'selection' | 'menu' | 'popover' | 'sidebar' | 'medium-light' | 'ultra-dark';
  titleBarStyle?: 'default' | 'hidden' | 'hiddenInset' | 'customButtonsOnHover';
  backgroundColor?: string;
}

// Dialog Types
export interface OpenDialogOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: FileFilter[];
  properties?: ('openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles' | 'createDirectory' | 'promptToCreate' | 'noResolveAliases' | 'treatPackageAsDirectory')[];
  message?: string;
  securityScopedBookmarks?: boolean;
}

export interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: FileFilter[];
  message?: string;
  nameFieldLabel?: string;
  showsTagField?: boolean;
  properties?: ('showHiddenFiles' | 'createDirectory' | 'treatPackageAsDirectory' | 'showOverwriteConfirmation')[];
  securityScopedBookmarks?: boolean;
}

export interface MessageBoxOptions {
  type?: 'none' | 'info' | 'error' | 'question' | 'warning';
  buttons?: string[];
  defaultId?: number;
  title?: string;
  message: string;
  detail?: string;
  checkboxLabel?: string;
  checkboxChecked?: boolean;
  icon?: string;
  cancelId?: number;
  noLink?: boolean;
}

export interface FileFilter {
  name: string;
  extensions: string[];
}

export interface OpenDialogResult {
  canceled: boolean;
  filePaths: string[];
  bookmarks?: string[];
}

export interface SaveDialogResult {
  canceled: boolean;
  filePath?: string;
  bookmark?: string;
}

export interface MessageBoxResult {
  response: number;
  checkboxChecked: boolean;
}

// Menu Types
export interface MenuItemOptions {
  id?: string;
  label?: string;
  type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
  sublabel?: string;
  toolTip?: string;
  accelerator?: string;
  icon?: string;
  enabled?: boolean;
  visible?: boolean;
  checked?: boolean;
  click?: () => void;
  role?: MenuRole;
  submenu?: MenuItemOptions[];
}

export type MenuRole =
  | 'undo' | 'redo' | 'cut' | 'copy' | 'paste' | 'pasteAndMatchStyle'
  | 'delete' | 'selectAll' | 'reload' | 'forceReload' | 'toggleDevTools'
  | 'resetZoom' | 'zoomIn' | 'zoomOut' | 'togglefullscreen' | 'window'
  | 'minimize' | 'close' | 'help' | 'about' | 'services' | 'hide'
  | 'hideOthers' | 'unhide' | 'quit' | 'startSpeaking' | 'stopSpeaking'
  | 'zoom' | 'front' | 'appMenu' | 'fileMenu' | 'editMenu' | 'viewMenu'
  | 'shareMenu' | 'recentDocuments' | 'toggleTabBar' | 'selectNextTab'
  | 'selectPreviousTab' | 'mergeAllWindows' | 'clearRecentDocuments'
  | 'moveTabToNewWindow' | 'windowMenu';

// Tray Types
export interface TrayOptions {
  icon: string;
  title?: string;
  tooltip?: string;
  menu?: MenuItemOptions[];
}

// Notification Types
export interface NotificationOptions {
  title: string;
  body?: string;
  subtitle?: string;
  icon?: string;
  silent?: boolean;
  sound?: string;
  hasReply?: boolean;
  urgency?: 'normal' | 'critical' | 'low';
  timeoutType?: 'default' | 'never';
  replyPlaceholder?: string;
  actions?: { type: 'button'; text: string }[];
  closeButtonText?: string;
}

// Auto-updater Types
export interface UpdateInfo {
  version: string;
  files: { url: string; sha512: string; size: number }[];
  path: string;
  sha512: string;
  releaseDate: string;
  releaseName?: string;
  releaseNotes?: string | ReleaseNoteInfo[];
}

export interface ReleaseNoteInfo {
  version: string;
  note: string;
}

export interface UpdateProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

export type UpdateStatus = 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';

// Power Types
export type PowerState = 'on-ac' | 'on-battery' | 'unknown';
export type IdleState = 'active' | 'idle' | 'locked' | 'unknown';
export type SystemIdleState = 'active' | 'idle' | 'locked' | 'unknown';

// Screen Types
export interface Display {
  id: number;
  label: string;
  bounds: { x: number; y: number; width: number; height: number };
  workArea: { x: number; y: number; width: number; height: number };
  scaleFactor: number;
  rotation: number;
  internal: boolean;
  monochrome: boolean;
  accelerometerSupport: 'available' | 'unavailable' | 'unknown';
  colorSpace: string;
  colorDepth: number;
  depthPerComponent: number;
  displayFrequency: number;
  size: { width: number; height: number };
}

// Shell Types
export interface ShellResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

// Deep Link Types
export interface DeepLinkHandler {
  register: (protocol: string) => Promise<boolean>;
  unregister: (protocol: string) => Promise<boolean>;
  isRegistered: (protocol: string) => Promise<boolean>;
  onOpen: (callback: (url: string) => void) => void;
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const windowStateSignal: Signal<WindowState> = signal({
  isMaximized: false,
  isMinimized: false,
  isFullscreen: false,
  isFocused: true,
  isVisible: true,
  isAlwaysOnTop: false,
  bounds: { x: 0, y: 0, width: 800, height: 600 },
});

const updateStatusSignal: Signal<UpdateStatus> = signal('checking');
const updateInfoSignal: Signal<UpdateInfo | null> = signal(null);
const updateProgressSignal: Signal<UpdateProgress | null> = signal(null);
const powerStateSignal: Signal<PowerState> = signal('unknown');
const onlineStatusSignal: Signal<boolean> = signal(true);
const primaryDisplaySignal: Signal<Display | null> = signal(null);
const allDisplaysSignal: Signal<Display[]> = signal([]);

// ============================================================================
// CORE ELECTRON HOOK
// ============================================================================

/**
 * Core Electron integration hook
 */
export function useElectron(): {
  isElectron: boolean;
  ipc: IpcRenderer | null;
  platform: NodeJS.Platform | null;
  versions: { node: string; electron: string; chrome: string } | null;
  send: (channel: string, ...args: any[]) => void;
  on: (channel: string, callback: (...args: any[]) => void) => () => void;
  once: (channel: string, callback: (...args: any[]) => void) => void;
  invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>;
  removeAllListeners: (channel: string) => void;
} {
  const isElectron = typeof window !== 'undefined' && !!(window as any).electron;
  const electronBridge = isElectron ? (window as any).electron : null;

  return {
    isElectron,
    ipc: electronBridge?.ipcRenderer || null,
    platform: electronBridge?.platform || null,
    versions: electronBridge?.versions || null,
    send: (channel: string, ...args: any[]) => {
      electronBridge?.ipcRenderer?.send(channel, ...args);
    },
    on: (channel: string, callback: (...args: any[]) => void) => {
      const handler = (_event: any, ...args: any[]) => callback(...args);
      electronBridge?.ipcRenderer?.on(channel, handler);
      return () => electronBridge?.ipcRenderer?.removeListener(channel, handler);
    },
    once: (channel: string, callback: (...args: any[]) => void) => {
      electronBridge?.ipcRenderer?.once(channel, (_event: any, ...args: any[]) => callback(...args));
    },
    invoke: async <T = any>(channel: string, ...args: any[]): Promise<T> => {
      return electronBridge?.ipcRenderer?.invoke(channel, ...args);
    },
    removeAllListeners: (channel: string) => {
      electronBridge?.ipcRenderer?.removeAllListeners(channel);
    },
  };
}

// ============================================================================
// WINDOW MANAGEMENT
// ============================================================================

/**
 * Window management hook
 */
export function useWindow(): {
  state: Signal<WindowState>;
  isMaximized: Computed<boolean>;
  isMinimized: Computed<boolean>;
  isFullscreen: Computed<boolean>;
  isFocused: Computed<boolean>;
  bounds: Computed<WindowBounds>;
  minimize: () => void;
  maximize: () => void;
  unmaximize: () => void;
  toggleMaximize: () => void;
  close: () => void;
  restore: () => void;
  setFullscreen: (fullscreen: boolean) => void;
  toggleFullscreen: () => void;
  setAlwaysOnTop: (flag: boolean, level?: string) => void;
  setBounds: (bounds: Partial<WindowBounds>) => void;
  setMinimumSize: (width: number, height: number) => void;
  setMaximumSize: (width: number, height: number) => void;
  setTitle: (title: string) => void;
  setProgressBar: (progress: number) => void;
  flashFrame: (flag: boolean) => void;
  focus: () => void;
  blur: () => void;
  show: () => void;
  hide: () => void;
  setOpacity: (opacity: number) => void;
  setBackgroundColor: (color: string) => void;
  setVibrancy: (type: WindowOptions['vibrancy']) => void;
} {
  const { on, invoke } = useElectron();

  // Set up listeners
  effect(() => {
    const unsubscribers = [
      on('window-maximized', () => {
        windowStateSignal.set({ ...windowStateSignal.get(), isMaximized: true });
      }),
      on('window-unmaximized', () => {
        windowStateSignal.set({ ...windowStateSignal.get(), isMaximized: false });
      }),
      on('window-minimized', () => {
        windowStateSignal.set({ ...windowStateSignal.get(), isMinimized: true });
      }),
      on('window-restored', () => {
        windowStateSignal.set({ ...windowStateSignal.get(), isMinimized: false });
      }),
      on('window-enter-full-screen', () => {
        windowStateSignal.set({ ...windowStateSignal.get(), isFullscreen: true });
      }),
      on('window-leave-full-screen', () => {
        windowStateSignal.set({ ...windowStateSignal.get(), isFullscreen: false });
      }),
      on('window-focus', () => {
        windowStateSignal.set({ ...windowStateSignal.get(), isFocused: true });
      }),
      on('window-blur', () => {
        windowStateSignal.set({ ...windowStateSignal.get(), isFocused: false });
      }),
      on('window-show', () => {
        windowStateSignal.set({ ...windowStateSignal.get(), isVisible: true });
      }),
      on('window-hide', () => {
        windowStateSignal.set({ ...windowStateSignal.get(), isVisible: false });
      }),
      on('window-moved', (bounds: WindowBounds) => {
        windowStateSignal.set({ ...windowStateSignal.get(), bounds });
      }),
      on('window-resized', (bounds: WindowBounds) => {
        windowStateSignal.set({ ...windowStateSignal.get(), bounds });
      }),
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  });

  return {
    state: windowStateSignal,
    isMaximized: computed(() => windowStateSignal.get().isMaximized),
    isMinimized: computed(() => windowStateSignal.get().isMinimized),
    isFullscreen: computed(() => windowStateSignal.get().isFullscreen),
    isFocused: computed(() => windowStateSignal.get().isFocused),
    bounds: computed(() => windowStateSignal.get().bounds),
    minimize: () => invoke('window:minimize'),
    maximize: () => invoke('window:maximize'),
    unmaximize: () => invoke('window:unmaximize'),
    toggleMaximize: () => {
      if (windowStateSignal.get().isMaximized) {
        invoke('window:unmaximize');
      } else {
        invoke('window:maximize');
      }
    },
    close: () => invoke('window:close'),
    restore: () => invoke('window:restore'),
    setFullscreen: (fullscreen: boolean) => invoke('window:setFullscreen', fullscreen),
    toggleFullscreen: () => {
      invoke('window:setFullscreen', !windowStateSignal.get().isFullscreen);
    },
    setAlwaysOnTop: (flag: boolean, level?: string) => invoke('window:setAlwaysOnTop', flag, level),
    setBounds: (bounds: Partial<WindowBounds>) => invoke('window:setBounds', bounds),
    setMinimumSize: (width: number, height: number) => invoke('window:setMinimumSize', width, height),
    setMaximumSize: (width: number, height: number) => invoke('window:setMaximumSize', width, height),
    setTitle: (title: string) => invoke('window:setTitle', title),
    setProgressBar: (progress: number) => invoke('window:setProgressBar', progress),
    flashFrame: (flag: boolean) => invoke('window:flashFrame', flag),
    focus: () => invoke('window:focus'),
    blur: () => invoke('window:blur'),
    show: () => invoke('window:show'),
    hide: () => invoke('window:hide'),
    setOpacity: (opacity: number) => invoke('window:setOpacity', opacity),
    setBackgroundColor: (color: string) => invoke('window:setBackgroundColor', color),
    setVibrancy: (type) => invoke('window:setVibrancy', type),
  };
}

/**
 * Custom title bar hook (for frameless windows)
 */
export function useTitleBar(): {
  draggable: (element: HTMLElement) => void;
  nonDraggable: (element: HTMLElement) => void;
} {
  return {
    draggable: (element: HTMLElement) => {
      element.style.webkitAppRegion = 'drag';
      (element.style as any)['-webkit-app-region'] = 'drag';
    },
    nonDraggable: (element: HTMLElement) => {
      element.style.webkitAppRegion = 'no-drag';
      (element.style as any)['-webkit-app-region'] = 'no-drag';
    },
  };
}

// ============================================================================
// DIALOGS
// ============================================================================

/**
 * Native dialog hook
 */
export function useDialog(): {
  showOpenDialog: (options?: OpenDialogOptions) => Promise<OpenDialogResult>;
  showSaveDialog: (options?: SaveDialogOptions) => Promise<SaveDialogResult>;
  showMessageBox: (options: MessageBoxOptions) => Promise<MessageBoxResult>;
  showErrorBox: (title: string, content: string) => void;
} {
  const { invoke } = useElectron();

  return {
    showOpenDialog: async (options = {}) => {
      return invoke<OpenDialogResult>('dialog:showOpenDialog', options);
    },
    showSaveDialog: async (options = {}) => {
      return invoke<SaveDialogResult>('dialog:showSaveDialog', options);
    },
    showMessageBox: async (options) => {
      return invoke<MessageBoxResult>('dialog:showMessageBox', options);
    },
    showErrorBox: (title: string, content: string) => {
      invoke('dialog:showErrorBox', title, content);
    },
  };
}

// ============================================================================
// MENU
// ============================================================================

/**
 * Application menu hook
 */
export function useMenu(): {
  setApplicationMenu: (template: MenuItemOptions[]) => void;
  showContextMenu: (template: MenuItemOptions[]) => void;
  popup: (template: MenuItemOptions[], options?: { x?: number; y?: number }) => void;
} {
  const { invoke } = useElectron();

  const processMenuTemplate = (template: MenuItemOptions[]): MenuItemOptions[] => {
    return template.map((item, index) => ({
      ...item,
      id: item.id || `menu-item-${index}-${Date.now()}`,
      submenu: item.submenu ? processMenuTemplate(item.submenu) : undefined,
    }));
  };

  return {
    setApplicationMenu: (template) => {
      invoke('menu:setApplicationMenu', processMenuTemplate(template));
    },
    showContextMenu: (template) => {
      invoke('menu:showContextMenu', processMenuTemplate(template));
    },
    popup: (template, options) => {
      invoke('menu:popup', processMenuTemplate(template), options);
    },
  };
}

// ============================================================================
// TRAY
// ============================================================================

/**
 * System tray hook
 */
export function useTray(): {
  create: (options: TrayOptions) => Promise<string>;
  destroy: (id: string) => void;
  setImage: (id: string, icon: string) => void;
  setTitle: (id: string, title: string) => void;
  setTooltip: (id: string, tooltip: string) => void;
  setContextMenu: (id: string, menu: MenuItemOptions[]) => void;
  displayBalloon: (id: string, options: { icon?: string; title: string; content: string }) => void;
} {
  const { invoke } = useElectron();

  return {
    create: async (options) => {
      return invoke<string>('tray:create', options);
    },
    destroy: (id) => invoke('tray:destroy', id),
    setImage: (id, icon) => invoke('tray:setImage', id, icon),
    setTitle: (id, title) => invoke('tray:setTitle', id, title),
    setTooltip: (id, tooltip) => invoke('tray:setTooltip', id, tooltip),
    setContextMenu: (id, menu) => invoke('tray:setContextMenu', id, menu),
    displayBalloon: (id, options) => invoke('tray:displayBalloon', id, options),
  };
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

/**
 * Native notification hook
 */
export function useNotification(): {
  show: (options: NotificationOptions) => Promise<void>;
  isSupported: () => Promise<boolean>;
} {
  const { invoke } = useElectron();

  return {
    show: async (options) => {
      await invoke('notification:show', options);
    },
    isSupported: async () => {
      return invoke<boolean>('notification:isSupported');
    },
  };
}

// ============================================================================
// AUTO-UPDATER
// ============================================================================

/**
 * Auto-updater hook
 */
export function useAutoUpdater(): {
  status: Signal<UpdateStatus>;
  info: Signal<UpdateInfo | null>;
  progress: Signal<UpdateProgress | null>;
  checkForUpdates: () => Promise<UpdateInfo | null>;
  downloadUpdate: () => Promise<void>;
  quitAndInstall: () => void;
  setAutoDownload: (flag: boolean) => void;
  setAutoInstallOnAppQuit: (flag: boolean) => void;
} {
  const { on, invoke } = useElectron();

  effect(() => {
    const unsubscribers = [
      on('update-checking', () => updateStatusSignal.set('checking')),
      on('update-available', (info: UpdateInfo) => {
        updateStatusSignal.set('available');
        updateInfoSignal.set(info);
      }),
      on('update-not-available', () => updateStatusSignal.set('not-available')),
      on('update-downloading', (progress: UpdateProgress) => {
        updateStatusSignal.set('downloading');
        updateProgressSignal.set(progress);
      }),
      on('update-downloaded', (info: UpdateInfo) => {
        updateStatusSignal.set('downloaded');
        updateInfoSignal.set(info);
      }),
      on('update-error', () => updateStatusSignal.set('error')),
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  });

  return {
    status: updateStatusSignal,
    info: updateInfoSignal,
    progress: updateProgressSignal,
    checkForUpdates: async () => {
      return invoke<UpdateInfo | null>('autoUpdater:checkForUpdates');
    },
    downloadUpdate: async () => {
      await invoke('autoUpdater:downloadUpdate');
    },
    quitAndInstall: () => {
      invoke('autoUpdater:quitAndInstall');
    },
    setAutoDownload: (flag: boolean) => {
      invoke('autoUpdater:setAutoDownload', flag);
    },
    setAutoInstallOnAppQuit: (flag: boolean) => {
      invoke('autoUpdater:setAutoInstallOnAppQuit', flag);
    },
  };
}

// ============================================================================
// POWER MONITOR
// ============================================================================

/**
 * Power monitor hook
 */
export function usePowerMonitor(): {
  powerState: Signal<PowerState>;
  isOnBattery: Computed<boolean>;
  getSystemIdleState: (idleThreshold: number) => Promise<SystemIdleState>;
  getSystemIdleTime: () => Promise<number>;
} {
  const { on, invoke } = useElectron();

  effect(() => {
    const unsubscribers = [
      on('power-on-ac', () => powerStateSignal.set('on-ac')),
      on('power-on-battery', () => powerStateSignal.set('on-battery')),
    ];

    // Get initial state
    invoke<PowerState>('power:getState').then(state => {
      powerStateSignal.set(state);
    });

    return () => unsubscribers.forEach(unsub => unsub());
  });

  return {
    powerState: powerStateSignal,
    isOnBattery: computed(() => powerStateSignal.get() === 'on-battery'),
    getSystemIdleState: async (idleThreshold: number) => {
      return invoke<SystemIdleState>('power:getSystemIdleState', idleThreshold);
    },
    getSystemIdleTime: async () => {
      return invoke<number>('power:getSystemIdleTime');
    },
  };
}

// ============================================================================
// SCREEN
// ============================================================================

/**
 * Screen/Display hook
 */
export function useScreen(): {
  primaryDisplay: Signal<Display | null>;
  allDisplays: Signal<Display[]>;
  getCursorScreenPoint: () => Promise<{ x: number; y: number }>;
  getDisplayMatching: (rect: { x: number; y: number; width: number; height: number }) => Promise<Display>;
  getDisplayNearestPoint: (point: { x: number; y: number }) => Promise<Display>;
} {
  const { on, invoke } = useElectron();

  effect(() => {
    // Get initial display info
    invoke<Display>('screen:getPrimaryDisplay').then(display => {
      primaryDisplaySignal.set(display);
    });
    invoke<Display[]>('screen:getAllDisplays').then(displays => {
      allDisplaysSignal.set(displays);
    });

    const unsubscribers = [
      on('display-added', (display: Display) => {
        allDisplaysSignal.set([...allDisplaysSignal.get(), display]);
      }),
      on('display-removed', (display: Display) => {
        allDisplaysSignal.set(allDisplaysSignal.get().filter(d => d.id !== display.id));
      }),
      on('display-metrics-changed', () => {
        invoke<Display[]>('screen:getAllDisplays').then(displays => {
          allDisplaysSignal.set(displays);
        });
      }),
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  });

  return {
    primaryDisplay: primaryDisplaySignal,
    allDisplays: allDisplaysSignal,
    getCursorScreenPoint: async () => {
      return invoke<{ x: number; y: number }>('screen:getCursorScreenPoint');
    },
    getDisplayMatching: async (rect) => {
      return invoke<Display>('screen:getDisplayMatching', rect);
    },
    getDisplayNearestPoint: async (point) => {
      return invoke<Display>('screen:getDisplayNearestPoint', point);
    },
  };
}

// ============================================================================
// SHELL
// ============================================================================

/**
 * Shell operations hook
 */
export function useShell(): {
  openExternal: (url: string, options?: { activate?: boolean; workingDirectory?: string }) => Promise<void>;
  openPath: (path: string) => Promise<string>;
  showItemInFolder: (fullPath: string) => void;
  moveItemToTrash: (fullPath: string) => Promise<boolean>;
  beep: () => void;
  readShortcutLink: (shortcutPath: string) => Promise<{ target: string; cwd: string; args: string; description: string; icon: string; iconIndex: number; appUserModelId: string }>;
} {
  const { invoke } = useElectron();

  return {
    openExternal: async (url, options) => {
      await invoke('shell:openExternal', url, options);
    },
    openPath: async (path) => {
      return invoke<string>('shell:openPath', path);
    },
    showItemInFolder: (fullPath) => {
      invoke('shell:showItemInFolder', fullPath);
    },
    moveItemToTrash: async (fullPath) => {
      return invoke<boolean>('shell:moveItemToTrash', fullPath);
    },
    beep: () => {
      invoke('shell:beep');
    },
    readShortcutLink: async (shortcutPath) => {
      return invoke('shell:readShortcutLink', shortcutPath);
    },
  };
}

// ============================================================================
// CLIPBOARD
// ============================================================================

/**
 * Clipboard hook
 */
export function useClipboard(): {
  readText: () => Promise<string>;
  writeText: (text: string) => Promise<void>;
  readHTML: () => Promise<string>;
  writeHTML: (markup: string) => Promise<void>;
  readImage: () => Promise<string>;
  writeImage: (dataUrl: string) => Promise<void>;
  readRTF: () => Promise<string>;
  writeRTF: (text: string) => Promise<void>;
  clear: () => Promise<void>;
  availableFormats: () => Promise<string[]>;
  has: (format: string) => Promise<boolean>;
} {
  const { invoke } = useElectron();

  return {
    readText: async () => invoke<string>('clipboard:readText'),
    writeText: async (text) => invoke('clipboard:writeText', text),
    readHTML: async () => invoke<string>('clipboard:readHTML'),
    writeHTML: async (markup) => invoke('clipboard:writeHTML', markup),
    readImage: async () => invoke<string>('clipboard:readImage'),
    writeImage: async (dataUrl) => invoke('clipboard:writeImage', dataUrl),
    readRTF: async () => invoke<string>('clipboard:readRTF'),
    writeRTF: async (text) => invoke('clipboard:writeRTF', text),
    clear: async () => invoke('clipboard:clear'),
    availableFormats: async () => invoke<string[]>('clipboard:availableFormats'),
    has: async (format) => invoke<boolean>('clipboard:has', format),
  };
}

// ============================================================================
// GLOBAL SHORTCUTS
// ============================================================================

/**
 * Global keyboard shortcuts hook
 */
export function useGlobalShortcut(): {
  register: (accelerator: string, callback: () => void) => Promise<boolean>;
  unregister: (accelerator: string) => Promise<void>;
  unregisterAll: () => Promise<void>;
  isRegistered: (accelerator: string) => Promise<boolean>;
} {
  const { on, invoke } = useElectron();
  const callbacks = new Map<string, () => void>();

  effect(() => {
    const unsub = on('globalShortcut:triggered', (accelerator: string) => {
      callbacks.get(accelerator)?.();
    });
    return unsub;
  });

  return {
    register: async (accelerator, callback) => {
      callbacks.set(accelerator, callback);
      return invoke<boolean>('globalShortcut:register', accelerator);
    },
    unregister: async (accelerator) => {
      callbacks.delete(accelerator);
      await invoke('globalShortcut:unregister', accelerator);
    },
    unregisterAll: async () => {
      callbacks.clear();
      await invoke('globalShortcut:unregisterAll');
    },
    isRegistered: async (accelerator) => {
      return invoke<boolean>('globalShortcut:isRegistered', accelerator);
    },
  };
}

// ============================================================================
// DEEP LINKS
// ============================================================================

/**
 * Deep link / Protocol handler hook
 */
export function useDeepLink(): {
  register: (protocol: string) => Promise<boolean>;
  unregister: (protocol: string) => Promise<boolean>;
  isRegistered: (protocol: string) => Promise<boolean>;
  onOpen: (callback: (url: string) => void) => () => void;
  getInitialUrl: () => Promise<string | null>;
} {
  const { on, invoke } = useElectron();

  return {
    register: async (protocol) => {
      return invoke<boolean>('deepLink:register', protocol);
    },
    unregister: async (protocol) => {
      return invoke<boolean>('deepLink:unregister', protocol);
    },
    isRegistered: async (protocol) => {
      return invoke<boolean>('deepLink:isRegistered', protocol);
    },
    onOpen: (callback) => {
      return on('deep-link-open', callback);
    },
    getInitialUrl: async () => {
      return invoke<string | null>('deepLink:getInitialUrl');
    },
  };
}

// ============================================================================
// APP
// ============================================================================

/**
 * App lifecycle hook
 */
export function useApp(): {
  quit: () => void;
  exit: (exitCode?: number) => void;
  relaunch: (options?: { args?: string[]; execPath?: string }) => void;
  isReady: () => Promise<boolean>;
  focus: (options?: { steal: boolean }) => void;
  hide: () => void;
  show: () => void;
  getPath: (name: 'home' | 'appData' | 'userData' | 'sessionData' | 'temp' | 'exe' | 'module' | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' | 'recent' | 'logs' | 'crashDumps') => Promise<string>;
  getVersion: () => Promise<string>;
  getName: () => Promise<string>;
  getLocale: () => Promise<string>;
  getSystemLocale: () => Promise<string>;
  setBadgeCount: (count: number) => Promise<boolean>;
  getBadgeCount: () => Promise<number>;
  isDefaultProtocolClient: (protocol: string) => Promise<boolean>;
  setAsDefaultProtocolClient: (protocol: string) => Promise<boolean>;
  removeAsDefaultProtocolClient: (protocol: string) => Promise<boolean>;
} {
  const { invoke } = useElectron();

  return {
    quit: () => invoke('app:quit'),
    exit: (exitCode) => invoke('app:exit', exitCode),
    relaunch: (options) => invoke('app:relaunch', options),
    isReady: async () => invoke<boolean>('app:isReady'),
    focus: (options) => invoke('app:focus', options),
    hide: () => invoke('app:hide'),
    show: () => invoke('app:show'),
    getPath: async (name) => invoke<string>('app:getPath', name),
    getVersion: async () => invoke<string>('app:getVersion'),
    getName: async () => invoke<string>('app:getName'),
    getLocale: async () => invoke<string>('app:getLocale'),
    getSystemLocale: async () => invoke<string>('app:getSystemLocale'),
    setBadgeCount: async (count) => invoke<boolean>('app:setBadgeCount', count),
    getBadgeCount: async () => invoke<number>('app:getBadgeCount'),
    isDefaultProtocolClient: async (protocol) => invoke<boolean>('app:isDefaultProtocolClient', protocol),
    setAsDefaultProtocolClient: async (protocol) => invoke<boolean>('app:setAsDefaultProtocolClient', protocol),
    removeAsDefaultProtocolClient: async (protocol) => invoke<boolean>('app:removeAsDefaultProtocolClient', protocol),
  };
}

// ============================================================================
// DOCK (macOS)
// ============================================================================

/**
 * macOS Dock hook
 */
export function useDock(): {
  bounce: (type?: 'critical' | 'informational') => Promise<number>;
  cancelBounce: (id: number) => void;
  setBadge: (text: string) => void;
  getBadge: () => Promise<string>;
  hide: () => void;
  show: () => Promise<void>;
  isVisible: () => Promise<boolean>;
  setIcon: (image: string) => void;
  setMenu: (menu: MenuItemOptions[]) => void;
} {
  const { invoke } = useElectron();

  return {
    bounce: async (type) => invoke<number>('dock:bounce', type),
    cancelBounce: (id) => invoke('dock:cancelBounce', id),
    setBadge: (text) => invoke('dock:setBadge', text),
    getBadge: async () => invoke<string>('dock:getBadge'),
    hide: () => invoke('dock:hide'),
    show: async () => invoke('dock:show'),
    isVisible: async () => invoke<boolean>('dock:isVisible'),
    setIcon: (image) => invoke('dock:setIcon', image),
    setMenu: (menu) => invoke('dock:setMenu', menu),
  };
}

// ============================================================================
// NATIVE THEME
// ============================================================================

/**
 * Native theme hook
 */
export function useNativeTheme(): {
  shouldUseDarkColors: Signal<boolean>;
  themeSource: Signal<'system' | 'light' | 'dark'>;
  setThemeSource: (source: 'system' | 'light' | 'dark') => void;
} {
  const shouldUseDarkColors = signal(false);
  const themeSource = signal<'system' | 'light' | 'dark'>('system');
  const { on, invoke } = useElectron();

  effect(() => {
    invoke<boolean>('nativeTheme:shouldUseDarkColors').then(value => {
      shouldUseDarkColors.set(value);
    });
    invoke<'system' | 'light' | 'dark'>('nativeTheme:getThemeSource').then(value => {
      themeSource.set(value);
    });

    return on('nativeTheme:updated', (info: { shouldUseDarkColors: boolean }) => {
      shouldUseDarkColors.set(info.shouldUseDarkColors);
    });
  });

  return {
    shouldUseDarkColors,
    themeSource,
    setThemeSource: (source) => {
      themeSource.set(source);
      invoke('nativeTheme:setThemeSource', source);
    },
  };
}

// ============================================================================
// NETWORK
// ============================================================================

/**
 * Network status hook
 */
export function useNetworkStatus(): Signal<boolean> {
  const { on, invoke } = useElectron();

  effect(() => {
    invoke<boolean>('network:isOnline').then(online => {
      onlineStatusSignal.set(online);
    });

    const unsubscribers = [
      on('network:online', () => onlineStatusSignal.set(true)),
      on('network:offline', () => onlineStatusSignal.set(false)),
    ];

    // Fallback to browser events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => onlineStatusSignal.set(true));
      window.addEventListener('offline', () => onlineStatusSignal.set(false));
    }

    return () => unsubscribers.forEach(unsub => unsub());
  });

  return onlineStatusSignal;
}

// ============================================================================
// FILE SYSTEM
// ============================================================================

/**
 * File system operations (via main process)
 */
export function useFileSystem(): {
  readFile: (path: string, options?: { encoding?: BufferEncoding }) => Promise<string | Buffer>;
  writeFile: (path: string, data: string | Buffer, options?: { encoding?: BufferEncoding }) => Promise<void>;
  appendFile: (path: string, data: string | Buffer) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  exists: (path: string) => Promise<boolean>;
  mkdir: (path: string, options?: { recursive?: boolean }) => Promise<void>;
  rmdir: (path: string, options?: { recursive?: boolean }) => Promise<void>;
  readdir: (path: string) => Promise<string[]>;
  stat: (path: string) => Promise<{ isFile: boolean; isDirectory: boolean; size: number; mtime: Date; ctime: Date }>;
  copy: (src: string, dest: string) => Promise<void>;
  move: (src: string, dest: string) => Promise<void>;
} {
  const { invoke } = useElectron();

  return {
    readFile: async (path, options) => invoke('fs:readFile', path, options),
    writeFile: async (path, data, options) => invoke('fs:writeFile', path, data, options),
    appendFile: async (path, data) => invoke('fs:appendFile', path, data),
    deleteFile: async (path) => invoke('fs:deleteFile', path),
    exists: async (path) => invoke<boolean>('fs:exists', path),
    mkdir: async (path, options) => invoke('fs:mkdir', path, options),
    rmdir: async (path, options) => invoke('fs:rmdir', path, options),
    readdir: async (path) => invoke<string[]>('fs:readdir', path),
    stat: async (path) => invoke('fs:stat', path),
    copy: async (src, dest) => invoke('fs:copy', src, dest),
    move: async (src, dest) => invoke('fs:move', src, dest),
  };
}

// ============================================================================
// SECURE STORAGE
// ============================================================================

/**
 * Secure storage using system keychain
 */
export function useSecureStorage(): {
  getPassword: (service: string, account: string) => Promise<string | null>;
  setPassword: (service: string, account: string, password: string) => Promise<void>;
  deletePassword: (service: string, account: string) => Promise<boolean>;
  findCredentials: (service: string) => Promise<{ account: string; password: string }[]>;
  findPassword: (service: string) => Promise<string | null>;
} {
  const { invoke } = useElectron();

  return {
    getPassword: async (service, account) => invoke<string | null>('keytar:getPassword', service, account),
    setPassword: async (service, account, password) => invoke('keytar:setPassword', service, account, password),
    deletePassword: async (service, account) => invoke<boolean>('keytar:deletePassword', service, account),
    findCredentials: async (service) => invoke('keytar:findCredentials', service),
    findPassword: async (service) => invoke<string | null>('keytar:findPassword', service),
  };
}

// ============================================================================
// PRELOAD SCRIPTS
// ============================================================================

/**
 * Preload script for Electron main/renderer bridge
 */
export const preloadScript = `
const { contextBridge, ipcRenderer } = require('electron');

// Expose safe IPC methods to renderer
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, ...args) => ipcRenderer.send(channel, ...args),
    on: (channel, func) => {
      const listener = (event, ...args) => func(event, ...args);
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    },
    once: (channel, func) => ipcRenderer.once(channel, (event, ...args) => func(event, ...args)),
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    removeListener: (channel, func) => ipcRenderer.removeListener(channel, func),
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  },
  platform: process.platform,
  versions: {
    node: process.versions.node,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  },
});
`;

/**
 * Main process IPC handler setup helper
 */
export const mainProcessHandlers = `
const { ipcMain, BrowserWindow, dialog, Menu, Tray, Notification, app, shell, clipboard, globalShortcut, screen, powerMonitor, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs').promises;

function setupIpcHandlers(mainWindow) {
  // Window handlers
  ipcMain.handle('window:minimize', () => mainWindow.minimize());
  ipcMain.handle('window:maximize', () => mainWindow.maximize());
  ipcMain.handle('window:unmaximize', () => mainWindow.unmaximize());
  ipcMain.handle('window:close', () => mainWindow.close());
  ipcMain.handle('window:restore', () => mainWindow.restore());
  ipcMain.handle('window:setFullscreen', (_, flag) => mainWindow.setFullScreen(flag));
  ipcMain.handle('window:setAlwaysOnTop', (_, flag, level) => mainWindow.setAlwaysOnTop(flag, level));
  ipcMain.handle('window:setBounds', (_, bounds) => mainWindow.setBounds(bounds));
  ipcMain.handle('window:setMinimumSize', (_, width, height) => mainWindow.setMinimumSize(width, height));
  ipcMain.handle('window:setMaximumSize', (_, width, height) => mainWindow.setMaximumSize(width, height));
  ipcMain.handle('window:setTitle', (_, title) => mainWindow.setTitle(title));
  ipcMain.handle('window:setProgressBar', (_, progress) => mainWindow.setProgressBar(progress));
  ipcMain.handle('window:flashFrame', (_, flag) => mainWindow.flashFrame(flag));
  ipcMain.handle('window:focus', () => mainWindow.focus());
  ipcMain.handle('window:blur', () => mainWindow.blur());
  ipcMain.handle('window:show', () => mainWindow.show());
  ipcMain.handle('window:hide', () => mainWindow.hide());
  ipcMain.handle('window:setOpacity', (_, opacity) => mainWindow.setOpacity(opacity));
  ipcMain.handle('window:setBackgroundColor', (_, color) => mainWindow.setBackgroundColor(color));
  ipcMain.handle('window:setVibrancy', (_, type) => mainWindow.setVibrancy(type));

  // Window events
  mainWindow.on('maximize', () => mainWindow.webContents.send('window-maximized'));
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window-unmaximized'));
  mainWindow.on('minimize', () => mainWindow.webContents.send('window-minimized'));
  mainWindow.on('restore', () => mainWindow.webContents.send('window-restored'));
  mainWindow.on('enter-full-screen', () => mainWindow.webContents.send('window-enter-full-screen'));
  mainWindow.on('leave-full-screen', () => mainWindow.webContents.send('window-leave-full-screen'));
  mainWindow.on('focus', () => mainWindow.webContents.send('window-focus'));
  mainWindow.on('blur', () => mainWindow.webContents.send('window-blur'));
  mainWindow.on('show', () => mainWindow.webContents.send('window-show'));
  mainWindow.on('hide', () => mainWindow.webContents.send('window-hide'));
  mainWindow.on('move', () => mainWindow.webContents.send('window-moved', mainWindow.getBounds()));
  mainWindow.on('resize', () => mainWindow.webContents.send('window-resized', mainWindow.getBounds()));

  // Dialog handlers
  ipcMain.handle('dialog:showOpenDialog', (_, options) => dialog.showOpenDialog(mainWindow, options));
  ipcMain.handle('dialog:showSaveDialog', (_, options) => dialog.showSaveDialog(mainWindow, options));
  ipcMain.handle('dialog:showMessageBox', (_, options) => dialog.showMessageBox(mainWindow, options));
  ipcMain.handle('dialog:showErrorBox', (_, title, content) => dialog.showErrorBox(title, content));

  // Menu handlers
  ipcMain.handle('menu:setApplicationMenu', (_, template) => {
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  });
  ipcMain.handle('menu:showContextMenu', (_, template) => {
    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window: mainWindow });
  });
  ipcMain.handle('menu:popup', (_, template, options) => {
    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window: mainWindow, ...options });
  });

  // Shell handlers
  ipcMain.handle('shell:openExternal', (_, url, options) => shell.openExternal(url, options));
  ipcMain.handle('shell:openPath', (_, path) => shell.openPath(path));
  ipcMain.handle('shell:showItemInFolder', (_, fullPath) => shell.showItemInFolder(fullPath));
  ipcMain.handle('shell:moveItemToTrash', (_, fullPath) => shell.trashItem(fullPath));
  ipcMain.handle('shell:beep', () => shell.beep());

  // Clipboard handlers
  ipcMain.handle('clipboard:readText', () => clipboard.readText());
  ipcMain.handle('clipboard:writeText', (_, text) => clipboard.writeText(text));
  ipcMain.handle('clipboard:readHTML', () => clipboard.readHTML());
  ipcMain.handle('clipboard:writeHTML', (_, markup) => clipboard.writeHTML(markup));
  ipcMain.handle('clipboard:clear', () => clipboard.clear());
  ipcMain.handle('clipboard:availableFormats', () => clipboard.availableFormats());

  // App handlers
  ipcMain.handle('app:quit', () => app.quit());
  ipcMain.handle('app:exit', (_, exitCode) => app.exit(exitCode));
  ipcMain.handle('app:relaunch', (_, options) => app.relaunch(options));
  ipcMain.handle('app:getPath', (_, name) => app.getPath(name));
  ipcMain.handle('app:getVersion', () => app.getVersion());
  ipcMain.handle('app:getName', () => app.getName());
  ipcMain.handle('app:getLocale', () => app.getLocale());

  // Screen handlers
  ipcMain.handle('screen:getPrimaryDisplay', () => screen.getPrimaryDisplay());
  ipcMain.handle('screen:getAllDisplays', () => screen.getAllDisplays());
  ipcMain.handle('screen:getCursorScreenPoint', () => screen.getCursorScreenPoint());

  // Power monitor handlers
  ipcMain.handle('power:getState', () => powerMonitor.getSystemIdleState(0) === 'active' ? 'on-ac' : 'unknown');
  ipcMain.handle('power:getSystemIdleState', (_, idleThreshold) => powerMonitor.getSystemIdleState(idleThreshold));
  ipcMain.handle('power:getSystemIdleTime', () => powerMonitor.getSystemIdleTime());

  // Native theme handlers
  ipcMain.handle('nativeTheme:shouldUseDarkColors', () => nativeTheme.shouldUseDarkColors);
  ipcMain.handle('nativeTheme:getThemeSource', () => nativeTheme.themeSource);
  ipcMain.handle('nativeTheme:setThemeSource', (_, source) => { nativeTheme.themeSource = source; });
  nativeTheme.on('updated', () => {
    mainWindow.webContents.send('nativeTheme:updated', { shouldUseDarkColors: nativeTheme.shouldUseDarkColors });
  });

  // File system handlers
  ipcMain.handle('fs:readFile', async (_, path, options) => {
    return await fs.readFile(path, options);
  });
  ipcMain.handle('fs:writeFile', async (_, path, data, options) => {
    await fs.writeFile(path, data, options);
  });
  ipcMain.handle('fs:exists', async (_, path) => {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  });
  ipcMain.handle('fs:mkdir', async (_, path, options) => {
    await fs.mkdir(path, options);
  });
  ipcMain.handle('fs:readdir', async (_, path) => {
    return await fs.readdir(path);
  });
  ipcMain.handle('fs:stat', async (_, path) => {
    const stats = await fs.stat(path);
    return {
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      size: stats.size,
      mtime: stats.mtime,
      ctime: stats.ctime,
    };
  });

  // Global shortcut handlers
  const shortcutCallbacks = new Map();
  ipcMain.handle('globalShortcut:register', (_, accelerator) => {
    return globalShortcut.register(accelerator, () => {
      mainWindow.webContents.send('globalShortcut:triggered', accelerator);
    });
  });
  ipcMain.handle('globalShortcut:unregister', (_, accelerator) => {
    globalShortcut.unregister(accelerator);
  });
  ipcMain.handle('globalShortcut:unregisterAll', () => {
    globalShortcut.unregisterAll();
  });
  ipcMain.handle('globalShortcut:isRegistered', (_, accelerator) => {
    return globalShortcut.isRegistered(accelerator);
  });

  // Notification handlers
  ipcMain.handle('notification:show', (_, options) => {
    const notification = new Notification(options);
    notification.show();
  });
  ipcMain.handle('notification:isSupported', () => Notification.isSupported());

  // Network handlers
  ipcMain.handle('network:isOnline', () => require('electron').net.isOnline());
}

module.exports = { setupIpcHandlers };
`;

// ============================================================================
// EXPORTS
// ============================================================================

export {
  windowStateSignal,
  updateStatusSignal,
  updateInfoSignal,
  updateProgressSignal,
  powerStateSignal,
  onlineStatusSignal,
  primaryDisplaySignal,
  allDisplaysSignal,
};
