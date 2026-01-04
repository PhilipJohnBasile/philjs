/**
 * Tauri command invocation utilities
 */
import type { InvokeArgs, TypedCommand, CommandDefinition } from './types.js';
/**
 * Invoke a Tauri command
 * @param command - Command name
 * @param args - Command arguments
 * @returns Promise with command result
 */
export declare function invoke<T = unknown>(command: string, args?: InvokeArgs): Promise<T>;
/**
 * Create a type-safe command invoker
 * @param name - Command name
 * @returns Typed invoke function
 */
export declare function createCommand<TArgs extends InvokeArgs, TResult>(name: string): TypedCommand<TArgs, TResult>;
/**
 * Define a typed command with validation
 * @param definition - Command definition
 * @returns Typed command function
 */
export declare function defineCommand<TArgs extends InvokeArgs, TResult>(definition: CommandDefinition<TArgs, TResult>): TypedCommand<TArgs, TResult>;
/**
 * Batch invoke multiple commands
 * @param commands - Array of [command, args] tuples
 * @returns Promise with array of results
 */
export declare function batchInvoke<T extends unknown[]>(commands: Array<[string, InvokeArgs?]>): Promise<T>;
/**
 * Invoke with timeout
 * @param command - Command name
 * @param args - Command arguments
 * @param timeout - Timeout in milliseconds
 * @returns Promise with command result
 */
export declare function invokeWithTimeout<T = unknown>(command: string, args?: InvokeArgs, timeout?: number): Promise<T>;
/**
 * Invoke with retry
 * @param command - Command name
 * @param args - Command arguments
 * @param options - Retry options
 * @returns Promise with command result
 */
export declare function invokeWithRetry<T = unknown>(command: string, args?: InvokeArgs, options?: {
    maxRetries?: number;
    delay?: number;
    backoff?: number;
}): Promise<T>;
//# sourceMappingURL=invoke.d.ts.map