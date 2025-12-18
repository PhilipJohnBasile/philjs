/**
 * PhilJS Migrate - Vue Transform
 *
 * Converts Vue 3 Composition API code to PhilJS:
 * - ref() → signal()
 * - reactive() → signal() with object
 * - computed() → computed()
 * - watch() → effect()
 * - watchEffect() → effect()
 * - onMounted() → onMount()
 * - onUnmounted() → onCleanup()
 * - Template syntax → JSX
 */
import type { MigrationWarning, ManualReviewItem } from '../migrate';
export interface TransformResult {
    code: string;
    transformed: boolean;
    warnings: Omit<MigrationWarning, 'file'>[];
    manualReview: Omit<ManualReviewItem, 'file'>[];
}
export declare class VueTransform {
    transform(code: string, filename: string): Promise<TransformResult>;
    private isVueFile;
    private transformVueSFC;
    private transformCompositionAPI;
    private transformImports;
    private transformVueScript;
    private extractSetupBody;
    private extractComponentName;
    private templateToJSX;
}
//# sourceMappingURL=vue.d.ts.map