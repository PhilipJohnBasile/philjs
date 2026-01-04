// ============================================================================
// Basic Modifiers
// ============================================================================
/**
 * Restricts movement to horizontal axis only.
 */
export const restrictToHorizontalAxis = ({ transform }) => ({
    x: transform.x,
    y: 0,
});
/**
 * Restricts movement to vertical axis only.
 */
export const restrictToVerticalAxis = ({ transform }) => ({
    x: 0,
    y: transform.y,
});
/**
 * Restricts movement to the first scrollable ancestor.
 */
export const restrictToFirstScrollableAncestor = ({ transform, activeRect, containerRect }) => {
    if (!activeRect || !containerRect)
        return transform;
    const { x, y } = transform;
    // Calculate boundaries
    const minX = containerRect.left - activeRect.left;
    const maxX = containerRect.right - activeRect.right;
    const minY = containerRect.top - activeRect.top;
    const maxY = containerRect.bottom - activeRect.bottom;
    return {
        x: Math.min(Math.max(x, minX), maxX),
        y: Math.min(Math.max(y, minY), maxY),
    };
};
/**
 * Restricts movement to the window/viewport boundaries.
 */
export const restrictToWindowEdges = ({ transform, activeRect }) => {
    if (!activeRect)
        return transform;
    const { x, y } = transform;
    const minX = -activeRect.left;
    const maxX = window.innerWidth - activeRect.right;
    const minY = -activeRect.top;
    const maxY = window.innerHeight - activeRect.bottom;
    return {
        x: Math.min(Math.max(x, minX), maxX),
        y: Math.min(Math.max(y, minY), maxY),
    };
};
/**
 * Restricts movement to parent element boundaries.
 */
export const restrictToParentElement = ({ transform, activeRect, containerRect }) => {
    if (!activeRect || !containerRect)
        return transform;
    const { x, y } = transform;
    const minX = containerRect.left - activeRect.left;
    const maxX = containerRect.right - activeRect.right;
    const minY = containerRect.top - activeRect.top;
    const maxY = containerRect.bottom - activeRect.bottom;
    return {
        x: Math.min(Math.max(x, minX), maxX),
        y: Math.min(Math.max(y, minY), maxY),
    };
};
// ============================================================================
// Snap Modifiers
// ============================================================================
/**
 * Snaps movement to a grid.
 */
export function snapToGrid(gridSize) {
    return ({ transform }) => ({
        x: Math.round(transform.x / gridSize) * gridSize,
        y: Math.round(transform.y / gridSize) * gridSize,
    });
}
/**
 * Snaps movement to a custom grid with different x and y sizes.
 */
export function snapToCustomGrid(gridSizeX, gridSizeY) {
    return ({ transform }) => ({
        x: Math.round(transform.x / gridSizeX) * gridSizeX,
        y: Math.round(transform.y / gridSizeY) * gridSizeY,
    });
}
/**
 * Snaps to center of droppable containers.
 */
export function snapCenterToContainer(droppableRects, threshold = 20) {
    return ({ transform, activeRect }) => {
        if (!activeRect)
            return transform;
        const newLeft = activeRect.left + transform.x;
        const newTop = activeRect.top + transform.y;
        const activeCenter = {
            x: newLeft + activeRect.width / 2,
            y: newTop + activeRect.height / 2,
        };
        let closestSnap = null;
        let closestDistance = threshold;
        droppableRects.forEach((rect) => {
            const containerCenter = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
            };
            const distance = Math.sqrt(Math.pow(activeCenter.x - containerCenter.x, 2) +
                Math.pow(activeCenter.y - containerCenter.y, 2));
            if (distance < closestDistance) {
                closestDistance = distance;
                closestSnap = {
                    x: transform.x + (containerCenter.x - activeCenter.x),
                    y: transform.y + (containerCenter.y - activeCenter.y),
                };
            }
        });
        return closestSnap ?? transform;
    };
}
// ============================================================================
// Transform Modifiers
// ============================================================================
/**
 * Scales the movement by a factor.
 */
export function scaleMovement(scale) {
    return ({ transform }) => ({
        x: transform.x * scale,
        y: transform.y * scale,
    });
}
/**
 * Inverts the movement direction.
 */
export const invertMovement = ({ transform }) => ({
    x: -transform.x,
    y: -transform.y,
});
/**
 * Adds momentum/inertia to movement.
 */
export function addMomentum(momentum = 0.1) {
    let previousTransform = { x: 0, y: 0 };
    let velocity = { x: 0, y: 0 };
    return ({ transform }) => {
        velocity = {
            x: (transform.x - previousTransform.x) * momentum,
            y: (transform.y - previousTransform.y) * momentum,
        };
        previousTransform = transform;
        return {
            x: transform.x + velocity.x,
            y: transform.y + velocity.y,
        };
    };
}
/**
 * Applies easing to movement.
 */
export function applyEasing(easing = (t) => t, maxDistance = 500) {
    return ({ transform }) => {
        const distance = Math.sqrt(transform.x ** 2 + transform.y ** 2);
        const normalizedDistance = Math.min(distance / maxDistance, 1);
        const easedFactor = distance > 0 ? easing(normalizedDistance) * maxDistance / distance : 0;
        return {
            x: transform.x * easedFactor,
            y: transform.y * easedFactor,
        };
    };
}
// ============================================================================
// Conditional Modifiers
// ============================================================================
/**
 * Creates a modifier that only applies based on a condition.
 */
export function conditionalModifier(condition, modifier) {
    return (args) => {
        if (condition(args)) {
            return modifier(args);
        }
        return args.transform;
    };
}
/**
 * Creates a modifier that applies only for specific item types.
 */
export function typeBasedModifier(types, modifier) {
    return (args) => {
        const activeType = args.active.data?.['type'];
        if (activeType && types.includes(activeType)) {
            return modifier(args);
        }
        return args.transform;
    };
}
// ============================================================================
// Composite Modifiers
// ============================================================================
/**
 * Combines multiple modifiers into one.
 */
export function composeModifiers(...modifiers) {
    return (args) => {
        return modifiers.reduce((transform, modifier) => modifier({ ...args, transform }), args.transform);
    };
}
// ============================================================================
// Clamp Utilities
// ============================================================================
/**
 * Clamps a value between min and max.
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
/**
 * Creates a bounding box modifier.
 */
export function createBoundingBox(bounds) {
    return ({ transform, activeRect }) => {
        if (!activeRect)
            return transform;
        let { x, y } = transform;
        if (bounds.left !== undefined) {
            const minX = bounds.left - activeRect.left;
            x = Math.max(x, minX);
        }
        if (bounds.right !== undefined) {
            const maxX = bounds.right - activeRect.right;
            x = Math.min(x, maxX);
        }
        if (bounds.top !== undefined) {
            const minY = bounds.top - activeRect.top;
            y = Math.max(y, minY);
        }
        if (bounds.bottom !== undefined) {
            const maxY = bounds.bottom - activeRect.bottom;
            y = Math.min(y, maxY);
        }
        return { x, y };
    };
}
//# sourceMappingURL=modifiers.js.map