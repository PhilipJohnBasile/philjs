/**
 * PhilJS Deno Advanced Server Example
 *
 * Demonstrates:
 * - Deno KV for caching and state
 * - Permission checking
 * - Deno Deploy compatibility
 *
 * Run with:
 *   deno run --allow-net --allow-read --allow-env --unstable-kv server-advanced.ts
 *
 * Deploy to Deno Deploy:
 *   deployctl deploy --project=your-project server-advanced.ts
 */

import {
  createDenoAdapter,
  startDenoServer,
  createDenoKV,
  checkPermissions,
  isDenoDeply,
  getDenoDeployRegion,
} from 'philjs-adapters/deno';

// Check required permissions
const permissions = await checkPermissions();
console.log('Permissions:', permissions);

if (!permissions.net) {
  console.error('Network permission required. Run with --allow-net');
  Deno.exit(1);
}

// Check if running on Deno Deploy
if (isDenoDeply()) {
  const region = getDenoDeployRegion();
  console.log(`Running on Deno Deploy in region: ${region}`);
}

// Initialize Deno KV
const kv = await createDenoKV();

// Example: Rate limiting with KV
async function checkRateLimit(ip: string, limit = 100, windowMs = 60000): Promise<boolean> {
  const key = ['rate-limit', ip];
  const current = await kv.getWithTTL<{ count: number }>(key);

  if (!current) {
    await kv.setWithTTL(key, { count: 1 }, windowMs);
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  // Atomic increment
  const atomic = kv.atomic();
  await atomic
    .set(key, { count: current.count + 1 })
    .commit();

  return true;
}

// Example: Session management with KV
interface Session {
  userId: string;
  createdAt: number;
  data: Record<string, unknown>;
}

async function createSession(userId: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  const session: Session = {
    userId,
    createdAt: Date.now(),
    data: {},
  };

  await kv.setWithTTL(['sessions', sessionId], session, 24 * 60 * 60 * 1000); // 24 hours
  return sessionId;
}

async function getSession(sessionId: string): Promise<Session | null> {
  return kv.getWithTTL<Session>(['sessions', sessionId]);
}

// Example: Cache API responses
async function cachedFetch<T>(url: string, ttlMs = 300000): Promise<T> {
  const cacheKey = ['cache', 'fetch', url];
  const cached = await kv.getWithTTL<T>(cacheKey);

  if (cached) {
    console.log(`Cache hit: ${url}`);
    return cached;
  }

  console.log(`Cache miss: ${url}`);
  const response = await fetch(url);
  const data = await response.json() as T;

  await kv.setWithTTL(cacheKey, data, ttlMs);
  return data;
}

// Create the handler with rate limiting middleware
const baseHandler = createDenoAdapter({
  port: 8000,
  kv: true,
  compression: true,
  deploy: {
    project: 'philjs-demo',
    edgeCache: true,
  },
});

// Wrap with rate limiting
const handler = async (request: Request, info?: { remoteAddr: { hostname: string } }) => {
  const ip = info?.remoteAddr?.hostname || 'unknown';

  // Check rate limit
  const allowed = await checkRateLimit(ip);
  if (!allowed) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': '60',
      },
    });
  }

  // Add session handling for API routes
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) {
    const sessionId = request.headers.get('X-Session-ID');
    if (sessionId) {
      const session = await getSession(sessionId);
      if (!session) {
        return new Response('Invalid session', { status: 401 });
      }
    }
  }

  return baseHandler(request, info);
};

// Start the server
Deno.serve({
  port: 8000,
  hostname: '0.0.0.0',
  onListen: ({ hostname, port }) => {
    console.log(`
PhilJS Deno Server Started!

  HTTP: http://${hostname}:${port}

Features:
  - Deno KV enabled for caching and state
  - Rate limiting (100 requests/minute per IP)
  - Session management
  - Response caching
  - Compression enabled

${isDenoDeply() ? `Running on Deno Deploy (${getDenoDeployRegion()})` : 'Running locally'}

Press Ctrl+C to stop.
`);
  },
}, handler);

// Graceful shutdown (local only, Deno Deploy handles this automatically)
if (!isDenoDeply()) {
  Deno.addSignalListener('SIGINT', () => {
    console.log('\nShutting down...');
    kv.close();
    Deno.exit(0);
  });
}
