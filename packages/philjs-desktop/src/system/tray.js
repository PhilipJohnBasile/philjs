/**
 * System Tray APIs
 */
import { isTauri } from '../tauri/context.js';
import { listen } from '../tauri/events.js';
// Tray instance
let trayInstance = null;
const menuClickHandlers = new Map();
/**
 * System Tray API
 */
export const SystemTray = {
    /**
     * Create system tray
     */
    async create(options) {
        if (!isTauri()) {
            console.warn('[PhilJS Desktop] System tray not available in browser');
            return;
        }
        const { TrayIcon } = await import('@tauri-apps/api/tray');
        // Import menu components from specific submodules to work with NodeNext moduleResolution
        const { Menu } = await import('@tauri-apps/api/menu/menu');
        const { MenuItem } = await import('@tauri-apps/api/menu/menuItem');
        const { Submenu } = await import('@tauri-apps/api/menu/submenu');
        const { PredefinedMenuItem } = await import('@tauri-apps/api/menu/predefinedMenuItem');
        // Build menu
        const menu = options.menu ? await buildMenu(options.menu, { Menu, MenuItem, Submenu, PredefinedMenuItem }) : undefined;
        // Create tray with conditional properties to satisfy exactOptionalPropertyTypes
        const trayOptions = {
            icon: options.icon,
        };
        if (options.tooltip !== undefined)
            trayOptions.tooltip = options.tooltip;
        if (options.title !== undefined)
            trayOptions.title = options.title;
        if (menu !== undefined)
            trayOptions.menu = menu;
        if (options.iconAsTemplate !== undefined)
            trayOptions.iconAsTemplate = options.iconAsTemplate;
        if (options.menuOnLeftClick !== undefined)
            trayOptions.menuOnLeftClick = options.menuOnLeftClick;
        trayInstance = await TrayIcon.new(trayOptions);
    },
    /**
     * Set tray icon
     */
    async setIcon(icon) {
        if (!trayInstance)
            return;
        await trayInstance.setIcon(icon);
    },
    /**
     * Set tray tooltip
     */
    async setTooltip(tooltip) {
        if (!trayInstance)
            return;
        await trayInstance.setTooltip(tooltip);
    },
    /**
     * Set tray title (macOS)
     */
    async setTitle(title) {
        if (!trayInstance)
            return;
        await trayInstance.setTitle(title);
    },
    /**
     * Set tray menu
     */
    async setMenu(items) {
        if (!trayInstance)
            return;
        // Import menu components from specific submodules to work with NodeNext moduleResolution
        const { Menu } = await import('@tauri-apps/api/menu/menu');
        const { MenuItem } = await import('@tauri-apps/api/menu/menuItem');
        const { Submenu } = await import('@tauri-apps/api/menu/submenu');
        const { PredefinedMenuItem } = await import('@tauri-apps/api/menu/predefinedMenuItem');
        const menu = await buildMenu(items, { Menu, MenuItem, Submenu, PredefinedMenuItem });
        await trayInstance.setMenu(menu);
    },
    /**
     * Show tray
     */
    async show() {
        if (!trayInstance)
            return;
        await trayInstance.setVisible(true);
    },
    /**
     * Hide tray
     */
    async hide() {
        if (!trayInstance)
            return;
        await trayInstance.setVisible(false);
    },
    /**
     * Destroy tray
     */
    async destroy() {
        if (!trayInstance)
            return;
        await trayInstance.close();
        trayInstance = null;
        menuClickHandlers.clear();
    },
    /**
     * Register menu item click handler
     */
    onMenuClick(id, handler) {
        menuClickHandlers.set(id, handler);
        return () => {
            menuClickHandlers.delete(id);
        };
    },
    /**
     * Listen for tray click events
     */
    async onClick(callback) {
        if (!trayInstance) {
            return () => { };
        }
        return listen('tray-click', (event) => {
            callback(event.payload);
        });
    },
    /**
     * Check if tray is created
     */
    isCreated() {
        return trayInstance !== null;
    },
};
/**
 * Build menu from items
 */
async function buildMenu(items, components) {
    const { Menu, MenuItem, Submenu, PredefinedMenuItem } = components;
    const menuItems = [];
    for (const item of items) {
        if (item.isSeparator) {
            // Separator - use PredefinedMenuItem for separators
            menuItems.push(await PredefinedMenuItem.new({ item: 'Separator' }));
        }
        else if (item.items && item.items.length > 0) {
            // Submenu
            const submenu = await buildMenu(item.items, components);
            menuItems.push(await Submenu.new({
                text: item.text,
                items: await submenu.items(),
            }));
        }
        else {
            // Regular item - use conditional assignment for exactOptionalPropertyTypes (TS2375)
            const menuItemOptions = {
                id: item.id,
                text: item.text,
                enabled: item.enabled !== false,
                action: () => {
                    const handler = menuClickHandlers.get(item.id);
                    handler?.();
                },
            };
            if (item.accelerator !== undefined)
                menuItemOptions.accelerator = item.accelerator;
            const menuItem = await MenuItem.new(menuItemOptions);
            menuItems.push(menuItem);
        }
    }
    return await Menu.new({ items: menuItems });
}
/**
 * Create a tray menu item helper
 */
export function trayItem(id, text, handler) {
    if (handler) {
        menuClickHandlers.set(id, handler);
    }
    return { id, text };
}
/**
 * Create a tray separator
 */
export function traySeparator() {
    return { id: '', text: '', isSeparator: true };
}
/**
 * Create a tray submenu
 */
export function traySubmenu(id, text, items) {
    return { id, text, items };
}
// Convenience exports
export const createTray = SystemTray.create;
export const setTrayIcon = SystemTray.setIcon;
export const setTrayTooltip = SystemTray.setTooltip;
export const setTrayMenu = SystemTray.setMenu;
export const showTray = SystemTray.show;
export const hideTray = SystemTray.hide;
export const destroyTray = SystemTray.destroy;
//# sourceMappingURL=tray.js.map