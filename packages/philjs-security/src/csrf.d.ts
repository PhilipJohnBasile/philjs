/**
 * CSRF Protection
 */
export interface CSRFConfig {
    /** Secret key for token generation */
    secret: string;
    /** Cookie name for token */
    cookieName?: string;
    /** Header name for token */
    headerName?: string;
    /** Token expiry in seconds */
    expiry?: number;
    /** Ignore paths */
    ignorePaths?: string[];
}
/**
 * Generate a CSRF token
 */
export declare function generateCSRFToken(secret: string): Promise<string>;
/**
 * Validate a CSRF token
 */
export declare function validateCSRFToken(request: Request, config: CSRFConfig): Promise<boolean>;
/**
 * Create CSRF cookie header
 */
export declare function createCSRFCookie(secret: string, cookieName?: string): Promise<string>;
