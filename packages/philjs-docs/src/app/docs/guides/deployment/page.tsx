import { Metadata } from 'next';
import { CodeBlock, Terminal } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Deployment Guide',
  description: 'Deploy PhilJS applications to Vercel, Cloudflare, AWS, Docker, and more.',
};

export default function DeploymentGuidePage() {
  return (
    <div className="mdx-content">
      <h1>Deployment Guide</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        Deploy your PhilJS application to any platform including Vercel, Cloudflare Workers,
        AWS Lambda, Docker, and traditional servers.
      </p>

      <h2 id="build">Building for Production</h2>

      <p>
        First, create an optimized production build:
      </p>

      <h3 id="typescript-build">TypeScript Projects</h3>

      <Terminal commands={[
        '# Build static site or SPA',
        'npm run build',
        '',
        '# Build SSR application',
        'npm run build:ssr',
        '',
        '# Preview the production build locally',
        'npm run preview',
      ]} />

      <h3 id="rust-build">Rust Projects</h3>

      <Terminal commands={[
        '# Build optimized WASM',
        'cargo philjs build --release',
        '',
        '# Build SSR server',
        'cargo build --release --features ssr',
        '',
        '# Build for specific target',
        'cargo philjs build --release --target x86_64-unknown-linux-gnu',
      ]} />

      <h2 id="vercel">Vercel</h2>

      <p>
        Vercel provides the easiest deployment experience with zero configuration:
      </p>

      <Terminal commands={[
        '# Install Vercel CLI',
        'npm i -g vercel',
        '',
        '# Deploy',
        'vercel',
      ]} />

      <p>
        For SSR applications, add a <code>vercel.json</code>:
      </p>

      <CodeBlock
        code={`{
  "buildCommand": "npm run build:ssr",
  "outputDirectory": "dist",
  "framework": null,
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs20.x"
    }
  },
  "rewrites": [
    { "source": "/(.*)", "destination": "/api/ssr" }
  ]
}`}
        language="json"
        filename="vercel.json"
      />

      <h2 id="cloudflare">Cloudflare Pages & Workers</h2>

      <p>
        Deploy to Cloudflare's global edge network for ultra-low latency:
      </p>

      <h3 id="cloudflare-pages">Cloudflare Pages (Static)</h3>

      <Terminal commands={[
        'npm run build',
        'npx wrangler pages deploy dist',
      ]} />

      <h3 id="cloudflare-workers">Cloudflare Workers (SSR)</h3>

      <CodeBlock
        code={`// wrangler.toml
name = "my-philjs-app"
main = "dist/worker.js"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist/static"

[build]
command = "npm run build:worker"`}
        language="toml"
        filename="wrangler.toml"
      />

      <CodeBlock
        code={`// src/worker.ts
import { renderToString } from 'philjs-ssr';
import App from './App';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Serve static assets
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404) return asset;

    // SSR for all other routes
    const html = await renderToString(() => <App url={url.pathname} />);

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=60',
      },
    });
  },
};`}
        language="typescript"
        filename="src/worker.ts"
      />

      <Terminal commands={['npx wrangler deploy']} />

      <h2 id="aws">AWS</h2>

      <h3 id="aws-lambda">AWS Lambda with API Gateway</h3>

      <CodeBlock
        code={`// serverless.yml
service: philjs-app

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  memorySize: 1024
  timeout: 10

functions:
  ssr:
    handler: dist/lambda.handler
    events:
      - http: ANY /
      - http: ANY /{proxy+}

plugins:
  - serverless-offline

custom:
  serverless-offline:
    httpPort: 3000`}
        language="yaml"
        filename="serverless.yml"
      />

      <CodeBlock
        code={`// src/lambda.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { renderToString } from 'philjs-ssr';
import App from './App';

export const handler: APIGatewayProxyHandler = async (event) => {
  const path = event.path;

  const html = await renderToString(() => <App url={path} />);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },
    body: html,
  };
};`}
        language="typescript"
        filename="src/lambda.ts"
      />

      <h3 id="aws-s3">S3 + CloudFront (Static)</h3>

      <Terminal commands={[
        '# Build',
        'npm run build',
        '',
        '# Sync to S3',
        'aws s3 sync dist s3://my-bucket --delete',
        '',
        '# Invalidate CloudFront cache',
        'aws cloudfront create-invalidation --distribution-id XXXXX --paths "/*"',
      ]} />

      <h2 id="docker">Docker</h2>

      <p>
        Container deployment for maximum portability:
      </p>

      <h3 id="dockerfile-ts">TypeScript Dockerfile</h3>

      <CodeBlock
        code={`# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --production

EXPOSE 3000
CMD ["node", "dist/server.js"]`}
        language="dockerfile"
        filename="Dockerfile"
      />

      <h3 id="dockerfile-rust">Rust Dockerfile</h3>

      <CodeBlock
        code={`# Build stage
FROM rust:1.75-alpine AS builder
RUN apk add --no-cache musl-dev
WORKDIR /app
COPY . .
RUN cargo build --release --features ssr

# Production stage
FROM alpine:latest
RUN apk add --no-cache ca-certificates
WORKDIR /app

COPY --from=builder /app/target/release/myapp ./
COPY --from=builder /app/static ./static
COPY --from=builder /app/pkg ./pkg

EXPOSE 8080
CMD ["./myapp"]`}
        language="dockerfile"
        filename="Dockerfile"
      />

      <Terminal commands={[
        '# Build image',
        'docker build -t my-philjs-app .',
        '',
        '# Run container',
        'docker run -p 3000:3000 my-philjs-app',
      ]} />

      <h2 id="fly-io">Fly.io</h2>

      <p>
        Deploy globally with Fly.io:
      </p>

      <CodeBlock
        code={`# fly.toml
app = "my-philjs-app"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  memory = "256mb"
  cpu_kind = "shared"
  cpus = 1`}
        language="toml"
        filename="fly.toml"
      />

      <Terminal commands={[
        'flyctl launch',
        'flyctl deploy',
      ]} />

      <h2 id="railway">Railway</h2>

      <CodeBlock
        code={`# railway.json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "restartPolicyType": "ON_FAILURE"
  }
}`}
        language="json"
        filename="railway.json"
      />

      <h2 id="static-hosting">Static Hosting</h2>

      <p>
        For static sites without SSR, you can deploy to any static host:
      </p>

      <table>
        <thead>
          <tr>
            <th>Platform</th>
            <th>Deploy Command</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Netlify</td>
            <td><code>netlify deploy --prod --dir=dist</code></td>
          </tr>
          <tr>
            <td>GitHub Pages</td>
            <td>Push to <code>gh-pages</code> branch</td>
          </tr>
          <tr>
            <td>Surge</td>
            <td><code>surge dist my-app.surge.sh</code></td>
          </tr>
          <tr>
            <td>Firebase</td>
            <td><code>firebase deploy</code></td>
          </tr>
        </tbody>
      </table>

      <h2 id="environment">Environment Variables</h2>

      <p>
        Handle environment-specific configuration:
      </p>

      <CodeBlock
        code={`// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import philjs from 'philjs-compiler/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [philjs()],
    define: {
      // Expose safe env vars to client
      'import.meta.env.API_URL': JSON.stringify(env.API_URL),
      'import.meta.env.PUBLIC_KEY': JSON.stringify(env.PUBLIC_KEY),
    },
  };
});`}
        language="typescript"
        filename="vite.config.ts"
      />

      <Callout type="warning" title="Security">
        Never expose secret keys or credentials in client-side code. Use server-side
        environment variables for sensitive data.
      </Callout>

      <h2 id="performance">Performance Optimization</h2>

      <ul className="list-disc list-inside space-y-2 my-4">
        <li>
          <strong>Code Splitting</strong>: Use dynamic imports for route-based splitting
        </li>
        <li>
          <strong>Asset Optimization</strong>: Enable Vite's built-in image/font optimization
        </li>
        <li>
          <strong>Compression</strong>: Enable Brotli/Gzip compression on your server
        </li>
        <li>
          <strong>CDN</strong>: Serve static assets from a CDN for global performance
        </li>
        <li>
          <strong>Caching</strong>: Set appropriate cache headers for static assets
        </li>
        <li>
          <strong>Preloading</strong>: Use <code>&lt;link rel="preload"&gt;</code> for critical assets
        </li>
      </ul>

      <CodeBlock
        code={`// Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Router>
      <Suspense fallback={<Loading />}>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/settings" component={Settings} />
      </Suspense>
    </Router>
  );
}`}
        language="tsx"
        filename="App.tsx"
      />

      <h2 id="monitoring">Monitoring & Observability</h2>

      <p>
        Set up error tracking and performance monitoring:
      </p>

      <CodeBlock
        code={`// src/monitoring.ts
import * as Sentry from '@sentry/browser';
import { createEffect } from 'philjs-core';

// Initialize error tracking
Sentry.init({
  dsn: import.meta.env.SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
});

// Track navigation performance
export function trackPageView(path: string) {
  const navigationTiming = performance.getEntriesByType('navigation')[0];

  analytics.track('page_view', {
    path,
    loadTime: navigationTiming.loadEventEnd - navigationTiming.startTime,
    ttfb: navigationTiming.responseStart - navigationTiming.requestStart,
  });
}

// Error boundary with reporting
export function ErrorBoundary(props: { children: any }) {
  return (
    <ErrorBoundaryCore
      fallback={(err) => {
        Sentry.captureException(err);
        return <ErrorPage error={err} />;
      }}
    >
      {props.children}
    </ErrorBoundaryCore>
  );
}`}
        language="typescript"
        filename="src/monitoring.ts"
      />

      <h2 id="next-steps">Next Steps</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/guides/ssr-hydration"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">SSR & Hydration</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Learn about server-side rendering strategies
          </p>
        </Link>

        <Link
          href="/docs/rust-guide/axum-integration"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Rust Server Deployment</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Deploy Rust-powered PhilJS applications
          </p>
        </Link>
      </div>
    </div>
  );
}
