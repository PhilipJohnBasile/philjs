/**
 * PhilJS Native - Tauri Command Helpers
 *
 * Provides utilities for creating and invoking Tauri commands
 * with type safety and error handling.
 */
import { invoke, invokeSafe } from './index.js';
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
/**
 * Create a typed command function
 */
export declare function defineCommand<TArgs extends Record<string, unknown> = Record<string, unknown>, TResult = unknown>(name: string): (args?: TArgs, options?: CommandOptions) => Promise<TResult>;
/**
 * Invoke command with timeout
 */
export declare function invokeWithTimeout<T>(cmd: string, args?: Record<string, unknown>, timeout?: number): Promise<T>;
/**
 * Invoke command with retry
 */
export declare function invokeWithRetry<T>(cmd: string, args?: Record<string, unknown>, retries?: number, delay?: number): Promise<T>;
/**
 * Invoke command and wrap result
 */
export declare function invokeWrapped<T>(cmd: string, args?: Record<string, unknown>): Promise<CommandResult<T>>;
/**
 * Execute multiple commands in parallel
 */
export declare function invokeParallel<T extends unknown[]>(commands: {
    [K in keyof T]: BatchCommand<T[K]>;
}): Promise<{
    [K in keyof T]: CommandResult<T[K]>;
}>;
/**
 * Execute commands sequentially
 */
export declare function invokeSequential<T>(commands: BatchCommand<T>[]): Promise<CommandResult<T>[]>;
/**
 * Create a command that runs in the background
 */
export declare function createBackgroundCommand<TArgs extends Record<string, unknown>, TResult>(name: string, onProgress?: (progress: number) => void): (args?: TArgs) => {
    promise: Promise<TResult>;
    cancel: () => void;
};
/**
 * Get system information
 */
export declare const getSystemInfo: (args?: undefined, options?: CommandOptions) => Promise<{
    os: string;
    arch: string;
    platform: string;
    version: string;
    hostname: string;
}>;
/**
 * Get environment variable
 */
export declare const getEnv: (args?: {
    name: string;
} | undefined, options?: CommandOptions) => Promise<string | null>;
/**
 * Set environment variable
 */
export declare const setEnv: (args?: {
    name: string;
    value: string;
} | undefined, options?: CommandOptions) => Promise<void>;
/**
 * Execute shell command
 */
export declare const executeShell: (args?: {
    program: string;
    args?: string[];
    cwd?: string;
    env?: Record<string, string>;
} | undefined, options?: CommandOptions) => Promise<{
    code: number;
    stdout: string;
    stderr: string;
}>;
/**
 * Open URL in default browser
 */
export declare const openUrl: (args?: {
    url: string;
} | undefined, options?: CommandOptions) => Promise<void>;
/**
 * Open path in file manager
 */
export declare const openPath: (args?: {
    path: string;
} | undefined, options?: CommandOptions) => Promise<void>;
/**
 * Get clipboard text
 */
export declare const getClipboardText: (args?: undefined, options?: CommandOptions) => Promise<string>;
/**
 * Set clipboard text
 */
export declare const setClipboardText: (args?: {
    text: string;
} | undefined, options?: CommandOptions) => Promise<void>;
/**
 * Command builder for creating complex command chains
 */
export declare class CommandBuilder<T = unknown> {
    private commands;
    private lastResult;
    /**
     * Add a command to the chain
     */
    add<R>(name: string, args?: Record<string, unknown> | ((prev: T) => Record<string, unknown>), transform?: (result: unknown) => R): CommandBuilder<R>;
    /**
     * Add a conditional command
     */
    addIf<R>(condition: boolean | ((prev: T) => boolean), name: string, args?: Record<string, unknown>, transform?: (result: unknown) => R): CommandBuilder<R | T>;
    /**
     * Execute all commands
     */
    execute(): Promise<T>;
    /**
     * Execute with error handling
     */
    executeWrapped(): Promise<CommandResult<T>>;
    /**
     * Reset the builder
     */
    reset(): void;
}
/**
 * Create a new command builder
 */
export declare function commandBuilder<T = unknown>(): CommandBuilder<T>;
/**
 * Register a mock command
 */
export declare function registerMockCommand(name: string, handler: (args?: Record<string, unknown>) => unknown): void;
/**
 * Invoke mock command (for testing)
 */
export declare function invokeMock<T>(cmd: string, args?: Record<string, unknown>): Promise<T>;
/**
 * Clear all mock commands
 */
export declare function clearMockCommands(): void;
declare const _default: {
    invoke: typeof invoke;
    invokeSafe: typeof invokeSafe;
    invokeWithTimeout: typeof invokeWithTimeout;
    invokeWithRetry: typeof invokeWithRetry;
    invokeWrapped: typeof invokeWrapped;
    invokeParallel: typeof invokeParallel;
    invokeSequential: typeof invokeSequential;
    defineCommand: typeof defineCommand;
    createBackgroundCommand: typeof createBackgroundCommand;
    commandBuilder: typeof commandBuilder;
    CommandBuilder: typeof CommandBuilder;
};
export default _default;
//# sourceMappingURL=commands.d.ts.map