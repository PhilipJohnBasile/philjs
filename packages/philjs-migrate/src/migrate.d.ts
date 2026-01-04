/**
 * PhilJS Migrate - Main Migration Engine
 */
export interface MigrationOptions {
    source: string;
    target?: string;
    framework: 'react' | 'vue' | 'svelte' | 'auto';
    dryRun?: boolean;
    verbose?: boolean;
    include?: string[];
    exclude?: string[];
    generateReport?: boolean;
}
export interface MigrationResult {
    success: boolean;
    filesProcessed: number;
    filesTransformed: number;
    errors: MigrationError[];
    warnings: MigrationWarning[];
    manualReviewNeeded: ManualReviewItem[];
}
export interface MigrationError {
    file: string;
    line?: number;
    message: string;
    code: string;
}
export interface MigrationWarning {
    file: string;
    line?: number;
    message: string;
    suggestion?: string;
}
export interface ManualReviewItem {
    file: string;
    line: number;
    type: string;
    description: string;
    originalCode: string;
    suggestedCode?: string;
}
export declare function migrate(options: MigrationOptions): Promise<MigrationResult>;
//# sourceMappingURL=migrate.d.ts.map