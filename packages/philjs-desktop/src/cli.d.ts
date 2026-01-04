#!/usr/bin/env node
/**
 * PhilJS Desktop CLI
 * Commands for creating and building Tauri desktop applications
 */
interface CLIOptions {
    name?: string | undefined;
    template?: string | undefined;
    target?: 'windows' | 'macos' | 'linux' | 'all';
    debug?: boolean;
    verbose?: boolean;
    watch?: boolean;
}
interface TauriConfig {
    productName: string;
    version: string;
    identifier: string;
    build: {
        devPath: string;
        distDir: string;
    };
    app: {
        windows: Array<{
            title: string;
            width: number;
            height: number;
        }>;
    };
}
/**
 * Parse command line arguments
 */
declare function parseArgs(args: string[]): {
    command: string;
    options: CLIOptions;
};
/**
 * Initialize a new Tauri project
 */
declare function initProject(options: CLIOptions): Promise<void>;
/**
 * Start development mode
 */
declare function startDev(options: CLIOptions): Promise<void>;
/**
 * Build for production
 */
declare function buildApp(options: CLIOptions): Promise<void>;
export { initProject, startDev, buildApp, parseArgs };
export type { CLIOptions, TauriConfig };
//# sourceMappingURL=cli.d.ts.map