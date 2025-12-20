/**
 * Server Functions - React Server Actions style
 *
 * Allows marking functions with "use server" to automatically
 * generate API endpoints and type-safe client callers.
 *
 * @example
 * ```ts
 * // actions/user.ts
 * "use server";
 *
 * export async function createUser(data: FormData) {
 *   const name = data.get('name');
 *   return await db.user.create({ data: { name } });
 * }
 *
 * // In component
 * import { createUser } from './actions/user';
 *
 * function SignupForm() {
 *   return (
 *     <form action={createUser}>
 *       <input name="name" />
 *       <button>Sign Up</button>
 *     </form>
 *   );
 * }
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export type ServerFunction<TArgs extends any[] = any[], TReturn = any> = {
  (...args: TArgs): Promise<TReturn>;
  __serverFunction: true;
  __name: string;
  __module: string;
};

export type ServerAction = ServerFunction<[FormData], any>;

export interface ServerFunctionMetadata {
  name: string;
  module: string;
  hash: string;
}

export interface ServerFunctionRegistry {
  [key: string]: (...args: any[]) => Promise<any>;
}

export interface ServerFunctionOptions {
  /**
   * Base URL for server function endpoints
   */
  baseUrl?: string;

  /**
   * Custom fetch implementation
   */
  fetch?: typeof fetch;

  /**
   * Request headers
   */
  headers?: Record<string, string>;

  /**
   * Error handler
   */
  onError?: (error: Error) => void;
}

// ============================================================================
// Server Function Registry
// ============================================================================

const serverFunctionRegistry: ServerFunctionRegistry = {};
const serverFunctionMetadata = new Map<string, ServerFunctionMetadata>();

/**
 * Register a server function
 */
export function registerServerFunction(
  name: string,
  module: string,
  fn: (...args: any[]) => Promise<any>
): void {
  const hash = generateHash(module, name);
  serverFunctionRegistry[hash] = fn;
  serverFunctionMetadata.set(hash, { name, module, hash });
}

/**
 * Get a server function by hash
 */
export function getServerFunction(hash: string): ((...args: any[]) => Promise<any>) | undefined {
  return serverFunctionRegistry[hash];
}

/**
 * Get all registered server functions
 */
export function getAllServerFunctions(): Record<string, ServerFunctionMetadata> {
  const result: Record<string, ServerFunctionMetadata> = {};
  serverFunctionMetadata.forEach((metadata, hash) => {
    result[hash] = metadata;
  });
  return result;
}

// ============================================================================
// Server Function Creation
// ============================================================================

/**
 * Create a server function that can be called from the client
 *
 * @example
 * ```ts
 * export const createUser = createServerFunction(
 *   async (data: { name: string; email: string }) => {
 *     return await db.user.create({ data });
 *   },
 *   { name: 'createUser', module: 'actions/user' }
 * );
 * ```
 */
export function createServerFunction<TArgs extends any[] = any[], TReturn = any>(
  fn: (...args: TArgs) => Promise<TReturn>,
  metadata: { name: string; module: string }
): ServerFunction<TArgs, TReturn> {
  const hash = generateHash(metadata.module, metadata.name);

  // Register on server
  if (typeof window === 'undefined') {
    registerServerFunction(metadata.name, metadata.module, fn as any);
  }

  // Create client caller
  const clientFn = async (...args: TArgs): Promise<TReturn> => {
    if (typeof window === 'undefined') {
      // On server, call directly
      return fn(...args);
    }

    // On client, make HTTP request
    const response = await fetch(`/__server_fn/${hash}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ args }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Server function failed');
    }

    const result = await response.json();
    return result.data;
  };

  // Mark as server function
  (clientFn as any).__serverFunction = true;
  (clientFn as any).__name = metadata.name;
  (clientFn as any).__module = metadata.module;

  return clientFn as ServerFunction<TArgs, TReturn>;
}

/**
 * Create a server action that works with forms
 *
 * @example
 * ```ts
 * export const signup = createServerAction(async (formData: FormData) => {
 *   const name = formData.get('name') as string;
 *   const email = formData.get('email') as string;
 *   return await db.user.create({ data: { name, email } });
 * });
 * ```
 */
export function createServerAction<TReturn = any>(
  fn: (formData: FormData) => Promise<TReturn>,
  metadata: { name: string; module: string }
): ServerAction {
  return createServerFunction<[FormData], TReturn>(fn, metadata);
}

// ============================================================================
// Request Handler
// ============================================================================

/**
 * Handle server function HTTP requests
 */
export async function handleServerFunctionRequest(
  request: Request
): Promise<Response> {
  const url = new URL(request.url);
  const hash = url.pathname.split('/').pop();

  if (!hash) {
    return new Response(
      JSON.stringify({ error: 'Invalid server function hash' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const fn = getServerFunction(hash);

  if (!fn) {
    return new Response(
      JSON.stringify({ error: 'Server function not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { args } = body;

    const result = await fn(...(args || []));

    return new Response(
      JSON.stringify({ data: result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Server Function] Error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ============================================================================
// Build-Time Code Transform
// ============================================================================

/**
 * Transform module with "use server" directive
 *
 * This is typically called by a build plugin (Vite, Webpack, etc.)
 */
export function transformServerModule(
  code: string,
  id: string
): { code: string; map?: any } | null {
  // Check for "use server" directive
  if (!code.trimStart().startsWith('"use server"') && !code.trimStart().startsWith("'use server'")) {
    return null;
  }

  // Extract module path
  const modulePath = id.replace(/\\/g, '/');

  // Find all exported functions
  const exportedFunctions = extractExportedFunctions(code);

  // Generate transformed code
  const imports = `import { createServerFunction } from 'philjs-api/server-functions';\n`;

  const transformedFunctions = exportedFunctions.map(fnName => {
    return `
export const ${fnName} = createServerFunction(
  async (...args) => {
    // Original function implementation
    ${extractFunctionBody(code, fnName)}
  },
  { name: '${fnName}', module: '${modulePath}' }
);`;
  });

  const transformedCode = imports + transformedFunctions.join('\n');

  return { code: transformedCode };
}

/**
 * Extract exported function names from code
 */
function extractExportedFunctions(code: string): string[] {
  const functions: string[] = [];
  const regex = /export\s+(?:async\s+)?function\s+(\w+)/g;
  let match;

  while ((match = regex.exec(code)) !== null) {
    functions.push(match[1]);
  }

  // Also check for export const/let
  const constRegex = /export\s+const\s+(\w+)\s*=/g;
  while ((match = constRegex.exec(code)) !== null) {
    functions.push(match[1]);
  }

  return functions;
}

/**
 * Extract function body
 */
function extractFunctionBody(code: string, fnName: string): string {
  // Simple extraction - in production, use a proper AST parser
  const fnRegex = new RegExp(
    `function\\s+${fnName}\\s*\\([^)]*\\)\\s*\\{([^}]*(?:\\{[^}]*\\}[^}]*)*)\\}`,
    's'
  );

  const match = code.match(fnRegex);
  return match ? match[1] : '/* Could not extract function body */';
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Generate hash for server function
 */
function generateHash(module: string, name: string): string {
  const str = `${module}:${name}`;
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
}

/**
 * Check if a function is a server function
 */
export function isServerFunction(fn: any): fn is ServerFunction {
  return typeof fn === 'function' && (fn as any).__serverFunction === true;
}

// ============================================================================
// Vite Plugin
// ============================================================================

export interface ServerFunctionsPluginOptions {
  /**
   * Include patterns for server function files
   */
  include?: string | RegExp | (string | RegExp)[];

  /**
   * Exclude patterns
   */
  exclude?: string | RegExp | (string | RegExp)[];
}

/**
 * Vite plugin for server functions
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { serverFunctionsPlugin } from 'philjs-api/server-functions';
 *
 * export default {
 *   plugins: [
 *     serverFunctionsPlugin({
 *       include: ['**\/actions\/**\/*.ts', '**\/server\/**\/*.ts'],
 *     }),
 *   ],
 * };
 * ```
 */
export function serverFunctionsPlugin(
  options: ServerFunctionsPluginOptions = {}
): any {
  return {
    name: 'philjs-server-functions',

    transform(code: string, id: string) {
      // Check include/exclude patterns
      if (options.include) {
        const patterns = Array.isArray(options.include)
          ? options.include
          : [options.include];

        const matches = patterns.some(pattern => {
          if (typeof pattern === 'string') {
            return id.includes(pattern);
          }
          return pattern.test(id);
        });

        if (!matches) return null;
      }

      if (options.exclude) {
        const patterns = Array.isArray(options.exclude)
          ? options.exclude
          : [options.exclude];

        const excluded = patterns.some(pattern => {
          if (typeof pattern === 'string') {
            return id.includes(pattern);
          }
          return pattern.test(id);
        });

        if (excluded) return null;
      }

      // Transform server modules
      return transformServerModule(code, id);
    },
  };
}

// ============================================================================
// Middleware
// ============================================================================

/**
 * Express/Connect middleware for handling server functions
 *
 * @example
 * ```ts
 * import { serverFunctionsMiddleware } from 'philjs-api/server-functions';
 *
 * app.use(serverFunctionsMiddleware());
 * ```
 */
export function serverFunctionsMiddleware() {
  return async (req: any, res: any, next: () => void) => {
    if (req.path.startsWith('/__server_fn/')) {
      const response = await handleServerFunctionRequest(
        new Request(req.url, {
          method: req.method,
          headers: req.headers,
          body: req.body ? JSON.stringify(req.body) : undefined,
        })
      );

      res.status(response.status);
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      const body = await response.text();
      res.send(body);
    } else {
      next();
    }
  };
}
