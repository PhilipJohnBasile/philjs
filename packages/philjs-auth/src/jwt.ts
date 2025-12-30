/**
 * JWT token handling utilities
 */

import type { JWTPayload, JWTConfig } from './types.js';

const DEFAULT_CONFIG: Required<JWTConfig> = {
  secret: '',
  algorithm: 'HS256',
  expiresIn: 3600, // 1 hour
  issuer: 'philjs-auth',
  audience: ''
};

/**
 * Base64 URL encode
 */
function base64UrlEncode(str: string): string {
  if (typeof btoa !== 'undefined') {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
  // Node.js
  return Buffer.from(str, 'utf-8')
    .toString('base64url');
}

/**
 * Base64 URL decode
 */
function base64UrlDecode(str: string): string {
  if (typeof atob !== 'undefined') {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const pad = str.length % 4;
    if (pad) {
      return atob(base64 + '===='.substring(0, 4 - pad));
    }
    return atob(base64);
  }
  // Node.js
  return Buffer.from(str, 'base64url').toString('utf-8');
}

/**
 * Constant-time comparison to prevent timing attacks
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);

  if (bufA.length !== bufB.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < bufA.length; i++) {
    diff |= bufA[i]! ^ bufB[i]!;
  }

  return diff === 0;
}

/**
 * HMAC SHA-256 signing (browser-compatible)
 */
async function sign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const signatureArray = Array.from(new Uint8Array(signature));
  const signatureStr = String.fromCharCode(...signatureArray);

  return base64UrlEncode(signatureStr);
}

/**
 * JWT Manager class
 */
export class JWTManager {
  private config: Required<JWTConfig>;

  constructor(config: JWTConfig) {
    if (!config.secret) {
      throw new Error('JWT secret is required');
    }
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Create a JWT token
   */
  async create(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    const fullPayload = {
      ...payload,
      iat: now,
      exp: now + this.config.expiresIn!
    } as JWTPayload;

    if (this.config.issuer) {
      fullPayload['iss'] = this.config.issuer;
    }

    if (this.config.audience) {
      fullPayload['aud'] = this.config.audience;
    }

    const header = {
      alg: this.config.algorithm,
      typ: 'JWT'
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

    const data = `${encodedHeader}.${encodedPayload}`;
    const signature = await sign(data, this.config.secret);

    return `${data}.${signature}`;
  }

  /**
   * Verify and decode a JWT token
   */
  async verify(token: string): Promise<JWTPayload> {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [encodedHeader, encodedPayload, signature] = parts;

    // Verify signature using constant-time comparison to prevent timing attacks
    const data = `${encodedHeader!}.${encodedPayload!}`;
    const expectedSignature = await sign(data, this.config.secret);

    if (!constantTimeEqual(signature!, expectedSignature)) {
      throw new Error('Invalid token signature');
    }

    // Decode payload
    const payload: JWTPayload = JSON.parse(base64UrlDecode(encodedPayload!));

    // Check expiration
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      throw new Error('Token expired');
    }

    // Check issuer
    if (this.config.issuer && payload['iss'] !== this.config.issuer) {
      throw new Error('Invalid token issuer');
    }

    // Check audience
    if (this.config.audience && payload['aud'] !== this.config.audience) {
      throw new Error('Invalid token audience');
    }

    return payload;
  }

  /**
   * Decode token without verification (use carefully!)
   */
  decode(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(base64UrlDecode(parts[1]!));
      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Check if token is expired without full verification
   */
  isExpired(token: string): boolean {
    const payload = this.decode(token);
    if (!payload?.exp) return false;

    return Math.floor(Date.now() / 1000) > payload.exp;
  }

  /**
   * Get time until token expiration (in seconds)
   */
  getTimeToExpiry(token: string): number | null {
    const payload = this.decode(token);
    if (!payload?.exp) return null;

    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - now);
  }

  /**
   * Refresh a token by creating a new one with the same payload
   */
  async refresh(token: string): Promise<string> {
    const payload = await this.verify(token);

    // Remove JWT-specific claims
    const { iat, exp, iss, aud, ...userPayload } = payload;

    return this.create(userPayload);
  }
}

/**
 * Create a JWT manager instance
 */
export function createJWTManager(config: JWTConfig): JWTManager {
  return new JWTManager(config);
}

/**
 * Utility functions for common JWT operations
 */

/**
 * Quick token creation
 */
export async function createToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  secret: string,
  expiresIn = 3600
): Promise<string> {
  const manager = new JWTManager({ secret, expiresIn });
  return manager.create(payload);
}

/**
 * Quick token verification
 */
export async function verifyToken(
  token: string,
  secret: string
): Promise<JWTPayload> {
  const manager = new JWTManager({ secret });
  return manager.verify(token);
}

/**
 * Quick token decode (no verification)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(base64UrlDecode(parts[1]!));
  } catch {
    return null;
  }
}
