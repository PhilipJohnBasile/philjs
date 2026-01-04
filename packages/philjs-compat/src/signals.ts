/**
 * Signals Polyfill
 *
 * Polyfill for TC39 Signals proposal in legacy browsers
 */

/**
 * Check if the environment needs the signals polyfill
 */
export function needsSignalsPolyfill(): boolean {
  return typeof (globalThis as any).Signal === 'undefined';
}

/**
 * Initialize the signals polyfill
 */
export function initSignalsPolyfill(): void {
  if (!needsSignalsPolyfill()) return;

  // Basic Signal implementation for legacy browsers
  class SignalPolyfill<T> {
    private _value: T;
    private _subscribers = new Set<() => void>();

    constructor(initialValue: T) {
      this._value = initialValue;
    }

    get value(): T {
      return this._value;
    }

    set value(newValue: T) {
      if (this._value !== newValue) {
        this._value = newValue;
        this._notify();
      }
    }

    private _notify(): void {
      for (const sub of this._subscribers) {
        sub();
      }
    }

    subscribe(callback: () => void): () => void {
      this._subscribers.add(callback);
      return () => this._subscribers.delete(callback);
    }
  }

  class ComputedPolyfill<T> {
    private _compute: () => T;
    private _cachedValue: T | undefined;
    private _dirty = true;

    constructor(compute: () => T) {
      this._compute = compute;
    }

    get value(): T {
      if (this._dirty) {
        this._cachedValue = this._compute();
        this._dirty = false;
      }
      return this._cachedValue as T;
    }

    invalidate(): void {
      this._dirty = true;
    }
  }

  (globalThis as any).Signal = {
    State: SignalPolyfill,
    Computed: ComputedPolyfill,
  };
}

export { SignalPolyfill, ComputedPolyfill };

class SignalPolyfill<T> {
  private _value: T;
  private _subscribers = new Set<() => void>();

  constructor(initialValue: T) {
    this._value = initialValue;
  }

  get value(): T {
    return this._value;
  }

  set value(newValue: T) {
    if (this._value !== newValue) {
      this._value = newValue;
      this._notify();
    }
  }

  private _notify(): void {
    for (const sub of this._subscribers) {
      sub();
    }
  }

  subscribe(callback: () => void): () => void {
    this._subscribers.add(callback);
    return () => this._subscribers.delete(callback);
  }
}

class ComputedPolyfill<T> {
  private _compute: () => T;
  private _cachedValue: T | undefined;
  private _dirty = true;

  constructor(compute: () => T) {
    this._compute = compute;
  }

  get value(): T {
    if (this._dirty) {
      this._cachedValue = this._compute();
      this._dirty = false;
    }
    return this._cachedValue as T;
  }

  invalidate(): void {
    this._dirty = true;
  }
}