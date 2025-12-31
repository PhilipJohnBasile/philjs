/**
 * PhilJS CLI - Store Generator
 *
 * Generate state stores with signals
 */
export interface StoreOptions {
    name: string;
    directory?: string;
    typescript?: boolean;
    withTest?: boolean;
}
/**
 * Generate a state store
 */
export declare function generateStore(options: StoreOptions): Promise<string[]>;
//# sourceMappingURL=store.d.ts.map