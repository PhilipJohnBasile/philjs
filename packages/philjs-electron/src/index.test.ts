/**
 * Tests for PhilJS Electron Integration
 *
 * Comprehensive Electron integration with PhilJS signals for desktop applications.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  // Core hook
  useElectron,
  // Window management
  useWindow,
  useTitleBar,
  // Dialogs
  useDialog,
  // Menu
  useMenu,
  // Tray
  useTray,
  // Notification
  useNotification,
  // Auto-updater
  useAutoUpdater,
  // Power
  usePowerMonitor,
  // Screen
  useScreen,
  // Shell
  useShell,
  // Clipboard
  useClipboard,
  // Global shortcuts
  useGlobalShortcut,
  // Deep links
  useDeepLink,
  // App lifecycle
  useApp,
  // Dock (macOS)
  useDock,
  // Native theme
  useNativeTheme,
  // Network status
  useNetworkStatus,
  // File system
  useFileSystem,
  // Secure storage
  useSecureStorage,
  // State signals
  windowStateSignal,
  updateStatusSignal,
  updateInfoSignal,
  updateProgressSignal,
  powerStateSignal,
  onlineStatusSignal,
  primaryDisplaySignal,
  allDisplaysSignal,
  // Preload scripts
  preloadScript,
  mainProcessHandlers,
  // Types
  type IpcRenderer,
  type WindowState,
  type WindowBounds,
  type WindowOptions,
  type OpenDialogOptions,
  type SaveDialogOptions,
  type MessageBoxOptions,
  type FileFilter,
  type OpenDialogResult,
  type SaveDialogResult,
  type MessageBoxResult,
  type MenuItemOptions,
  type MenuRole,
  type TrayOptions,
  type NotificationOptions,
  type UpdateInfo,
  type ReleaseNoteInfo,
  type UpdateProgress,
  type UpdateStatus,
  type PowerState,
  type IdleState,
  type SystemIdleState,
  type Display,
  type ShellResult,
  type DeepLinkHandler,
} from './index';

describe('PhilJS Electron Integration', () => {
  describe('Type Definitions', () => {
    describe('IpcRenderer', () => {
      it('should define IPC renderer interface', () => {
        const ipc: IpcRenderer = {
          send: vi.fn(),
          on: vi.fn(),
          once: vi.fn(),
          removeListener: vi.fn(),
          removeAllListeners: vi.fn(),
          invoke: vi.fn(),
          sendSync: vi.fn(),
        };
        expect(typeof ipc.send).toBe('function');
        expect(typeof ipc.invoke).toBe('function');
      });
    });

    describe('WindowState', () => {
      it('should define window state structure', () => {
        const state: WindowState = {
          isMaximized: true,
          isMinimized: false,
          isFullscreen: false,
          isFocused: true,
          isVisible: true,
          isAlwaysOnTop: false,
          bounds: { x: 100, y: 100, width: 1200, height: 800 },
        };
        expect(state.isMaximized).toBe(true);
        expect(state.bounds.width).toBe(1200);
      });
    });

    describe('WindowBounds', () => {
      it('should define window bounds', () => {
        const bounds: WindowBounds = {
          x: 0,
          y: 0,
          width: 800,
          height: 600,
        };
        expect(bounds.width).toBe(800);
      });
    });

    describe('WindowOptions', () => {
      it('should define window options', () => {
        const options: WindowOptions = {
          width: 1200,
          height: 800,
          x: 100,
          y: 100,
          minWidth: 400,
          minHeight: 300,
          maxWidth: 1920,
          maxHeight: 1080,
          resizable: true,
          movable: true,
          minimizable: true,
          maximizable: true,
          closable: true,
          focusable: true,
          alwaysOnTop: false,
          fullscreenable: true,
          skipTaskbar: false,
          frame: true,
          transparent: false,
          vibrancy: 'titlebar',
          titleBarStyle: 'hiddenInset',
          backgroundColor: '#ffffff',
        };
        expect(options.width).toBe(1200);
        expect(options.titleBarStyle).toBe('hiddenInset');
      });

      it('should accept all vibrancy types', () => {
        const vibrancyTypes: WindowOptions['vibrancy'][] = [
          'appearance-based', 'light', 'dark', 'titlebar', 'selection',
          'menu', 'popover', 'sidebar', 'medium-light', 'ultra-dark',
        ];
        expect(vibrancyTypes.length).toBe(10);
      });

      it('should accept all title bar styles', () => {
        const titleBarStyles: WindowOptions['titleBarStyle'][] = [
          'default', 'hidden', 'hiddenInset', 'customButtonsOnHover',
        ];
        expect(titleBarStyles.length).toBe(4);
      });
    });

    describe('OpenDialogOptions', () => {
      it('should define open dialog options', () => {
        const options: OpenDialogOptions = {
          title: 'Open File',
          defaultPath: '/home/user',
          buttonLabel: 'Select',
          filters: [{ name: 'Images', extensions: ['jpg', 'png'] }],
          properties: ['openFile', 'multiSelections'],
          message: 'Select a file to open',
          securityScopedBookmarks: true,
        };
        expect(options.title).toBe('Open File');
        expect(options.properties).toContain('openFile');
      });

      it('should accept all property types', () => {
        const properties: OpenDialogOptions['properties'] = [
          'openFile', 'openDirectory', 'multiSelections', 'showHiddenFiles',
          'createDirectory', 'promptToCreate', 'noResolveAliases', 'treatPackageAsDirectory',
        ];
        expect(properties?.length).toBe(8);
      });
    });

    describe('SaveDialogOptions', () => {
      it('should define save dialog options', () => {
        const options: SaveDialogOptions = {
          title: 'Save File',
          defaultPath: '/home/user/document.txt',
          buttonLabel: 'Save',
          filters: [{ name: 'Text Files', extensions: ['txt'] }],
          message: 'Choose a location to save',
          nameFieldLabel: 'File Name:',
          showsTagField: false,
          properties: ['showOverwriteConfirmation'],
          securityScopedBookmarks: true,
        };
        expect(options.title).toBe('Save File');
      });
    });

    describe('MessageBoxOptions', () => {
      it('should define message box options', () => {
        const options: MessageBoxOptions = {
          type: 'question',
          buttons: ['Yes', 'No', 'Cancel'],
          defaultId: 0,
          title: 'Confirm',
          message: 'Are you sure?',
          detail: 'This action cannot be undone.',
          checkboxLabel: "Don't ask again",
          checkboxChecked: false,
          icon: '/path/to/icon.png',
          cancelId: 2,
          noLink: true,
        };
        expect(options.type).toBe('question');
        expect(options.buttons).toContain('Yes');
      });

      it('should accept all message box types', () => {
        const types: MessageBoxOptions['type'][] = ['none', 'info', 'error', 'question', 'warning'];
        expect(types.length).toBe(5);
      });
    });

    describe('FileFilter', () => {
      it('should define file filter', () => {
        const filter: FileFilter = {
          name: 'Documents',
          extensions: ['doc', 'docx', 'pdf'],
        };
        expect(filter.name).toBe('Documents');
        expect(filter.extensions).toContain('pdf');
      });
    });

    describe('OpenDialogResult', () => {
      it('should define open dialog result', () => {
        const result: OpenDialogResult = {
          canceled: false,
          filePaths: ['/home/user/file1.txt', '/home/user/file2.txt'],
          bookmarks: ['bookmark1', 'bookmark2'],
        };
        expect(result.canceled).toBe(false);
        expect(result.filePaths.length).toBe(2);
      });
    });

    describe('SaveDialogResult', () => {
      it('should define save dialog result', () => {
        const result: SaveDialogResult = {
          canceled: false,
          filePath: '/home/user/saved-file.txt',
          bookmark: 'bookmark-id',
        };
        expect(result.canceled).toBe(false);
        expect(result.filePath).toBeDefined();
      });
    });

    describe('MessageBoxResult', () => {
      it('should define message box result', () => {
        const result: MessageBoxResult = {
          response: 0,
          checkboxChecked: true,
        };
        expect(result.response).toBe(0);
        expect(result.checkboxChecked).toBe(true);
      });
    });

    describe('MenuItemOptions', () => {
      it('should define menu item options', () => {
        const menuItem: MenuItemOptions = {
          id: 'item-1',
          label: 'File',
          type: 'submenu',
          sublabel: 'Open files',
          toolTip: 'File operations',
          accelerator: 'CmdOrCtrl+O',
          icon: '/path/to/icon.png',
          enabled: true,
          visible: true,
          checked: false,
          click: () => {},
          role: 'fileMenu',
          submenu: [
            { id: 'open', label: 'Open', accelerator: 'CmdOrCtrl+O' },
            { type: 'separator' },
            { id: 'exit', label: 'Exit', role: 'quit' },
          ],
        };
        expect(menuItem.label).toBe('File');
        expect(menuItem.submenu?.length).toBe(3);
      });

      it('should accept all menu item types', () => {
        const types: MenuItemOptions['type'][] = ['normal', 'separator', 'submenu', 'checkbox', 'radio'];
        expect(types.length).toBe(5);
      });
    });

    describe('MenuRole', () => {
      it('should accept all menu roles', () => {
        const roles: MenuRole[] = [
          'undo', 'redo', 'cut', 'copy', 'paste', 'delete', 'selectAll',
          'reload', 'forceReload', 'toggleDevTools', 'resetZoom', 'zoomIn', 'zoomOut',
          'togglefullscreen', 'window', 'minimize', 'close', 'help', 'about',
          'quit', 'appMenu', 'fileMenu', 'editMenu', 'viewMenu', 'windowMenu',
        ];
        expect(roles.length).toBeGreaterThan(20);
      });
    });

    describe('TrayOptions', () => {
      it('should define tray options', () => {
        const options: TrayOptions = {
          icon: '/path/to/tray-icon.png',
          title: 'My App',
          tooltip: 'Click to open',
          menu: [
            { label: 'Show', click: () => {} },
            { type: 'separator' },
            { label: 'Quit', role: 'quit' },
          ],
        };
        expect(options.icon).toBeDefined();
        expect(options.menu?.length).toBe(3);
      });
    });

    describe('NotificationOptions', () => {
      it('should define notification options', () => {
        const options: NotificationOptions = {
          title: 'New Message',
          body: 'You have a new message from John',
          subtitle: 'Messages',
          icon: '/path/to/icon.png',
          silent: false,
          sound: 'default',
          hasReply: true,
          urgency: 'normal',
          timeoutType: 'default',
          replyPlaceholder: 'Type a reply...',
          actions: [{ type: 'button', text: 'Reply' }],
          closeButtonText: 'Dismiss',
        };
        expect(options.title).toBe('New Message');
        expect(options.hasReply).toBe(true);
      });

      it('should accept all urgency levels', () => {
        const levels: NotificationOptions['urgency'][] = ['normal', 'critical', 'low'];
        expect(levels.length).toBe(3);
      });
    });

    describe('UpdateInfo', () => {
      it('should define update info', () => {
        const info: UpdateInfo = {
          version: '2.0.0',
          files: [{ url: 'https://example.com/app.dmg', sha512: 'abc123', size: 50000000 }],
          path: '/path/to/update',
          sha512: 'abc123def456',
          releaseDate: '2024-01-01T00:00:00Z',
          releaseName: 'Version 2.0',
          releaseNotes: 'Bug fixes and improvements',
        };
        expect(info.version).toBe('2.0.0');
      });

      it('should accept release notes as array', () => {
        const info: UpdateInfo = {
          version: '2.0.0',
          files: [],
          path: '',
          sha512: '',
          releaseDate: '',
          releaseNotes: [
            { version: '2.0.0', note: 'New features' },
            { version: '1.9.0', note: 'Bug fixes' },
          ],
        };
        expect(Array.isArray(info.releaseNotes)).toBe(true);
      });
    });

    describe('ReleaseNoteInfo', () => {
      it('should define release note info', () => {
        const note: ReleaseNoteInfo = {
          version: '1.5.0',
          note: 'Added dark mode support',
        };
        expect(note.version).toBe('1.5.0');
      });
    });

    describe('UpdateProgress', () => {
      it('should define update progress', () => {
        const progress: UpdateProgress = {
          bytesPerSecond: 1000000,
          percent: 45.5,
          transferred: 22500000,
          total: 50000000,
        };
        expect(progress.percent).toBe(45.5);
      });
    });

    describe('UpdateStatus', () => {
      it('should accept all status values', () => {
        const statuses: UpdateStatus[] = [
          'checking', 'available', 'not-available', 'downloading', 'downloaded', 'error',
        ];
        expect(statuses.length).toBe(6);
      });
    });

    describe('PowerState', () => {
      it('should accept all power states', () => {
        const states: PowerState[] = ['on-ac', 'on-battery', 'unknown'];
        expect(states.length).toBe(3);
      });
    });

    describe('IdleState', () => {
      it('should accept all idle states', () => {
        const states: IdleState[] = ['active', 'idle', 'locked', 'unknown'];
        expect(states.length).toBe(4);
      });
    });

    describe('SystemIdleState', () => {
      it('should accept all system idle states', () => {
        const states: SystemIdleState[] = ['active', 'idle', 'locked', 'unknown'];
        expect(states.length).toBe(4);
      });
    });

    describe('Display', () => {
      it('should define display structure', () => {
        const display: Display = {
          id: 1,
          label: 'Main Display',
          bounds: { x: 0, y: 0, width: 1920, height: 1080 },
          workArea: { x: 0, y: 25, width: 1920, height: 1055 },
          scaleFactor: 2,
          rotation: 0,
          internal: true,
          monochrome: false,
          accelerometerSupport: 'available',
          colorSpace: 'srgb',
          colorDepth: 24,
          depthPerComponent: 8,
          displayFrequency: 60,
          size: { width: 1920, height: 1080 },
        };
        expect(display.id).toBe(1);
        expect(display.scaleFactor).toBe(2);
      });
    });

    describe('ShellResult', () => {
      it('should define shell result', () => {
        const result: ShellResult = {
          exitCode: 0,
          stdout: 'Command output',
          stderr: '',
        };
        expect(result.exitCode).toBe(0);
      });
    });

    describe('DeepLinkHandler', () => {
      it('should define deep link handler interface', () => {
        const handler: DeepLinkHandler = {
          register: async () => true,
          unregister: async () => true,
          isRegistered: async () => true,
          onOpen: () => {},
        };
        expect(typeof handler.register).toBe('function');
        expect(typeof handler.onOpen).toBe('function');
      });
    });
  });

  describe('State Signals', () => {
    describe('windowStateSignal', () => {
      it('should have initial window state', () => {
        expect(windowStateSignal).toBeDefined();
        const state = windowStateSignal.get();
        expect(state.isMaximized).toBe(false);
        expect(state.isMinimized).toBe(false);
        expect(state.bounds).toBeDefined();
      });
    });

    describe('updateStatusSignal', () => {
      it('should have initial update status', () => {
        expect(updateStatusSignal).toBeDefined();
        expect(updateStatusSignal.get()).toBe('checking');
      });
    });

    describe('updateInfoSignal', () => {
      it('should have initial update info', () => {
        expect(updateInfoSignal).toBeDefined();
        expect(updateInfoSignal.get()).toBeNull();
      });
    });

    describe('updateProgressSignal', () => {
      it('should have initial update progress', () => {
        expect(updateProgressSignal).toBeDefined();
        expect(updateProgressSignal.get()).toBeNull();
      });
    });

    describe('powerStateSignal', () => {
      it('should have initial power state', () => {
        expect(powerStateSignal).toBeDefined();
        expect(powerStateSignal.get()).toBe('unknown');
      });
    });

    describe('onlineStatusSignal', () => {
      it('should have initial online status', () => {
        expect(onlineStatusSignal).toBeDefined();
        expect(onlineStatusSignal.get()).toBe(true);
      });
    });

    describe('primaryDisplaySignal', () => {
      it('should have initial primary display', () => {
        expect(primaryDisplaySignal).toBeDefined();
        expect(primaryDisplaySignal.get()).toBeNull();
      });
    });

    describe('allDisplaysSignal', () => {
      it('should have initial displays array', () => {
        expect(allDisplaysSignal).toBeDefined();
        expect(Array.isArray(allDisplaysSignal.get())).toBe(true);
        expect(allDisplaysSignal.get()).toEqual([]);
      });
    });
  });

  describe('Core Electron Hook', () => {
    describe('useElectron', () => {
      it('should return electron utilities', () => {
        const electron = useElectron();
        expect(electron.isElectron).toBeDefined();
        expect(typeof electron.send).toBe('function');
        expect(typeof electron.on).toBe('function');
        expect(typeof electron.once).toBe('function');
        expect(typeof electron.invoke).toBe('function');
        expect(typeof electron.removeAllListeners).toBe('function');
      });

      it('should detect non-electron environment', () => {
        const electron = useElectron();
        expect(electron.isElectron).toBe(false);
        expect(electron.ipc).toBeNull();
        expect(electron.platform).toBeNull();
        expect(electron.versions).toBeNull();
      });
    });
  });

  describe('Window Management', () => {
    describe('useWindow', () => {
      it('should return window management methods', () => {
        const window = useWindow();
        expect(window.state).toBeDefined();
        expect(window.isMaximized).toBeDefined();
        expect(window.isMinimized).toBeDefined();
        expect(window.isFullscreen).toBeDefined();
        expect(window.isFocused).toBeDefined();
        expect(window.bounds).toBeDefined();
        expect(typeof window.minimize).toBe('function');
        expect(typeof window.maximize).toBe('function');
        expect(typeof window.unmaximize).toBe('function');
        expect(typeof window.toggleMaximize).toBe('function');
        expect(typeof window.close).toBe('function');
        expect(typeof window.restore).toBe('function');
        expect(typeof window.setFullscreen).toBe('function');
        expect(typeof window.toggleFullscreen).toBe('function');
        expect(typeof window.setAlwaysOnTop).toBe('function');
        expect(typeof window.setBounds).toBe('function');
        expect(typeof window.setMinimumSize).toBe('function');
        expect(typeof window.setMaximumSize).toBe('function');
        expect(typeof window.setTitle).toBe('function');
        expect(typeof window.setProgressBar).toBe('function');
        expect(typeof window.flashFrame).toBe('function');
        expect(typeof window.focus).toBe('function');
        expect(typeof window.blur).toBe('function');
        expect(typeof window.show).toBe('function');
        expect(typeof window.hide).toBe('function');
        expect(typeof window.setOpacity).toBe('function');
        expect(typeof window.setBackgroundColor).toBe('function');
        expect(typeof window.setVibrancy).toBe('function');
      });
    });

    describe('useTitleBar', () => {
      it('should return title bar utilities', () => {
        const titleBar = useTitleBar();
        expect(typeof titleBar.draggable).toBe('function');
        expect(typeof titleBar.nonDraggable).toBe('function');
      });
    });
  });

  describe('Dialogs', () => {
    describe('useDialog', () => {
      it('should return dialog methods', () => {
        const dialog = useDialog();
        expect(typeof dialog.showOpenDialog).toBe('function');
        expect(typeof dialog.showSaveDialog).toBe('function');
        expect(typeof dialog.showMessageBox).toBe('function');
        expect(typeof dialog.showErrorBox).toBe('function');
      });
    });
  });

  describe('Menu', () => {
    describe('useMenu', () => {
      it('should return menu methods', () => {
        const menu = useMenu();
        expect(typeof menu.setApplicationMenu).toBe('function');
        expect(typeof menu.showContextMenu).toBe('function');
        expect(typeof menu.popup).toBe('function');
      });
    });
  });

  describe('Tray', () => {
    describe('useTray', () => {
      it('should return tray methods', () => {
        const tray = useTray();
        expect(typeof tray.create).toBe('function');
        expect(typeof tray.destroy).toBe('function');
        expect(typeof tray.setImage).toBe('function');
        expect(typeof tray.setTitle).toBe('function');
        expect(typeof tray.setTooltip).toBe('function');
        expect(typeof tray.setContextMenu).toBe('function');
        expect(typeof tray.displayBalloon).toBe('function');
      });
    });
  });

  describe('Notification', () => {
    describe('useNotification', () => {
      it('should return notification methods', () => {
        const notification = useNotification();
        expect(typeof notification.show).toBe('function');
        expect(typeof notification.isSupported).toBe('function');
      });
    });
  });

  describe('Auto-Updater', () => {
    describe('useAutoUpdater', () => {
      it('should return auto-updater state and methods', () => {
        const updater = useAutoUpdater();
        expect(updater.status).toBeDefined();
        expect(updater.info).toBeDefined();
        expect(updater.progress).toBeDefined();
        expect(typeof updater.checkForUpdates).toBe('function');
        expect(typeof updater.downloadUpdate).toBe('function');
        expect(typeof updater.quitAndInstall).toBe('function');
        expect(typeof updater.setAutoDownload).toBe('function');
        expect(typeof updater.setAutoInstallOnAppQuit).toBe('function');
      });
    });
  });

  describe('Power Monitor', () => {
    describe('usePowerMonitor', () => {
      it('should return power monitor state and methods', () => {
        const power = usePowerMonitor();
        expect(power.powerState).toBeDefined();
        expect(power.isOnBattery).toBeDefined();
        expect(typeof power.getSystemIdleState).toBe('function');
        expect(typeof power.getSystemIdleTime).toBe('function');
      });
    });
  });

  describe('Screen', () => {
    describe('useScreen', () => {
      it('should return screen state and methods', () => {
        const screen = useScreen();
        expect(screen.primaryDisplay).toBeDefined();
        expect(screen.allDisplays).toBeDefined();
        expect(typeof screen.getCursorScreenPoint).toBe('function');
        expect(typeof screen.getDisplayMatching).toBe('function');
        expect(typeof screen.getDisplayNearestPoint).toBe('function');
      });
    });
  });

  describe('Shell', () => {
    describe('useShell', () => {
      it('should return shell methods', () => {
        const shell = useShell();
        expect(typeof shell.openExternal).toBe('function');
        expect(typeof shell.openPath).toBe('function');
        expect(typeof shell.showItemInFolder).toBe('function');
        expect(typeof shell.moveItemToTrash).toBe('function');
        expect(typeof shell.beep).toBe('function');
        expect(typeof shell.readShortcutLink).toBe('function');
      });
    });
  });

  describe('Clipboard', () => {
    describe('useClipboard', () => {
      it('should return clipboard methods', () => {
        const clipboard = useClipboard();
        expect(typeof clipboard.readText).toBe('function');
        expect(typeof clipboard.writeText).toBe('function');
        expect(typeof clipboard.readHTML).toBe('function');
        expect(typeof clipboard.writeHTML).toBe('function');
        expect(typeof clipboard.readImage).toBe('function');
        expect(typeof clipboard.writeImage).toBe('function');
        expect(typeof clipboard.readRTF).toBe('function');
        expect(typeof clipboard.writeRTF).toBe('function');
        expect(typeof clipboard.clear).toBe('function');
        expect(typeof clipboard.availableFormats).toBe('function');
        expect(typeof clipboard.has).toBe('function');
      });
    });
  });

  describe('Global Shortcuts', () => {
    describe('useGlobalShortcut', () => {
      it('should return global shortcut methods', () => {
        const shortcuts = useGlobalShortcut();
        expect(typeof shortcuts.register).toBe('function');
        expect(typeof shortcuts.unregister).toBe('function');
        expect(typeof shortcuts.unregisterAll).toBe('function');
        expect(typeof shortcuts.isRegistered).toBe('function');
      });
    });
  });

  describe('Deep Links', () => {
    describe('useDeepLink', () => {
      it('should return deep link methods', () => {
        const deepLink = useDeepLink();
        expect(typeof deepLink.register).toBe('function');
        expect(typeof deepLink.unregister).toBe('function');
        expect(typeof deepLink.isRegistered).toBe('function');
        expect(typeof deepLink.onOpen).toBe('function');
        expect(typeof deepLink.getInitialUrl).toBe('function');
      });
    });
  });

  describe('App Lifecycle', () => {
    describe('useApp', () => {
      it('should return app lifecycle methods', () => {
        const app = useApp();
        expect(typeof app.quit).toBe('function');
        expect(typeof app.exit).toBe('function');
        expect(typeof app.relaunch).toBe('function');
        expect(typeof app.isReady).toBe('function');
        expect(typeof app.focus).toBe('function');
        expect(typeof app.hide).toBe('function');
        expect(typeof app.show).toBe('function');
        expect(typeof app.getPath).toBe('function');
        expect(typeof app.getVersion).toBe('function');
        expect(typeof app.getName).toBe('function');
        expect(typeof app.getLocale).toBe('function');
        expect(typeof app.getSystemLocale).toBe('function');
        expect(typeof app.setBadgeCount).toBe('function');
        expect(typeof app.getBadgeCount).toBe('function');
        expect(typeof app.isDefaultProtocolClient).toBe('function');
        expect(typeof app.setAsDefaultProtocolClient).toBe('function');
        expect(typeof app.removeAsDefaultProtocolClient).toBe('function');
      });
    });
  });

  describe('macOS Dock', () => {
    describe('useDock', () => {
      it('should return dock methods', () => {
        const dock = useDock();
        expect(typeof dock.bounce).toBe('function');
        expect(typeof dock.cancelBounce).toBe('function');
        expect(typeof dock.setBadge).toBe('function');
        expect(typeof dock.getBadge).toBe('function');
        expect(typeof dock.hide).toBe('function');
        expect(typeof dock.show).toBe('function');
        expect(typeof dock.isVisible).toBe('function');
        expect(typeof dock.setIcon).toBe('function');
        expect(typeof dock.setMenu).toBe('function');
      });
    });
  });

  describe('Native Theme', () => {
    describe('useNativeTheme', () => {
      it('should return native theme state and methods', () => {
        const theme = useNativeTheme();
        expect(theme.shouldUseDarkColors).toBeDefined();
        expect(theme.themeSource).toBeDefined();
        expect(typeof theme.setThemeSource).toBe('function');
      });
    });
  });

  describe('Network Status', () => {
    describe('useNetworkStatus', () => {
      it('should return network status signal', () => {
        const status = useNetworkStatus();
        expect(status).toBeDefined();
        expect(typeof status.get).toBe('function');
      });
    });
  });

  describe('File System', () => {
    describe('useFileSystem', () => {
      it('should return file system methods', () => {
        const fs = useFileSystem();
        expect(typeof fs.readFile).toBe('function');
        expect(typeof fs.writeFile).toBe('function');
        expect(typeof fs.appendFile).toBe('function');
        expect(typeof fs.deleteFile).toBe('function');
        expect(typeof fs.exists).toBe('function');
        expect(typeof fs.mkdir).toBe('function');
        expect(typeof fs.rmdir).toBe('function');
        expect(typeof fs.readdir).toBe('function');
        expect(typeof fs.stat).toBe('function');
        expect(typeof fs.copy).toBe('function');
        expect(typeof fs.move).toBe('function');
      });
    });
  });

  describe('Secure Storage', () => {
    describe('useSecureStorage', () => {
      it('should return secure storage methods', () => {
        const storage = useSecureStorage();
        expect(typeof storage.getPassword).toBe('function');
        expect(typeof storage.setPassword).toBe('function');
        expect(typeof storage.deletePassword).toBe('function');
        expect(typeof storage.findCredentials).toBe('function');
        expect(typeof storage.findPassword).toBe('function');
      });
    });
  });

  describe('Preload Scripts', () => {
    describe('preloadScript', () => {
      it('should contain preload script template', () => {
        expect(preloadScript).toBeDefined();
        expect(typeof preloadScript).toBe('string');
        expect(preloadScript).toContain('contextBridge');
        expect(preloadScript).toContain('ipcRenderer');
        expect(preloadScript).toContain('exposeInMainWorld');
      });
    });

    describe('mainProcessHandlers', () => {
      it('should contain main process handler template', () => {
        expect(mainProcessHandlers).toBeDefined();
        expect(typeof mainProcessHandlers).toBe('string');
        expect(mainProcessHandlers).toContain('ipcMain');
        expect(mainProcessHandlers).toContain('BrowserWindow');
        expect(mainProcessHandlers).toContain('setupIpcHandlers');
      });

      it('should include window handlers', () => {
        expect(mainProcessHandlers).toContain("ipcMain.handle('window:minimize'");
        expect(mainProcessHandlers).toContain("ipcMain.handle('window:maximize'");
        expect(mainProcessHandlers).toContain("ipcMain.handle('window:close'");
      });

      it('should include dialog handlers', () => {
        expect(mainProcessHandlers).toContain("ipcMain.handle('dialog:showOpenDialog'");
        expect(mainProcessHandlers).toContain("ipcMain.handle('dialog:showSaveDialog'");
        expect(mainProcessHandlers).toContain("ipcMain.handle('dialog:showMessageBox'");
      });

      it('should include clipboard handlers', () => {
        expect(mainProcessHandlers).toContain("ipcMain.handle('clipboard:readText'");
        expect(mainProcessHandlers).toContain("ipcMain.handle('clipboard:writeText'");
      });

      it('should include app handlers', () => {
        expect(mainProcessHandlers).toContain("ipcMain.handle('app:quit'");
        expect(mainProcessHandlers).toContain("ipcMain.handle('app:getPath'");
        expect(mainProcessHandlers).toContain("ipcMain.handle('app:getVersion'");
      });

      it('should include file system handlers', () => {
        expect(mainProcessHandlers).toContain("ipcMain.handle('fs:readFile'");
        expect(mainProcessHandlers).toContain("ipcMain.handle('fs:writeFile'");
        expect(mainProcessHandlers).toContain("ipcMain.handle('fs:exists'");
      });
    });
  });
});
