/**
 * State Deserialization for Resumability
 *
 * This module handles deserializing component state, signals, and references
 * from HTML back into live JavaScript objects that can resume execution.
 *
 * @example
 * ```typescript
 * import { deserializeState, resumeFromDOM } from '@philjs/resumable/client';
 *
 * const state = deserializeState(document.getElementById('__PHIL_STATE__'));
 * await resumeFromDOM(document.body, state);
 * ```
 */

import type {
  SerializedValue,
  SerializedElement,
  SerializedSignal,
  SerializedState,
  QRL,
} from '../types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Deserialized application state
 */
export interface DeserializedState {
  /** Deserialized signals */
  signals: Map<string, DeserializedSignal>;
  /** Deserialized elements */
  elements: Map<string, DeserializedElement>;
  /** QRL references ready for resolution */
  qrls: Map<string, QRL>;
  /** Component definitions */
  components: Map<string, DeserializedComponent>;
  /** Raw parsed state for direct access */
  raw: Record<string, unknown>;
}

/**
 * Deserialized signal
 */
export interface DeserializedSignal {
  /** Signal ID */
  id: string;
  /** Current value */
  value: unknown;
  /** Elements subscribed to this signal */
  subscribers: string[];
  /** Notify subscribers of value change */
  notify: () => void;
  /** Update the signal value */
  set: (value: unknown | ((prev: unknown) => unknown)) => void;
}

/**
 * Deserialized element
 */
export interface DeserializedElement {
  /** Element ID */
  id: string;
  /** DOM element reference */
  element: Element | null;
  /** Event handlers */
  handlers: Map<string, string>;
  /** Signal bindings (signal ID -> attribute/property name) */
  bindings: Map<string, string>;
  /** Inline state */
  state: Record<string, unknown>;
  /** Whether the element has been hydrated */
  hydrated: boolean;
}

/**
 * Deserialized component
 */
export interface DeserializedComponent {
  /** Component ID */
  id: string;
  /** Component QRL string */
  qrl: string;
  /** Deserialized props */
  props: Record<string, unknown>;
  /** DOM element reference */
  element: Element | null;
  /** Whether the component has been hydrated */
  hydrated: boolean;
}

/**
 * Deserialization options
 */
export interface DeserializationOptions {
  /** Custom type handlers */
  typeHandlers?: Record<string, (data: unknown) => unknown>;
  /** Whether to create live signals */
  createSignals?: boolean;
  /** Signal factory function */
  signalFactory?: <T>(initialValue: T) => {
    value: T;
    set: (value: T | ((prev: T) => T)) => void;
    subscribe: (fn: (value: T) => void) => () => void;
  };
}

// ============================================================================
// Core Deserialization
// ============================================================================

/**
 * Deserialize a SerializedValue back to a JavaScript value.
 */
export function deserializeValue(
  serialized: SerializedValue,
  options?: DeserializationOptions
): unknown {
  if (!serialized || typeof serialized !== 'object') {
    return serialized;
  }

  const { type, data } = serialized;

  // Check for custom type handler
  if (options?.typeHandlers?.[type]) {
    return options.typeHandlers[type](data);
  }

  switch (type) {
    case 'primitive':
      return data;

    case 'undefined':
      return undefined;

    case 'bigint':
      return BigInt(data as string);

    case 'date':
      return new Date(data as string);

    case 'regexp': {
      const { source, flags } = data as { source: string; flags: string };
      return new RegExp(source, flags);
    }

    case 'error': {
      const { name, message, stack } = data as {
        name: string;
        message: string;
        stack?: string;
      };
      const error = new Error(message);
      error.name = name;
      if (stack) error.stack = stack;
      return error;
    }

    case 'url':
      return new URL(data as string);

    case 'map': {
      const entries = data as [SerializedValue, SerializedValue][];
      return new Map(
        entries.map(([k, v]) => [
          deserializeValue(k, options),
          deserializeValue(v, options),
        ])
      );
    }

    case 'set': {
      const values = data as SerializedValue[];
      return new Set(values.map((v) => deserializeValue(v, options)));
    }

    case 'array': {
      const values = data as SerializedValue[];
      return values.map((v) => deserializeValue(v, options));
    }

    case 'object': {
      const entries = data as Record<string, SerializedValue>;
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(entries)) {
        result[k] = deserializeValue(v, options);
      }
      return result;
    }

    case 'qrl': {
      // Return the QRL string for later resolution
      return { $qrlRef$: data };
    }

    case 'signal': {
      const { id, value } = data as { id: string; value: SerializedValue };
      const deserializedValue = deserializeValue(value, options);

      // If a signal factory is provided, create a live signal
      if (options?.createSignals && options.signalFactory) {
        return options.signalFactory(deserializedValue);
      }

      // Otherwise return a reference object
      return {
        $signalRef$: id,
        value: deserializedValue,
      };
    }

    default:
      // Unknown type, return data as-is
      console.warn(`[PhilJS Deserializer] Unknown type: ${type}`);
      return data;
  }
}

// ============================================================================
// State Deserialization
// ============================================================================

/**
 * Deserialize the complete application state from a script element.
 */
export function deserializeState(
  stateElement: Element | string | null,
  options?: DeserializationOptions
): DeserializedState | null {
  if (!stateElement) return null;

  let rawState: Record<string, unknown>;

  try {
    if (typeof stateElement === 'string') {
      rawState = JSON.parse(stateElement);
    } else {
      const content = stateElement.textContent;
      if (!content) return null;
      rawState = JSON.parse(content);
    }
  } catch (error) {
    console.error('[PhilJS Deserializer] Failed to parse state:', error);
    return null;
  }

  // Initialize deserialized state
  const state: DeserializedState = {
    signals: new Map(),
    elements: new Map(),
    qrls: new Map(),
    components: new Map(),
    raw: rawState,
  };

  // Deserialize signals
  if (rawState.signals) {
    const signals = rawState.signals as Record<string, SerializedSignal>;
    for (const [id, serializedSignal] of Object.entries(signals)) {
      state.signals.set(id, deserializeSignal(serializedSignal, options));
    }
  }

  // Deserialize elements
  if (rawState.elements) {
    const elements = rawState.elements as Record<string, SerializedElement>;
    for (const [id, serializedElement] of Object.entries(elements)) {
      state.elements.set(id, deserializeElement(id, serializedElement));
    }
  }

  // Deserialize components
  if (rawState.components) {
    const components = rawState.components as Record<
      string,
      { qrl: string; props: Record<string, SerializedValue> }
    >;
    for (const [id, componentData] of Object.entries(components)) {
      state.components.set(
        id,
        deserializeComponent(id, componentData, options)
      );
    }
  }

  return state;
}

/**
 * Deserialize a signal
 */
function deserializeSignal(
  serialized: SerializedSignal,
  options?: DeserializationOptions
): DeserializedSignal {
  let value = deserializeValue(serialized.value, options);
  const subscribers = new Set<(value: unknown) => void>();

  const signal: DeserializedSignal = {
    id: serialized.id,
    value,
    subscribers: serialized.subscribers,
    notify: () => {
      subscribers.forEach((fn) => fn(value));
    },
    set: (newValue: unknown | ((prev: unknown) => unknown)) => {
      const nextValue =
        typeof newValue === 'function'
          ? (newValue as (prev: unknown) => unknown)(value)
          : newValue;

      if (!Object.is(value, nextValue)) {
        value = nextValue;
        signal.value = value;
        signal.notify();
      }
    },
  };

  return signal;
}

/**
 * Deserialize an element
 */
function deserializeElement(
  id: string,
  serialized: SerializedElement
): DeserializedElement {
  const handlers = new Map<string, string>();

  // Store handler QRL strings
  for (const handler of serialized.handlers) {
    handlers.set(handler.event, handler.qrl);
  }

  // Parse bindings
  const bindings = new Map<string, string>();
  for (const [signalId, propName] of Object.entries(serialized.bindings)) {
    bindings.set(signalId, propName);
  }

  // Deserialize inline state
  const state: Record<string, unknown> = {};
  if (serialized.state) {
    for (const [key, value] of Object.entries(serialized.state)) {
      state[key] = deserializeValue(value as SerializedValue);
    }
  }

  return {
    id,
    element: null, // Will be resolved later
    handlers,
    bindings,
    state,
    hydrated: false,
  };
}

/**
 * Deserialize a component
 */
function deserializeComponent(
  id: string,
  data: { qrl: string; props: Record<string, SerializedValue> },
  options?: DeserializationOptions
): DeserializedComponent {
  const props: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data.props)) {
    props[key] = deserializeValue(value, options);
  }

  return {
    id,
    qrl: data.qrl,
    props,
    element: null,
    hydrated: false,
  };
}

// ============================================================================
// DOM Resolution
// ============================================================================

/**
 * Resolve DOM element references in the deserialized state.
 */
export function resolveElements(
  state: DeserializedState,
  root: Element = document.body
): void {
  // Resolve element references
  for (const [id, element] of state.elements) {
    const domElement = root.querySelector(`[data-qid="${id}"]`);
    if (domElement) {
      element.element = domElement;
    }
  }

  // Resolve component references
  for (const [id, component] of state.components) {
    const domElement = root.querySelector(`[data-qid="${id}"]`);
    if (domElement) {
      component.element = domElement;
    }
  }
}

/**
 * Set up signal bindings for reactive updates.
 */
export function setupSignalBindings(state: DeserializedState): void {
  for (const [signalId, signal] of state.signals) {
    // Find elements subscribed to this signal
    for (const elementId of signal.subscribers) {
      const element = state.elements.get(elementId);
      if (!element?.element) continue;

      const binding = element.bindings.get(signalId);
      if (!binding) continue;

      // Set up reactive update
      const domElement = element.element;
      const updateDOM = (value: unknown) => {
        if (binding === 'textContent') {
          domElement.textContent = String(value);
        } else if (binding === 'innerHTML') {
          (domElement as HTMLElement).innerHTML = String(value);
        } else if (binding === 'className' || binding === 'class') {
          domElement.className = String(value);
        } else if (binding === 'value' && domElement instanceof HTMLInputElement) {
          domElement.value = String(value);
        } else if (binding === 'checked' && domElement instanceof HTMLInputElement) {
          domElement.checked = Boolean(value);
        } else {
          domElement.setAttribute(binding, String(value));
        }
      };

      // Initial update
      updateDOM(signal.value);
    }

    // Also update signal text content elements
    const signalElements = document.querySelectorAll(`[data-qsignal="${signalId}"]`);
    signalElements.forEach((el) => {
      el.textContent = String(signal.value);
    });
  }
}

// ============================================================================
// Resume from DOM
// ============================================================================

/**
 * Resume application state from the DOM.
 */
export async function resumeFromDOM(
  root: Element = document.body,
  options?: DeserializationOptions
): Promise<DeserializedState | null> {
  // Find state script
  const stateElement = document.getElementById('__PHIL_STATE__');
  if (!stateElement) {
    console.warn('[PhilJS Deserializer] No state element found');
    return null;
  }

  // Deserialize state
  const state = deserializeState(stateElement, options);
  if (!state) return null;

  // Resolve DOM elements
  resolveElements(state, root);

  // Set up signal bindings
  setupSignalBindings(state);

  // Dispatch ready event
  root.dispatchEvent(
    new CustomEvent('phil:state-ready', {
      bubbles: true,
      detail: { state },
    })
  );

  return state;
}

// ============================================================================
// Attribute Deserialization
// ============================================================================

/**
 * Deserialize state from a data attribute.
 */
export function deserializeFromAttribute(
  attribute: string
): Record<string, unknown> | null {
  if (!attribute) return null;

  try {
    const decoded = atob(attribute);
    const serialized = JSON.parse(decoded) as Record<string, SerializedValue>;
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(serialized)) {
      result[key] = deserializeValue(value);
    }

    return result;
  } catch (error) {
    console.error(
      '[PhilJS Deserializer] Failed to deserialize attribute:',
      error
    );
    return null;
  }
}

/**
 * Get inline state from an element's data-qstate attribute.
 */
export function getElementState(element: Element): Record<string, unknown> | null {
  const stateAttr = element.getAttribute('data-qstate');
  if (!stateAttr) return null;
  return deserializeFromAttribute(stateAttr);
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Check if a value is a signal reference
 */
export function isSignalRef(
  value: unknown
): value is { $signalRef$: string; value: unknown } {
  return (
    value !== null &&
    typeof value === 'object' &&
    '$signalRef$' in value
  );
}

/**
 * Check if a value is a QRL reference
 */
export function isQRLRef(value: unknown): value is { $qrlRef$: string } {
  return (
    value !== null &&
    typeof value === 'object' &&
    '$qrlRef$' in value
  );
}

/**
 * Get all unhydrated elements from the state
 */
export function getUnhydratedElements(
  state: DeserializedState
): DeserializedElement[] {
  return Array.from(state.elements.values()).filter((el) => !el.hydrated);
}

/**
 * Get all unhydrated components from the state
 */
export function getUnhydratedComponents(
  state: DeserializedState
): DeserializedComponent[] {
  return Array.from(state.components.values()).filter((c) => !c.hydrated);
}

/**
 * Mark an element as hydrated
 */
export function markHydrated(state: DeserializedState, id: string): void {
  const element = state.elements.get(id);
  if (element) {
    element.hydrated = true;
    element.element?.setAttribute('data-qhydrated', 'true');
  }

  const component = state.components.get(id);
  if (component) {
    component.hydrated = true;
    component.element?.setAttribute('data-qhydrated', 'true');
  }
}

/**
 * Clear deserialized state (for testing/HMR)
 */
export function clearDeserializedState(state: DeserializedState): void {
  state.signals.clear();
  state.elements.clear();
  state.qrls.clear();
  state.components.clear();
}
