/**
 * PhilJS Testing - User Event Simulation
 *
 * High-level user interaction simulation similar to @testing-library/user-event
 */
export interface UserEventOptions {
    delay?: number;
    skipHover?: boolean;
    skipClick?: boolean;
}
export interface TypeOptions extends UserEventOptions {
    skipAutoClose?: boolean;
    initialSelectionStart?: number;
    initialSelectionEnd?: number;
}
/**
 * Create a user event instance
 */
export declare function userEvent(options?: UserEventOptions): {
    /**
     * Click an element
     */
    click(element: Element): Promise<void>;
    /**
     * Double click an element
     */
    dblClick(element: Element): Promise<void>;
    /**
     * Triple click an element (selects all text)
     */
    tripleClick(element: Element): Promise<void>;
    /**
     * Type text into an element
     */
    type(element: Element, text: string, typeOptions?: TypeOptions): Promise<void>;
    /**
     * Clear an input element
     */
    clear(element: Element): Promise<void>;
    /**
     * Select options in a select element
     */
    selectOptions(element: Element, values: string | string[]): Promise<void>;
    /**
     * Deselect options in a multi-select
     */
    deselectOptions(element: Element, values: string | string[]): Promise<void>;
    /**
     * Upload files to a file input
     */
    upload(element: Element, files: File | File[]): Promise<void>;
    /**
     * Hover over an element
     */
    hover(element: Element): Promise<void>;
    /**
     * Unhover from an element
     */
    unhover(element: Element): Promise<void>;
    /**
     * Tab to next focusable element
     */
    tab(options?: {
        shift?: boolean;
    }): Promise<void>;
    /**
     * Simulate keyboard input
     */
    keyboard(text: string): Promise<void>;
    /**
     * Copy selected text
     */
    copy(): Promise<void>;
    /**
     * Cut selected text
     */
    cut(): Promise<void>;
    /**
     * Paste text
     */
    paste(text?: string): Promise<void>;
    /**
     * Pointer events
     */
    pointer(actions: PointerAction | PointerAction[]): Promise<void>;
};
/**
 * Pointer action configuration
 */
interface PointerAction {
    target?: Element;
    keys?: string;
    pointerId?: number;
    pointerType?: 'mouse' | 'pen' | 'touch';
    button?: number;
    coords?: {
        x: number;
        y: number;
    };
}
/**
 * Default user event instance
 */
export declare const user: {
    /**
     * Click an element
     */
    click(element: Element): Promise<void>;
    /**
     * Double click an element
     */
    dblClick(element: Element): Promise<void>;
    /**
     * Triple click an element (selects all text)
     */
    tripleClick(element: Element): Promise<void>;
    /**
     * Type text into an element
     */
    type(element: Element, text: string, typeOptions?: TypeOptions): Promise<void>;
    /**
     * Clear an input element
     */
    clear(element: Element): Promise<void>;
    /**
     * Select options in a select element
     */
    selectOptions(element: Element, values: string | string[]): Promise<void>;
    /**
     * Deselect options in a multi-select
     */
    deselectOptions(element: Element, values: string | string[]): Promise<void>;
    /**
     * Upload files to a file input
     */
    upload(element: Element, files: File | File[]): Promise<void>;
    /**
     * Hover over an element
     */
    hover(element: Element): Promise<void>;
    /**
     * Unhover from an element
     */
    unhover(element: Element): Promise<void>;
    /**
     * Tab to next focusable element
     */
    tab(options?: {
        shift?: boolean;
    }): Promise<void>;
    /**
     * Simulate keyboard input
     */
    keyboard(text: string): Promise<void>;
    /**
     * Copy selected text
     */
    copy(): Promise<void>;
    /**
     * Cut selected text
     */
    cut(): Promise<void>;
    /**
     * Paste text
     */
    paste(text?: string): Promise<void>;
    /**
     * Pointer events
     */
    pointer(actions: PointerAction | PointerAction[]): Promise<void>;
};
/**
 * Setup function for creating custom user event instances
 */
export declare function setup(options?: UserEventOptions): ReturnType<typeof userEvent>;
export {};
//# sourceMappingURL=user-event.d.ts.map