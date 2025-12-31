/**
 * Global Shortcut APIs
 */
import { isTauri } from '../tauri/context.js';
// Registered shortcuts
const registeredShortcuts = new Map();
let browserListenerAttached = false;
/**
 * Global Shortcut API
 */
export const GlobalShortcut = {
    /**
     * Register a global shortcut
     * @param shortcut - Key combination (e.g., 'CommandOrControl+Shift+S')
     * @param handler - Callback function
     * @returns Unregister function
     */
    async register(shortcut, handler) {
        const id = `shortcut-${Date.now()}-${Math.random()}`;
        if (!isTauri()) {
            // Browser fallback using document keydown
            if (!browserListenerAttached) {
                document.addEventListener('keydown', browserShortcutHandler);
                browserListenerAttached = true;
            }
            registeredShortcuts.set(id, { shortcut, handler, id });
            return () => {
                registeredShortcuts.delete(id);
                if (registeredShortcuts.size === 0 && browserListenerAttached) {
                    document.removeEventListener('keydown', browserShortcutHandler);
                    browserListenerAttached = false;
                }
            };
        }
        const { register } = await import('@tauri-apps/plugin-global-shortcut');
        await register(shortcut, handler);
        registeredShortcuts.set(id, { shortcut, handler, id });
        return async () => {
            const { unregister } = await import('@tauri-apps/plugin-global-shortcut');
            await unregister(shortcut);
            registeredShortcuts.delete(id);
        };
    },
    /**
     * Register multiple shortcuts
     */
    async registerAll(shortcuts) {
        const unregisterFns = await Promise.all(shortcuts.map(({ shortcut, handler }) => this.register(shortcut, handler)));
        return () => {
            unregisterFns.forEach(fn => fn());
        };
    },
    /**
     * Unregister a shortcut
     */
    async unregister(shortcut) {
        if (!isTauri()) {
            for (const [id, handler] of registeredShortcuts) {
                if (handler.shortcut === shortcut) {
                    registeredShortcuts.delete(id);
                }
            }
            return;
        }
        const { unregister } = await import('@tauri-apps/plugin-global-shortcut');
        await unregister(shortcut);
        for (const [id, handler] of registeredShortcuts) {
            if (handler.shortcut === shortcut) {
                registeredShortcuts.delete(id);
            }
        }
    },
    /**
     * Unregister all shortcuts
     */
    async unregisterAll() {
        if (!isTauri()) {
            registeredShortcuts.clear();
            if (browserListenerAttached) {
                document.removeEventListener('keydown', browserShortcutHandler);
                browserListenerAttached = false;
            }
            return;
        }
        const { unregisterAll } = await import('@tauri-apps/plugin-global-shortcut');
        await unregisterAll();
        registeredShortcuts.clear();
    },
    /**
     * Check if a shortcut is registered
     */
    async isRegistered(shortcut) {
        if (!isTauri()) {
            for (const handler of registeredShortcuts.values()) {
                if (handler.shortcut === shortcut) {
                    return true;
                }
            }
            return false;
        }
        const { isRegistered } = await import('@tauri-apps/plugin-global-shortcut');
        return isRegistered(shortcut);
    },
    /**
     * Get all registered shortcuts
     */
    getRegistered() {
        return Array.from(registeredShortcuts.values()).map(h => h.shortcut);
    },
};
/**
 * Browser shortcut handler
 */
function browserShortcutHandler(event) {
    for (const handler of registeredShortcuts.values()) {
        if (matchShortcut(event, handler.shortcut)) {
            event.preventDefault();
            handler.handler();
        }
    }
}
/**
 * Match keyboard event to shortcut string
 */
function matchShortcut(event, shortcut) {
    const parts = shortcut.toLowerCase().split('+');
    const key = parts.pop();
    const modifiers = {
        ctrl: parts.includes('control') || parts.includes('ctrl') || parts.includes('commandorcontrol'),
        meta: parts.includes('command') || parts.includes('meta') || parts.includes('commandorcontrol'),
        alt: parts.includes('alt') || parts.includes('option'),
        shift: parts.includes('shift'),
    };
    // Check if modifiers match
    const ctrlOrMeta = event.ctrlKey || event.metaKey;
    if ((modifiers.ctrl || modifiers.meta) && !ctrlOrMeta)
        return false;
    if (modifiers.alt && !event.altKey)
        return false;
    if (modifiers.shift && !event.shiftKey)
        return false;
    // Check if key matches
    const eventKey = event.key.toLowerCase();
    if (eventKey === key)
        return true;
    // Handle special keys
    const keyMap = {
        escape: 'escape',
        esc: 'escape',
        enter: 'enter',
        return: 'enter',
        tab: 'tab',
        space: ' ',
        backspace: 'backspace',
        delete: 'delete',
        up: 'arrowup',
        down: 'arrowdown',
        left: 'arrowleft',
        right: 'arrowright',
        home: 'home',
        end: 'end',
        pageup: 'pageup',
        pagedown: 'pagedown',
    };
    return eventKey === (keyMap[key] || key);
}
// Convenience exports
export const registerShortcut = GlobalShortcut.register;
export const unregisterShortcut = GlobalShortcut.unregister;
export const unregisterAllShortcuts = GlobalShortcut.unregisterAll;
export const isShortcutRegistered = GlobalShortcut.isRegistered;
//# sourceMappingURL=shortcut.js.map