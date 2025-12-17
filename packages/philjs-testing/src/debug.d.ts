/**
 * PhilJS Testing - Debug Utilities
 */
/**
 * Pretty print a DOM element
 */
export declare function prettyDOM(element?: Element | null, maxLength?: number, options?: prettyFormat.OptionsReceived): string;
/**
 * Log DOM to console
 */
export declare function logDOM(element?: Element | null, maxLength?: number, options?: prettyFormat.OptionsReceived): void;
/**
 * Debug helper - logs container contents
 */
export declare function debug(element?: Element | null, maxLength?: number): void;
/**
 * Debug signals in the component
 */
export declare function debugSignals(element: Element): void;
/**
 * Debug accessibility tree
 */
export declare function debugA11y(element: Element): void;
/**
 * Debug form state
 */
export declare function debugForm(form: HTMLFormElement): void;
/**
 * Take a DOM snapshot
 */
export declare function snapshot(element?: Element): string;
/**
 * Compare DOM snapshots
 */
export declare function compareSnapshots(before: string, after: string): {
    changed: boolean;
    diff: string;
};
//# sourceMappingURL=debug.d.ts.map