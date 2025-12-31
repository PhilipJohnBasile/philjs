/**
 * PhilJS Testing - Vitest Setup
 *
 * Setup file for Vitest test runner.
 * Import this in your vitest.config.ts setupFiles array.
 */
/**
 * Extend Vitest type definitions
 */
declare module 'vitest' {
    interface Assertion<T = any> {
        toBeInTheDocument(): T;
        toHaveTextContent(text: string | RegExp): T;
        toBeVisible(): T;
        toBeDisabled(): T;
        toBeEnabled(): T;
        toHaveAttribute(attr: string, value?: string | RegExp): T;
        toHaveClass(...classNames: string[]): T;
        toHaveStyle(style: string | Record<string, any>): T;
        toHaveFocus(): T;
        toHaveValue(value: string | number): T;
        toBeChecked(): T;
        toBeEmptyDOMElement(): T;
    }
    interface AsymmetricMatchersContaining {
        toBeInTheDocument(): any;
        toHaveTextContent(text: string | RegExp): any;
        toBeVisible(): any;
        toBeDisabled(): any;
        toBeEnabled(): any;
        toHaveAttribute(attr: string, value?: string | RegExp): any;
        toHaveClass(...classNames: string[]): any;
        toHaveStyle(style: string | Record<string, any>): any;
        toHaveFocus(): any;
        toHaveValue(value: string | number): any;
        toBeChecked(): any;
        toBeEmptyDOMElement(): any;
    }
}
export { render, cleanup, screen, within, fireEvent, userEvent, user, setup, renderHook, act, waitFor, waitForElementToBeRemoved, findByRole, findByText, waitForLoadingToFinish, waitForNetworkIdle, delay, createMockSignal, createMockComputed, waitForSignal, waitForSignalValue, debug, logDOM, prettyDOM, } from './index.js';
//# sourceMappingURL=vitest.d.ts.map