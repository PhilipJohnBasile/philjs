
// PhilJS Cloudflare Pages Worker
export default {
  async fetch(request, env, ctx) {
    const { handleRequest } = await import('@philjs/ssr');

    const url = new URL(request.url);

    const context = {
      url,
      method: request.method,
      headers: request.headers,
      body: request.body,
      params: {},
      platform: {
        name: 'cloudflare',
        edge: true,
        env, // Bindings (KV, D1, R2, etc.)
        ctx, // ExecutionContext
      },
    };

    try {
      return await handleRequest(context);
    } catch (error) {
      console.error('Request failed:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
