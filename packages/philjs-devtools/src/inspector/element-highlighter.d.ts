/**
 * Element Highlighter - Visual overlay for highlighting DOM elements
 */
export interface HighlightOptions {
    color?: string;
    borderColor?: string;
    labelBackground?: string;
    showDimensions?: boolean;
    showMargin?: boolean;
    showPadding?: boolean;
}
export declare class ElementHighlighter {
    private overlay;
    private marginOverlay;
    private paddingOverlay;
    private label;
    private dimensionsLabel;
    private options;
    private currentElement;
    private animationFrame;
    constructor(options?: HighlightOptions);
    private createOverlays;
    highlight(element: HTMLElement, label?: string): void;
    private updatePosition;
    private startTracking;
    hide(): void;
    updateOptions(options: Partial<HighlightOptions>): void;
    setColor(color: string, borderColor?: string): void;
    flash(element: HTMLElement, color?: string): void;
    destroy(): void;
    isHighlighting(): boolean;
    getCurrentElement(): HTMLElement | null;
}
//# sourceMappingURL=element-highlighter.d.ts.map