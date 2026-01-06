declare module 'immer' {
  export type Draft<T> = T;
  export type Immutable<T> = T;
  export function produce<T>(
    base: T,
    recipe: (draft: Draft<T>) => void | T
  ): T;
  export function enableMapSet(): void;
  export function enablePatches(): void;
  export function createDraft<T>(base: T): Draft<T>;
  export function finishDraft<T>(draft: Draft<T>): T;
  export function isDraft(value: any): boolean;
  export function original<T>(draft: Draft<T>): T | undefined;
  export function current<T>(draft: Draft<T>): T;
}

declare module '@philjs/core' {
  export function createSignal<T>(initial: T): [() => T, (value: T | ((prev: T) => T)) => void];
  export function createEffect(fn: () => void | (() => void)): void;
  export function createMemo<T>(fn: () => T): () => T;
  export function createComputed<T>(fn: () => T): () => T;
  export function batch(fn: () => void): void;
  export function untrack<T>(fn: () => T): T;
  export function onCleanup(fn: () => void): void;
  export function onMount(fn: () => void): void;
  export type Signal<T> = [() => T, (value: T | ((prev: T) => T)) => void];
}
