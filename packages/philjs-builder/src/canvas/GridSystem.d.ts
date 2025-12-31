/**
 * Grid system for canvas alignment
 */
export interface GridSystemProps {
    gridSize?: number;
    snapThreshold?: number;
    showGuides?: boolean;
}
export interface SnapGuide {
    type: 'horizontal' | 'vertical';
    position: number;
    source: string;
}
export interface SnapResult {
    x: number;
    y: number;
    snapped: boolean;
    guides: SnapGuide[];
}
export interface AlignmentLine {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    type: 'horizontal' | 'vertical';
}
export interface GridSystemOptions {
    gridSize: number;
    snapThreshold: number;
    enabled: boolean;
}
export interface GridPatternProps {
    size: number;
    color?: string;
    opacity?: number;
}
export interface SmartGuidesProps {
    guides: SnapGuide[];
    visible?: boolean;
}
export interface DistanceIndicatorProps {
    from: {
        x: number;
        y: number;
    };
    to: {
        x: number;
        y: number;
    };
    visible?: boolean;
}
export interface GridSystemController {
    setGridSize: (size: number) => void;
    setSnapThreshold: (threshold: number) => void;
    enable: () => void;
    disable: () => void;
    snapToGrid: (x: number, y: number) => SnapResult;
}
export declare function GridSystem(_props: GridSystemProps): HTMLElement;
export declare function GridPattern(_props: GridPatternProps): HTMLElement;
export declare function SmartGuides(_props: SmartGuidesProps): HTMLElement;
export declare function DistanceIndicator(_props: DistanceIndicatorProps): HTMLElement;
export declare function createGridSystemController(options: GridSystemOptions): GridSystemController;
export declare function snapToGrid(x: number, y: number, gridSize: number): {
    x: number;
    y: number;
};
export declare function shouldSnap(position: number, gridSize: number, threshold: number): boolean;
export declare function calculateSnap(x: number, y: number, options: GridSystemOptions): SnapResult;
//# sourceMappingURL=GridSystem.d.ts.map