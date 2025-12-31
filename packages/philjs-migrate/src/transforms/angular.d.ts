/**
 * PhilJS Migrate - Angular Transform
 *
 * Converts Angular code to PhilJS, handling:
 * - Angular signals → PhilJS signals
 * - @Component → function component
 * - Services → Context
 * - NgRx → signals
 * - Angular Router → philjs-router
 * - RxJS patterns → signals/effects
 */
import type { MigrationWarning, ManualReviewItem } from '../migrate.js';
export interface TransformResult {
    code: string;
    transformed: boolean;
    warnings: Omit<MigrationWarning, 'file'>[];
    manualReview: Omit<ManualReviewItem, 'file'>[];
}
export declare class AngularTransform {
    transform(code: string, filename: string): Promise<TransformResult>;
    private isAngularFile;
    private transformImports;
    private transformAngularSignals;
    private transformComponent;
    private transformDependencyInjection;
    private transformRxJS;
    private transformLifecycle;
    private transformTemplateSyntax;
    private getLineNumber;
}
//# sourceMappingURL=angular.d.ts.map