/**
 * Supabase Authentication Provider Adapter
 *
 * Integrates Supabase Auth with PhilJS auth system
 */
import { type Signal } from 'philjs-core/signals';
import { BaseAuthProvider } from '../auth-provider.js';
import type { User, AuthSession } from '../types.js';
/**
 * Supabase configuration
 */
export interface SupabaseConfig {
    url: string;
    anonKey: string;
    auth?: {
        autoRefreshToken?: boolean;
        persistSession?: boolean;
        detectSessionInUrl?: boolean;
    };
}
/**
 * Supabase auth provider
 */
export declare class SupabaseAuthProvider extends BaseAuthProvider {
    readonly name = "supabase";
    readonly user: Signal<User | null>;
    readonly session: Signal<AuthSession | null>;
    readonly loading: Signal<boolean>;
    private config;
    private supabase;
    private authSubscription;
    constructor(config: SupabaseConfig);
    initialize(): Promise<void>;
    signInWithEmail(email: string, password: string): Promise<User>;
    signUpWithEmail(email: string, password: string, metadata?: Record<string, unknown>): Promise<User>;
    signInWithOAuth(provider: string): Promise<void>;
    signOut(): Promise<void>;
    getToken(): Promise<string | null>;
    refreshToken(): Promise<string>;
    updateUser(updates: Partial<User>): Promise<User>;
    sendPasswordReset(email: string): Promise<void>;
    resetPassword(token: string, newPassword: string): Promise<void>;
    verifyEmail(token: string): Promise<void>;
    /**
     * Clean up subscriptions
     */
    destroy(): void;
    private updateAuthState;
    private mapSupabaseUser;
}
//# sourceMappingURL=supabase.d.ts.map