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
  from: { x: number; y: number };
  to: { x: number; y: number };
  visible?: boolean;
}

export interface GridSystemController {
  setGridSize: (size: number) => void;
  setSnapThreshold: (threshold: number) => void;
  enable: () => void;
  disable: () => void;
  snapToGrid: (x: number, y: number) => SnapResult;
}

export function GridSystem(_props: GridSystemProps): HTMLElement {
  return document.createElement('div');
}

export function GridPattern(_props: GridPatternProps): HTMLElement {
  return document.createElement('div');
}

export function SmartGuides(_props: SmartGuidesProps): HTMLElement {
  return document.createElement('div');
}

export function DistanceIndicator(_props: DistanceIndicatorProps): HTMLElement {
  return document.createElement('div');
}

export function createGridSystemController(options: GridSystemOptions): GridSystemController {
  return {
    setGridSize: () => {},
    setSnapThreshold: () => {},
    enable: () => {},
    disable: () => {},
    snapToGrid: (x, y) => ({ x, y, snapped: false, guides: [] }),
  };
}

export function snapToGrid(x: number, y: number, gridSize: number): { x: number; y: number } {
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize,
  };
}

export function shouldSnap(position: number, gridSize: number, threshold: number): boolean {
  const nearest = Math.round(position / gridSize) * gridSize;
  return Math.abs(position - nearest) <= threshold;
}

export function calculateSnap(
  x: number,
  y: number,
  options: GridSystemOptions
): SnapResult {
  const snappedX = snapToGrid(x, 0, options.gridSize).x;
  const snappedY = snapToGrid(0, y, options.gridSize).y;
  return {
    x: snappedX,
    y: snappedY,
    snapped: true,
    guides: [],
  };
}
