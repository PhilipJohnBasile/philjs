/**
 * IPC Bridge for PhilJS Desktop
 * Bidirectional JavaScript <-> Rust communication
 */
import type { UnlistenFn } from './tauri/types.js';
export interface IPCBridge {
    /** Invoke a Rust command */
    invoke: <T = unknown>(command: string, args?: Record<string, unknown>) => Promise<T>;
    /** Listen for events from Rust */
    on: <T = unknown>(event: string, callback: (payload: T) => void) => Promise<UnlistenFn>;
    /** Emit event to Rust */
    emit: (event: string, payload?: unknown) => Promise<void>;
    /** Register a JS command handler */
    registerHandler: <TArgs, TResult>(name: string, handler: (args: TArgs) => TResult | Promise<TResult>) => void;
    /** Get registered handlers */
    getHandlers: () => string[];
    /** Destroy bridge */
    destroy: () => void;
}
export interface IPCBridgeOptions {
    /** Prefix for all commands */
    commandPrefix?: string;
    /** Prefix for all events */
    eventPrefix?: string;
    /** Enable logging */
    debug?: boolean;
}
export interface TypedIPCSchema {
    commands: Record<string, {
        args: unknown;
        result: unknown;
    }>;
    events: Record<string, unknown>;
}
/**
 * Create an IPC bridge
 */
export declare function createIPCBridge(options?: IPCBridgeOptions): IPCBridge;
/**
 * Register a JS command handler (standalone function)
 */
export declare function registerCommand<TArgs, TResult>(name: string, handler: (args: TArgs) => TResult | Promise<TResult>): () => void;
/**
 * Expose an API object to Rust
 */
export declare function exposeToRust<T extends Record<string, (...args: any[]) => any>>(api: T, options?: {
    prefix?: string;
}): () => void;
/**
 * Create a typed IPC client
 */
export declare function createTypedIPC<TSchema extends TypedIPCSchema>(): {
    invoke: <K extends keyof TSchema['commands']>(command: K, args: TSchema['commands'][K]['args']) => Promise<TSchema['commands'][K]['result']>;
    on: <K extends keyof TSchema['events']>(event: K, callback: (payload: TSchema['events'][K]) => void) => Promise<UnlistenFn>;
    emit: <K extends keyof TSchema['events']>(event: K, payload: TSchema['events'][K]) => Promise<void>;
};
/**
 * Create a channel for streaming data
 */
export declare function createChannel<T>(name: string): {
    send: (data: T) => Promise<void>;
    receive: (callback: (data: T) => void) => Promise<UnlistenFn>;
    close: () => void;
};
/**
 * Create a request/response channel
 */
export declare function createRequestChannel<TReq, TRes>(name: string): {
    request: (data: TReq) => Promise<TRes>;
    respond: (handler: (request: TReq) => TRes | Promise<TRes>) => Promise<UnlistenFn>;
};
//# sourceMappingURL=ipc.d.ts.map