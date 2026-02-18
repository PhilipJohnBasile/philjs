/**
 * CSRF Protection
 */
const DEFAULT_COOKIE_NAME = '_csrf';
const DEFAULT_HEADER_NAME = 'x-csrf-token';
const DEFAULT_EXPIRY = 3600; // 1 hour
/**
 * Generate a CSRF token
 */
export async function generateCSRFToken(secret) {
    const timestamp = Date.now().toString(36);
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    const random = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const data = `${timestamp}:${random}`;
    const signature = await sign(data, secret);
    return `${data}:${signature}`;
}
/**
 * Validate a CSRF token
 */
export async function validateCSRFToken(request, config) {
    const { secret, cookieName = DEFAULT_COOKIE_NAME, headerName = DEFAULT_HEADER_NAME, expiry = DEFAULT_EXPIRY, ignorePaths = [] } = config;
    // Check if path should be ignored
    const url = new URL(request.url);
    if (ignorePaths.some(path => url.pathname.startsWith(path))) {
        return true;
    }
    // Get token from header or body
    const headerToken = request.headers.get(headerName);
    const cookieToken = getCookie(request, cookieName);
    const token = headerToken || cookieToken;
    if (!token)
        return false;
    // Parse token
    const parts = token.split(':');
    if (parts.length !== 3)
        return false;
    const [timestamp, random, signature] = parts;
    // Check expiry
    const tokenTime = parseInt(timestamp, 36);
    if (Date.now() - tokenTime > expiry * 1000)
        return false;
    // Verify signature
    const data = `${timestamp}:${random}`;
    const expectedSignature = await sign(data, secret);
    return signature === expectedSignature;
}
/**
 * Create CSRF cookie header
 */
export async function createCSRFCookie(secret, cookieName = DEFAULT_COOKIE_NAME) {
    const token = await generateCSRFToken(secret);
    return `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Secure`;
}
// Helper
function getCookie(request, name) {
    const cookies = request.headers.get('cookie');
    if (!cookies)
        return null;
    const match = cookies.match(new RegExp(`${name}=([^;]+)`));
    return match ? match[1] ?? null : null;
}
async function sign(data, secret) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}
//# sourceMappingURL=csrf.js.map