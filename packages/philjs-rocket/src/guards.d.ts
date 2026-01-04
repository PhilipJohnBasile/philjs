/**
 * PhilJS Rocket Guards
 *
 * Request guards for Rocket framework integration.
 * Guards validate incoming requests and extract typed data.
 */
import type { GuardContext, GuardOutcome, GuardDefinition } from './types.js';
/**
 * Base class for request guards
 */
export declare abstract class RequestGuard<T> {
    /** Guard name */
    abstract readonly name: string;
    /** Validate and extract from request */
    abstract validate(ctx: GuardContext): GuardOutcome<T> | Promise<GuardOutcome<T>>;
    /** Generate Rust guard implementation */
    abstract toRustCode(): string;
    /**
     * Create a successful outcome
     */
    protected success(value: T): GuardOutcome<T>;
    /**
     * Create a failed outcome
     */
    protected failure(error: string, status?: number): GuardOutcome<T>;
}
/**
 * SSR context data
 */
export interface SSRContextData {
    path: string;
    query: Record<string, string>;
    headers: Record<string, string>;
    userAgent: string | null;
    isBot: boolean;
    acceptLanguage: string[];
    isMobile: boolean;
    requestId: string;
}
/**
 * SSR Context Guard - extracts SSR-relevant request data
 */
export declare class SSRContextGuard extends RequestGuard<SSRContextData> {
    readonly name = "SSRContext";
    validate(ctx: GuardContext): GuardOutcome<SSRContextData>;
    private detectBot;
    private detectMobile;
    private parseAcceptLanguage;
    private generateRequestId;
    toRustCode(): string;
}
/**
 * Authenticated user data
 */
export interface AuthUser {
    id: string;
    email?: string;
    name?: string;
    roles: string[];
    permissions: string[];
    metadata?: Record<string, unknown>;
}
/**
 * Auth Guard configuration
 */
export interface AuthGuardConfig {
    /** Required roles (any of) */
    roles?: string[];
    /** Required permissions (all of) */
    permissions?: string[];
    /** Custom validation function */
    validate?: (user: AuthUser) => boolean;
    /** Redirect URL on failure */
    redirectUrl?: string;
}
/**
 * Auth Guard - validates authentication and authorization
 */
export declare class AuthGuard extends RequestGuard<AuthUser> {
    readonly name = "Auth";
    private config;
    constructor(config?: AuthGuardConfig);
    validate(ctx: GuardContext): Promise<GuardOutcome<AuthUser>>;
    private parseAuthToken;
    toRustCode(): string;
    /**
     * Create an admin-only guard
     */
    static admin(): AuthGuard;
    /**
     * Create a guard requiring specific roles
     */
    static withRoles(...roles: string[]): AuthGuard;
    /**
     * Create a guard requiring specific permissions
     */
    static withPermissions(...permissions: string[]): AuthGuard;
}
/**
 * CSRF Guard configuration
 */
export interface CSRFGuardConfig {
    /** Token header name */
    headerName?: string;
    /** Token cookie name */
    cookieName?: string;
    /** Excluded methods */
    excludeMethods?: string[];
    /** Excluded paths */
    excludePaths?: string[];
}
/**
 * CSRF Guard - validates CSRF tokens
 */
export declare class CSRFGuard extends RequestGuard<string> {
    readonly name = "CSRF";
    private config;
    constructor(config?: CSRFGuardConfig);
    validate(ctx: GuardContext): GuardOutcome<string>;
    toRustCode(): string;
}
/**
 * JSON Body Guard configuration
 */
export interface JsonBodyGuardConfig {
    /** Maximum body size in bytes */
    maxSize?: number;
    /** Content type validation */
    strictContentType?: boolean;
}
/**
 * JSON Body Guard - extracts and validates JSON request body
 */
export declare class JsonBodyGuard<T> extends RequestGuard<T> {
    readonly name = "JsonBody";
    private config;
    private schema?;
    constructor(config?: JsonBodyGuardConfig, schema?: object);
    validate(ctx: GuardContext): GuardOutcome<T>;
    toRustCode(): string;
}
/**
 * Form Data Guard - extracts form data
 */
export declare class FormDataGuard<T> extends RequestGuard<T> {
    readonly name = "FormData";
    private maxSize;
    constructor(maxSize?: number);
    validate(ctx: GuardContext): GuardOutcome<T>;
    toRustCode(): string;
}
/**
 * Path Guard - extracts typed path parameters
 */
export declare class PathGuard<T> extends RequestGuard<T> {
    readonly name = "Path";
    private paramName;
    constructor(paramName: string);
    validate(ctx: GuardContext): GuardOutcome<T>;
    toRustCode(): string;
}
/**
 * Query Guard configuration
 */
export interface QueryGuardConfig {
    /** Required parameters */
    required?: string[];
    /** Default values */
    defaults?: Record<string, string>;
}
/**
 * Query Guard - extracts and validates query parameters
 */
export declare class QueryGuard<T extends Record<string, string>> extends RequestGuard<T> {
    readonly name = "Query";
    private config;
    constructor(config?: QueryGuardConfig);
    validate(ctx: GuardContext): GuardOutcome<T>;
    toRustCode(): string;
}
/**
 * Create a custom guard from a validation function
 */
export declare function createGuard<T>(name: string, validate: (ctx: GuardContext) => GuardOutcome<T> | Promise<GuardOutcome<T>>): GuardDefinition<T>;
/**
 * Combine multiple guards
 */
export declare function combineGuards<T extends unknown[]>(...guards: {
    validate: (ctx: GuardContext) => GuardOutcome<unknown> | Promise<GuardOutcome<unknown>>;
}[]): (ctx: GuardContext) => Promise<GuardOutcome<T>>;
//# sourceMappingURL=guards.d.ts.map