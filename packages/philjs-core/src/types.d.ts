/**
 * Core type definitions for PhilJS.
 * Provides strict, type-safe primitives for signals, effects, JSX, and components.
 */
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
/**
 * A reactive signal with get/set capabilities and subscription support.
 * @template T The type of value stored in the signal
 */
export interface Signal<T> {
    (): T;
    get: () => T;
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
    get: () => T;
    subscribe?: (fn: (value: T) => void) => () => void;
}
/**
 * A writable computed signal (like Angular's linkedSignal).
 * Can be manually overridden but resets when dependencies change.
 * @template T The type of value
 */
export interface LinkedSignal<T> {
    (): T;
    get: () => T;
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
    get: () => T;
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
/**
 * Core JSX element representation
 */
export interface JSXElement<P = unknown> {
    type: string | Function;
    props: P extends Props ? P : Props;
    key?: string | number;
}
/**
 * Valid JSX child types
 */
export type JSXChild = JSXElement | string | number | boolean | null | undefined | JSXChild[] | Accessor<JSXChild>;
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
    id?: string;
    className?: string | (() => string);
    class?: string | (() => string);
    style?: string | CSSProperties | (() => string | CSSProperties);
    title?: string;
    role?: string;
    tabIndex?: number;
    spellCheck?: boolean;
    dangerouslySetInnerHTML?: {
        __html: string;
    };
    ref?: ((el: T) => void) | {
        current: T | null;
    };
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
    [dataAttribute: `data-${string}`]: string | number | boolean | undefined;
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
export type EventHandler<E extends Event = Event, T extends Element = Element> = (event: E & {
    currentTarget: T;
    target: EventTarget | null;
}) => void;
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
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local' | 'month' | 'week' | 'checkbox' | 'radio' | 'file' | 'submit' | 'reset' | 'button' | 'hidden' | 'range' | 'color';
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
    id?: string;
    min?: number | string;
    max?: number | string;
    step?: number | string;
    pattern?: string;
    accept?: string;
    multiple?: boolean;
    maxLength?: number;
    minLength?: number;
    size?: number;
    list?: string;
    form?: string;
    formAction?: string;
    formEncType?: string;
    formMethod?: string;
    formNoValidate?: boolean;
    formTarget?: string;
    inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
    enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';
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
 * Link element attributes
 */
export interface LinkHTMLAttributes extends HTMLAttributes<HTMLLinkElement> {
    rel?: string;
    href?: string;
    as?: string;
    type?: string;
    media?: string;
    sizes?: string;
    crossOrigin?: 'anonymous' | 'use-credentials' | '';
    integrity?: string;
    referrerPolicy?: string;
    title?: string;
    disabled?: boolean;
}
/**
 * Meta element attributes
 */
export interface MetaHTMLAttributes extends HTMLAttributes<HTMLMetaElement> {
    charSet?: string;
    content?: string;
    httpEquiv?: string;
    name?: string;
    property?: string;
}
/**
 * IFrame element attributes
 */
export interface IFrameHTMLAttributes extends HTMLAttributes<HTMLIFrameElement> {
    src?: string;
    srcDoc?: string;
    name?: string;
    sandbox?: string;
    allow?: string;
    loading?: 'eager' | 'lazy';
    referrerPolicy?: string;
    width?: number | string;
    height?: number | string;
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
    referrerPolicy?: string;
    sizes?: string;
}
/**
 * Source element attributes (for picture/video/audio)
 */
export interface SourceHTMLAttributes extends HTMLAttributes<HTMLSourceElement> {
    src?: string;
    srcSet?: string;
    sizes?: string;
    media?: string;
    type?: string;
    width?: number | string;
    height?: number | string;
}
/**
 * Script element attributes
 */
export interface ScriptHTMLAttributes extends HTMLAttributes<HTMLScriptElement> {
    src?: string;
    type?: string;
    async?: boolean;
    defer?: boolean;
    crossOrigin?: 'anonymous' | 'use-credentials';
    integrity?: string;
    noModule?: boolean;
    nonce?: string;
    referrerPolicy?: string;
    dangerouslySetInnerHTML?: {
        __html: string;
    };
}
/**
 * Label element attributes
 */
export interface LabelHTMLAttributes extends HTMLAttributes<HTMLLabelElement> {
    htmlFor?: string;
    form?: string;
}
/**
 * Table cell (th/td) element attributes
 */
export interface TableCellHTMLAttributes extends HTMLAttributes<HTMLTableCellElement> {
    colSpan?: number;
    rowSpan?: number;
    scope?: 'row' | 'col' | 'rowgroup' | 'colgroup';
    headers?: string;
    abbr?: string;
}
/**
 * Table caption element attributes
 */
export interface TableCaptionHTMLAttributes extends HTMLAttributes<HTMLTableCaptionElement> {
    align?: 'top' | 'bottom' | 'left' | 'right';
}
/**
 * Option element attributes
 */
export interface OptionHTMLAttributes extends HTMLAttributes<HTMLOptionElement> {
    value?: string | number;
    disabled?: boolean;
    selected?: boolean;
    label?: string;
}
/**
 * OptGroup element attributes
 */
export interface OptGroupHTMLAttributes extends HTMLAttributes<HTMLOptGroupElement> {
    disabled?: boolean;
    label?: string;
}
/**
 * SVG element attributes
 */
export interface SVGHTMLAttributes extends HTMLAttributes<SVGElement> {
    xmlns?: string;
    viewBox?: string;
    preserveAspectRatio?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number | string;
    strokeLinecap?: 'butt' | 'round' | 'square';
    strokeLinejoin?: 'miter' | 'round' | 'bevel';
    strokeDasharray?: string | number;
    strokeDashoffset?: string | number;
    width?: number | string;
    height?: number | string;
    x?: number | string;
    y?: number | string;
    textAnchor?: 'start' | 'middle' | 'end' | string;
    dy?: number | string;
    fontSize?: number | string;
    fontWeight?: number | string;
    cx?: number | string;
    cy?: number | string;
    r?: number | string;
    rx?: number | string;
    ry?: number | string;
    d?: string;
    transform?: string;
    opacity?: number | string;
    clipPath?: string;
    clipRule?: 'nonzero' | 'evenodd' | string;
    fillRule?: 'nonzero' | 'evenodd';
    fillOpacity?: number | string;
    strokeOpacity?: number | string;
    points?: string;
    x1?: number | string;
    y1?: number | string;
    x2?: number | string;
    y2?: number | string;
    xlinkHref?: string;
}
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
/**
 * Check if a value is a JSX element
 */
export declare function isJSXElement(value: unknown): value is JSXElement;
/**
 * Check if a value is a signal
 */
export declare function isSignal<T>(value: unknown): value is Signal<T>;
/**
 * Check if a value is a memo
 */
export declare function isMemo<T>(value: unknown): value is Memo<T>;
/**
 * Check if a value is an accessor (function)
 */
export declare function isAccessor<T>(value: MaybeAccessor<T>): value is Accessor<T>;
/**
 * Resolve a maybe accessor to its value
 */
export declare function resolveAccessor<T>(value: MaybeAccessor<T>): T;
declare global {
    namespace JSX {
        type Element = JSXElement;
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
            html: HTMLAttributes<HTMLHtmlElement>;
            head: HTMLAttributes<HTMLHeadElement>;
            body: HTMLAttributes<HTMLBodyElement>;
            div: HTMLAttributes<HTMLDivElement>;
            span: HTMLAttributes<HTMLSpanElement>;
            header: HTMLAttributes<HTMLElement>;
            footer: HTMLAttributes<HTMLElement>;
            main: HTMLAttributes<HTMLElement>;
            section: HTMLAttributes<HTMLElement>;
            article: HTMLAttributes<HTMLElement>;
            aside: HTMLAttributes<HTMLElement>;
            nav: HTMLAttributes<HTMLElement>;
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
            kbd: HTMLAttributes<HTMLElement>;
            em: HTMLAttributes<HTMLElement>;
            strong: HTMLAttributes<HTMLElement>;
            small: HTMLAttributes<HTMLElement>;
            mark: HTMLAttributes<HTMLElement>;
            abbr: HTMLAttributes<HTMLElement>;
            ul: HTMLAttributes<HTMLUListElement>;
            ol: HTMLAttributes<HTMLOListElement>;
            li: HTMLAttributes<HTMLLIElement>;
            dl: HTMLAttributes<HTMLDListElement>;
            dt: HTMLAttributes<HTMLElement>;
            dd: HTMLAttributes<HTMLElement>;
            form: FormHTMLAttributes;
            input: InputHTMLAttributes;
            button: ButtonHTMLAttributes;
            select: SelectHTMLAttributes;
            textarea: TextareaHTMLAttributes;
            label: LabelHTMLAttributes;
            fieldset: HTMLAttributes<HTMLFieldSetElement>;
            legend: HTMLAttributes<HTMLLegendElement>;
            option: OptionHTMLAttributes;
            optgroup: OptGroupHTMLAttributes;
            a: AnchorHTMLAttributes;
            details: HTMLAttributes<HTMLDetailsElement>;
            summary: HTMLAttributes<HTMLElement>;
            dialog: HTMLAttributes<HTMLDialogElement>;
            img: ImgHTMLAttributes;
            picture: HTMLAttributes<HTMLPictureElement>;
            source: SourceHTMLAttributes;
            video: HTMLAttributes<HTMLVideoElement>;
            audio: HTMLAttributes<HTMLAudioElement>;
            canvas: HTMLAttributes<HTMLCanvasElement>;
            table: HTMLAttributes<HTMLTableElement>;
            caption: TableCaptionHTMLAttributes;
            thead: HTMLAttributes<HTMLTableSectionElement>;
            tbody: HTMLAttributes<HTMLTableSectionElement>;
            tfoot: HTMLAttributes<HTMLTableSectionElement>;
            tr: HTMLAttributes<HTMLTableRowElement>;
            th: TableCellHTMLAttributes;
            td: TableCellHTMLAttributes;
            colgroup: HTMLAttributes<HTMLTableColElement>;
            col: HTMLAttributes<HTMLTableColElement>;
            br: HTMLAttributes<HTMLBRElement>;
            hr: HTMLAttributes<HTMLHRElement>;
            iframe: IFrameHTMLAttributes;
            script: ScriptHTMLAttributes;
            style: HTMLAttributes<HTMLStyleElement>;
            meta: MetaHTMLAttributes;
            link: LinkHTMLAttributes;
            title: HTMLAttributes<HTMLTitleElement>;
            svg: SVGHTMLAttributes;
            path: SVGHTMLAttributes;
            circle: SVGHTMLAttributes;
            rect: SVGHTMLAttributes;
            line: SVGHTMLAttributes;
            polyline: SVGHTMLAttributes;
            polygon: SVGHTMLAttributes;
            ellipse: SVGHTMLAttributes;
            g: SVGHTMLAttributes;
            defs: SVGHTMLAttributes;
            use: SVGHTMLAttributes;
            text: SVGHTMLAttributes;
            tspan: SVGHTMLAttributes;
        }
    }
}
export type IntrinsicElements = JSX.IntrinsicElements;
export type IntrinsicAttributes = JSX.IntrinsicAttributes;
//# sourceMappingURL=types.d.ts.map