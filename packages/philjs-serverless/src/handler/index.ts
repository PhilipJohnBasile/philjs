/**
 * PhilJS Serverless Handler
 *
 * Handler creation and middleware utilities.
 */

export {
  createHandler,
  createTypedHandler,
  createEdgeHandler,
  createLambdaHandler,
} from './create-handler.js';

export {
  createContext,
  createPlatformContext,
  detectPlatform,
  getPlatformVersion,
  getRegion,
  isColdStart,
  getColdStartDuration,
  markWarm,
  initColdStartTracking,
  resetColdStartTracking,
  getPendingTasks,
  clearPendingTasks,
  waitForTasks,
} from './context.js';

export {
  compose,
  cors,
  logger,
  timeout,
  requestId,
  securityHeaders,
  compress,
  cacheControl,
  etag,
  rateLimit,
} from './middleware.js';
