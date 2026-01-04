/**
 * Selection components for canvas
 */
export interface SelectionBoxProps {
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    visible?: boolean;
}
export interface HoverHighlightProps {
    element: HTMLElement | null;
    color?: string;
}
export interface MarqueeSelectionProps {
    start: {
        x: number;
        y: number;
    };
    end: {
        x: number;
        y: number;
    };
    visible?: boolean;
}
export interface SelectionOverlayProps {
    selectedIds: string[];
    onSelect?: (id: string) => void;
    onDeselect?: (id: string) => void;
}
export interface SelectionManagerProps {
    multiSelect?: boolean;
    onSelectionChange?: (ids: string[]) => void;
}
export declare function SelectionBox(_props: SelectionBoxProps): HTMLElement;
export declare function HoverHighlight(_props: HoverHighlightProps): HTMLElement;
export declare function MarqueeSelection(_props: MarqueeSelectionProps): HTMLElement;
export declare function SelectionOverlay(_props: SelectionOverlayProps): HTMLElement;
export declare function SelectionManager(_props: SelectionManagerProps): HTMLElement;
//# sourceMappingURL=Selection.d.ts.map