/**
 * Type declarations for external @philjs packages.
 * These declarations bridge the gap between the universal-react
 * code and the current @philjs/universal and @philjs/core APIs.
 */

declare module '@philjs/universal' {
  export interface UniversalComponent<P = Record<string, unknown>> {
    id: string;
    name: string;
    mount(container: Element, props: P): UniversalInstance<P>;
  }

  export interface UniversalInstance<P = Record<string, unknown>> {
    update(props: Partial<P>): void;
    unmount(): void;
    onError(callback: (error: Error) => void): () => void;
    on(event: LifecycleEvent, callback: () => void): () => void;
  }

  export type LifecycleEvent = 'mount' | 'update' | 'unmount' | 'error';

  export interface UniversalComponentDef<
    Props extends Record<string, unknown> = Record<string, unknown>,
    Events extends Record<string, unknown> = Record<string, unknown>,
  > {
    name: string;
    props: Record<string, PropDefinition>;
    events?: Record<string, EventDefinition>;
    slots?: Record<string, SlotDefinition>;
    render(context: RenderContext<Props, Events>): VNode | VNode[] | string | null;
    lifecycle?: LifecycleHooks;
  }

  export interface PropDefinition {
    type: unknown;
    default?: unknown;
    required?: boolean;
    validator?: (value: unknown) => boolean;
  }

  export interface EventDefinition {
    type?: unknown;
  }

  export interface SlotDefinition {
    description?: string;
  }

  export interface RenderContext<
    Props extends Record<string, unknown> = Record<string, unknown>,
    Events extends Record<string, unknown> = Record<string, unknown>,
  > {
    props: { [K in keyof Props]: () => Props[K] };
    emit: (event: string, ...args: unknown[]) => void;
    slot: (name?: string) => SlotContent;
    host: () => HTMLElement | null;
    update: () => void;
  }

  export interface SlotContent {
    hasContent: boolean;
    render: () => unknown;
  }

  export interface LifecycleHooks {
    mounted?: () => void;
    updated?: () => void;
    unmounted?: () => void;
  }

  export interface VNode {
    type: string | symbol;
    props: Record<string, unknown>;
    children: Array<VNode | string | number>;
    key?: string | number;
  }

  export type RenderOutput = VNode | VNode[] | string | number | null;

  export interface ComponentRef {
    element: HTMLElement;
  }

  export interface UniversalContext<T = unknown> {
    get(): T | undefined;
    set(value: T): void;
    subscribe(callback: () => void): () => void;
    hasValue(): boolean;
  }

  export interface ContextBridge {
    getContext<T>(id: string): UniversalContext<T> | undefined;
    createContext<T>(id: string, initialValue: T): UniversalContext<T>;
    hasContext(id: string): boolean;
  }

  export function createUniversalComponent<P extends Record<string, unknown>>(
    def: {
      id: string;
      name: string;
      source: string;
      mount(container: Element, props: P, utils: {
        emitLifecycle: (event: string, data?: unknown) => void;
        onPropsChange: (callback: (newProps: P) => void) => () => void;
      }): {
        update(newProps: Record<string, unknown>): void;
        cleanup(): void;
        getElement(): Element;
      };
      serialize?(props: P | null): Record<string, unknown>;
    }
  ): UniversalComponent<P>;

  export function isSignal(value: unknown): boolean;
  export function isMemo(value: unknown): boolean;
  export function getGlobalContextBridge(): ContextBridge;

  export function defineComponent<
    Props extends Record<string, unknown> = Record<string, unknown>,
    Events extends Record<string, unknown> = Record<string, unknown>,
  >(def: UniversalComponentDef<Props, Events>): UniversalComponentDef<Props, Events>;

  export function h(type: string | symbol, props?: Record<string, unknown> | null, ...children: unknown[]): VNode;

  export const Fragment: symbol;

  export const PropTypes: {
    string: unknown;
    number: unknown;
    boolean: unknown;
    object: unknown;
    array: unknown;
    function: unknown;
  };
}

declare module '@philjs/core' {
  export interface Signal<T = unknown> {
    (): T;
    set(value: T | ((prev: T) => T)): void;
    peek(): T;
    subscribe(fn: () => void): () => void;
  }

  export interface Memo<T = unknown> {
    (): T;
    peek(): T;
    subscribe(fn: () => void): () => void;
  }

  export function signal<T>(value: T): Signal<T>;
  export function memo<T>(fn: () => T): Memo<T>;
  export function effect(fn: () => void | (() => void)): () => void;
  export function batch(fn: () => void): void;
}
