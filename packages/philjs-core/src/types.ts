/**
 * Core type definitions for PhilJS.
 * Provides strict, type-safe primitives for signals, effects, JSX, and components.
 */

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Makes all properties in T strictly non-nullable
 */
export type NonNullableProps<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

/**
 * Function that might be an updater or a direct value
 */
export type MaybeAccessor<T> = T | (() => T);

/**
 * Type guard for accessor functions
 */
export type Accessor<T> = () => T;

/**
 * Type guard for setter functions (can accept value or updater)
 */
export type Setter<T> = (value: T | ((prev: T) => T)) => void;

/**
 * Subscribable interface for reactive values
 */
export interface Subscribable<T> {
  subscribe(fn: (value: T) => void): () => void;
}

// ============================================================================
// Signal Types
// ============================================================================

/**
 * A reactive signal with get/set capabilities and subscription support.
 * @template T The type of value stored in the signal
 */
export interface Signal<T> {
  (): T;
  set: Setter<T>;
  subscribe: (fn: (value: T) => void) => () => void;
  peek: () => T;
}

/**
 * A readonly computed value that tracks dependencies automatically.
 * @template T The type of computed value
 */
export interface Memo<T> {
  (): T;
  subscribe?: (fn: (value: T) => void) => () => void;
}

/**
 * A writable computed signal (like Angular's linkedSignal).
 * Can be manually overridden but resets when dependencies change.
 * @template T The type of value
 */
export interface LinkedSignal<T> {
  (): T;
  set: Setter<T>;
  reset: () => void;
  isOverridden: () => boolean;
}

/**
 * Options for creating a linked signal
 */
export interface LinkedSignalOptions {
  /**
   * Whether to reset to computed value when dependencies change.
   * @default true
   */
  resetOnChange?: boolean;
}

/**
 * A resource that tracks async data with loading and error states.
 * @template T The type of data being loaded
 */
export interface Resource<T> {
  (): T;
  refresh: () => void;
  loading: () => boolean;
  error: () => Error | null;
}

/**
 * Cleanup function returned by effects
 */
export type EffectCleanup = () => void;

/**
 * Function signature for effects
 */
export type EffectFunction = () => void | EffectCleanup;

/**
 * Function signature for resource fetchers
 */
export type ResourceFetcher<T> = () => T | Promise<T>;

// ============================================================================
// JSX Types
// ============================================================================

/**
 * Core JSX element representation
 */
export interface JSXElement<P = unknown> {
  type: string | ComponentFunction<P>;
  props: P extends Props ? P : Props;
  key?: string | number;
}

/**
 * Valid JSX child types
 */
export type JSXChild =
  | JSXElement
  | string
  | number
  | boolean
  | null
  | undefined
  | JSXChild[];

/**
 * Virtual node - any valid renderable value
 */
export type VNode = JSXChild;

/**
 * Base props that all components accept
 */
export interface BaseProps {
  children?: JSXChild;
  key?: string | number;
}

/**
 * Generic props with children
 */
export interface PropsWithChildren<P = unknown> extends BaseProps {
  children?: JSXChild;
}

/**
 * Props type that allows any valid prop
 */
export type Props = BaseProps & {
  [key: string]: unknown;
};

/**
 * HTML attributes with strict event handler types
 */
export interface HTMLAttributes<T extends Element = Element> extends BaseProps {
  // Standard attributes
  id?: string;
  className?: string | (() => string);
  class?: string | (() => string);
  style?: string | CSSProperties | (() => string | CSSProperties);
  title?: string;
  role?: string;
  tabIndex?: number;

  // ARIA attributes
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-hidden'?: boolean;
  'aria-expanded'?: boolean;
  'aria-selected'?: boolean;
  'aria-checked'?: boolean;
  'aria-disabled'?: boolean;
  'aria-required'?: boolean;
  'aria-invalid'?: boolean;
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  'aria-busy'?: boolean;
  'aria-controls'?: string;
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
  'aria-owns'?: string;

  // Data attributes
  [dataAttribute: `data-${string}`]: string | number | boolean | undefined;

  // Event handlers - strict types instead of any
  onClick?: EventHandler<MouseEvent, T>;
  onDblClick?: EventHandler<MouseEvent, T>;
  onChange?: EventHandler<Event, T>;
  onInput?: EventHandler<InputEvent, T>;
  onSubmit?: EventHandler<SubmitEvent, T>;
  onKeyDown?: EventHandler<KeyboardEvent, T>;
  onKeyUp?: EventHandler<KeyboardEvent, T>;
  onKeyPress?: EventHandler<KeyboardEvent, T>;
  onFocus?: EventHandler<FocusEvent, T>;
  onBlur?: EventHandler<FocusEvent, T>;
  onMouseDown?: EventHandler<MouseEvent, T>;
  onMouseUp?: EventHandler<MouseEvent, T>;
  onMouseEnter?: EventHandler<MouseEvent, T>;
  onMouseLeave?: EventHandler<MouseEvent, T>;
  onMouseMove?: EventHandler<MouseEvent, T>;
  onMouseOver?: EventHandler<MouseEvent, T>;
  onMouseOut?: EventHandler<MouseEvent, T>;
  onTouchStart?: EventHandler<TouchEvent, T>;
  onTouchMove?: EventHandler<TouchEvent, T>;
  onTouchEnd?: EventHandler<TouchEvent, T>;
  onTouchCancel?: EventHandler<TouchEvent, T>;
  onScroll?: EventHandler<Event, T>;
  onWheel?: EventHandler<WheelEvent, T>;
  onDrag?: EventHandler<DragEvent, T>;
  onDragEnd?: EventHandler<DragEvent, T>;
  onDragEnter?: EventHandler<DragEvent, T>;
  onDragExit?: EventHandler<DragEvent, T>;
  onDragLeave?: EventHandler<DragEvent, T>;
  onDragOver?: EventHandler<DragEvent, T>;
  onDragStart?: EventHandler<DragEvent, T>;
  onDrop?: EventHandler<DragEvent, T>;
  onLoad?: EventHandler<Event, T>;
  onError?: EventHandler<ErrorEvent, T>;
  onAnimationStart?: EventHandler<AnimationEvent, T>;
  onAnimationEnd?: EventHandler<AnimationEvent, T>;
  onAnimationIteration?: EventHandler<AnimationEvent, T>;
  onTransitionEnd?: EventHandler<TransitionEvent, T>;
}

/**
 * Event handler type - properly typed
 */
export type EventHandler<E extends Event = Event, T extends Element = Element> = (
  event: E & { currentTarget: T; target: EventTarget | null }
) => void;

/**
 * CSS properties type
 */
export interface CSSProperties {
  [key: string]: string | number | undefined;
}

/**
 * Input element attributes
 */
export interface InputHTMLAttributes extends HTMLAttributes<HTMLInputElement> {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'checkbox' | 'radio' | 'file' | 'submit' | 'reset' | 'button' | 'hidden' | 'range' | 'color';
  value?: string | number | readonly string[];
  defaultValue?: string | number | readonly string[];
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
  placeholder?: string;
  name?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  pattern?: string;
  accept?: string;
  multiple?: boolean;
}

/**
 * Button element attributes
 */
export interface ButtonHTMLAttributes extends HTMLAttributes<HTMLButtonElement> {
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  autoFocus?: boolean;
  name?: string;
  value?: string;
}

/**
 * Form element attributes
 */
export interface FormHTMLAttributes extends HTMLAttributes<HTMLFormElement> {
  action?: string;
  method?: 'get' | 'post';
  encType?: string;
  target?: string;
  autoComplete?: string;
  noValidate?: boolean;
}

/**
 * Select element attributes
 */
export interface SelectHTMLAttributes extends HTMLAttributes<HTMLSelectElement> {
  value?: string | string[] | number;
  defaultValue?: string | string[] | number;
  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  multiple?: boolean;
  name?: string;
  size?: number;
}

/**
 * Textarea element attributes
 */
export interface TextareaHTMLAttributes extends HTMLAttributes<HTMLTextAreaElement> {
  value?: string | number | readonly string[];
  defaultValue?: string | number | readonly string[];
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  name?: string;
  rows?: number;
  cols?: number;
  wrap?: string;
  maxLength?: number;
  minLength?: number;
}

/**
 * Anchor element attributes
 */
export interface AnchorHTMLAttributes extends HTMLAttributes<HTMLAnchorElement> {
  href?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
  rel?: string;
  download?: boolean | string;
  hrefLang?: string;
  type?: string;
}

/**
 * Image element attributes
 */
export interface ImgHTMLAttributes extends HTMLAttributes<HTMLImageElement> {
  src?: string;
  srcSet?: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  crossOrigin?: 'anonymous' | 'use-credentials';
}

/**
 * Label element attributes
 */
export interface LabelHTMLAttributes extends HTMLAttributes<HTMLLabelElement> {
  htmlFor?: string;
  form?: string;
}

// ============================================================================
// Component Types
// ============================================================================

/**
 * Function component type with proper generic props
 */
export type ComponentFunction<P = Props> = (props: P) => JSXChild;

/**
 * Component type - can be string (HTML element) or function (component)
 */
export type Component<P = Props> = string | ComponentFunction<P>;

/**
 * Component with children prop
 */
export type ParentComponent<P = Props> = ComponentFunction<PropsWithChildren<P>>;

/**
 * Fragment component props
 */
export interface FragmentProps {
  children?: JSXChild;
}

// ============================================================================
// Reactive Computation Types
// ============================================================================

/**
 * Internal computation node for tracking dependencies
 * @internal
 */
export interface Computation {
  execute: () => void;
  dependencies: Set<Set<Computation>>;
}

/**
 * Owner node for managing lifecycle and cleanup
 * @internal
 */
export interface Owner {
  cleanups: EffectCleanup[];
  owned: Owner[];
  context?: Map<symbol, unknown>;
}

// ============================================================================
// Batching & Control Flow Types
// ============================================================================

/**
 * Batch function type
 */
export type BatchFunction = <T>(fn: () => T) => T;

/**
 * Untrack function type
 */
export type UntrackFunction = <T>(fn: () => T) => T;

/**
 * Root function type
 */
export type RootFunction = <T>(fn: (dispose: () => void) => T) => T;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a value is a JSX element
 */
export function isJSXElement(value: unknown): value is JSXElement {
  return (
    value !== null &&
    typeof value === 'object' &&
    'type' in value &&
    'props' in value
  );
}

/**
 * Check if a value is a signal
 */
export function isSignal<T>(value: unknown): value is Signal<T> {
  return (
    typeof value === 'function' &&
    'set' in value &&
    'peek' in value &&
    'subscribe' in value
  );
}

/**
 * Check if a value is a memo
 */
export function isMemo<T>(value: unknown): value is Memo<T> {
  return (
    typeof value === 'function' &&
    !('set' in value)
  );
}

/**
 * Check if a value is an accessor (function)
 */
export function isAccessor<T>(value: MaybeAccessor<T>): value is Accessor<T> {
  return typeof value === 'function';
}

/**
 * Resolve a maybe accessor to its value
 */
export function resolveAccessor<T>(value: MaybeAccessor<T>): T {
  return typeof value === 'function' ? (value as Accessor<T>)() : value;
}

// ============================================================================
// JSX Namespace Declaration
// ============================================================================

declare global {
  namespace JSX {
    /**
     * The JSX element type
     */
    type Element = JSXElement;

    /**
     * The type of the children prop
     */
    type ElementChildrenAttribute = {
      children: JSXChild;
    };

    /**
     * Intrinsic attributes available on all elements
     */
    interface IntrinsicAttributes {
      key?: string | number;
    }

    /**
     * HTML intrinsic elements with proper types
     */
    interface IntrinsicElements {
      // Document structure
      html: HTMLAttributes<HTMLHtmlElement>;
      head: HTMLAttributes<HTMLHeadElement>;
      body: HTMLAttributes<HTMLBodyElement>;

      // Content sectioning
      div: HTMLAttributes<HTMLDivElement>;
      span: HTMLAttributes<HTMLSpanElement>;
      header: HTMLAttributes<HTMLElement>;
      footer: HTMLAttributes<HTMLElement>;
      main: HTMLAttributes<HTMLElement>;
      section: HTMLAttributes<HTMLElement>;
      article: HTMLAttributes<HTMLElement>;
      aside: HTMLAttributes<HTMLElement>;
      nav: HTMLAttributes<HTMLElement>;

      // Text content
      h1: HTMLAttributes<HTMLHeadingElement>;
      h2: HTMLAttributes<HTMLHeadingElement>;
      h3: HTMLAttributes<HTMLHeadingElement>;
      h4: HTMLAttributes<HTMLHeadingElement>;
      h5: HTMLAttributes<HTMLHeadingElement>;
      h6: HTMLAttributes<HTMLHeadingElement>;
      p: HTMLAttributes<HTMLParagraphElement>;
      blockquote: HTMLAttributes<HTMLQuoteElement>;
      pre: HTMLAttributes<HTMLPreElement>;
      code: HTMLAttributes<HTMLElement>;
      em: HTMLAttributes<HTMLElement>;
      strong: HTMLAttributes<HTMLElement>;
      small: HTMLAttributes<HTMLElement>;
      mark: HTMLAttributes<HTMLElement>;
      abbr: HTMLAttributes<HTMLElement>;

      // Lists
      ul: HTMLAttributes<HTMLUListElement>;
      ol: HTMLAttributes<HTMLOListElement>;
      li: HTMLAttributes<HTMLLIElement>;
      dl: HTMLAttributes<HTMLDListElement>;
      dt: HTMLAttributes<HTMLElement>;
      dd: HTMLAttributes<HTMLElement>;

      // Forms
      form: FormHTMLAttributes;
      input: InputHTMLAttributes;
      button: ButtonHTMLAttributes;
      select: SelectHTMLAttributes;
      textarea: TextareaHTMLAttributes;
      label: LabelHTMLAttributes;
      fieldset: HTMLAttributes<HTMLFieldSetElement>;
      legend: HTMLAttributes<HTMLLegendElement>;
      option: HTMLAttributes<HTMLOptionElement>;
      optgroup: HTMLAttributes<HTMLOptGroupElement>;

      // Interactive
      a: AnchorHTMLAttributes;
      details: HTMLAttributes<HTMLDetailsElement>;
      summary: HTMLAttributes<HTMLElement>;
      dialog: HTMLAttributes<HTMLDialogElement>;

      // Media
      img: ImgHTMLAttributes;
      video: HTMLAttributes<HTMLVideoElement>;
      audio: HTMLAttributes<HTMLAudioElement>;
      canvas: HTMLAttributes<HTMLCanvasElement>;
      svg: HTMLAttributes<SVGElement>;

      // Tables
      table: HTMLAttributes<HTMLTableElement>;
      thead: HTMLAttributes<HTMLTableSectionElement>;
      tbody: HTMLAttributes<HTMLTableSectionElement>;
      tfoot: HTMLAttributes<HTMLTableSectionElement>;
      tr: HTMLAttributes<HTMLTableRowElement>;
      th: HTMLAttributes<HTMLTableCellElement>;
      td: HTMLAttributes<HTMLTableCellElement>;

      // Other
      br: HTMLAttributes<HTMLBRElement>;
      hr: HTMLAttributes<HTMLHRElement>;
      iframe: HTMLAttributes<HTMLIFrameElement>;
      script: HTMLAttributes<HTMLScriptElement>;
      style: HTMLAttributes<HTMLStyleElement>;
      meta: HTMLAttributes<HTMLMetaElement>;
      link: HTMLAttributes<HTMLLinkElement>;
      title: HTMLAttributes<HTMLTitleElement>;
    }
  }
}

// Re-export for convenience
export type { JSXElement as Element, VNode, JSXChild };
