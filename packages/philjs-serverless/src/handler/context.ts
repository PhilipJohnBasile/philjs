/**
 * PhilJS Serverless Context
 *
 * Creates and manages the serverless request context.
 */

import type {
  ServerlessContext,
  PlatformContext,
  Platform,
  ExecutionContext,
} from '../types.js';

/**
 * Cold start tracking state
 */
let coldStartTime: number | null = null;
let isFirstRequest = true;

/**
 * Initialize cold start tracking
 */
export function initColdStartTracking(): void {
  if (coldStartTime === null) {
    coldStartTime = Date.now();
  }
}

/**
 * Mark as warm (call after first request)
 */
export function markWarm(): void {
  isFirstRequest = false;
}

/**
 * Check if this is a cold start
 */
export function isColdStart(): boolean {
  return isFirstRequest;
}

/**
 * Get cold start duration in milliseconds
 */
export function getColdStartDuration(): number | undefined {
  if (coldStartTime !== null && isFirstRequest) {
    return Date.now() - coldStartTime;
  }
  return undefined;
}

/**
 * Reset cold start tracking (for testing)
 */
export function resetColdStartTracking(): void {
  coldStartTime = null;
  isFirstRequest = true;
}

/**
 * Detect the current platform
 */
export function detectPlatform(): Platform {
  // Check environment variables first (most reliable)
  if (typeof process !== 'undefined' && process.env) {
    if (process.env['VERCEL']) {
      return 'vercel';
    }
    if (process.env['NETLIFY']) {
      return 'netlify';
    }
    if (process.env['AWS_LAMBDA_FUNCTION_NAME'] || process.env['AWS_EXECUTION_ENV']) {
      return 'lambda';
    }
    if (process.env['CF_PAGES'] || process.env['CLOUDFLARE_WORKERS']) {
      return 'cloudflare';
    }
  }

  // Check for Bun runtime
  if (typeof globalThis !== 'undefined' && 'Bun' in globalThis) {
    return 'bun';
  }

  // Check for Deno runtime
  if (typeof globalThis !== 'undefined' && 'Deno' in globalThis) {
    return 'deno';
  }

  // Check for Edge Runtime
  if (typeof globalThis !== 'undefined' && (globalThis as any).EdgeRuntime !== undefined) {
    return 'edge';
  }

  // Check for Cloudflare Workers (no navigator, no process, has caches)
  if (
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as any).caches !== 'undefined' &&
    typeof (globalThis as any).navigator === 'undefined' &&
    typeof process === 'undefined'
  ) {
    return 'cloudflare';
  }

  // Check for Node.js
  if (
    typeof process !== 'undefined' &&
    process.versions &&
    process.versions.node
  ) {
    return 'node';
  }

  return 'unknown';
}

/**
 * Get platform version
 */
export function getPlatformVersion(platform: Platform): string | undefined {
  switch (platform) {
    case 'bun':
      return (globalThis as any).Bun?.version;
    case 'deno':
      return (globalThis as any).Deno?.version?.deno;
    case 'node':
      return typeof process !== 'undefined' ? process.versions?.node : undefined;
    default:
      return undefined;
  }
}

/**
 * Get region from environment
 */
export function getRegion(): string | undefined {
  if (typeof process === 'undefined' || !process.env) {
    return undefined;
  }

  // Vercel
  if (process.env['VERCEL_REGION']) {
    return process.env['VERCEL_REGION'];
  }

  // AWS
  if (process.env['AWS_REGION']) {
    return process.env['AWS_REGION'];
  }

  // Cloudflare
  if (process.env['CF_REGION']) {
    return process.env['CF_REGION'];
  }

  // Netlify
  if (process.env['AWS_REGION']) {
    return process.env['AWS_REGION'];
  }

  return undefined;
}

/**
 * Get remaining execution time (AWS Lambda specific)
 */
export function getRemainingTimeMs(awsContext?: { getRemainingTimeInMillis?: () => number }): number | undefined {
  if (awsContext?.getRemainingTimeInMillis) {
    return awsContext.getRemainingTimeInMillis();
  }
  return undefined;
}

/**
 * Create platform context
 */
export function createPlatformContext(
  options: {
    bindings?: Record<string, unknown>;
    executionContext?: ExecutionContext;
    customPlatform?: Platform;
    awsContext?: { getRemainingTimeInMillis?: () => number };
  } = {}
): PlatformContext {
  const platform = options.customPlatform ?? detectPlatform();
  const version = getPlatformVersion(platform);
  const region = getRegion();
  const coldStartDuration = getColdStartDuration();
  const remainingTimeMs = getRemainingTimeMs(options.awsContext);

  const result: PlatformContext = {
    platform,
    requestId: generateRequestId(),
    isColdStart: isColdStart(),
  };

  // Only add optional properties if they have values
  if (version !== undefined) {
    result.version = version;
  }
  if (region !== undefined) {
    result.region = region;
  }
  if (coldStartDuration !== undefined) {
    result.coldStartDuration = coldStartDuration;
  }
  if (remainingTimeMs !== undefined) {
    result.remainingTimeMs = remainingTimeMs;
  }
  if (options.bindings !== undefined) {
    result.bindings = options.bindings;
  }
  if (options.executionContext !== undefined) {
    result.executionContext = options.executionContext;
  }

  return result;
}

/**
 * Generate a request ID
 */
function generateRequestId(): string {
  // Try to get from environment first
  if (typeof process !== 'undefined' && process.env) {
    if (process.env['X_REQUEST_ID']) {
      return process.env['X_REQUEST_ID'];
    }
    if (process.env['AWS_REQUEST_ID']) {
      return process.env['AWS_REQUEST_ID'];
    }
  }

  // Generate a random ID
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback to timestamp-based ID
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Background tasks registry
 */
const backgroundTasks: Promise<unknown>[] = [];

/**
 * Create a serverless context from a Request
 */
export function createContext<State = Record<string, unknown>>(
  request: Request,
  options: {
    initialState?: State;
    platformContext?: PlatformContext;
    params?: Record<string, string>;
  } = {}
): ServerlessContext<State> {
  const url = new URL(request.url);
  const responseHeaders = new Headers();
  const startTime = Date.now();

  const platformContext = options.platformContext ?? createPlatformContext();

  const ctx: ServerlessContext<State> = {
    request,
    platform: platformContext,
    url,
    method: request.method,
    path: url.pathname,
    query: url.searchParams,
    params: options.params ?? {},
    headers: request.headers,
    state: (options.initialState ?? {}) as State,
    responseHeaders,
    startTime,

    setHeader(name: string, value: string): void {
      responseHeaders.set(name, value);
    },

    getHeader(name: string): string | null {
      return request.headers.get(name);
    },

    waitUntil(promise: Promise<unknown>): void {
      // If we have an execution context, use it
      if (platformContext.executionContext?.waitUntil) {
        platformContext.executionContext.waitUntil(promise);
      } else {
        // Otherwise, track it locally
        backgroundTasks.push(promise);
      }
    },

    getElapsedTime(): number {
      return Date.now() - startTime;
    },
  };

  return ctx;
}

/**
 * Get all pending background tasks
 */
export function getPendingTasks(): Promise<unknown>[] {
  return [...backgroundTasks];
}

/**
 * Clear pending background tasks
 */
export function clearPendingTasks(): void {
  backgroundTasks.length = 0;
}

/**
 * Wait for all background tasks to complete
 */
export async function waitForTasks(): Promise<void> {
  await Promise.allSettled(backgroundTasks);
  clearPendingTasks();
}
