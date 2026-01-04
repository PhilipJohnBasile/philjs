/**
 * IPC Bridge for PhilJS Desktop
 * Bidirectional JavaScript <-> Rust communication
 */
import { isTauri } from './tauri/context.js';
import { invoke } from './tauri/invoke.js';
import { listen, emit } from './tauri/events.js';
// JS command handlers
const jsHandlers = new Map();
const eventListeners = [];
/**
 * Create an IPC bridge
 */
export function createIPCBridge(options = {}) {
    const { commandPrefix = '', eventPrefix = '', debug = false } = options;
    const log = debug
        ? (msg, ...args) => console.log(`[IPC] ${msg}`, ...args)
        : () => { };
    // Set up listener for JS command calls from Rust
    if (isTauri()) {
        setupRustToJSBridge(log);
    }
    return {
        async invoke(command, args) {
            const fullCommand = commandPrefix ? `${commandPrefix}${command}` : command;
            log(`invoke: ${fullCommand}`, args);
            return invoke(fullCommand, args);
        },
        async on(event, callback) {
            const fullEvent = eventPrefix ? `${eventPrefix}${event}` : event;
            log(`on: ${fullEvent}`);
            const unlisten = await listen(fullEvent, (e) => {
                log(`received: ${fullEvent}`, e.payload);
                callback(e.payload);
            });
            eventListeners.push(unlisten);
            return unlisten;
        },
        async emit(event, payload) {
            const fullEvent = eventPrefix ? `${eventPrefix}${event}` : event;
            log(`emit: ${fullEvent}`, payload);
            return emit(fullEvent, payload);
        },
        registerHandler(name, handler) {
            const fullName = commandPrefix ? `${commandPrefix}${name}` : name;
            log(`registerHandler: ${fullName}`);
            jsHandlers.set(fullName, handler);
        },
        getHandlers() {
            return Array.from(jsHandlers.keys());
        },
        destroy() {
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
async function setupRustToJSBridge(log) {
    // Listen for JS command invocations from Rust
    await listen('__philjs_ipc_invoke__', async (event) => {
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
        }
        catch (error) {
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
export function registerCommand(name, handler) {
    jsHandlers.set(name, handler);
    return () => {
        jsHandlers.delete(name);
    };
}
/**
 * Expose an API object to Rust
 */
export function exposeToRust(api, options = {}) {
    const { prefix = '' } = options;
    const registered = [];
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
export function createTypedIPC() {
    return {
        async invoke(command, args) {
            return invoke(command, args);
        },
        async on(event, callback) {
            return listen(event, (e) => callback(e.payload));
        },
        async emit(event, payload) {
            return emit(event, payload);
        },
    };
}
/**
 * Create a channel for streaming data
 */
export function createChannel(name) {
    const channelEvent = `__philjs_channel_${name}__`;
    let closed = false;
    let unlisten = null;
    return {
        async send(data) {
            if (closed)
                throw new Error('Channel is closed');
            await emit(channelEvent, data);
        },
        async receive(callback) {
            if (closed)
                throw new Error('Channel is closed');
            unlisten = await listen(channelEvent, (e) => callback(e.payload));
            return unlisten;
        },
        close() {
            closed = true;
            unlisten?.();
        },
    };
}
/**
 * Create a request/response channel
 */
export function createRequestChannel(name) {
    const requestEvent = `__philjs_request_${name}__`;
    const responseEvent = `__philjs_response_${name}__`;
    const pendingRequests = new Map();
    return {
        async request(data) {
            const id = `${Date.now()}-${Math.random()}`;
            const responsePromise = new Promise((resolve) => {
                pendingRequests.set(id, resolve);
            });
            // Set up response listener
            const unlisten = await listen(responseEvent, (e) => {
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
        async respond(handler) {
            return listen(requestEvent, async (e) => {
                const { id, data } = e.payload;
                const response = await handler(data);
                await emit(responseEvent, { id, response });
            });
        },
    };
}
//# sourceMappingURL=ipc.js.map