# Environment Variables

Manage configuration across different environments (development, staging, production) using environment variables.

## What You'll Learn

- What environment variables are
- Using variables in PhilJS
- Environment-specific configuration
- Security best practices
- Common patterns

## What are Environment Variables?

Environment variables store configuration that changes between environments:

```typescript
// Different values in dev vs production
const API_URL = process.env.VITE_API_URL; // http://localhost:3000 (dev) or https://api.example.com (prod)
const DEBUG_MODE = process.env.NODE_ENV === 'development';
```

**Why?**
- Different API endpoints per environment
- Feature flags
- API keys and secrets
- Debug settings

## Setting Up Environment Variables

### .env Files

Create `.env` files for different environments:

```bash
# .env.development
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=MyApp (Dev)
VITE_ENABLE_ANALYTICS=false

# .env.production
VITE_API_URL=https://api.example.com
VITE_APP_NAME=MyApp
VITE_ENABLE_ANALYTICS=true

# .env.local (gitignored - local overrides)
VITE_API_URL=http://localhost:8080
```

**Note**: PhilJS uses Vite, which requires `VITE_` prefix for client-accessible variables.

### .gitignore

Never commit secrets:

```bash
# .gitignore
.env.local
.env.*.local
.env.production
```

Commit only `.env.development` and `.env.example`.

## Using Environment Variables

### In TypeScript

```typescript
// Access variables
const apiUrl = import.meta.env.VITE_API_URL;
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;
const mode = import.meta.env.MODE; // 'development' or 'production'

// Usage
fetch(`${apiUrl}/users`);
```

### Type Safety

Create a type definition:

```typescript
// src/env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_ENABLE_ANALYTICS: boolean;
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

Now TypeScript knows about your variables:

```typescript
const apiUrl = import.meta.env.VITE_API_URL; // Type: string
const analytics = import.meta.env.VITE_ENABLE_ANALYTICS; // Type: boolean
```

## Common Patterns

### API Configuration

```typescript
// src/config.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  appName: import.meta.env.VITE_APP_NAME || 'MyApp',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD
};

// Usage
import { config } from './config';

fetch(`${config.apiUrl}/users`);
```

### Feature Flags

```typescript
export const features = {
  analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  newDashboard: import.meta.env.VITE_ENABLE_NEW_DASHBOARD === 'true',
  betaFeatures: import.meta.env.VITE_ENABLE_BETA === 'true'
};

// Usage
{features.analytics && <Analytics />}
{features.newDashboard ? <NewDashboard /> : <OldDashboard />}
```

### Environment-Specific Code

```typescript
// Development-only features
if (import.meta.env.DEV) {
  console.log('Debug mode enabled');
  // Load dev tools
}

// Production-only features
if (import.meta.env.PROD) {
  // Initialize error tracking
  Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });
}
```

### Default Values

```typescript
const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: Number(import.meta.env.VITE_TIMEOUT) || 30000,
  retries: Number(import.meta.env.VITE_RETRIES) || 3
};
```

## Security Best Practices

### Never Expose Secrets

```bash
# ❌ WRONG - Secret in client code!
VITE_SECRET_KEY=abc123secret

# ✅ Correct - Secrets stay on server
# Use server-side environment variables for secrets
```

**Remember**: All `VITE_*` variables are bundled into client JavaScript and visible to users!

### Separate Server/Client Vars

```bash
# Server-only (not prefixed with VITE_)
DATABASE_URL=postgresql://...
JWT_SECRET=...
API_KEY=...

# Client-safe (prefixed with VITE_)
VITE_API_URL=https://api.example.com
VITE_APP_NAME=MyApp
```

### .env.example Template

```bash
# .env.example - Commit this to git
# Copy to .env.local and fill in values

# API Configuration
VITE_API_URL=http://localhost:3000

# Analytics
VITE_ENABLE_ANALYTICS=false
VITE_GA_ID=

# Feature Flags
VITE_ENABLE_BETA=false
```

## Environment-Specific Builds

### Build Commands

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:staging": "vite build --mode staging",
    "build:prod": "vite build --mode production"
  }
}
```

### Mode Files

```bash
# .env.staging
VITE_API_URL=https://staging-api.example.com
VITE_ENABLE_ANALYTICS=true
VITE_ENV_NAME=Staging

# .env.production
VITE_API_URL=https://api.example.com
VITE_ENABLE_ANALYTICS=true
VITE_ENV_NAME=Production
```

## Validation

Validate required variables on app start:

```typescript
// src/config.ts
function validateEnv() {
  const required = [
    'VITE_API_URL',
    'VITE_APP_NAME'
  ];

  const missing = required.filter(
    key => !import.meta.env[key]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

// Call on app init
validateEnv();

export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  appName: import.meta.env.VITE_APP_NAME
};
```

## Type-Safe Config

```typescript
// src/config.ts
import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_APP_NAME: z.string().min(1),
  VITE_ENABLE_ANALYTICS: z.string().transform(val => val === 'true'),
  VITE_TIMEOUT: z.string().transform(Number).default('30000')
});

const env = envSchema.parse(import.meta.env);

export const config = {
  apiUrl: env.VITE_API_URL,
  appName: env.VITE_APP_NAME,
  analytics: env.VITE_ENABLE_ANALYTICS,
  timeout: env.VITE_TIMEOUT
};
```

## Runtime vs Build-Time

Environment variables in PhilJS are replaced at **build time**:

```typescript
// This code:
const url = import.meta.env.VITE_API_URL;

// Becomes this in the bundle:
const url = "https://api.example.com";
```

**Cannot use dynamic keys:**

```typescript
// ❌ Won't work
const key = 'VITE_API_URL';
const url = import.meta.env[key];

// ✅ Must be static
const url = import.meta.env.VITE_API_URL;
```

## Common Mistakes

### Forgetting VITE_ Prefix

```bash
# ❌ Not accessible in client
API_URL=http://localhost:3000

# ✅ Accessible in client
VITE_API_URL=http://localhost:3000
```

### Committing Secrets

```bash
# ❌ NEVER commit these
.env.local
.env.production

# ✅ Only commit examples
.env.example
.env.development (if no secrets)
```

### Using Secrets in Client

```typescript
// ❌ WRONG - Secret exposed to client!
const apiKey = import.meta.env.VITE_SECRET_API_KEY;

// ✅ Correct - Use on server only
// Keep secrets in server environment variables
```

## Summary

You've learned:

✅ What environment variables are
✅ Setting up .env files
✅ Using variables with import.meta.env
✅ Type safety with TypeScript
✅ Feature flags and configuration
✅ Security best practices
✅ Build-time vs runtime variables

Environment variables keep configuration flexible and secure!

---

**Next:** [Asset Handling →](./asset-handling.md) Work with images, fonts, and static files
