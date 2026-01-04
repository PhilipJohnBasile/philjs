/**
 * Cloudflare Workers Adapter
 */

export interface CloudflareEnv {
  [key: string]: unknown;
}

export interface CloudflareExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

export interface CloudflareWorker {
  fetch(
    request: Request,
    env: CloudflareEnv,
    ctx: CloudflareExecutionContext
  ): Promise<Response>;
}

/**
 * Create a Cloudflare Worker handler
 */
export function createCloudflareHandler(
  handler: (request: Request) => Promise<Response>
): CloudflareWorker {
  return {
    async fetch(request, _env, _ctx) {
      return handler(request);
    },
  };
}

/**
 * Get Cloudflare request metadata
 */
export function getCloudflareMetadata(request: Request) {
  const cf = (request as any).cf;
  return {
    country: cf?.country,
    city: cf?.city,
    region: cf?.region,
    latitude: cf?.latitude,
    longitude: cf?.longitude,
    timezone: cf?.timezone,
    colo: cf?.colo,
    asn: cf?.asn,
  };
}

/**
 * Create a Durable Object stub
 */
export function createDurableObjectStub<T extends object>(
  namespace: unknown,
  id: string
): T {
  const ns = namespace as { idFromName(name: string): unknown; get(id: unknown): T };
  const durableId = ns.idFromName(id);
  return ns.get(durableId);
}