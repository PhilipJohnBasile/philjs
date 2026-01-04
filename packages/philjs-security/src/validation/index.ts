/**
 * PhilJS Security - Validation
 *
 * Input validation and rate limiting utilities.
 */

export {
  validateString,
  validateEmail,
  validateUrl,
  validateNumber,
  validateDate,
  validatePhone,
  validateJSON,
  patterns,
  sanitizeObject,
  createValidator,
  type ValidationResult,
} from './input-validation.js';

export {
  rateLimit,
  routeRateLimit,
  rateLimitPresets,
  userBasedKeyGenerator,
  MemoryStore,
  SlidingWindowStore,
} from './rate-limiting.js';
