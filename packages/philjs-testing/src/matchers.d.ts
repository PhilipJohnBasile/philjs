/**
 * PhilJS Testing - Custom Matchers
 *
 * Jest/Vitest compatible matchers for DOM testing
 */
export interface MatcherResult {
    pass: boolean;
    message: () => string;
}
/**
 * Check if element is in the document
 */
export declare function toBeInTheDocument(element: Element | null): MatcherResult;
/**
 * Check if element has specific text content
 */
export declare function toHaveTextContent(element: Element | null, expectedText: string | RegExp): MatcherResult;
/**
 * Check if element is visible
 */
export declare function toBeVisible(element: Element | null): MatcherResult;
/**
 * Check if element is disabled
 */
export declare function toBeDisabled(element: Element | null): MatcherResult;
/**
 * Check if element is enabled
 */
export declare function toBeEnabled(element: Element | null): MatcherResult;
/**
 * Check if element has specific attribute
 */
export declare function toHaveAttribute(element: Element | null, attribute: string, value?: string): MatcherResult;
/**
 * Check if element has specific class
 */
export declare function toHaveClass(element: Element | null, ...classNames: string[]): MatcherResult;
/**
 * Check if element has specific style
 */
export declare function toHaveStyle(element: Element | null, styles: Record<string, string>): MatcherResult;
/**
 * Check if element has focus
 */
export declare function toHaveFocus(element: Element | null): MatcherResult;
/**
 * Check if form element has specific value
 */
export declare function toHaveValue(element: Element | null, expectedValue: string | string[] | number): MatcherResult;
/**
 * Check if checkbox/radio is checked
 */
export declare function toBeChecked(element: Element | null): MatcherResult;
/**
 * Check if element is empty
 */
export declare function toBeEmptyDOMElement(element: Element | null): MatcherResult;
//# sourceMappingURL=matchers.d.ts.map