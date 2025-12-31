import type { Modifier, Position, Rect, DragItem } from '../types.js';
/**
 * Restricts movement to horizontal axis only.
 */
export declare const restrictToHorizontalAxis: Modifier;
/**
 * Restricts movement to vertical axis only.
 */
export declare const restrictToVerticalAxis: Modifier;
/**
 * Restricts movement to the first scrollable ancestor.
 */
export declare const restrictToFirstScrollableAncestor: Modifier;
/**
 * Restricts movement to the window/viewport boundaries.
 */
export declare const restrictToWindowEdges: Modifier;
/**
 * Restricts movement to parent element boundaries.
 */
export declare const restrictToParentElement: Modifier;
/**
 * Snaps movement to a grid.
 */
export declare function snapToGrid(gridSize: number): Modifier;
/**
 * Snaps movement to a custom grid with different x and y sizes.
 */
export declare function snapToCustomGrid(gridSizeX: number, gridSizeY: number): Modifier;
/**
 * Snaps to center of droppable containers.
 */
export declare function snapCenterToContainer(droppableRects: Map<string, Rect>, threshold?: number): Modifier;
/**
 * Scales the movement by a factor.
 */
export declare function scaleMovement(scale: number): Modifier;
/**
 * Inverts the movement direction.
 */
export declare const invertMovement: Modifier;
/**
 * Adds momentum/inertia to movement.
 */
export declare function addMomentum(momentum?: number): Modifier;
/**
 * Applies easing to movement.
 */
export declare function applyEasing(easing?: (t: number) => number, maxDistance?: number): Modifier;
/**
 * Creates a modifier that only applies based on a condition.
 */
export declare function conditionalModifier(condition: (args: {
    transform: Position;
    active: DragItem;
    activeRect: Rect | null;
    containerRect: Rect | null;
}) => boolean, modifier: Modifier): Modifier;
/**
 * Creates a modifier that applies only for specific item types.
 */
export declare function typeBasedModifier(types: string[], modifier: Modifier): Modifier;
/**
 * Combines multiple modifiers into one.
 */
export declare function composeModifiers(...modifiers: Modifier[]): Modifier;
/**
 * Clamps a value between min and max.
 */
export declare function clamp(value: number, min: number, max: number): number;
/**
 * Creates a bounding box modifier.
 */
export declare function createBoundingBox(bounds: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
}): Modifier;
//# sourceMappingURL=modifiers.d.ts.map