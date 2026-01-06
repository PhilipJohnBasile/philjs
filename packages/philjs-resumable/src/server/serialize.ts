/**
 * State Serialization for Resumability
 *
 * This module handles serializing component state, signals, and QRLs
 * into HTML that can be resumed on the client without JavaScript execution.
 *
 * @example
 * ```typescript
 * import { createSerializationContext, serializeValue, serializeState } from '@philjs/resumable/server';
 *
 * const ctx = createSerializationContext();
 * const serialized = serializeValue(myComplexValue);
 * const state = serializeState(ctx);
 * ```
 */

import type {
  SerializationContext,
  SerializedValue,
  SerializedSignal,
  SerializedElement,
  SerializedHandler,
  SerializedComponent,
  SerializedState,
  QRL,
  ResumableSignal,
} from '../types.js';

// ============================================================================
// Context Management
// ============================================================================

let currentContext: SerializationContext | null = null;

/**
 * Create a new serialization context
 */
export function createSerializationContext(options?: {
  isDev?: boolean;
}): SerializationContext {
  return {
    nextId: 0,
    signals: new Map(),
    elements: new Map(),
    qrls: new Map(),
    closures: new Map(),
    components: new Map(),
    chunks: [],
    isDev: options?.isDev ?? false,
  };
}

/**
 * Get the current serialization context
 */
export function getSerializationContext(): SerializationContext | null {
  return currentContext;
}

/**
 * Run a function with a serialization context
 */
export function withSerializationContext<T>(
  ctx: SerializationContext,
  fn: () => T
): T {
  const prev = currentContext;
  currentContext = ctx;
  try {
    return fn();
  } finally {
    currentContext = prev;
  }
}

/**
 * Generate a unique ID
 */
export function generateId(ctx?: SerializationContext): string {
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
 * Serialize any JavaScript value to a portable format.
 *
 * Handles:
 * - Primitives (string, number, boolean, null)
 * - undefined
 * - BigInt
 * - Date
 * - RegExp
 * - Error
 * - Map
 * - Set
 * - Array
 * - Plain objects
 * - Signals
 * - QRLs
 * - URL
 */
export function serializeValue(value: unknown): SerializedValue {
  // Handle null
  if (value === null) {
    return { type: 'primitive', data: null };
  }

  // Handle undefined
  if (value === undefined) {
    return { type: 'undefined', data: null };
  }

  // Handle primitives
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return { type: 'primitive', data: value };
  }

  // Handle BigInt
  if (typeof value === 'bigint') {
    return { type: 'bigint', data: value.toString() };
  }

  // Handle Date
  if (value instanceof Date) {
    return { type: 'date', data: value.toISOString() };
  }

  // Handle RegExp
  if (value instanceof RegExp) {
    return {
      type: 'regexp',
      data: { source: value.source, flags: value.flags },
    };
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

  // Handle URL
  if (value instanceof URL) {
    return { type: 'url', data: value.toString() };
  }

  // Handle Map
  if (value instanceof Map) {
    const entries: [SerializedValue, SerializedValue][] = [];
    for (const [k, v] of value) {
      entries.push([serializeValue(k), serializeValue(v)]);
    }
    return { type: 'map', data: entries };
  }

  // Handle Set
  if (value instanceof Set) {
    const values: SerializedValue[] = [];
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
    return { type: 'qrl', data: (value as QRL).serialize() };
  }

  // Handle Signal-like objects
  if (isSignalLike(value)) {
    const signal = value as ResumableSignal<unknown>;
    const signalValue = signal.peek();
    return {
      type: 'signal',
      data: {
        id: signal.$id$,
        value: serializeValue(signalValue),
      },
    };
  }

  // Handle plain objects
  if (typeof value === 'object') {
    const serialized: Record<string, SerializedValue> = {};
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
 * Serialize a closure's captured variables
 */
export function serializeCaptures(
  captures: unknown[],
  captureNames?: string[]
): SerializedValue[] {
  return captures.map((value, index) => {
    const serialized = serializeValue(value);
    // Optionally include capture name as metadata
    if (captureNames && captureNames[index]) {
      return {
        ...serialized,
        data: { ...serialized, _name: captureNames[index] },
      } as SerializedValue;
    }
    return serialized;
  });
}

// ============================================================================
// Element Serialization
// ============================================================================

/**
 * Register an element with handlers and bindings
 */
export function registerElement(
  id: string,
  options: {
    handlers?: SerializedHandler[];
    bindings?: Record<string, string>;
    state?: Record<string, unknown>;
  },
  ctx?: SerializationContext
): void {
  const context = ctx || currentContext;
  if (!context) return;

  const element: SerializedElement = {
    id,
    handlers: options.handlers || [],
    bindings: options.bindings || {},
  };

  if (options.state) {
    element.state = Object.fromEntries(
      Object.entries(options.state).map(([k, v]) => [k, serializeValue(v)])
    );
  }

  context.elements.set(id, element);
}

/**
 * Register a signal for serialization
 */
export function registerSignal(
  id: string,
  value: unknown,
  ctx?: SerializationContext
): void {
  const context = ctx || currentContext;
  if (!context) return;

  context.signals.set(id, {
    id,
    value: serializeValue(value),
    subscribers: [],
  });
}

/**
 * Add a subscriber to a signal
 */
export function addSignalSubscriber(
  signalId: string,
  elementId: string,
  ctx?: SerializationContext
): void {
  const context = ctx || currentContext;
  if (!context) return;

  const signal = context.signals.get(signalId);
  if (signal) {
    signal.subscribers.push(elementId);
  }
}

/**
 * Register a component boundary
 */
export function registerComponent(
  id: string,
  qrl: QRL | string,
  props: Record<string, unknown>,
  ctx?: SerializationContext
): void {
  const context = ctx || currentContext;
  if (!context) return;

  const qrlStr = typeof qrl === 'string' ? qrl : qrl.serialize();

  context.components.set(id, {
    id,
    qrl: qrlStr,
    props: Object.fromEntries(
      Object.entries(props).map(([k, v]) => [k, serializeValue(v)])
    ) as Record<string, SerializedValue>,
    children: [],
  });
}

// ============================================================================
// State Serialization
// ============================================================================

/**
 * Serialize the complete context to a state object
 */
export function serializeState(ctx: SerializationContext): SerializedState {
  return {
    version: 1,
    signals: Object.fromEntries(ctx.signals),
    elements: Object.fromEntries(ctx.elements),
    components: Object.fromEntries(ctx.components),
    qrls: Object.fromEntries(ctx.qrls),
    closures: Object.fromEntries(
      Array.from(ctx.closures.entries()).map(([k, v]) => [k, v])
    ),
    chunks: ctx.chunks,
  };
}

/**
 * Serialize state to JSON string
 */
export function serializeStateToJSON(ctx: SerializationContext): string {
  return JSON.stringify(serializeState(ctx));
}

// ============================================================================
// Compact Serialization (for attributes)
// ============================================================================

/**
 * Serialize state to a compact string for HTML attributes
 */
export function serializeToAttribute(value: unknown): string {
  const serialized = serializeValue(value);
  // Use base64 encoding for compact representation
  return btoa(JSON.stringify(serialized));
}

/**
 * Generate inline state attribute
 */
export function generateInlineState(state: Record<string, unknown>): string {
  const serialized = Object.fromEntries(
    Object.entries(state).map(([k, v]) => [k, serializeValue(v)])
  );
  return `data-qstate="${serializeToAttribute(serialized)}"`;
}

// ============================================================================
// Streaming Support
// ============================================================================

/**
 * Create a streaming serialization context
 */
export function createStreamingContext(): SerializationContext & {
  flush(): string;
  finalize(): string;
} {
  const ctx = createSerializationContext();

  return {
    ...ctx,

    /**
     * Flush pending chunks
     */
    flush(): string {
      const chunks = ctx.chunks.splice(0);
      return chunks.join('');
    },

    /**
     * Finalize and generate the complete state
     */
    finalize(): string {
      const remaining = this.flush();
      const stateJSON = serializeStateToJSON(ctx);
      return remaining + `<script id="__PHIL_STATE__" type="application/json">${stateJSON}</script>`;
    },
  };
}

/**
 * Add a streaming chunk
 */
export function addStreamingChunk(
  html: string,
  ctx?: SerializationContext
): void {
  const context = ctx || currentContext;
  if (!context) return;
  context.chunks.push(html);
}

// ============================================================================
// HTML Generation Helpers
// ============================================================================

/**
 * Generate HTML attributes for a resumable element
 */
export function generateElementAttributes(
  id: string,
  ctx: SerializationContext
): Record<string, string> {
  const element = ctx.elements.get(id);
  if (!element) return { 'data-qid': id };

  const attrs: Record<string, string> = {
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
// Utility Functions
// ============================================================================

function isQRL(value: unknown): value is QRL {
  return (
    value !== null &&
    typeof value === 'object' &&
    '$id$' in value &&
    '$chunk$' in value &&
    '$symbol$' in value &&
    typeof (value as QRL).serialize === 'function'
  );
}

function isSignalLike(value: unknown): boolean {
  return (
    typeof value === 'function' &&
    value !== null &&
    '$id$' in value &&
    'peek' in value &&
    typeof (value as ResumableSignal<unknown>).peek === 'function'
  );
}
