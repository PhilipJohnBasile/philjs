// PhilJS Cloudflare Pages Example

export async function handleRequest(request: Request, env: Env) {
  const url = new URL(request.url);

  // KV Example
  if (url.pathname === '/cache') {
    const cached = await env.CACHE.get('example');
    if (cached) {
      return new Response(cached);
    }

    const data = `Cached at ${new Date().toISOString()}`;
    await env.CACHE.put('example', data, { expirationTtl: 60 });
    return new Response(data);
  }

  // D1 Example
  if (url.pathname === '/users') {
    const results = await env.DB.prepare('SELECT * FROM users LIMIT 10').all();
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // R2 Example
  if (url.pathname.startsWith('/uploads/')) {
    const key = url.pathname.slice('/uploads/'.length);
    const object = await env.UPLOADS.get(key);

    if (!object) {
      return new Response('Not Found', { status: 404 });
    }

    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }

  return new Response('PhilJS on Cloudflare Pages!');
}

interface Env {
  CACHE: KVNamespace;
  DB: D1Database;
  UPLOADS: R2Bucket;
}
