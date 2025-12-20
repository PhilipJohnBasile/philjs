/**
 * PhilJS Deno Server Example
 *
 * Run with: deno run --allow-net --allow-read server.ts
 */

import { createDenoAdapter } from 'philjs-adapters/deno';

// Create the Deno adapter
const handler = createDenoAdapter({
  port: 8000,
  hostname: '0.0.0.0',
  staticDir: 'public',
  compression: true,

  // Enable Deno KV for caching
  kv: true,

  // Optional: Custom error handler
  onError: (error) => {
    console.error('Server error:', error);
    return new Response('Internal Server Error', { status: 500 });
  },
});

// Use Deno.serve directly
Deno.serve({
  port: 8000,
  hostname: '0.0.0.0',
  onListen: ({ hostname, port }) => {
    console.log(`PhilJS running on http://${hostname}:${port}`);
  },
}, handler);
