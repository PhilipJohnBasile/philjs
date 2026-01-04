/**
 * Electron IPC Compatibility Layer
 * Provides ipcMain and ipcRenderer APIs on top of Tauri
 */
import { listen, emit } from '../tauri/events.js';
import { invoke } from '../tauri/invoke.js';
// Handler storage
const mainHandlers = new Map();
const mainListeners = new Map();
const rendererListeners = new Map();
const unlistenerMap = new Map();
/**
 * Create an IPC event object
 */
function createEvent(channel) {
    let defaultPrevented = false;
    return {
        sender: {
            send: (replyChannel, ...args) => {
                emit(`ipc:${replyChannel}`, args);
            },
            sendSync: (replyChannel, ...args) => {
                console.warn('[IPC] Sync send is not supported in Tauri');
            },
        },
        preventDefault: () => {
            defaultPrevented = true;
        },
        reply: (replyChannel, ...args) => {
            emit(`ipc:${replyChannel}`, args);
        },
    };
}
/**
 * ipcMain - Main process IPC (Electron compatibility)
 * In Tauri, this runs in the webview but emulates main process behavior
 */
export const ipcMain = {
    /**
     * Handle an IPC request (async)
     */
    handle(channel, handler) {
        mainHandlers.set(channel, handler);
        // Set up Tauri listener
        listen(`ipc:${channel}:invoke`, async (e) => {
            const [requestId, ...args] = e.payload;
            const event = createEvent(channel);
            try {
                const result = await handler(event, ...args);
                emit(`ipc:${channel}:response:${requestId}`, { success: true, result });
            }
            catch (error) {
                emit(`ipc:${channel}:response:${requestId}`, {
                    success: false,
                    error: String(error),
                });
            }
        }).then(unlisten => {
            if (!unlistenerMap.has(channel)) {
                unlistenerMap.set(channel, []);
            }
            unlistenerMap.get(channel).push(unlisten);
        });
    },
    /**
     * Handle an IPC request once
     */
    handleOnce(channel, handler) {
        const wrappedHandler = async (event, ...args) => {
            ipcMain.removeHandler(channel);
            return handler(event, ...args);
        };
        ipcMain.handle(channel, wrappedHandler);
    },
    /**
     * Remove a handler
     */
    removeHandler(channel) {
        mainHandlers.delete(channel);
        const unlisteners = unlistenerMap.get(channel);
        if (unlisteners) {
            unlisteners.forEach(fn => fn());
            unlistenerMap.delete(channel);
        }
    },
    /**
     * Listen for an event
     */
    on(channel, listener) {
        if (!mainListeners.has(channel)) {
            mainListeners.set(channel, new Set());
            // Set up Tauri listener
            listen(`ipc:${channel}`, (e) => {
                const event = createEvent(channel);
                mainListeners.get(channel)?.forEach(l => l(event, ...e.payload));
            }).then(unlisten => {
                if (!unlistenerMap.has(channel)) {
                    unlistenerMap.set(channel, []);
                }
                unlistenerMap.get(channel).push(unlisten);
            });
        }
        mainListeners.get(channel).add(listener);
        return ipcMain;
    },
    /**
     * Listen for an event once
     */
    once(channel, listener) {
        const wrapper = (event, ...args) => {
            ipcMain.removeListener(channel, wrapper);
            listener(event, ...args);
        };
        return ipcMain.on(channel, wrapper);
    },
    /**
     * Remove a listener
     */
    removeListener(channel, listener) {
        mainListeners.get(channel)?.delete(listener);
        return ipcMain;
    },
    /**
     * Remove all listeners for a channel
     */
    removeAllListeners(channel) {
        if (channel) {
            mainListeners.delete(channel);
            const unlisteners = unlistenerMap.get(channel);
            if (unlisteners) {
                unlisteners.forEach(fn => fn());
                unlistenerMap.delete(channel);
            }
        }
        else {
            mainListeners.clear();
            unlistenerMap.forEach(unlisteners => unlisteners.forEach(fn => fn()));
            unlistenerMap.clear();
        }
        return ipcMain;
    },
};
/**
 * ipcRenderer - Renderer process IPC (Electron compatibility)
 */
export const ipcRenderer = {
    /**
     * Send a message to main process
     */
    send(channel, ...args) {
        emit(`ipc:${channel}`, args);
    },
    /**
     * Send a sync message (not truly sync in Tauri)
     */
    sendSync(channel, ...args) {
        console.warn('[IPC] sendSync is not supported in Tauri, use invoke instead');
        ipcRenderer.send(channel, ...args);
        return undefined;
    },
    /**
     * Invoke a handler and wait for response
     */
    async invoke(channel, ...args) {
        const requestId = `${Date.now()}-${Math.random()}`;
        return new Promise((resolve, reject) => {
            // Listen for response
            const responseChannel = `ipc:${channel}:response:${requestId}`;
            listen(responseChannel, (e) => {
                if (e.payload.success) {
                    resolve(e.payload.result);
                }
                else {
                    reject(new Error(e.payload.error));
                }
            }).then(unlisten => {
                // Clean up after response
                setTimeout(unlisten, 30000); // Cleanup after 30s timeout
            });
            // Send invoke request
            emit(`ipc:${channel}:invoke`, [requestId, ...args]);
        });
    },
    /**
     * Send to a specific window (host)
     */
    sendTo(webContentsId, channel, ...args) {
        emit(`ipc:${channel}:${webContentsId}`, args);
    },
    /**
     * Send to the host window
     */
    sendToHost(channel, ...args) {
        emit(`ipc:${channel}:host`, args);
    },
    /**
     * Listen for messages from main process
     */
    on(channel, listener) {
        if (!rendererListeners.has(channel)) {
            rendererListeners.set(channel, new Set());
            listen(`ipc:${channel}`, (e) => {
                const event = createEvent(channel);
                rendererListeners.get(channel)?.forEach(l => l(event, ...e.payload));
            }).then(unlisten => {
                if (!unlistenerMap.has(`renderer:${channel}`)) {
                    unlistenerMap.set(`renderer:${channel}`, []);
                }
                unlistenerMap.get(`renderer:${channel}`).push(unlisten);
            });
        }
        rendererListeners.get(channel).add(listener);
        return ipcRenderer;
    },
    /**
     * Listen once
     */
    once(channel, listener) {
        const wrapper = (event, ...args) => {
            ipcRenderer.removeListener(channel, wrapper);
            listener(event, ...args);
        };
        return ipcRenderer.on(channel, wrapper);
    },
    /**
     * Remove a listener
     */
    removeListener(channel, listener) {
        rendererListeners.get(channel)?.delete(listener);
        return ipcRenderer;
    },
    /**
     * Remove all listeners
     */
    removeAllListeners(channel) {
        if (channel) {
            rendererListeners.delete(channel);
            const unlisteners = unlistenerMap.get(`renderer:${channel}`);
            if (unlisteners) {
                unlisteners.forEach(fn => fn());
                unlistenerMap.delete(`renderer:${channel}`);
            }
        }
        else {
            rendererListeners.clear();
            unlistenerMap.forEach((unlisteners, key) => {
                if (key.startsWith('renderer:')) {
                    unlisteners.forEach(fn => fn());
                }
            });
        }
        return ipcRenderer;
    },
    /**
     * Post a message (Web API compatible)
     */
    postMessage(channel, message, transfer) {
        ipcRenderer.send(channel, message);
    },
};
/**
 * Context bridge for preload scripts
 * In Tauri, this provides a way to expose APIs safely
 */
export const contextBridge = {
    /**
     * Expose an API to the renderer
     */
    exposeInMainWorld(apiKey, api) {
        if (typeof window !== 'undefined') {
            window[apiKey] = api;
        }
    },
};
//# sourceMappingURL=ipc.js.map