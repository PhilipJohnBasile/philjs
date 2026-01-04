/**
 * Electron App Compatibility Layer
 * Provides app module API on top of Tauri
 */
type AppEventHandler = (...args: any[]) => void;
/**
 * Electron App interface
 */
export interface ElectronApp {
    isReady(): boolean;
    whenReady(): Promise<void>;
    getName(): string;
    getNameAsync(): Promise<string>;
    setName(name: string): void;
    getVersion(): string;
    getVersionAsync(): Promise<string>;
    getPath(name: string): string;
    getPathAsync(name: string): Promise<string>;
    setPath(name: string, path: string): void;
    getLocale(): string;
    quit(): void;
    exit(exitCode?: number): void;
    relaunch(): Promise<void>;
    isQuitting(): boolean;
    focus(): void;
    hide(): void;
    show(): void;
    setAboutPanelOptions(options: Record<string, string>): void;
    showAboutPanel(): void;
    setBadgeCount(count: number): boolean;
    getBadgeCount(): number;
    requestSingleInstanceLock(): boolean;
    releaseSingleInstanceLock(): void;
    setLoginItemSettings(settings: {
        openAtLogin: boolean;
    }): void;
    getLoginItemSettings(): {
        openAtLogin: boolean;
    };
    on(event: string, handler: AppEventHandler): ElectronApp;
    once(event: string, handler: AppEventHandler): ElectronApp;
    removeListener(event: string, handler: AppEventHandler): ElectronApp;
    removeAllListeners(event?: string): ElectronApp;
    emit(event: string, ...args: any[]): boolean;
    listenerCount(event: string): number;
}
/**
 * app - Electron app module compatibility
 */
export declare const app: ElectronApp;
export default app;
//# sourceMappingURL=app.d.ts.map