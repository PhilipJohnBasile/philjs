/**
 * @philjs/dnd - Drag and Drop for PhilJS
 * Pure Web Components - No React
 *
 * @example
 * ```ts
 * import { createDndManager, PhilDraggable, PhilDroppable } from '@philjs/dnd';
 *
 * // Create manager
 * const manager = createDndManager({
 *   onDragEnd: ({ active, over }) => {
 *     if (over) {
 *       console.log(`Dropped ${active.id} on ${over.id}`);
 *     }
 *   },
 * });
 *
 * // Use Web Components
 * // <phil-draggable drag-id="item-1">Drag me</phil-draggable>
 * // <phil-droppable drop-id="zone-1">Drop here</phil-droppable>
 * ```
 */
export { PhilDndContext, DndManager, createDndManager, getDndManager } from './core/DndContext.js';
export { PhilDraggable } from './core/Draggable.js';
export { PhilDroppable } from './core/Droppable.js';
export { PhilDragOverlay } from './core/DragOverlay.js';
export { MouseSensor } from './sensors/mouse.js';
export { TouchSensor } from './sensors/touch.js';
export { KeyboardSensor } from './sensors/keyboard.js';
export { rectIntersection, closestCenter, closestCorners, pointerWithin } from './utils/collision.js';
export { restrictToWindowEdges, restrictToParentElement, snapToGrid } from './utils/modifiers.js';
export type { Position, Rect, DragItem, DropTarget, DragState, DragStartEvent, DragMoveEvent, DragOverEvent, DragEndEvent, DragCancelEvent, CollisionDetection, CollisionArgs, Modifier, ModifierArgs, Sensor, SensorFactory, SensorOptions, SensorDescriptor, DndConfig, } from './types.js';
//# sourceMappingURL=index.d.ts.map