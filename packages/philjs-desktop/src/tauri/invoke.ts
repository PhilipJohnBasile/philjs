/**
 * Tauri command invocation utilities
 */

import type { InvokeArgs, TypedCommand, CommandDefinition } from './types';
import { getTauriContext, isTauri } from './context';

/**
 * Invoke a Tauri command
 * @param command - Command name
 * @param args - Command arguments
 * @returns Promise with command result
 */
export async function invoke<T = unknown>(
  command: string,
  args?: InvokeArgs
): Promise<T> {
  if (!isTauri()) {
    throw new Error(`Cannot invoke command "${command}": Not running in Tauri environment`);
  }

  const context = getTauriContext();
  return context.invoke<T>(command, args);
}

/**
 * Create a type-safe command invoker
 * @param name - Command name
 * @returns Typed invoke function
 */
export function createCommand<TArgs extends InvokeArgs, TResult>(
  name: string
): TypedCommand<TArgs, TResult> {
  const fn = async (args: TArgs): Promise<TResult> => {
    return invoke<TResult>(name, args);
  };
  fn.commandName = name;
  return fn;
}

/**
 * Define a typed command with validation
 * @param definition - Command definition
 * @returns Typed command function
 */
export function defineCommand<TArgs extends InvokeArgs, TResult>(
  definition: CommandDefinition<TArgs, TResult>
): TypedCommand<TArgs, TResult> {
  const { name, args: argSchema, handler } = definition;

  const fn = async (args: TArgs): Promise<TResult> => {
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
function validateArgs<T extends InvokeArgs>(
  args: T,
  schema: Record<string, { type: string; required?: boolean; default?: unknown }>
): T {
  const result = { ...args } as T;

  for (const [key, config] of Object.entries(schema)) {
    const value = args[key];

    if (value === undefined) {
      if (config.required) {
        throw new Error(`Missing required argument: ${key}`);
      }
      if (config.default !== undefined) {
        (result as any)[key] = config.default;
      }
      continue;
    }

    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== config.type) {
      throw new Error(
        `Invalid type for argument "${key}": expected ${config.type}, got ${actualType}`
      );
    }
  }

  return result;
}

/**
 * Batch invoke multiple commands
 * @param commands - Array of [command, args] tuples
 * @returns Promise with array of results
 */
export async function batchInvoke<T extends unknown[]>(
  commands: Array<[string, InvokeArgs?]>
): Promise<T> {
  const results = await Promise.all(
    commands.map(([command, args]) => invoke(command, args))
  );
  return results as T;
}

/**
 * Invoke with timeout
 * @param command - Command name
 * @param args - Command arguments
 * @param timeout - Timeout in milliseconds
 * @returns Promise with command result
 */
export async function invokeWithTimeout<T = unknown>(
  command: string,
  args?: InvokeArgs,
  timeout = 30000
): Promise<T> {
  return Promise.race([
    invoke<T>(command, args),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Command "${command}" timed out after ${timeout}ms`)), timeout)
    ),
  ]);
}

/**
 * Invoke with retry
 * @param command - Command name
 * @param args - Command arguments
 * @param options - Retry options
 * @returns Promise with command result
 */
export async function invokeWithRetry<T = unknown>(
  command: string,
  args?: InvokeArgs,
  options: { maxRetries?: number; delay?: number; backoff?: number } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = 2 } = options;

  let lastError: Error | undefined;
  let currentDelay = delay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await invoke<T>(command, args);
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= backoff;
      }
    }
  }

  throw lastError;
}
