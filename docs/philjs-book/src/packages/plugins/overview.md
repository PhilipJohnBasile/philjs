# @philjs/plugins - Complete Reference

The `@philjs/plugins` package provides a powerful and extensible plugin system for PhilJS applications. It enables you to extend framework functionality, share reusable code, and integrate third-party services with a consistent API.

## Installation

```bash
npm install @philjs/plugins
# or
pnpm add @philjs/plugins
# or
bun add @philjs/plugins
```

## Introduction

The PhilJS plugin system offers:

- **Lifecycle Hooks** - Hook into build, development, rendering, and error events
- **Dependency Injection** - Share values across your application with provide/inject
- **Route Extension** - Dynamically add routes from plugins
- **Middleware Support** - Add server middleware and handlers
- **Plugin Registry** - Discover and search official and community plugins
- **Dependency Management** - Declare and validate plugin dependencies

## Plugin Interface

Every PhilJS plugin implements the `Plugin` interface:

```typescript
interface Plugin {
  /** Unique plugin name (required) */
  name: string;

  /** Plugin version using semver (required) */
  version: string;

  /** Human-readable description */
  description?: string;

  /** Plugin author name or email */
  author?: string;

  /** List of required plugin names that must be installed first */
  dependencies?: string[];

  /** Setup function called when the plugin is installed */
  setup: (context: PluginContext) => void | Promise<void>;

  /** Cleanup function called when the plugin is uninstalled */
  cleanup?: () => void | Promise<void>;
}
```

### Plugin Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | Yes | Unique identifier for the plugin |
| `version` | `string` | Yes | Semantic version (e.g., "1.0.0") |
| `description` | `string` | No | Brief description of plugin functionality |
| `author` | `string` | No | Plugin author information |
| `dependencies` | `string[]` | No | Names of plugins that must be installed first |
| `setup` | `Function` | Yes | Called when plugin is installed |
| `cleanup` | `Function` | No | Called when plugin is uninstalled |

### Basic Plugin Example

```typescript
import { definePlugin } from '@philjs/plugins';

const myPlugin = definePlugin({
  name: 'my-plugin',
  version: '1.0.0',
  description: 'A simple example plugin',
  author: 'Your Name',

  setup(context) {
    console.log('Plugin installed!');
    console.log('App:', context.app.name);
  },

  cleanup() {
    console.log('Plugin uninstalled!');
  }
});
```

## PluginContext

The `PluginContext` object is passed to the `setup()` function and provides access to the PhilJS application and various extension points:

```typescript
interface PluginContext {
  /** PhilJS application instance */
  app: PhilJSApp;

  /** Plugin configuration object */
  config: Record<string, unknown>;

  /** Plugin options (alias for config) */
  options: Record<string, unknown>;

  /** Register a lifecycle hook handler */
  hook: <T extends keyof PluginHooks>(name: T, handler: PluginHooks[T]) => void;

  /** Provide a value for dependency injection */
  provide: <T>(key: string | symbol, value: T) => void;

  /** Inject a previously provided value */
  inject: <T>(key: string | symbol, defaultValue?: T) => T | undefined;

  /** Add a route definition */
  addRoute: (route: RouteDefinition) => void;

  /** Add middleware to the server */
  addMiddleware: (middleware: Middleware) => void;

  /** Add a server-side handler */
  addServerHandler: (handler: ServerHandler) => void;
}
```

### PhilJSApp Instance

The `app` property provides information about the running application:

```typescript
interface PhilJSApp {
  name: string;                           // Application name
  version: string;                        // Application version
  env: 'development' | 'production' | 'test';  // Current environment
  rootDir: string;                        // Project root directory
  srcDir: string;                         // Source files directory
  outDir: string;                         // Build output directory
}
```

### Using PluginContext

```typescript
import { definePlugin } from '@philjs/plugins';

const analyticsPlugin = definePlugin({
  name: 'analytics-plugin',
  version: '1.0.0',

  setup(context) {
    const { app, config, hook, provide, addRoute, addMiddleware } = context;

    // Access app information
    console.log(`Running in ${app.env} mode`);
    console.log(`Root directory: ${app.rootDir}`);

    // Use plugin configuration
    const apiKey = config.apiKey as string;
    const trackingId = config.trackingId as string;

    // Provide values for injection elsewhere
    provide('analytics', {
      track: (event: string) => {
        console.log(`Tracking: ${event}`);
      }
    });

    // Register hooks
    hook('render:done', (html) => {
      // Inject analytics script
      return html.replace(
        '</head>',
        `<script>/* analytics */</script></head>`
      );
    });

    // Add routes
    addRoute({
      path: '/_analytics',
      handler: 'plugins/analytics/handler.ts'
    });

    // Add middleware
    addMiddleware({
      name: 'analytics-tracker',
      handler: (req, res, next) => {
        console.log(`Request: ${req.url}`);
        next();
      }
    });
  }
});
```

### Dependency Injection

Use `provide()` and `inject()` to share values across plugins and your application:

```typescript
// In plugin A - provide a value
const dbPlugin = definePlugin({
  name: 'db-plugin',
  version: '1.0.0',

  setup(context) {
    const db = createDatabaseConnection(context.config);
    context.provide('database', db);
  }
});

// In plugin B - inject the value
const userPlugin = definePlugin({
  name: 'user-plugin',
  version: '1.0.0',
  dependencies: ['db-plugin'], // Ensure db-plugin is installed first

  setup(context) {
    const db = context.inject('database');
    if (!db) {
      throw new Error('Database connection not available');
    }
    // Use the database connection
  }
});
```

## Plugin Hooks

The `PluginHooks` interface defines all available lifecycle hooks:

```typescript
interface PluginHooks {
  // Build lifecycle
  'build:start': () => void | Promise<void>;
  'build:done': (result: BuildResult) => void | Promise<void>;

  // Development lifecycle
  'dev:start': () => void | Promise<void>;
  'dev:hot-update': (modules: string[]) => void | Promise<void>;

  // Rendering lifecycle
  'render:start': (context: RenderContext) => void | Promise<void>;
  'render:done': (html: string) => string | Promise<string>;

  // Route extension
  'routes:extend': (routes: RouteDefinition[]) => RouteDefinition[];

  // Server middleware
  'server:middleware': (req: Request, res: Response, next: () => void) => void | Promise<void>;

  // Error handling
  'error:client': (error: Error) => void;
  'error:server': (error: Error) => void;
}
```

### Hook Details

#### Build Hooks

| Hook | Arguments | Returns | Description |
|------|-----------|---------|-------------|
| `build:start` | None | `void` | Called when build process begins |
| `build:done` | `BuildResult` | `void` | Called when build completes |

```typescript
interface BuildResult {
  success: boolean;      // Whether the build succeeded
  duration: number;      // Build time in milliseconds
  outputFiles: string[]; // List of generated files
  errors: Error[];       // Any build errors
  warnings: string[];    // Build warnings
}
```

**Example:**

```typescript
hook('build:start', () => {
  console.log('Build starting...');
});

hook('build:done', (result) => {
  if (result.success) {
    console.log(`Build completed in ${result.duration}ms`);
    console.log(`Generated ${result.outputFiles.length} files`);
  } else {
    console.error('Build failed:', result.errors);
  }
});
```

#### Development Hooks

| Hook | Arguments | Returns | Description |
|------|-----------|---------|-------------|
| `dev:start` | None | `void` | Called when dev server starts |
| `dev:hot-update` | `modules: string[]` | `void` | Called on HMR update |

**Example:**

```typescript
hook('dev:start', () => {
  console.log('Development server started');
});

hook('dev:hot-update', (modules) => {
  console.log('Hot update for:', modules);
  // Perform custom HMR logic
});
```

#### Rendering Hooks

| Hook | Arguments | Returns | Description |
|------|-----------|---------|-------------|
| `render:start` | `RenderContext` | `void` | Called before page render |
| `render:done` | `html: string` | `string` | Transform final HTML |

```typescript
interface RenderContext {
  url: string;                    // Request URL
  route: string;                  // Matched route pattern
  params: Record<string, string>; // Route parameters
  query: Record<string, string>;  // Query string parameters
}
```

**Example:**

```typescript
hook('render:start', (context) => {
  console.log(`Rendering: ${context.url}`);
  console.log(`Route params:`, context.params);
});

hook('render:done', (html) => {
  // Inject a script before closing body tag
  return html.replace(
    '</body>',
    '<script src="/my-script.js"></script></body>'
  );
});
```

#### Route Hooks

| Hook | Arguments | Returns | Description |
|------|-----------|---------|-------------|
| `routes:extend` | `routes: RouteDefinition[]` | `RouteDefinition[]` | Modify routes |

```typescript
interface RouteDefinition {
  path: string;                  // Route path pattern
  component?: string;            // Component file path
  handler?: string;              // Server handler path
  middleware?: string[];         // Middleware to apply
  meta?: Record<string, unknown>; // Route metadata
}
```

**Example:**

```typescript
hook('routes:extend', (routes) => {
  // Add admin routes
  return [
    ...routes,
    { path: '/admin', component: 'plugins/admin/Dashboard.tsx' },
    { path: '/admin/users', component: 'plugins/admin/Users.tsx' }
  ];
});
```

#### Server Hooks

| Hook | Arguments | Returns | Description |
|------|-----------|---------|-------------|
| `server:middleware` | `req, res, next` | `void` | Add server middleware |

**Example:**

```typescript
hook('server:middleware', (req, res, next) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});
```

#### Error Hooks

| Hook | Arguments | Returns | Description |
|------|-----------|---------|-------------|
| `error:client` | `error: Error` | `void` | Handle client-side errors |
| `error:server` | `error: Error` | `void` | Handle server-side errors |

**Example:**

```typescript
hook('error:client', (error) => {
  // Send to error tracking service
  errorTracker.captureException(error, { context: 'client' });
});

hook('error:server', (error) => {
  // Log server errors
  console.error('[Server Error]', error.stack);
  errorTracker.captureException(error, { context: 'server' });
});
```

## API Reference

### definePlugin()

Creates a plugin with type checking and validation:

```typescript
function definePlugin(plugin: Plugin): Plugin
```

**Example:**

```typescript
import { definePlugin } from '@philjs/plugins';

export const myPlugin = definePlugin({
  name: 'my-plugin',
  version: '1.0.0',
  setup(context) {
    // Plugin initialization
  }
});
```

### createPlugin()

Creates a plugin factory function that accepts options:

```typescript
function createPlugin<T extends Record<string, unknown>>(
  factory: (options: T) => Plugin
): (options?: T) => Plugin
```

**Example:**

```typescript
import { createPlugin } from '@philjs/plugins';

interface LoggerOptions {
  level: 'debug' | 'info' | 'warn' | 'error';
  prefix?: string;
}

export const loggerPlugin = createPlugin<LoggerOptions>((options) => ({
  name: 'logger-plugin',
  version: '1.0.0',

  setup(context) {
    const { level, prefix = '[App]' } = options;

    context.provide('logger', {
      log: (message: string) => {
        console.log(`${prefix} [${level.toUpperCase()}] ${message}`);
      }
    });
  }
}));

// Usage
const plugin = loggerPlugin({ level: 'info', prefix: '[MyApp]' });
```

### installPlugin()

Installs a plugin into the application:

```typescript
async function installPlugin(
  plugin: Plugin,
  app: PhilJSApp,
  config?: Record<string, unknown>
): Promise<void>
```

**Example:**

```typescript
import { installPlugin } from '@philjs/plugins';
import { myPlugin } from './my-plugin';

const app: PhilJSApp = {
  name: 'my-app',
  version: '1.0.0',
  env: 'development',
  rootDir: '/path/to/app',
  srcDir: '/path/to/app/src',
  outDir: '/path/to/app/dist'
};

await installPlugin(myPlugin, app, {
  apiKey: 'secret-key',
  debug: true
});
```

### uninstallPlugin()

Removes a plugin from the application:

```typescript
async function uninstallPlugin(name: string): Promise<void>
```

**Example:**

```typescript
import { uninstallPlugin } from '@philjs/plugins';

await uninstallPlugin('my-plugin');
```

### callHook()

Triggers all handlers registered for a specific hook:

```typescript
async function callHook<T extends keyof PluginHooks>(
  name: T,
  args: Parameters<PluginHooks[T]>
): Promise<void>
```

**Example:**

```typescript
import { callHook } from '@philjs/plugins';

// Trigger build:done hook
await callHook('build:done', [{
  success: true,
  duration: 1500,
  outputFiles: ['dist/index.js', 'dist/index.css'],
  errors: [],
  warnings: []
}]);

// Trigger error:client hook
await callHook('error:client', [new Error('Something went wrong')]);
```

### getInstalledPlugins()

Returns a list of all currently installed plugins:

```typescript
function getInstalledPlugins(): Plugin[]
```

**Example:**

```typescript
import { getInstalledPlugins } from '@philjs/plugins';

const plugins = getInstalledPlugins();
console.log('Installed plugins:');
plugins.forEach(p => console.log(`- ${p.name}@${p.version}`));
```

### isPluginInstalled()

Checks if a plugin is currently installed:

```typescript
function isPluginInstalled(name: string): boolean
```

**Example:**

```typescript
import { isPluginInstalled } from '@philjs/plugins';

if (isPluginInstalled('analytics-plugin')) {
  console.log('Analytics is enabled');
}
```

### getProvider()

Retrieves a value from the global provider registry:

```typescript
function getProvider<T>(key: string | symbol): T | undefined
```

**Example:**

```typescript
import { getProvider } from '@philjs/plugins';

const db = getProvider<Database>('database');
if (db) {
  await db.query('SELECT * FROM users');
}
```

## Plugin Registry

The plugin registry allows you to discover official and community plugins:

### PluginInfo Interface

```typescript
interface PluginInfo {
  name: string;          // Package name
  version: string;       // Latest version
  description: string;   // Plugin description
  author: string;        // Author name
  repository?: string;   // Git repository URL
  homepage?: string;     // Documentation URL
  keywords: string[];    // Search keywords
  downloads: number;     // Download count
  stars: number;         // GitHub stars
  category: PluginCategory;  // Plugin category
  official: boolean;     // Official PhilJS plugin
  verified: boolean;     // Verified by PhilJS team
}

type PluginCategory =
  | 'analytics' | 'auth' | 'cms' | 'database'
  | 'deployment' | 'devtools' | 'forms' | 'i18n'
  | 'monitoring' | 'payments' | 'seo' | 'styling'
  | 'testing' | 'ui' | 'utilities' | 'other';
```

### fetchPluginInfo()

Fetches detailed information about a plugin from the registry:

```typescript
async function fetchPluginInfo(name: string): Promise<PluginInfo | null>
```

**Example:**

```typescript
import { fetchPluginInfo } from '@philjs/plugins';

const info = await fetchPluginInfo('@philjs/auth');
if (info) {
  console.log(`${info.name} v${info.version}`);
  console.log(`Description: ${info.description}`);
  console.log(`Downloads: ${info.downloads}`);
}
```

### searchPlugins()

Searches for plugins by name, description, or keywords:

```typescript
function searchPlugins(query: string): PluginInfo[]
```

**Example:**

```typescript
import { searchPlugins } from '@philjs/plugins';

// Search for authentication plugins
const authPlugins = searchPlugins('auth');
authPlugins.forEach(plugin => {
  console.log(`${plugin.name} - ${plugin.description}`);
});

// Search for database integrations
const dbPlugins = searchPlugins('database');
```

### PluginRegistry Class

For advanced usage, you can create a custom registry instance:

```typescript
import { PluginRegistry } from '@philjs/plugins';

const registry = new PluginRegistry('https://my-registry.example.com');

// Get all plugins
const all = registry.getAll();

// Get by name
const plugin = registry.get('@philjs/auth');

// Search
const results = registry.search('oauth');

// Filter by category
const dbPlugins = registry.getByCategory('database');

// Get official plugins only
const official = registry.getOfficial();

// Get verified plugins
const verified = registry.getVerified();

// Fetch latest from remote
await registry.fetch('@philjs/auth');

// Refresh entire registry
await registry.refresh();
```

## Creating Custom Plugins

### Simple Plugin

```typescript
import { definePlugin } from '@philjs/plugins';

export const greetingPlugin = definePlugin({
  name: 'greeting-plugin',
  version: '1.0.0',
  description: 'Adds a greeting message to every page',

  setup(context) {
    context.hook('render:done', (html) => {
      const greeting = `<!-- Welcome to ${context.app.name}! -->`;
      return greeting + html;
    });
  }
});
```

### Configurable Plugin

```typescript
import { createPlugin } from '@philjs/plugins';

interface SentryOptions {
  dsn: string;
  environment?: string;
  tracesSampleRate?: number;
}

export const sentryPlugin = createPlugin<SentryOptions>((options) => ({
  name: 'sentry-plugin',
  version: '1.0.0',
  description: 'Sentry error tracking integration',

  setup(context) {
    const { dsn, environment = context.app.env, tracesSampleRate = 0.1 } = options;

    // Initialize Sentry
    const sentry = initSentry({ dsn, environment, tracesSampleRate });

    // Provide for injection
    context.provide('sentry', sentry);

    // Capture client errors
    context.hook('error:client', (error) => {
      sentry.captureException(error);
    });

    // Capture server errors
    context.hook('error:server', (error) => {
      sentry.captureException(error);
    });

    // Inject Sentry SDK in rendered pages
    context.hook('render:done', (html) => {
      return html.replace(
        '</head>',
        `<script src="https://browser.sentry-cdn.com/sentry.min.js"></script>
         <script>Sentry.init({ dsn: "${dsn}" });</script>
         </head>`
      );
    });
  },

  cleanup() {
    // Close Sentry client
    closeSentry();
  }
}));

// Usage
const plugin = sentryPlugin({
  dsn: 'https://xxx@sentry.io/123',
  tracesSampleRate: 0.2
});
```

### Plugin with Dependencies

```typescript
import { definePlugin, createPlugin } from '@philjs/plugins';

// Base authentication plugin
export const authPlugin = definePlugin({
  name: 'auth-plugin',
  version: '1.0.0',

  setup(context) {
    const authService = createAuthService(context.config);
    context.provide('auth', authService);

    context.addMiddleware({
      name: 'auth-middleware',
      order: 1,
      handler: async (req, res, next) => {
        const token = req.headers.authorization;
        if (token) {
          req.user = await authService.verify(token);
        }
        next();
      }
    });
  }
});

// Admin plugin that depends on auth
export const adminPlugin = definePlugin({
  name: 'admin-plugin',
  version: '1.0.0',
  dependencies: ['auth-plugin'], // Requires auth-plugin

  setup(context) {
    const auth = context.inject('auth');

    // Add admin routes
    context.hook('routes:extend', (routes) => [
      ...routes,
      {
        path: '/admin',
        component: 'plugins/admin/Layout.tsx',
        middleware: ['requireAdmin']
      },
      {
        path: '/admin/users',
        component: 'plugins/admin/Users.tsx'
      }
    ]);

    // Add admin-only middleware
    context.addMiddleware({
      name: 'requireAdmin',
      handler: (req, res, next) => {
        if (!req.user?.isAdmin) {
          res.status(403).send('Forbidden');
          return;
        }
        next();
      }
    });
  }
});
```

### Plugin with Server Handlers

```typescript
import { createPlugin } from '@philjs/plugins';

interface WebhookOptions {
  secret: string;
  path?: string;
}

export const webhookPlugin = createPlugin<WebhookOptions>((options) => ({
  name: 'webhook-plugin',
  version: '1.0.0',

  setup(context) {
    const { secret, path = '/api/webhooks' } = options;

    context.addServerHandler({
      route: path,
      method: 'POST',
      handler: async (req, res) => {
        const signature = req.headers['x-webhook-signature'];

        if (!verifySignature(req.body, signature, secret)) {
          res.status(401).send('Invalid signature');
          return;
        }

        const event = JSON.parse(req.body);
        await processWebhookEvent(event);

        res.status(200).send('OK');
      }
    });
  }
}));
```

## Best Practices

### 1. Use Semantic Versioning

Follow semver for plugin versions to help users understand breaking changes:

```typescript
{
  name: 'my-plugin',
  version: '1.2.3', // MAJOR.MINOR.PATCH
}
```

### 2. Declare Dependencies

Always declare plugin dependencies to ensure correct installation order:

```typescript
{
  name: 'user-plugin',
  dependencies: ['auth-plugin', 'db-plugin'],
}
```

### 3. Provide Cleanup Functions

Clean up resources when the plugin is uninstalled:

```typescript
{
  setup(context) {
    const interval = setInterval(checkHealth, 60000);
    // Store reference for cleanup
    this._interval = interval;
  },
  cleanup() {
    clearInterval(this._interval);
  }
}
```

### 4. Use TypeScript

Define proper types for plugin options:

```typescript
interface MyPluginOptions {
  apiKey: string;
  timeout?: number;
  retries?: number;
}

const myPlugin = createPlugin<MyPluginOptions>((options) => ({
  // Type-safe access to options
}));
```

### 5. Handle Errors Gracefully

Use try-catch in setup and hooks:

```typescript
setup(context) {
  try {
    const connection = await connect(context.config.url);
    context.provide('connection', connection);
  } catch (error) {
    console.error('Plugin setup failed:', error);
    throw error; // Re-throw to prevent incomplete installation
  }
}
```

## Official Plugins

PhilJS provides several official plugins:

| Plugin | Category | Description |
|--------|----------|-------------|
| `@philjs/auth` | auth | OAuth, JWT, and session authentication |
| `@philjs/analytics` | analytics | Google Analytics, Plausible integration |
| `@philjs/prisma` | database | Prisma ORM integration |
| `@philjs/drizzle` | database | Drizzle ORM integration |
| `@philjs/supabase` | database | Supabase integration |
| `@philjs/stripe` | payments | Stripe payments integration |
| `@philjs/content` | cms | Markdown/MDX content management |
| `@philjs/seo` | seo | SEO utilities and meta tags |

## Next Steps

- [Router](../router/overview.md) - Learn about PhilJS routing
- [API](../api/sessions.md) - Server-side API development
- [Testing](../testing/overview.md) - Testing PhilJS applications
