/**
 * HTML Directives - Alpine.js-style reactive attributes
 *
 * SECURITY NOTE: This module evaluates expressions from HTML attributes using
 * new Function() for Alpine.js-style reactivity. This is intentional and follows
 * the Alpine.js security model.
 *
 * IMPORTANT SECURITY CONSIDERATIONS:
 * 1. NEVER render user-controlled content in x-data, x-on, or other expression attributes
 * 2. The x-html directive is intentionally unsafe (like v-html in Vue) - sanitize content first
 * 3. Only use these directives with trusted HTML templates, not user-generated content
 * 4. For user content, use x-text which safely escapes HTML
 *
 * If you're building an application that renders untrusted HTML, use a CSP policy
 * that blocks 'unsafe-eval' and avoid using this module entirely.
 */
export type DirectiveHandler = (el: HTMLElement, expression: string, context: DirectiveContext) => void | (() => void);
export interface DirectiveContext {
    data: Record<string, any>;
    $el: HTMLElement;
    $refs: Record<string, HTMLElement>;
    $dispatch: (event: string, detail?: any) => void;
}
/**
 * Register a custom directive
 */
export declare function directive(name: string, handler: DirectiveHandler): void;
/**
 * Get a registered directive
 */
export declare function getDirective(name: string): DirectiveHandler | undefined;
/**
 * Process an element and its children for directives
 */
export declare function processElement(el: HTMLElement, context: DirectiveContext): void;
/**
 * Initialize HTML directives on the document
 */
export declare function initDirectives(root?: HTMLElement): void;
//# sourceMappingURL=directives.d.ts.map