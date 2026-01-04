/**
 * structuredClone Polyfill
 *
 * Provides a fallback implementation for structuredClone using
 * various strategies (MessageChannel, JSON, or custom deep clone).
 */

import type { PolyfillModule } from '../types.js';
import { isBrowser } from '../detection/feature-detect.js';

/**
 * Types that can be directly returned without cloning
 */
const primitiveTypes = new Set(['undefined', 'boolean', 'number', 'string', 'bigint', 'symbol']);

/**
 * Check if a value is a primitive
 */
function isPrimitive(value: unknown): boolean {
  return value === null || primitiveTypes.has(typeof value);
}

/**
 * Clone using MessageChannel (async, but more accurate)
 * This method supports most structured clone types
 */
function cloneViaMessageChannel<T>(value: T): Promise<T> {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();

    channel.port2.onmessage = (event) => {
      resolve(event.data);
    };

    channel.port2.onmessageerror = () => {
      reject(new Error('Failed to clone value via MessageChannel'));
    };

    try {
      channel.port1.postMessage(value);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Clone using JSON (fast but limited - no functions, symbols, undefined, etc.)
 */
function cloneViaJSON<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Deep clone implementation for objects and arrays
 * Handles circular references and most common types
 */
function deepClone<T>(value: T, seen = new WeakMap<object, unknown>()): T {
  // Handle primitives and null
  if (isPrimitive(value)) {
    return value;
  }

  // Handle functions (not clonable)
  if (typeof value === 'function') {
    throw new DOMException(
      'Failed to execute \'structuredClone\': function cannot be cloned.',
      'DataCloneError'
    );
  }

  // Check for circular references
  if (seen.has(value as object)) {
    return seen.get(value as object) as T;
  }

  // Handle Date
  if (value instanceof Date) {
    return new Date(value.getTime()) as T;
  }

  // Handle RegExp
  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as T;
  }

  // Handle Error
  if (value instanceof Error) {
    const clonedError = new (value.constructor as ErrorConstructor)(value.message);
    clonedError.name = value.name;
    if (value.stack) {
      clonedError.stack = value.stack;
    }
    return clonedError as T;
  }

  // Handle Map
  if (value instanceof Map) {
    const clonedMap = new Map();
    seen.set(value, clonedMap);
    for (const [k, v] of value) {
      clonedMap.set(deepClone(k, seen), deepClone(v, seen));
    }
    return clonedMap as T;
  }

  // Handle Set
  if (value instanceof Set) {
    const clonedSet = new Set();
    seen.set(value, clonedSet);
    for (const v of value) {
      clonedSet.add(deepClone(v, seen));
    }
    return clonedSet as T;
  }

  // Handle ArrayBuffer
  if (value instanceof ArrayBuffer) {
    return value.slice(0) as T;
  }

  // Handle TypedArrays
  if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
    const TypedArrayConstructor = value.constructor as {
      new (buffer: ArrayBuffer): typeof value;
    };
    return new TypedArrayConstructor((value.buffer as ArrayBuffer).slice(0)) as T;
  }

  // Handle DataView
  if (value instanceof DataView) {
    return new DataView(value.buffer.slice(0)) as T;
  }

  // Handle Blob
  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    return value.slice(0, value.size, value.type) as T;
  }

  // Handle Array
  if (Array.isArray(value)) {
    const clonedArray: unknown[] = [];
    seen.set(value, clonedArray);
    for (let i = 0; i < value.length; i++) {
      clonedArray[i] = deepClone(value[i], seen);
    }
    return clonedArray as T;
  }

  // Handle plain objects
  if (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null) {
    const clonedObj: Record<string, unknown> = Object.create(Object.getPrototypeOf(value));
    seen.set(value as object, clonedObj);

    for (const key of Object.keys(value as object)) {
      clonedObj[key] = deepClone((value as Record<string, unknown>)[key], seen);
    }

    // Clone symbol keys as well
    for (const sym of Object.getOwnPropertySymbols(value as object)) {
      throw new DOMException(
        'Failed to execute \'structuredClone\': Symbol cannot be cloned.',
        'DataCloneError'
      );
    }

    return clonedObj as T;
  }

  // For other objects that can't be cloned, throw an error
  throw new DOMException(
    `Failed to execute 'structuredClone': ${Object.prototype.toString.call(value)} cannot be cloned.`,
    'DataCloneError'
  );
}

/**
 * structuredClone polyfill implementation
 */
function structuredClonePolyfill<T>(value: T): T {
  // Handle primitives directly
  if (isPrimitive(value)) {
    return value;
  }

  // Use deep clone implementation
  return deepClone(value);
}

/**
 * Async version of structuredClone using MessageChannel
 * More accurate but async
 */
export async function structuredCloneAsync<T>(value: T): Promise<T> {
  if (isPrimitive(value)) {
    return value;
  }

  // Try native structuredClone first
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  // Try MessageChannel
  if (typeof MessageChannel !== 'undefined') {
    try {
      return await cloneViaMessageChannel(value);
    } catch {
      // Fall through to sync implementation
    }
  }

  // Fallback to sync implementation
  return deepClone(value);
}

/**
 * Check if structuredClone polyfill is needed
 */
export function isStructuredCloneNeeded(): boolean {
  return typeof structuredClone === 'undefined';
}

/**
 * Apply structuredClone polyfill
 */
export function applyStructuredClonePolyfill(): void {
  if (typeof structuredClone === 'undefined') {
    (globalThis as any).structuredClone = structuredClonePolyfill;
  }
}

/**
 * Get structuredClone function (native or polyfilled)
 */
export function getStructuredClone(): typeof structuredClone {
  if (typeof structuredClone !== 'undefined') {
    return structuredClone;
  }
  return structuredClonePolyfill;
}

/**
 * Polyfill module definition
 */
export const structuredClonePolyfillModule: PolyfillModule = {
  feature: 'structuredClone',
  isNeeded: isStructuredCloneNeeded,
  apply: applyStructuredClonePolyfill,
};
