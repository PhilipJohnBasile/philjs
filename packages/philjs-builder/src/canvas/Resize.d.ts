/**
 * Resize components for canvas
 */
export interface ResizeHandlesProps {
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    onResize?: (handle: string, delta: {
        x: number;
        y: number;
    }) => void;
}
export interface ResizePreviewProps {
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    visible?: boolean;
}
export interface ResizeManagerProps {
    minWidth?: number;
    minHeight?: number;
    aspectRatio?: number;
    onResizeStart?: () => void;
    onResizeEnd?: () => void;
}
export interface KeyboardResizeOptions {
    step?: number;
    shiftStep?: number;
    enabled?: boolean;
}
export declare function ResizeHandles(_props: ResizeHandlesProps): HTMLElement;
export declare function ResizePreview(_props: ResizePreviewProps): HTMLElement;
export declare function ResizeManager(_props: ResizeManagerProps): HTMLElement;
export declare function useKeyboardResize(_options: KeyboardResizeOptions): {
    handleKeyDown: (e: KeyboardEvent) => void;
};
//# sourceMappingURL=Resize.d.ts.map