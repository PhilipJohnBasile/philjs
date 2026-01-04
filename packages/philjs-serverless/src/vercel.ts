/**
 * Vercel Adapter
 */

/**
 * Vercel handler configuration
 */
export interface VercelConfig {
  runtime?: 'nodejs' | 'edge';
  region?: string | string[];
  maxDuration?: number;
}

/**
 * Create a Vercel-optimized handler
 */
export function createVercelHandler(
  handler: (request: Request) => Promise<Response>,
  _config: VercelConfig = {}
) {
  return handler;
}

/**
 * Get Vercel request metadata
 */
export function getVercelMetadata(request: Request) {
  return {
    geo: {
      city: request.headers.get('x-vercel-ip-city') || undefined,
      country: request.headers.get('x-vercel-ip-country') || undefined,
      region: request.headers.get('x-vercel-ip-country-region') || undefined,
      latitude: request.headers.get('x-vercel-ip-latitude') || undefined,
      longitude: request.headers.get('x-vercel-ip-longitude') || undefined,
    },
    ip: request.headers.get('x-forwarded-for')?.split(',')[0] || undefined,
  };
}