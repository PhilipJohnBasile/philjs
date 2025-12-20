/**
 * PhilJS Bun Advanced Server Example
 *
 * Demonstrates:
 * - WebSocket handling
 * - SQLite integration
 * - Hot reload
 *
 * Run with: bun run --hot server-advanced.ts
 */

import {
  createBunAdapter,
  createBunSQLite,
  onWebSocketMessage,
  onWebSocketOpen,
  onWebSocketClose,
} from 'philjs-adapters/bun';
import type { BunWebSocket } from 'philjs-adapters/bun';

// Initialize SQLite database
const db = createBunSQLite('./data/app.db');

// Create users table
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Connected WebSocket clients
const clients = new Set<BunWebSocket>();

// Create the handler
const handler = createBunAdapter({
  port: 3000,
  development: true,
  staticDir: 'public',
  compression: true,
  sqlite: './data/app.db',
  websocket: {
    enabled: true,
    maxPayloadLength: 1024 * 1024,
    idleTimeout: 60,
  },
});

// WebSocket: Handle new connections
onWebSocketOpen(handler, (ws) => {
  console.log('Client connected');
  clients.add(ws);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to PhilJS server',
    timestamp: Date.now(),
  }));
});

// WebSocket: Handle messages
onWebSocketMessage(handler, (ws, message) => {
  const data = typeof message === 'string' ? message : new TextDecoder().decode(message);

  try {
    const parsed = JSON.parse(data);

    switch (parsed.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;

      case 'broadcast':
        // Broadcast to all clients
        const broadcastMessage = JSON.stringify({
          type: 'broadcast',
          from: parsed.from || 'anonymous',
          message: parsed.message,
          timestamp: Date.now(),
        });

        for (const client of clients) {
          client.send(broadcastMessage);
        }
        break;

      case 'getUsers':
        // Query users from SQLite
        const users = db.query('SELECT * FROM users ORDER BY created_at DESC LIMIT 100');
        ws.send(JSON.stringify({ type: 'users', data: users }));
        break;

      case 'createUser':
        // Create a new user
        db.run(
          'INSERT INTO users (name, email) VALUES (?, ?)',
          [parsed.name, parsed.email]
        );
        ws.send(JSON.stringify({ type: 'userCreated', success: true }));
        break;

      default:
        ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
    }
  } catch (error) {
    console.error('Failed to parse message:', error);
    ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
  }
});

// WebSocket: Handle disconnections
onWebSocketClose(handler, (ws, code, reason) => {
  console.log(`Client disconnected: ${code} ${reason}`);
  clients.delete(ws);
});

// Start the server
const server = handler.start();

console.log(`
PhilJS Bun Server Started!

  HTTP:      http://localhost:${handler.port}
  WebSocket: ws://localhost:${handler.port}

Features:
  - Hot reload enabled (run with --hot flag)
  - SQLite database at ./data/app.db
  - WebSocket support enabled
  - Compression enabled

Press Ctrl+C to stop.
`);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  db.close();
  server.stop();
  process.exit(0);
});
