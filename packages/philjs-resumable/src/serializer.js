/**
 * State Serialization for Resumability
 *
 * This module handles serializing component state, signals, and QRLs
 * into HTML that can be resumed on the client without JavaScript execution.
 *
 * @example
 * ```typescript
 * // Server-side
 * const state = createSerializationContext();
 * const html = serializeToHTML(vnode, state);
 * const script = generateResumableScript(state);
 *
 * // Renders:
 * // <div data-qid="q0" data-qstate="...">Content</div>
 * // <script id="__PHIL_STATE__">...</script>
 * ```
 */
import { isQRL } from './qrl.js';
// ============================================================================
// Serialization Context Management
// ============================================================================
let currentContext = null;
/**
 * Create a new serialization context
 */
export function createSerializationContext(options) {
    const ctx = {
        nextId: 0,
        signals: new Map(),
        elements: new Map(),
        qrls: new Map(),
        closures: new Map(),
        components: new Map(),
        chunks: [],
        isDev: options?.isDev ?? false,
    };
    return ctx;
}
/**
 * Get the current serialization context
 */
export function getSerializationContext() {
    return currentContext;
}
/**
 * Run a function with a serialization context
 */
export function withSerializationContext(ctx, fn) {
    const prev = currentContext;
    currentContext = ctx;
    try {
        return fn();
    }
    finally {
        currentContext = prev;
    }
}
/**
 * Generate a unique element ID
 */
export function generateId(ctx) {
    const context = ctx || currentContext;
    if (!context) {
        throw new Error('No serialization context available');
    }
    return `q${context.nextId++}`;
}
// ============================================================================
// Value Serialization
// ============================================================================
/**
 * Serialize any JavaScript value to a portable format
 */
export function serializeValue(value) {
    // Handle null/undefined
    if (value === null) {
        return { type: 'primitive', data: null };
    }
    if (value === undefined) {
        return { type: 'undefined', data: null };
    }
    // Handle primitives
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return { type: 'primitive', data: value };
    }
    // Handle bigint
    if (typeof value === 'bigint') {
        return { type: 'bigint', data: value.toString() };
    }
    // Handle Date
    if (value instanceof Date) {
        return { type: 'date', data: value.toISOString() };
    }
    // Handle RegExp
    if (value instanceof RegExp) {
        return { type: 'regexp', data: { source: value.source, flags: value.flags } };
    }
    // Handle Error
    if (value instanceof Error) {
        return {
            type: 'error',
            data: {
                name: value.name,
                message: value.message,
                stack: value.stack,
            },
        };
    }
    // Handle Map
    if (value instanceof Map) {
        const entries = [];
        for (const [k, v] of value) {
            entries.push([serializeValue(k), serializeValue(v)]);
        }
        return { type: 'map', data: entries };
    }
    // Handle Set
    if (value instanceof Set) {
        const values = [];
        for (const v of value) {
            values.push(serializeValue(v));
        }
        return { type: 'set', data: values };
    }
    // Handle Array
    if (Array.isArray(value)) {
        return { type: 'array', data: value.map(serializeValue) };
    }
    // Handle QRL
    if (isQRL(value)) {
        return { type: 'qrl', data: value.serialize() };
    }
    // Handle Signal-like objects
    if (typeof value === 'object' && 'peek' in value && typeof value.peek === 'function') {
        const signalValue = value.peek();
        const signalId = '$id$' in value ? String(value.$id$) : generateId();
        return {
            type: 'signal',
            data: {
                id: signalId,
                value: serializeValue(signalValue),
            },
        };
    }
    // Handle plain objects
    if (typeof value === 'object') {
        const serialized = {};
        for (const [k, v] of Object.entries(value)) {
            // Skip functions and symbols
            if (typeof v !== 'function' && typeof v !== 'symbol') {
                serialized[k] = serializeValue(v);
            }
        }
        return { type: 'object', data: serialized };
    }
    // Fallback: stringify
    return { type: 'primitive', data: String(value) };
}
/**
 * Deserialize a value back to JavaScript
 */
export function deserializeValue(serialized) {
    switch (serialized.type) {
        case 'primitive':
            return serialized.data;
        case 'undefined':
            return undefined;
        case 'bigint':
            return BigInt(serialized.data);
        case 'date':
            return new Date(serialized.data);
        case 'regexp': {
            const { source, flags } = serialized.data;
            return new RegExp(source, flags);
        }
        case 'error': {
            const { name, message, stack } = serialized.data;
            const error = new Error(message);
            error.name = name;
            if (stack)
                error.stack = stack;
            return error;
        }
        case 'map': {
            const entries = serialized.data;
            return new Map(entries.map(([k, v]) => [deserializeValue(k), deserializeValue(v)]));
        }
        case 'set': {
            const values = serialized.data;
            return new Set(values.map(deserializeValue));
        }
        case 'array': {
            const values = serialized.data;
            return values.map(deserializeValue);
        }
        case 'object': {
            const entries = serialized.data;
            const result = {};
            for (const [k, v] of Object.entries(entries)) {
                result[k] = deserializeValue(v);
            }
            return result;
        }
        case 'qrl':
            // Return the QRL string for later resolution
            return { $qrlRef$: serialized.data };
        case 'signal':
            // Return signal reference for later resolution
            return { $signalRef$: serialized.data };
        default:
            return serialized.data;
    }
}
// ============================================================================
// Element Serialization
// ============================================================================
/**
 * Register an element with handlers and bindings
 */
export function registerElement(id, options, ctx) {
    const context = ctx || currentContext;
    if (!context)
        return;
    const element = {
        id,
        handlers: options.handlers || [],
        bindings: options.bindings || {},
    };
    if (options.state) {
        element.state = Object.fromEntries(Object.entries(options.state).map(([k, v]) => [k, serializeValue(v)]));
    }
    context.elements.set(id, element);
}
/**
 * Register a signal for serialization
 */
export function registerSignal(id, value, ctx) {
    const context = ctx || currentContext;
    if (!context)
        return;
    context.signals.set(id, {
        id,
        value: serializeValue(value),
        subscribers: [],
    });
}
/**
 * Add a subscriber to a signal
 */
export function addSignalSubscriber(signalId, elementId, ctx) {
    const context = ctx || currentContext;
    if (!context)
        return;
    const signal = context.signals.get(signalId);
    if (signal) {
        signal.subscribers.push(elementId);
    }
}
/**
 * Register a component boundary
 */
export function registerComponent(id, qrl, props, ctx) {
    const context = ctx || currentContext;
    if (!context)
        return;
    const qrlStr = typeof qrl === 'string' ? qrl : qrl.serialize();
    context.components.set(id, {
        qrl: qrlStr,
        props: Object.fromEntries(Object.entries(props).map(([k, v]) => [k, serializeValue(v)])),
    });
}
// ============================================================================
// HTML Generation
// ============================================================================
/**
 * Generate the resumable state script tag
 */
export function generateStateScript(ctx) {
    const state = {
        signals: Object.fromEntries(ctx.signals),
        elements: Object.fromEntries(ctx.elements),
        qrls: Object.fromEntries(ctx.qrls),
        closures: Object.fromEntries(Array.from(ctx.closures.entries()).map(([k, v]) => [k, v])),
        components: Object.fromEntries(ctx.components),
    };
    // Use safe JSON encoding to prevent XSS
    const json = JSON.stringify(state)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026')
        .replace(/'/g, '\\u0027');
    return `<script id="__PHIL_STATE__" type="application/json">${json}</script>`;
}
/**
 * Generate inline script for immediate handler attachment
 */
export function generateBootstrapScript(options) {
    const basePath = options?.basePath || '';
    const script = `
(function() {
  'use strict';
  var Q = window.__PHIL_Q__ = window.__PHIL_Q__ || {};
  Q.basePath = ${JSON.stringify(basePath)};
  Q.resolved = Q.resolved || {};
  Q.pending = Q.pending || [];

  // Parse state
  var stateEl = document.getElementById('__PHIL_STATE__');
  if (stateEl) {
    try {
      Q.state = JSON.parse(stateEl.textContent);
    } catch (e) {
      console.error('[PhilJS] Failed to parse state:', e);
    }
  }

  // Event delegation setup
  var events = ['click', 'input', 'change', 'submit', 'focus', 'blur', 'keydown', 'keyup'];
  events.forEach(function(eventType) {
    document.addEventListener(eventType, function(e) {
      var el = e.target;
      while (el && el !== document.body) {
        var qid = el.getAttribute('data-qid');
        if (qid && Q.state && Q.state.elements[qid]) {
          var elState = Q.state.elements[qid];
          var handler = elState.handlers.find(function(h) { return h.event === eventType; });
          if (handler) {
            if (handler.preventDefault) e.preventDefault();
            if (handler.stopPropagation) e.stopPropagation();
            Q.invoke(handler.qrl, e, el, qid);
            return;
          }
        }
        el = el.parentElement;
      }
    }, true);
  });

  // QRL invocation
  Q.invoke = function(qrl, event, element, qid) {
    if (Q.resolved[qrl]) {
      Q.resolved[qrl](event, element, Q.state.elements[qid]);
      return;
    }

    Q.pending.push({ qrl: qrl, event: event, element: element, qid: qid });
    Q.load(qrl);
  };

  // Lazy loader
  Q.load = function(qrl) {
    if (Q.loading && Q.loading[qrl]) return Q.loading[qrl];
    Q.loading = Q.loading || {};

    var parts = qrl.split('#');
    var chunk = parts[0];
    var symbol = parts[1].split('[')[0];

    var url = Q.basePath + '/' + chunk + '.js';
    Q.loading[qrl] = import(url).then(function(mod) {
      var fn = mod[symbol];
      Q.resolved[qrl] = fn;

      // Process pending invocations
      var pending = Q.pending.filter(function(p) { return p.qrl === qrl; });
      Q.pending = Q.pending.filter(function(p) { return p.qrl !== qrl; });
      pending.forEach(function(p) {
        fn(p.event, p.element, Q.state.elements[p.qid]);
      });

      return fn;
    });

    return Q.loading[qrl];
  };
})();
`.trim();
    return `<script>${script}</script>`;
}
/**
 * Generate HTML attributes for a resumable element
 */
export function generateElementAttributes(id, ctx) {
    const element = ctx.elements.get(id);
    if (!element)
        return { 'data-qid': id };
    const attrs = {
        'data-qid': id,
    };
    // Add handler attributes for quick lookup
    if (element.handlers.length > 0) {
        const handlerTypes = element.handlers.map(h => h.event).join(' ');
        attrs['data-qevents'] = handlerTypes;
    }
    // Add binding info
    if (Object.keys(element.bindings).length > 0) {
        attrs['data-qbind'] = Object.entries(element.bindings)
            .map(([signal, prop]) => `${signal}:${prop}`)
            .join(' ');
    }
    return attrs;
}
// ============================================================================
// Streaming Support
// ============================================================================
/**
 * Create a streaming serialization context
 */
export function createStreamingContext() {
    const ctx = createSerializationContext();
    return {
        ...ctx,
        /**
         * Flush pending chunks
         */
        flush() {
            const chunks = ctx.chunks.splice(0);
            return chunks.join('');
        },
        /**
         * Finalize and generate the complete state script
         */
        finalize() {
            const remaining = this.flush();
            return remaining + generateStateScript(ctx);
        },
    };
}
/**
 * Add a streaming chunk
 */
export function addStreamingChunk(html, ctx) {
    const context = ctx || currentContext;
    if (!context)
        return;
    context.chunks.push(html);
}
// ============================================================================
// Compact Serialization (for HTML attributes)
// ============================================================================
/**
 * Serialize state to a compact string for HTML attributes
 */
export function serializeToAttribute(value) {
    const serialized = serializeValue(value);
    // Use a compact encoding for attributes
    return btoa(JSON.stringify(serialized));
}
/**
 * Deserialize from a compact attribute string
 */
export function deserializeFromAttribute(attr) {
    try {
        const serialized = JSON.parse(atob(attr));
        return deserializeValue(serialized);
    }
    catch {
        return undefined;
    }
}
/**
 * Serialize state inline in the element (for small state)
 */
export function generateInlineState(state) {
    const serialized = Object.fromEntries(Object.entries(state).map(([k, v]) => [k, serializeValue(v)]));
    return `data-qstate="${serializeToAttribute(serialized)}"`;
}
//# sourceMappingURL=serializer.js.map