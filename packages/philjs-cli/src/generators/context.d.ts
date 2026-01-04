/**
 * PhilJS CLI - Context Generator
 *
 * Generate context providers with hooks
 */
export interface ContextOptions {
    name: string;
    directory?: string;
    typescript?: boolean;
    withTest?: boolean;
}
/**
 * Generate a context provider
 */
export declare function generateContext(options: ContextOptions): Promise<string[]>;
//# sourceMappingURL=context.d.ts.map