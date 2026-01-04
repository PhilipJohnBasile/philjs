/**
 * PhilJS HTML - HTML-First Reactive Framework
 *
 * Provides HTMX and Alpine.js compatible attributes for building
 * reactive UIs with minimal JavaScript.
 *
 * @example
 * ```html
 * <!-- Alpine-style reactive data -->
 * <div x-data="{ count: 0 }">
 *   <span x-text="count"></span>
 *   <button x-on:click="count++">+</button>
 * </div>
 *
 * <!-- HTMX-style server interactions -->
 * <button hx-get="/api/data" hx-target="#result">
 *   Load Data
 * </button>
 * ```
 */
export * from './directives.js';
export * from './htmx.js';
export * from './alpine.js';
export * from './minimal.js';
export { init, PhilJSHTML } from './runtime.js';
//# sourceMappingURL=index.js.map