/**
 * Electron IPC Compatibility Layer
 * Provides ipcMain and ipcRenderer APIs on top of Tauri
 */

import { listen, emit } from '../tauri/events';
import { invoke } from '../tauri/invoke';
import type { UnlistenFn } from '../tauri/types';

// IPC event handler type
type IpcHandler = (event: IpcEvent, ...args: any[]) => any;
type IpcListener = (event: IpcEvent, ...args: any[]) => void;

// IPC event object (Electron-like)
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

// Handler storage
const mainHandlers = new Map<string, IpcHandler>();
const mainListeners = new Map<string, Set<IpcListener>>();
const rendererListeners = new Map<string, Set<IpcListener>>();
const unlistenerMap = new Map<string, UnlistenFn[]>();

/**
 * Create an IPC event object
 */
function createEvent(channel: string): IpcEvent {
  let defaultPrevented = false;

  return {
    sender: {
      send: (replyChannel: string, ...args: any[]) => {
        emit(`ipc:${replyChannel}`, args);
      },
      sendSync: (replyChannel: string, ...args: any[]) => {
        console.warn('[IPC] Sync send is not supported in Tauri');
      },
    },
    preventDefault: () => {
      defaultPrevented = true;
    },
    reply: (replyChannel: string, ...args: any[]) => {
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
  handle(channel: string, handler: IpcHandler): void {
    mainHandlers.set(channel, handler);

    // Set up Tauri listener
    listen<any[]>(`ipc:${channel}:invoke`, async (e) => {
      const [requestId, ...args] = e.payload;
      const event = createEvent(channel);

      try {
        const result = await handler(event, ...args);
        emit(`ipc:${channel}:response:${requestId}`, { success: true, result });
      } catch (error) {
        emit(`ipc:${channel}:response:${requestId}`, {
          success: false,
          error: String(error),
        });
      }
    }).then(unlisten => {
      if (!unlistenerMap.has(channel)) {
        unlistenerMap.set(channel, []);
      }
      unlistenerMap.get(channel)!.push(unlisten);
    });
  },

  /**
   * Handle an IPC request once
   */
  handleOnce(channel: string, handler: IpcHandler): void {
    const wrappedHandler: IpcHandler = async (event, ...args) => {
      this.removeHandler(channel);
      return handler(event, ...args);
    };
    this.handle(channel, wrappedHandler);
  },

  /**
   * Remove a handler
   */
  removeHandler(channel: string): void {
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
  on(channel: string, listener: IpcListener): this {
    if (!mainListeners.has(channel)) {
      mainListeners.set(channel, new Set());

      // Set up Tauri listener
      listen<any[]>(`ipc:${channel}`, (e) => {
        const event = createEvent(channel);
        mainListeners.get(channel)?.forEach(l => l(event, ...e.payload));
      }).then(unlisten => {
        if (!unlistenerMap.has(channel)) {
          unlistenerMap.set(channel, []);
        }
        unlistenerMap.get(channel)!.push(unlisten);
      });
    }

    mainListeners.get(channel)!.add(listener);
    return this;
  },

  /**
   * Listen for an event once
   */
  once(channel: string, listener: IpcListener): this {
    const wrapper: IpcListener = (event, ...args) => {
      this.removeListener(channel, wrapper);
      listener(event, ...args);
    };
    return this.on(channel, wrapper);
  },

  /**
   * Remove a listener
   */
  removeListener(channel: string, listener: IpcListener): this {
    mainListeners.get(channel)?.delete(listener);
    return this;
  },

  /**
   * Remove all listeners for a channel
   */
  removeAllListeners(channel?: string): this {
    if (channel) {
      mainListeners.delete(channel);
      const unlisteners = unlistenerMap.get(channel);
      if (unlisteners) {
        unlisteners.forEach(fn => fn());
        unlistenerMap.delete(channel);
      }
    } else {
      mainListeners.clear();
      unlistenerMap.forEach(unlisteners => unlisteners.forEach(fn => fn()));
      unlistenerMap.clear();
    }
    return this;
  },
};

/**
 * ipcRenderer - Renderer process IPC (Electron compatibility)
 */
export const ipcRenderer = {
  /**
   * Send a message to main process
   */
  send(channel: string, ...args: any[]): void {
    emit(`ipc:${channel}`, args);
  },

  /**
   * Send a sync message (not truly sync in Tauri)
   */
  sendSync(channel: string, ...args: any[]): any {
    console.warn('[IPC] sendSync is not supported in Tauri, use invoke instead');
    this.send(channel, ...args);
    return undefined;
  },

  /**
   * Invoke a handler and wait for response
   */
  async invoke(channel: string, ...args: any[]): Promise<any> {
    const requestId = `${Date.now()}-${Math.random()}`;

    return new Promise((resolve, reject) => {
      // Listen for response
      const responseChannel = `ipc:${channel}:response:${requestId}`;

      listen<{ success: boolean; result?: any; error?: string }>(responseChannel, (e) => {
        if (e.payload.success) {
          resolve(e.payload.result);
        } else {
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
  sendTo(webContentsId: number, channel: string, ...args: any[]): void {
    emit(`ipc:${channel}:${webContentsId}`, args);
  },

  /**
   * Send to the host window
   */
  sendToHost(channel: string, ...args: any[]): void {
    emit(`ipc:${channel}:host`, args);
  },

  /**
   * Listen for messages from main process
   */
  on(channel: string, listener: IpcListener): this {
    if (!rendererListeners.has(channel)) {
      rendererListeners.set(channel, new Set());

      listen<any[]>(`ipc:${channel}`, (e) => {
        const event = createEvent(channel);
        rendererListeners.get(channel)?.forEach(l => l(event, ...e.payload));
      }).then(unlisten => {
        if (!unlistenerMap.has(`renderer:${channel}`)) {
          unlistenerMap.set(`renderer:${channel}`, []);
        }
        unlistenerMap.get(`renderer:${channel}`)!.push(unlisten);
      });
    }

    rendererListeners.get(channel)!.add(listener);
    return this;
  },

  /**
   * Listen once
   */
  once(channel: string, listener: IpcListener): this {
    const wrapper: IpcListener = (event, ...args) => {
      this.removeListener(channel, wrapper);
      listener(event, ...args);
    };
    return this.on(channel, wrapper);
  },

  /**
   * Remove a listener
   */
  removeListener(channel: string, listener: IpcListener): this {
    rendererListeners.get(channel)?.delete(listener);
    return this;
  },

  /**
   * Remove all listeners
   */
  removeAllListeners(channel?: string): this {
    if (channel) {
      rendererListeners.delete(channel);
      const unlisteners = unlistenerMap.get(`renderer:${channel}`);
      if (unlisteners) {
        unlisteners.forEach(fn => fn());
        unlistenerMap.delete(`renderer:${channel}`);
      }
    } else {
      rendererListeners.clear();
      unlistenerMap.forEach((unlisteners, key) => {
        if (key.startsWith('renderer:')) {
          unlisteners.forEach(fn => fn());
        }
      });
    }
    return this;
  },

  /**
   * Post a message (Web API compatible)
   */
  postMessage(channel: string, message: any, transfer?: Transferable[]): void {
    this.send(channel, message);
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
  exposeInMainWorld(apiKey: string, api: Record<string, any>): void {
    if (typeof window !== 'undefined') {
      (window as any)[apiKey] = api;
    }
  },
};
