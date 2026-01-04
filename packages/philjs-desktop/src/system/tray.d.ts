/**
 * System Tray APIs
 */
import type { UnlistenFn } from '../tauri/types.js';
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
    position: {
        x: number;
        y: number;
    };
}
/**
 * System Tray API
 */
export declare const SystemTray: {
    /**
     * Create system tray
     */
    create(options: TrayOptions): Promise<void>;
    /**
     * Set tray icon
     */
    setIcon(icon: string): Promise<void>;
    /**
     * Set tray tooltip
     */
    setTooltip(tooltip: string): Promise<void>;
    /**
     * Set tray title (macOS)
     */
    setTitle(title: string | null): Promise<void>;
    /**
     * Set tray menu
     */
    setMenu(items: TrayMenuItem[]): Promise<void>;
    /**
     * Show tray
     */
    show(): Promise<void>;
    /**
     * Hide tray
     */
    hide(): Promise<void>;
    /**
     * Destroy tray
     */
    destroy(): Promise<void>;
    /**
     * Register menu item click handler
     */
    onMenuClick(id: string, handler: () => void): () => void;
    /**
     * Listen for tray click events
     */
    onClick(callback: (event: TrayClickEvent) => void): Promise<UnlistenFn>;
    /**
     * Check if tray is created
     */
    isCreated(): boolean;
};
/**
 * Create a tray menu item helper
 */
export declare function trayItem(id: string, text: string, handler?: () => void): TrayMenuItem;
/**
 * Create a tray separator
 */
export declare function traySeparator(): TrayMenuItem;
/**
 * Create a tray submenu
 */
export declare function traySubmenu(id: string, text: string, items: TrayMenuItem[]): TrayMenuItem;
export declare const createTray: (options: TrayOptions) => Promise<void>;
export declare const setTrayIcon: (icon: string) => Promise<void>;
export declare const setTrayTooltip: (tooltip: string) => Promise<void>;
export declare const setTrayMenu: (items: TrayMenuItem[]) => Promise<void>;
export declare const showTray: () => Promise<void>;
export declare const hideTray: () => Promise<void>;
export declare const destroyTray: () => Promise<void>;
//# sourceMappingURL=tray.d.ts.map