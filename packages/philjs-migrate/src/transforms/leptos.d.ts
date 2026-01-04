/**
 * PhilJS Migrate - Leptos Transform
 *
 * Migration helpers for converting Leptos (Rust) code to PhilJS-Rust.
 * Both are Rust-based reactive frameworks with similar APIs.
 *
 * Key differences:
 * - Signal API: Leptos uses RwSignal, PhilJS uses Signal
 * - View macro: Leptos uses view!, PhilJS uses view!
 * - Server functions: Leptos uses #[server], PhilJS uses #[server]
 * - Components: Leptos uses #[component], PhilJS uses #[component]
 */
import type { MigrationWarning, ManualReviewItem } from '../migrate.js';
export interface TransformResult {
    code: string;
    transformed: boolean;
    warnings: Omit<MigrationWarning, 'file'>[];
    manualReview: Omit<ManualReviewItem, 'file'>[];
}
export interface LeptosPattern {
    name: string;
    pattern: RegExp;
    replacement: string;
    description: string;
    needsReview: boolean;
}
export declare class LeptosTransform {
    private patterns;
    transform(code: string, filename: string): Promise<TransformResult>;
    private isLeptosFile;
    private transformImports;
    private transformSignalAccess;
    private transformContext;
    /**
     * Get migration guide content for Leptos to PhilJS-Rust
     */
    static getMigrationGuide(): string;
}
export { LeptosTransform as default };
//# sourceMappingURL=leptos.d.ts.map