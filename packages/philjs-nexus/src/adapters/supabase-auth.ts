/**
 * Supabase Auth integration for PhilJS Nexus
 * 
 * Provides authentication hooks and session management.
 */

import { signal, effect, type Signal } from '@philjs/core';

export interface SupabaseAuthConfig {
    /** Supabase project URL */
    supabaseUrl: string;
    /** Supabase anon key */
    supabaseKey: string;
    /** Auto refresh token */
    autoRefreshToken?: boolean;
    /** Persist session to storage */
    persistSession?: boolean;
}

export interface AuthUser {
    id: string;
    email?: string;
    phone?: string;
    createdAt: string;
    updatedAt: string;
    metadata: Record<string, any>;
}

export interface AuthSession {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    user: AuthUser;
}

/**
 * Create Supabase Auth integration
 * 
 * @example
 * ```ts
 * const auth = createSupabaseAuth({
 *   supabaseUrl: 'https://xxx.supabase.co',
 *   supabaseKey: 'your-anon-key',
 * });
 * 
 * await auth.initialize();
 * 
 * // Sign in
 * await auth.signInWithEmail('user@example.com', 'password');
 * 
 * // Check session
 * if (auth.session()) {
 *   console.log('User:', auth.user());
 * }
 * ```
 */
export function createSupabaseAuth(config: SupabaseAuthConfig) {
    const {
        supabaseUrl,
        supabaseKey,
        autoRefreshToken = true,
        persistSession = true,
    } = config;

    // Auth state signals
    const user = signal<AuthUser | null>(null);
    const session = signal<AuthSession | null>(null);
    const loading = signal(true);
    const error = signal<Error | null>(null);

    let supabaseClient: any = null;

    /**
     * Initialize auth and restore session
     */
    async function initialize() {
        const { createClient } = await import('@supabase/supabase-js');
        supabaseClient = createClient(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken,
                persistSession,
            },
        });

        // Get initial session
        const { data: { session: currentSession } } = await supabaseClient.auth.getSession();

        if (currentSession) {
            session.set({
                accessToken: currentSession.access_token,
                refreshToken: currentSession.refresh_token,
                expiresAt: currentSession.expires_at || 0,
                user: mapUser(currentSession.user),
            });
            user.set(mapUser(currentSession.user));
        }

        // Listen for auth changes
        supabaseClient.auth.onAuthStateChange((event: string, newSession: any) => {
            if (newSession) {
                session.set({
                    accessToken: newSession.access_token,
                    refreshToken: newSession.refresh_token,
                    expiresAt: newSession.expires_at || 0,
                    user: mapUser(newSession.user),
                });
                user.set(mapUser(newSession.user));
            } else {
                session.set(null);
                user.set(null);
            }
        });

        loading.set(false);
    }

    function mapUser(supabaseUser: any): AuthUser {
        return {
            id: supabaseUser.id,
            email: supabaseUser.email,
            phone: supabaseUser.phone,
            createdAt: supabaseUser.created_at,
            updatedAt: supabaseUser.updated_at,
            metadata: supabaseUser.user_metadata || {},
        };
    }

    /**
     * Sign in with email and password
     */
    async function signInWithEmail(email: string, password: string) {
        loading.set(true);
        error.set(null);

        try {
            const { data, error: authError } = await supabaseClient.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;
            return data;
        } catch (e) {
            error.set(e instanceof Error ? e : new Error(String(e)));
            throw e;
        } finally {
            loading.set(false);
        }
    }

    /**
     * Sign up with email and password
     */
    async function signUpWithEmail(email: string, password: string, metadata?: Record<string, any>) {
        loading.set(true);
        error.set(null);

        try {
            const { data, error: authError } = await supabaseClient.auth.signUp({
                email,
                password,
                options: { data: metadata },
            });

            if (authError) throw authError;
            return data;
        } catch (e) {
            error.set(e instanceof Error ? e : new Error(String(e)));
            throw e;
        } finally {
            loading.set(false);
        }
    }

    /**
     * Sign in with OAuth provider
     */
    async function signInWithOAuth(provider: 'google' | 'github' | 'discord' | 'twitter') {
        loading.set(true);
        error.set(null);

        try {
            const { data, error: authError } = await supabaseClient.auth.signInWithOAuth({
                provider,
            });

            if (authError) throw authError;
            return data;
        } catch (e) {
            error.set(e instanceof Error ? e : new Error(String(e)));
            throw e;
        } finally {
            loading.set(false);
        }
    }

    /**
     * Sign out
     */
    async function signOut() {
        loading.set(true);

        try {
            await supabaseClient.auth.signOut();
            user.set(null);
            session.set(null);
        } catch (e) {
            error.set(e instanceof Error ? e : new Error(String(e)));
        } finally {
            loading.set(false);
        }
    }

    /**
     * Reset password
     */
    async function resetPassword(email: string) {
        loading.set(true);
        error.set(null);

        try {
            const { error: authError } = await supabaseClient.auth.resetPasswordForEmail(email);
            if (authError) throw authError;
        } catch (e) {
            error.set(e instanceof Error ? e : new Error(String(e)));
            throw e;
        } finally {
            loading.set(false);
        }
    }

    return {
        initialize,
        signInWithEmail,
        signUpWithEmail,
        signInWithOAuth,
        signOut,
        resetPassword,

        // State
        user: () => user(),
        session: () => session(),
        loading: () => loading(),
        error: () => error(),
        isAuthenticated: () => !!session(),
    };
}

export type SupabaseAuth = ReturnType<typeof createSupabaseAuth>;
