/**
 * Auth Provider Abstraction
 *
 * Unified interface for authentication providers
 */
/**
 * Auth provider factory - creates providers based on config
 */
export class AuthProviderFactory {
    static providers = new Map();
    /**
     * Register a provider
     */
    static register(name, provider) {
        this.providers.set(name.toLowerCase(), provider);
    }
    /**
     * Create a provider instance
     */
    static create(config) {
        const Provider = this.providers.get(config.name.toLowerCase());
        if (!Provider) {
            throw new Error(`Unknown auth provider: ${config.name}. Available providers: ${Array.from(this.providers.keys()).join(', ')}`);
        }
        return new Provider(config.config);
    }
    /**
     * Get list of registered providers
     */
    static getProviders() {
        return Array.from(this.providers.keys());
    }
}
/**
 * Base auth provider class with common functionality
 */
export class BaseAuthProvider {
    /**
     * Validate email format
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    /**
     * Validate password strength
     */
    validatePassword(password, minLength = 8) {
        return password.length >= minLength;
    }
    /**
     * Handle authentication errors
     */
    handleError(error, context) {
        if (error instanceof Error) {
            throw new Error(`${context}: ${error.message}`);
        }
        throw new Error(`${context}: Unknown error occurred`);
    }
}
//# sourceMappingURL=auth-provider.js.map