/**
 * Auto Launch APIs
 */
export interface AutoLaunchOptions {
    /** App name */
    appName?: string;
    /** App path (optional, uses current app if not specified) */
    appPath?: string;
    /** Launch arguments */
    args?: string[];
    /** Launch hidden (minimized to tray) */
    hidden?: boolean;
}
/**
 * Auto Launch API
 */
export declare const AutoLaunch: {
    /**
     * Enable auto launch
     */
    enable(options?: AutoLaunchOptions): Promise<void>;
    /**
     * Disable auto launch
     */
    disable(): Promise<void>;
    /**
     * Check if auto launch is enabled
     */
    isEnabled(): Promise<boolean>;
    /**
     * Toggle auto launch
     */
    toggle(): Promise<boolean>;
};
export declare const enableAutoLaunch: (options?: AutoLaunchOptions) => Promise<void>;
export declare const disableAutoLaunch: () => Promise<void>;
export declare const isAutoLaunchEnabled: () => Promise<boolean>;
export declare const toggleAutoLaunch: () => Promise<boolean>;
//# sourceMappingURL=autolaunch.d.ts.map