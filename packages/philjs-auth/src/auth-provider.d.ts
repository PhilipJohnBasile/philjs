/**
 * Auth Provider Abstraction
 *
 * Unified interface for authentication providers
 */
import type { Signal } from 'philjs-core/signals';
import type { User, AuthSession } from './types.js';
/**
 * Auth provider interface - all providers must implement this
 */
export interface AuthProvider {
    /**
     * Provider name (e.g., 'clerk', 'auth0', 'supabase')
     */
    readonly name: string;
    /**
     * Current authenticated user (reactive signal)
     */
    readonly user: Signal<User | null>;
    /**
     * Current session (reactive signal)
     */
    readonly session: Signal<AuthSession | null>;
    /**
     * Loading state (reactive signal)
     */
    readonly loading: Signal<boolean>;
    /**
     * Initialize the provider
     */
    initialize(): Promise<void>;
    /**
     * Sign in with email and password
     */
    signInWithEmail(email: string, password: string): Promise<User>;
    /**
     * Sign up with email and password
     */
    signUpWithEmail(email: string, password: string, metadata?: Record<string, unknown>): Promise<User>;
    /**
     * Sign in with OAuth provider
     */
    signInWithOAuth?(provider: string): Promise<void>;
    /**
     * Sign out
     */
    signOut(): Promise<void>;
    /**
     * Get current access token
     */
    getToken(): Promise<string | null>;
    /**
     * Refresh the access token
     */
    refreshToken?(): Promise<string>;
    /**
     * Update user profile
     */
    updateUser?(updates: Partial<User>): Promise<User>;
    /**
     * Send password reset email
     */
    sendPasswordReset?(email: string): Promise<void>;
    /**
     * Reset password with token
     */
    resetPassword?(token: string, newPassword: string): Promise<void>;
    /**
     * Verify email with token
     */
    verifyEmail?(token: string): Promise<void>;
}
/**
 * Auth provider configuration
 */
export interface AuthProviderConfig {
    name: string;
    config: Record<string, unknown>;
}
/**
 * Auth provider factory - creates providers based on config
 */
export declare class AuthProviderFactory {
    private static providers;
    /**
     * Register a provider
     */
    static register(name: string, provider: new (config: any) => AuthProvider): void;
    /**
     * Create a provider instance
     */
    static create(config: AuthProviderConfig): AuthProvider;
    /**
     * Get list of registered providers
     */
    static getProviders(): string[];
}
/**
 * Base auth provider class with common functionality
 */
export declare abstract class BaseAuthProvider implements AuthProvider {
    abstract readonly name: string;
    abstract readonly user: Signal<User | null>;
    abstract readonly session: Signal<AuthSession | null>;
    abstract readonly loading: Signal<boolean>;
    abstract initialize(): Promise<void>;
    abstract signInWithEmail(email: string, password: string): Promise<User>;
    abstract signUpWithEmail(email: string, password: string, metadata?: Record<string, unknown>): Promise<User>;
    abstract signOut(): Promise<void>;
    abstract getToken(): Promise<string | null>;
    /**
     * Validate email format
     */
    protected validateEmail(email: string): boolean;
    /**
     * Validate password strength
     */
    protected validatePassword(password: string, minLength?: number): boolean;
    /**
     * Handle authentication errors
     */
    protected handleError(error: unknown, context: string): never;
}
/**
 * Auth provider context for React-style usage
 */
export interface AuthProviderContext {
    provider: AuthProvider;
    user: User | null;
    session: AuthSession | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<User>;
    signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<User>;
    signOut: () => Promise<void>;
    getToken: () => Promise<string | null>;
}
//# sourceMappingURL=auth-provider.d.ts.map