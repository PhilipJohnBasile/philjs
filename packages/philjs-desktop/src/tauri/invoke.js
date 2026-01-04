/**
 * Tauri command invocation utilities
 */
import { getTauriContext, isTauri } from './context.js';
/**
 * Invoke a Tauri command
 * @param command - Command name
 * @param args - Command arguments
 * @returns Promise with command result
 */
export async function invoke(command, args) {
    if (!isTauri()) {
        throw new Error(`Cannot invoke command "${command}": Not running in Tauri environment`);
    }
    const context = getTauriContext();
    return context.invoke(command, args);
}
/**
 * Create a type-safe command invoker
 * @param name - Command name
 * @returns Typed invoke function
 */
export function createCommand(name) {
    const fn = async (args) => {
        return invoke(name, args);
    };
    fn.commandName = name;
    return fn;
}
/**
 * Define a typed command with validation
 * @param definition - Command definition
 * @returns Typed command function
 */
export function defineCommand(definition) {
    const { name, args: argSchema, handler } = definition;
    const fn = async (args) => {
        // Validate args if schema provided
        if (argSchema) {
            const validated = validateArgs(args, argSchema);
            return handler(validated);
        }
        return handler(args);
    };
    fn.commandName = name;
    return fn;
}
/**
 * Validate command arguments
 */
function validateArgs(args, schema) {
    const result = { ...args };
    for (const [key, config] of Object.entries(schema)) {
        const value = args[key];
        if (value === undefined) {
            if (config.required) {
                throw new Error(`Missing required argument: ${key}`);
            }
            if (config.default !== undefined) {
                result[key] = config.default;
            }
            continue;
        }
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== config.type) {
            throw new Error(`Invalid type for argument "${key}": expected ${config.type}, got ${actualType}`);
        }
    }
    return result;
}
/**
 * Batch invoke multiple commands
 * @param commands - Array of [command, args] tuples
 * @returns Promise with array of results
 */
export async function batchInvoke(commands) {
    const results = await Promise.all(commands.map(([command, args]) => invoke(command, args)));
    return results;
}
/**
 * Invoke with timeout
 * @param command - Command name
 * @param args - Command arguments
 * @param timeout - Timeout in milliseconds
 * @returns Promise with command result
 */
export async function invokeWithTimeout(command, args, timeout = 30000) {
    return Promise.race([
        invoke(command, args),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Command "${command}" timed out after ${timeout}ms`)), timeout)),
    ]);
}
/**
 * Invoke with retry
 * @param command - Command name
 * @param args - Command arguments
 * @param options - Retry options
 * @returns Promise with command result
 */
export async function invokeWithRetry(command, args, options = {}) {
    const { maxRetries = 3, delay = 1000, backoff = 2 } = options;
    let lastError;
    let currentDelay = delay;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await invoke(command, args);
        }
        catch (error) {
            lastError = error;
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, currentDelay));
                currentDelay *= backoff;
            }
        }
    }
    throw lastError;
}
//# sourceMappingURL=invoke.js.map