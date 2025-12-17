/**
 * PhilJS Testing - Event Utilities
 */
export declare const fireEvent: import("@testing-library/dom").FireFunction & import("@testing-library/dom").FireObject;
export declare const createEvent: import("@testing-library/dom").CreateObject & import("@testing-library/dom").CreateFunction;
/**
 * Extended fireEvent with PhilJS-specific event handling
 */
export declare const fire: {
    /**
     * Fire input event with value change
     */
    inputValue(element: HTMLInputElement | HTMLTextAreaElement, value: string): void;
    /**
     * Fire change event with value
     */
    changeValue(element: HTMLElement, value: string): void;
    /**
     * Fire select change event
     */
    selectOption(element: HTMLSelectElement, value: string): void;
    /**
     * Fire checkbox toggle
     */
    toggleCheckbox(element: HTMLInputElement): void;
    /**
     * Fire form submission
     */
    submitForm(form: HTMLFormElement): void;
    /**
     * Fire keyboard events for a key sequence
     */
    type(element: HTMLElement, text: string): void;
    /**
     * Fire special key
     */
    pressKey(element: HTMLElement, key: string, options?: KeyboardEventInit): void;
    /**
     * Simulate Enter key press
     */
    pressEnter(element: HTMLElement): void;
    /**
     * Simulate Escape key press
     */
    pressEscape(element: HTMLElement): void;
    /**
     * Simulate Tab key press
     */
    pressTab(element: HTMLElement, shiftKey?: boolean): void;
    /**
     * Fire hover events
     */
    hover(element: HTMLElement): void;
    /**
     * Fire unhover events
     */
    unhover(element: HTMLElement): void;
    /**
     * Fire focus events
     */
    focus(element: HTMLElement): void;
    /**
     * Fire blur events
     */
    blur(element: HTMLElement): void;
    /**
     * Fire drag and drop sequence
     */
    dragAndDrop(source: HTMLElement, target: HTMLElement): void;
    click: (element: Document | Element | Window | Node, options?: {}) => boolean;
    abort: (element: Document | Element | Window | Node, options?: {}) => boolean;
    change: (element: Document | Element | Window | Node, options?: {}) => boolean;
    copy: (element: Document | Element | Window | Node, options?: {}) => boolean;
    cut: (element: Document | Element | Window | Node, options?: {}) => boolean;
    drag: (element: Document | Element | Window | Node, options?: {}) => boolean;
    drop: (element: Document | Element | Window | Node, options?: {}) => boolean;
    emptied: (element: Document | Element | Window | Node, options?: {}) => boolean;
    ended: (element: Document | Element | Window | Node, options?: {}) => boolean;
    error: (element: Document | Element | Window | Node, options?: {}) => boolean;
    input: (element: Document | Element | Window | Node, options?: {}) => boolean;
    invalid: (element: Document | Element | Window | Node, options?: {}) => boolean;
    load: (element: Document | Element | Window | Node, options?: {}) => boolean;
    paste: (element: Document | Element | Window | Node, options?: {}) => boolean;
    pause: (element: Document | Element | Window | Node, options?: {}) => boolean;
    play: (element: Document | Element | Window | Node, options?: {}) => boolean;
    playing: (element: Document | Element | Window | Node, options?: {}) => boolean;
    progress: (element: Document | Element | Window | Node, options?: {}) => boolean;
    reset: (element: Document | Element | Window | Node, options?: {}) => boolean;
    resize: (element: Document | Element | Window | Node, options?: {}) => boolean;
    scroll: (element: Document | Element | Window | Node, options?: {}) => boolean;
    seeked: (element: Document | Element | Window | Node, options?: {}) => boolean;
    seeking: (element: Document | Element | Window | Node, options?: {}) => boolean;
    select: (element: Document | Element | Window | Node, options?: {}) => boolean;
    stalled: (element: Document | Element | Window | Node, options?: {}) => boolean;
    submit: (element: Document | Element | Window | Node, options?: {}) => boolean;
    suspend: (element: Document | Element | Window | Node, options?: {}) => boolean;
    waiting: (element: Document | Element | Window | Node, options?: {}) => boolean;
    wheel: (element: Document | Element | Window | Node, options?: {}) => boolean;
    offline: (element: Document | Element | Window | Node, options?: {}) => boolean;
    online: (element: Document | Element | Window | Node, options?: {}) => boolean;
    encrypted: (element: Document | Element | Window | Node, options?: {}) => boolean;
    compositionEnd: (element: Document | Element | Window | Node, options?: {}) => boolean;
    compositionStart: (element: Document | Element | Window | Node, options?: {}) => boolean;
    compositionUpdate: (element: Document | Element | Window | Node, options?: {}) => boolean;
    keyDown: (element: Document | Element | Window | Node, options?: {}) => boolean;
    keyPress: (element: Document | Element | Window | Node, options?: {}) => boolean;
    keyUp: (element: Document | Element | Window | Node, options?: {}) => boolean;
    focusIn: (element: Document | Element | Window | Node, options?: {}) => boolean;
    focusOut: (element: Document | Element | Window | Node, options?: {}) => boolean;
    contextMenu: (element: Document | Element | Window | Node, options?: {}) => boolean;
    dblClick: (element: Document | Element | Window | Node, options?: {}) => boolean;
    dragEnd: (element: Document | Element | Window | Node, options?: {}) => boolean;
    dragEnter: (element: Document | Element | Window | Node, options?: {}) => boolean;
    dragExit: (element: Document | Element | Window | Node, options?: {}) => boolean;
    dragLeave: (element: Document | Element | Window | Node, options?: {}) => boolean;
    dragOver: (element: Document | Element | Window | Node, options?: {}) => boolean;
    dragStart: (element: Document | Element | Window | Node, options?: {}) => boolean;
    mouseDown: (element: Document | Element | Window | Node, options?: {}) => boolean;
    mouseEnter: (element: Document | Element | Window | Node, options?: {}) => boolean;
    mouseLeave: (element: Document | Element | Window | Node, options?: {}) => boolean;
    mouseMove: (element: Document | Element | Window | Node, options?: {}) => boolean;
    mouseOut: (element: Document | Element | Window | Node, options?: {}) => boolean;
    mouseOver: (element: Document | Element | Window | Node, options?: {}) => boolean;
    mouseUp: (element: Document | Element | Window | Node, options?: {}) => boolean;
    popState: (element: Document | Element | Window | Node, options?: {}) => boolean;
    touchCancel: (element: Document | Element | Window | Node, options?: {}) => boolean;
    touchEnd: (element: Document | Element | Window | Node, options?: {}) => boolean;
    touchMove: (element: Document | Element | Window | Node, options?: {}) => boolean;
    touchStart: (element: Document | Element | Window | Node, options?: {}) => boolean;
    canPlay: (element: Document | Element | Window | Node, options?: {}) => boolean;
    canPlayThrough: (element: Document | Element | Window | Node, options?: {}) => boolean;
    durationChange: (element: Document | Element | Window | Node, options?: {}) => boolean;
    loadedData: (element: Document | Element | Window | Node, options?: {}) => boolean;
    loadedMetadata: (element: Document | Element | Window | Node, options?: {}) => boolean;
    loadStart: (element: Document | Element | Window | Node, options?: {}) => boolean;
    rateChange: (element: Document | Element | Window | Node, options?: {}) => boolean;
    timeUpdate: (element: Document | Element | Window | Node, options?: {}) => boolean;
    volumeChange: (element: Document | Element | Window | Node, options?: {}) => boolean;
    animationStart: (element: Document | Element | Window | Node, options?: {}) => boolean;
    animationEnd: (element: Document | Element | Window | Node, options?: {}) => boolean;
    animationIteration: (element: Document | Element | Window | Node, options?: {}) => boolean;
    transitionCancel: (element: Document | Element | Window | Node, options?: {}) => boolean;
    transitionEnd: (element: Document | Element | Window | Node, options?: {}) => boolean;
    transitionRun: (element: Document | Element | Window | Node, options?: {}) => boolean;
    transitionStart: (element: Document | Element | Window | Node, options?: {}) => boolean;
    doubleClick: (element: Document | Element | Window | Node, options?: {}) => boolean;
    pointerOver: (element: Document | Element | Window | Node, options?: {}) => boolean;
    pointerEnter: (element: Document | Element | Window | Node, options?: {}) => boolean;
    pointerDown: (element: Document | Element | Window | Node, options?: {}) => boolean;
    pointerMove: (element: Document | Element | Window | Node, options?: {}) => boolean;
    pointerUp: (element: Document | Element | Window | Node, options?: {}) => boolean;
    pointerCancel: (element: Document | Element | Window | Node, options?: {}) => boolean;
    pointerOut: (element: Document | Element | Window | Node, options?: {}) => boolean;
    pointerLeave: (element: Document | Element | Window | Node, options?: {}) => boolean;
    gotPointerCapture: (element: Document | Element | Window | Node, options?: {}) => boolean;
    lostPointerCapture: (element: Document | Element | Window | Node, options?: {}) => boolean;
    pageHide: (element: Document | Element | Window | Node, options?: {}) => boolean;
    pageShow: (element: Document | Element | Window | Node, options?: {}) => boolean;
};
//# sourceMappingURL=events.d.ts.map