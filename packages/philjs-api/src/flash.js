/**
 * PhilJS Flash Messages
 *
 * Remix-style flash messages with session-based one-time messages.
 * Messages are automatically cleared after being read.
 */
/**
 * Flash storage key
 */
const FLASH_KEY = '__flash__';
/**
 * Set a flash message
 */
export function setFlash(session, category, message, metadata) {
    const flashMessages = session.get(FLASH_KEY) || [];
    const flashMessage = {
        category,
        message,
        timestamp: Date.now(),
    };
    if (metadata !== undefined)
        flashMessage.metadata = metadata;
    flashMessages.push(flashMessage);
    session.set(FLASH_KEY, flashMessages);
}
/**
 * Set a success flash message
 */
export function setFlashSuccess(session, message, metadata) {
    setFlash(session, 'success', message, metadata);
}
/**
 * Set an error flash message
 */
export function setFlashError(session, message, metadata) {
    setFlash(session, 'error', message, metadata);
}
/**
 * Set a warning flash message
 */
export function setFlashWarning(session, message, metadata) {
    setFlash(session, 'warning', message, metadata);
}
/**
 * Set an info flash message
 */
export function setFlashInfo(session, message, metadata) {
    setFlash(session, 'info', message, metadata);
}
/**
 * Get all flash messages and clear them
 */
export function getFlashMessages(session) {
    const flashMessages = session.get(FLASH_KEY) || [];
    // Clear flash messages after reading
    session.delete(FLASH_KEY);
    return flashMessages;
}
/**
 * Get flash messages by category
 */
export function getFlashMessagesByCategory(session, category) {
    const allMessages = getFlashMessages(session);
    return allMessages.filter(msg => msg.category === category);
}
/**
 * Peek at flash messages without clearing them
 */
export function peekFlashMessages(session) {
    return session.get(FLASH_KEY) || [];
}
/**
 * Clear all flash messages
 */
export function clearFlashMessages(session) {
    session.delete(FLASH_KEY);
}
/**
 * Check if there are any flash messages
 */
export function hasFlashMessages(session) {
    const flashMessages = session.get(FLASH_KEY);
    return flashMessages && flashMessages.length > 0;
}
/**
 * React hook for flash messages (client-side)
 */
export function useFlash() {
    // This would be implemented in the client-side package
    // Here we just export the type/interface
    throw new Error('useFlash must be used on the client side. Import from philjs-api/client');
}
/**
 * Create flash message utilities bound to a session
 */
export function createFlashUtils(session) {
    return {
        set: (category, message, metadata) => setFlash(session, category, message, metadata),
        success: (message, metadata) => setFlashSuccess(session, message, metadata),
        error: (message, metadata) => setFlashError(session, message, metadata),
        warning: (message, metadata) => setFlashWarning(session, message, metadata),
        info: (message, metadata) => setFlashInfo(session, message, metadata),
        get: () => getFlashMessages(session),
        getByCategory: (category) => getFlashMessagesByCategory(session, category),
        peek: () => peekFlashMessages(session),
        clear: () => clearFlashMessages(session),
        has: () => hasFlashMessages(session),
    };
}
/**
 * Serialize flash messages for client hydration
 */
export function serializeFlashMessages(messages) {
    return JSON.stringify(messages);
}
/**
 * Deserialize flash messages from JSON
 */
export function deserializeFlashMessages(json) {
    try {
        return JSON.parse(json);
    }
    catch {
        return [];
    }
}
/**
 * Flash message middleware for automatic injection
 */
export function flashMiddleware(sessionStorage) {
    return async (request, next) => {
        const session = await sessionStorage.getSession(request);
        // Process the request
        const response = await next();
        // Commit session with flash messages
        const setCookie = await sessionStorage.commitSession(session);
        // Add Set-Cookie header
        const headers = new Headers(response.headers);
        headers.append('Set-Cookie', setCookie);
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
    };
}
//# sourceMappingURL=flash.js.map