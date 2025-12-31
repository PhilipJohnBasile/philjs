/**
 * Clerk Authentication Provider Adapter
 *
 * Integrates Clerk with PhilJS auth system
 */
import { type Signal } from 'philjs-core/signals';
import { BaseAuthProvider } from '../auth-provider.js';
import type { User, AuthSession } from '../types.js';
/**
 * Clerk configuration
 */
export interface ClerkConfig {
    publishableKey: string;
    secretKey?: string;
    signInUrl?: string;
    signUpUrl?: string;
    afterSignInUrl?: string;
    afterSignUpUrl?: string;
}
/**
 * Clerk auth provider
 */
export declare class ClerkAuthProvider extends BaseAuthProvider {
    readonly name = "clerk";
    readonly user: Signal<User | null>;
    readonly session: Signal<AuthSession | null>;
    readonly loading: Signal<boolean>;
    private config;
    private clerkInstance;
    constructor(config: ClerkConfig);
    initialize(): Promise<void>;
    signInWithEmail(email: string, password: string): Promise<User>;
    signUpWithEmail(email: string, password: string, metadata?: Record<string, unknown>): Promise<User>;
    signInWithOAuth(provider: string): Promise<void>;
    signOut(): Promise<void>;
    getToken(): Promise<string | null>;
    updateUser(updates: Partial<User>): Promise<User>;
    sendPasswordReset(email: string): Promise<void>;
    private updateAuthState;
    private getCurrentUser;
}
//# sourceMappingURL=clerk.d.ts.map