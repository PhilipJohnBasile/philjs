/**
 * PhilJS Migrate - Svelte Transform
 *
 * Converts Svelte code to PhilJS:
 * - let reactive = signal()
 * - $: computed = computed()
 * - $: effect statements = effect()
 * - onMount() = onMount()
 * - onDestroy() = onCleanup()
 * - Svelte template → JSX
 */
import type { MigrationWarning, ManualReviewItem } from '../migrate';
export interface TransformResult {
    code: string;
    transformed: boolean;
    warnings: Omit<MigrationWarning, 'file'>[];
    manualReview: Omit<ManualReviewItem, 'file'>[];
}
export declare class SvelteTransform {
    transform(code: string, filename: string): Promise<TransformResult>;
    private transformSvelteComponent;
    private transformScript;
    private isComputed;
    private extractProps;
    private templateToJSX;
}
//# sourceMappingURL=svelte.d.ts.map