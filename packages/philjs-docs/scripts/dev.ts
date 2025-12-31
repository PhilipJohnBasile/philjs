#!/usr/bin/env node
/**
 * PhilJS Docs Development Server
 * Hot-reloading dev server for documentation
 */

import { createServer } from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { WebSocketServer } from 'ws';
import chokidar from 'chokidar';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const PORT = Number(process.env.PORT ?? 3000);
const WS_PORT = 3001;

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

// Hot reload script to inject
const HOT_RELOAD_SCRIPT = `
<script>
(function() {
  const ws = new WebSocket('ws://localhost:${WS_PORT}');
  ws.onmessage = function(e) {
    if (e.data === 'reload') {
      location.reload();
    }
  };
  ws.onclose = function() {
    console.log('[PhilJS Docs] Dev server disconnected');
    setTimeout(() => location.reload(), 1000);
  };
})();
</script>
`;

const toErrorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));

// Build before starting
function runBuild(): Promise<void> {
  return new Promise((resolve, reject) => {
    const build = spawn('tsx', ['scripts/build.ts'], {
      cwd: ROOT,
      stdio: 'inherit',
    });
    build.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Build failed with code ${code}`));
    });
  });
}

// HTTP Server
async function startServer() {
  const server = createServer(async (req, res) => {
    let filePath = path.join(DIST, req.url === '/' ? 'index.html' : req.url);

    // Try adding .html extension
    try {
      await fs.access(filePath);
    } catch {
      if (!path.extname(filePath)) {
        filePath += '.html';
      }
    }

    // Try index.html for directories
    try {
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
    } catch {}

    try {
      let content = await fs.readFile(filePath);
      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      // Inject hot reload script into HTML
      if (ext === '.html') {
        content = content.toString().replace('</body>', `${HOT_RELOAD_SCRIPT}</body>`);
      }

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 - Not Found</h1>');
    }
  });

  server.listen(PORT, () => {
    console.log(`\n🚀 Dev server running at http://localhost:${PORT}\n`);
  });

  return server;
}

// WebSocket server for hot reload
function startWebSocketServer() {
  const wss = new WebSocketServer({ port: WS_PORT });

  wss.on('connection', (ws) => {
    console.log('[PhilJS Docs] Client connected for hot reload');
  });

  return wss;
}

// File watcher
function startWatcher(wss: WebSocketServer) {
  const watcher = chokidar.watch(path.join(ROOT, 'src'), {
    ignored: /node_modules/,
    persistent: true,
  });

  let debounce: NodeJS.Timeout | null = null;

  watcher.on('change', async (filePath) => {
    console.log(`[PhilJS Docs] File changed: ${path.relative(ROOT, filePath)}`);

    if (debounce) {
      clearTimeout(debounce);
    }
    debounce = setTimeout(async () => {
      try {
        await runBuild();
        // Notify all clients to reload
        wss.clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send('reload');
          }
        });
      } catch (err) {
        console.error('[PhilJS Docs] Build error:', toErrorMessage(err));
      }
    }, 100);
  });

  return watcher;
}

// Main
async function main() {
  console.log('Starting PhilJS Docs dev server...');

  try {
    await runBuild();
  } catch (err) {
    console.warn('Initial build failed, starting anyway:', toErrorMessage(err));
  }

  await startServer();
  const wss = startWebSocketServer();
  startWatcher(wss);

  console.log('Watching for changes...');
}

main().catch(console.error);
