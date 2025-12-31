/**
 * NextAuth Provider Adapter
 *
 * Integrates NextAuth with PhilJS auth system
 */
import { signal } from 'philjs-core/signals';
import { BaseAuthProvider } from '../auth-provider.js';
/**
 * NextAuth provider adapter
 */
export class NextAuthProvider extends BaseAuthProvider {
    name = 'nextauth';
    user;
    session;
    loading;
    config;
    sessionModule = null;
    constructor(config = {}) {
        super();
        this.config = {
            basePath: '/api/auth',
            ...config,
        };
        this.user = signal(null);
        this.session = signal(null);
        this.loading = signal(true);
    }
    async initialize() {
        try {
            // Dynamically import NextAuth client
            this.sessionModule = await import('next-auth/react');
            // Get initial session
            const session = await this.sessionModule.getSession();
            if (session) {
                this.updateAuthState(session);
            }
            // Listen for session changes
            if (typeof window !== 'undefined') {
                window.addEventListener('visibilitychange', async () => {
                    if (document.visibilityState === 'visible') {
                        const updatedSession = await this.sessionModule.getSession();
                        this.updateAuthState(updatedSession);
                    }
                });
            }
            this.loading.set(false);
        }
        catch (error) {
            this.loading.set(false);
            this.handleError(error, 'Failed to initialize NextAuth');
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
            const result = await this.sessionModule.signIn('credentials', {
                email,
                password,
                redirect: false,
            });
            if (result?.error) {
                throw new Error(result.error);
            }
            if (!result?.ok) {
                throw new Error('Sign in failed');
            }
            // Get updated session
            const session = await this.sessionModule.getSession();
            if (session?.user) {
                return this.mapNextAuthUser(session.user);
            }
            throw new Error('No user in session');
        }
        catch (error) {
            this.handleError(error, 'Failed to sign in');
        }
    }
    async signUpWithEmail(email, password, metadata) {
        // NextAuth doesn't have built-in signup - need to implement custom endpoint
        if (!this.validateEmail(email)) {
            throw new Error('Invalid email address');
        }
        if (!this.validatePassword(password)) {
            throw new Error('Password must be at least 8 characters');
        }
        try {
            // Call custom signup API endpoint
            const response = await fetch(`${this.config.basePath}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    ...metadata,
                }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Signup failed');
            }
            // Sign in after successful signup
            return await this.signInWithEmail(email, password);
        }
        catch (error) {
            this.handleError(error, 'Failed to sign up');
        }
    }
    async signInWithOAuth(provider) {
        try {
            await this.sessionModule.signIn(provider, {
                callbackUrl: window.location.origin,
            });
        }
        catch (error) {
            this.handleError(error, `Failed to sign in with ${provider}`);
        }
    }
    async signOut() {
        try {
            await this.sessionModule.signOut({
                callbackUrl: window.location.origin,
            });
            this.user.set(null);
            this.session.set(null);
        }
        catch (error) {
            this.handleError(error, 'Failed to sign out');
        }
    }
    async getToken() {
        try {
            const session = await this.sessionModule.getSession();
            // NextAuth stores token in session
            return session?.accessToken || session?.user?.accessToken || null;
        }
        catch (error) {
            console.error('Failed to get token:', error);
            return null;
        }
    }
    async updateUser(updates) {
        try {
            // Call custom update endpoint
            const response = await fetch(`${this.config.basePath}/user/update`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!response.ok) {
                throw new Error('Failed to update user');
            }
            const user = await response.json();
            // Refresh session
            const session = await this.sessionModule.getSession();
            this.updateAuthState(session);
            return this.mapNextAuthUser(user);
        }
        catch (error) {
            this.handleError(error, 'Failed to update user');
        }
    }
    async sendPasswordReset(email) {
        try {
            // Call custom password reset endpoint
            const response = await fetch(`${this.config.basePath}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (!response.ok) {
                throw new Error('Failed to send password reset email');
            }
        }
        catch (error) {
            this.handleError(error, 'Failed to send password reset');
        }
    }
    updateAuthState(session) {
        if (session?.user) {
            const user = this.mapNextAuthUser(session.user);
            const authSession = {
                user,
                token: session.accessToken,
                expiresAt: session.expires ? new Date(session.expires).getTime() : undefined,
            };
            this.user.set(user);
            this.session.set(authSession);
        }
        else {
            this.user.set(null);
            this.session.set(null);
        }
    }
    mapNextAuthUser(nextAuthUser) {
        return {
            id: nextAuthUser.id || nextAuthUser.sub || '',
            email: nextAuthUser.email,
            name: nextAuthUser.name,
            avatar: nextAuthUser.image || nextAuthUser.picture,
            metadata: nextAuthUser,
        };
    }
}
//# sourceMappingURL=next-auth.js.map