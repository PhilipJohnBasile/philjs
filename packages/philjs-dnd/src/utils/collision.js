// ============================================================================
// Utility Functions
// ============================================================================
function getRect(rect) {
    return {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
    };
}
function getCenter(rect) {
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
    };
}
function getDistance(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
}
function getArea(rect) {
    return rect.width * rect.height;
}
function getIntersectionArea(rect1, rect2) {
    const left = Math.max(rect1.left, rect2.left);
    const right = Math.min(rect1.right, rect2.right);
    const top = Math.max(rect1.top, rect2.top);
    const bottom = Math.min(rect1.bottom, rect2.bottom);
    if (left >= right || top >= bottom) {
        return 0;
    }
    return (right - left) * (bottom - top);
}
function rectsIntersect(rect1, rect2) {
    return !(rect1.right < rect2.left ||
        rect1.left > rect2.right ||
        rect1.bottom < rect2.top ||
        rect1.top > rect2.bottom);
}
// ============================================================================
// Collision Detection Algorithms
// ============================================================================
/**
 * Detects collision based on rectangle intersection.
 * Returns the first droppable that intersects with the active element.
 */
export const rectIntersection = ({ active, activeRect, droppables }) => {
    let closestDroppable = null;
    let maxIntersection = 0;
    droppables.forEach((droppable) => {
        if (droppable.id === active.id)
            return;
        const intersectionArea = getIntersectionArea(activeRect, droppable.rect);
        if (intersectionArea > maxIntersection) {
            maxIntersection = intersectionArea;
            closestDroppable = droppable;
        }
    });
    return closestDroppable;
};
/**
 * Detects collision based on the center of the active element.
 * Returns the droppable that contains the center point.
 */
export const pointerWithin = ({ active, activeRect, droppables }) => {
    const center = getCenter(activeRect);
    let result = null;
    droppables.forEach((droppable) => {
        if (result !== null)
            return;
        if (droppable.id === active.id)
            return;
        const { rect } = droppable;
        if (center.x >= rect.left &&
            center.x <= rect.right &&
            center.y >= rect.top &&
            center.y <= rect.bottom) {
            result = droppable;
        }
    });
    return result;
};
/**
 * Detects collision based on the closest center point.
 * Returns the droppable with the closest center to the active element's center.
 */
export const closestCenter = ({ active, activeRect, droppables }) => {
    const activeCenter = getCenter(activeRect);
    let closestDroppable = null;
    let closestDistance = Infinity;
    droppables.forEach((droppable) => {
        if (droppable.id === active.id)
            return;
        const droppableCenter = getCenter(droppable.rect);
        const distance = getDistance(activeCenter, droppableCenter);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestDroppable = droppable;
        }
    });
    return closestDroppable;
};
/**
 * Detects collision based on the closest corner.
 * Returns the droppable with the closest corner to the active element.
 */
export const closestCorners = ({ active, activeRect, droppables }) => {
    const activeCorners = [
        { x: activeRect.left, y: activeRect.top },
        { x: activeRect.right, y: activeRect.top },
        { x: activeRect.left, y: activeRect.bottom },
        { x: activeRect.right, y: activeRect.bottom },
    ];
    let closestDroppable = null;
    let closestDistance = Infinity;
    droppables.forEach((droppable) => {
        if (droppable.id === active.id)
            return;
        const droppableCorners = [
            { x: droppable.rect.left, y: droppable.rect.top },
            { x: droppable.rect.right, y: droppable.rect.top },
            { x: droppable.rect.left, y: droppable.rect.bottom },
            { x: droppable.rect.right, y: droppable.rect.bottom },
        ];
        for (const activeCorner of activeCorners) {
            for (const droppableCorner of droppableCorners) {
                const distance = getDistance(activeCorner, droppableCorner);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestDroppable = droppable;
                }
            }
        }
    });
    return closestDroppable;
};
/**
 * Detects collision based on percentage overlap.
 * Returns the droppable with the highest percentage of overlap.
 */
export const percentageOverlap = ({ active, activeRect, droppables }) => {
    const activeArea = getArea(activeRect);
    let bestDroppable = null;
    let bestPercentage = 0;
    droppables.forEach((droppable) => {
        if (droppable.id === active.id)
            return;
        const intersectionArea = getIntersectionArea(activeRect, droppable.rect);
        const percentage = intersectionArea / activeArea;
        if (percentage > bestPercentage) {
            bestPercentage = percentage;
            bestDroppable = droppable;
        }
    });
    return bestDroppable;
};
/**
 * Detects collision for vertical lists.
 * Uses the vertical center of the active element to determine position.
 */
export const verticalListSorting = ({ active, activeRect, droppables }) => {
    const activeCenter = getCenter(activeRect);
    let closestDroppable = null;
    let closestDistance = Infinity;
    droppables.forEach((droppable) => {
        if (droppable.id === active.id)
            return;
        const droppableCenter = getCenter(droppable.rect);
        const distance = Math.abs(activeCenter.y - droppableCenter.y);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestDroppable = droppable;
        }
    });
    return closestDroppable;
};
/**
 * Detects collision for horizontal lists.
 * Uses the horizontal center of the active element to determine position.
 */
export const horizontalListSorting = ({ active, activeRect, droppables }) => {
    const activeCenter = getCenter(activeRect);
    let closestDroppable = null;
    let closestDistance = Infinity;
    droppables.forEach((droppable) => {
        if (droppable.id === active.id)
            return;
        const droppableCenter = getCenter(droppable.rect);
        const distance = Math.abs(activeCenter.x - droppableCenter.x);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestDroppable = droppable;
        }
    });
    return closestDroppable;
};
/**
 * Creates a custom collision detection that filters droppables by type.
 */
export function createTypeFilter(allowedTypes, collisionDetection = rectIntersection) {
    return (args) => {
        const filteredDroppables = new Map();
        args.droppables.forEach((droppable, id) => {
            const type = droppable.data?.['type'];
            if (!type || allowedTypes.includes(type)) {
                filteredDroppables.set(id, droppable);
            }
        });
        return collisionDetection({
            ...args,
            droppables: filteredDroppables,
        });
    };
}
/**
 * Creates a compound collision detection that tries multiple strategies.
 */
export function createCompoundCollision(strategies) {
    return (args) => {
        for (const strategy of strategies) {
            const result = strategy(args);
            if (result)
                return result;
        }
        return null;
    };
}
// ============================================================================
// Exports
// ============================================================================
export { getRect, getCenter, getDistance, getArea, getIntersectionArea, rectsIntersect, };
//# sourceMappingURL=collision.js.map