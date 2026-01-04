/**
 * PhilJS Migrate - Dioxus Transform
 *
 * Migration helpers for converting Dioxus (Rust) code to PhilJS-Rust.
 * Dioxus uses a React-like hooks API while PhilJS uses signals.
 *
 * Key differences:
 * - Hooks: Dioxus use_state/use_ref → PhilJS Signal
 * - View: Dioxus rsx! → PhilJS view!
 * - Components: Similar #[component] attribute
 * - Desktop/Mobile: Dioxus has native renderers
 */
import type { MigrationWarning, ManualReviewItem } from '../migrate.js';
export interface TransformResult {
    code: string;
    transformed: boolean;
    warnings: Omit<MigrationWarning, 'file'>[];
    manualReview: Omit<ManualReviewItem, 'file'>[];
}
export declare class DioxusTransform {
    transform(code: string, filename: string): Promise<TransformResult>;
    private isDioxusFile;
    private transformImports;
    private transformHooks;
    private transformRsx;
    private transformComponents;
    private transformContext;
    private handlePlatformSpecific;
    private getLineNumber;
    /**
     * Get migration guide content for Dioxus to PhilJS-Rust
     */
    static getMigrationGuide(): string;
}
export { DioxusTransform as default };
//# sourceMappingURL=dioxus.d.ts.map