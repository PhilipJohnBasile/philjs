/**
 * PhilJS CLI - Route Generator
 *
 * Generate routes with loaders
 */
export interface RouteOptions {
    name: string;
    directory?: string;
    typescript?: boolean;
    withTest?: boolean;
}
/**
 * Generate a route with loader
 */
export declare function generateRoute(options: RouteOptions): Promise<string[]>;
//# sourceMappingURL=route.d.ts.map