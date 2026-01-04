/**
 * JWT token handling utilities
 */
import type { JWTPayload, JWTConfig } from './types.js';
/**
 * JWT Manager class
 */
export declare class JWTManager {
    private config;
    constructor(config: JWTConfig);
    /**
     * Create a JWT token
     */
    create(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string>;
    /**
     * Verify and decode a JWT token
     */
    verify(token: string): Promise<JWTPayload>;
    /**
     * Decode token without verification (use carefully!)
     */
    decode(token: string): JWTPayload | null;
    /**
     * Check if token is expired without full verification
     */
    isExpired(token: string): boolean;
    /**
     * Get time until token expiration (in seconds)
     */
    getTimeToExpiry(token: string): number | null;
    /**
     * Refresh a token by creating a new one with the same payload
     */
    refresh(token: string): Promise<string>;
}
/**
 * Create a JWT manager instance
 */
export declare function createJWTManager(config: JWTConfig): JWTManager;
/**
 * Utility functions for common JWT operations
 */
/**
 * Quick token creation
 */
export declare function createToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, secret: string, expiresIn?: number): Promise<string>;
/**
 * Quick token verification
 */
export declare function verifyToken(token: string, secret: string): Promise<JWTPayload>;
/**
 * Quick token decode (no verification)
 */
export declare function decodeToken(token: string): JWTPayload | null;
//# sourceMappingURL=jwt.d.ts.map