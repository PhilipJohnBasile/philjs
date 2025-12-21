/**
 * System Tray APIs
 */

import { isTauri } from '../tauri/context';
import { listen } from '../tauri/events';
import type { UnlistenFn } from '../tauri/types';

// Tray types
export interface TrayOptions {
  /** Tray icon path */
  icon: string;
  /** Tray tooltip */
  tooltip?: string;
  /** Tray title (macOS) */
  title?: string;
  /** Menu items */
  menu?: TrayMenuItem[];
  /** Icon template (macOS) */
  iconAsTemplate?: boolean;
  /** Menu on left click */
  menuOnLeftClick?: boolean;
}

export interface TrayMenuItem {
  /** Menu item ID */
  id: string;
  /** Menu item text */
  text: string;
  /** Is item enabled */
  enabled?: boolean;
  /** Is item checked */
  checked?: boolean;
  /** Is accelerator */
  accelerator?: string;
  /** Submenu items */
  items?: TrayMenuItem[];
  /** Is separator */
  isSeparator?: boolean;
}

export interface TrayClickEvent {
  /** Click button (left/right/middle) */
  button: 'left' | 'right' | 'middle';
  /** Button state */
  state: 'pressed' | 'released';
  /** Click position */
  position: { x: number; y: number };
}

// Tray instance
let trayInstance: any = null;
const menuClickHandlers = new Map<string, () => void>();

/**
 * System Tray API
 */
export const SystemTray = {
  /**
   * Create system tray
   */
  async create(options: TrayOptions): Promise<void> {
    if (!isTauri()) {
      console.warn('[PhilJS Desktop] System tray not available in browser');
      return;
    }

    const { TrayIcon } = await import('@tauri-apps/api/tray');
    const { Menu, MenuItem, Submenu } = await import('@tauri-apps/api/menu');

    // Build menu
    const menu = options.menu ? await buildMenu(options.menu, Menu, MenuItem, Submenu) : undefined;

    // Create tray
    trayInstance = await TrayIcon.new({
      icon: options.icon,
      tooltip: options.tooltip,
      title: options.title,
      menu,
      iconAsTemplate: options.iconAsTemplate,
      menuOnLeftClick: options.menuOnLeftClick,
    });
  },

  /**
   * Set tray icon
   */
  async setIcon(icon: string): Promise<void> {
    if (!trayInstance) return;
    await trayInstance.setIcon(icon);
  },

  /**
   * Set tray tooltip
   */
  async setTooltip(tooltip: string): Promise<void> {
    if (!trayInstance) return;
    await trayInstance.setTooltip(tooltip);
  },

  /**
   * Set tray title (macOS)
   */
  async setTitle(title: string | null): Promise<void> {
    if (!trayInstance) return;
    await trayInstance.setTitle(title);
  },

  /**
   * Set tray menu
   */
  async setMenu(items: TrayMenuItem[]): Promise<void> {
    if (!trayInstance) return;

    const { Menu, MenuItem, Submenu } = await import('@tauri-apps/api/menu');
    const menu = await buildMenu(items, Menu, MenuItem, Submenu);
    await trayInstance.setMenu(menu);
  },

  /**
   * Show tray
   */
  async show(): Promise<void> {
    if (!trayInstance) return;
    await trayInstance.setVisible(true);
  },

  /**
   * Hide tray
   */
  async hide(): Promise<void> {
    if (!trayInstance) return;
    await trayInstance.setVisible(false);
  },

  /**
   * Destroy tray
   */
  async destroy(): Promise<void> {
    if (!trayInstance) return;
    await trayInstance.close();
    trayInstance = null;
    menuClickHandlers.clear();
  },

  /**
   * Register menu item click handler
   */
  onMenuClick(id: string, handler: () => void): () => void {
    menuClickHandlers.set(id, handler);
    return () => {
      menuClickHandlers.delete(id);
    };
  },

  /**
   * Listen for tray click events
   */
  async onClick(callback: (event: TrayClickEvent) => void): Promise<UnlistenFn> {
    if (!trayInstance) {
      return () => {};
    }

    return listen('tray-click', (event: any) => {
      callback(event.payload as TrayClickEvent);
    });
  },

  /**
   * Check if tray is created
   */
  isCreated(): boolean {
    return trayInstance !== null;
  },
};

/**
 * Build menu from items
 */
async function buildMenu(
  items: TrayMenuItem[],
  Menu: any,
  MenuItem: any,
  Submenu: any
): Promise<any> {
  const menuItems = [];

  for (const item of items) {
    if (item.isSeparator) {
      // Separator
      menuItems.push(await MenuItem.new({ isSeparator: true }));
    } else if (item.items && item.items.length > 0) {
      // Submenu
      const submenu = await buildMenu(item.items, Menu, MenuItem, Submenu);
      menuItems.push(await Submenu.new({
        text: item.text,
        items: submenu.items(),
      }));
    } else {
      // Regular item
      const menuItem = await MenuItem.new({
        id: item.id,
        text: item.text,
        enabled: item.enabled !== false,
        accelerator: item.accelerator,
        action: () => {
          const handler = menuClickHandlers.get(item.id);
          handler?.();
        },
      });
      menuItems.push(menuItem);
    }
  }

  return await Menu.new({ items: menuItems });
}

/**
 * Create a tray menu item helper
 */
export function trayItem(id: string, text: string, handler?: () => void): TrayMenuItem {
  if (handler) {
    menuClickHandlers.set(id, handler);
  }
  return { id, text };
}

/**
 * Create a tray separator
 */
export function traySeparator(): TrayMenuItem {
  return { id: '', text: '', isSeparator: true };
}

/**
 * Create a tray submenu
 */
export function traySubmenu(id: string, text: string, items: TrayMenuItem[]): TrayMenuItem {
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
