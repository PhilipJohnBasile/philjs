/**
 * Tagged Template Literals for PhilJS - 2026 Standard Alternative to JSX
 *
 * Why tagged templates over JSX:
 * - No build step required (works in vanilla browsers)
 * - Native JavaScript syntax
 * - Better tree-shaking
 * - Smaller bundle size
 * - Works with import maps (no transpiler)
 *
 * @example
 * ```ts
 * import { html, signal } from '@philjs/core';
 *
 * const count = signal(0);
 *
 * const Counter = () => html`
 *   <div class="counter">
 *     <span>Count: ${count}</span>
 *     <button @click=${() => count.set(c => c + 1)}>+</button>
 *   </div>
 * `;
 * ```
 */
import type { Signal, Memo } from './types.js';
export interface TemplateResult {
    readonly _$philTemplate: true;
    readonly strings: TemplateStringsArray;
    readonly values: readonly unknown[];
}
export interface Directive {
    readonly _$philDirective: true;
    readonly update: (element: Element, part: Part) => void;
}
export type Part = {
    type: 'attribute';
    name: string;
    element: Element;
} | {
    type: 'property';
    name: string;
    element: Element;
} | {
    type: 'event';
    name: string;
    element: Element;
} | {
    type: 'boolean';
    name: string;
    element: Element;
} | {
    type: 'child';
    parent: Node;
    marker: Comment;
};
type Renderable = string | number | boolean | null | undefined | TemplateResult | Node | Renderable[] | Signal<unknown> | Memo<unknown>;
/**
 * Tagged template literal for creating reactive HTML templates.
 *
 * Supports:
 * - Reactive signals: ${count} auto-updates when signal changes
 * - Event handlers: @click=${handler} or onclick=${handler}
 * - Properties: .value=${val} sets property instead of attribute
 * - Booleans: ?disabled=${isDisabled} toggles attribute
 * - Arrays: ${items.map(i => html`<li>${i}</li>`)}
 * - Nested templates: ${html`<span>nested</span>`}
 *
 * @example
 * ```ts
 * const name = signal('World');
 * const template = html`<h1>Hello, ${name}!</h1>`;
 * ```
 */
export declare function html(strings: TemplateStringsArray, ...values: unknown[]): TemplateResult;
/**
 * SVG tagged template for creating reactive SVG elements.
 * Uses SVG namespace for proper element creation.
 */
export declare function svg(strings: TemplateStringsArray, ...values: unknown[]): TemplateResult;
/**
 * Render a template result into a container.
 *
 * @example
 * ```ts
 * const app = html`<div>Hello World</div>`;
 * render(app, document.getElementById('root'));
 * ```
 */
export declare function render(result: TemplateResult | Renderable, container: Element | DocumentFragment): void;
/**
 * Repeat directive for efficient list rendering with keyed updates.
 *
 * @example
 * ```ts
 * const items = signal([{ id: 1, name: 'A' }, { id: 2, name: 'B' }]);
 *
 * html`
 *   <ul>
 *     ${repeat(items, item => item.id, item => html`<li>${item.name}</li>`)}
 *   </ul>
 * `;
 * ```
 */
export declare function repeat<T>(items: T[] | Signal<T[]>, keyFn: (item: T, index: number) => unknown, template: (item: T, index: number) => TemplateResult): TemplateResult[];
/**
 * Conditional rendering directive.
 *
 * @example
 * ```ts
 * const show = signal(true);
 *
 * html`
 *   ${when(show,
 *     () => html`<div>Visible</div>`,
 *     () => html`<div>Hidden</div>`
 *   )}
 * `;
 * ```
 */
export declare function when<T, F>(condition: boolean | Signal<boolean>, trueCase: () => T, falseCase?: () => F): T | F | null;
/**
 * Cache a template result to avoid re-rendering unchanged content.
 *
 * @example
 * ```ts
 * const expensive = cache(() => html`<div>${heavyComputation()}</div>`);
 * ```
 */
export declare function cache<T>(fn: () => T): T;
/**
 * Unsafe HTML injection (use with caution - XSS risk!).
 * Only use with trusted content.
 *
 * @example
 * ```ts
 * const trustedHtml = unsafeHTML(sanitizedHtmlString);
 * html`<div>${trustedHtml}</div>`;
 * ```
 */
export declare function unsafeHTML(html: string): Node[];
/**
 * Async directive for handling promises.
 *
 * @example
 * ```ts
 * html`
 *   ${until(
 *     fetchData(),
 *     html`<div>Loading...</div>`
 *   )}
 * `;
 * ```
 */
export declare function until<T>(promise: Promise<T>, placeholder?: TemplateResult): TemplateResult | Promise<T>;
/**
 * CSS tagged template for scoped styles with CSSStyleSheet adoption.
 * Uses Constructable Stylesheets when available.
 *
 * @example
 * ```ts
 * const styles = css`
 *   :host {
 *     display: block;
 *   }
 *   .button {
 *     background: blue;
 *   }
 * `;
 * ```
 */
export declare function css(strings: TemplateStringsArray, ...values: unknown[]): CSSStyleSheet;
export {};
//# sourceMappingURL=html.d.ts.map