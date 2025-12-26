// @ts-nocheck
/**
 * PhilJS Native - Tauri Window Management
 *
 * Comprehensive window management utilities for Tauri applications
 * including multi-window support, positioning, and state management.
 */

import { signal, effect, batch, type Signal } from 'philjs-core';
import {
  isTauri,
  getTauriInternals,
  getCurrentWindow,
  createWindow,
  getAllWindows,
  type WindowOptions,
} from './index.js';
import { subscribe } from './events.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Window position
 */
export interface WindowPosition {
  x: number;
  y: number;
}

/**
 * Window size
 */
export interface WindowSize {
  width: number;
  height: number;
}

/**
 * Window state
 */
export interface WindowState {
  label: string;
  title: string;
  position: WindowPosition;
  size: WindowSize;
  isFullscreen: boolean;
  isMaximized: boolean;
  isMinimized: boolean;
  isFocused: boolean;
  isVisible: boolean;
  isDecorated: boolean;
  isResizable: boolean;
  isClosable: boolean;
  isMinimizable: boolean;
  isMaximizable: boolean;
  isAlwaysOnTop: boolean;
}

/**
 * Monitor info
 */
export interface Monitor {
  name: string;
  size: WindowSize;
  position: WindowPosition;
  scaleFactor: number;
}

/**
 * Window effect (Windows 10/11)
 */
export type WindowEffect = 'blur' | 'acrylic' | 'mica' | 'tabbed';

/**
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark' | 'system';

// ============================================================================
// Window State
// ============================================================================

/**
 * Current window state
 */
export const windowState: Signal<WindowState> = signal({
  label: 'main',
  title: '',
  position: { x: 0, y: 0 },
  size: { width: 800, height: 600 },
  isFullscreen: false,
  isMaximized: false,
  isMinimized: false,
  isFocused: true,
  isVisible: true,
  isDecorated: true,
  isResizable: true,
  isClosable: true,
  isMinimizable: true,
  isMaximizable: true,
  isAlwaysOnTop: false,
});

/**
 * All windows state
 */
export const allWindows: Signal<Map<string, WindowState>> = signal(new Map());

/**
 * Current theme
 */
export const currentTheme: Signal<ThemeMode> = signal('system');

/**
 * Primary monitor
 */
export const primaryMonitor: Signal<Monitor | null> = signal(null);

/**
 * All monitors
 */
export const allMonitors: Signal<Monitor[]> = signal([]);

// ============================================================================
// Window Manager
// ============================================================================

/**
 * Window manager class
 */
export class WindowManager {
  private win: any;
  private label: string;

  constructor(label?: string) {
    this.label = label || 'main';
    this.win = getCurrentWindow();
  }

  /**
   * Get window instance
   */
  getWindow(): any {
    return this.win;
  }

  /**
   * Get window label
   */
  getLabel(): string {
    return this.label;
  }

  // ================================
  // Position & Size
  // ================================

  async getPosition(): Promise<WindowPosition> {
    if (!isTauri() || !this.win) {
      return { x: window.screenX, y: window.screenY };
    }

    try {
      const pos = await this.win.outerPosition();
      return { x: pos.x, y: pos.y };
    } catch {
      return { x: 0, y: 0 };
    }
  }

  async setPosition(x: number, y: number): Promise<void> {
    if (!isTauri() || !this.win) {
      window.moveTo(x, y);
      return;
    }

    const internals = getTauriInternals();
    const LogicalPosition = internals?.window?.LogicalPosition;

    if (LogicalPosition) {
      await this.win.setPosition(new LogicalPosition(x, y));
    }

    batch(() => {
      const state = windowState();
      windowState.set({ ...state, position: { x, y } });
    });
  }

  async getSize(): Promise<WindowSize> {
    if (!isTauri() || !this.win) {
      return { width: window.innerWidth, height: window.innerHeight };
    }

    try {
      const size = await this.win.innerSize();
      return { width: size.width, height: size.height };
    } catch {
      return { width: 800, height: 600 };
    }
  }

  async setSize(width: number, height: number): Promise<void> {
    if (!isTauri() || !this.win) {
      window.resizeTo(width, height);
      return;
    }

    const internals = getTauriInternals();
    const LogicalSize = internals?.window?.LogicalSize;

    if (LogicalSize) {
      await this.win.setSize(new LogicalSize(width, height));
    }

    batch(() => {
      const state = windowState();
      windowState.set({ ...state, size: { width, height } });
    });
  }

  async setMinSize(width: number, height: number): Promise<void> {
    if (!isTauri() || !this.win) return;

    const internals = getTauriInternals();
    const LogicalSize = internals?.window?.LogicalSize;

    if (LogicalSize) {
      await this.win.setMinSize(new LogicalSize(width, height));
    }
  }

  async setMaxSize(width: number, height: number): Promise<void> {
    if (!isTauri() || !this.win) return;

    const internals = getTauriInternals();
    const LogicalSize = internals?.window?.LogicalSize;

    if (LogicalSize) {
      await this.win.setMaxSize(new LogicalSize(width, height));
    }
  }

  async center(): Promise<void> {
    if (!isTauri() || !this.win) {
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      const x = (screenWidth - window.innerWidth) / 2;
      const y = (screenHeight - window.innerHeight) / 2;
      window.moveTo(x, y);
      return;
    }

    await this.win.center();
  }

  // ================================
  // State Controls
  // ================================

  async minimize(): Promise<void> {
    if (!isTauri() || !this.win) return;
    await this.win.minimize();
    windowState.set({ ...windowState(), isMinimized: true });
  }

  async unminimize(): Promise<void> {
    if (!isTauri() || !this.win) return;
    await this.win.unminimize();
    windowState.set({ ...windowState(), isMinimized: false });
  }

  async maximize(): Promise<void> {
    if (!isTauri() || !this.win) return;
    await this.win.maximize();
    windowState.set({ ...windowState(), isMaximized: true });
  }

  async unmaximize(): Promise<void> {
    if (!isTauri() || !this.win) return;
    await this.win.unmaximize();
    windowState.set({ ...windowState(), isMaximized: false });
  }

  async toggleMaximize(): Promise<void> {
    if (!isTauri() || !this.win) return;
    await this.win.toggleMaximize();
    const state = windowState();
    windowState.set({ ...state, isMaximized: !state.isMaximized });
  }

  async setFullscreen(fullscreen: boolean): Promise<void> {
    if (!isTauri()) {
      if (fullscreen && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if (!fullscreen && document.exitFullscreen) {
        await document.exitFullscreen();
      }
      windowState.set({ ...windowState(), isFullscreen: fullscreen });
      return;
    }

    if (this.win) {
      await this.win.setFullscreen(fullscreen);
      windowState.set({ ...windowState(), isFullscreen: fullscreen });
    }
  }

  async toggleFullscreen(): Promise<void> {
    const state = windowState();
    await this.setFullscreen(!state.isFullscreen);
  }

  async show(): Promise<void> {
    if (!isTauri() || !this.win) return;
    await this.win.show();
    windowState.set({ ...windowState(), isVisible: true });
  }

  async hide(): Promise<void> {
    if (!isTauri() || !this.win) return;
    await this.win.hide();
    windowState.set({ ...windowState(), isVisible: false });
  }

  async focus(): Promise<void> {
    if (!isTauri()) {
      window.focus();
      return;
    }
    if (this.win) {
      await this.win.setFocus();
    }
  }

  async close(): Promise<void> {
    if (!isTauri()) {
      window.close();
      return;
    }
    if (this.win) {
      await this.win.close();
    }
  }

  // ================================
  // Appearance
  // ================================

  async setTitle(title: string): Promise<void> {
    if (!isTauri()) {
      document.title = title;
      return;
    }
    if (this.win) {
      await this.win.setTitle(title);
      windowState.set({ ...windowState(), title });
    }
  }

  async setDecorations(decorations: boolean): Promise<void> {
    if (!isTauri() || !this.win) return;
    await this.win.setDecorations(decorations);
    windowState.set({ ...windowState(), isDecorated: decorations });
  }

  async setAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
    if (!isTauri() || !this.win) return;
    await this.win.setAlwaysOnTop(alwaysOnTop);
    windowState.set({ ...windowState(), isAlwaysOnTop: alwaysOnTop });
  }

  async setResizable(resizable: boolean): Promise<void> {
    if (!isTauri() || !this.win) return;
    await this.win.setResizable(resizable);
    windowState.set({ ...windowState(), isResizable: resizable });
  }

  async setClosable(closable: boolean): Promise<void> {
    if (!isTauri() || !this.win) return;
    await this.win.setClosable(closable);
    windowState.set({ ...windowState(), isClosable: closable });
  }

  async setMinimizable(minimizable: boolean): Promise<void> {
    if (!isTauri() || !this.win) return;
    await this.win.setMinimizable(minimizable);
    windowState.set({ ...windowState(), isMinimizable: minimizable });
  }

  async setMaximizable(maximizable: boolean): Promise<void> {
    if (!isTauri() || !this.win) return;
    await this.win.setMaximizable(maximizable);
    windowState.set({ ...windowState(), isMaximizable: maximizable });
  }

  async setSkipTaskbar(skip: boolean): Promise<void> {
    if (!isTauri() || !this.win) return;
    await this.win.setSkipTaskbar(skip);
  }

  async setIgnoreCursorEvents(ignore: boolean): Promise<void> {
    if (!isTauri() || !this.win) return;
    await this.win.setIgnoreCursorEvents(ignore);
  }

  async setIcon(icon: string | Uint8Array): Promise<void> {
    if (!isTauri() || !this.win) return;
    await this.win.setIcon(icon);
  }

  // ================================
  // Effects (Windows)
  // ================================

  async setWindowEffect(effect: WindowEffect | null): Promise<void> {
    if (!isTauri() || !this.win) return;

    try {
      if (effect === null) {
        await this.win.clearEffects();
      } else {
        await this.win.setEffects({ effects: [effect] });
      }
    } catch {
      // Effects might not be supported
    }
  }

  // ================================
  // State Query
  // ================================

  async isMaximized(): Promise<boolean> {
    if (!isTauri() || !this.win) return false;
    return await this.win.isMaximized();
  }

  async isMinimized(): Promise<boolean> {
    if (!isTauri() || !this.win) return false;
    return await this.win.isMinimized();
  }

  async isFullscreen(): Promise<boolean> {
    if (!isTauri()) {
      return !!document.fullscreenElement;
    }
    if (this.win) {
      return await this.win.isFullscreen();
    }
    return false;
  }

  async isFocused(): Promise<boolean> {
    if (!isTauri()) {
      return document.hasFocus();
    }
    if (this.win) {
      return await this.win.isFocused();
    }
    return false;
  }

  async isVisible(): Promise<boolean> {
    if (!isTauri() || !this.win) return true;
    return await this.win.isVisible();
  }

  async getState(): Promise<WindowState> {
    const [position, size, isMaximized, isMinimized, isFullscreen, isFocused, isVisible] = await Promise.all([
      this.getPosition(),
      this.getSize(),
      this.isMaximized(),
      this.isMinimized(),
      this.isFullscreen(),
      this.isFocused(),
      this.isVisible(),
    ]);

    return {
      label: this.label,
      title: document.title,
      position,
      size,
      isMaximized,
      isMinimized,
      isFullscreen,
      isFocused,
      isVisible,
      isDecorated: true,
      isResizable: true,
      isClosable: true,
      isMinimizable: true,
      isMaximizable: true,
      isAlwaysOnTop: false,
    };
  }
}

// ============================================================================
// Multi-Window Support
// ============================================================================

/**
 * Create a new window
 */
export async function openWindow(
  label: string,
  options?: WindowOptions
): Promise<WindowManager> {
  await createWindow(label, options);
  return new WindowManager(label);
}

/**
 * Get all window managers
 */
export async function getWindows(): Promise<WindowManager[]> {
  const windows = await getAllWindows();
  return windows.map((win: any) => new WindowManager(win.label));
}

/**
 * Get window by label
 */
export function getWindowByLabel(label: string): WindowManager | null {
  if (!isTauri()) return null;

  const internals = getTauriInternals();
  const WebviewWindow = internals?.window?.WebviewWindow;

  if (WebviewWindow) {
    const win = WebviewWindow.getByLabel(label);
    if (win) {
      return new WindowManager(label);
    }
  }

  return null;
}

// ============================================================================
// Monitor Utilities
// ============================================================================

/**
 * Get primary monitor
 */
export async function getPrimaryMonitor(): Promise<Monitor | null> {
  if (!isTauri()) {
    return {
      name: 'Primary',
      size: { width: screen.width, height: screen.height },
      position: { x: 0, y: 0 },
      scaleFactor: window.devicePixelRatio,
    };
  }

  const internals = getTauriInternals();
  const monitor = await internals?.window?.primaryMonitor?.();

  if (monitor) {
    const result = {
      name: monitor.name || 'Primary',
      size: { width: monitor.size.width, height: monitor.size.height },
      position: { x: monitor.position.x, y: monitor.position.y },
      scaleFactor: monitor.scaleFactor,
    };
    primaryMonitor.set(result);
    return result;
  }

  return null;
}

/**
 * Get all monitors
 */
export async function getMonitors(): Promise<Monitor[]> {
  if (!isTauri()) {
    const primary = await getPrimaryMonitor();
    return primary ? [primary] : [];
  }

  const internals = getTauriInternals();
  const monitors = await internals?.window?.availableMonitors?.();

  if (monitors) {
    const result = monitors.map((m: any) => ({
      name: m.name || 'Monitor',
      size: { width: m.size.width, height: m.size.height },
      position: { x: m.position.x, y: m.position.y },
      scaleFactor: m.scaleFactor,
    }));
    allMonitors.set(result);
    return result;
  }

  return [];
}

/**
 * Get current monitor (where window is located)
 */
export async function getCurrentMonitor(): Promise<Monitor | null> {
  if (!isTauri()) {
    return getPrimaryMonitor();
  }

  const win = getCurrentWindow();
  const monitor = await win?.currentMonitor?.();

  if (monitor) {
    return {
      name: monitor.name || 'Current',
      size: { width: monitor.size.width, height: monitor.size.height },
      position: { x: monitor.position.x, y: monitor.position.y },
      scaleFactor: monitor.scaleFactor,
    };
  }

  return null;
}

// ============================================================================
// Theme Management
// ============================================================================

/**
 * Get system theme
 */
export async function getTheme(): Promise<ThemeMode> {
  if (!isTauri()) {
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  const internals = getTauriInternals();
  const theme = await internals?.window?.appWindow?.theme?.();
  return theme || 'system';
}

/**
 * Set window theme (if supported)
 */
export async function setTheme(theme: ThemeMode): Promise<void> {
  currentTheme.set(theme);

  if (!isTauri()) {
    // Apply theme via CSS
    document.documentElement.setAttribute('data-theme', theme);
    return;
  }

  // Tauri 2.0+ might support theme setting
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Main window manager instance
 */
export const mainWindow = new WindowManager('main');

/**
 * Hook to get window state
 */
export function useWindowState(): WindowState {
  return windowState();
}

/**
 * Hook to manage window
 */
export function useWindow(label?: string): WindowManager {
  return label ? new WindowManager(label) : mainWindow;
}

/**
 * Hook for window position
 */
export function useWindowPosition(): WindowPosition {
  return windowState().position;
}

/**
 * Hook for window size
 */
export function useWindowSize(): WindowSize {
  return windowState().size;
}

/**
 * Hook for theme
 */
export function useTheme(): ThemeMode {
  return currentTheme();
}

// ============================================================================
// Initialize Window Listeners
// ============================================================================

/**
 * Initialize window state tracking
 */
export async function initWindowState(): Promise<void> {
  if (!isTauri()) return;

  // Get initial state
  const state = await mainWindow.getState();
  windowState.set(state);

  // Subscribe to window events
  subscribe<WindowSize>('tauri://resize', (size) => {
    windowState.set({ ...windowState(), size });
  });

  subscribe<WindowPosition>('tauri://move', (position) => {
    windowState.set({ ...windowState(), position });
  });

  subscribe('tauri://focus', () => {
    windowState.set({ ...windowState(), isFocused: true });
  });

  subscribe('tauri://blur', () => {
    windowState.set({ ...windowState(), isFocused: false });
  });

  // Get monitor info
  await Promise.all([getPrimaryMonitor(), getMonitors()]);
}

// ============================================================================
// Exports
// ============================================================================

export default {
  WindowManager,
  mainWindow,
  openWindow,
  getWindows,
  getWindowByLabel,
  getPrimaryMonitor,
  getMonitors,
  getCurrentMonitor,
  getTheme,
  setTheme,
  initWindowState,
};
