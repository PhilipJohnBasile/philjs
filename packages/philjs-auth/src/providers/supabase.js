/**
 * Supabase Authentication Provider Adapter
 *
 * Integrates Supabase Auth with PhilJS auth system
 */
import { signal } from 'philjs-core/signals';
import { BaseAuthProvider } from '../auth-provider.js';
/**
 * Supabase auth provider
 */
export class SupabaseAuthProvider extends BaseAuthProvider {
    name = 'supabase';
    user;
    session;
    loading;
    config;
    supabase = null;
    authSubscription = null;
    constructor(config) {
        super();
        this.config = {
            ...config,
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
                ...config.auth,
            },
        };
        this.user = signal(null);
        this.session = signal(null);
        this.loading = signal(true);
    }
    async initialize() {
        try {
            // Dynamically import Supabase
            const { createClient } = await import('@supabase/supabase-js');
            this.supabase = createClient(this.config.url, this.config.anonKey, {
                auth: this.config.auth,
            });
            // Get initial session
            const { data } = await this.supabase.auth.getSession();
            if (data?.session) {
                this.updateAuthState(data.session);
            }
            // Listen for auth changes
            const { data: authData } = this.supabase.auth.onAuthStateChange((_event, session) => {
                this.updateAuthState(session);
            });
            this.authSubscription = authData.subscription;
            this.loading.set(false);
        }
        catch (error) {
            this.loading.set(false);
            this.handleError(error, 'Failed to initialize Supabase');
        }
    }
    async signInWithEmail(email, password) {
        if (!this.validateEmail(email)) {
            throw new Error('Invalid email address');
        }
        if (!this.validatePassword(password)) {
            throw new Error('Password must be at least 8 characters');
        }
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error)
                throw error;
            if (data?.user) {
                return this.mapSupabaseUser(data.user);
            }
            throw new Error('Sign in failed');
        }
        catch (error) {
            this.handleError(error, 'Failed to sign in');
        }
    }
    async signUpWithEmail(email, password, metadata) {
        if (!this.validateEmail(email)) {
            throw new Error('Invalid email address');
        }
        if (!this.validatePassword(password)) {
            throw new Error('Password must be at least 8 characters');
        }
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: metadata,
                },
            });
            if (error)
                throw error;
            if (data?.user) {
                return this.mapSupabaseUser(data.user);
            }
            throw new Error('Sign up failed');
        }
        catch (error) {
            this.handleError(error, 'Failed to sign up');
        }
    }
    async signInWithOAuth(provider) {
        try {
            const { error } = await this.supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: window.location.origin,
                },
            });
            if (error)
                throw error;
        }
        catch (error) {
            this.handleError(error, `Failed to sign in with ${provider}`);
        }
    }
    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error)
                throw error;
            this.user.set(null);
            this.session.set(null);
        }
        catch (error) {
            this.handleError(error, 'Failed to sign out');
        }
    }
    async getToken() {
        try {
            const { data } = await this.supabase.auth.getSession();
            return data?.session?.access_token || null;
        }
        catch (error) {
            console.error('Failed to get token:', error);
            return null;
        }
    }
    async refreshToken() {
        try {
            const { data, error } = await this.supabase.auth.refreshSession();
            if (error)
                throw error;
            if (!data?.session?.access_token) {
                throw new Error('No access token in refreshed session');
            }
            return data.session.access_token;
        }
        catch (error) {
            this.handleError(error, 'Failed to refresh token');
        }
    }
    async updateUser(updates) {
        try {
            const { data, error } = await this.supabase.auth.updateUser({
                data: {
                    name: updates.name,
                    avatar_url: updates.avatar,
                    ...updates.metadata,
                },
            });
            if (error)
                throw error;
            if (data?.user) {
                return this.mapSupabaseUser(data.user);
            }
            throw new Error('Update failed');
        }
        catch (error) {
            this.handleError(error, 'Failed to update user');
        }
    }
    async sendPasswordReset(email) {
        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            });
            if (error)
                throw error;
        }
        catch (error) {
            this.handleError(error, 'Failed to send password reset');
        }
    }
    async resetPassword(token, newPassword) {
        try {
            const { error } = await this.supabase.auth.updateUser({
                password: newPassword,
            });
            if (error)
                throw error;
        }
        catch (error) {
            this.handleError(error, 'Failed to reset password');
        }
    }
    async verifyEmail(token) {
        try {
            const { error } = await this.supabase.auth.verifyOtp({
                token_hash: token,
                type: 'email',
            });
            if (error)
                throw error;
        }
        catch (error) {
            this.handleError(error, 'Failed to verify email');
        }
    }
    /**
     * Clean up subscriptions
     */
    destroy() {
        if (this.authSubscription) {
            this.authSubscription.unsubscribe();
        }
    }
    updateAuthState(session) {
        if (session?.user) {
            const user = this.mapSupabaseUser(session.user);
            const authSession = {
                user,
                token: session.access_token,
                expiresAt: session.expires_at ? session.expires_at * 1000 : undefined,
                refreshToken: session.refresh_token,
            };
            this.user.set(user);
            this.session.set(authSession);
        }
        else {
            this.user.set(null);
            this.session.set(null);
        }
    }
    mapSupabaseUser(supabaseUser) {
        return {
            id: supabaseUser.id,
            email: supabaseUser.email,
            name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name,
            avatar: supabaseUser.user_metadata?.avatar_url,
            metadata: supabaseUser.user_metadata,
        };
    }
}
//# sourceMappingURL=supabase.js.map