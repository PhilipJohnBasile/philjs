/**
 * Subscription-specific middleware for philjs-rpc.
 * Provides auth checks, rate limiting, backpressure handling, and connection limits.
 */
import { RPCError as RPCErrorClass } from './types.js';
/**
 * Create authentication middleware for subscriptions.
 *
 * @example
 * ```ts
 * const authMiddleware = createSubscriptionAuthMiddleware({
 *   isAuthenticated: (ctx) => !!ctx.user,
 *   hasPermission: (ctx, path) => {
 *     if (path.startsWith('admin.')) {
 *       return ctx.user?.role === 'admin';
 *     }
 *     return true;
 *   },
 * });
 * ```
 */
export function createSubscriptionAuthMiddleware(options) {
    const { isAuthenticated, hasPermission, unauthorizedMessage = 'Unauthorized', unauthorizedCode = 'UNAUTHORIZED', } = options;
    return {
        onSubscribe: async (ctx, path) => {
            // Check authentication
            if (isAuthenticated) {
                const authenticated = await isAuthenticated(ctx);
                if (!authenticated) {
                    throw new RPCErrorClass({
                        code: unauthorizedCode,
                        message: unauthorizedMessage,
                    });
                }
            }
            // Check permissions
            if (hasPermission) {
                const permitted = await hasPermission(ctx, path);
                if (!permitted) {
                    throw new RPCErrorClass({
                        code: 'FORBIDDEN',
                        message: `No permission to subscribe to ${path}`,
                    });
                }
            }
        },
    };
}
/**
 * Create rate limiting middleware for subscriptions.
 *
 * @example
 * ```ts
 * const rateLimitMiddleware = createSubscriptionRateLimitMiddleware({
 *   maxSubscriptionsPerConnection: 10,
 *   maxSubscriptionsPerUser: 50,
 *   maxEventsPerSecond: 100,
 * });
 * ```
 */
export function createSubscriptionRateLimitMiddleware(options) {
    const { maxSubscriptionsPerConnection = 100, maxSubscriptionsPerUser = 500, maxEventsPerSecond = 1000, windowMs = 1000, getUserId = (ctx) => ctx.user, } = options;
    // Track subscriptions per connection
    const connectionSubscriptions = new Map();
    // Track subscriptions per user
    const userSubscriptions = new Map();
    // Track events per subscription
    const subscriptionEvents = new Map();
    return {
        onSubscribe: (ctx) => {
            // Check connection limit
            let connSubs = connectionSubscriptions.get(ctx.connectionId);
            if (!connSubs) {
                connSubs = new Set();
                connectionSubscriptions.set(ctx.connectionId, connSubs);
            }
            if (connSubs.size >= maxSubscriptionsPerConnection) {
                throw new RPCErrorClass({
                    code: 'TOO_MANY_REQUESTS',
                    message: `Maximum subscriptions per connection (${maxSubscriptionsPerConnection}) exceeded`,
                });
            }
            connSubs.add(ctx.subscriptionId);
            // Check user limit
            const userId = getUserId(ctx);
            if (userId) {
                let userSubs = userSubscriptions.get(userId);
                if (!userSubs) {
                    userSubs = new Set();
                    userSubscriptions.set(userId, userSubs);
                }
                if (userSubs.size >= maxSubscriptionsPerUser) {
                    throw new RPCErrorClass({
                        code: 'TOO_MANY_REQUESTS',
                        message: `Maximum subscriptions per user (${maxSubscriptionsPerUser}) exceeded`,
                    });
                }
                userSubs.add(ctx.subscriptionId);
            }
        },
        onData: (ctx, data) => {
            // Track event rate
            const now = Date.now();
            let events = subscriptionEvents.get(ctx.subscriptionId);
            if (!events) {
                events = [];
                subscriptionEvents.set(ctx.subscriptionId, events);
            }
            // Remove old events outside the window
            const windowStart = now - windowMs;
            const recentEvents = events.filter((timestamp) => timestamp > windowStart);
            subscriptionEvents.set(ctx.subscriptionId, recentEvents);
            // Check rate limit
            if (recentEvents.length >= maxEventsPerSecond) {
                throw new RPCErrorClass({
                    code: 'TOO_MANY_REQUESTS',
                    message: `Maximum events per second (${maxEventsPerSecond}) exceeded`,
                });
            }
            // Add current event
            recentEvents.push(now);
            return data;
        },
        onUnsubscribe: (ctx) => {
            // Clean up tracking
            connectionSubscriptions.get(ctx.connectionId)?.delete(ctx.subscriptionId);
            const userId = getUserId(ctx);
            if (userId) {
                userSubscriptions.get(userId)?.delete(ctx.subscriptionId);
            }
            subscriptionEvents.delete(ctx.subscriptionId);
        },
    };
}
/**
 * Create backpressure handling middleware for subscriptions.
 *
 * @example
 * ```ts
 * const backpressureMiddleware = createBackpressureMiddleware({
 *   maxBufferSize: 100,
 *   strategy: 'drop-oldest',
 *   onDrop: (ctx, data) => {
 *     console.log('Dropped event for subscription:', ctx.subscriptionId);
 *   },
 * });
 * ```
 */
export function createBackpressureMiddleware(options) {
    const { maxBufferSize = 1000, strategy = 'drop-oldest', onDrop, } = options;
    // Track buffer size per subscription
    const buffers = new Map();
    return {
        onData: (ctx, data) => {
            let buffer = buffers.get(ctx.subscriptionId);
            if (!buffer) {
                buffer = [];
                buffers.set(ctx.subscriptionId, buffer);
            }
            // Check buffer size
            if (buffer.length >= maxBufferSize) {
                switch (strategy) {
                    case 'drop-oldest': {
                        const dropped = buffer.shift();
                        if (onDrop) {
                            onDrop(ctx, dropped);
                        }
                        break;
                    }
                    case 'drop-newest': {
                        if (onDrop) {
                            onDrop(ctx, data);
                        }
                        return undefined; // Don't emit this event
                    }
                    case 'error': {
                        throw new RPCErrorClass({
                            code: 'PAYLOAD_TOO_LARGE',
                            message: `Subscription buffer full (${maxBufferSize} events)`,
                        });
                    }
                }
            }
            buffer.push(data);
            // Simulate async emission and buffer cleanup
            Promise.resolve().then(() => {
                const idx = buffer.indexOf(data);
                if (idx !== -1) {
                    buffer.splice(idx, 1);
                }
            });
            return data;
        },
        onUnsubscribe: (ctx) => {
            buffers.delete(ctx.subscriptionId);
        },
    };
}
/**
 * Create connection limit middleware.
 *
 * @example
 * ```ts
 * const connectionLimitMiddleware = createConnectionLimitMiddleware({
 *   maxConnections: 10000,
 *   maxConnectionsPerIp: 10,
 * });
 * ```
 */
export function createConnectionLimitMiddleware(options) {
    const { maxConnections = 10000, maxConnectionsPerIp = 100, getIp = (ctx) => ctx.clientIp, } = options;
    const connections = new Set();
    const ipConnections = new Map();
    return {
        onSubscribe: (ctx) => {
            // Check total connections
            if (connections.size >= maxConnections) {
                throw new RPCErrorClass({
                    code: 'TOO_MANY_REQUESTS',
                    message: `Maximum connections (${maxConnections}) reached`,
                });
            }
            // Check IP-based connections
            const ip = getIp(ctx);
            if (ip) {
                let ipConns = ipConnections.get(ip);
                if (!ipConns) {
                    ipConns = new Set();
                    ipConnections.set(ip, ipConns);
                }
                if (ipConns.size >= maxConnectionsPerIp) {
                    throw new RPCErrorClass({
                        code: 'TOO_MANY_REQUESTS',
                        message: `Maximum connections per IP (${maxConnectionsPerIp}) exceeded`,
                    });
                }
                ipConns.add(ctx.connectionId);
            }
            connections.add(ctx.connectionId);
        },
        onUnsubscribe: (ctx) => {
            connections.delete(ctx.connectionId);
            const ip = getIp(ctx);
            if (ip) {
                const ipConns = ipConnections.get(ip);
                if (ipConns) {
                    ipConns.delete(ctx.connectionId);
                    if (ipConns.size === 0) {
                        ipConnections.delete(ip);
                    }
                }
            }
        },
    };
}
/**
 * Create filtering middleware for subscriptions.
 *
 * @example
 * ```ts
 * const filterMiddleware = createSubscriptionFilterMiddleware({
 *   filter: (ctx, data) => {
 *     // Only send data if user has access
 *     return data.userId === ctx.user?.id;
 *   },
 * });
 * ```
 */
export function createSubscriptionFilterMiddleware(options) {
    const { filter } = options;
    return {
        onData: async (ctx, data) => {
            const shouldEmit = await filter(ctx, data);
            return shouldEmit ? data : undefined;
        },
    };
}
/**
 * Create multiplexing middleware to share subscriptions with the same input.
 *
 * @example
 * ```ts
 * const multiplexingMiddleware = createMultiplexingMiddleware({
 *   getKey: (input: any) => `room:${input.roomId}`,
 *   maxSubscriptionsPerKey: 1000,
 * });
 * ```
 */
export function createMultiplexingMiddleware(options) {
    const { getKey, maxSubscriptionsPerKey = 10000, } = options;
    const keySubscriptions = new Map();
    return {
        onSubscribe: (ctx, path, input) => {
            const key = getKey(input);
            let subs = keySubscriptions.get(key);
            if (!subs) {
                subs = new Set();
                keySubscriptions.set(key, subs);
            }
            if (subs.size >= maxSubscriptionsPerKey) {
                throw new RPCErrorClass({
                    code: 'TOO_MANY_REQUESTS',
                    message: `Maximum subscriptions for key "${key}" (${maxSubscriptionsPerKey}) exceeded`,
                });
            }
            subs.add(ctx.subscriptionId);
        },
        onUnsubscribe: (ctx) => {
            // We need to track the key for each subscription to clean up properly
            // This is a simplified implementation
            for (const [key, subs] of keySubscriptions) {
                if (subs.has(ctx.subscriptionId)) {
                    subs.delete(ctx.subscriptionId);
                    if (subs.size === 0) {
                        keySubscriptions.delete(key);
                    }
                    break;
                }
            }
        },
    };
}
// ============================================================================
// Middleware Composer
// ============================================================================
/**
 * Compose multiple subscription middlewares into one.
 *
 * @example
 * ```ts
 * const middleware = composeSubscriptionMiddleware([
 *   authMiddleware,
 *   rateLimitMiddleware,
 *   backpressureMiddleware,
 * ]);
 * ```
 */
export function composeSubscriptionMiddleware(middlewares) {
    return {
        onSubscribe: async (ctx, path, input) => {
            for (const middleware of middlewares) {
                if (middleware.onSubscribe) {
                    await middleware.onSubscribe(ctx, path, input);
                }
            }
        },
        onData: async (ctx, data) => {
            let result = data;
            for (const middleware of middlewares) {
                if (middleware.onData) {
                    const transformed = await middleware.onData(ctx, result);
                    if (transformed === undefined) {
                        return undefined; // Filtered out
                    }
                    result = transformed;
                }
            }
            return result;
        },
        onError: async (ctx, error) => {
            for (const middleware of middlewares) {
                if (middleware.onError) {
                    await middleware.onError(ctx, error);
                }
            }
        },
        onComplete: async (ctx) => {
            for (const middleware of middlewares) {
                if (middleware.onComplete) {
                    await middleware.onComplete(ctx);
                }
            }
        },
        onUnsubscribe: async (ctx) => {
            for (const middleware of middlewares) {
                if (middleware.onUnsubscribe) {
                    await middleware.onUnsubscribe(ctx);
                }
            }
        },
    };
}
//# sourceMappingURL=subscription-middleware.js.map