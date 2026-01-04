import type { CollisionDetection, Rect } from '../types.js';
declare function getRect(rect: Rect): Rect;
declare function getCenter(rect: Rect): {
    x: number;
    y: number;
};
declare function getDistance(point1: {
    x: number;
    y: number;
}, point2: {
    x: number;
    y: number;
}): number;
declare function getArea(rect: Rect): number;
declare function getIntersectionArea(rect1: Rect, rect2: Rect): number;
declare function rectsIntersect(rect1: Rect, rect2: Rect): boolean;
/**
 * Detects collision based on rectangle intersection.
 * Returns the first droppable that intersects with the active element.
 */
export declare const rectIntersection: CollisionDetection;
/**
 * Detects collision based on the center of the active element.
 * Returns the droppable that contains the center point.
 */
export declare const pointerWithin: CollisionDetection;
/**
 * Detects collision based on the closest center point.
 * Returns the droppable with the closest center to the active element's center.
 */
export declare const closestCenter: CollisionDetection;
/**
 * Detects collision based on the closest corner.
 * Returns the droppable with the closest corner to the active element.
 */
export declare const closestCorners: CollisionDetection;
/**
 * Detects collision based on percentage overlap.
 * Returns the droppable with the highest percentage of overlap.
 */
export declare const percentageOverlap: CollisionDetection;
/**
 * Detects collision for vertical lists.
 * Uses the vertical center of the active element to determine position.
 */
export declare const verticalListSorting: CollisionDetection;
/**
 * Detects collision for horizontal lists.
 * Uses the horizontal center of the active element to determine position.
 */
export declare const horizontalListSorting: CollisionDetection;
/**
 * Creates a custom collision detection that filters droppables by type.
 */
export declare function createTypeFilter(allowedTypes: string[], collisionDetection?: CollisionDetection): CollisionDetection;
/**
 * Creates a compound collision detection that tries multiple strategies.
 */
export declare function createCompoundCollision(strategies: CollisionDetection[]): CollisionDetection;
export { getRect, getCenter, getDistance, getArea, getIntersectionArea, rectsIntersect, };
//# sourceMappingURL=collision.d.ts.map