/**
 * PhilJS Native - Tauri Command Helpers
 *
 * Provides utilities for creating and invoking Tauri commands
 * with type safety and error handling.
 */
import { invoke, invokeSafe, isTauri } from './index.js';
// ============================================================================
// Command Utilities
// ============================================================================
/**
 * Create a typed command function
 */
export function defineCommand(name) {
    return async (args, options) => {
        if (options?.timeout) {
            return invokeWithTimeout(name, args, options.timeout);
        }
        if (options?.retry) {
            return invokeWithRetry(name, args, options.retryCount || 3, options.retryDelay || 1000);
        }
        return invoke(name, args);
    };
}
/**
 * Invoke command with timeout
 */
export async function invokeWithTimeout(cmd, args, timeout = 30000) {
    return Promise.race([
        invoke(cmd, args),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Command "${cmd}" timed out after ${timeout}ms`)), timeout)),
    ]);
}
/**
 * Invoke command with retry
 */
export async function invokeWithRetry(cmd, args, retries = 3, delay = 1000) {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            return await invoke(cmd, args);
        }
        catch (error) {
            lastError = error;
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
export async function invokeWrapped(cmd, args) {
    try {
        const data = await invoke(cmd, args);
        return { success: true, data };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
}
/**
 * Execute multiple commands in parallel
 */
export async function invokeParallel(commands) {
    const results = await Promise.allSettled(commands.map(async (cmd) => {
        const result = await invoke(cmd.name, cmd.args);
        return cmd.transform ? cmd.transform(result) : result;
    }));
    return results.map((result) => {
        if (result.status === 'fulfilled') {
            return { success: true, data: result.value };
        }
        return { success: false, error: result.reason?.message || 'Unknown error' };
    });
}
/**
 * Execute commands sequentially
 */
export async function invokeSequential(commands) {
    const results = [];
    for (const cmd of commands) {
        try {
            const result = await invoke(cmd.name, cmd.args);
            const data = cmd.transform ? cmd.transform(result) : result;
            results.push({ success: true, data });
        }
        catch (error) {
            results.push({ success: false, error: error.message });
        }
    }
    return results;
}
/**
 * Create a command that runs in the background
 */
export function createBackgroundCommand(name, onProgress) {
    return (args) => {
        let cancelled = false;
        const abortController = new AbortController();
        const promise = new Promise(async (resolve, reject) => {
            try {
                // Start the background command
                const result = await invoke(name, {
                    ...args,
                    _background: true,
                });
                if (!cancelled) {
                    resolve(result);
                }
            }
            catch (error) {
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
export const getSystemInfo = defineCommand('get_system_info');
/**
 * Get environment variable
 */
export const getEnv = defineCommand('get_env');
/**
 * Set environment variable
 */
export const setEnv = defineCommand('set_env');
/**
 * Execute shell command
 */
export const executeShell = defineCommand('execute_shell');
/**
 * Open URL in default browser
 */
export const openUrl = defineCommand('open_url');
/**
 * Open path in file manager
 */
export const openPath = defineCommand('open_path');
/**
 * Get clipboard text
 */
export const getClipboardText = defineCommand('get_clipboard_text');
/**
 * Set clipboard text
 */
export const setClipboardText = defineCommand('set_clipboard_text');
// ============================================================================
// Command Builder
// ============================================================================
/**
 * Command builder for creating complex command chains
 */
export class CommandBuilder {
    commands = [];
    lastResult;
    /**
     * Add a command to the chain
     */
    add(name, args, transform) {
        this.commands.push({
            name,
            ...(typeof args === 'function' ? { args: {} } : args !== undefined ? { args } : {}),
            ...(transform !== undefined ? { transform } : {}),
        });
        return this;
    }
    /**
     * Add a conditional command
     */
    addIf(condition, name, args, transform) {
        if (typeof condition === 'function') {
            // Condition will be evaluated at execution
            this.commands.push({
                name: `__conditional__${name}`,
                args: { condition, ...(args !== undefined ? { actualArgs: args } : {}) },
                ...(transform !== undefined ? { transform } : {}),
            });
        }
        else if (condition) {
            this.add(name, args, transform);
        }
        return this;
    }
    /**
     * Execute all commands
     */
    async execute() {
        for (const cmd of this.commands) {
            if (cmd.name.startsWith('__conditional__')) {
                const { condition, actualArgs } = cmd.args;
                const shouldRun = typeof condition === 'function' ? condition(this.lastResult) : condition;
                if (shouldRun) {
                    const actualName = cmd.name.replace('__conditional__', '');
                    const result = await invoke(actualName, actualArgs);
                    this.lastResult = (cmd.transform ? cmd.transform(result) : result);
                }
            }
            else {
                const result = await invoke(cmd.name, cmd.args);
                this.lastResult = (cmd.transform ? cmd.transform(result) : result);
            }
        }
        return this.lastResult;
    }
    /**
     * Execute with error handling
     */
    async executeWrapped() {
        try {
            const data = await this.execute();
            return { success: true, data };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    /**
     * Reset the builder
     */
    reset() {
        this.commands = [];
        this.lastResult = undefined;
    }
}
/**
 * Create a new command builder
 */
export function commandBuilder() {
    return new CommandBuilder();
}
// ============================================================================
// Mock Commands for Development
// ============================================================================
/**
 * Register mock commands for development/testing
 */
const mockCommands = new Map();
/**
 * Register a mock command
 */
export function registerMockCommand(name, handler) {
    mockCommands.set(name, handler);
}
/**
 * Invoke mock command (for testing)
 */
export async function invokeMock(cmd, args) {
    const handler = mockCommands.get(cmd);
    if (!handler) {
        throw new Error(`Mock command "${cmd}" not registered`);
    }
    return handler(args);
}
/**
 * Clear all mock commands
 */
export function clearMockCommands() {
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
//# sourceMappingURL=commands.js.map