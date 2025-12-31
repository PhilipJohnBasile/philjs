/**
 * PhilJS CLI - Page Generator
 *
 * Generate page components with routes, loaders, and SEO
 */
export interface PageOptions {
    name: string;
    directory?: string;
    typescript?: boolean;
    withTest?: boolean;
    withStyles?: boolean;
    withLoader?: boolean;
}
/**
 * Generate a page with route
 */
export declare function generatePage(options: PageOptions): Promise<string[]>;
//# sourceMappingURL=page.d.ts.map