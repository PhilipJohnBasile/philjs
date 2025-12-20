/**
 * Complete Edge Worker Example
 *
 * This example demonstrates all edge middleware features:
 * - Security headers
 * - Geolocation and language detection
 * - A/B testing
 * - Edge caching
 * - URL rewrites and redirects
 *
 * Deploy to Cloudflare Workers, Vercel Edge, or Deno Deploy
 */

import {
  executeEdgeMiddleware,
  composeEdgeMiddleware,
  securityHeadersMiddleware,
  addHeadersMiddleware,
  type EdgeMiddleware,
} from 'philjs-api/edge-middleware';

import {
  redirectByCountry,
  languageDetectionMiddleware,
  localizedRedirectMiddleware,
} from 'philjs-api/geolocation';

import {
  abTestingMiddleware,
  variantRewriteMiddleware,
  createAnalyticsProvider,
} from 'philjs-api/edge-ab-testing';

import {
  edgeCacheMiddleware,
  cacheControlMiddleware,
  staticAssetCache,
  varyMiddleware,
} from 'philjs-api/edge-cache';

// ============================================================================
// Configuration
// ============================================================================

const SUPPORTED_LOCALES = ['en', 'fr', 'de', 'es', 'ja', 'zh'];
const DEFAULT_LOCALE = 'en';

const COUNTRY_REDIRECTS = {
  // UK and Ireland -> UK site
  'GB,IE': '/uk',
  // France, Belgium, Luxembourg -> French site
  'FR,BE,LU': '/fr',
  // Germany, Austria, Switzerland -> German site
  'DE,AT,CH': '/de',
  // Spain, Mexico, Argentina -> Spanish site
  'ES,MX,AR': '/es',
  // Japan -> Japanese site
  'JP': '/ja',
  // China, Taiwan, Singapore -> Chinese site
  'CN,TW,SG': '/zh',
};

// ============================================================================
// Analytics
// ============================================================================

const analytics = createAnalyticsProvider({
  endpoint: 'https://analytics.example.com/track',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE',
  },
});

// ============================================================================
// Experiments
// ============================================================================

const experiments = [
  {
    id: 'homepage-hero',
    name: 'Homepage Hero Test',
    variants: [
      { id: 'control', name: 'Control', weight: 50 },
      { id: 'new-hero', name: 'New Hero', weight: 50 },
    ],
    targeting: {
      urlPatterns: ['/', '/home'],
    },
    traffic: 100, // 100% of traffic
  },
  {
    id: 'pricing-page',
    name: 'Pricing Page Test',
    variants: [
      { id: 'control', name: 'Control', weight: 33 },
      { id: 'simple', name: 'Simplified', weight: 33 },
      { id: 'detailed', name: 'Detailed', weight: 34 },
    ],
    targeting: {
      urlPatterns: ['/pricing', '/pricing/*'],
      countries: ['US', 'CA', 'GB', 'AU'],
    },
    traffic: 50, // Only 50% of traffic
  },
  {
    id: 'checkout-flow',
    name: 'Checkout Flow Optimization',
    variants: [
      { id: 'control', name: 'Original', weight: 50 },
      { id: 'optimized', name: 'Optimized', weight: 50 },
    ],
    targeting: {
      urlPatterns: ['/checkout', '/checkout/*'],
    },
  },
];

// ============================================================================
// Middleware Stack
// ============================================================================

const middleware = composeEdgeMiddleware(
  // 1. Security Headers (always first)
  securityHeadersMiddleware({
    csp: "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.example.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.googleapis.com;",
    hsts: true,
    nosniff: true,
    xssProtection: true,
    frameOptions: 'DENY',
  }),

  // 2. Custom Headers
  addHeadersMiddleware({
    'X-Powered-By': 'PhilJS',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  }),

  // 3. Country-based Redirects (before language detection)
  redirectByCountry(COUNTRY_REDIRECTS, {
    status: 302, // Temporary redirects
    exclude: ['/api/*', '/_next/*', '/static/*'],
  }),

  // 4. Language Detection
  languageDetectionMiddleware({
    cookieName: 'preferred-language',
    headerName: 'X-Detected-Language',
  }),

  // 5. Localized Routing
  localizedRedirectMiddleware({
    supportedLocales: SUPPORTED_LOCALES,
    defaultLocale: DEFAULT_LOCALE,
    cookieName: 'locale',
  }),

  // 6. A/B Testing
  abTestingMiddleware({
    experiments,
    onAssignment: async (assignment, context) => {
      // Track new assignments
      await analytics.trackExperiment(assignment, context);
    },
  }),

  // 7. Variant-based Rewrites
  variantRewriteMiddleware('homepage-hero', {
    'control': '/home-v1',
    'new-hero': '/home-v2',
  }),

  variantRewriteMiddleware('pricing-page', {
    'control': '/pricing-control',
    'simple': '/pricing-simple',
    'detailed': '/pricing-detailed',
  }),

  variantRewriteMiddleware('checkout-flow', {
    'control': '/checkout-original',
    'optimized': '/checkout-optimized',
  }),

  // 8. Static Asset Caching (before general cache)
  staticAssetCache(),

  // 9. General Edge Caching
  edgeCacheMiddleware({
    ttl: 300, // 5 minutes
    swr: 3600, // 1 hour stale-while-revalidate
    vary: ['Cookie', 'Accept-Language'],
    tags: ['v1'],
  }),

  // 10. Cache-Control Headers
  cacheControlMiddleware({
    maxAge: 300,
    staleWhileRevalidate: 3600,
    visibility: 'public',
  }),

  // 11. Vary Headers
  varyMiddleware(['Accept-Language', 'Cookie'])
);

// ============================================================================
// Edge Worker Handler
// ============================================================================

/**
 * Cloudflare Workers
 */
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    return executeEdgeMiddleware(request, middleware, {
      platform: { env, ctx },
    });
  },
};

/**
 * Vercel Edge Function
 */
export const config = {
  runtime: 'edge',
};

export async function GET(request: Request) {
  return executeEdgeMiddleware(request, middleware);
}

/**
 * Deno Deploy
 */
async function handleRequest(request: Request): Promise<Response> {
  return executeEdgeMiddleware(request, middleware);
}

if (typeof Deno !== 'undefined') {
  Deno.serve(handleRequest);
}

// ============================================================================
// Advanced Examples
// ============================================================================

/**
 * Custom middleware for specific routes
 */
const apiMiddleware: EdgeMiddleware = async (context) => {
  const path = context.request.url.pathname;

  if (path.startsWith('/api/')) {
    // Add API-specific headers
    const response = await context.next();
    const headers = new Headers(response.headers);
    headers.set('X-API-Version', '2.0');
    headers.set('X-Rate-Limit', '1000');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return context.next();
};

/**
 * Authentication middleware
 */
const authMiddleware: EdgeMiddleware = async (context) => {
  const path = context.request.url.pathname;

  if (path.startsWith('/dashboard')) {
    const token = context.cookies.get('auth_token');

    if (!token) {
      return context.redirect('/login', 302);
    }

    // Validate token (simplified)
    // In production, verify JWT or session
  }

  return context.next();
};

/**
 * Rate limiting middleware
 */
const rateLimitMiddleware: EdgeMiddleware = async (context) => {
  const ip = context.request.ip || 'unknown';
  const key = `ratelimit:${ip}`;

  // In production, use KV or Redis
  // For now, just pass through
  return context.next();
};

/**
 * Bot detection middleware
 */
const botDetectionMiddleware: EdgeMiddleware = async (context) => {
  const userAgent = context.request.userAgent || '';
  const isBot = /bot|crawler|spider|crawling/i.test(userAgent);

  if (isBot) {
    // Serve cached version to bots
    const response = await context.next();
    const headers = new Headers(response.headers);
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    return new Response(response.body, {
      status: response.status,
      headers,
    });
  }

  return context.next();
};

/**
 * Complete middleware stack with all features
 */
export const completeMiddleware = composeEdgeMiddleware(
  // Security
  securityHeadersMiddleware({
    csp: "default-src 'self'",
    hsts: true,
  }),

  // Bot detection
  botDetectionMiddleware,

  // Rate limiting
  rateLimitMiddleware,

  // Authentication
  authMiddleware,

  // Geolocation
  redirectByCountry(COUNTRY_REDIRECTS),
  languageDetectionMiddleware(),

  // A/B Testing
  abTestingMiddleware({ experiments }),

  // API-specific handling
  apiMiddleware,

  // Caching
  staticAssetCache(),
  edgeCacheMiddleware({ ttl: 300, swr: 3600 }),
  cacheControlMiddleware({ maxAge: 300 })
);
