/**
 * PhilJS Meta - Server Module
 *
 * Server middleware and API route exports
 */

// Middleware
export {
  createMiddlewareContext,
  MiddlewareChain,
  NextResponse,
  cors,
  auth,
  rateLimit,
  securityHeaders,
  logger,
  compression,
  bodyParser,
  type MiddlewareContext,
  type MiddlewareFunction,
  type MiddlewareResult,
  type GeoInfo,
  type RequestTiming,
  type CORSOptions,
  type AuthOptions,
  type RateLimitOptions,
  type RateLimitStore,
  type RateLimitInfo,
  type SecurityHeadersOptions,
  type LoggerOptions,
  type CompressionOptions,
  type BodyParserOptions,
} from './middleware';

// API Routes
export {
  createAPIRoute,
  defineAPIHandler,
  parseBody,
  APIResponse,
  SSE,
  z,
  type HttpMethod,
  type APIContext,
  type APIHandler,
  type APIRouteHandler,
  type RouteHandlerConfig,
  type Schema,
  type SchemaError,
  type SchemaIssue,
  type SSEStream,
  type SSEEvent,
  type ExtractParams,
  type JSONBody,
  type FormBody,
  type MultipartBody,
} from './api-routes';
