/**
 * PhilJS Session Utilities
 *
 * Helper functions and middleware for session management.
 */
/**
 * Commit session helper
 *
 * Commits session changes and returns Set-Cookie header value.
 */
export async function commitSession(storage, session) {
    return storage.commitSession(session);
}
/**
 * Destroy session helper
 *
 * Destroys session and returns Set-Cookie header value for clearing the cookie.
 */
export async function destroySession(storage, session) {
    return storage.destroySession(session);
}
/**
 * Get or create session
 *
 * Gets existing session or creates a new one if it doesn't exist.
 */
export async function getOrCreateSession(storage, request) {
    return storage.getSession(request);
}
/**
 * Require session
 *
 * Gets session or throws error if not found.
 */
export async function requireSession(storage, request, errorMessage = 'Session required') {
    const session = await storage.getSession(request);
    if (!session || Object.keys(session.data).length === 0) {
        throw new Error(errorMessage);
    }
    return session;
}
/**
 * Session middleware
 *
 * Automatically attaches session to request and commits on response.
 */
export function sessionMiddleware(options) {
    const { storage, autoCommit = true, contextKey = 'session' } = options;
    return async (request, next) => {
        // Get session
        const session = await storage.getSession(request);
        // Attach to request (using a simple extension pattern)
        const requestWithSession = request;
        requestWithSession.session = session;
        // Process request
        const response = await next(requestWithSession);
        // Auto-commit if enabled
        if (autoCommit) {
            const setCookie = await storage.commitSession(session);
            const headers = new Headers(response.headers);
            headers.append('Set-Cookie', setCookie);
            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers,
            });
        }
        return response;
    };
}
/**
 * Apply session to response
 *
 * Helper to commit session and apply Set-Cookie header to response.
 */
export async function applySessionToResponse(storage, session, response) {
    const setCookie = await storage.commitSession(session);
    const headers = new Headers(response.headers);
    headers.append('Set-Cookie', setCookie);
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}
/**
 * Clear session data
 *
 * Clears all session data without destroying the session.
 */
export function clearSessionData(session) {
    session.clear();
}
/**
 * Session value getter with default
 */
export function getSessionValue(session, key, defaultValue) {
    const value = session.get(key);
    return value !== undefined ? value : defaultValue;
}
/**
 * Session value setter with validation
 */
export function setSessionValue(session, key, value, validator) {
    if (validator && !validator(value)) {
        return false;
    }
    session.set(key, value);
    return true;
}
/**
 * Merge data into session
 */
export function mergeSessionData(session, data) {
    Object.entries(data).forEach(([key, value]) => {
        session.set(key, value);
    });
}
/**
 * Create typed session utilities
 */
export function createTypedSessionUtils(storage) {
    return {
        /**
         * Get session
         */
        get: (request) => storage.getSession(request),
        /**
         * Commit session
         */
        commit: (session) => storage.commitSession(session),
        /**
         * Destroy session
         */
        destroy: (session) => storage.destroySession(session),
        /**
         * Get or create session
         */
        getOrCreate: (request) => getOrCreateSession(storage, request),
        /**
         * Require session
         */
        require: (request, errorMessage) => requireSession(storage, request, errorMessage),
        /**
         * Apply to response
         */
        applyToResponse: (session, response) => applySessionToResponse(storage, session, response),
        /**
         * Get value with default
         */
        getValue: (session, key, defaultValue) => getSessionValue(session, key, defaultValue),
        /**
         * Set value with validation
         */
        setValue: (session, key, value, validator) => setSessionValue(session, key, value, validator),
        /**
         * Merge data
         */
        merge: (session, data) => mergeSessionData(session, data),
        /**
         * Clear data
         */
        clear: (session) => clearSessionData(session),
        /**
         * Create middleware
         */
        middleware: (options) => sessionMiddleware({ ...options, storage }),
    };
}
/**
 * Session timeout middleware
 */
export function sessionTimeoutMiddleware(storage, timeoutSeconds) {
    return async (request, next) => {
        const session = await storage.getSession(request);
        const lastActivity = session.get('lastActivity');
        // Check if session has timed out
        if (lastActivity) {
            const elapsed = (Date.now() - lastActivity) / 1000;
            if (elapsed > timeoutSeconds) {
                // Session timed out, destroy it
                const setCookie = await storage.destroySession(session);
                return new Response('Session expired', {
                    status: 401,
                    headers: {
                        'Set-Cookie': setCookie,
                    },
                });
            }
        }
        // Update last activity
        session.set('lastActivity', Date.now());
        const response = await next(request);
        // Commit session with updated activity
        const setCookie = await storage.commitSession(session);
        const headers = new Headers(response.headers);
        headers.append('Set-Cookie', setCookie);
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
    };
}
/**
 * Session validator middleware
 */
export function sessionValidatorMiddleware(storage, validator) {
    return async (request, next) => {
        const session = await storage.getSession(request);
        const isValid = await validator(session);
        if (!isValid) {
            const setCookie = await storage.destroySession(session);
            return new Response('Invalid session', {
                status: 401,
                headers: {
                    'Set-Cookie': setCookie,
                },
            });
        }
        return next(request);
    };
}
/**
 * Session regeneration
 *
 * Regenerates session ID while preserving data (useful after login/privilege escalation).
 */
export async function regenerateSession(storage, oldSession) {
    // Get the data
    const data = { ...oldSession.data };
    // Create new session with same data
    const newSession = {
        id: generateNewSessionId(),
        data,
        get: oldSession.get.bind(oldSession),
        set: oldSession.set.bind(oldSession),
        delete: oldSession.delete.bind(oldSession),
        has: oldSession.has.bind(oldSession),
        clear: oldSession.clear.bind(oldSession),
        flash: oldSession.flash.bind(oldSession),
        getFlash: oldSession.getFlash.bind(oldSession),
    };
    return newSession;
}
/**
 * Generate new session ID
 */
function generateNewSessionId() {
    const array = new Uint8Array(32);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(array);
    }
    else {
        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
    }
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}
//# sourceMappingURL=session-utils.js.map