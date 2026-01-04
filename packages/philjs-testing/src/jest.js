/**
 * PhilJS Testing - Jest Setup
 *
 * Setup file for Jest test runner.
 * Import this in your setupFilesAfterEnv array in jest.config.js
 */
import { cleanup } from './render.js';
import { cleanupHooks } from './hooks.js';
import * as matchers from './matchers.js';
/**
 * Auto-cleanup after each test
 */
if (typeof afterEach !== 'undefined' && afterEach) {
    afterEach(() => {
        cleanup();
        cleanupHooks();
    });
}
/**
 * Extend Jest matchers with PhilJS-specific assertions
 */
if (typeof expect !== 'undefined' && expect && expect.extend) {
    expect.extend({
        toBeInTheDocument: matchers.toBeInTheDocument,
        toHaveTextContent: matchers.toHaveTextContent,
        toBeVisible: matchers.toBeVisible,
        toBeDisabled: matchers.toBeDisabled,
        toBeEnabled: matchers.toBeEnabled,
        toHaveAttribute: matchers.toHaveAttribute,
        toHaveClass: matchers.toHaveClass,
        toHaveStyle: matchers.toHaveStyle,
        toHaveFocus: matchers.toHaveFocus,
        toHaveValue: matchers.toHaveValue,
        toBeChecked: matchers.toBeChecked,
        toBeEmptyDOMElement: matchers.toBeEmptyDOMElement,
    });
}
/**
 * Setup jsdom environment
 */
if (typeof global !== 'undefined') {
    // Mock ResizeObserver (TS4111: bracket notation, TS2375: conditional assignment)
    if (!global['ResizeObserver']) {
        global['ResizeObserver'] = class ResizeObserver {
            observe() { }
            unobserve() { }
            disconnect() { }
        };
    }
    // Mock IntersectionObserver (TS4111: bracket notation, TS2375: conditional assignment)
    if (!global['IntersectionObserver']) {
        global['IntersectionObserver'] = class IntersectionObserver {
            constructor() { }
            observe() { }
            unobserve() { }
            disconnect() { }
            takeRecords() {
                return [];
            }
            root = null;
            rootMargin = '';
            thresholds = [];
        };
    }
    // Mock window.matchMedia
    if (typeof window !== 'undefined' && !window.matchMedia) {
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: (query) => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: () => { },
                removeListener: () => { },
                addEventListener: () => { },
                removeEventListener: () => { },
                dispatchEvent: () => true,
            }),
        });
    }
    // Mock window.scrollTo (TS2532: non-null assertion after typeof check)
    if (typeof window !== 'undefined' && !window.scrollTo) {
        window.scrollTo = () => { };
    }
    // Mock HTMLElement.prototype.scrollIntoView
    if (typeof HTMLElement !== 'undefined' && !HTMLElement.prototype.scrollIntoView) {
        HTMLElement.prototype.scrollIntoView = () => { };
    }
}
export { 
// Re-export everything for convenience
render, cleanup, screen, within, fireEvent, userEvent, user, setup, renderHook, act, waitFor, waitForElementToBeRemoved, findByRole, findByText, waitForLoadingToFinish, waitForNetworkIdle, delay, createMockSignal, createMockComputed, waitForSignal, waitForSignalValue, debug, logDOM, prettyDOM, } from './index.js';
//# sourceMappingURL=jest.js.map