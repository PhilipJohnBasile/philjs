/**
 * PhilJS Security - CSRF Token Generation and Validation
 *
 * Uses Web Crypto API for secure token generation.
 */

/**
 * Generate a cryptographically secure random string
 */
function generateRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Fallback for environments without Web Crypto API
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytes;
}

/**
 * Convert bytes to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to bytes
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Generate HMAC-SHA256 signature using Web Crypto API
 */
async function generateHMAC(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    return bytesToHex(new Uint8Array(signature));
  }

  // Simple fallback hash (not cryptographically secure, use only for non-critical cases)
  let hash = 0;
  const combined = secret + data;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Verify HMAC-SHA256 signature using Web Crypto API
 */
async function verifyHMAC(data: string, signature: string, secret: string): Promise<boolean> {
  const expectedSignature = await generateHMAC(data, secret);

  // Timing-safe comparison
  if (expectedSignature.length !== signature.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < expectedSignature.length; i++) {
    result |= expectedSignature.charCodeAt(i) ^ signature.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Generate a CSRF token
 *
 * Creates a secure token consisting of:
 * - Random bytes (token data)
 * - HMAC signature for verification
 *
 * @param secret - Secret key for token signing
 * @param length - Length of the random portion (default: 32)
 * @returns Generated CSRF token
 *
 * @example
 * ```typescript
 * const token = await generateCSRFToken('my-secret-key');
 * // Use token in forms or headers
 * ```
 */
export async function generateCSRFToken(secret: string, length: number = 32): Promise<string> {
  if (!secret || secret.length < 16) {
    throw new Error('CSRF secret must be at least 16 characters');
  }

  // Generate random token data
  const randomBytes = generateRandomBytes(length);
  const tokenData = bytesToHex(randomBytes);

  // Add timestamp for optional expiration checking
  const timestamp = Date.now().toString(36);

  // Create the data to sign
  const dataToSign = `${tokenData}.${timestamp}`;

  // Generate HMAC signature
  const signature = await generateHMAC(dataToSign, secret);

  // Combine into final token: data.timestamp.signature
  return `${tokenData}.${timestamp}.${signature}`;
}

/**
 * Validate a CSRF token
 *
 * Verifies:
 * - Token format is valid
 * - HMAC signature is correct
 * - Token hasn't expired (optional)
 *
 * @param token - Token to validate
 * @param secret - Secret key used for token generation
 * @param maxAge - Maximum token age in milliseconds (optional)
 * @returns Whether the token is valid
 *
 * @example
 * ```typescript
 * const isValid = await validateCSRFToken(token, 'my-secret-key');
 * if (!isValid) {
 *   throw new Error('Invalid CSRF token');
 * }
 * ```
 */
export async function validateCSRFToken(
  token: string,
  secret: string,
  maxAge?: number
): Promise<boolean> {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  const [tokenData, timestamp, signature] = parts;

  if (!tokenData || !timestamp || !signature) {
    return false;
  }

  // Verify signature
  const dataToSign = `${tokenData}.${timestamp}`;
  const isValidSignature = await verifyHMAC(dataToSign, signature, secret);

  if (!isValidSignature) {
    return false;
  }

  // Check expiration if maxAge is provided
  if (maxAge !== undefined) {
    const tokenTime = parseInt(timestamp, 36);
    const now = Date.now();
    if (now - tokenTime > maxAge) {
      return false;
    }
  }

  return true;
}

/**
 * Generate a simple random token (without signature)
 *
 * Useful for one-time tokens or session IDs.
 *
 * @param length - Length of the token in bytes
 * @returns Random hex string
 *
 * @example
 * ```typescript
 * const sessionId = generateRandomToken(32);
 * ```
 */
export function generateRandomToken(length: number = 32): string {
  const bytes = generateRandomBytes(length);
  return bytesToHex(bytes);
}

/**
 * Create a token pair for double-submit cookie pattern
 *
 * Generates matching tokens for cookie and form/header.
 *
 * @param secret - Secret key for token signing
 * @returns Token pair with cookie and header values
 *
 * @example
 * ```typescript
 * const { cookieToken, headerToken } = await createTokenPair('my-secret');
 * // Set cookieToken in cookie
 * // Include headerToken in form/header
 * ```
 */
export async function createTokenPair(secret: string): Promise<{
  cookieToken: string;
  headerToken: string;
}> {
  const token = await generateCSRFToken(secret);
  return {
    cookieToken: token,
    headerToken: token,
  };
}

/**
 * Verify a token pair for double-submit cookie pattern
 *
 * @param cookieToken - Token from cookie
 * @param headerToken - Token from header/form
 * @param secret - Secret key for validation
 * @returns Whether the tokens match and are valid
 *
 * @example
 * ```typescript
 * const isValid = await verifyTokenPair(cookieToken, headerToken, 'my-secret');
 * ```
 */
export async function verifyTokenPair(
  cookieToken: string,
  headerToken: string,
  secret: string
): Promise<boolean> {
  // Both tokens must be present
  if (!cookieToken || !headerToken) {
    return false;
  }

  // Tokens must match (timing-safe comparison)
  if (cookieToken.length !== headerToken.length) {
    return false;
  }

  let matches = true;
  let result = 0;
  for (let i = 0; i < cookieToken.length; i++) {
    result |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i);
  }
  matches = result === 0;

  if (!matches) {
    return false;
  }

  // Validate the token itself
  return validateCSRFToken(cookieToken, secret);
}
