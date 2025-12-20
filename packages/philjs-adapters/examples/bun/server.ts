/**
 * PhilJS Bun Server Example
 *
 * Run with: bun run server.ts
 */

import { createBunAdapter } from 'philjs-adapters/bun';

// Create the Bun adapter with configuration
const handler = createBunAdapter({
  port: 3000,
  hostname: '0.0.0.0',
  development: process.env.NODE_ENV !== 'production',
  staticDir: 'public',
  compression: true,

  // Enable WebSocket support
  websocket: {
    enabled: true,
    maxPayloadLength: 16 * 1024 * 1024, // 16MB
    idleTimeout: 120,
  },

  // Optional: SQLite database
  // sqlite: './data/app.db',

  // Optional: TLS for HTTPS
  // tls: {
  //   key: './certs/key.pem',
  //   cert: './certs/cert.pem',
  // },
});

// Export as default for Bun.serve compatibility
export default handler;

// Or start the server directly
// handler.start();
