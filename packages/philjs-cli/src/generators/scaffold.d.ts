/**
 * PhilJS CLI - Scaffold Generator
 *
 * Generate full CRUD: model, API routes, list page, detail page, form components
 * Inspired by RedwoodJS scaffold command
 */
export interface ScaffoldOptions {
    name: string;
    fields?: string[];
    provider?: 'prisma' | 'drizzle';
    typescript?: boolean;
    withTests?: boolean;
    skipModel?: boolean;
    skipApi?: boolean;
    skipPages?: boolean;
    skipComponents?: boolean;
}
/**
 * Generate a full CRUD scaffold
 */
export declare function generateScaffold(options: ScaffoldOptions): Promise<string[]>;
//# sourceMappingURL=scaffold.d.ts.map