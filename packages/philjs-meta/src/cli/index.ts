#!/usr/bin/env node

/**
 * PhilJS Meta - CLI
 *
 * Command-line interface for the meta-framework with:
 * - dev - development server
 * - build - production build
 * - start - production server
 * - generate - static generation
 */

import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { createCompiler, createCompilerFromConfig } from '../build/compiler.js';
import { loadConfig } from '../config/index.js';
import { createFileRouter } from '../router/file-based.js';
import { MiddlewareChain, createMiddlewareContext } from '../server/middleware.js';

/**
 * CLI options
 */
export interface CLIOptions {
  /** Project root directory */
  root?: string;

  /** Port for dev/start server */
  port?: number;

  /** Host for dev/start server */
  host?: string;

  /** Enable verbose logging */
  verbose?: boolean;

  /** Config file path */
  config?: string;
}

/**
 * Development server options
 */
export interface DevServerOptions extends CLIOptions {
  /** Enable hot module replacement */
  hmr?: boolean;

  /** Open browser on start */
  open?: boolean;

  /** HTTPS options */
  https?: boolean | { key: string; cert: string };
}

/**
 * Build options from CLI
 */
export interface BuildCLIOptions extends CLIOptions {
  /** Enable minification */
  minify?: boolean;

  /** Generate source maps */
  sourcemap?: boolean;

  /** Analyze bundle */
  analyze?: boolean;
}

/**
 * Start server options
 */
export interface StartServerOptions extends CLIOptions {
  /** Enable clustering */
  cluster?: boolean;

  /** Number of workers */
  workers?: number;
}

/**
 * Generate options
 */
export interface GenerateOptions extends CLIOptions {
  /** Routes to generate (glob patterns) */
  routes?: string[];

  /** Output directory */
  outDir?: string;

  /** Fallback page */
  fallback?: boolean;
}

/**
 * Color utilities for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Logger utility
 */
const log = {
  info: (msg: string) => console.log(`${colors.blue}info${colors.reset}  - ${msg}`),
  success: (msg: string) => console.log(`${colors.green}ready${colors.reset} - ${msg}`),
  warn: (msg: string) => console.log(`${colors.yellow}warn${colors.reset}  - ${msg}`),
  error: (msg: string) => console.log(`${colors.red}error${colors.reset} - ${msg}`),
  event: (msg: string) => console.log(`${colors.magenta}event${colors.reset} - ${msg}`),
};

/**
 * Development server
 */
export async function dev(options: DevServerOptions = {}): Promise<void> {
  const {
    root = process.cwd(),
    port = 3000,
    host = 'localhost',
    hmr = true,
    verbose = false,
  } = options;

  log.info('Starting development server...');

  // Load config
  const config = await loadConfig({ root });

  // Create file router
  const router = createFileRouter({
    pagesDir: path.join(root, config.pagesDir || 'pages'),
  });

  // Watch for file changes
  let watcher: fs.FSWatcher | null = null;

  if (hmr) {
    const pagesDir = path.join(root, config.pagesDir || 'pages');

    try {
      watcher = fs.watch(pagesDir, { recursive: true }, (eventType, filename) => {
        if (filename && (filename.endsWith('.tsx') || filename.endsWith('.ts'))) {
          log.event(`File changed: ${filename}`);
          router.regenerate();

          // Send HMR update to clients
          hmrClients.forEach((client) => {
            client.write(`data: ${JSON.stringify({ type: 'reload', file: filename })}\n\n`);
          });
        }
      });
    } catch {
      log.warn('File watching not available');
    }
  }

  // HMR clients
  const hmrClients: http.ServerResponse[] = [];

  // Create HTTP server
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${host}:${port}`);

    // HMR endpoint
    if (url.pathname === '/__hmr') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });

      hmrClients.push(res);

      req.on('close', () => {
        const index = hmrClients.indexOf(res);
        if (index !== -1) {
          hmrClients.splice(index, 1);
        }
      });

      return;
    }

    // Create middleware context
    const context = createMiddlewareContext(
      new Request(url.toString(), {
        method: req.method ?? 'GET',
        headers: Object.entries(req.headers).reduce((acc, [key, value]) => {
          if (value) acc.append(key, Array.isArray(value) ? value[0]! : value);
          return acc;
        }, new Headers()),
      })
    );

    try {
      // Match route
      const match = router.match(url.pathname);

      if (match) {
        if (verbose) {
          log.info(`${req.method} ${url.pathname}`);
        }

        // Generate response
        const html = generateDevHtml(match.route.pattern, url.pathname, hmr);

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      } else {
        // Check for API route
        const apiMatch = router.matchApi(url.pathname);

        if (apiMatch) {
          if (verbose) {
            log.info(`API ${req.method} ${url.pathname}`);
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'API route matched', route: apiMatch.route.pattern }));
        } else {
          // 404
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(generate404Html());
        }
      }
    } catch (error) {
      log.error(error instanceof Error ? error.message : String(error));
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(generate500Html(error instanceof Error ? error : new Error(String(error))));
    }
  });

  // Start server
  server.listen(port, host, () => {
    log.success(`Development server started at http://${host}:${port}`);
    log.info(`Routes loaded: ${router.getRoutes().length} pages, ${router.getApiRoutes().length} API routes`);

    if (hmr) {
      log.info('Hot Module Replacement enabled');
    }
  });

  // Cleanup on exit
  process.on('SIGINT', () => {
    log.info('Shutting down...');
    server.close();
    if (watcher) watcher.close();
    process.exit(0);
  });
}

/**
 * Production build
 */
export async function build(options: BuildCLIOptions = {}): Promise<void> {
  const {
    root = process.cwd(),
    minify = true,
    sourcemap = false,
    analyze = false,
    verbose = false,
  } = options;

  log.info('Building for production...');

  const startTime = Date.now();

  // Load config
  const config = await loadConfig({ root });

  // Create compiler
  const compiler = createCompilerFromConfig(config);

  // Run build
  const result = await compiler.build();

  if (result.success) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    log.success(`Build completed in ${duration}s`);
    log.info(`Routes: ${result.manifest.routes.length} pages, ${result.manifest.apiRoutes.length} API routes`);
    log.info(`Bundles: ${result.bundles.length}`);

    if (result.staticPages.length > 0) {
      log.info(`Static pages: ${result.staticPages.length}`);
    }

    if (result.warnings.length > 0) {
      result.warnings.forEach((warning: string) => log.warn(warning));
    }

    if (analyze) {
      console.log('\nBundle Analysis:');
      result.bundles.forEach((bundle: { name: string; size: number }) => {
        console.log(`  ${bundle.name}: ${formatBytes(bundle.size)}`);
      });
    }
  } else {
    log.error('Build failed');
    result.errors.forEach((error: { file?: string; message: string; stack?: string }) => {
      console.error(`  ${error.file || 'unknown'}: ${error.message}`);
      if (verbose && error.stack) {
        console.error(error.stack);
      }
    });
    process.exit(1);
  }
}

/**
 * Production server
 */
export async function start(options: StartServerOptions = {}): Promise<void> {
  const {
    root = process.cwd(),
    port = 3000,
    host = '0.0.0.0',
    verbose = false,
  } = options;

  log.info('Starting production server...');

  // Load config
  const config = await loadConfig({ root });
  const outDir = path.join(root, config.build?.outDir || '.philjs');

  // Check if build exists
  const manifestPath = path.join(outDir, 'route-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    log.error('No build found. Run `philjs-meta build` first.');
    process.exit(1);
  }

  // Load manifest
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  // Create middleware chain
  const middlewareChain = new MiddlewareChain();

  // Add compression middleware
  middlewareChain.use(async (_ctx: unknown, next: () => Promise<Response>) => {
    const response = await next();
    response.headers.set('X-Powered-By', 'PhilJS-Meta');
    return response;
  });

  // Create server
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${host}:${port}`);

    try {
      // Serve static files
      const staticPath = path.join(outDir, 'static', url.pathname);
      if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
        const content = fs.readFileSync(staticPath);
        const ext = path.extname(staticPath);
        const contentType = getContentType(ext);

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
        return;
      }

      // Match route from manifest
      const route = manifest.routes.find((r: { regex: string }) => {
        const regex = new RegExp(r.regex);
        return regex.test(url.pathname);
      });

      if (route) {
        if (verbose) {
          log.info(`${req.method} ${url.pathname}`);
        }

        // Serve pre-rendered page or dynamic render
        const htmlPath = path.join(outDir, 'static', route.pattern === '/' ? 'index.html' : `${route.pattern.slice(1)}.html`);

        if (fs.existsSync(htmlPath)) {
          const html = fs.readFileSync(htmlPath, 'utf-8');
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(html);
        } else {
          // Dynamic rendering would happen here
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(generateProductionHtml(route.pattern));
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(generate404Html());
      }
    } catch (error) {
      log.error(error instanceof Error ? error.message : String(error));
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  });

  server.listen(port, host, () => {
    log.success(`Production server started at http://${host}:${port}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    log.info('Shutting down gracefully...');
    server.close(() => {
      process.exit(0);
    });
  });
}

/**
 * Static generation
 */
export async function generate(options: GenerateOptions = {}): Promise<void> {
  const {
    root = process.cwd(),
    outDir = 'out',
    fallback = true,
    verbose = false,
  } = options;

  log.info('Generating static pages...');

  const startTime = Date.now();

  // Load config
  const config = await loadConfig({ root });

  // Create compiler with SSG enabled
  const compiler = createCompiler({
    rootDir: root,
    outDir: config.build?.outDir || '.philjs',
    pagesDir: config.pagesDir || 'pages',
    publicDir: config.publicDir || 'public',
    srcDir: config.srcDir || 'src',
    minify: true,
    sourcemap: false,
    target: 'browser',
    ssr: true,
    ssg: true,
    env: config.env || {},
  });

  // Build
  const result = await compiler.build();

  if (result.success) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    log.success(`Static generation completed in ${duration}s`);
    log.info(`Generated ${result.staticPages.length} pages`);

    if (fallback) {
      // Generate fallback 404 page
      const fallbackPath = path.join(root, outDir, '404.html');
      fs.writeFileSync(fallbackPath, generate404Html());
      log.info('Generated 404 fallback page');
    }
  } else {
    log.error('Static generation failed');
    result.errors.forEach((error: { file?: string; message: string }) => {
      console.error(`  ${error.file || 'unknown'}: ${error.message}`);
    });
    process.exit(1);
  }
}

/**
 * Generate development HTML
 */
function generateDevHtml(pattern: string, pathname: string, hmr: boolean): string {
  const hmrScript = hmr
    ? `
    <script>
      const sse = new EventSource('/__hmr');
      sse.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'reload') {
          console.log('[HMR] Reloading due to change in', data.file);
          location.reload();
        }
      };
      sse.onerror = () => console.log('[HMR] Connection lost, retrying...');
    </script>
  `
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pattern} - PhilJS Dev</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; padding: 2rem; }
    .dev-info { background: #f0f0f0; padding: 1rem; border-radius: 8px; margin-top: 2rem; }
    code { background: #e0e0e0; padding: 0.2rem 0.5rem; border-radius: 4px; }
  </style>
</head>
<body>
  <div id="app">
    <h1>PhilJS Meta Development</h1>
    <p>Route: <code>${pattern}</code></p>
    <p>Path: <code>${pathname}</code></p>
    <div class="dev-info">
      <p><strong>Development Mode</strong></p>
      <p>This page will be replaced with your component when the app is built.</p>
    </div>
  </div>
  ${hmrScript}
</body>
</html>`;
}

/**
 * Generate production HTML
 */
function generateProductionHtml(pattern: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pattern}</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/_philjs/client/${pattern === '/' ? 'index' : pattern.slice(1).replace(/\//g, '-')}.js"></script>
</body>
</html>`;
}

/**
 * Generate 404 HTML
 */
function generate404Html(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - Not Found</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fafafa; }
    .container { text-align: center; }
    h1 { font-size: 8rem; margin: 0; color: #333; }
    p { color: #666; font-size: 1.25rem; }
    a { color: #0070f3; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>404</h1>
    <p>The page you're looking for doesn't exist.</p>
    <p><a href="/">Go back home</a></p>
  </div>
</body>
</html>`;
}

/**
 * Generate 500 HTML
 */
function generate500Html(error: Error): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>500 - Server Error</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 2rem; margin: 0; background: #fafafa; }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { color: #e00; }
    pre { background: #1a1a1a; color: #fff; padding: 1rem; border-radius: 8px; overflow: auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>500 - Server Error</h1>
    <p>${error.message}</p>
    <pre>${error.stack || ''}</pre>
  </div>
</body>
</html>`;
}

/**
 * Get content type from file extension
 */
function getContentType(ext: string): string {
  const types: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
  };

  return types[ext] || 'application/octet-stream';
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * CLI entry point
 */
export async function run(args: string[] = process.argv.slice(2)): Promise<void> {
  const command = args[0];
  const options = parseArgs(args.slice(1));

  console.log(`
${colors.cyan}${colors.bold}PhilJS Meta${colors.reset} v2.0.0
`);

  switch (command) {
    case 'dev':
      await dev(options);
      break;

    case 'build':
      await build(options);
      break;

    case 'start':
      await start(options);
      break;

    case 'generate':
    case 'export':
      await generate(options);
      break;

    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;

    case 'version':
    case '--version':
    case '-v':
      console.log('2.0.0');
      break;

    default:
      if (command) {
        log.error(`Unknown command: ${command}`);
      }
      printHelp();
      process.exit(1);
  }
}

/**
 * Parse CLI arguments
 */
function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--port' || arg === '-p') {
      const portArg = args[++i];
      if (portArg) options.port = parseInt(portArg, 10);
    } else if (arg === '--host' || arg === '-H') {
      const hostArg = args[++i];
      if (hostArg) options.host = hostArg;
    } else if (arg === '--root' || arg === '-r') {
      const rootArg = args[++i];
      if (rootArg) options.root = rootArg;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--config' || arg === '-c') {
      const configArg = args[++i];
      if (configArg) options.config = configArg;
    }
  }

  return options;
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
${colors.bold}Usage:${colors.reset} philjs-meta <command> [options]

${colors.bold}Commands:${colors.reset}
  dev       Start development server with HMR
  build     Build for production
  start     Start production server
  generate  Generate static pages
  help      Show this help message

${colors.bold}Options:${colors.reset}
  -p, --port <port>     Port number (default: 3000)
  -H, --host <host>     Host name (default: localhost)
  -r, --root <dir>      Project root directory
  -c, --config <file>   Config file path
  -v, --verbose         Enable verbose logging

${colors.bold}Examples:${colors.reset}
  $ philjs-meta dev
  $ philjs-meta build
  $ philjs-meta start --port 8080
  $ philjs-meta generate --fallback
`);
}

// Run CLI if called directly
if (require.main === module) {
  run().catch((error) => {
    log.error(error.message);
    process.exit(1);
  });
}
