/**
 * PhilJS ISR Runtime Module
 *
 * Runtime utilities for serving ISR pages.
 */

// Cache
export {
  RuntimeCache,
  createRuntimeCache,
  type RuntimeCacheOptions,
  type CacheLookupResult,
} from './cache.js';

// Revalidation
export {
  RuntimeRevalidator,
  createRevalidator,
  createRevalidatePath,
  createRevalidateTag,
  type RevalidationOptions,
  type RevalidationResult,
  type RenderFunction,
} from './revalidate.js';

// Fallback handling
export {
  FallbackHandler,
  createFallbackHandler,
  createLoadingHtml,
  createNotFoundHtml,
  type FallbackHandlerOptions,
  type FallbackResult,
} from './fallback.js';

// Request handler
export {
  ISRHandler,
  createISRHandler,
  createFetchHandler,
  createExpressMiddleware,
  type ISRHandlerOptions,
} from './isr-handler.js';
