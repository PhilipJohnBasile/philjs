/**
 * PhilJS Session Management
 *
 * Server-side session handling with multiple storage backends.
 */
import { createSignedCookie, verifySignedCookie, serializeCookie, parseCookies } from './cookies';
/**
 * Create a session storage
 */
export function createSessionStorage(options) {
    const { cookie: cookieOptions, createData, readData, updateData, deleteData } = options;
    return {
        async getSession(request) {
            const cookies = parseCookies(request.headers.get('cookie') || '');
            const signedSessionId = cookies[cookieOptions.cookieName || 'session'];
            let sessionId = null;
            let data = {};
            if (signedSessionId) {
                sessionId = verifySignedCookie(signedSessionId, cookieOptions.secret);
                if (sessionId) {
                    const storedData = await readData(sessionId);
                    if (storedData) {
                        data = storedData;
                    }
                }
            }
            const flashData = {};
            return createSession(sessionId || generateSessionId(), data, flashData);
        },
        async commitSession(session) {
            if (session.id) {
                await updateData(session.id, session.data);
            }
            else {
                const newId = await createData(session.data);
                session.id = newId;
            }
            const signedId = createSignedCookie(cookieOptions.cookieName || 'session', session.id, cookieOptions.secret);
            return serializeCookie(cookieOptions.cookieName || 'session', signedId, {
                path: cookieOptions.cookie?.path || '/',
                domain: cookieOptions.cookie?.domain,
                secure: cookieOptions.cookie?.secure ?? true,
                httpOnly: cookieOptions.cookie?.httpOnly ?? true,
                sameSite: cookieOptions.cookie?.sameSite || 'lax',
                maxAge: cookieOptions.cookie?.maxAge,
            });
        },
        async destroySession(session) {
            if (session.id) {
                await deleteData(session.id);
            }
            return serializeCookie(cookieOptions.cookieName || 'session', '', {
                path: cookieOptions.cookie?.path || '/',
                maxAge: 0,
            });
        },
    };
}
/**
 * Create a cookie-based session storage (stateless)
 */
export function createCookieSessionStorage(options) {
    return {
        async getSession(request) {
            const cookies = parseCookies(request.headers.get('cookie') || '');
            const signedData = cookies[options.cookieName || 'session'];
            let data = {};
            if (signedData) {
                const rawData = verifySignedCookie(signedData, options.secret);
                if (rawData) {
                    try {
                        data = JSON.parse(rawData);
                    }
                    catch {
                        data = {};
                    }
                }
            }
            return createSession(generateSessionId(), data, {});
        },
        async commitSession(session) {
            const jsonData = JSON.stringify(session.data);
            const signedData = createSignedCookie(options.cookieName || 'session', jsonData, options.secret);
            return serializeCookie(options.cookieName || 'session', signedData, {
                path: options.cookie?.path || '/',
                domain: options.cookie?.domain,
                secure: options.cookie?.secure ?? true,
                httpOnly: options.cookie?.httpOnly ?? true,
                sameSite: options.cookie?.sameSite || 'lax',
                maxAge: options.cookie?.maxAge,
            });
        },
        async destroySession() {
            return serializeCookie(options.cookieName || 'session', '', {
                path: options.cookie?.path || '/',
                maxAge: 0,
            });
        },
    };
}
/**
 * Create a memory-based session storage (for development)
 */
export function createMemorySessionStorage(options) {
    const sessions = new Map();
    return createSessionStorage({
        cookie: options,
        async createData(data, expiresAt) {
            const id = generateSessionId();
            sessions.set(id, { data, expiresAt });
            return id;
        },
        async readData(id) {
            const session = sessions.get(id);
            if (!session)
                return null;
            if (session.expiresAt && session.expiresAt < new Date()) {
                sessions.delete(id);
                return null;
            }
            return session.data;
        },
        async updateData(id, data, expiresAt) {
            sessions.set(id, { data, expiresAt });
        },
        async deleteData(id) {
            sessions.delete(id);
        },
    });
}
/**
 * Helper to get session from storage
 */
export async function getSession(storage, request) {
    return storage.getSession(request);
}
/**
 * Helper to commit session
 */
export async function commitSession(storage, session) {
    return storage.commitSession(session);
}
/**
 * Helper to destroy session
 */
export async function destroySession(storage, session) {
    return storage.destroySession(session);
}
/**
 * Create a session object
 */
function createSession(id, data, flashData) {
    return {
        id,
        data,
        get(key) {
            return data[key];
        },
        set(key, value) {
            data[key] = value;
        },
        delete(key) {
            delete data[key];
        },
        has(key) {
            return key in data;
        },
        clear() {
            for (const key of Object.keys(data)) {
                delete data[key];
            }
        },
        flash(key, value) {
            flashData[key] = value;
        },
        getFlash(key) {
            const value = flashData[key];
            delete flashData[key];
            return value;
        },
    };
}
/**
 * Generate a random session ID
 */
function generateSessionId() {
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
//# sourceMappingURL=session.js.map