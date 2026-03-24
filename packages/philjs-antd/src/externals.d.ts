declare module '@philjs/core' {
  export interface Signal<T> {
    (): T;
    get: () => T;
    set: (value: T | ((prev: T) => T)) => void;
    subscribe: (fn: (value: T) => void) => () => void;
    peek: () => T;
  }
  export interface Memo<T> {
    (): T;
    get: () => T;
  }
  export function signal<T>(initial: T): Signal<T>;
  export function memo<T>(fn: () => T): Memo<T>;
  export function effect(fn: () => void | (() => void)): () => void;
  export function batch(fn: () => void): void;
}
