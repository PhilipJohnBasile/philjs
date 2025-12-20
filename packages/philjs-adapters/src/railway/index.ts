/**
 * PhilJS Railway Adapter
 *
 * Deploy to Railway with:
 * - Docker configuration generation
 * - Railway.toml configuration
 * - Environment variable handling
 * - Health checks
 * - Build configuration
 */

import { writeFileSync, mkdirSync, cpSync, existsSync } from 'fs';
import { join } from 'path';
import type { Adapter, AdapterConfig, ServerlessAdapter, RequestContext } from '../types';

export interface RailwayConfig extends AdapterConfig {
  /** Output directory for build artifacts */
  outDir?: string;

  /** Node.js version */
  nodeVersion?: string;

  /** Port to listen on (default: from PORT env var or 3000) */
  port?: number;

  /** Enable Docker deployment */
  docker?: {
    /** Base image */
    baseImage?: string;
    /** Node version for Docker */
    nodeVersion?: string;
    /** Additional packages to install */
    packages?: string[];
    /** Build arguments */
    buildArgs?: Record<string, string>;
    /** Environment variables */
    env?: Record<string, string>;
    /** Expose additional ports */
    exposePorts?: number[];
  };

  /** Railway.toml configuration */
  railway?: {
    /** Build command */
    buildCommand?: string;
    /** Start command */
    startCommand?: string;
    /** Health check path */
    healthCheckPath?: string;
    /** Health check interval */
    healthCheckInterval?: number;
    /** Restart policy */
    restartPolicy?: 'on-failure' | 'always' | 'unless-stopped';
    /** Environment variables */
    variables?: Record<string, string>;
    /** Deployment region */
    region?: string;
  };

  /** Nixpacks configuration */
  nixpacks?: {
    /** Nixpkgs to install */
    packages?: string[];
    /** Build command override */
    buildCommand?: string;
    /** Start command override */
    startCommand?: string;
    /** Install command override */
    installCommand?: string;
  };

  /** Enable static file serving */
  staticFiles?: {
    /** Static directory */
    directory?: string;
    /** Cache control header */
    cacheControl?: string;
  };

  /** Enable compression */
  compression?: boolean;

  /** Enable graceful shutdown */
  gracefulShutdown?: {
    /** Shutdown timeout in ms */
    timeout?: number;
    /** Signals to handle */
    signals?: ('SIGTERM' | 'SIGINT')[];
  };
}

export function railwayAdapter(config: RailwayConfig = {}): Adapter {
  const {
    outDir = '.railway',
    nodeVersion = '20',
    port = 3000,
    docker,
    railway,
    nixpacks,
    staticFiles,
    compression = true,
    gracefulShutdown = {
      timeout: 30000,
      signals: ['SIGTERM', 'SIGINT'],
    },
  } = config;

  return {
    name: 'railway',

    async adapt() {
      console.log('Building for Railway...');

      // Create output structure
      mkdirSync(outDir, { recursive: true });

      // Generate Dockerfile if Docker is enabled
      if (docker !== false) {
        writeFileSync(
          join(outDir, 'Dockerfile'),
          generateDockerfile()
        );

        writeFileSync(
          join(outDir, '.dockerignore'),
          generateDockerignore()
        );
      }

      // Generate Railway.toml
      writeFileSync(
        join(outDir, 'railway.toml'),
        generateRailwayToml()
      );

      // Generate Nixpacks configuration
      if (nixpacks) {
        writeFileSync(
          join(outDir, 'nixpacks.toml'),
          generateNixpacksToml()
        );
      }

      // Generate server entry point
      writeFileSync(
        join(outDir, 'server.js'),
        generateServerCode()
      );

      // Generate package.json
      writeFileSync(
        join(outDir, 'package.json'),
        JSON.stringify({
          name: 'philjs-railway',
          version: '1.0.0',
          type: 'module',
          scripts: {
            start: 'node server.js',
            build: 'echo "Build complete"',
          },
          dependencies: {
            '@philjs/ssr': 'latest',
            '@philjs/adapters': 'latest',
            compression: compression ? '^1.7.4' : undefined,
          },
          engines: {
            node: `>=${nodeVersion}`,
          },
        }, null, 2)
      );

      // Copy static assets
      if (staticFiles) {
        const staticDir = staticFiles.directory || config.static?.assets || 'public';
        if (existsSync(staticDir)) {
          cpSync(staticDir, join(outDir, 'public'), { recursive: true });
        }
      }

      // Copy prerendered pages
      if (existsSync('.philjs/prerendered')) {
        cpSync('.philjs/prerendered', join(outDir, 'public'), { recursive: true });
      }

      // Generate deployment guide
      writeFileSync(
        join(outDir, 'DEPLOY.md'),
        generateDeploymentGuide()
      );

      console.log(`Railway build complete: ${outDir}`);
    },

    getHandler() {
      return async (request: Request, context?: any): Promise<Response> => {
        const url = new URL(request.url);

        const requestContext: RequestContext = {
          url,
          method: request.method,
          headers: request.headers,
          body: request.body,
          params: {},
          platform: {
            name: 'railway',
            edge: false,
            context,
          },
        };

        const { handleRequest } = await import('@philjs/ssr');
        return handleRequest(requestContext);
      };
    },
  };

  function generateDockerfile(): string {
    const baseImage = docker?.baseImage || `node:${docker?.nodeVersion || nodeVersion}-alpine`;
    const packages = docker?.packages || [];
    const buildArgs = docker?.buildArgs || {};
    const envVars = docker?.env || {};

    return `# PhilJS Railway Dockerfile
# Generated by PhilJS Adapters

FROM ${baseImage} AS base

# Install additional packages
${packages.length > 0 ? `RUN apk add --no-cache ${packages.join(' ')}` : ''}

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Build arguments
${Object.entries(buildArgs).map(([k, v]) => `ARG ${k}=${v}`).join('\n')}

# Environment variables
${Object.entries(envVars).map(([k, v]) => `ENV ${k}=${v}`).join('\n')}

# Expose port
EXPOSE ${port}
${docker?.exposePorts?.map(p => `EXPOSE ${p}`).join('\n') || ''}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node healthcheck.js

# Start application
CMD ["npm", "start"]
`;
  }

  function generateDockerignore(): string {
    return `# PhilJS Docker Ignore
# Generated by PhilJS Adapters

node_modules
npm-debug.log
.git
.gitignore
.env
.env.*
dist
.vscode
.idea
*.log
.DS_Store
coverage
.nyc_output
*.test.js
*.spec.js
README.md
.editorconfig
.prettierrc
.eslintrc
`;
  }

  function generateRailwayToml(): string {
    const lines: string[] = [
      '# PhilJS Railway Configuration',
      '# Generated by PhilJS Adapters',
      '',
      '[build]',
      `command = "${railway?.buildCommand || 'npm install'}"`,
      '',
      '[deploy]',
      `startCommand = "${railway?.startCommand || 'npm start'}"`,
      `healthcheckPath = "${railway?.healthCheckPath || '/health'}"`,
      `healthcheckTimeout = ${railway?.healthCheckInterval || 300}`,
      `restartPolicyType = "${railway?.restartPolicy || 'on-failure'}"`,
    ];

    if (railway?.region) {
      lines.push(`region = "${railway.region}"`);
    }

    if (railway?.variables && Object.keys(railway.variables).length > 0) {
      lines.push('');
      lines.push('[env]');
      for (const [key, value] of Object.entries(railway.variables)) {
        lines.push(`${key} = "${value}"`);
      }
    }

    return lines.join('\n');
  }

  function generateNixpacksToml(): string {
    return `# PhilJS Nixpacks Configuration
# Generated by PhilJS Adapters

[phases.setup]
nixPkgs = ${nixpacks?.packages ? JSON.stringify(nixpacks.packages) : '["nodejs", "npm"]'}

${nixpacks?.installCommand ? `[phases.install]
cmds = ["${nixpacks.installCommand}"]` : ''}

${nixpacks?.buildCommand ? `[phases.build]
cmds = ["${nixpacks.buildCommand}"]` : ''}

[start]
cmd = "${nixpacks?.startCommand || 'npm start'}"
`;
  }

  function generateServerCode(): string {
    return `// PhilJS Railway Server
// Generated by PhilJS Adapters

import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
${compression ? "import compression from 'compression';" : ''}

const PORT = process.env.PORT || ${port};
const HOST = process.env.HOST || '0.0.0.0';
const STATIC_DIR = 'public';

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
};

// Create HTTP server
const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', \`http://\${req.headers.host}\`);

  // Health check endpoint
  if (url.pathname === '${railway?.healthCheckPath || '/health'}') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    return;
  }

  // Serve static files
  if (url.pathname.startsWith('/static/') || url.pathname.startsWith('/assets/')) {
    const filePath = join(process.cwd(), STATIC_DIR, url.pathname);

    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath);
        const ext = extname(filePath);
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': '${staticFiles?.cacheControl || 'public, max-age=31536000, immutable'}',
        });
        res.end(content);
        return;
      } catch (error) {
        console.error('Static file error:', error);
      }
    }
  }

  // Convert Node.js request to Web API Request
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      headers.append(key, Array.isArray(value) ? value.join(', ') : value);
    }
  }

  let body = null;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    body = new ReadableStream({
      start(controller) {
        controller.enqueue(buffer);
        controller.close();
      },
    });
  }

  const request = new Request(url, {
    method: req.method,
    headers,
    body,
  });

  const requestContext = {
    url,
    method: req.method || 'GET',
    headers,
    body,
    params: {},
    platform: {
      name: 'railway',
      edge: false,
      request: req,
      response: res,
    },
  };

  try {
    const { handleRequest } = await import('@philjs/ssr');
    const response = await handleRequest(requestContext);

    // Set response headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Set status
    res.statusCode = response.status;

    // Send response body
    if (response.body) {
      const reader = response.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }

    res.end();
  } catch (error) {
    console.error('Request error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message,
    }));
  }
});

// Graceful shutdown
${gracefulShutdown ? `
let isShuttingDown = false;

function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(\`Received \${signal}, starting graceful shutdown...\`);

  const shutdownTimeout = setTimeout(() => {
    console.error('Shutdown timeout, forcing exit');
    process.exit(1);
  }, ${gracefulShutdown.timeout});

  server.close(() => {
    console.log('HTTP server closed');
    clearTimeout(shutdownTimeout);
    process.exit(0);
  });

  // Stop accepting new connections
  server.on('request', (req, res) => {
    if (isShuttingDown) {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Service Unavailable');
    }
  });
}

${gracefulShutdown.signals?.map(signal => `process.on('${signal}', () => gracefulShutdown('${signal}'));`).join('\n')}
` : ''}

// Start server
server.listen(PORT, HOST, () => {
  console.log(\`PhilJS Railway server listening on http://\${HOST}:\${PORT}\`);
  console.log(\`Environment: \${process.env.NODE_ENV || 'development'}\`);
  console.log(\`Health check: http://\${HOST}:\${PORT}${railway?.healthCheckPath || '/health'}\`);
});

// Error handling
server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
`;
  }

  function generateDeploymentGuide(): string {
    return `# Deploy PhilJS to Railway

## Quick Start

1. Install Railway CLI:
\`\`\`bash
npm install -g @railway/cli
\`\`\`

2. Login to Railway:
\`\`\`bash
railway login
\`\`\`

3. Initialize project:
\`\`\`bash
railway init
\`\`\`

4. Deploy:
\`\`\`bash
railway up
\`\`\`

## Configuration

### Environment Variables

Set environment variables in Railway dashboard or using CLI:

\`\`\`bash
railway variables set NODE_ENV=production
railway variables set PORT=${port}
\`\`\`

### Custom Domain

Add a custom domain in the Railway dashboard:
1. Go to your project settings
2. Click "Add Domain"
3. Enter your domain name
4. Update DNS records as instructed

## Dockerfile Deployment

If using Docker (recommended):

\`\`\`bash
# Build and deploy with Docker
railway up --detach
\`\`\`

## Nixpacks Deployment

Railway will automatically detect and use Nixpacks if no Dockerfile is present.

## Health Checks

Railway will check \`${railway?.healthCheckPath || '/health'}\` endpoint for health status.

## Monitoring

View logs in real-time:

\`\`\`bash
railway logs
\`\`\`

## Scaling

Railway automatically scales your application based on traffic.
Configure scaling in the project settings.

## Database

Add a database plugin:

\`\`\`bash
railway add postgres
# or
railway add mysql
# or
railway add redis
\`\`\`

## Static Files

Static files are served from the \`public\` directory with caching headers.

## Troubleshooting

### Application won't start

1. Check logs: \`railway logs\`
2. Verify environment variables
3. Check health endpoint

### Port issues

Railway provides the \`PORT\` environment variable. Make sure your app uses it:

\`\`\`javascript
const PORT = process.env.PORT || ${port};
\`\`\`

### Build failures

1. Check \`railway.toml\` build command
2. Verify dependencies in \`package.json\`
3. Check build logs

## Resources

- [Railway Documentation](https://docs.railway.app)
- [PhilJS Documentation](https://philjs.dev)
`;
  }
}

export default railwayAdapter;
