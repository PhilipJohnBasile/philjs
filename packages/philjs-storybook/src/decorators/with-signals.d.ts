/**
 * Signals Decorator
 *
 * Wraps stories with signal state management utilities
 */
export interface WithSignalsOptions {
    initialState?: Record<string, any>;
}
/**
 * Decorator that provides signal utilities to stories
 */
export declare function withSignals(options?: WithSignalsOptions): (storyFn: () => any, context: any) => any;
//# sourceMappingURL=with-signals.d.ts.map