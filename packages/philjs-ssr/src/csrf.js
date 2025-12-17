/**
 * CSRF protection for actions.
 */
import { randomBytes } from "node:crypto";
const CSRF_HEADER = "x-csrf-token";
const CSRF_FIELD = "_csrf";
const TOKEN_LENGTH = 32;
/**
 * Generate a CSRF token.
 */
export function generateCSRFToken() {
    return randomBytes(TOKEN_LENGTH).toString("hex");
}
/**
 * Store for CSRF tokens (in production, use Redis or similar).
 */
class TokenStore {
    tokens = new Map();
    cleanupInterval;
    constructor() {
        // Clean up expired tokens every minute
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }
    set(sessionId, token, ttl = 3600000) {
        this.tokens.set(sessionId, {
            token,
            expires: Date.now() + ttl,
        });
    }
    get(sessionId) {
        const entry = this.tokens.get(sessionId);
        if (!entry)
            return null;
        if (entry.expires < Date.now()) {
            this.tokens.delete(sessionId);
            return null;
        }
        return entry.token;
    }
    verify(sessionId, token) {
        const stored = this.get(sessionId);
        return stored === token;
    }
    cleanup() {
        const now = Date.now();
        for (const [key, value] of this.tokens.entries()) {
            if (value.expires < now) {
                this.tokens.delete(key);
            }
        }
    }
    destroy() {
        clearInterval(this.cleanupInterval);
        this.tokens.clear();
    }
}
export const csrfStore = new TokenStore();
/**
 * Middleware to add CSRF protection to actions.
 */
export function csrfProtection(options = { getSessionId: () => "default" }) {
    return {
        generateToken(request) {
            const sessionId = options.getSessionId(request);
            const token = generateCSRFToken();
            csrfStore.set(sessionId, token);
            return token;
        },
        verifyRequest(request) {
            // Skip verification for safe methods
            if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
                return true;
            }
            // Skip if configured
            if (options.skip?.(request)) {
                return true;
            }
            const sessionId = options.getSessionId(request);
            // Check header first
            const headerToken = request.headers.get(CSRF_HEADER);
            if (headerToken && csrfStore.verify(sessionId, headerToken)) {
                return true;
            }
            // Check form field (for form submissions)
            // This would need the parsed form data
            // In practice, this would be done in the request handler
            return false;
        },
    };
}
/**
 * Create a CSRF input field for forms.
 */
export function csrfField(token) {
    return `<input type="hidden" name="${CSRF_FIELD}" value="${token}">`;
}
/**
 * Extract CSRF token from request.
 */
export async function extractCSRFToken(request) {
    // Check header
    const headerToken = request.headers.get(CSRF_HEADER);
    if (headerToken)
        return headerToken;
    // Check form data
    if (request.method === "POST") {
        try {
            const formData = await request.clone().formData();
            const fieldToken = formData.get(CSRF_FIELD);
            if (typeof fieldToken === "string")
                return fieldToken;
        }
        catch {
            // Not form data
        }
    }
    return null;
}
//# sourceMappingURL=csrf.js.map