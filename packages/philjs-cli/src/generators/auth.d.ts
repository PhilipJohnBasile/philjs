/**
 * PhilJS CLI - Auth Generator
 *
 * Generate authentication setup with multiple provider options:
 * - Clerk
 * - Auth0
 * - Supabase
 * - NextAuth
 * - Custom
 */
export type AuthProvider = 'clerk' | 'auth0' | 'supabase' | 'nextauth' | 'custom';
export interface AuthGeneratorOptions {
    provider: AuthProvider;
    directory?: string;
    typescript?: boolean;
    withUI?: boolean;
    withMiddleware?: boolean;
    withProtectedRoutes?: boolean;
}
/**
 * Main auth generator entry point
 */
export declare function generateAuth(options: AuthGeneratorOptions): Promise<void>;
//# sourceMappingURL=auth.d.ts.map