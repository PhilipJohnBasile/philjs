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
/**
 * Register a server function
 */
export declare function registerServerFunction(name: string, module: string, fn: (...args: any[]) => Promise<any>): void;
/**
 * Get a server function by hash
 */
export declare function getServerFunction(hash: string): ((...args: any[]) => Promise<any>) | undefined;
/**
 * Get all registered server functions
 */
export declare function getAllServerFunctions(): Record<string, ServerFunctionMetadata>;
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
export declare function createServerFunction<TArgs extends any[] = any[], TReturn = any>(fn: (...args: TArgs) => Promise<TReturn>, metadata: {
    name: string;
    module: string;
}): ServerFunction<TArgs, TReturn>;
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
export declare function createServerAction<TReturn = any>(fn: (formData: FormData) => Promise<TReturn>, metadata: {
    name: string;
    module: string;
}): ServerAction;
/**
 * Handle server function HTTP requests
 */
export declare function handleServerFunctionRequest(request: Request): Promise<Response>;
/**
 * Transform module with "use server" directive
 *
 * This is typically called by a build plugin (Vite, Webpack, etc.)
 */
export declare function transformServerModule(code: string, id: string): {
    code: string;
    map?: any;
} | null;
/**
 * Check if a function is a server function
 */
export declare function isServerFunction(fn: any): fn is ServerFunction;
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
export declare function serverFunctionsPlugin(options?: ServerFunctionsPluginOptions): any;
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
export declare function serverFunctionsMiddleware(): (req: any, res: any, next: () => void) => Promise<void>;
//# sourceMappingURL=server-functions.d.ts.map