/**
 * Electron BrowserWindow Compatibility Layer
 * Provides Electron-like API on top of Tauri
 */
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
type BrowserWindowEvent = 'close' | 'closed' | 'focus' | 'blur' | 'show' | 'hide' | 'maximize' | 'unmaximize' | 'minimize' | 'restore' | 'resize' | 'move' | 'ready-to-show' | 'enter-full-screen' | 'leave-full-screen';
/**
 * BrowserWindow - Electron-compatible window API
 */
export declare class BrowserWindow {
    private static instances;
    private static nextId;
    readonly id: number;
    private handle;
    private eventHandlers;
    private unlisteners;
    private _isDestroyed;
    private options;
    constructor(options?: BrowserWindowOptions);
    private initWindow;
    private setupEventListeners;
    /**
     * Get all open windows
     */
    static getAllWindows(): BrowserWindow[];
    /**
     * Get focused window
     */
    static getFocusedWindow(): BrowserWindow | null;
    /**
     * Get window by ID
     */
    static fromId(id: number): BrowserWindow | null;
    on(event: BrowserWindowEvent, handler: Function): this;
    once(event: BrowserWindowEvent, handler: Function): this;
    removeListener(event: BrowserWindowEvent, handler: Function): this;
    removeAllListeners(event?: BrowserWindowEvent): this;
    private emit;
    close(): Promise<void>;
    destroy(): void;
    focus(): Promise<void>;
    blur(): Promise<void>;
    show(): Promise<void>;
    hide(): Promise<void>;
    minimize(): Promise<void>;
    maximize(): Promise<void>;
    unmaximize(): Promise<void>;
    restore(): Promise<void>;
    setFullScreen(flag: boolean): Promise<void>;
    isFullScreen(): Promise<boolean>;
    isMaximized(): Promise<boolean>;
    isMinimized(): Promise<boolean>;
    isVisible(): Promise<boolean>;
    isFocused(): Promise<boolean>;
    isDestroyed(): boolean;
    setTitle(title: string): Promise<void>;
    getTitle(): string;
    setBounds(bounds: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    }): Promise<void>;
    getBounds(): Promise<{
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
    setSize(width: number, height: number): Promise<void>;
    getSize(): Promise<[number, number]>;
    setPosition(x: number, y: number): Promise<void>;
    getPosition(): Promise<[number, number]>;
    center(): Promise<void>;
    setAlwaysOnTop(flag: boolean): Promise<void>;
    setResizable(resizable: boolean): Promise<void>;
    setMinimumSize(width: number, height: number): Promise<void>;
    setMaximumSize(width: number, height: number): Promise<void>;
    setSkipTaskbar(skip: boolean): Promise<void>;
    get webContents(): WebContentsLike;
    loadURL(url: string): Promise<void>;
    loadFile(filePath: string): Promise<void>;
}
/**
 * WebContents-like API for Electron compatibility
 */
declare class WebContentsLike {
    private window;
    constructor(window: BrowserWindow);
    send(channel: string, ...args: any[]): void;
    executeJavaScript(code: string): Promise<any>;
    openDevTools(): void;
    closeDevTools(): void;
    isDevToolsOpened(): boolean;
}
export { WebContentsLike };
//# sourceMappingURL=browser-window.d.ts.map