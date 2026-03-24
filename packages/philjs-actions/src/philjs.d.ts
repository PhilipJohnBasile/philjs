declare module 'philjs' {
  export function createSignal<T>(value: T): [() => T, (v: T | ((prev: T) => T)) => void];
  export function createEffect(fn: () => void): void;
  export function createMemo<T>(fn: () => T): () => T;
}
