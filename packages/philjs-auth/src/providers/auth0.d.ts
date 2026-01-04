/**
 * Auth0 Authentication Provider Adapter
 *
 * Integrates Auth0 with PhilJS auth system
 */
import { type Signal } from '@philjs/core/signals';
import { BaseAuthProvider } from '../auth-provider.js';
import type { User, AuthSession } from '../types.js';
/**
 * Auth0 configuration
 */
export interface Auth0Config {
    domain: string;
    clientId: string;
    clientSecret?: string;
    audience?: string;
    redirectUri: string;
    scope?: string;
}
/**
 * Auth0 auth provider
 */
export declare class Auth0AuthProvider extends BaseAuthProvider {
    readonly name = "auth0";
    readonly user: Signal<User | null>;
    readonly session: Signal<AuthSession | null>;
    readonly loading: Signal<boolean>;
    private config;
    private auth0Client;
    constructor(config: Auth0Config);
    initialize(): Promise<void>;
    signInWithEmail(email: string, password: string): Promise<User>;
    signUpWithEmail(email: string, password: string, metadata?: Record<string, unknown>): Promise<User>;
    signInWithOAuth(provider: string): Promise<void>;
    signOut(): Promise<void>;
    getToken(): Promise<string | null>;
    refreshToken(): Promise<string>;
    sendPasswordReset(email: string): Promise<void>;
    private updateAuthState;
    private getCurrentUser;
}
//# sourceMappingURL=auth0.d.ts.map