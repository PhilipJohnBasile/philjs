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
// Server Function Registry
// ============================================================================
const serverFunctionRegistry = {};
const serverFunctionMetadata = new Map();
/**
 * Register a server function
 */
export function registerServerFunction(name, module, fn) {
    const hash = generateHash(module, name);
    serverFunctionRegistry[hash] = fn;
    serverFunctionMetadata.set(hash, { name, module, hash });
}
/**
 * Get a server function by hash
 */
export function getServerFunction(hash) {
    return serverFunctionRegistry[hash];
}
/**
 * Get all registered server functions
 */
export function getAllServerFunctions() {
    const result = {};
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
export function createServerFunction(fn, metadata) {
    const hash = generateHash(metadata.module, metadata.name);
    // Register on server
    if (typeof window === 'undefined') {
        registerServerFunction(metadata.name, metadata.module, fn);
    }
    // Create client caller
    const clientFn = async (...args) => {
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
    clientFn.__serverFunction = true;
    clientFn.__name = metadata.name;
    clientFn.__module = metadata.module;
    return clientFn;
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
export function createServerAction(fn, metadata) {
    return createServerFunction(fn, metadata);
}
// ============================================================================
// Request Handler
// ============================================================================
/**
 * Handle server function HTTP requests
 */
export async function handleServerFunctionRequest(request) {
    const url = new URL(request.url);
    const hash = url.pathname.split('/').pop();
    if (!hash) {
        return new Response(JSON.stringify({ error: 'Invalid server function hash' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const fn = getServerFunction(hash);
    if (!fn) {
        return new Response(JSON.stringify({ error: 'Server function not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    try {
        const body = await request.json();
        const { args } = body;
        const result = await fn(...(args || []));
        return new Response(JSON.stringify({ data: result }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    catch (error) {
        console.error('[Server Function] Error:', error);
        return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
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
export function transformServerModule(code, id) {
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
function extractExportedFunctions(code) {
    const functions = [];
    const regex = /export\s+(?:async\s+)?function\s+(\w+)/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
        if (match[1] !== undefined) {
            functions.push(match[1]);
        }
    }
    // Also check for export const/let
    const constRegex = /export\s+const\s+(\w+)\s*=/g;
    while ((match = constRegex.exec(code)) !== null) {
        if (match[1] !== undefined) {
            functions.push(match[1]);
        }
    }
    return functions;
}
/**
 * Extract function body
 */
function extractFunctionBody(code, fnName) {
    // Simple extraction - in production, use a proper AST parser
    const fnRegex = new RegExp(`function\\s+${fnName}\\s*\\([^)]*\\)\\s*\\{([^}]*(?:\\{[^}]*\\}[^}]*)*)\\}`, 's');
    const match = code.match(fnRegex);
    return match?.[1] ?? '/* Could not extract function body */';
}
// ============================================================================
// Utilities
// ============================================================================
/**
 * Generate hash for server function
 */
function generateHash(module, name) {
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
export function isServerFunction(fn) {
    return typeof fn === 'function' && fn.__serverFunction === true;
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
export function serverFunctionsPlugin(options = {}) {
    return {
        name: 'philjs-server-functions',
        transform(code, id) {
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
                if (!matches)
                    return null;
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
                if (excluded)
                    return null;
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
    return async (req, res, next) => {
        if (req.path.startsWith('/__server_fn/')) {
            const response = await handleServerFunctionRequest(new Request(req.url, {
                method: req.method,
                headers: req.headers,
                ...(req.body ? { body: JSON.stringify(req.body) } : {}),
            }));
            res.status(response.status);
            response.headers.forEach((value, key) => {
                res.setHeader(key, value);
            });
            const body = await response.text();
            res.send(body);
        }
        else {
            next();
        }
    };
}
//# sourceMappingURL=server-functions.js.map