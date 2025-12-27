/**
 * Swift WebView Bridge for PhilJS
 *
 * Bidirectional JS <-> Swift communication bridge using JSON-RPC protocol
 */

import type { WebViewBridgeConfig, NativeModuleConfig } from './types.js';

// ============================================================================
// JSON-RPC Protocol Types
// ============================================================================

/**
 * Message types for the bridge protocol
 */
export type BridgeMessageType = 'call' | 'event' | 'response' | 'error';

/**
 * Bridge message interface for JSON-RPC communication
 */
export interface BridgeMessage<T = unknown> {
  /** Unique message ID for request/response correlation */
  id: string;
  /** Message type */
  type: BridgeMessageType;
  /** Method name (for 'call' and 'event' types) */
  method?: string | undefined;
  /** Parameters (for 'call' and 'event' types) */
  params?: T | undefined;
  /** Result data (for 'response' type) */
  result?: T | undefined;
  /** Error information (for 'error' type) */
  error?: BridgeError | undefined;
}

/**
 * Bridge error structure
 */
export interface BridgeError {
  code: number;
  message: string;
  data?: unknown | undefined;
}

/**
 * Event handler function type
 */
export type EventHandler<T = unknown> = (data: T) => void;

/**
 * Pending call structure for tracking in-flight requests
 */
interface PendingCall<T> {
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

// ============================================================================
// BridgeRuntime Class (TypeScript Side)
// ============================================================================

/**
 * Runtime bridge for JS <-> Swift communication
 * Implements Disposable for proper cleanup
 */
export class BridgeRuntime implements Disposable {
  private pendingCalls = new Map<string, PendingCall<unknown>>();
  private eventHandlers = new Map<string, Set<EventHandler>>();
  private messageIdCounter = 0;
  private disposed = false;
  private readonly defaultTimeout: number;

  /** Callback for sending messages to Swift (must be set by platform integration) */
  public onSendToNative?: ((message: string) => void) | undefined;

  constructor(options: { defaultTimeout?: number } = {}) {
    this.defaultTimeout = options.defaultTimeout ?? 30000;
  }

  /**
   * Generate unique message ID
   */
  private generateId(): string {
    return `js_${Date.now()}_${++this.messageIdCounter}`;
  }

  /**
   * Call a native Swift method and wait for response
   */
  async call<T = unknown, P = unknown>(
    method: string,
    params?: P,
    options: { timeout?: number } = {}
  ): Promise<T> {
    if (this.disposed) {
      throw new Error('BridgeRuntime has been disposed');
    }

    const id = this.generateId();
    const timeout = options.timeout ?? this.defaultTimeout;

    const message: BridgeMessage<P> = {
      id,
      type: 'call',
      method,
      params,
    };

    const { promise, resolve, reject } = Promise.withResolvers<T>();

    const timeoutId = setTimeout(() => {
      this.pendingCalls.delete(id);
      reject(new Error(`Call to '${method}' timed out after ${timeout}ms`));
    }, timeout);

    this.pendingCalls.set(id, {
      resolve: resolve as (value: unknown) => void,
      reject,
      timeoutId,
    });

    this.sendToNative(message);

    return promise;
  }

  /**
   * Subscribe to an event
   */
  on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler as EventHandler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  /**
   * Unsubscribe from an event
   */
  off<T = unknown>(event: string, handler: EventHandler<T>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  /**
   * Subscribe to an event once (auto-unsubscribes after first emission)
   */
  once<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    const wrappedHandler: EventHandler<T> = (data) => {
      this.off(event, wrappedHandler);
      handler(data);
    };
    return this.on(event, wrappedHandler);
  }

  /**
   * Emit an event to Swift
   */
  emit<T = unknown>(event: string, data?: T): void {
    if (this.disposed) return;

    const message: BridgeMessage<T> = {
      id: this.generateId(),
      type: 'event',
      method: event,
      params: data,
    };

    this.sendToNative(message);
  }

  /**
   * Handle incoming message from Swift
   */
  handleMessage(messageJson: string): void {
    if (this.disposed) return;

    try {
      const message: BridgeMessage = JSON.parse(messageJson);

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
          // Calls from Swift are handled via event system
          this.handleNativeCall(message);
          break;
      }
    } catch (error) {
      console.error('[BridgeRuntime] Failed to parse message:', error);
    }
  }

  /**
   * Handle response message
   */
  private handleResponse(message: BridgeMessage): void {
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
  private handleError(message: BridgeMessage): void {
    const pending = this.pendingCalls.get(message.id);
    if (pending) {
      clearTimeout(pending.timeoutId);
      this.pendingCalls.delete(message.id);
      const error = new Error(message.error?.message ?? 'Unknown error');
      (error as Error & { code?: number | undefined }).code = message.error?.code;
      pending.reject(error);
    }
  }

  /**
   * Handle event message from Swift
   */
  private handleEvent(message: BridgeMessage): void {
    const event = message.method;
    if (!event) return;

    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(message.params);
        } catch (error) {
          console.error(`[BridgeRuntime] Event handler error for '${event}':`, error);
        }
      }
    }
  }

  /**
   * Handle call from Swift (request-response pattern)
   */
  private handleNativeCall(message: BridgeMessage): void {
    // Emit as a special call event that can be handled
    const handlers = this.eventHandlers.get(`__call__${message.method}`);
    if (handlers) {
      for (const handler of handlers) {
        try {
          const result = handler(message.params) as unknown;
          // If handler returns a promise, wait for it
          if (result != null && typeof result === 'object' && result instanceof Promise) {
            result
              .then((res) => this.sendResponse(message.id, res))
              .catch((err: unknown) => this.sendError(message.id, err));
          } else {
            this.sendResponse(message.id, result);
          }
        } catch (error) {
          this.sendError(message.id, error);
        }
      }
    } else {
      this.sendError(message.id, new Error(`No handler for method: ${message.method}`));
    }
  }

  /**
   * Register a handler for native calls
   */
  registerHandler<T = unknown, R = unknown>(
    method: string,
    handler: (params: T) => R | Promise<R>
  ): () => void {
    return this.on(`__call__${method}`, handler as EventHandler);
  }

  /**
   * Send response back to Swift
   */
  private sendResponse(id: string, result: unknown): void {
    const message: BridgeMessage = {
      id,
      type: 'response',
      result,
    };
    this.sendToNative(message);
  }

  /**
   * Send error back to Swift
   */
  private sendError(id: string, error: unknown): void {
    const message: BridgeMessage = {
      id,
      type: 'error',
      error: {
        code: (error as Error & { code?: number })?.code ?? -1,
        message: error instanceof Error ? error.message : String(error),
        data: error,
      },
    };
    this.sendToNative(message);
  }

  /**
   * Send message to native Swift
   */
  private sendToNative(message: BridgeMessage): void {
    const json = JSON.stringify(message);
    if (this.onSendToNative) {
      this.onSendToNative(json);
    } else {
      // Default: use webkit message handler if available
      if (typeof window !== 'undefined') {
        const webkitWindow = window as WindowWithWebKit;
        const messageHandler = webkitWindow.webkit?.messageHandlers?.PhilJS;
        if (messageHandler) {
          messageHandler.postMessage(json);
        }
      }
    }
  }

  /**
   * Dispose the bridge runtime and clean up resources
   */
  [Symbol.dispose](): void {
    this.dispose();
  }

  /**
   * Dispose the bridge runtime and clean up resources
   */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    // Reject all pending calls
    for (const [, pending] of this.pendingCalls) {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error('BridgeRuntime disposed'));
    }
    this.pendingCalls.clear();
    this.eventHandlers.clear();
    delete this.onSendToNative;
  }
}

// Window type augmentation for webkit message handler
interface WindowWithWebKit extends Window {
  webkit?: {
    messageHandlers?: {
      PhilJS?: {
        postMessage: (message: string) => void;
      };
    };
  };
}

// ============================================================================
// Swift Code Generation
// ============================================================================

/**
 * Generate Swift WebView bridge code with full bidirectional communication
 */
export function generateWebViewBridge(config: WebViewBridgeConfig): string {
  const handlers = config.handlers;

  return `import WebKit
import Combine
import Foundation

// MARK: - Bridge Message Types

/// Message types for the bridge protocol
enum BridgeMessageType: String, Codable {
    case call
    case event
    case response
    case error
}

/// Bridge error structure
struct BridgeError: Codable {
    let code: Int
    let message: String
    let data: AnyCodable?
}

/// Bridge message for JSON-RPC communication
struct BridgeMessage<T: Codable>: Codable {
    let id: String
    let type: BridgeMessageType
    var method: String?
    var params: T?
    var result: T?
    var error: BridgeError?
}

/// Type-erased Codable wrapper for dynamic values
struct AnyCodable: Codable {
    let value: Any

    init(_ value: Any) {
        self.value = value
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()

        if container.decodeNil() {
            self.value = NSNull()
        } else if let bool = try? container.decode(Bool.self) {
            self.value = bool
        } else if let int = try? container.decode(Int.self) {
            self.value = int
        } else if let double = try? container.decode(Double.self) {
            self.value = double
        } else if let string = try? container.decode(String.self) {
            self.value = string
        } else if let array = try? container.decode([AnyCodable].self) {
            self.value = array.map { $0.value }
        } else if let dict = try? container.decode([String: AnyCodable].self) {
            self.value = dict.mapValues { $0.value }
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unable to decode value")
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()

        switch value {
        case is NSNull:
            try container.encodeNil()
        case let bool as Bool:
            try container.encode(bool)
        case let int as Int:
            try container.encode(int)
        case let double as Double:
            try container.encode(double)
        case let string as String:
            try container.encode(string)
        case let array as [Any]:
            try container.encode(array.map { AnyCodable($0) })
        case let dict as [String: Any]:
            try container.encode(dict.mapValues { AnyCodable($0) })
        default:
            let context = EncodingError.Context(codingPath: container.codingPath, debugDescription: "Unable to encode value")
            throw EncodingError.invalidValue(value, context)
        }
    }
}

// MARK: - PhilJS Bridge

/// Main bridge class for JS <-> Swift communication
@MainActor
public class PhilJSBridge: NSObject, ObservableObject {
    public static let shared = PhilJSBridge()

    /// Weak reference to the web view
    public weak var webView: WKWebView?

    /// Pending calls waiting for responses
    private var pendingCalls: [String: CheckedContinuation<Any?, Error>] = [:]

    /// Message ID counter
    private var messageIdCounter: Int = 0

    /// Default timeout for calls (in seconds)
    public var defaultTimeout: TimeInterval = 30.0

    /// Event publishers
    private var eventSubjects: [String: PassthroughSubject<Any?, Never>] = [:]

    /// Native method handlers
    private var methodHandlers: [String: (Any?) async throws -> Any?] = [:]

    /// All events publisher
    public let allEvents = PassthroughSubject<(String, Any?), Never>()

    /// Cancellables for subscriptions
    private var cancellables = Set<AnyCancellable>()

    private override init() {
        super.init()
    }

    // MARK: - Message ID Generation

    private func generateId() -> String {
        messageIdCounter += 1
        return "swift_\\(Date().timeIntervalSince1970)_\\(messageIdCounter)"
    }

    // MARK: - Call JS Methods

    /// Call a JavaScript method and wait for response
    public func call<T>(_ method: String, params: Any? = nil, timeout: TimeInterval? = nil) async throws -> T? {
        guard let webView = webView else {
            throw BridgeRuntimeError.webViewNotAttached
        }

        let id = generateId()
        let actualTimeout = timeout ?? defaultTimeout

        let message: [String: Any?] = [
            "id": id,
            "type": "call",
            "method": method,
            "params": params
        ]

        let result: Any? = try await withCheckedThrowingContinuation { continuation in
            pendingCalls[id] = continuation

            // Set timeout
            Task {
                try? await Task.sleep(nanoseconds: UInt64(actualTimeout * 1_000_000_000))
                if let cont = pendingCalls.removeValue(forKey: id) {
                    cont.resume(throwing: BridgeRuntimeError.timeout(method: method, timeout: actualTimeout))
                }
            }

            // Send message to JS
            sendToJS(message)
        }

        return result as? T
    }

    /// Call a JavaScript method (fire and forget)
    public func callAsync(_ method: String, params: Any? = nil) {
        let id = generateId()
        let message: [String: Any?] = [
            "id": id,
            "type": "call",
            "method": method,
            "params": params
        ]
        sendToJS(message)
    }

    // MARK: - Event System

    /// Emit an event to JavaScript
    public func emit(_ event: String, data: Any? = nil) {
        let id = generateId()
        let message: [String: Any?] = [
            "id": id,
            "type": "event",
            "method": event,
            "params": data
        ]
        sendToJS(message)
    }

    /// Subscribe to events from JavaScript
    public func on(_ event: String) -> AnyPublisher<Any?, Never> {
        if eventSubjects[event] == nil {
            eventSubjects[event] = PassthroughSubject<Any?, Never>()
        }
        return eventSubjects[event]!.eraseToAnyPublisher()
    }

    /// Subscribe to events with a handler
    public func on(_ event: String, handler: @escaping (Any?) -> Void) -> AnyCancellable {
        return on(event).sink { data in
            handler(data)
        }
    }

    /// Subscribe to an event once
    public func once(_ event: String) async -> Any? {
        return await withCheckedContinuation { continuation in
            var cancellable: AnyCancellable?
            cancellable = on(event).first().sink { data in
                continuation.resume(returning: data)
                cancellable?.cancel()
            }
        }
    }

    // MARK: - Native Method Registration

    /// Register a native method handler that JS can call
    public func registerHandler(_ method: String, handler: @escaping (Any?) async throws -> Any?) {
        methodHandlers[method] = handler
    }

    /// Register a synchronous native method handler
    public func registerHandler(_ method: String, handler: @escaping (Any?) -> Any?) {
        methodHandlers[method] = { params in
            handler(params)
        }
    }

    /// Unregister a native method handler
    public func unregisterHandler(_ method: String) {
        methodHandlers.removeValue(forKey: method)
    }

    // MARK: - Message Handling

    /// Handle incoming message from JavaScript
    public func handleMessage(_ messageJson: String) {
        guard let data = messageJson.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let id = json["id"] as? String,
              let typeString = json["type"] as? String else {
            print("[PhilJSBridge] Failed to parse message: \\(messageJson)")
            return
        }

        switch typeString {
        case "response":
            handleResponse(id: id, result: json["result"])
        case "error":
            handleError(id: id, error: json["error"] as? [String: Any])
        case "event":
            handleEvent(method: json["method"] as? String, params: json["params"])
        case "call":
            Task {
                await handleCall(id: id, method: json["method"] as? String, params: json["params"])
            }
        default:
            print("[PhilJSBridge] Unknown message type: \\(typeString)")
        }
    }

    private func handleResponse(id: String, result: Any?) {
        if let continuation = pendingCalls.removeValue(forKey: id) {
            continuation.resume(returning: result)
        }
    }

    private func handleError(id: String, error: [String: Any]?) {
        if let continuation = pendingCalls.removeValue(forKey: id) {
            let message = error?["message"] as? String ?? "Unknown error"
            let code = error?["code"] as? Int ?? -1
            continuation.resume(throwing: BridgeRuntimeError.jsError(code: code, message: message))
        }
    }

    private func handleEvent(method: String?, params: Any?) {
        guard let method = method else { return }

        // Emit to specific event subject
        eventSubjects[method]?.send(params)

        // Emit to all events publisher
        allEvents.send((method, params))
    }

    private func handleCall(id: String, method: String?, params: Any?) async {
        guard let method = method else {
            sendError(id: id, code: -32600, message: "Invalid request: missing method")
            return
        }

        guard let handler = methodHandlers[method] else {
            sendError(id: id, code: -32601, message: "Method not found: \\(method)")
            return
        }

        do {
            let result = try await handler(params)
            sendResponse(id: id, result: result)
        } catch {
            sendError(id: id, code: -32603, message: error.localizedDescription)
        }
    }

    // MARK: - Send Messages

    private func sendToJS(_ message: [String: Any?]) {
        guard let webView = webView else {
            print("[PhilJSBridge] WebView not attached")
            return
        }

        let filteredMessage = message.compactMapValues { $0 }

        guard let data = try? JSONSerialization.data(withJSONObject: filteredMessage),
              let jsonString = String(data: data, encoding: .utf8) else {
            print("[PhilJSBridge] Failed to serialize message")
            return
        }

        let escapedJson = jsonString.replacingOccurrences(of: "\\\\", with: "\\\\\\\\")
            .replacingOccurrences(of: "'", with: "\\\\'")

        let script = "window.PhilJS?.bridge?.handleMessage('\\(escapedJson)')"

        webView.evaluateJavaScript(script) { _, error in
            if let error = error {
                print("[PhilJSBridge] Failed to send message: \\(error)")
            }
        }
    }

    private func sendResponse(id: String, result: Any?) {
        let message: [String: Any?] = [
            "id": id,
            "type": "response",
            "result": result
        ]
        sendToJS(message)
    }

    private func sendError(id: String, code: Int, message: String) {
        let msg: [String: Any?] = [
            "id": id,
            "type": "error",
            "error": [
                "code": code,
                "message": message
            ]
        ]
        sendToJS(msg)
    }

    // MARK: - Cleanup

    public func dispose() {
        // Cancel all pending calls
        for (_, continuation) in pendingCalls {
            continuation.resume(throwing: BridgeRuntimeError.disposed)
        }
        pendingCalls.removeAll()

        // Complete all event subjects
        for (_, subject) in eventSubjects {
            subject.send(completion: .finished)
        }
        eventSubjects.removeAll()

        methodHandlers.removeAll()
        cancellables.removeAll()
        webView = nil
    }
}

// MARK: - Bridge Runtime Errors

public enum BridgeRuntimeError: LocalizedError {
    case webViewNotAttached
    case timeout(method: String, timeout: TimeInterval)
    case jsError(code: Int, message: String)
    case disposed
    case encodingError
    case decodingError

    public var errorDescription: String? {
        switch self {
        case .webViewNotAttached:
            return "WebView is not attached to the bridge"
        case .timeout(let method, let timeout):
            return "Call to '\\(method)' timed out after \\(timeout) seconds"
        case .jsError(let code, let message):
            return "JavaScript error (\\(code)): \\(message)"
        case .disposed:
            return "Bridge has been disposed"
        case .encodingError:
            return "Failed to encode message"
        case .decodingError:
            return "Failed to decode message"
        }
    }
}

// MARK: - PhilJS WebView

/// Custom WKWebView with PhilJS bridge integration
public class PhilJSWebView: WKWebView {
    public let bridge = PhilJSBridge.shared

    public init(frame: CGRect = .zero, allowedOrigins: [String] = ${JSON.stringify(config.allowedOrigins)}) {
        let config = WKWebViewConfiguration()
        let userContentController = WKUserContentController()

        // Register message handlers
        let handler = PhilJSScriptMessageHandler()
        ${handlers.map(h => `userContentController.add(handler, name: "${h}")`).join('\n        ')}
        userContentController.add(handler, name: "PhilJS")

        // Add user scripts
        let bridgeScript = """
        window.PhilJS = window.PhilJS || {};
        window.PhilJS.bridge = {
            handleMessage: function(json) {
                try {
                    const event = new CustomEvent('philjsMessage', { detail: json });
                    window.dispatchEvent(event);
                } catch (e) {
                    console.error('[PhilJS] Failed to dispatch message:', e);
                }
            }
        };
        """
        let script = WKUserScript(source: bridgeScript, injectionTime: .atDocumentStart, forMainFrameOnly: false)
        userContentController.addUserScript(script)

        ${config.userScripts?.map(script => `
        let customScript${config.userScripts!.indexOf(script)} = WKUserScript(source: """
        ${script}
        """, injectionTime: .atDocumentEnd, forMainFrameOnly: true)
        userContentController.addUserScript(customScript${config.userScripts!.indexOf(script)})`).join('\n        ') || ''}

        config.userContentController = userContentController

        super.init(frame: frame, configuration: config)
        bridge.webView = self
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    deinit {
        bridge.dispose()
    }
}

// MARK: - Script Message Handler

/// Handler for receiving messages from JavaScript
class PhilJSScriptMessageHandler: NSObject, WKScriptMessageHandler {
    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        if message.name == "PhilJS" {
            if let jsonString = message.body as? String {
                Task { @MainActor in
                    PhilJSBridge.shared.handleMessage(jsonString)
                }
            }
        } else {
            // Handle other registered handlers as events
            Task { @MainActor in
                PhilJSBridge.shared.emit(message.name, data: message.body)
            }
        }
    }
}

// MARK: - SwiftUI Integration

#if canImport(SwiftUI)
import SwiftUI

/// SwiftUI wrapper for PhilJSWebView
public struct PhilJSWebViewRepresentable: UIViewRepresentable {
    public typealias UIViewType = PhilJSWebView

    private let url: URL?
    private let html: String?

    public init(url: URL) {
        self.url = url
        self.html = nil
    }

    public init(html: String) {
        self.url = nil
        self.html = html
    }

    public func makeUIView(context: Context) -> PhilJSWebView {
        let webView = PhilJSWebView()
        if let url = url {
            webView.load(URLRequest(url: url))
        } else if let html = html {
            webView.loadHTMLString(html, baseURL: nil)
        }
        return webView
    }

    public func updateUIView(_ uiView: PhilJSWebView, context: Context) {
        // Handle updates if needed
    }
}

#if os(macOS)
/// macOS wrapper for PhilJSWebView
public struct PhilJSWebViewRepresentableMac: NSViewRepresentable {
    public typealias NSViewType = PhilJSWebView

    private let url: URL?
    private let html: String?

    public init(url: URL) {
        self.url = url
        self.html = nil
    }

    public init(html: String) {
        self.url = nil
        self.html = html
    }

    public func makeNSView(context: Context) -> PhilJSWebView {
        let webView = PhilJSWebView()
        if let url = url {
            webView.load(URLRequest(url: url))
        } else if let html = html {
            webView.loadHTMLString(html, baseURL: nil)
        }
        return webView
    }

    public func updateNSView(_ nsView: PhilJSWebView, context: Context) {
        // Handle updates if needed
    }
}
#endif
#endif
`;
}

/**
 * Generate native module Swift code with async/await handlers
 */
export function generateNativeModule(config: NativeModuleConfig): string {
  const methods = config.methods.map(m => {
    const params = m.params.map(p => `${p.name}: ${mapTypeToSwift(p.type)}`).join(', ');
    const asyncKeyword = m.async ? 'async ' : '';
    const throwsKeyword = m.async ? 'throws ' : '';
    const returnType = m.returnType === 'void' ? '' : ` -> ${mapTypeToSwift(m.returnType)}`;

    return `    /// ${m.name} method
    public ${asyncKeyword}func ${m.name}(${params}) ${throwsKeyword}${returnType} {
        // Implement your native functionality here
        ${m.returnType !== 'void' ? `return ${getDefaultValue(m.returnType)}` : ''}
    }`;
  }).join('\n\n');

  const registrations = config.methods.map(m => {
    const paramExtraction = m.params.length > 0
      ? `guard let params = params as? [String: Any],
              ${m.params.map(p => `let ${p.name} = params["${p.name}"] as? ${mapTypeToSwift(p.type)}`).join(',\n              ')} else {
            throw BridgeRuntimeError.decodingError
        }`
      : '';

    const callParams = m.params.map(p => `${p.name}: ${p.name}`).join(', ');
    const asyncAwait = m.async ? 'try await ' : '';

    return `        bridge.registerHandler("${config.name}.${m.name}") { params in
            ${paramExtraction}
            ${m.returnType !== 'void' ? 'return ' : ''}${asyncAwait}self.${m.name}(${callParams})
        }`;
  }).join('\n\n');

  return `import Foundation
import Combine

/// ${config.name} - Native module for PhilJS
@MainActor
public class ${config.name}: ObservableObject {
    public static let shared = ${config.name}()

    /// Event publishers for this module
    private var eventSubjects: [String: PassthroughSubject<Any?, Never>] = [:]
    private var cancellables = Set<AnyCancellable>()

    private init() {}

    // MARK: - Bridge Registration

    /// Register all methods with the bridge
    public func register(with bridge: PhilJSBridge) {
${registrations}
    }

    // MARK: - Event Emission

    /// Emit an event from this module
    public func emit(_ event: String, data: Any? = nil) {
        PhilJSBridge.shared.emit("${config.name}.\\(event)", data: data)
    }

    // MARK: - Methods

${methods}
}
`;
}

/**
 * Generate TypeScript bindings for a Swift module
 */
export function generateTypeScriptBindings(config: NativeModuleConfig): string {
  const methods = config.methods.map(m => {
    const params = m.params.map(p => `${p.name}: ${p.type}`).join(', ');
    const returnType = m.returnType === 'void' ? 'void' : m.returnType;

    return `  /**
   * Call native ${m.name} method
   */
  async ${m.name}(${params}): Promise<${returnType}> {
    return this.bridge.call<${returnType}>('${config.name}.${m.name}', { ${m.params.map(p => p.name).join(', ')} });
  }`;
  }).join('\n\n');

  return `/**
 * TypeScript bindings for ${config.name} Swift module
 * Auto-generated - do not edit manually
 */

import type { BridgeRuntime } from './bridge.js';

export class ${config.name}Client {
  constructor(private readonly bridge: BridgeRuntime) {}

${methods}

  /**
   * Subscribe to events from this module
   */
  on<T = unknown>(event: string, handler: (data: T) => void): () => void {
    return this.bridge.on(\`${config.name}.\${event}\`, handler);
  }

  /**
   * Emit an event to this module
   */
  emit<T = unknown>(event: string, data?: T): void {
    this.bridge.emit(\`${config.name}.\${event}\`, data);
  }
}
`;
}

/**
 * Generate complete bridge setup code for both platforms
 */
export function generateBridgeSetup(config: {
  modules: NativeModuleConfig[];
  webViewConfig: WebViewBridgeConfig;
}): { swift: string; typescript: string } {
  const swift = `import Foundation
import WebKit
import Combine

// MARK: - PhilJS Bridge Setup

/// Initialize all native modules with the bridge
@MainActor
func setupPhilJSBridge() {
    let bridge = PhilJSBridge.shared

    // Register all modules
    ${config.modules.map(m => `${m.name}.shared.register(with: bridge)`).join('\n    ')}

    // Log bridge ready
    print("[PhilJS] Bridge initialized with \\(${config.modules.length}) modules")
}

// MARK: - Generated Modules

${config.modules.map(m => generateNativeModule(m)).join('\n\n')}

// MARK: - WebView Bridge

${generateWebViewBridge(config.webViewConfig)}
`;

  const typescript = `/**
 * PhilJS Swift Bridge Setup
 * Auto-generated - do not edit manually
 */

import { BridgeRuntime } from './bridge.js';

${config.modules.map(m => generateTypeScriptBindings(m)).join('\n\n')}

/**
 * Initialize the PhilJS bridge with all module clients
 */
export function createPhilJSBridge(options: { timeout?: number } = {}) {
  const bridge = new BridgeRuntime(options);

  return {
    bridge,
    ${config.modules.map(m => `${m.name.charAt(0).toLowerCase() + m.name.slice(1)}: new ${m.name}Client(bridge)`).join(',\n    ')},

    dispose() {
      bridge.dispose();
    }
  };
}

export type PhilJSBridge = ReturnType<typeof createPhilJSBridge>;
`;

  return { swift, typescript };
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapTypeToSwift(tsType: string): string {
  const typeMap: Record<string, string> = {
    'string': 'String',
    'number': 'Double',
    'boolean': 'Bool',
    'void': 'Void',
    'any': 'Any',
    'object': '[String: Any]',
    'string[]': '[String]',
    'number[]': '[Double]',
    'boolean[]': '[Bool]',
  };
  return typeMap[tsType] || tsType;
}

function getDefaultValue(tsType: string): string {
  const defaults: Record<string, string> = {
    'string': '""',
    'String': '""',
    'number': '0.0',
    'Double': '0.0',
    'boolean': 'false',
    'Bool': 'false',
    'any': 'nil',
    'Any': 'nil',
  };
  return defaults[tsType] || 'nil';
}

// ============================================================================
// Export singleton instance for convenience
// ============================================================================

/**
 * Create a new BridgeRuntime instance
 */
export function createBridgeRuntime(options?: { defaultTimeout?: number }): BridgeRuntime {
  return new BridgeRuntime(options);
}
