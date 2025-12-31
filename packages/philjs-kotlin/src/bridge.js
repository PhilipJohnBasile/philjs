/**
 * Kotlin WebView Bridge for PhilJS
 *
 * Provides bidirectional JS <-> Kotlin communication via JSON-RPC protocol.
 */
// ============================================================================
// BridgeRuntime Class (TypeScript Side)
// ============================================================================
/**
 * BridgeRuntime manages bidirectional communication between JS and Kotlin.
 *
 * Features:
 * - JSON-RPC protocol implementation
 * - Promise-based call/response with timeout handling
 * - Event subscription system (on, off, once, emit)
 * - Automatic cleanup via Disposable pattern
 *
 * @example
 * ```typescript
 * const bridge = new BridgeRuntime({
 *   defaultTimeout: 5000,
 *   sendMessage: (msg) => window.PhilJSNative?.postMessage(msg)
 * });
 *
 * // Call Kotlin method
 * const result = await bridge.call<string>('getUserName', { userId: 123 });
 *
 * // Listen for Kotlin events
 * bridge.on('locationUpdate', (location) => {
 *   console.log('Location:', location);
 * });
 *
 * // Emit event to Kotlin
 * bridge.emit('userAction', { action: 'click', target: 'button' });
 * ```
 */
export class BridgeRuntime {
    messageId = 0;
    pendingCalls = new Map();
    eventHandlers = new Map();
    onceHandlers = new Map();
    config;
    disposed = false;
    constructor(config = {}) {
        this.config = {
            defaultTimeout: config.defaultTimeout ?? 30000,
            sendMessage: config.sendMessage ?? this.defaultSendMessage.bind(this),
            debug: config.debug ?? false,
        };
        // Register global handler for receiving messages from Kotlin
        this.setupMessageReceiver();
    }
    /**
     * Default message sender (expects PhilJSNative interface on window)
     */
    defaultSendMessage(message) {
        if (typeof window !== 'undefined' && 'PhilJSNative' in window) {
            window
                .PhilJSNative.postMessage(message);
        }
        else {
            this.log('warn', 'PhilJSNative interface not available');
        }
    }
    /**
     * Setup the message receiver to handle messages from Kotlin
     */
    setupMessageReceiver() {
        if (typeof window !== 'undefined') {
            window
                .__philjs_bridge_receive__ = this.handleMessage.bind(this);
        }
    }
    /**
     * Generate unique message ID
     */
    generateId() {
        return `msg_${++this.messageId}_${Date.now()}`;
    }
    /**
     * Debug logging
     */
    log(level, ...args) {
        if (this.config.debug) {
            console[level]('[BridgeRuntime]', ...args);
        }
    }
    /**
     * Handle incoming message from Kotlin
     */
    handleMessage(messageJson) {
        this.log('info', 'Received:', messageJson);
        try {
            const message = JSON.parse(messageJson);
            switch (message.type) {
                case 'response':
                    this.handleResponse(message);
                    break;
                case 'error':
                    this.handleError(message);
                    break;
                case 'event':
                    this.handleEvent(message);
                    break;
                case 'call':
                    this.handleCall(message);
                    break;
                default:
                    this.log('warn', 'Unknown message type:', message.type);
            }
        }
        catch (error) {
            this.log('error', 'Failed to parse message:', error);
        }
    }
    /**
     * Handle response message
     */
    handleResponse(message) {
        const pending = this.pendingCalls.get(message.id);
        if (pending) {
            clearTimeout(pending.timeoutId);
            this.pendingCalls.delete(message.id);
            pending.resolve(message.result);
        }
    }
    /**
     * Handle error message
     */
    handleError(message) {
        const pending = this.pendingCalls.get(message.id);
        if (pending) {
            clearTimeout(pending.timeoutId);
            this.pendingCalls.delete(message.id);
            const error = new Error(message.error?.message ?? 'Unknown error');
            if (message.error?.code !== undefined) {
                error.code = message.error.code;
            }
            if (message.error?.data !== undefined) {
                error.data = message.error.data;
            }
            pending.reject(error);
        }
    }
    /**
     * Handle event message from Kotlin
     */
    handleEvent(message) {
        const eventName = message.method;
        if (!eventName)
            return;
        const handlers = this.eventHandlers.get(eventName);
        if (handlers) {
            for (const handler of handlers) {
                try {
                    handler(message.params);
                }
                catch (error) {
                    this.log('error', `Event handler error for ${eventName}:`, error);
                }
            }
        }
        // Handle once listeners
        const onceHandlers = this.onceHandlers.get(eventName);
        if (onceHandlers) {
            for (const handler of onceHandlers) {
                try {
                    handler(message.params);
                }
                catch (error) {
                    this.log('error', `Once handler error for ${eventName}:`, error);
                }
            }
            this.onceHandlers.delete(eventName);
        }
    }
    /**
     * Handle call message from Kotlin (Kotlin calling JS)
     */
    handleCall(message) {
        const eventName = message.method;
        if (!eventName)
            return;
        // For calls from Kotlin, we treat them as events with response
        const handlers = this.eventHandlers.get(`__call__${eventName}`);
        if (handlers && handlers.size > 0) {
            // Get first handler result
            const handler = handlers.values().next().value;
            if (handler) {
                try {
                    const result = handler(message.params);
                    // If result is a promise, wait for it
                    if (result !== null && typeof result === 'object' && 'then' in result && typeof result.then === 'function') {
                        result.then((res) => this.sendResponse(message.id, res), (err) => this.sendError(message.id, err));
                    }
                    else {
                        this.sendResponse(message.id, result);
                    }
                }
                catch (error) {
                    this.sendError(message.id, error);
                }
            }
        }
        else {
            this.sendError(message.id, new Error(`No handler for method: ${eventName}`));
        }
    }
    /**
     * Send response back to Kotlin
     */
    sendResponse(id, result) {
        this.sendMessage({
            id,
            type: 'response',
            result,
        });
    }
    /**
     * Send error back to Kotlin
     */
    sendError(id, error) {
        this.sendMessage({
            id,
            type: 'error',
            error: {
                code: error.code ?? -1,
                message: error instanceof Error ? error.message : String(error),
                data: error.data,
            },
        });
    }
    /**
     * Send message to Kotlin
     */
    sendMessage(message) {
        const json = JSON.stringify(message);
        this.log('info', 'Sending:', json);
        this.config.sendMessage(json);
    }
    /**
     * Call a Kotlin method and return a Promise with the result.
     * Uses Promise.withResolvers() for clean promise management.
     *
     * @param method - Method name to call
     * @param params - Parameters to pass
     * @param timeout - Optional timeout override
     * @returns Promise resolving to the method result
     *
     * @example
     * ```typescript
     * const user = await bridge.call<User>('getUser', { id: 123 });
     * ```
     */
    call(method, params, timeout) {
        if (this.disposed) {
            return Promise.reject(new Error('Bridge has been disposed'));
        }
        const id = this.generateId();
        const { promise, resolve, reject } = Promise.withResolvers();
        const timeoutMs = timeout ?? this.config.defaultTimeout;
        const timeoutId = setTimeout(() => {
            this.pendingCalls.delete(id);
            reject(new Error(`Call to '${method}' timed out after ${timeoutMs}ms`));
        }, timeoutMs);
        this.pendingCalls.set(id, {
            resolve: resolve,
            reject,
            timeoutId,
        });
        this.sendMessage({
            id,
            type: 'call',
            method,
            params,
        });
        return promise;
    }
    /**
     * Subscribe to an event from Kotlin.
     *
     * @param event - Event name
     * @param handler - Event handler
     * @returns Unsubscribe function
     *
     * @example
     * ```typescript
     * const unsubscribe = bridge.on('locationUpdate', (loc) => {
     *   console.log(loc.lat, loc.lng);
     * });
     * // Later: unsubscribe();
     * ```
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event).add(handler);
        return () => this.off(event, handler);
    }
    /**
     * Unsubscribe from an event.
     *
     * @param event - Event name
     * @param handler - Handler to remove
     */
    off(event, handler) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.eventHandlers.delete(event);
            }
        }
    }
    /**
     * Subscribe to an event once. Handler is automatically removed after first call.
     *
     * @param event - Event name
     * @param handler - Event handler
     * @returns Unsubscribe function
     */
    once(event, handler) {
        if (!this.onceHandlers.has(event)) {
            this.onceHandlers.set(event, new Set());
        }
        this.onceHandlers.get(event).add(handler);
        return () => {
            const handlers = this.onceHandlers.get(event);
            if (handlers) {
                handlers.delete(handler);
            }
        };
    }
    /**
     * Emit an event to Kotlin.
     *
     * @param event - Event name
     * @param data - Event data
     *
     * @example
     * ```typescript
     * bridge.emit('userClick', { buttonId: 'submit' });
     * ```
     */
    emit(event, data) {
        if (this.disposed) {
            this.log('warn', 'Cannot emit event on disposed bridge');
            return;
        }
        this.sendMessage({
            id: this.generateId(),
            type: 'event',
            method: event,
            params: data,
        });
    }
    /**
     * Register a handler for Kotlin method calls.
     * Allows Kotlin to call JS functions.
     *
     * @param method - Method name
     * @param handler - Handler function
     * @returns Unregister function
     */
    registerHandler(method, handler) {
        return this.on(`__call__${method}`, handler);
    }
    /**
     * Wait for a specific event. Returns a Promise that resolves when the event fires.
     *
     * @param event - Event name
     * @param timeout - Optional timeout
     * @returns Promise resolving to event data
     */
    waitFor(event, timeout) {
        const { promise, resolve, reject } = Promise.withResolvers();
        let timeoutId;
        const cleanup = this.once(event, (data) => {
            if (timeoutId)
                clearTimeout(timeoutId);
            resolve(data);
        });
        if (timeout) {
            timeoutId = setTimeout(() => {
                cleanup();
                reject(new Error(`Timeout waiting for event '${event}'`));
            }, timeout);
        }
        return promise;
    }
    /**
     * Cleanup resources. Implements Disposable interface.
     */
    [Symbol.dispose]() {
        this.dispose();
    }
    /**
     * Cleanup resources manually.
     */
    dispose() {
        if (this.disposed)
            return;
        this.disposed = true;
        // Clear all pending calls with rejection
        for (const [id, pending] of this.pendingCalls) {
            clearTimeout(pending.timeoutId);
            pending.reject(new Error('Bridge disposed'));
        }
        this.pendingCalls.clear();
        // Clear event handlers
        this.eventHandlers.clear();
        this.onceHandlers.clear();
        // Remove global handler
        if (typeof window !== 'undefined') {
            delete window.__philjs_bridge_receive__;
        }
        this.log('info', 'Bridge disposed');
    }
    /**
     * Check if the bridge is disposed
     */
    get isDisposed() {
        return this.disposed;
    }
}
// ============================================================================
// Kotlin Code Generators
// ============================================================================
/**
 * Generate Kotlin WebView bridge code with full JSON-RPC support
 */
export function generateWebViewBridge(config) {
    const handlers = config.handlers
        .map(h => `
        @JavascriptInterface
        fun ${h}(data: String) {
            scope.launch {
                _events.emit("${h}" to data)
            }
        }`)
        .join('\n');
    return `package com.example.philjs

import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import java.util.concurrent.ConcurrentHashMap
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

/**
 * PhilJS Bridge Message Types
 */
@Serializable
data class BridgeMessage(
    val id: String,
    val type: String, // "call" | "event" | "response" | "error"
    val method: String? = null,
    val params: JsonElement? = null,
    val result: JsonElement? = null,
    val error: BridgeError? = null
)

@Serializable
data class BridgeError(
    val code: Int,
    val message: String,
    val data: JsonElement? = null
)

/**
 * Pending call wrapper for coroutine-based async handling
 */
private data class PendingCall(
    val continuation: kotlin.coroutines.Continuation<JsonElement?>
)

/**
 * PhilJSBridge - Bidirectional WebView bridge for PhilJS applications
 *
 * Provides:
 * - JSON-RPC protocol implementation
 * - Coroutine-based async method calls
 * - Event emission and subscription system
 * - Automatic cleanup on destroy
 */
object PhilJSBridge {
    private var webView: WebView? = null
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }

    private var messageId = 0L
    private val pendingCalls = ConcurrentHashMap<String, PendingCall>()

    private val _events = MutableSharedFlow<Pair<String, JsonElement?>>(replay = 0, extraBufferCapacity = 64)
    val events: SharedFlow<Pair<String, JsonElement?>> = _events.asSharedFlow()

    private val methodHandlers = ConcurrentHashMap<String, suspend (JsonElement?) -> JsonElement?>()

    /**
     * Initialize the bridge with a WebView
     */
    fun initialize(webView: WebView, allowedOrigins: List<String> = listOf(${config.allowedOrigins.map(o => `"${o}"`).join(', ')})) {
        this.webView = webView

        webView.settings.javaScriptEnabled = ${config.javascriptEnabled}
        webView.settings.domStorageEnabled = true

        webView.addJavascriptInterface(JsBridge(), "PhilJSNative")

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Inject bridge initialization script
                injectBridgeScript()
            }
        }
    }

    /**
     * Inject the bridge initialization script into the WebView
     */
    private fun injectBridgeScript() {
        val script = """
            (function() {
                if (window.__philjs_bridge_initialized__) return;
                window.__philjs_bridge_initialized__ = true;

                window.PhilJSNative = {
                    postMessage: function(msg) {
                        PhilJSNative.receiveMessage(msg);
                    }
                };
            })();
        """.trimIndent()

        webView?.evaluateJavascript(script, null)
    }

    /**
     * JavaScript interface for receiving messages from JS
     */
    inner class JsBridge {
        @JavascriptInterface
        fun receiveMessage(messageJson: String) {
            scope.launch {
                handleMessage(messageJson)
            }
        }
        ${handlers}
    }

    /**
     * Handle incoming message from JavaScript
     */
    private suspend fun handleMessage(messageJson: String) {
        try {
            val message = json.decodeFromString<BridgeMessage>(messageJson)

            when (message.type) {
                "response" -> handleResponse(message)
                "error" -> handleError(message)
                "event" -> handleEvent(message)
                "call" -> handleCall(message)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Handle response from JavaScript
     */
    private fun handleResponse(message: BridgeMessage) {
        val pending = pendingCalls.remove(message.id)
        pending?.continuation?.resume(message.result)
    }

    /**
     * Handle error from JavaScript
     */
    private fun handleError(message: BridgeMessage) {
        val pending = pendingCalls.remove(message.id)
        val error = message.error
        pending?.continuation?.resumeWithException(
            BridgeException(error?.code ?: -1, error?.message ?: "Unknown error")
        )
    }

    /**
     * Handle event from JavaScript
     */
    private suspend fun handleEvent(message: BridgeMessage) {
        val eventName = message.method ?: return
        _events.emit(eventName to message.params)
    }

    /**
     * Handle call from JavaScript (JS calling Kotlin)
     */
    private suspend fun handleCall(message: BridgeMessage) {
        val methodName = message.method ?: return
        val handler = methodHandlers[methodName]

        if (handler != null) {
            try {
                val result = handler(message.params)
                sendResponse(message.id, result)
            } catch (e: Exception) {
                sendError(message.id, -1, e.message ?: "Handler error")
            }
        } else {
            sendError(message.id, -32601, "Method not found: $methodName")
        }
    }

    /**
     * Generate unique message ID
     */
    private fun generateId(): String = "kt_${'$'}{++messageId}_${'$'}{System.currentTimeMillis()}"

    /**
     * Send message to JavaScript
     */
    private fun sendToJs(message: BridgeMessage) {
        val messageJson = json.encodeToString(message).replace("\\\\", "\\\\\\\\").replace("'", "\\\\'")
        val script = "window.__philjs_bridge_receive__ && window.__philjs_bridge_receive__('$messageJson');"

        scope.launch(Dispatchers.Main) {
            webView?.evaluateJavascript(script, null)
        }
    }

    /**
     * Send response to JavaScript
     */
    private fun sendResponse(id: String, result: JsonElement?) {
        sendToJs(BridgeMessage(
            id = id,
            type = "response",
            result = result
        ))
    }

    /**
     * Send error to JavaScript
     */
    private fun sendError(id: String, code: Int, message: String) {
        sendToJs(BridgeMessage(
            id = id,
            type = "error",
            error = BridgeError(code, message)
        ))
    }

    /**
     * Call a JavaScript method and await the result
     *
     * @param method Method name to call
     * @param params Parameters to pass
     * @return Result from JavaScript
     */
    suspend fun <T> call(method: String, params: JsonElement? = null): JsonElement? {
        val id = generateId()

        return suspendCoroutine { continuation ->
            pendingCalls[id] = PendingCall(continuation)

            sendToJs(BridgeMessage(
                id = id,
                type = "call",
                method = method,
                params = params
            ))
        }
    }

    /**
     * Emit an event to JavaScript
     *
     * @param event Event name
     * @param data Event data
     */
    fun emit(event: String, data: JsonElement? = null) {
        sendToJs(BridgeMessage(
            id = generateId(),
            type = "event",
            method = event,
            params = data
        ))
    }

    /**
     * Register a handler for JavaScript method calls
     *
     * @param method Method name
     * @param handler Suspend handler function
     */
    fun registerHandler(method: String, handler: suspend (JsonElement?) -> JsonElement?) {
        methodHandlers[method] = handler
    }

    /**
     * Unregister a handler
     */
    fun unregisterHandler(method: String) {
        methodHandlers.remove(method)
    }

    /**
     * Cleanup resources
     */
    fun destroy() {
        pendingCalls.values.forEach { pending ->
            pending.continuation.resumeWithException(BridgeException(-1, "Bridge destroyed"))
        }
        pendingCalls.clear()
        methodHandlers.clear()
        scope.cancel()
        webView = null
    }
}

/**
 * Bridge exception for error handling
 */
class BridgeException(val code: Int, message: String) : Exception(message)
`;
}
/**
 * Generate native module Kotlin code with full async support
 */
export function generateNativeModule(config) {
    const methods = config.methods.map(m => {
        const params = m.params.map(p => `${p.name}: ${mapTypeToKotlin(p.type)}`).join(', ');
        const suspendKeyword = m.suspend ? 'suspend ' : '';
        const returnType = m.returnType === 'void' ? '' : `: ${mapTypeToKotlin(m.returnType)}`;
        return `    ${suspendKeyword}fun ${m.name}(${params})${returnType} {
        // Implement your native functionality here
    }`;
    }).join('\n\n');
    return `package com.example.philjs

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.serialization.json.JsonElement

/**
 * ${config.name} - Native module for PhilJS bridge
 */
object ${config.name} {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

${methods}
}
`;
}
/**
 * Generate complete Kotlin bridge package with all necessary files
 */
export function generateKotlinBridgePackage(config) {
    const files = new Map();
    // Main bridge file
    files.set('PhilJSBridge.kt', generateWebViewBridge(config.webViewConfig));
    // Generate native modules
    for (const module of config.modules ?? []) {
        files.set(`${module.name}.kt`, generateNativeModule(module));
    }
    // Generate build.gradle.kts dependencies
    files.set('build.gradle.kts.snippet', `
// Add these dependencies for PhilJS Bridge
dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
}

// Enable serialization plugin
plugins {
    kotlin("plugin.serialization") version "1.9.0"
}
`);
    return files;
}
/**
 * Map TypeScript types to Kotlin types
 */
function mapTypeToKotlin(tsType) {
    const typeMap = {
        'string': 'String',
        'number': 'Double',
        'int': 'Int',
        'boolean': 'Boolean',
        'void': 'Unit',
        'any': 'Any',
        'object': 'JsonElement',
        'unknown': 'JsonElement?',
    };
    // Handle array types
    if (tsType.endsWith('[]')) {
        const elementType = tsType.slice(0, -2);
        return `List<${mapTypeToKotlin(elementType)}>`;
    }
    // Handle nullable types
    if (tsType.endsWith('?') || tsType.endsWith(' | null') || tsType.endsWith(' | undefined')) {
        const baseType = tsType.replace(/\?$/, '').replace(/ \| null$/, '').replace(/ \| undefined$/, '');
        return `${mapTypeToKotlin(baseType)}?`;
    }
    return typeMap[tsType] || tsType;
}
// ============================================================================
// Factory Functions
// ============================================================================
/**
 * Create a new BridgeRuntime instance
 */
export function createBridge(config) {
    return new BridgeRuntime(config);
}
/**
 * Create a bridge and return it with using() support for automatic cleanup
 */
export function useBridge(config) {
    return new BridgeRuntime(config);
}
//# sourceMappingURL=bridge.js.map