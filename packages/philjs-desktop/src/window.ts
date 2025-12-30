/**
 * Window Management for PhilJS Desktop
 */

import { isTauri } from './tauri/context.js';
import { listen, emit, TauriEvents } from './tauri/events.js';
import type { UnlistenFn, Event } from './tauri/types.js';

// Window types
export interface WindowOptions {
  /** Window label (unique identifier) */
  label?: string;
  /** Window title */
  title?: string;
  /** Window width */
  width?: number;
  /** Window height */
  height?: number;
  /** Minimum width */
  minWidth?: number;
  /** Minimum height */
  minHeight?: number;
  /** Maximum width */
  maxWidth?: number;
  /** Maximum height */
  maxHeight?: number;
  /** X position */
  x?: number;
  /** Y position */
  y?: number;
  /** Center window on screen */
  center?: boolean;
  /** Resizable */
  resizable?: boolean;
  /** Decorations (title bar, etc.) */
  decorations?: boolean;
  /** Always on top */
  alwaysOnTop?: boolean;
  /** Fullscreen */
  fullscreen?: boolean;
  /** Visible on creation */
  visible?: boolean;
  /** Focus on creation */
  focus?: boolean;
  /** Transparent */
  transparent?: boolean;
  /** URL to load */
  url?: string;
  /** Parent window label */
  parent?: string;
  /** Skip taskbar */
  skipTaskbar?: boolean;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface WindowPosition {
  x: number;
  y: number;
}

export interface PhysicalSize {
  width: number;
  height: number;
}

export interface PhysicalPosition {
  x: number;
  y: number;
}

export interface Monitor {
  name: string | null;
  size: PhysicalSize;
  position: PhysicalPosition;
  scaleFactor: number;
}

export interface WindowState {
  label: string;
  title: string;
  isVisible: boolean;
  isFullscreen: boolean;
  isMaximized: boolean;
  isMinimized: boolean;
  isFocused: boolean;
  isDecorated: boolean;
  isResizable: boolean;
  isAlwaysOnTop: boolean;
  size: WindowSize;
  position: WindowPosition;
}

// Window manager state
const windowInstances = new Map<string, WindowHandle>();
let currentWindowLabel: string | null = null;

/**
 * Window handle class
 */
export class WindowHandle {
  private label: string;
  private tauriWindow: any = null;

  constructor(label: string, tauriWindow?: any) {
    this.label = label;
    this.tauriWindow = tauriWindow;
  }

  getLabel(): string {
    return this.label;
  }

  async close(): Promise<void> {
    if (!isTauri()) return;
    await this.tauriWindow?.close();
    windowInstances.delete(this.label);
  }

  async destroy(): Promise<void> {
    if (!isTauri()) return;
    await this.tauriWindow?.destroy();
    windowInstances.delete(this.label);
  }

  async minimize(): Promise<void> {
    if (!isTauri()) return;
    await this.tauriWindow?.minimize();
  }

  async maximize(): Promise<void> {
    if (!isTauri()) return;
    await this.tauriWindow?.maximize();
  }

  async unmaximize(): Promise<void> {
    if (!isTauri()) return;
    await this.tauriWindow?.unmaximize();
  }

  async toggleMaximize(): Promise<void> {
    if (!isTauri()) return;
    await this.tauriWindow?.toggleMaximize();
  }

  async show(): Promise<void> {
    if (!isTauri()) return;
    await this.tauriWindow?.show();
  }

  async hide(): Promise<void> {
    if (!isTauri()) return;
    await this.tauriWindow?.hide();
  }

  async setTitle(title: string): Promise<void> {
    if (!isTauri()) {
      document.title = title;
      return;
    }
    await this.tauriWindow?.setTitle(title);
  }

  async setSize(width: number, height: number): Promise<void> {
    if (!isTauri()) return;
    const { LogicalSize } = await import('@tauri-apps/api/dpi');
    await this.tauriWindow?.setSize(new LogicalSize(width, height));
  }

  async setMinSize(width: number, height: number): Promise<void> {
    if (!isTauri()) return;
    const { LogicalSize } = await import('@tauri-apps/api/dpi');
    await this.tauriWindow?.setMinSize(new LogicalSize(width, height));
  }

  async setMaxSize(width: number, height: number): Promise<void> {
    if (!isTauri()) return;
    const { LogicalSize } = await import('@tauri-apps/api/dpi');
    await this.tauriWindow?.setMaxSize(new LogicalSize(width, height));
  }

  async setPosition(x: number, y: number): Promise<void> {
    if (!isTauri()) return;
    const { LogicalPosition } = await import('@tauri-apps/api/dpi');
    await this.tauriWindow?.setPosition(new LogicalPosition(x, y));
  }

  async center(): Promise<void> {
    if (!isTauri()) return;
    await this.tauriWindow?.center();
  }

  async setFullscreen(enabled: boolean): Promise<void> {
    if (!isTauri()) {
      if (enabled) {
        document.documentElement.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
      return;
    }
    await this.tauriWindow?.setFullscreen(enabled);
  }

  async setAlwaysOnTop(enabled: boolean): Promise<void> {
    if (!isTauri()) return;
    await this.tauriWindow?.setAlwaysOnTop(enabled);
  }

  async setResizable(enabled: boolean): Promise<void> {
    if (!isTauri()) return;
    await this.tauriWindow?.setResizable(enabled);
  }

  async setDecorations(enabled: boolean): Promise<void> {
    if (!isTauri()) return;
    await this.tauriWindow?.setDecorations(enabled);
  }

  async setFocus(): Promise<void> {
    if (!isTauri()) {
      window.focus();
      return;
    }
    await this.tauriWindow?.setFocus();
  }

  async setSkipTaskbar(skip: boolean): Promise<void> {
    if (!isTauri()) return;
    await this.tauriWindow?.setSkipTaskbar(skip);
  }

  async requestUserAttention(type: 'critical' | 'informational' | null): Promise<void> {
    if (!isTauri()) return;
    const { UserAttentionType } = await import('@tauri-apps/api/window');
    const attentionType = type === 'critical'
      ? UserAttentionType.Critical
      : type === 'informational'
        ? UserAttentionType.Informational
        : null;
    await this.tauriWindow?.requestUserAttention(attentionType);
  }

  async getSize(): Promise<WindowSize> {
    if (!isTauri()) {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    const size = await this.tauriWindow?.innerSize();
    return { width: size?.width || 0, height: size?.height || 0 };
  }

  async getPosition(): Promise<WindowPosition> {
    if (!isTauri()) {
      return { x: window.screenX, y: window.screenY };
    }
    const pos = await this.tauriWindow?.outerPosition();
    return { x: pos?.x || 0, y: pos?.y || 0 };
  }

  async isVisible(): Promise<boolean> {
    if (!isTauri()) return document.visibilityState === 'visible';
    return this.tauriWindow?.isVisible() ?? true;
  }

  async isMaximized(): Promise<boolean> {
    if (!isTauri()) return false;
    return this.tauriWindow?.isMaximized() ?? false;
  }

  async isMinimized(): Promise<boolean> {
    if (!isTauri()) return false;
    return this.tauriWindow?.isMinimized() ?? false;
  }

  async isFullscreen(): Promise<boolean> {
    if (!isTauri()) return !!document.fullscreenElement;
    return this.tauriWindow?.isFullscreen() ?? false;
  }

  async isFocused(): Promise<boolean> {
    if (!isTauri()) return document.hasFocus();
    return this.tauriWindow?.isFocused() ?? false;
  }

  async getState(): Promise<WindowState> {
    const [size, position, isVisible, isMaximized, isMinimized, isFullscreen, isFocused] =
      await Promise.all([
        this.getSize(),
        this.getPosition(),
        this.isVisible(),
        this.isMaximized(),
        this.isMinimized(),
        this.isFullscreen(),
        this.isFocused(),
      ]);

    return {
      label: this.label,
      title: document.title,
      isVisible,
      isMaximized,
      isMinimized,
      isFullscreen,
      isFocused,
      isDecorated: true,
      isResizable: true,
      isAlwaysOnTop: false,
      size,
      position,
    };
  }

  async onResize(callback: (size: WindowSize) => void): Promise<UnlistenFn> {
    return listen(TauriEvents.WINDOW_RESIZED, (e: Event<WindowSize>) => {
      callback(e.payload as WindowSize);
    });
  }

  async onMove(callback: (position: WindowPosition) => void): Promise<UnlistenFn> {
    return listen(TauriEvents.WINDOW_MOVED, (e: Event<WindowPosition>) => {
      callback(e.payload as WindowPosition);
    });
  }

  async onFocus(callback: () => void): Promise<UnlistenFn> {
    return listen(TauriEvents.WINDOW_FOCUS, callback);
  }

  async onBlur(callback: () => void): Promise<UnlistenFn> {
    return listen(TauriEvents.WINDOW_BLUR, callback);
  }

  async onCloseRequested(callback: () => void): Promise<UnlistenFn> {
    return listen(TauriEvents.WINDOW_CLOSE_REQUESTED, callback);
  }

  async startDragging(): Promise<void> {
    if (!isTauri()) return;
    await this.tauriWindow?.startDragging();
  }
}

/**
 * Create a new window
 */
export async function createWindow(options: WindowOptions = {}): Promise<WindowHandle> {
  const label = options.label || `window-${Date.now()}`;

  if (windowInstances.has(label)) {
    throw new Error(`Window with label "${label}" already exists`);
  }

  if (!isTauri()) {
    // In browser, create a new popup window
    const features = [
      `width=${options.width || 800}`,
      `height=${options.height || 600}`,
      options.x !== undefined ? `left=${options.x}` : '',
      options.y !== undefined ? `top=${options.y}` : '',
      `resizable=${options.resizable !== false ? 'yes' : 'no'}`,
    ].filter(Boolean).join(',');

    const popup = window.open(options.url || '', label, features);
    if (popup && options.title) {
      popup.document.title = options.title;
    }

    const handle = new WindowHandle(label);
    windowInstances.set(label, handle);
    return handle;
  }

  const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');

  const webview = new WebviewWindow(label, {
    title: options.title,
    width: options.width,
    height: options.height,
    minWidth: options.minWidth,
    minHeight: options.minHeight,
    maxWidth: options.maxWidth,
    maxHeight: options.maxHeight,
    x: options.x,
    y: options.y,
    center: options.center,
    resizable: options.resizable,
    decorations: options.decorations,
    alwaysOnTop: options.alwaysOnTop,
    fullscreen: options.fullscreen,
    visible: options.visible,
    focus: options.focus,
    transparent: options.transparent,
    url: options.url,
    parent: options.parent,
    skipTaskbar: options.skipTaskbar,
  });

  // Wait for window to be created
  await new Promise<void>((resolve, reject) => {
    webview.once('tauri://created', () => resolve());
    webview.once('tauri://error', (e: any) => reject(e));
  });

  const handle = new WindowHandle(label, webview);
  windowInstances.set(label, handle);

  return handle;
}

/**
 * Get the current window
 */
export async function getCurrentWindow(): Promise<WindowHandle> {
  if (!isTauri()) {
    const label = 'main';
    if (!windowInstances.has(label)) {
      windowInstances.set(label, new WindowHandle(label));
    }
    return windowInstances.get(label)!;
  }

  const { getCurrentWindow: getTauriWindow } = await import('@tauri-apps/api/window');
  const tauriWindow = getTauriWindow();
  const label = tauriWindow.label;

  if (!windowInstances.has(label)) {
    windowInstances.set(label, new WindowHandle(label, tauriWindow));
  }

  currentWindowLabel = label;
  return windowInstances.get(label)!;
}

/**
 * Hook to get the current window
 */
export function useWindow(): WindowHandle {
  // This would integrate with reactive system
  // For now, return a placeholder that lazy-loads
  const label = currentWindowLabel || 'main';
  if (!windowInstances.has(label)) {
    windowInstances.set(label, new WindowHandle(label));
  }
  return windowInstances.get(label)!;
}

/**
 * Get all windows
 */
export async function getAllWindows(): Promise<WindowHandle[]> {
  if (!isTauri()) {
    return Array.from(windowInstances.values());
  }

  const { getAllWindows: getTauriWindows } = await import('@tauri-apps/api/window');
  const tauriWindows = await getTauriWindows();

  for (const tw of tauriWindows) {
    if (!windowInstances.has(tw.label)) {
      windowInstances.set(tw.label, new WindowHandle(tw.label, tw));
    }
  }

  return Array.from(windowInstances.values());
}

/**
 * Get a window by label
 */
export async function getWindow(label: string): Promise<WindowHandle | null> {
  if (windowInstances.has(label)) {
    return windowInstances.get(label)!;
  }

  if (!isTauri()) {
    return null;
  }

  const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
  const tw = await WebviewWindow.getByLabel(label);

  if (tw) {
    const handle = new WindowHandle(label, tw);
    windowInstances.set(label, handle);
    return handle;
  }

  return null;
}

// Convenience functions for current window
export async function closeWindow(): Promise<void> {
  const win = await getCurrentWindow();
  await win.close();
}

export async function minimizeWindow(): Promise<void> {
  const win = await getCurrentWindow();
  await win.minimize();
}

export async function maximizeWindow(): Promise<void> {
  const win = await getCurrentWindow();
  await win.maximize();
}

export async function setTitle(title: string): Promise<void> {
  const win = await getCurrentWindow();
  await win.setTitle(title);
}

export async function setSize(width: number, height: number): Promise<void> {
  const win = await getCurrentWindow();
  await win.setSize(width, height);
}

export async function setFullscreen(enabled: boolean): Promise<void> {
  const win = await getCurrentWindow();
  await win.setFullscreen(enabled);
}

export async function setAlwaysOnTop(enabled: boolean): Promise<void> {
  const win = await getCurrentWindow();
  await win.setAlwaysOnTop(enabled);
}

export async function center(): Promise<void> {
  const win = await getCurrentWindow();
  await win.center();
}

export async function setPosition(x: number, y: number): Promise<void> {
  const win = await getCurrentWindow();
  await win.setPosition(x, y);
}

/**
 * Get primary monitor info
 */
export async function getPrimaryMonitor(): Promise<Monitor | null> {
  if (!isTauri()) return null;

  const { primaryMonitor } = await import('@tauri-apps/api/window');
  const monitor = await primaryMonitor();

  if (!monitor) return null;

  return {
    name: monitor.name,
    size: monitor.size,
    position: monitor.position,
    scaleFactor: monitor.scaleFactor,
  };
}

/**
 * Get all monitors
 */
export async function getAllMonitors(): Promise<Monitor[]> {
  if (!isTauri()) return [];

  const { availableMonitors } = await import('@tauri-apps/api/window');
  const monitors = await availableMonitors();

  return monitors.map(m => ({
    name: m.name,
    size: m.size,
    position: m.position,
    scaleFactor: m.scaleFactor,
  }));
}
