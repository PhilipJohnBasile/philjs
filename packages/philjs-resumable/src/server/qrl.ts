/**
 * QRL (Quick Resource Locator) Generation
 *
 * QRLs are the fundamental building block of resumability. They represent
 * lazy references to functions, components, and resources that can be
 * serialized as URLs and loaded on demand.
 *
 * @example
 * ```typescript
 * import { generateQRL, createQRL, $ } from '@philjs/resumable/server';
 *
 * // Create a lazy handler reference
 * const handler = $(() => console.log('clicked'));
 *
 * // Use in JSX
 * <button onClick$={handler}>Click me</button>
 * ```
 */

import type {
  QRL,
  QRLOptions,
  QRLEventHandler,
  QRLComponent,
  SerializationContext,
} from '../types.js';

// ============================================================================
// QRL Registry
// ============================================================================

interface QRLRegistry {
  /** Map of chunk paths to module loaders */
  chunks: Map<string, () => Promise<Record<string, unknown>>>;
  /** Map of QRL IDs to resolved values */
  resolved: Map<string, unknown>;
  /** Base path for chunk resolution */
  basePath: string;
  /** Custom module resolver */
  resolver?: (chunk: string) => Promise<Record<string, unknown>>;
}

const registry: QRLRegistry = {
  chunks: new Map(),
  resolved: new Map(),
  basePath: '',
};

let qrlIdCounter = 0;

// ============================================================================
// Configuration
// ============================================================================

/**
 * Configure the QRL registry
 */
export function configureQRL(options: {
  basePath?: string;
  resolver?: (chunk: string) => Promise<Record<string, unknown>>;
}): void {
  if (options.basePath !== undefined) {
    registry.basePath = options.basePath;
  }
  if (options.resolver !== undefined) {
    registry.resolver = options.resolver;
  }
}

/**
 * Clear the QRL registry (for testing)
 */
export function clearQRLRegistry(): void {
  registry.chunks.clear();
  registry.resolved.clear();
  registry.basePath = '';
  delete registry.resolver;
  qrlIdCounter = 0;
}

/**
 * Register a chunk loader
 */
export function registerChunk(
  chunkPath: string,
  loader: () => Promise<Record<string, unknown>>
): void {
  registry.chunks.set(chunkPath, loader);
}

/**
 * Register multiple chunk loaders
 */
export function registerChunks(
  chunks: Record<string, () => Promise<Record<string, unknown>>>
): void {
  for (const [path, loader] of Object.entries(chunks)) {
    registerChunk(path, loader);
  }
}

// ============================================================================
// QRL ID Generation
// ============================================================================

/**
 * Generate a unique QRL ID
 */
function generateQRLId(chunk: string, symbol: string): string {
  const sanitizedChunk = chunk.replace(/[^a-zA-Z0-9]/g, '_');
  return `qrl_${sanitizedChunk}_${symbol}_${qrlIdCounter++}`;
}

/**
 * Generate a hash for a function (for anonymous functions)
 */
function hashFunction(fn: Function): string {
  const fnStr = fn.toString();
  let hash = 0;
  for (let i = 0; i < fnStr.length; i++) {
    const char = fnStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// ============================================================================
// Core QRL Implementation
// ============================================================================

/**
 * Create a QRL from options
 */
export function createQRL<T>(options: QRLOptions<T>): QRL<T> {
  const id = generateQRLId(options.chunk, options.symbol);

  const qrl: QRL<T> = {
    $id$: id,
    $chunk$: options.chunk,
    $symbol$: options.symbol,
    $capture$: options.capture || [],
    $captureNames$: options.captureNames,
    $resolved$: options.resolved,
    $isResolved$: options.resolved !== undefined,

    async resolve(): Promise<T> {
      if (qrl.$isResolved$) {
        return qrl.$resolved$ as T;
      }

      // Check registry cache
      if (registry.resolved.has(id)) {
        qrl.$resolved$ = registry.resolved.get(id) as T;
        qrl.$isResolved$ = true;
        return qrl.$resolved$ as T;
      }

      // Load the chunk
      let module: Record<string, unknown>;

      if (registry.resolver) {
        module = await registry.resolver(options.chunk);
      } else if (registry.chunks.has(options.chunk)) {
        module = await registry.chunks.get(options.chunk)!();
      } else {
        // Dynamic import with base path
        const fullPath = registry.basePath
          ? `${registry.basePath}/${options.chunk}`
          : options.chunk;
        module = await import(/* @vite-ignore */ fullPath);
      }

      // Get the symbol
      const value = module[options.symbol];
      if (value === undefined) {
        throw new Error(
          `QRL symbol "${options.symbol}" not found in chunk "${options.chunk}"`
        );
      }

      // If the value is a function and we have captures, bind them
      if (typeof value === 'function' && qrl.$capture$.length > 0) {
        qrl.$resolved$ = bindCaptures(value, qrl.$capture$, qrl.$captureNames$) as T;
      } else {
        qrl.$resolved$ = value as T;
      }

      qrl.$isResolved$ = true;
      registry.resolved.set(id, qrl.$resolved$);

      return qrl.$resolved$ as T;
    },

    serialize(): string {
      const captures = qrl.$capture$.length > 0
        ? `[${qrl.$capture$.map(serializeCapture).join(',')}]`
        : '';
      return `${options.chunk}#${options.symbol}${captures}`;
    },

    invoke(...args: T extends (...args: infer A) => unknown ? A : never[]): Promise<T extends (...args: unknown[]) => infer R ? R : never> {
      return (async () => {
        const fn = await qrl.resolve();
        if (typeof fn !== 'function') {
          throw new Error(`QRL ${id} is not a function`);
        }
        return (fn as Function)(...args);
      })() as Promise<T extends (...args: unknown[]) => infer R ? R : never>;
    },
  };

  return qrl;
}

/**
 * Parse a serialized QRL string back into a QRL object
 */
export function parseQRL<T = unknown>(serialized: string): QRL<T> {
  // Format: chunk#symbol[captures]
  const hashIndex = serialized.indexOf('#');
  if (hashIndex === -1) {
    throw new Error(`Invalid QRL format: ${serialized}`);
  }

  const chunk = serialized.slice(0, hashIndex);
  let symbol = serialized.slice(hashIndex + 1);
  let captures: unknown[] = [];

  // Parse captures if present
  const bracketIndex = symbol.indexOf('[');
  if (bracketIndex !== -1) {
    const captureStr = symbol.slice(bracketIndex + 1, -1);
    symbol = symbol.slice(0, bracketIndex);
    captures = parseCaptures(captureStr);
  }

  return createQRL({
    chunk,
    symbol,
    capture: captures,
  });
}

// ============================================================================
// QRL Factory Functions
// ============================================================================

/**
 * The $ function - creates a lazy QRL reference.
 * This is the primary API for creating resumable code.
 *
 * @example
 * ```typescript
 * // Lazy event handler
 * const onClick = $(() => console.log('clicked'));
 *
 * // Lazy handler with captured state
 * const count = $signal(0);
 * const increment = $(() => count.set(c => c + 1));
 * ```
 */
export function $<T extends Function>(
  fn: T,
  captures?: unknown[],
  captureNames?: string[]
): QRL<T> {
  // In development, we keep the function inline
  // In production, the compiler will extract to chunks
  const options: QRLOptions<T> = {
    chunk: '__inline__',
    symbol: fn.name || `fn_${hashFunction(fn)}`,
    resolved: fn,
  };
  if (captures !== undefined) {
    options.capture = captures;
  }
  if (captureNames !== undefined) {
    options.captureNames = captureNames;
  }
  return createQRL(options);
}

/**
 * Generate a QRL for a function during SSR
 */
export function generateQRL<T extends Function>(
  fn: T,
  ctx?: SerializationContext
): QRL<T> {
  const symbol = fn.name || `fn_${hashFunction(fn)}`;
  const qrl = createQRL<T>({
    chunk: '__inline__',
    symbol,
    resolved: fn,
  });

  // Register in context if provided
  if (ctx) {
    ctx.qrls.set(qrl.$id$, qrl.serialize());
  }

  return qrl;
}

/**
 * Create a lazy component QRL
 */
export function component$<P = Record<string, unknown>>(
  component: (props: P) => unknown
): QRLComponent<P> {
  return createQRL({
    chunk: '__inline__',
    symbol: component.name || 'Component',
    resolved: component,
  });
}

/**
 * Create a QRL event handler with type safety
 */
export function event$<E extends Event>(
  handler: (event: E) => void | Promise<void>,
  captures?: unknown[],
  captureNames?: string[]
): QRLEventHandler<E> {
  return $<(event: E) => void | Promise<void>>(handler, captures, captureNames);
}

/**
 * Create a QRL that references an external module
 */
export function qrl<T>(
  chunk: string,
  symbol: string,
  captures?: unknown[]
): QRL<T> {
  const options: QRLOptions<T> = {
    chunk,
    symbol,
  };
  if (captures !== undefined) {
    options.capture = captures;
  }
  return createQRL(options);
}

/**
 * Inline a QRL - useful for SSR where we want immediate execution
 */
export function inlineQRL<T>(value: T): QRL<T> {
  return createQRL({
    chunk: '__inline__',
    symbol: 'value',
    resolved: value,
  });
}

// ============================================================================
// Common Event Handlers
// ============================================================================

export const onClick$ = <T = HTMLElement>(
  handler: (event: MouseEvent, el?: T) => void | Promise<void>,
  captures?: unknown[]
): QRLEventHandler<MouseEvent> => event$(handler, captures);

export const onInput$ = <T = HTMLInputElement>(
  handler: (event: InputEvent, el?: T) => void | Promise<void>,
  captures?: unknown[]
): QRLEventHandler<InputEvent> => event$(handler, captures);

export const onChange$ = <T = HTMLInputElement>(
  handler: (event: Event, el?: T) => void | Promise<void>,
  captures?: unknown[]
): QRLEventHandler<Event> => event$(handler, captures);

export const onSubmit$ = <T = HTMLFormElement>(
  handler: (event: SubmitEvent, el?: T) => void | Promise<void>,
  captures?: unknown[]
): QRLEventHandler<SubmitEvent> => event$(handler, captures);

export const onKeyDown$ = <T = HTMLElement>(
  handler: (event: KeyboardEvent, el?: T) => void | Promise<void>,
  captures?: unknown[]
): QRLEventHandler<KeyboardEvent> => event$(handler, captures);

export const onKeyUp$ = <T = HTMLElement>(
  handler: (event: KeyboardEvent, el?: T) => void | Promise<void>,
  captures?: unknown[]
): QRLEventHandler<KeyboardEvent> => event$(handler, captures);

export const onFocus$ = <T = HTMLElement>(
  handler: (event: FocusEvent, el?: T) => void | Promise<void>,
  captures?: unknown[]
): QRLEventHandler<FocusEvent> => event$(handler, captures);

export const onBlur$ = <T = HTMLElement>(
  handler: (event: FocusEvent, el?: T) => void | Promise<void>,
  captures?: unknown[]
): QRLEventHandler<FocusEvent> => event$(handler, captures);

// ============================================================================
// QRL Utilities
// ============================================================================

/**
 * Check if a value is a QRL
 */
export function isQRL(value: unknown): value is QRL {
  return (
    value !== null &&
    typeof value === 'object' &&
    '$id$' in value &&
    '$chunk$' in value &&
    '$symbol$' in value &&
    typeof (value as QRL).resolve === 'function'
  );
}

/**
 * Get the serialized form of a QRL for embedding in HTML
 */
export function getQRLAttribute(qrl: QRL): string {
  return qrl.serialize();
}

/**
 * Prefetch a QRL's chunk without resolving
 */
export async function prefetchQRL(qrl: QRL): Promise<void> {
  if (qrl.$isResolved$) return;

  const chunk = qrl.$chunk$;
  if (chunk === '__inline__') return;

  // Just load the chunk to warm the cache
  if (registry.resolver) {
    await registry.resolver(chunk);
  } else if (registry.chunks.has(chunk)) {
    await registry.chunks.get(chunk)!();
  }
}

/**
 * Prefetch multiple QRLs in parallel
 */
export async function prefetchQRLs(qrls: QRL[]): Promise<void> {
  await Promise.all(qrls.map(prefetchQRL));
}

// ============================================================================
// Task QRLs
// ============================================================================

/**
 * Create a lazy task that runs on the server
 */
export function server$<T extends (...args: unknown[]) => unknown>(
  fn: T
): QRL<T> {
  return createQRL({
    chunk: '__server__',
    symbol: fn.name || 'serverFn',
    resolved: fn,
  });
}

/**
 * Create a lazy task that runs on the client
 */
export function browser$<T extends (...args: unknown[]) => unknown>(
  fn: T
): QRL<T> {
  // On server, return a no-op
  if (typeof window === 'undefined') {
    return createQRL({
      chunk: '__browser__',
      symbol: fn.name || 'browserFn',
      resolved: (() => {}) as unknown as T,
    });
  }
  return createQRL({
    chunk: '__browser__',
    symbol: fn.name || 'browserFn',
    resolved: fn,
  });
}

/**
 * Create a lazy effect that runs after hydration
 */
export function useVisibleTask$<T>(
  fn: () => T | Promise<T>
): QRL<() => T | Promise<T>> {
  return createQRL({
    chunk: '__task__',
    symbol: 'visibleTask',
    resolved: fn,
  });
}

/**
 * Create a lazy task that runs on the server during SSR
 */
export function useTask$<T>(
  fn: () => T | Promise<T>
): QRL<() => T | Promise<T>> {
  return createQRL({
    chunk: '__task__',
    symbol: 'task',
    resolved: fn,
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Serialize a captured value for QRL serialization
 */
function serializeCapture(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    // Check for signal-like objects
    if ('$id$' in (value as object)) {
      return `qrl:${(value as { $id$: string }).$id$}`;
    }
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Parse captures from a serialized string
 */
function parseCaptures(captureStr: string): unknown[] {
  if (!captureStr) return [];

  // Simple JSON-based parsing
  try {
    return JSON.parse(`[${captureStr}]`);
  } catch {
    // Handle special values
    return captureStr.split(',').map((s) => {
      s = s.trim();
      if (s === 'null') return null;
      if (s === 'undefined') return undefined;
      if (s === 'true') return true;
      if (s === 'false') return false;
      if (s.startsWith('qrl:')) return { $qrlRef$: s.slice(4) };
      const num = Number(s);
      if (!isNaN(num)) return num;
      // Try JSON parse for strings/objects
      try {
        return JSON.parse(s);
      } catch {
        return s;
      }
    });
  }
}

/**
 * Bind captured variables to a function
 */
function bindCaptures(
  fn: Function,
  captures: unknown[],
  captureNames?: string[]
): Function {
  // If we have capture names, create an object for named access
  if (captureNames && captureNames.length === captures.length) {
    const captureObj: Record<string, unknown> = {};
    captureNames.forEach((name, i) => {
      captureObj[name] = captures[i];
    });
    return (...args: unknown[]) => fn(captureObj, ...args);
  }

  // Otherwise, pass captures as first argument
  return (...args: unknown[]) => fn(captures, ...args);
}
