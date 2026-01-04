/**
 * PhilJS Testing - Vitest Setup
 *
 * Setup file for Vitest test runner.
 * Import this in your vitest.config.ts setupFiles array.
 */
import { afterEach, expect } from 'vitest';
import { cleanup } from './render.js';
import { cleanupHooks } from './hooks.js';
import * as matchers from './matchers.js';
/**
 * Auto-cleanup after each test
 */
afterEach(() => {
    cleanup();
    cleanupHooks();
});
/**
 * Extend Vitest matchers with PhilJS-specific assertions
 */
if (expect && typeof expect.extend === 'function') {
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
if (typeof global !== 'undefined' && !global.ResizeObserver) {
    // Mock ResizeObserver
    global.ResizeObserver = class ResizeObserver {
        observe() { }
        unobserve() { }
        disconnect() { }
    };
}
if (typeof global !== 'undefined' && !global.IntersectionObserver) {
    // Mock IntersectionObserver
    global.IntersectionObserver = class IntersectionObserver {
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
if (typeof global !== 'undefined' && !global.DataTransfer) {
    class DataTransferItemList {
        files;
        constructor(files) {
            this.files = files;
        }
        add(file) {
            this.files.push(file);
            return file;
        }
        remove(index) {
            this.files.splice(index, 1);
        }
        clear() {
            this.files.length = 0;
        }
        get length() {
            return this.files.length;
        }
        [Symbol.iterator]() {
            return this.files[Symbol.iterator]();
        }
    }
    class DataTransfer {
        filesInternal = [];
        data = new Map();
        items = new DataTransferItemList(this.filesInternal);
        get files() {
            return this.filesInternal;
        }
        setData(type, value) {
            this.data.set(type, value);
        }
        getData(type) {
            return this.data.get(type) ?? "";
        }
        clearData(type) {
            if (type) {
                this.data.delete(type);
            }
            else {
                this.data.clear();
            }
        }
    }
    global.DataTransfer = DataTransfer;
}
if (typeof global !== 'undefined' && !global.ClipboardEvent) {
    class ClipboardEvent extends Event {
        clipboardData;
        constructor(type, init = {}) {
            super(type, init);
            this.clipboardData = init.clipboardData ?? null;
        }
    }
    global.ClipboardEvent = ClipboardEvent;
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
export { 
// Re-export everything for convenience
render, cleanup, screen, within, fireEvent, userEvent, user, setup, renderHook, act, waitFor, waitForElementToBeRemoved, findByRole, findByText, waitForLoadingToFinish, waitForNetworkIdle, delay, createMockSignal, createMockComputed, waitForSignal, waitForSignalValue, debug, logDOM, prettyDOM, } from './index.js';
//# sourceMappingURL=vitest.js.map