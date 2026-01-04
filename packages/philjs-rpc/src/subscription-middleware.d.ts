/**
 * Subscription-specific middleware for philjs-rpc.
 * Provides auth checks, rate limiting, backpressure handling, and connection limits.
 */
import type { ProcedureContext, RPCError } from './types.js';
export interface SubscriptionContext extends ProcedureContext {
    /** Subscription ID */
    subscriptionId: string;
    /** Connection ID */
    connectionId: string;
    /** Client IP address */
    clientIp?: string;
    /** User agent */
    userAgent?: string;
    /** Connection start time */
    connectedAt: number;
    /** Number of active subscriptions for this connection */
    activeSubscriptions: number;
}
export interface SubscriptionMiddleware<TContext = SubscriptionContext> {
    /** Called when a subscription is started */
    onSubscribe?: (ctx: TContext, path: string, input: unknown) => Promise<void> | void;
    /** Called when data is emitted */
    onData?: (ctx: TContext, data: unknown) => Promise<unknown> | unknown;
    /** Called when an error occurs */
    onError?: (ctx: TContext, error: RPCError) => Promise<void> | void;
    /** Called when a subscription is completed */
    onComplete?: (ctx: TContext) => Promise<void> | void;
    /** Called when a subscription is unsubscribed */
    onUnsubscribe?: (ctx: TContext) => Promise<void> | void;
}
export interface SubscriptionAuthOptions {
    /** Check if user is authenticated */
    isAuthenticated?: (ctx: SubscriptionContext) => boolean | Promise<boolean>;
    /** Check if user has permission for this subscription */
    hasPermission?: (ctx: SubscriptionContext, path: string) => boolean | Promise<boolean>;
    /** Custom error message */
    unauthorizedMessage?: string;
    /** Custom error code */
    unauthorizedCode?: string;
}
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
export declare function createSubscriptionAuthMiddleware(options: SubscriptionAuthOptions): SubscriptionMiddleware;
export interface SubscriptionRateLimitOptions {
    /** Maximum subscriptions per connection */
    maxSubscriptionsPerConnection?: number;
    /** Maximum subscriptions per user */
    maxSubscriptionsPerUser?: number;
    /** Maximum data events per second per subscription */
    maxEventsPerSecond?: number;
    /** Window size for rate limiting in ms */
    windowMs?: number;
    /** Get user identifier from context */
    getUserId?: (ctx: SubscriptionContext) => string | undefined;
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
export declare function createSubscriptionRateLimitMiddleware(options: SubscriptionRateLimitOptions): SubscriptionMiddleware;
export interface BackpressureOptions {
    /** Maximum buffer size for pending events */
    maxBufferSize?: number;
    /** Strategy when buffer is full */
    strategy?: 'drop-oldest' | 'drop-newest' | 'error';
    /** Callback when events are dropped */
    onDrop?: (ctx: SubscriptionContext, data: unknown) => void;
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
export declare function createBackpressureMiddleware(options: BackpressureOptions): SubscriptionMiddleware;
export interface ConnectionLimitOptions {
    /** Maximum total connections */
    maxConnections?: number;
    /** Maximum connections per IP */
    maxConnectionsPerIp?: number;
    /** Get IP from context */
    getIp?: (ctx: SubscriptionContext) => string | undefined;
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
export declare function createConnectionLimitMiddleware(options: ConnectionLimitOptions): SubscriptionMiddleware;
export interface SubscriptionFilterOptions<TData = unknown> {
    /** Filter function to determine if data should be emitted */
    filter: (ctx: SubscriptionContext, data: TData) => boolean | Promise<boolean>;
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
export declare function createSubscriptionFilterMiddleware<TData = unknown>(options: SubscriptionFilterOptions<TData>): SubscriptionMiddleware;
export interface MultiplexingOptions {
    /** Get multiplexing key from input */
    getKey: (input: unknown) => string;
    /** Maximum subscriptions per key */
    maxSubscriptionsPerKey?: number;
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
export declare function createMultiplexingMiddleware(options: MultiplexingOptions): SubscriptionMiddleware;
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
export declare function composeSubscriptionMiddleware(middlewares: SubscriptionMiddleware[]): SubscriptionMiddleware;
//# sourceMappingURL=subscription-middleware.d.ts.map