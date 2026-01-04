/**
 * Canvas component for visual builder
 */
export interface CanvasProps {
    width?: number;
    height?: number;
    zoom?: number;
    pan?: {
        x: number;
        y: number;
    };
    grid?: boolean;
    rulers?: boolean;
    onZoom?: (zoom: number) => void;
    onPan?: (pan: {
        x: number;
        y: number;
    }) => void;
}
export interface CanvasState {
    zoom: number;
    pan: {
        x: number;
        y: number;
    };
    selectedNodes: string[];
}
export interface CanvasGridProps {
    size?: number;
    color?: string;
    visible?: boolean;
}
export interface CanvasRulersProps {
    horizontal?: boolean;
    vertical?: boolean;
    unit?: 'px' | 'rem' | '%';
}
export interface CanvasNodeProps {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    children?: unknown;
}
export declare function Canvas(_props: CanvasProps): HTMLElement;
export declare function CanvasGrid(_props: CanvasGridProps): HTMLElement;
export declare function CanvasRulers(_props: CanvasRulersProps): HTMLElement;
export declare function CanvasNode(_props: CanvasNodeProps): HTMLElement;
//# sourceMappingURL=Canvas.d.ts.map