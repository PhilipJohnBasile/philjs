/**
 * NextAuth Provider Adapter
 *
 * Integrates NextAuth with PhilJS auth system
 */
import { type Signal } from 'philjs-core/signals';
import { BaseAuthProvider } from '../auth-provider.js';
import type { User, AuthSession } from '../types.js';
/**
 * NextAuth configuration
 */
export interface NextAuthConfig {
    basePath?: string;
    providers?: any[];
    callbacks?: {
        signIn?: (params: any) => Promise<boolean>;
        session?: (params: any) => Promise<any>;
        jwt?: (params: any) => Promise<any>;
    };
}
/**
 * NextAuth provider adapter
 */
export declare class NextAuthProvider extends BaseAuthProvider {
    readonly name = "nextauth";
    readonly user: Signal<User | null>;
    readonly session: Signal<AuthSession | null>;
    readonly loading: Signal<boolean>;
    private config;
    private sessionModule;
    constructor(config?: NextAuthConfig);
    initialize(): Promise<void>;
    signInWithEmail(email: string, password: string): Promise<User>;
    signUpWithEmail(email: string, password: string, metadata?: Record<string, unknown>): Promise<User>;
    signInWithOAuth(provider: string): Promise<void>;
    signOut(): Promise<void>;
    getToken(): Promise<string | null>;
    updateUser(updates: Partial<User>): Promise<User>;
    sendPasswordReset(email: string): Promise<void>;
    private updateAuthState;
    private mapNextAuthUser;
}
//# sourceMappingURL=next-auth.d.ts.map