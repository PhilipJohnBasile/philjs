/**
 * PhilJS Native - Tauri Command Helpers
 *
 * Provides utilities for creating and invoking Tauri commands
 * with type safety and error handling.
 */

import { invoke, invokeSafe, isTauri } from './index.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Command result wrapper
 */
export interface CommandResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Command options
 */
export interface CommandOptions {
  /** Timeout in milliseconds */
  timeout?: number;
  /** Whether to retry on failure */
  retry?: boolean;
  /** Number of retry attempts */
  retryCount?: number;
  /** Delay between retries in ms */
  retryDelay?: number;
}

/**
 * Batch command
 */
export interface BatchCommand<T = unknown> {
  name: string;
  args?: Record<string, unknown>;
  transform?: (result: unknown) => T;
}

// ============================================================================
// Command Utilities
// ============================================================================

/**
 * Create a typed command function
 */
export function defineCommand<
  TArgs extends Record<string, unknown> = Record<string, unknown>,
  TResult = unknown
>(name: string) {
  return async (args?: TArgs, options?: CommandOptions): Promise<TResult> => {
    if (options?.timeout) {
      return invokeWithTimeout<TResult>(name, args, options.timeout);
    }

    if (options?.retry) {
      return invokeWithRetry<TResult>(
        name,
        args,
        options.retryCount || 3,
        options.retryDelay || 1000
      );
    }

    return invoke<TResult>(name, args);
  };
}

/**
 * Invoke command with timeout
 */
export async function invokeWithTimeout<T>(
  cmd: string,
  args?: Record<string, unknown>,
  timeout = 30000
): Promise<T> {
  return Promise.race([
    invoke<T>(cmd, args),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Command "${cmd}" timed out after ${timeout}ms`)), timeout)
    ),
  ]);
}

/**
 * Invoke command with retry
 */
export async function invokeWithRetry<T>(
  cmd: string,
  args?: Record<string, unknown>,
  retries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < retries; i++) {
    try {
      return await invoke<T>(cmd, args);
    } catch (error) {
      lastError = error as Error;

      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError || new Error(`Command "${cmd}" failed after ${retries} retries`);
}

/**
 * Invoke command and wrap result
 */
export async function invokeWrapped<T>(
  cmd: string,
  args?: Record<string, unknown>
): Promise<CommandResult<T>> {
  try {
    const data = await invoke<T>(cmd, args);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Execute multiple commands in parallel
 */
export async function invokeParallel<T extends unknown[]>(
  commands: { [K in keyof T]: BatchCommand<T[K]> }
): Promise<{ [K in keyof T]: CommandResult<T[K]> }> {
  const results = await Promise.allSettled(
    commands.map(async (cmd) => {
      const result = await invoke(cmd.name, cmd.args);
      return cmd.transform ? cmd.transform(result) : result;
    })
  );

  return results.map((result) => {
    if (result.status === 'fulfilled') {
      return { success: true, data: result.value };
    }
    return { success: false, error: result.reason?.message || 'Unknown error' };
  }) as { [K in keyof T]: CommandResult<T[K]> };
}

/**
 * Execute commands sequentially
 */
export async function invokeSequential<T>(
  commands: BatchCommand<T>[]
): Promise<CommandResult<T>[]> {
  const results: CommandResult<T>[] = [];

  for (const cmd of commands) {
    try {
      const result = await invoke(cmd.name, cmd.args);
      const data = cmd.transform ? cmd.transform(result) : (result as T);
      results.push({ success: true, data });
    } catch (error) {
      results.push({ success: false, error: (error as Error).message });
    }
  }

  return results;
}

/**
 * Create a command that runs in the background
 */
export function createBackgroundCommand<TArgs extends Record<string, unknown>, TResult>(
  name: string,
  onProgress?: (progress: number) => void
): (args?: TArgs) => { promise: Promise<TResult>; cancel: () => void } {
  return (args?: TArgs) => {
    let cancelled = false;
    const abortController = new AbortController();

    const promise = new Promise<TResult>(async (resolve, reject) => {
      try {
        // Start the background command
        const result = await invoke<TResult>(name, {
          ...args,
          _background: true,
        });

        if (!cancelled) {
          resolve(result);
        }
      } catch (error) {
        if (!cancelled) {
          reject(error);
        }
      }
    });

    const cancel = () => {
      cancelled = true;
      abortController.abort();
      // Optionally invoke a cancel command
      invokeSafe(`${name}_cancel`);
    };

    return { promise, cancel };
  };
}

// ============================================================================
// Common Commands
// ============================================================================

/**
 * Get system information
 */
export const getSystemInfo = defineCommand<
  never,
  {
    os: string;
    arch: string;
    platform: string;
    version: string;
    hostname: string;
  }
>('get_system_info');

/**
 * Get environment variable
 */
export const getEnv = defineCommand<{ name: string }, string | null>('get_env');

/**
 * Set environment variable
 */
export const setEnv = defineCommand<{ name: string; value: string }, void>('set_env');

/**
 * Execute shell command
 */
export const executeShell = defineCommand<
  {
    program: string;
    args?: string[];
    cwd?: string;
    env?: Record<string, string>;
  },
  { code: number; stdout: string; stderr: string }
>('execute_shell');

/**
 * Open URL in default browser
 */
export const openUrl = defineCommand<{ url: string }, void>('open_url');

/**
 * Open path in file manager
 */
export const openPath = defineCommand<{ path: string }, void>('open_path');

/**
 * Get clipboard text
 */
export const getClipboardText = defineCommand<never, string>('get_clipboard_text');

/**
 * Set clipboard text
 */
export const setClipboardText = defineCommand<{ text: string }, void>('set_clipboard_text');

// ============================================================================
// Command Builder
// ============================================================================

/**
 * Command builder for creating complex command chains
 */
export class CommandBuilder<T = unknown> {
  private commands: BatchCommand[] = [];
  private lastResult: T | undefined;

  /**
   * Add a command to the chain
   */
  add<R>(
    name: string,
    args?: Record<string, unknown> | ((prev: T) => Record<string, unknown>),
    transform?: (result: unknown) => R
  ): CommandBuilder<R> {
    this.commands.push({
      name,
      ...(typeof args === 'function' ? { args: {} } : args !== undefined ? { args } : {}),
      ...(transform !== undefined ? { transform } : {}),
    });
    return this as unknown as CommandBuilder<R>;
  }

  /**
   * Add a conditional command
   */
  addIf<R>(
    condition: boolean | ((prev: T) => boolean),
    name: string,
    args?: Record<string, unknown>,
    transform?: (result: unknown) => R
  ): CommandBuilder<R | T> {
    if (typeof condition === 'function') {
      // Condition will be evaluated at execution
      this.commands.push({
        name: `__conditional__${name}`,
        args: { condition, ...(args !== undefined ? { actualArgs: args } : {}) },
        ...(transform !== undefined ? { transform } : {}),
      });
    } else if (condition) {
      this.add(name, args, transform);
    }
    return this as unknown as CommandBuilder<R | T>;
  }

  /**
   * Execute all commands
   */
  async execute(): Promise<T> {
    for (const cmd of this.commands) {
      if (cmd.name.startsWith('__conditional__')) {
        const { condition, actualArgs } = cmd.args as any;
        const shouldRun = typeof condition === 'function' ? condition(this.lastResult) : condition;

        if (shouldRun) {
          const actualName = cmd.name.replace('__conditional__', '');
          const result = await invoke(actualName, actualArgs);
          this.lastResult = (cmd.transform ? cmd.transform(result) : result) as T;
        }
      } else {
        const result = await invoke(cmd.name, cmd.args);
        this.lastResult = (cmd.transform ? cmd.transform(result) : result) as T;
      }
    }

    return this.lastResult as T;
  }

  /**
   * Execute with error handling
   */
  async executeWrapped(): Promise<CommandResult<T>> {
    try {
      const data = await this.execute();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Reset the builder
   */
  reset(): void {
    this.commands = [];
    this.lastResult = undefined;
  }
}

/**
 * Create a new command builder
 */
export function commandBuilder<T = unknown>(): CommandBuilder<T> {
  return new CommandBuilder<T>();
}

// ============================================================================
// Mock Commands for Development
// ============================================================================

/**
 * Register mock commands for development/testing
 */
const mockCommands = new Map<string, (args?: any) => any>();

/**
 * Register a mock command
 */
export function registerMockCommand(
  name: string,
  handler: (args?: Record<string, unknown>) => unknown
): void {
  mockCommands.set(name, handler);
}

/**
 * Invoke mock command (for testing)
 */
export async function invokeMock<T>(
  cmd: string,
  args?: Record<string, unknown>
): Promise<T> {
  const handler = mockCommands.get(cmd);
  if (!handler) {
    throw new Error(`Mock command "${cmd}" not registered`);
  }
  return handler(args) as T;
}

/**
 * Clear all mock commands
 */
export function clearMockCommands(): void {
  mockCommands.clear();
}

// ============================================================================
// Exports
// ============================================================================

export default {
  invoke,
  invokeSafe,
  invokeWithTimeout,
  invokeWithRetry,
  invokeWrapped,
  invokeParallel,
  invokeSequential,
  defineCommand,
  createBackgroundCommand,
  commandBuilder,
  CommandBuilder,
};
