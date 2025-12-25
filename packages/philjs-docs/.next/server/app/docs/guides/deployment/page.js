(()=>{var e={};e.id=5009,e.ids=[5009],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},2946:(e,r,t)=>{"use strict";t.r(r),t.d(r,{GlobalError:()=>o.a,__next_app__:()=>u,originalPathname:()=>p,pages:()=>c,routeModule:()=>h,tree:()=>d}),t(539),t(2108),t(4001),t(1305);var s=t(3545),i=t(5947),a=t(9761),o=t.n(a),n=t(4798),l={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>n[e]);t.d(r,l);let d=["",{children:["docs",{children:["guides",{children:["deployment",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(t.bind(t,539)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\guides\\deployment\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(t.bind(t,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(t.bind(t,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(t.t.bind(t,1305,23)),"next/dist/client/components/not-found-error"]}],c=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\guides\\deployment\\page.tsx"],p="/docs/guides/deployment/page",u={require:t,loadChunk:()=>Promise.resolve()},h=new s.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/docs/guides/deployment/page",pathname:"/docs/guides/deployment",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},4357:(e,r,t)=>{Promise.resolve().then(t.t.bind(t,5505,23)),Promise.resolve().then(t.bind(t,2015)),Promise.resolve().then(t.bind(t,306))},4444:(e,r,t)=>{Promise.resolve().then(t.bind(t,5173))},5173:(e,r,t)=>{"use strict";t.d(r,{Sidebar:()=>c,docsNavigation:()=>d});var s=t(6741),i=t(8972),a=t(47),o=t(7678),n=t(3178),l=t(5280);let d=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function c({sections:e}){let r=(0,a.usePathname)(),[t,d]=(0,l.useState)(()=>{let t=e.find(e=>e.links.some(e=>r?.startsWith(e.href)));return new Set(t?[t.title]:[e[0]?.title])}),c=e=>{d(r=>{let t=new Set(r);return t.has(e)?t.delete(e):t.add(e),t})};return s.jsx("nav",{className:"w-64 flex-shrink-0",children:s.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:s.jsx("ul",{className:"space-y-6",children:e.map(e=>{let a=t.has(e.title),l=e.links.some(e=>r===e.href);return(0,s.jsxs)("li",{children:[(0,s.jsxs)("button",{onClick:()=>c(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,s.jsx(n.Z,{className:(0,o.Z)("w-4 h-4 transition-transform",a&&"rotate-90")})]}),(a||l)&&s.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let t=r===e.href;return s.jsx("li",{children:s.jsx(i.default,{href:e.href,className:(0,o.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",t?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8951:(e,r,t)=>{"use strict";t.d(r,{default:()=>i.a});var s=t(7654),i=t.n(s)},7654:(e,r,t)=>{"use strict";let{createProxy:s}=t(1471);e.exports=s("C:\\Users\\Phili\\Git\\philjs\\node_modules\\.pnpm\\next@14.2.35_@opentelemetry+api@1.9.0_@playwright+test@1.55.1_react-dom@18.3.1_react@18.3.1__react@18.3.1\\node_modules\\next\\dist\\client\\link.js")},539:(e,r,t)=>{"use strict";t.r(r),t.d(r,{default:()=>l,metadata:()=>n});var s=t(9015),i=t(3288),a=t(7309),o=t(8951);let n={title:"Deployment Guide",description:"Deploy PhilJS applications to Vercel, Cloudflare, AWS, Docker, and more."};function l(){return(0,s.jsxs)("div",{className:"mdx-content",children:[s.jsx("h1",{children:"Deployment Guide"}),s.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"Deploy your PhilJS application to any platform including Vercel, Cloudflare Workers, AWS Lambda, Docker, and traditional servers."}),s.jsx("h2",{id:"build",children:"Building for Production"}),s.jsx("p",{children:"First, create an optimized production build:"}),s.jsx("h3",{id:"typescript-build",children:"TypeScript Projects"}),s.jsx(i.oI,{commands:["# Build static site or SPA","npm run build","","# Build SSR application","npm run build:ssr","","# Preview the production build locally","npm run preview"]}),s.jsx("h3",{id:"rust-build",children:"Rust Projects"}),s.jsx(i.oI,{commands:["# Build optimized WASM","cargo philjs build --release","","# Build SSR server","cargo build --release --features ssr","","# Build for specific target","cargo philjs build --release --target x86_64-unknown-linux-gnu"]}),s.jsx("h2",{id:"vercel",children:"Vercel"}),s.jsx("p",{children:"Vercel provides the easiest deployment experience with zero configuration:"}),s.jsx(i.oI,{commands:["# Install Vercel CLI","npm i -g vercel","","# Deploy","vercel"]}),(0,s.jsxs)("p",{children:["For SSR applications, add a ",s.jsx("code",{children:"vercel.json"}),":"]}),s.jsx(i.dn,{code:`{
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
}`,language:"json",filename:"vercel.json"}),s.jsx("h2",{id:"cloudflare",children:"Cloudflare Pages & Workers"}),s.jsx("p",{children:"Deploy to Cloudflare's global edge network for ultra-low latency:"}),s.jsx("h3",{id:"cloudflare-pages",children:"Cloudflare Pages (Static)"}),s.jsx(i.oI,{commands:["npm run build","npx wrangler pages deploy dist"]}),s.jsx("h3",{id:"cloudflare-workers",children:"Cloudflare Workers (SSR)"}),s.jsx(i.dn,{code:`// wrangler.toml
name = "my-philjs-app"
main = "dist/worker.js"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist/static"

[build]
command = "npm run build:worker"`,language:"toml",filename:"wrangler.toml"}),s.jsx(i.dn,{code:`// src/worker.ts
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
};`,language:"typescript",filename:"src/worker.ts"}),s.jsx(i.oI,{commands:["npx wrangler deploy"]}),s.jsx("h2",{id:"aws",children:"AWS"}),s.jsx("h3",{id:"aws-lambda",children:"AWS Lambda with API Gateway"}),s.jsx(i.dn,{code:`// serverless.yml
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
    httpPort: 3000`,language:"yaml",filename:"serverless.yml"}),s.jsx(i.dn,{code:`// src/lambda.ts
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
};`,language:"typescript",filename:"src/lambda.ts"}),s.jsx("h3",{id:"aws-s3",children:"S3 + CloudFront (Static)"}),s.jsx(i.oI,{commands:["# Build","npm run build","","# Sync to S3","aws s3 sync dist s3://my-bucket --delete","","# Invalidate CloudFront cache",'aws cloudfront create-invalidation --distribution-id XXXXX --paths "/*"']}),s.jsx("h2",{id:"docker",children:"Docker"}),s.jsx("p",{children:"Container deployment for maximum portability:"}),s.jsx("h3",{id:"dockerfile-ts",children:"TypeScript Dockerfile"}),s.jsx(i.dn,{code:`# Build stage
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
CMD ["node", "dist/server.js"]`,language:"dockerfile",filename:"Dockerfile"}),s.jsx("h3",{id:"dockerfile-rust",children:"Rust Dockerfile"}),s.jsx(i.dn,{code:`# Build stage
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
CMD ["./myapp"]`,language:"dockerfile",filename:"Dockerfile"}),s.jsx(i.oI,{commands:["# Build image","docker build -t my-philjs-app .","","# Run container","docker run -p 3000:3000 my-philjs-app"]}),s.jsx("h2",{id:"fly-io",children:"Fly.io"}),s.jsx("p",{children:"Deploy globally with Fly.io:"}),s.jsx(i.dn,{code:`# fly.toml
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
  cpus = 1`,language:"toml",filename:"fly.toml"}),s.jsx(i.oI,{commands:["flyctl launch","flyctl deploy"]}),s.jsx("h2",{id:"railway",children:"Railway"}),s.jsx(i.dn,{code:`# railway.json
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
}`,language:"json",filename:"railway.json"}),s.jsx("h2",{id:"static-hosting",children:"Static Hosting"}),s.jsx("p",{children:"For static sites without SSR, you can deploy to any static host:"}),(0,s.jsxs)("table",{children:[s.jsx("thead",{children:(0,s.jsxs)("tr",{children:[s.jsx("th",{children:"Platform"}),s.jsx("th",{children:"Deploy Command"})]})}),(0,s.jsxs)("tbody",{children:[(0,s.jsxs)("tr",{children:[s.jsx("td",{children:"Netlify"}),s.jsx("td",{children:s.jsx("code",{children:"netlify deploy --prod --dir=dist"})})]}),(0,s.jsxs)("tr",{children:[s.jsx("td",{children:"GitHub Pages"}),(0,s.jsxs)("td",{children:["Push to ",s.jsx("code",{children:"gh-pages"})," branch"]})]}),(0,s.jsxs)("tr",{children:[s.jsx("td",{children:"Surge"}),s.jsx("td",{children:s.jsx("code",{children:"surge dist my-app.surge.sh"})})]}),(0,s.jsxs)("tr",{children:[s.jsx("td",{children:"Firebase"}),s.jsx("td",{children:s.jsx("code",{children:"firebase deploy"})})]})]})]}),s.jsx("h2",{id:"environment",children:"Environment Variables"}),s.jsx("p",{children:"Handle environment-specific configuration:"}),s.jsx(i.dn,{code:`// vite.config.ts
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
});`,language:"typescript",filename:"vite.config.ts"}),s.jsx(a.U,{type:"warning",title:"Security",children:"Never expose secret keys or credentials in client-side code. Use server-side environment variables for sensitive data."}),s.jsx("h2",{id:"performance",children:"Performance Optimization"}),(0,s.jsxs)("ul",{className:"list-disc list-inside space-y-2 my-4",children:[(0,s.jsxs)("li",{children:[s.jsx("strong",{children:"Code Splitting"}),": Use dynamic imports for route-based splitting"]}),(0,s.jsxs)("li",{children:[s.jsx("strong",{children:"Asset Optimization"}),": Enable Vite's built-in image/font optimization"]}),(0,s.jsxs)("li",{children:[s.jsx("strong",{children:"Compression"}),": Enable Brotli/Gzip compression on your server"]}),(0,s.jsxs)("li",{children:[s.jsx("strong",{children:"CDN"}),": Serve static assets from a CDN for global performance"]}),(0,s.jsxs)("li",{children:[s.jsx("strong",{children:"Caching"}),": Set appropriate cache headers for static assets"]}),(0,s.jsxs)("li",{children:[s.jsx("strong",{children:"Preloading"}),": Use ",s.jsx("code",{children:'<link rel="preload">'})," for critical assets"]})]}),s.jsx(i.dn,{code:`// Lazy load routes
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
}`,language:"tsx",filename:"App.tsx"}),s.jsx("h2",{id:"monitoring",children:"Monitoring & Observability"}),s.jsx("p",{children:"Set up error tracking and performance monitoring:"}),s.jsx(i.dn,{code:`// src/monitoring.ts
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
}`,language:"typescript",filename:"src/monitoring.ts"}),s.jsx("h2",{id:"next-steps",children:"Next Steps"}),(0,s.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,s.jsxs)(o.default,{href:"/docs/guides/ssr-hydration",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[s.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"SSR & Hydration"}),s.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Learn about server-side rendering strategies"})]}),(0,s.jsxs)(o.default,{href:"/docs/rust-guide/axum-integration",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[s.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Rust Server Deployment"}),s.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Deploy Rust-powered PhilJS applications"})]})]})]})}},2108:(e,r,t)=>{"use strict";t.r(r),t.d(r,{default:()=>n});var s=t(9015),i=t(1471);let a=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),o=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function n({children:e}){return s.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,s.jsxs)("div",{className:"flex gap-12",children:[s.jsx(o,{sections:a}),s.jsx("main",{className:"flex-1 min-w-0",children:s.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}},3288:(e,r,t)=>{"use strict";t.d(r,{dn:()=>i,oI:()=>a});var s=t(1471);let i=(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#CodeBlock`);(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#InlineCode`);let a=(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#Terminal`)}};var r=require("../../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),s=r.X(0,[732,6314,9858],()=>t(2946));module.exports=s})();