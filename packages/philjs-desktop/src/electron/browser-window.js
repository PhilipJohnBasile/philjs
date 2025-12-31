/**
 * Electron BrowserWindow Compatibility Layer
 * Provides Electron-like API on top of Tauri
 */
import { createWindow } from '../window.js';
import { listen, emit } from '../tauri/events.js';
/**
 * BrowserWindow - Electron-compatible window API
 */
export class BrowserWindow {
    static instances = new Map();
    static nextId = 1;
    id;
    handle = null;
    eventHandlers = new Map();
    unlisteners = [];
    _isDestroyed = false;
    options;
    constructor(options = {}) {
        this.id = BrowserWindow.nextId++;
        this.options = options;
        // Create the window
        this.initWindow(options);
        BrowserWindow.instances.set(this.id, this);
    }
    async initWindow(options) {
        const tauriOptions = {
            label: `window-${this.id}`,
            visible: options.show !== false,
            focus: options.focusable !== false,
            decorations: options.frame !== false,
            ...(options.title !== undefined && { title: options.title }),
            ...(options.width !== undefined && { width: options.width }),
            ...(options.height !== undefined && { height: options.height }),
            ...(options.x !== undefined && { x: options.x }),
            ...(options.y !== undefined && { y: options.y }),
            ...(options.minWidth !== undefined && { minWidth: options.minWidth }),
            ...(options.minHeight !== undefined && { minHeight: options.minHeight }),
            ...(options.maxWidth !== undefined && { maxWidth: options.maxWidth }),
            ...(options.maxHeight !== undefined && { maxHeight: options.maxHeight }),
            ...(options.resizable !== undefined && { resizable: options.resizable }),
            ...(options.alwaysOnTop !== undefined && { alwaysOnTop: options.alwaysOnTop }),
            ...(options.fullscreen !== undefined && { fullscreen: options.fullscreen }),
            ...(options.transparent !== undefined && { transparent: options.transparent }),
            ...(options.skipTaskbar !== undefined && { skipTaskbar: options.skipTaskbar }),
        };
        try {
            this.handle = await createWindow(tauriOptions);
            this.setupEventListeners();
            this.emit('ready-to-show');
        }
        catch (error) {
            console.error('[BrowserWindow] Failed to create window:', error);
        }
    }
    async setupEventListeners() {
        if (!this.handle)
            return;
        // Map Tauri events to Electron events
        const eventMappings = [
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
    static getAllWindows() {
        return Array.from(BrowserWindow.instances.values());
    }
    /**
     * Get focused window
     */
    static getFocusedWindow() {
        // This would require async in Tauri, returning first instance for compatibility
        const windows = BrowserWindow.getAllWindows();
        return windows[0] || null;
    }
    /**
     * Get window by ID
     */
    static fromId(id) {
        return BrowserWindow.instances.get(id) || null;
    }
    // Event emitter methods
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event).add(handler);
        return this;
    }
    once(event, handler) {
        const wrapper = (...args) => {
            this.removeListener(event, wrapper);
            handler(...args);
        };
        return this.on(event, wrapper);
    }
    removeListener(event, handler) {
        this.eventHandlers.get(event)?.delete(handler);
        return this;
    }
    removeAllListeners(event) {
        if (event) {
            this.eventHandlers.delete(event);
        }
        else {
            this.eventHandlers.clear();
        }
        return this;
    }
    emit(event, ...args) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            for (const handler of Array.from(handlers)) {
                handler(...args);
            }
        }
    }
    // Window methods
    async close() {
        this.emit('close');
        await this.handle?.close();
        this.emit('closed');
        this.destroy();
    }
    destroy() {
        if (this._isDestroyed)
            return;
        this._isDestroyed = true;
        this.unlisteners.forEach((fn) => fn());
        this.unlisteners = [];
        this.eventHandlers.clear();
        BrowserWindow.instances.delete(this.id);
        this.handle = null;
    }
    async focus() {
        await this.handle?.setFocus();
        this.emit('focus');
    }
    async blur() {
        this.emit('blur');
    }
    async show() {
        await this.handle?.show();
        this.emit('show');
    }
    async hide() {
        await this.handle?.hide();
        this.emit('hide');
    }
    async minimize() {
        await this.handle?.minimize();
        this.emit('minimize');
    }
    async maximize() {
        await this.handle?.maximize();
        this.emit('maximize');
    }
    async unmaximize() {
        await this.handle?.unmaximize();
        this.emit('unmaximize');
    }
    async restore() {
        await this.handle?.show();
        this.emit('restore');
    }
    async setFullScreen(flag) {
        await this.handle?.setFullscreen(flag);
        this.emit(flag ? 'enter-full-screen' : 'leave-full-screen');
    }
    async isFullScreen() {
        return this.handle?.isFullscreen() ?? false;
    }
    async isMaximized() {
        return this.handle?.isMaximized() ?? false;
    }
    async isMinimized() {
        return this.handle?.isMinimized() ?? false;
    }
    async isVisible() {
        return this.handle?.isVisible() ?? false;
    }
    async isFocused() {
        return this.handle?.isFocused() ?? false;
    }
    isDestroyed() {
        return this._isDestroyed;
    }
    async setTitle(title) {
        await this.handle?.setTitle(title);
    }
    getTitle() {
        return document.title;
    }
    async setBounds(bounds) {
        if (bounds.x !== undefined && bounds.y !== undefined) {
            await this.handle?.setPosition(bounds.x, bounds.y);
        }
        if (bounds.width !== undefined && bounds.height !== undefined) {
            await this.handle?.setSize(bounds.width, bounds.height);
        }
    }
    async getBounds() {
        const pos = await this.handle?.getPosition() ?? { x: 0, y: 0 };
        const size = await this.handle?.getSize() ?? { width: 800, height: 600 };
        return { ...pos, ...size };
    }
    async setSize(width, height) {
        await this.handle?.setSize(width, height);
    }
    async getSize() {
        const size = await this.handle?.getSize() ?? { width: 800, height: 600 };
        return [size.width, size.height];
    }
    async setPosition(x, y) {
        await this.handle?.setPosition(x, y);
    }
    async getPosition() {
        const pos = await this.handle?.getPosition() ?? { x: 0, y: 0 };
        return [pos.x, pos.y];
    }
    async center() {
        await this.handle?.center();
    }
    async setAlwaysOnTop(flag) {
        await this.handle?.setAlwaysOnTop(flag);
    }
    async setResizable(resizable) {
        await this.handle?.setResizable(resizable);
    }
    async setMinimumSize(width, height) {
        await this.handle?.setMinSize(width, height);
    }
    async setMaximumSize(width, height) {
        await this.handle?.setMaxSize(width, height);
    }
    async setSkipTaskbar(skip) {
        await this.handle?.setSkipTaskbar(skip);
    }
    // WebContents-like methods
    get webContents() {
        return new WebContentsLike(this);
    }
    loadURL(url) {
        // In Tauri, this would require navigation API
        console.warn('[BrowserWindow] loadURL is not fully supported in Tauri');
        window.location.href = url;
        return Promise.resolve();
    }
    loadFile(filePath) {
        return this.loadURL(`file://${filePath}`);
    }
}
/**
 * WebContents-like API for Electron compatibility
 */
class WebContentsLike {
    window;
    constructor(window) {
        this.window = window;
    }
    send(channel, ...args) {
        emit(`ipc:${channel}`, args);
    }
    executeJavaScript(code) {
        return Promise.resolve(eval(code));
    }
    openDevTools() {
        console.log('[WebContents] Dev tools can be opened with Tauri dev mode');
    }
    closeDevTools() {
        console.log('[WebContents] Dev tools can be closed with Tauri dev mode');
    }
    isDevToolsOpened() {
        return false;
    }
}
export { WebContentsLike };
//# sourceMappingURL=browser-window.js.map