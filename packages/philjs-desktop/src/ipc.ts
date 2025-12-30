/**
 * IPC Bridge for PhilJS Desktop
 * Bidirectional JavaScript <-> Rust communication
 */

import { isTauri } from './tauri/context.js';
import { invoke } from './tauri/invoke.js';
import { listen, emit } from './tauri/events.js';
import type { Event, EventCallback, UnlistenFn } from './tauri/types.js';

// IPC types
export interface IPCBridge {
  /** Invoke a Rust command */
  invoke: <T = unknown>(command: string, args?: Record<string, unknown>) => Promise<T>;
  /** Listen for events from Rust */
  on: <T = unknown>(event: string, callback: (payload: T) => void) => Promise<UnlistenFn>;
  /** Emit event to Rust */
  emit: (event: string, payload?: unknown) => Promise<void>;
  /** Register a JS command handler */
  registerHandler: <TArgs, TResult>(
    name: string,
    handler: (args: TArgs) => TResult | Promise<TResult>
  ) => void;
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
  commands: Record<string, { args: unknown; result: unknown }>;
  events: Record<string, unknown>;
}

// JS command handlers
const jsHandlers = new Map<string, (args: any) => any>();
const eventListeners: UnlistenFn[] = [];

/**
 * Create an IPC bridge
 */
export function createIPCBridge(options: IPCBridgeOptions = {}): IPCBridge {
  const { commandPrefix = '', eventPrefix = '', debug = false } = options;

  const log = debug
    ? (msg: string, ...args: any[]) => console.log(`[IPC] ${msg}`, ...args)
    : () => {};

  // Set up listener for JS command calls from Rust
  if (isTauri()) {
    setupRustToJSBridge(log);
  }

  return {
    async invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
      const fullCommand = commandPrefix ? `${commandPrefix}${command}` : command;
      log(`invoke: ${fullCommand}`, args);
      return invoke<T>(fullCommand, args);
    },

    async on<T>(event: string, callback: (payload: T) => void): Promise<UnlistenFn> {
      const fullEvent = eventPrefix ? `${eventPrefix}${event}` : event;
      log(`on: ${fullEvent}`);

      const unlisten = await listen<T>(fullEvent, (e: Event<T>) => {
        log(`received: ${fullEvent}`, e.payload);
        callback(e.payload);
      });

      eventListeners.push(unlisten);
      return unlisten;
    },

    async emit(event: string, payload?: unknown): Promise<void> {
      const fullEvent = eventPrefix ? `${eventPrefix}${event}` : event;
      log(`emit: ${fullEvent}`, payload);
      return emit(fullEvent, payload);
    },

    registerHandler<TArgs, TResult>(
      name: string,
      handler: (args: TArgs) => TResult | Promise<TResult>
    ): void {
      const fullName = commandPrefix ? `${commandPrefix}${name}` : name;
      log(`registerHandler: ${fullName}`);
      jsHandlers.set(fullName, handler);
    },

    getHandlers(): string[] {
      return Array.from(jsHandlers.keys());
    },

    destroy(): void {
      log('destroy bridge');
      jsHandlers.clear();
      eventListeners.forEach(fn => fn());
      eventListeners.length = 0;
    },
  };
}

/**
 * Set up the Rust -> JS bridge
 */
async function setupRustToJSBridge(log: (msg: string, ...args: any[]) => void): Promise<void> {
  // Listen for JS command invocations from Rust
  await listen<{ id: string; command: string; args: unknown }>('__philjs_ipc_invoke__', async (event: Event<{ id: string; command: string; args: unknown }>) => {
    const { id, command, args } = event.payload;
    log(`Rust -> JS invoke: ${command}`, args);

    const handler = jsHandlers.get(command);
    if (!handler) {
      emit('__philjs_ipc_response__', {
        id,
        error: `Handler not found: ${command}`,
      });
      return;
    }

    try {
      const result = await handler(args);
      emit('__philjs_ipc_response__', { id, result });
    } catch (error) {
      emit('__philjs_ipc_response__', {
        id,
        error: String(error),
      });
    }
  });
}

/**
 * Register a JS command handler (standalone function)
 */
export function registerCommand<TArgs, TResult>(
  name: string,
  handler: (args: TArgs) => TResult | Promise<TResult>
): () => void {
  jsHandlers.set(name, handler);
  return () => {
    jsHandlers.delete(name);
  };
}

/**
 * Expose an API object to Rust
 */
export function exposeToRust<T extends Record<string, (...args: any[]) => any>>(
  api: T,
  options: { prefix?: string } = {}
): () => void {
  const { prefix = '' } = options;
  const registered: string[] = [];

  for (const [key, value] of Object.entries(api)) {
    if (typeof value === 'function') {
      const name = prefix ? `${prefix}.${key}` : key;
      jsHandlers.set(name, value);
      registered.push(name);
    }
  }

  return () => {
    for (const name of registered) {
      jsHandlers.delete(name);
    }
  };
}

/**
 * Create a typed IPC client
 */
export function createTypedIPC<TSchema extends TypedIPCSchema>(): {
  invoke: <K extends keyof TSchema['commands']>(
    command: K,
    args: TSchema['commands'][K]['args']
  ) => Promise<TSchema['commands'][K]['result']>;
  on: <K extends keyof TSchema['events']>(
    event: K,
    callback: (payload: TSchema['events'][K]) => void
  ) => Promise<UnlistenFn>;
  emit: <K extends keyof TSchema['events']>(
    event: K,
    payload: TSchema['events'][K]
  ) => Promise<void>;
} {
  return {
    async invoke<K extends keyof TSchema['commands']>(
      command: K,
      args: TSchema['commands'][K]['args']
    ): Promise<TSchema['commands'][K]['result']> {
      return invoke(command as string, args as Record<string, unknown>);
    },

    async on<K extends keyof TSchema['events']>(
      event: K,
      callback: (payload: TSchema['events'][K]) => void
    ): Promise<UnlistenFn> {
      return listen(event as string, (e: Event<TSchema['events'][K]>) => callback(e.payload));
    },

    async emit<K extends keyof TSchema['events']>(
      event: K,
      payload: TSchema['events'][K]
    ): Promise<void> {
      return emit(event as string, payload);
    },
  };
}

/**
 * Create a channel for streaming data
 */
export function createChannel<T>(name: string): {
  send: (data: T) => Promise<void>;
  receive: (callback: (data: T) => void) => Promise<UnlistenFn>;
  close: () => void;
} {
  const channelEvent = `__philjs_channel_${name}__`;
  let closed = false;
  let unlisten: UnlistenFn | null = null;

  return {
    async send(data: T): Promise<void> {
      if (closed) throw new Error('Channel is closed');
      await emit(channelEvent, data);
    },

    async receive(callback: (data: T) => void): Promise<UnlistenFn> {
      if (closed) throw new Error('Channel is closed');
      unlisten = await listen<T>(channelEvent, (e: Event<T>) => callback(e.payload));
      return unlisten!;
    },

    close(): void {
      closed = true;
      unlisten?.();
    },
  };
}

/**
 * Create a request/response channel
 */
export function createRequestChannel<TReq, TRes>(name: string): {
  request: (data: TReq) => Promise<TRes>;
  respond: (handler: (request: TReq) => TRes | Promise<TRes>) => Promise<UnlistenFn>;
} {
  const requestEvent = `__philjs_request_${name}__`;
  const responseEvent = `__philjs_response_${name}__`;
  const pendingRequests = new Map<string, (response: TRes) => void>();

  return {
    async request(data: TReq): Promise<TRes> {
      const id = `${Date.now()}-${Math.random()}`;

      const responsePromise = new Promise<TRes>((resolve) => {
        pendingRequests.set(id, resolve);
      });

      // Set up response listener
      const unlisten = await listen<{ id: string; response: TRes }>(responseEvent, (e: Event<{ id: string; response: TRes }>) => {
        const resolver = pendingRequests.get(e.payload.id);
        if (resolver) {
          resolver(e.payload.response);
          pendingRequests.delete(e.payload.id);
        }
      });

      // Send request
      await emit(requestEvent, { id, data });

      // Wait for response
      const response = await responsePromise;
      unlisten();

      return response;
    },

    async respond(handler: (request: TReq) => TRes | Promise<TRes>): Promise<UnlistenFn> {
      return listen<{ id: string; data: TReq }>(requestEvent, async (e: Event<{ id: string; data: TReq }>) => {
        const { id, data } = e.payload;
        const response = await handler(data);
        await emit(responseEvent, { id, response });
      });
    },
  };
}
