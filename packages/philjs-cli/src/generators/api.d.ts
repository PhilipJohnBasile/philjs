/**
 * PhilJS CLI - API Route Generator
 *
 * Generate API routes with handlers for GET, POST, PUT, DELETE
 */
export interface ApiOptions {
    name: string;
    directory?: string;
    typescript?: boolean;
    withTest?: boolean;
    methods?: ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE')[];
}
/**
 * Generate an API route
 */
export declare function generateApi(options: ApiOptions): Promise<string[]>;
//# sourceMappingURL=api.d.ts.map