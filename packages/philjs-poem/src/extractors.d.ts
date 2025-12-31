/**
 * PhilJS Poem Extractors
 *
 * Extractors for the Poem framework integration.
 * Poem has powerful built-in extractors that we extend for PhilJS use cases.
 */
import type { ExtractorContext, ExtractorResult, ExtractorDefinition } from './types.js';
/**
 * Base class for custom extractors
 */
export declare abstract class Extractor<T> {
    /** Extractor name */
    abstract readonly name: string;
    /** Extract value from request */
    abstract extract(ctx: ExtractorContext): ExtractorResult<T> | Promise<ExtractorResult<T>>;
    /** Generate Rust extractor implementation */
    abstract toRustCode(): string;
    /**
     * Create a successful result
     */
    protected ok(value: T): ExtractorResult<T>;
    /**
     * Create a failed result
     */
    protected err(error: string, status?: number): ExtractorResult<T>;
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
 * SSR Context Extractor - extracts SSR-relevant request data
 */
export declare class SSRContextExtractor extends Extractor<SSRContextData> {
    readonly name = "SSRContext";
    extract(ctx: ExtractorContext): ExtractorResult<SSRContextData>;
    private detectBot;
    private detectMobile;
    private parseAcceptLanguage;
    toRustCode(): string;
}
/**
 * JSON body extractor configuration
 */
export interface JsonExtractorConfig {
    /** Maximum body size in bytes */
    maxSize?: number;
    /** Strict content type check */
    strictContentType?: boolean;
}
/**
 * JSON Body Extractor with validation
 */
export declare class JsonExtractor<T> extends Extractor<T> {
    readonly name = "Json";
    private config;
    constructor(config?: JsonExtractorConfig);
    extract(ctx: ExtractorContext): ExtractorResult<T>;
    toRustCode(): string;
}
/**
 * Query parameters extractor configuration
 */
export interface QueryExtractorConfig {
    /** Required parameters */
    required?: string[];
    /** Default values */
    defaults?: Record<string, string>;
}
/**
 * Query Parameters Extractor
 */
export declare class QueryExtractor<T extends Record<string, string>> extends Extractor<T> {
    readonly name = "Query";
    private config;
    constructor(config?: QueryExtractorConfig);
    extract(ctx: ExtractorContext): ExtractorResult<T>;
    toRustCode(): string;
}
/**
 * Path Parameters Extractor
 */
export declare class PathExtractor<T> extends Extractor<T> {
    readonly name = "Path";
    private paramNames;
    constructor(...paramNames: string[]);
    extract(ctx: ExtractorContext): ExtractorResult<T>;
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
 * Auth Extractor configuration
 */
export interface AuthExtractorConfig {
    /** Required roles (any of) */
    roles?: string[];
    /** Required permissions (all of) */
    permissions?: string[];
    /** Optional - don't fail if no auth */
    optional?: boolean;
}
/**
 * Auth Extractor - extracts and validates authentication
 */
export declare class AuthExtractor extends Extractor<AuthUser | null> {
    readonly name = "Auth";
    private config;
    constructor(config?: AuthExtractorConfig);
    extract(ctx: ExtractorContext): Promise<ExtractorResult<AuthUser | null>>;
    private parseAuthToken;
    toRustCode(): string;
}
/**
 * Form extractor configuration
 */
export interface FormExtractorConfig {
    /** Maximum body size in bytes */
    maxSize?: number;
    /** Strict content type check */
    strictContentType?: boolean;
}
/**
 * Form Data Extractor - extracts URL-encoded form data
 */
export declare class FormExtractor<T> extends Extractor<T> {
    readonly name = "Form";
    private config;
    constructor(config?: FormExtractorConfig);
    extract(ctx: ExtractorContext): ExtractorResult<T>;
    toRustCode(): string;
}
/**
 * Multipart form data with file upload support
 */
export interface MultipartFile {
    /** Field name */
    name: string;
    /** Original filename */
    filename: string;
    /** MIME content type */
    contentType: string;
    /** File size in bytes */
    size: number;
    /** File binary data */
    data: Uint8Array;
}
/**
 * Multipart extractor configuration
 */
export interface MultipartExtractorConfig {
    /** Maximum file size in bytes (default 10MB) */
    maxFileSize?: number;
    /** Maximum total size in bytes (default 50MB) */
    maxTotalSize?: number;
    /** Maximum number of files (default 10) */
    maxFiles?: number;
    /** Allowed MIME types (empty means all allowed) */
    allowedMimeTypes?: string[];
    /** Preserve original filename */
    preserveFilename?: boolean;
}
/**
 * Parsed multipart form data result
 */
export interface MultipartFormData {
    /** Text fields as key-value pairs */
    fields: Record<string, string | string[]>;
    /** Uploaded files */
    files: MultipartFile[];
}
/**
 * Multipart Form Extractor - extracts multipart/form-data with file uploads
 */
export declare class MultipartExtractor extends Extractor<MultipartFormData> {
    readonly name = "Multipart";
    private config;
    constructor(config?: MultipartExtractorConfig);
    extract(ctx: ExtractorContext): Promise<ExtractorResult<MultipartFormData>>;
    toRustCode(): string;
}
/**
 * Cookie Extractor
 */
export declare class CookieExtractor extends Extractor<Record<string, string>> {
    readonly name = "Cookie";
    extract(ctx: ExtractorContext): ExtractorResult<Record<string, string>>;
    toRustCode(): string;
}
/**
 * Header Extractor
 */
export declare class HeaderExtractor extends Extractor<string | null> {
    readonly name = "Header";
    private headerName;
    private required;
    constructor(headerName: string, required?: boolean);
    extract(ctx: ExtractorContext): ExtractorResult<string | null>;
    toRustCode(): string;
}
/**
 * Application Data/State Extractor
 */
export declare class DataExtractor<T> extends Extractor<T> {
    readonly name = "Data";
    extract(ctx: ExtractorContext): ExtractorResult<T>;
    toRustCode(): string;
}
/**
 * Create a custom extractor from a function
 */
export declare function createExtractor<T>(name: string, extract: (ctx: ExtractorContext) => ExtractorResult<T> | Promise<ExtractorResult<T>>): ExtractorDefinition<T>;
/**
 * Create an SSR context extractor
 */
export declare function ssrContext(): SSRContextExtractor;
/**
 * Create a JSON body extractor
 */
export declare function json<T>(config?: JsonExtractorConfig): JsonExtractor<T>;
/**
 * Create a query params extractor
 */
export declare function query<T extends Record<string, string>>(config?: QueryExtractorConfig): QueryExtractor<T>;
/**
 * Create an auth extractor
 */
export declare function auth(config?: AuthExtractorConfig): AuthExtractor;
/**
 * Create an optional auth extractor
 */
export declare function optionalAuth(): AuthExtractor;
//# sourceMappingURL=extractors.d.ts.map