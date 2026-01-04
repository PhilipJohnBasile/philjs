/**
 * Auto Launch APIs
 */
import { isTauri } from '../tauri/context.js';
import { invoke } from '../tauri/invoke.js';
/**
 * Auto Launch API
 */
export const AutoLaunch = {
    /**
     * Enable auto launch
     */
    async enable(options = {}) {
        if (!isTauri()) {
            console.warn('[PhilJS Desktop] Auto launch not available in browser');
            return;
        }
        // Use autostart plugin if available
        try {
            const { enable } = await import('@tauri-apps/plugin-autostart');
            await enable();
        }
        catch {
            // Fallback to custom command
            await invoke('plugin:autolaunch|enable', {
                appName: options.appName,
                appPath: options.appPath,
                args: options.args,
                hidden: options.hidden,
            });
        }
    },
    /**
     * Disable auto launch
     */
    async disable() {
        if (!isTauri()) {
            return;
        }
        try {
            const { disable } = await import('@tauri-apps/plugin-autostart');
            await disable();
        }
        catch {
            await invoke('plugin:autolaunch|disable');
        }
    },
    /**
     * Check if auto launch is enabled
     */
    async isEnabled() {
        if (!isTauri()) {
            return false;
        }
        try {
            const { isEnabled } = await import('@tauri-apps/plugin-autostart');
            return isEnabled();
        }
        catch {
            return invoke('plugin:autolaunch|is_enabled');
        }
    },
    /**
     * Toggle auto launch
     */
    async toggle() {
        const enabled = await this.isEnabled();
        if (enabled) {
            await this.disable();
            return false;
        }
        else {
            await this.enable();
            return true;
        }
    },
};
// Convenience exports
export const enableAutoLaunch = AutoLaunch.enable;
export const disableAutoLaunch = AutoLaunch.disable;
export const isAutoLaunchEnabled = AutoLaunch.isEnabled;
export const toggleAutoLaunch = AutoLaunch.toggle;
//# sourceMappingURL=autolaunch.js.map