/**
 * PhilJS CLI - Hook Generator
 *
 * Generate custom hooks with tests
 */
export interface HookOptions {
    name: string;
    directory?: string;
    typescript?: boolean;
    withTest?: boolean;
}
/**
 * Generate a custom hook
 */
export declare function generateHook(options: HookOptions): Promise<string[]>;
//# sourceMappingURL=hook.d.ts.map