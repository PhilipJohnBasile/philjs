/**
 * PhilJS Migrate - Report Generator
 */
import type { MigrationResult } from './migrate';
import type { ProjectAnalysis } from './analyze';
export interface MigrationReport {
    summary: string;
    details: string;
}
export declare function generateReport(result: MigrationResult, analysis: ProjectAnalysis, outputPath: string): Promise<void>;
//# sourceMappingURL=report.d.ts.map