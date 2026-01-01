# @philjs/dnd

Drag and drop functionality for React applications. A lightweight, accessible, and performant solution for creating interactive drag-and-drop interfaces.

## Installation

```bash
npm install @philjs/dnd
# or
yarn add @philjs/dnd
# or
pnpm add @philjs/dnd
```

## Basic Usage

```tsx
import { DndProvider, Draggable, Droppable } from '@philjs/dnd';

function App() {
  const handleDrop = (dragId, dropId) => {
    console.log(`Dropped ${dragId} onto ${dropId}`);
  };

  return (
    <DndProvider onDrop={handleDrop}>
      <Droppable id="list">
        <Draggable id="item-1">
          <div>Drag me!</div>
        </Draggable>
        <Draggable id="item-2">
          <div>Drag me too!</div>
        </Draggable>
      </Droppable>
    </DndProvider>
  );
}
```

## Features

- **Lightweight** - Minimal bundle size with no heavy dependencies
- **Touch Support** - Works on mobile and touch devices
- **Keyboard Accessible** - Full keyboard navigation support
- **Sortable Lists** - Built-in sortable list functionality
- **Multiple Drop Zones** - Support for multiple drop targets
- **Custom Drag Preview** - Customize the drag overlay appearance
- **Constraints** - Limit drag movement to axes or containers
- **Auto-scroll** - Automatic scrolling near container edges
- **Collision Detection** - Multiple algorithms for drop detection
- **Sensors** - Mouse, touch, and keyboard sensors
- **Animations** - Smooth drop animations
- **Nested Droppables** - Support for nested drop zones

## Hooks

| Hook | Description |
|------|-------------|
| `useDraggable` | Make an element draggable |
| `useDroppable` | Create a drop zone |
| `useSortable` | Sortable list item |
| `useDndContext` | Access drag state |
| `useDragOverlay` | Custom drag preview |

## Components

| Component | Description |
|-----------|-------------|
| `DndProvider` | Context provider for drag-and-drop |
| `Draggable` | Wrapper for draggable elements |
| `Droppable` | Drop zone container |
| `SortableList` | Pre-built sortable list |
| `DragOverlay` | Custom drag preview layer |

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./core, ./sensors, ./utils
- Source files: packages/philjs-dnd/src/index.ts, packages/philjs-dnd/src/core/index.ts, packages/philjs-dnd/src/sensors/index.ts, packages/philjs-dnd/src/utils/index.ts

### Public API
- Direct exports: (none detected)
- Re-exported names: // Animation functions
  applyDropAnimation, // Basic modifiers
  restrictToHorizontalAxis, // CSS transition helpers
  getTransitionString, // Collision detection algorithms
  rectIntersection, // Composite modifiers
  composeModifiers, // Conditional modifiers
  conditionalModifier, // Default animations
  defaultDropAnimation, // Easing functions
  easings, // FLIP animation
  captureFlipState, // Keyframes
  shakeKeyframes, // Snap modifiers
  snapToGrid, // Transform modifiers
  scaleMovement, // Types
  type LayoutShiftAnimation, // Utilities
  clamp, // Utilities
  getTransformValues, // Utility functions
  getRect, CollisionArgs, CollisionDetection, DelayedMouseSensor, DistanceMouseSensor, DndConfig, DndManager, DragCancelEvent, DragEndEvent, DragItem, DragMoveEvent, DragOverEvent, DragStartEvent, DragState, DropTarget, FlipState, ImmediateTouchSensor, KeyboardCoordinates, KeyboardSensor, KeyboardSensorOptions, LongPressSensor, Modifier, ModifierArgs, MouseSensor, MouseSensorOptions, PhilDndContext, PhilDragOverlay, PhilDraggable, PhilDroppable, PointerSensor, Position, Rect, Sensor, SensorDescriptor, SensorFactory, SensorOptions, TouchSensor, TouchSensorOptions, VimKeyboardSensor, WasdKeyboardSensor, addMomentum, animateLayoutShift, applyEasing, bounceDropAnimation, clearTransform, closestCenter, closestCorners, createBoundingBox, createCompoundCollision, createDndManager, createKeyframeAnimation, createTypeFilter, defaultLayoutShiftAnimation, fadeInKeyframes, fadeOutKeyframes, fastDropAnimation, getArea, getCenter, getDistance, getDndManager, getDroppableCenter, getIntersectionArea, getNextDroppableId, horizontalListSorting, invertMovement, percentageOverlap, playFlipAnimation, pointerWithin, preventScrolling, pulseKeyframes, rectIntersection, rectsIntersect, removeTransition, restrictToFirstScrollableAncestor, restrictToParentElement, restrictToVerticalAxis, restrictToWindowEdges, scaleDownKeyframes, scaleUpKeyframes, setTransform, slideInFromBottomKeyframes, slideInFromTopKeyframes, slowDropAnimation, snapCenterToContainer, snapToCustomGrid, snapToGrid, springDropAnimation, typeBasedModifier, verticalListSorting, waitForTransition
- Re-exported modules: ../types.js, ./DndContext.js, ./DragOverlay.js, ./Draggable.js, ./Droppable.js, ./animations.js, ./collision.js, ./core/DndContext.js, ./core/DragOverlay.js, ./core/Draggable.js, ./core/Droppable.js, ./keyboard.js, ./modifiers.js, ./mouse.js, ./sensors/keyboard.js, ./sensors/mouse.js, ./sensors/touch.js, ./touch.js, ./types.js, ./utils/collision.js, ./utils/modifiers.js
<!-- API_SNAPSHOT_END -->

## License

MIT
