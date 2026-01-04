/**
 * PhilJS Migrate - React Transform
 *
 * Converts React code to PhilJS, handling:
 * - useState → signal
 * - useEffect → effect
 * - useMemo → computed
 * - useCallback → inline functions (signals are stable)
 * - useRef → signal
 * - useContext → useContext
 * - React.memo → memo
 * - Lifecycle methods → onMount/onCleanup
 */
import type { MigrationWarning, ManualReviewItem } from '../migrate.js';
export interface TransformResult {
    code: string;
    transformed: boolean;
    warnings: Omit<MigrationWarning, 'file'>[];
    manualReview: Omit<ManualReviewItem, 'file'>[];
}
export declare class ReactTransform {
    transform(code: string, filename: string): Promise<TransformResult>;
    private isReactFile;
    private transformImports;
    private mapReactImport;
    private transformUseState;
    private transformUseEffect;
    private transformUseMemo;
    private transformUseCallback;
    private transformUseRef;
    private transformUseContext;
    private transformMemo;
    private transformJSX;
    private getLineNumber;
}
//# sourceMappingURL=react.d.ts.map