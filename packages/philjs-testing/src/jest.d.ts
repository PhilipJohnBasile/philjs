/**
 * PhilJS Testing - Jest Setup
 *
 * Setup file for Jest test runner.
 * Import this in your setupFilesAfterEnv array in jest.config.js
 */
/**
 * Extend Jest matchers type definitions
 */
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeInTheDocument(): R;
            toHaveTextContent(text: string | RegExp): R;
            toBeVisible(): R;
            toBeDisabled(): R;
            toBeEnabled(): R;
            toHaveAttribute(attr: string, value?: string | RegExp): R;
            toHaveClass(...classNames: string[]): R;
            toHaveStyle(style: string | Record<string, any>): R;
            toHaveFocus(): R;
            toHaveValue(value: string | number): R;
            toBeChecked(): R;
            toBeEmptyDOMElement(): R;
        }
    }
}
export { render, cleanup, screen, within, fireEvent, userEvent, user, setup, renderHook, act, waitFor, waitForElementToBeRemoved, findByRole, findByText, waitForLoadingToFinish, waitForNetworkIdle, delay, createMockSignal, createMockComputed, waitForSignal, waitForSignalValue, debug, logDOM, prettyDOM, } from './index.js';
//# sourceMappingURL=jest.d.ts.map