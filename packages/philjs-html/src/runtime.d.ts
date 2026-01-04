/**
 * PhilJS HTML Runtime
 *
 * Main entry point that combines all features.
 */
import { configure as configureHtmx, type HtmxConfig } from './htmx.js';
import { initAlpine, store, data, bind } from './alpine.js';
export interface PhilJSHTMLConfig {
    /** Enable Alpine.js directives */
    alpine: boolean;
    /** Enable HTMX compatibility */
    htmx: boolean;
    /** Use minimal runtime */
    minimal: boolean;
    /** HTMX configuration */
    htmxConfig?: Partial<HtmxConfig>;
    /** Auto-initialize on DOMContentLoaded */
    autoInit: boolean;
    /** Root element to process */
    root?: HTMLElement;
}
/**
 * Initialize PhilJS HTML
 */
export declare function init(config?: Partial<PhilJSHTMLConfig>): void;
/**
 * Main API object
 */
export declare const PhilJSHTML: {
    init: typeof init;
    Alpine: {
        data: typeof data;
        store: typeof store;
        bind: typeof bind;
        start: typeof initAlpine;
        directive: typeof import("./directives.js").directive;
    };
    store: typeof store;
    data: typeof data;
    bind: typeof bind;
    configureHtmx: typeof configureHtmx;
};
export default PhilJSHTML;
//# sourceMappingURL=runtime.d.ts.map