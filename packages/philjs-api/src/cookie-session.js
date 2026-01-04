/**
 * PhilJS Enhanced Cookie Sessions
 *
 * Secure cookie-based sessions with signing, encryption, rotation, and CSRF protection.
 */
import { createHmac, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { serializeCookie, parseCookies } from './cookies.js';
/**
 * Create enhanced cookie-based session storage
 */
export function createCookieSessionStorage(options) {
    const { name = 'session', secret, encryptionSecret, path = '/', domain, secure = true, httpOnly = true, sameSite = 'lax', maxAge, rotate = false, rotateInterval = 3600, // 1 hour default
    csrf = true, csrfFieldName = 'csrf_token', } = options;
    // Validate secrets
    if (secret.length < 32) {
        throw new Error('Session secret must be at least 32 characters long');
    }
    if (encryptionSecret && encryptionSecret.length < 32) {
        throw new Error('Encryption secret must be at least 32 characters long');
    }
    /**
     * Encrypt data
     */
    function encrypt(data) {
        if (!encryptionSecret)
            return data;
        const iv = randomBytes(16);
        const key = deriveKey(encryptionSecret);
        const cipher = createCipheriv('aes-256-gcm', key, iv);
        let encrypted = cipher.update(data, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        const authTag = cipher.getAuthTag();
        // Format: iv.authTag.encrypted
        return `${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted}`;
    }
    /**
     * Decrypt data
     */
    function decrypt(encryptedData) {
        if (!encryptionSecret)
            return encryptedData;
        try {
            const [ivB64, authTagB64, encrypted] = encryptedData.split('.');
            if (!ivB64 || !authTagB64 || !encrypted)
                return null;
            const iv = Buffer.from(ivB64, 'base64');
            const authTag = Buffer.from(authTagB64, 'base64');
            const key = deriveKey(encryptionSecret);
            const decipher = createDecipheriv('aes-256-gcm', key, iv);
            decipher.setAuthTag(authTag);
            let decrypted = decipher.update(encrypted, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch {
            return null;
        }
    }
    /**
     * Sign data
     */
    function sign(data) {
        const signature = createHmac('sha256', secret).update(data).digest('base64url');
        return `${data}.${signature}`;
    }
    /**
     * Verify and unsign data
     */
    function unsign(signedData) {
        const lastDotIndex = signedData.lastIndexOf('.');
        if (lastDotIndex === -1)
            return null;
        const data = signedData.slice(0, lastDotIndex);
        const signature = signedData.slice(lastDotIndex + 1);
        const expectedSignature = createHmac('sha256', secret).update(data).digest('base64url');
        // Timing-safe comparison
        if (signature.length !== expectedSignature.length)
            return null;
        if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature)))
            return null;
        return data;
    }
    /**
     * Serialize session data
     */
    function serialize(sessionData) {
        const json = JSON.stringify(sessionData);
        const encrypted = encrypt(json);
        const signed = sign(encrypted);
        return signed;
    }
    /**
     * Deserialize session data
     */
    function deserialize(cookieValue) {
        const unsigned = unsign(cookieValue);
        if (!unsigned)
            return null;
        const decrypted = decrypt(unsigned);
        if (!decrypted)
            return null;
        try {
            return JSON.parse(decrypted);
        }
        catch {
            return null;
        }
    }
    /**
     * Check if session needs rotation
     */
    function needsRotation(sessionData) {
        if (!rotate)
            return false;
        const lastRotation = sessionData.rotatedAt || sessionData.createdAt;
        const elapsed = (Date.now() - lastRotation) / 1000;
        return elapsed > rotateInterval;
    }
    /**
     * Create session object
     */
    function createSession(sessionData) {
        return {
            id: generateSessionId(),
            data: sessionData.data,
            get(key) {
                return sessionData.data[key];
            },
            set(key, value) {
                sessionData.data[key] = value;
            },
            delete(key) {
                delete sessionData.data[key];
            },
            has(key) {
                return key in sessionData.data;
            },
            clear() {
                sessionData.data = {};
            },
            flash(key, value) {
                // Flash implementation can use a special key
                sessionData.data[`__flash_${String(key)}`] = value;
            },
            getFlash(key) {
                const flashKey = `__flash_${String(key)}`;
                const value = sessionData.data[flashKey];
                delete sessionData.data[flashKey];
                return value;
            },
        };
    }
    // Implementation
    const storage = {
        async getSession(request) {
            const cookies = parseCookies(request.headers.get('cookie') || '');
            const cookieValue = cookies[name];
            let sessionData;
            if (cookieValue) {
                const deserialized = deserialize(cookieValue);
                if (deserialized) {
                    sessionData = deserialized;
                }
                else {
                    // Invalid/tampered session, create new
                    sessionData = createInitialSessionData();
                }
            }
            else {
                sessionData = createInitialSessionData();
            }
            return createSession(sessionData);
        },
        async commitSession(session) {
            const sessionData = {
                data: session.data,
                createdAt: Date.now(),
                rotatedAt: Date.now(),
            };
            if (csrf) {
                sessionData.csrfToken = generateCSRFToken();
            }
            // Rotate if needed
            if (needsRotation(sessionData)) {
                storage.rotateSession(session);
            }
            const serialized = serialize(sessionData);
            const cookieOpts = {
                path,
                secure,
                httpOnly,
                sameSite,
            };
            if (domain !== undefined) {
                cookieOpts.domain = domain;
            }
            if (maxAge !== undefined) {
                cookieOpts.maxAge = maxAge;
            }
            return serializeCookie(name, serialized, cookieOpts);
        },
        async destroySession() {
            return serializeCookie(name, '', {
                path,
                maxAge: 0,
            });
        },
        async verifyCSRF(request, token) {
            if (!csrf)
                return true;
            const session = await storage.getSession(request);
            const cookies = parseCookies(request.headers.get('cookie') || '');
            const cookieValue = cookies[name];
            if (!cookieValue)
                return false;
            const sessionData = deserialize(cookieValue);
            if (!sessionData || !sessionData.csrfToken)
                return false;
            return timingSafeEqual(Buffer.from(token), Buffer.from(sessionData.csrfToken));
        },
        generateCSRF(session) {
            if (!csrf) {
                throw new Error('CSRF protection is not enabled');
            }
            return generateCSRFToken();
        },
        rotateSession(session) {
            // Create new session with rotated timestamp
            // This is called automatically during commit if rotation is enabled
            session.rotatedAt = Date.now();
        },
    };
    return storage;
}
/**
 * Create initial session data
 */
function createInitialSessionData() {
    return {
        data: {},
        createdAt: Date.now(),
    };
}
/**
 * Generate CSRF token
 */
function generateCSRFToken() {
    return randomBytes(32).toString('base64url');
}
/**
 * Generate session ID
 */
function generateSessionId() {
    return randomBytes(32).toString('hex');
}
/**
 * Derive encryption key from secret
 */
function deriveKey(secret) {
    return createHmac('sha256', secret).update('encryption').digest();
}
/**
 * Timing-safe comparison
 */
function timingSafeEqual(a, b) {
    if (a.length !== b.length)
        return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a[i] ^ b[i];
    }
    return result === 0;
}
/**
 * CSRF middleware
 */
export function csrfMiddleware(storage) {
    return async (request, next) => {
        // Only check CSRF for state-changing methods
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
            const token = request.headers.get('X-CSRF-Token') ||
                request.headers.get('X-Requested-With');
            if (!token) {
                return new Response('CSRF token missing', { status: 403 });
            }
            const isValid = await storage.verifyCSRF(request, token);
            if (!isValid) {
                return new Response('CSRF token invalid', { status: 403 });
            }
        }
        return next();
    };
}
/**
 * Session rotation middleware
 */
export function sessionRotationMiddleware(storage) {
    return async (request, next) => {
        const session = await storage.getSession(request);
        // Rotate session
        storage.rotateSession(session);
        const response = await next();
        // Commit rotated session
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
//# sourceMappingURL=cookie-session.js.map