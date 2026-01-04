/**
 * Migration helpers for Electron to Tauri
 */
/**
 * Electron to Tauri API mapper
 */
export declare const ElectronToTauriMapper: {
    /**
     * Map Electron require to Tauri imports
     */
    mapRequire(module: string): any;
    /**
     * Check API compatibility
     */
    checkCompatibility(api: string): {
        supported: boolean;
        alternative?: string;
    };
    /**
     * Get migration guide for an API
     */
    getMigrationGuide(api: string): string;
};
/**
 * Create a migration helper
 */
export declare function createMigrationHelper(): {
    /**
     * Wrap an Electron-style require
     */
    require(module: string): any;
    /**
     * Check if code uses unsupported APIs
     */
    analyzeCode(code: string): Array<{
        api: string;
        line: number;
        suggestion: string;
    }>;
    /**
     * Generate compatibility report
     */
    generateReport(usedApis: string[]): string;
};
//# sourceMappingURL=migration.d.ts.map