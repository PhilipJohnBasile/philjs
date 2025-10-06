# Production Best Practices

Deploy PhilJS applications with confidence.

## Build Optimization

### Production Build

```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Generate source maps for debugging
    sourcemap: true,

    // Minify code
    minify: 'terser',

    // Terser options
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    },

    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          vendor: ['philjs-core', 'philjs-router'],

          // Feature chunks
          dashboard: ['./src/features/dashboard'],
          analytics: ['./src/features/analytics']
        }
      }
    },

    // Asset optimization
    assetsInlineLimit: 4096, // 4kb

    // Chunk size warnings
    chunkSizeWarningLimit: 500
  },

  // Server configuration for preview
  preview: {
    port: 3000,
    strictPort: true
  }
});
```

## Environment Configuration

### Environment Variables

```bash
# .env.production
VITE_API_URL=https://api.production.com
VITE_APP_NAME=PhilJS App
VITE_ENABLE_ANALYTICS=true
VITE_SENTRY_DSN=https://...

# .env.staging
VITE_API_URL=https://api.staging.com
VITE_APP_NAME=PhilJS App (Staging)
VITE_ENABLE_ANALYTICS=false

# .env.development
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=PhilJS App (Dev)
VITE_ENABLE_ANALYTICS=false
```

```typescript
// utils/env.ts
interface Environment {
  apiUrl: string;
  appName: string;
  enableAnalytics: boolean;
  sentryDsn: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

export const env: Environment = {
  apiUrl: import.meta.env.VITE_API_URL,
  appName: import.meta.env.VITE_APP_NAME,
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  sentryDsn: import.meta.env.VITE_SENTRY_DSN || '',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD
};

// Validate required environment variables
const requiredEnvVars = ['VITE_API_URL'];

requiredEnvVars.forEach(key => {
  if (!import.meta.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});
```

## Error Tracking

### Sentry Integration

```typescript
// services/errorTracking.ts
import * as Sentry from '@sentry/browser';
import { env } from '@/utils/env';

export function initErrorTracking() {
  if (!env.isProduction || !env.sentryDsn) return;

  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.isProduction ? 'production' : 'staging',

    // Performance monitoring
    tracesSampleRate: 0.1, // 10% of transactions

    // Release tracking
    release: `philjs-app@${import.meta.env.VITE_APP_VERSION}`,

    // Error filtering
    beforeSend(event, hint) {
      // Don't send errors from browser extensions
      if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
        frame => frame.filename?.includes('extension://')
      )) {
        return null;
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured'
    ]
  });
}

// Track user for better error context
export function setUser(user: { id: string; email: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email
  });
}

// Clear user on logout
export function clearUser() {
  Sentry.setUser(null);
}

// Manually capture exceptions
export function captureException(error: Error, context?: Record<string, any>) {
  if (env.isDevelopment) {
    console.error(error, context);
    return;
  }

  Sentry.withScope(scope => {
    if (context) {
      scope.setContext('additional', context);
    }
    Sentry.captureException(error);
  });
}

// App.tsx
import { initErrorTracking } from './services/errorTracking';

initErrorTracking();

function App() {
  return <Router>...</Router>;
}
```

### Global Error Boundary

```tsx
import { ErrorBoundary } from 'philjs-core';
import { captureException } from './services/errorTracking';

function App() {
  return (
    <ErrorBoundary
      fallback={(error) => <ErrorFallback error={error} />}
      onError={(error, errorInfo) => {
        captureException(error, {
          componentStack: errorInfo.componentStack
        });
      }}
    >
      <Router>
        <Routes />
      </Router>
    </ErrorBoundary>
  );
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="error-page">
      <h1>Something went wrong</h1>
      <p>We've been notified and are working on a fix.</p>

      {env.isDevelopment && (
        <details>
          <summary>Error Details</summary>
          <pre>{error.message}</pre>
          <pre>{error.stack}</pre>
        </details>
      )}

      <button onClick={() => window.location.reload()}>
        Reload Page
      </button>
    </div>
  );
}
```

## Analytics

### Analytics Setup

```typescript
// services/analytics.ts
import { env } from '@/utils/env';

class Analytics {
  private initialized = false;

  init() {
    if (!env.enableAnalytics || this.initialized) return;

    // Initialize your analytics service (e.g., Google Analytics, Plausible)
    // @ts-ignore
    window.gtag('config', env.googleAnalyticsId);

    this.initialized = true;
  }

  trackPageView(path: string) {
    if (!this.initialized) return;

    // @ts-ignore
    window.gtag('event', 'page_view', {
      page_path: path
    });
  }

  trackEvent(eventName: string, params?: Record<string, any>) {
    if (!this.initialized) return;

    // @ts-ignore
    window.gtag('event', eventName, params);
  }

  trackUser(userId: string) {
    if (!this.initialized) return;

    // @ts-ignore
    window.gtag('set', { user_id: userId });
  }
}

export const analytics = new Analytics();

// App.tsx
import { analytics } from './services/analytics';
import { router } from 'philjs-router';

analytics.init();

// Track route changes
effect(() => {
  const route = router.currentRoute();
  analytics.trackPageView(route.path);
});

// Track custom events
analytics.trackEvent('purchase', {
  value: 99.99,
  currency: 'USD',
  items: ['product-1', 'product-2']
});
```

## Performance Monitoring

### Web Vitals

```typescript
// services/performance.ts
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to your analytics service
  analytics.trackEvent('web_vitals', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating
  });
}

export function initPerformanceMonitoring() {
  onCLS(sendToAnalytics);  // Cumulative Layout Shift
  onFID(sendToAnalytics);  // First Input Delay
  onLCP(sendToAnalytics);  // Largest Contentful Paint
  onFCP(sendToAnalytics);  // First Contentful Paint
  onTTFB(sendToAnalytics); // Time to First Byte
}

// App.tsx
import { initPerformanceMonitoring } from './services/performance';

initPerformanceMonitoring();
```

## Logging

### Structured Logging

```typescript
// services/logger.ts
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private level: LogLevel;

  constructor() {
    this.level = env.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
  }

  private log(level: LogLevel, message: string, data?: any) {
    if (level < this.level) return;

    const logData = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      ...data
    };

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logData);
        break;
      case LogLevel.INFO:
        console.info(logData);
        break;
      case LogLevel.WARN:
        console.warn(logData);
        break;
      case LogLevel.ERROR:
        console.error(logData);
        captureException(new Error(message), data);
        break;
    }
  }

  debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any) {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: any) {
    this.log(LogLevel.ERROR, message, data);
  }
}

export const logger = new Logger();

// Usage
logger.debug('User clicked button', { userId: '123', buttonId: 'submit' });
logger.info('User logged in', { userId: '123' });
logger.warn('API request slow', { endpoint: '/users', duration: 2000 });
logger.error('Payment failed', { userId: '123', error: 'Card declined' });
```

## Caching Strategy

### Service Worker

```typescript
// public/sw.js
const CACHE_NAME = 'philjs-app-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/assets/main.js',
  '/assets/main.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

// index.tsx - Register service worker
if ('serviceWorker' in navigator && env.isProduction) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered:', registration);
      })
      .catch(error => {
        console.log('SW registration failed:', error);
      });
  });
}
```

## Health Checks

### Application Health

```typescript
// services/health.ts
export async function checkHealth() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: import.meta.env.VITE_APP_VERSION,
    checks: {
      api: await checkApiHealth(),
      database: await checkDatabaseHealth(),
      cache: checkCacheHealth()
    }
  };

  const unhealthy = Object.values(health.checks).some(
    check => check.status === 'unhealthy'
  );

  if (unhealthy) {
    health.status = 'unhealthy';
  }

  return health;
}

async function checkApiHealth() {
  try {
    const response = await fetch(`${env.apiUrl}/health`, { timeout: 5000 });
    return {
      status: response.ok ? 'healthy' : 'unhealthy',
      responseTime: response.headers.get('x-response-time')
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

// Expose health check endpoint
app.get('/health', async (req, res) => {
  const health = await checkHealth();
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

## Deployment

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Run linter
        run: npm run lint

      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.PRODUCTION_API_URL }}
          VITE_SENTRY_DSN: ${{ secrets.SENTRY_DSN }}

      - name: Deploy to production
        run: npm run deploy
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
```

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Zero-Downtime Deployment

```bash
# Using blue-green deployment
# 1. Deploy new version (green)
# 2. Run health checks
# 3. Switch traffic to green
# 4. Keep blue as backup
# 5. Remove blue after verification
```

## Monitoring

### Uptime Monitoring

```typescript
// Setup external monitoring
// - Pingdom
// - UptimeRobot
// - StatusCake

// Check critical endpoints every 1-5 minutes:
// - Homepage (/)
// - API health (/api/health)
// - Login page (/login)
```

### Alerting

```typescript
// Configure alerts for:
// - Error rate > 1%
// - Response time > 3s
// - Availability < 99.9%
// - Build failures
// - Deployment failures
```

## Security Headers

```nginx
# nginx.conf
server {
  # Security headers
  add_header X-Frame-Options "DENY" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;

  # HTTPS only
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

  # Gzip compression
  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

  # Cache static assets
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

## Summary

**Production Best Practices:**

✅ Optimize build with code splitting
✅ Configure environment variables
✅ Integrate error tracking (Sentry)
✅ Set up analytics and web vitals
✅ Implement structured logging
✅ Use service workers for caching
✅ Add health check endpoints
✅ Set up CI/CD pipeline
✅ Configure security headers
✅ Monitor uptime and performance
✅ Plan zero-downtime deployments
✅ Set up alerts for critical issues
✅ Test in staging before production
✅ Have rollback strategy ready

---

**Complete!** You now have comprehensive best practices for PhilJS development.

Return to [Best Practices Overview](./overview.md) for navigation.
