/**
 * Electron IPC Compatibility Layer
 * Provides ipcMain and ipcRenderer APIs on top of Tauri
 */
type IpcHandler = (event: IpcEvent, ...args: any[]) => any;
type IpcListener = (event: IpcEvent, ...args: any[]) => void;
export interface IpcEvent {
    /** Sender info */
    sender: {
        send: (channel: string, ...args: any[]) => void;
        sendSync: (channel: string, ...args: any[]) => void;
    };
    /** Prevent default behavior */
    preventDefault: () => void;
    /** Reply to sender */
    reply: (channel: string, ...args: any[]) => void;
    /** Return value for sync handlers */
    returnValue?: any;
}
/** IpcMain interface for type-safe return types */
interface IpcMain {
    handle(channel: string, handler: IpcHandler): void;
    handleOnce(channel: string, handler: IpcHandler): void;
    removeHandler(channel: string): void;
    on(channel: string, listener: IpcListener): IpcMain;
    once(channel: string, listener: IpcListener): IpcMain;
    removeListener(channel: string, listener: IpcListener): IpcMain;
    removeAllListeners(channel?: string): IpcMain;
}
/** IpcRenderer interface for type-safe return types */
interface IpcRenderer {
    send(channel: string, ...args: any[]): void;
    sendSync(channel: string, ...args: any[]): any;
    invoke(channel: string, ...args: any[]): Promise<any>;
    sendTo(webContentsId: number, channel: string, ...args: any[]): void;
    sendToHost(channel: string, ...args: any[]): void;
    on(channel: string, listener: IpcListener): IpcRenderer;
    once(channel: string, listener: IpcListener): IpcRenderer;
    removeListener(channel: string, listener: IpcListener): IpcRenderer;
    removeAllListeners(channel?: string): IpcRenderer;
    postMessage(channel: string, message: any, transfer?: Transferable[]): void;
}
/**
 * ipcMain - Main process IPC (Electron compatibility)
 * In Tauri, this runs in the webview but emulates main process behavior
 */
export declare const ipcMain: IpcMain;
/**
 * ipcRenderer - Renderer process IPC (Electron compatibility)
 */
export declare const ipcRenderer: IpcRenderer;
/**
 * Context bridge for preload scripts
 * In Tauri, this provides a way to expose APIs safely
 */
export declare const contextBridge: {
    /**
     * Expose an API to the renderer
     */
    exposeInMainWorld(apiKey: string, api: Record<string, any>): void;
};
export {};
//# sourceMappingURL=ipc.d.ts.map