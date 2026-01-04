/**
 * PhilJS Electron Integration
 */

import { signal, effect } from '@philjs/core';

export function useElectron() {
    const isElectron = typeof window !== 'undefined' && !!(window as any).electron;

    return {
        isElectron,
        ipc: isElectron ? (window as any).electron.ipcRenderer : null,
        send: (channel: string, data: any) => {
            if (isElectron) (window as any).electron.ipcRenderer.send(channel, data);
        },
        on: (channel: string, callback: (data: any) => void) => {
            if (isElectron) (window as any).electron.ipcRenderer.on(channel, (_: any, data: any) => callback(data));
        },
        invoke: async (channel: string, data?: any) => {
            if (isElectron) return (window as any).electron.ipcRenderer.invoke(channel, data);
        }
    };
}

export function useWindowState() {
    const isMaximized = signal(false);
    const isFullscreen = signal(false);

    const { on } = useElectron();
    on?.('window-maximized', () => isMaximized.set(true));
    on?.('window-unmaximized', () => isMaximized.set(false));
    on?.('window-fullscreen', () => isFullscreen.set(true));
    on?.('window-leave-fullscreen', () => isFullscreen.set(false));

    return { isMaximized, isFullscreen };
}

/** Electron preload script */
export const preloadScript = `
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  }
});
`;
