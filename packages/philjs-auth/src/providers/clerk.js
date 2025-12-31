/**
 * Clerk Authentication Provider Adapter
 *
 * Integrates Clerk with PhilJS auth system
 */
import { signal } from 'philjs-core/signals';
import { BaseAuthProvider } from '../auth-provider.js';
/**
 * Clerk auth provider
 */
export class ClerkAuthProvider extends BaseAuthProvider {
    name = 'clerk';
    user;
    session;
    loading;
    config;
    clerkInstance = null;
    constructor(config) {
        super();
        this.config = config;
        this.user = signal(null);
        this.session = signal(null);
        this.loading = signal(true);
    }
    async initialize() {
        try {
            // Dynamically import Clerk
            const { Clerk } = await import('@clerk/clerk-js');
            this.clerkInstance = new Clerk(this.config.publishableKey);
            await this.clerkInstance.load();
            // Set up listeners for auth state changes
            this.clerkInstance.addListener((state) => {
                this.updateAuthState(state);
            });
            // Initial state
            this.updateAuthState(this.clerkInstance);
            this.loading.set(false);
        }
        catch (error) {
            this.loading.set(false);
            this.handleError(error, 'Failed to initialize Clerk');
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
            const signIn = await this.clerkInstance.client.signIn.create({
                identifier: email,
                password,
            });
            if (signIn.status === 'complete') {
                await this.clerkInstance.setActive({ session: signIn.createdSessionId });
                return this.getCurrentUser();
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
            const signUp = await this.clerkInstance.client.signUp.create({
                emailAddress: email,
                password,
                unsafeMetadata: metadata,
            });
            if (signUp.status === 'complete') {
                await this.clerkInstance.setActive({ session: signUp.createdSessionId });
                return this.getCurrentUser();
            }
            // May need email verification
            if (signUp.status === 'missing_requirements') {
                throw new Error('Email verification required');
            }
            throw new Error('Sign up failed');
        }
        catch (error) {
            this.handleError(error, 'Failed to sign up');
        }
    }
    async signInWithOAuth(provider) {
        try {
            await this.clerkInstance.authenticateWithRedirect({
                strategy: `oauth_${provider}`,
                redirectUrl: this.config.afterSignInUrl || '/dashboard',
                redirectUrlComplete: this.config.afterSignInUrl || '/dashboard',
            });
        }
        catch (error) {
            this.handleError(error, `Failed to sign in with ${provider}`);
        }
    }
    async signOut() {
        try {
            await this.clerkInstance.signOut();
            this.user.set(null);
            this.session.set(null);
        }
        catch (error) {
            this.handleError(error, 'Failed to sign out');
        }
    }
    async getToken() {
        try {
            const session = this.clerkInstance.session;
            if (!session)
                return null;
            return await session.getToken();
        }
        catch (error) {
            console.error('Failed to get token:', error);
            return null;
        }
    }
    async updateUser(updates) {
        try {
            const clerkUser = this.clerkInstance.user;
            if (!clerkUser) {
                throw new Error('No user signed in');
            }
            await clerkUser.update({
                firstName: updates.name?.split(' ')[0],
                lastName: updates.name?.split(' ').slice(1).join(' '),
                unsafeMetadata: updates.metadata,
            });
            return this.getCurrentUser();
        }
        catch (error) {
            this.handleError(error, 'Failed to update user');
        }
    }
    async sendPasswordReset(email) {
        try {
            await this.clerkInstance.client.signIn.create({
                strategy: 'reset_password_email_code',
                identifier: email,
            });
        }
        catch (error) {
            this.handleError(error, 'Failed to send password reset');
        }
    }
    updateAuthState(clerkState) {
        const clerkUser = clerkState.user;
        const clerkSession = clerkState.session;
        if (clerkUser && clerkSession) {
            const user = {
                id: clerkUser.id,
                email: clerkUser.primaryEmailAddress?.emailAddress,
                name: clerkUser.fullName || clerkUser.firstName || undefined,
                avatar: clerkUser.imageUrl,
                metadata: clerkUser.publicMetadata,
            };
            const session = {
                user,
                expiresAt: clerkSession.expireAt,
            };
            this.user.set(user);
            this.session.set(session);
        }
        else {
            this.user.set(null);
            this.session.set(null);
        }
    }
    getCurrentUser() {
        const user = this.user();
        if (!user) {
            throw new Error('No user available');
        }
        return user;
    }
}
//# sourceMappingURL=clerk.js.map