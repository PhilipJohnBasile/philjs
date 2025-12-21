/**
 * Electron BrowserWindow Compatibility Layer
 * Provides Electron-like API on top of Tauri
 */

import { createWindow, WindowHandle, WindowOptions } from '../window';
import { listen, emit } from '../tauri/events';
import type { UnlistenFn } from '../tauri/types';

// Electron-style window options
export interface BrowserWindowOptions {
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
  fullscreen?: boolean;
  fullscreenable?: boolean;
  skipTaskbar?: boolean;
  title?: string;
  icon?: string;
  show?: boolean;
  frame?: boolean;
  parent?: BrowserWindow;
  modal?: boolean;
  transparent?: boolean;
  backgroundColor?: string;
  webPreferences?: {
    nodeIntegration?: boolean;
    contextIsolation?: boolean;
    preload?: string;
    devTools?: boolean;
  };
}

// Event handlers
type BrowserWindowEvent =
  | 'close'
  | 'closed'
  | 'focus'
  | 'blur'
  | 'show'
  | 'hide'
  | 'maximize'
  | 'unmaximize'
  | 'minimize'
  | 'restore'
  | 'resize'
  | 'move'
  | 'ready-to-show'
  | 'enter-full-screen'
  | 'leave-full-screen';

/**
 * BrowserWindow - Electron-compatible window API
 */
export class BrowserWindow {
  private static instances = new Map<number, BrowserWindow>();
  private static nextId = 1;

  readonly id: number;
  private handle: WindowHandle | null = null;
  private eventHandlers = new Map<BrowserWindowEvent, Set<Function>>();
  private unlisteners: UnlistenFn[] = [];
  private isDestroyed = false;
  private options: BrowserWindowOptions;

  constructor(options: BrowserWindowOptions = {}) {
    this.id = BrowserWindow.nextId++;
    this.options = options;

    // Create the window
    this.initWindow(options);

    BrowserWindow.instances.set(this.id, this);
  }

  private async initWindow(options: BrowserWindowOptions): Promise<void> {
    const tauriOptions: WindowOptions = {
      label: `window-${this.id}`,
      title: options.title,
      width: options.width,
      height: options.height,
      x: options.x,
      y: options.y,
      minWidth: options.minWidth,
      minHeight: options.minHeight,
      maxWidth: options.maxWidth,
      maxHeight: options.maxHeight,
      resizable: options.resizable,
      alwaysOnTop: options.alwaysOnTop,
      fullscreen: options.fullscreen,
      visible: options.show !== false,
      focus: options.focusable !== false,
      transparent: options.transparent,
      decorations: options.frame !== false,
      skipTaskbar: options.skipTaskbar,
    };

    try {
      this.handle = await createWindow(tauriOptions);
      this.setupEventListeners();
      this.emit('ready-to-show');
    } catch (error) {
      console.error('[BrowserWindow] Failed to create window:', error);
    }
  }

  private async setupEventListeners(): Promise<void> {
    if (!this.handle) return;

    // Map Tauri events to Electron events
    const eventMappings: Array<[string, BrowserWindowEvent]> = [
      ['tauri://close-requested', 'close'],
      ['tauri://focus', 'focus'],
      ['tauri://blur', 'blur'],
      ['tauri://resize', 'resize'],
      ['tauri://move', 'move'],
    ];

    for (const [tauriEvent, electronEvent] of eventMappings) {
      const unlisten = await listen(tauriEvent, () => {
        this.emit(electronEvent);
      });
      this.unlisteners.push(unlisten);
    }
  }

  /**
   * Get all open windows
   */
  static getAllWindows(): BrowserWindow[] {
    return Array.from(BrowserWindow.instances.values());
  }

  /**
   * Get focused window
   */
  static getFocusedWindow(): BrowserWindow | null {
    // This would require async in Tauri, returning first instance for compatibility
    const windows = BrowserWindow.getAllWindows();
    return windows[0] || null;
  }

  /**
   * Get window by ID
   */
  static fromId(id: number): BrowserWindow | null {
    return BrowserWindow.instances.get(id) || null;
  }

  // Event emitter methods
  on(event: BrowserWindowEvent, handler: Function): this {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
    return this;
  }

  once(event: BrowserWindowEvent, handler: Function): this {
    const wrapper = (...args: any[]) => {
      this.removeListener(event, wrapper);
      handler(...args);
    };
    return this.on(event, wrapper);
  }

  removeListener(event: BrowserWindowEvent, handler: Function): this {
    this.eventHandlers.get(event)?.delete(handler);
    return this;
  }

  removeAllListeners(event?: BrowserWindowEvent): this {
    if (event) {
      this.eventHandlers.delete(event);
    } else {
      this.eventHandlers.clear();
    }
    return this;
  }

  private emit(event: BrowserWindowEvent, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(...args);
      }
    }
  }

  // Window methods
  async close(): Promise<void> {
    this.emit('close');
    await this.handle?.close();
    this.emit('closed');
    this.destroy();
  }

  destroy(): void {
    if (this.isDestroyed) return;

    this.isDestroyed = true;
    this.unlisteners.forEach(fn => fn());
    this.unlisteners = [];
    this.eventHandlers.clear();
    BrowserWindow.instances.delete(this.id);
    this.handle = null;
  }

  async focus(): Promise<void> {
    await this.handle?.setFocus();
    this.emit('focus');
  }

  async blur(): Promise<void> {
    this.emit('blur');
  }

  async show(): Promise<void> {
    await this.handle?.show();
    this.emit('show');
  }

  async hide(): Promise<void> {
    await this.handle?.hide();
    this.emit('hide');
  }

  async minimize(): Promise<void> {
    await this.handle?.minimize();
    this.emit('minimize');
  }

  async maximize(): Promise<void> {
    await this.handle?.maximize();
    this.emit('maximize');
  }

  async unmaximize(): Promise<void> {
    await this.handle?.unmaximize();
    this.emit('unmaximize');
  }

  async restore(): Promise<void> {
    await this.handle?.show();
    this.emit('restore');
  }

  async setFullScreen(flag: boolean): Promise<void> {
    await this.handle?.setFullscreen(flag);
    this.emit(flag ? 'enter-full-screen' : 'leave-full-screen');
  }

  async isFullScreen(): Promise<boolean> {
    return this.handle?.isFullscreen() ?? false;
  }

  async isMaximized(): Promise<boolean> {
    return this.handle?.isMaximized() ?? false;
  }

  async isMinimized(): Promise<boolean> {
    return this.handle?.isMinimized() ?? false;
  }

  async isVisible(): Promise<boolean> {
    return this.handle?.isVisible() ?? false;
  }

  async isFocused(): Promise<boolean> {
    return this.handle?.isFocused() ?? false;
  }

  isDestroyed(): boolean {
    return this.isDestroyed;
  }

  async setTitle(title: string): Promise<void> {
    await this.handle?.setTitle(title);
  }

  getTitle(): string {
    return document.title;
  }

  async setBounds(bounds: { x?: number; y?: number; width?: number; height?: number }): Promise<void> {
    if (bounds.x !== undefined && bounds.y !== undefined) {
      await this.handle?.setPosition(bounds.x, bounds.y);
    }
    if (bounds.width !== undefined && bounds.height !== undefined) {
      await this.handle?.setSize(bounds.width, bounds.height);
    }
  }

  async getBounds(): Promise<{ x: number; y: number; width: number; height: number }> {
    const pos = await this.handle?.getPosition() ?? { x: 0, y: 0 };
    const size = await this.handle?.getSize() ?? { width: 800, height: 600 };
    return { ...pos, ...size };
  }

  async setSize(width: number, height: number): Promise<void> {
    await this.handle?.setSize(width, height);
  }

  async getSize(): Promise<[number, number]> {
    const size = await this.handle?.getSize() ?? { width: 800, height: 600 };
    return [size.width, size.height];
  }

  async setPosition(x: number, y: number): Promise<void> {
    await this.handle?.setPosition(x, y);
  }

  async getPosition(): Promise<[number, number]> {
    const pos = await this.handle?.getPosition() ?? { x: 0, y: 0 };
    return [pos.x, pos.y];
  }

  async center(): Promise<void> {
    await this.handle?.center();
  }

  async setAlwaysOnTop(flag: boolean): Promise<void> {
    await this.handle?.setAlwaysOnTop(flag);
  }

  async setResizable(resizable: boolean): Promise<void> {
    await this.handle?.setResizable(resizable);
  }

  async setMinimumSize(width: number, height: number): Promise<void> {
    await this.handle?.setMinSize(width, height);
  }

  async setMaximumSize(width: number, height: number): Promise<void> {
    await this.handle?.setMaxSize(width, height);
  }

  async setSkipTaskbar(skip: boolean): Promise<void> {
    await this.handle?.setSkipTaskbar(skip);
  }

  // WebContents-like methods
  get webContents(): WebContentsLike {
    return new WebContentsLike(this);
  }

  loadURL(url: string): Promise<void> {
    // In Tauri, this would require navigation API
    console.warn('[BrowserWindow] loadURL is not fully supported in Tauri');
    window.location.href = url;
    return Promise.resolve();
  }

  loadFile(filePath: string): Promise<void> {
    return this.loadURL(`file://${filePath}`);
  }
}

/**
 * WebContents-like API for Electron compatibility
 */
class WebContentsLike {
  constructor(private window: BrowserWindow) {}

  send(channel: string, ...args: any[]): void {
    emit(`ipc:${channel}`, args);
  }

  executeJavaScript(code: string): Promise<any> {
    return Promise.resolve(eval(code));
  }

  openDevTools(): void {
    console.log('[WebContents] Dev tools can be opened with Tauri dev mode');
  }

  closeDevTools(): void {
    console.log('[WebContents] Dev tools can be closed with Tauri dev mode');
  }

  isDevToolsOpened(): boolean {
    return false;
  }
}

export { WebContentsLike };
