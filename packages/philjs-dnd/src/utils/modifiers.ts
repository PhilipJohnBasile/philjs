import type { Modifier, Position, Rect, DragItem } from '../types.js';

// ============================================================================
// Basic Modifiers
// ============================================================================

/**
 * Restricts movement to horizontal axis only.
 */
export const restrictToHorizontalAxis: Modifier = ({ transform }) => ({
  x: transform.x,
  y: 0,
});

/**
 * Restricts movement to vertical axis only.
 */
export const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  x: 0,
  y: transform.y,
});

/**
 * Restricts movement to the first scrollable ancestor.
 */
export const restrictToFirstScrollableAncestor: Modifier = ({ transform, activeRect, containerRect }) => {
  if (!activeRect || !containerRect) return transform;

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
export const restrictToWindowEdges: Modifier = ({ transform, activeRect }) => {
  if (!activeRect) return transform;

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
export const restrictToParentElement: Modifier = ({ transform, activeRect, containerRect }) => {
  if (!activeRect || !containerRect) return transform;

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
export function snapToGrid(gridSize: number): Modifier {
  return ({ transform }) => ({
    x: Math.round(transform.x / gridSize) * gridSize,
    y: Math.round(transform.y / gridSize) * gridSize,
  });
}

/**
 * Snaps movement to a custom grid with different x and y sizes.
 */
export function snapToCustomGrid(gridSizeX: number, gridSizeY: number): Modifier {
  return ({ transform }) => ({
    x: Math.round(transform.x / gridSizeX) * gridSizeX,
    y: Math.round(transform.y / gridSizeY) * gridSizeY,
  });
}

/**
 * Snaps to center of droppable containers.
 */
export function snapCenterToContainer(droppableRects: Map<string, Rect>, threshold: number = 20): Modifier {
  return ({ transform, activeRect }) => {
    if (!activeRect) return transform;

    const newLeft = activeRect.left + transform.x;
    const newTop = activeRect.top + transform.y;
    const activeCenter = {
      x: newLeft + activeRect.width / 2,
      y: newTop + activeRect.height / 2,
    };

    let closestSnap: Position | null = null;
    let closestDistance = threshold;

    droppableRects.forEach((rect) => {
      const containerCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };

      const distance = Math.sqrt(
        Math.pow(activeCenter.x - containerCenter.x, 2) +
        Math.pow(activeCenter.y - containerCenter.y, 2)
      );

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
export function scaleMovement(scale: number): Modifier {
  return ({ transform }) => ({
    x: transform.x * scale,
    y: transform.y * scale,
  });
}

/**
 * Inverts the movement direction.
 */
export const invertMovement: Modifier = ({ transform }) => ({
  x: -transform.x,
  y: -transform.y,
});

/**
 * Adds momentum/inertia to movement.
 */
export function addMomentum(momentum: number = 0.1): Modifier {
  let previousTransform: Position = { x: 0, y: 0 };
  let velocity: Position = { x: 0, y: 0 };

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
export function applyEasing(
  easing: (t: number) => number = (t) => t,
  maxDistance: number = 500
): Modifier {
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
export function conditionalModifier(
  condition: (args: { transform: Position; active: DragItem; activeRect: Rect | null; containerRect: Rect | null }) => boolean,
  modifier: Modifier
): Modifier {
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
export function typeBasedModifier(
  types: string[],
  modifier: Modifier
): Modifier {
  return (args) => {
    const activeType = args.active.data?.['type'] as string | undefined;
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
export function composeModifiers(...modifiers: Modifier[]): Modifier {
  return (args) => {
    return modifiers.reduce(
      (transform, modifier) => modifier({ ...args, transform }),
      args.transform
    );
  };
}

// ============================================================================
// Clamp Utilities
// ============================================================================

/**
 * Clamps a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Creates a bounding box modifier.
 */
export function createBoundingBox(bounds: {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}): Modifier {
  return ({ transform, activeRect }) => {
    if (!activeRect) return transform;

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
