# @philjs/dnd

The `@philjs/dnd` package provides accessible drag and drop functionality for PhilJS using pure Web Components. No React required.

## Installation

```bash
npm install @philjs/dnd
```

## Features

- **Web Components** - Pure custom elements, no framework lock-in
- **Multiple Sensors** - Mouse, touch, and keyboard support
- **Collision Detection** - Rect intersection, closest center, pointer within
- **Modifiers** - Restrict movement, snap to grid
- **Accessibility** - Screen reader announcements, keyboard navigation
- **Custom Events** - Full event lifecycle hooks
- **Drag Overlay** - Visual drag preview

## Quick Start

```typescript
import { createDndManager, PhilDraggable, PhilDroppable } from '@philjs/dnd';

// Create the drag and drop manager
const manager = createDndManager({
  onDragEnd: ({ active, over }) => {
    if (over) {
      console.log(`Dropped ${active.id} on ${over.id}`);
      // Handle the drop
      moveItem(active.id, over.id);
    }
  },
});

// Use Web Components in your HTML:
// <phil-draggable drag-id="item-1">Drag me</phil-draggable>
// <phil-droppable drop-id="zone-1">Drop here</phil-droppable>
```

---

## Core Components

### DndManager

The central coordinator for all drag and drop operations:

```typescript
import { createDndManager, getDndManager } from '@philjs/dnd';
import type { DndConfig, DragState } from '@philjs/dnd';

// Create manager with configuration
const manager = createDndManager({
  // Sensors
  sensors: [
    { sensor: MouseSensor },
    { sensor: TouchSensor, options: { activationConstraint: { delay: 250 } } },
    { sensor: KeyboardSensor },
  ],

  // Collision detection algorithm
  collisionDetection: closestCenter,

  // Position modifiers
  modifiers: [restrictToWindowEdges],

  // Accessibility settings
  accessibility: {
    announcements: {
      onDragStart: (id) => `Started dragging ${id}`,
      onDragOver: (id, overId) => `${id} is over ${overId}`,
      onDragEnd: (id, overId) => overId ? `Dropped ${id} on ${overId}` : `Cancelled`,
      onDragCancel: (id) => `Cancelled dragging ${id}`,
    },
    screenReaderInstructions: 'Press space to pick up, arrows to move, space to drop',
  },

  // Event handlers
  onDragStart: (event) => console.log('Started', event.active.id),
  onDragMove: (event) => console.log('Moving', event.delta),
  onDragOver: (event) => console.log('Over', event.over.id),
  onDragEnd: (event) => console.log('Ended', event.active.id, event.over?.id),
  onDragCancel: (event) => console.log('Cancelled', event.active.id),
});

// Get current state
const state: DragState = manager.getState();

// Access global manager
const globalManager = getDndManager();
```

### PhilDraggable

Web component for draggable items:

```html
<!-- Basic usage -->
<phil-draggable drag-id="item-1">
  Drag me
</phil-draggable>

<!-- With data -->
<phil-draggable drag-id="item-2" data-type="task" data-priority="high">
  High priority task
</phil-draggable>

<!-- Disabled -->
<phil-draggable drag-id="item-3" disabled>
  Cannot drag
</phil-draggable>
```

```typescript
import { PhilDraggable } from '@philjs/dnd';

// Access element
const draggable = document.querySelector('phil-draggable') as PhilDraggable;

// Programmatic control
draggable.setAttribute('drag-id', 'new-id');
draggable.setAttribute('disabled', '');
```

### PhilDroppable

Web component for drop zones:

```html
<!-- Basic drop zone -->
<phil-droppable drop-id="zone-1">
  Drop items here
</phil-droppable>

<!-- With data -->
<phil-droppable drop-id="column-todo" data-column="todo">
  Todo Column
</phil-droppable>

<!-- Disabled -->
<phil-droppable drop-id="zone-2" disabled>
  Cannot drop here
</phil-droppable>
```

```typescript
import { PhilDroppable } from '@philjs/dnd';

// Access element
const droppable = document.querySelector('phil-droppable') as PhilDroppable;

// Style when item is over
droppable.addEventListener('phil-drag-over', () => {
  droppable.classList.add('drag-over');
});

droppable.addEventListener('phil-drag-leave', () => {
  droppable.classList.remove('drag-over');
});
```

### PhilDragOverlay

Visual overlay during drag:

```html
<phil-drag-overlay>
  <!-- Content shows during drag -->
  <div class="drag-preview">
    Dragging item...
  </div>
</phil-drag-overlay>
```

```typescript
import { PhilDragOverlay } from '@philjs/dnd';

// Dynamic overlay content
document.addEventListener('phil-dnd-state-change', (e: CustomEvent) => {
  const state = e.detail;
  const overlay = document.querySelector('phil-drag-overlay');

  if (state.isDragging && overlay) {
    overlay.innerHTML = `<div>Dragging: ${state.activeId}</div>`;
  }
});
```

### PhilDndContext

Container element for scoped drag and drop:

```html
<phil-dnd-context id="board">
  <phil-droppable drop-id="column-1">
    <phil-draggable drag-id="task-1">Task 1</phil-draggable>
    <phil-draggable drag-id="task-2">Task 2</phil-draggable>
  </phil-droppable>

  <phil-droppable drop-id="column-2">
    <phil-draggable drag-id="task-3">Task 3</phil-draggable>
  </phil-droppable>
</phil-dnd-context>
```

```typescript
import { PhilDndContext, DndManager } from '@philjs/dnd';

const context = document.getElementById('board') as PhilDndContext;

// Configure context-specific manager
context.configure({
  onDragEnd: ({ active, over }) => {
    if (over) {
      moveTaskToColumn(active.id, over.id);
    }
  },
});

// Get context manager
const manager: DndManager | null = context.getManager();
```

---

## Sensors

### MouseSensor

Default mouse/pointer support:

```typescript
import { MouseSensor } from '@philjs/dnd';

const manager = createDndManager({
  sensors: [
    {
      sensor: MouseSensor,
      options: {
        activationConstraint: {
          distance: 10, // Minimum drag distance before activating
        },
      },
    },
  ],
});
```

### TouchSensor

Mobile touch support:

```typescript
import { TouchSensor } from '@philjs/dnd';

const manager = createDndManager({
  sensors: [
    {
      sensor: TouchSensor,
      options: {
        activationConstraint: {
          delay: 250, // Hold delay before drag starts
          tolerance: 5, // Movement tolerance during delay
        },
      },
    },
  ],
});
```

### KeyboardSensor

Keyboard-accessible dragging:

```typescript
import { KeyboardSensor } from '@philjs/dnd';

const manager = createDndManager({
  sensors: [
    {
      sensor: KeyboardSensor,
      options: {
        // Keyboard sensor options
      },
    },
  ],
});

// Usage:
// Space/Enter: Pick up / Drop
// Arrow keys: Move item
// Escape: Cancel drag
```

### Custom Sensor

Create custom input sensors:

```typescript
import type { Sensor, SensorFactory, SensorOptions, SensorHandlers } from '@philjs/dnd';

const GamepadSensor: SensorFactory = (options?: SensorOptions): Sensor => {
  let active = false;
  let handlers: SensorHandlers | null = null;

  return {
    type: 'gamepad',
    options: options || {},

    activate(event: Event, h: SensorHandlers): void {
      active = true;
      handlers = h;
      // Start listening to gamepad input
      requestAnimationFrame(pollGamepad);
    },

    deactivate(): void {
      active = false;
      handlers = null;
    },
  };

  function pollGamepad(): void {
    if (!active || !handlers) return;
    const gamepad = navigator.getGamepads()[0];
    if (gamepad) {
      // Handle gamepad input
    }
    requestAnimationFrame(pollGamepad);
  }
};
```

---

## Collision Detection

### Built-in Algorithms

```typescript
import {
  rectIntersection,
  closestCenter,
  closestCorners,
  pointerWithin,
} from '@philjs/dnd';

// Rectangle intersection (default)
// Returns first droppable that overlaps with dragged item
const manager1 = createDndManager({
  collisionDetection: rectIntersection,
});

// Closest center
// Returns droppable whose center is closest to drag item center
const manager2 = createDndManager({
  collisionDetection: closestCenter,
});

// Closest corners
// Returns droppable with closest corner distance
const manager3 = createDndManager({
  collisionDetection: closestCorners,
});

// Pointer within
// Returns droppable that contains the pointer position
const manager4 = createDndManager({
  collisionDetection: pointerWithin,
});
```

### Custom Collision Detection

```typescript
import type { CollisionDetection, CollisionArgs, DropTarget } from '@philjs/dnd';

// Custom: Only match specific droppable types
const customCollision: CollisionDetection = (args: CollisionArgs): DropTarget | null => {
  const { active, activeRect, droppables } = args;

  // Only consider droppables that accept this item type
  const itemType = active.data?.type;

  for (const [id, droppable] of droppables) {
    const acceptsType = droppable.data?.accepts?.includes(itemType);
    if (!acceptsType) continue;

    // Check intersection
    const rect = droppable.rect;
    const intersects =
      activeRect.left < rect.right &&
      activeRect.right > rect.left &&
      activeRect.top < rect.bottom &&
      activeRect.bottom > rect.top;

    if (intersects) {
      return { id: droppable.id, rect: droppable.rect, data: droppable.data };
    }
  }

  return null;
};
```

---

## Modifiers

### Built-in Modifiers

```typescript
import {
  restrictToWindowEdges,
  restrictToParentElement,
  snapToGrid,
} from '@philjs/dnd';

// Prevent dragging outside viewport
const manager1 = createDndManager({
  modifiers: [restrictToWindowEdges],
});

// Restrict to parent container
const manager2 = createDndManager({
  modifiers: [restrictToParentElement],
});

// Snap to grid
const manager3 = createDndManager({
  modifiers: [snapToGrid],
});

// Combine modifiers
const manager4 = createDndManager({
  modifiers: [restrictToWindowEdges, snapToGrid],
});
```

### Custom Modifiers

```typescript
import type { Modifier, ModifierArgs, Position } from '@philjs/dnd';

// Snap to 20px grid
const snapTo20px: Modifier = (args: ModifierArgs): Position => {
  const gridSize = 20;
  return {
    x: Math.round(args.transform.x / gridSize) * gridSize,
    y: Math.round(args.transform.y / gridSize) * gridSize,
  };
};

// Restrict to horizontal only
const horizontalOnly: Modifier = (args: ModifierArgs): Position => {
  return {
    x: args.transform.x,
    y: 0,
  };
};

// Restrict to vertical only
const verticalOnly: Modifier = (args: ModifierArgs): Position => {
  return {
    x: 0,
    y: args.transform.y,
  };
};

// Restrict to axis based on item data
const restrictByAxis: Modifier = (args: ModifierArgs): Position => {
  const axis = args.active.data?.axis;
  if (axis === 'horizontal') {
    return { x: args.transform.x, y: 0 };
  }
  if (axis === 'vertical') {
    return { x: 0, y: args.transform.y };
  }
  return args.transform;
};
```

---

## Events

### Event Types

```typescript
import type {
  DragStartEvent,
  DragMoveEvent,
  DragOverEvent,
  DragEndEvent,
  DragCancelEvent,
} from '@philjs/dnd';

const manager = createDndManager({
  onDragStart: (event: DragStartEvent) => {
    console.log('Started:', event.active.id);
    console.log('Position:', event.initialPosition);
  },

  onDragMove: (event: DragMoveEvent) => {
    console.log('Moving:', event.active.id);
    console.log('Delta:', event.delta);
    console.log('Over:', event.over?.id);
  },

  onDragOver: (event: DragOverEvent) => {
    console.log('Entered:', event.over.id);
    highlightDropZone(event.over.id);
  },

  onDragEnd: (event: DragEndEvent) => {
    console.log('Dropped:', event.active.id);
    if (event.over) {
      handleDrop(event.active.id, event.over.id);
    }
  },

  onDragCancel: (event: DragCancelEvent) => {
    console.log('Cancelled:', event.active.id);
    resetDragState();
  },
});
```

### State Change Events

Listen to drag state changes globally:

```typescript
// Global state change listener
document.addEventListener('phil-dnd-state-change', (e: CustomEvent) => {
  const state = e.detail;

  if (state.isDragging) {
    document.body.classList.add('dragging');
    console.log('Active item:', state.activeId);
    console.log('Over target:', state.overId);
    console.log('Delta:', state.delta);
  } else {
    document.body.classList.remove('dragging');
  }
});
```

---

## Accessibility

### Screen Reader Support

```typescript
const manager = createDndManager({
  accessibility: {
    // Custom announcements
    announcements: {
      onDragStart: (id) => `Grabbed ${getItemName(id)}. Use arrow keys to move.`,
      onDragOver: (id, overId) => `${getItemName(id)} is over ${getZoneName(overId)}`,
      onDragEnd: (id, overId) =>
        overId
          ? `Dropped ${getItemName(id)} into ${getZoneName(overId)}`
          : `Returned ${getItemName(id)} to original position`,
      onDragCancel: (id) => `Cancelled dragging ${getItemName(id)}`,
    },

    // Instructions shown on focus
    screenReaderInstructions:
      'Press space bar to pick up this item. ' +
      'Use arrow keys to move. ' +
      'Press space bar again to drop. ' +
      'Press escape to cancel.',
  },
});
```

### ARIA Attributes

The components automatically add appropriate ARIA attributes:

```html
<!-- Draggable automatically has -->
<phil-draggable
  role="button"
  tabindex="0"
  aria-roledescription="draggable"
  aria-describedby="dnd-instructions">
  Item
</phil-draggable>

<!-- Droppable automatically has -->
<phil-droppable
  role="region"
  aria-dropeffect="move">
  Drop zone
</phil-droppable>
```

---

## Use Cases

### Kanban Board

```typescript
import { createDndManager, rectIntersection } from '@philjs/dnd';

interface Task {
  id: string;
  title: string;
  column: string;
}

const tasks: Task[] = [
  { id: 'task-1', title: 'Design mockups', column: 'todo' },
  { id: 'task-2', title: 'Write tests', column: 'in-progress' },
  { id: 'task-3', title: 'Deploy app', column: 'done' },
];

const manager = createDndManager({
  collisionDetection: rectIntersection,

  onDragEnd: ({ active, over }) => {
    if (!over) return;

    const taskId = active.id;
    const newColumn = over.data?.column;

    if (newColumn) {
      moveTaskToColumn(taskId, newColumn);
    }
  },
});

function moveTaskToColumn(taskId: string, column: string): void {
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    task.column = column;
    renderBoard();
  }
}
```

```html
<phil-dnd-context>
  <div class="kanban-board">
    <phil-droppable drop-id="todo" data-column="todo">
      <h2>Todo</h2>
      <phil-draggable drag-id="task-1">Design mockups</phil-draggable>
    </phil-droppable>

    <phil-droppable drop-id="in-progress" data-column="in-progress">
      <h2>In Progress</h2>
      <phil-draggable drag-id="task-2">Write tests</phil-draggable>
    </phil-droppable>

    <phil-droppable drop-id="done" data-column="done">
      <h2>Done</h2>
      <phil-draggable drag-id="task-3">Deploy app</phil-draggable>
    </phil-droppable>
  </div>
</phil-dnd-context>
```

### Sortable List

```typescript
import { createDndManager, closestCenter } from '@philjs/dnd';

const items = ['Item 1', 'Item 2', 'Item 3', 'Item 4'];

const manager = createDndManager({
  collisionDetection: closestCenter,

  onDragEnd: ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const oldIndex = parseInt(active.id.split('-')[1]);
    const newIndex = parseInt(over.id.split('-')[1]);

    // Reorder array
    const [removed] = items.splice(oldIndex, 1);
    items.splice(newIndex, 0, removed);

    renderList();
  },
});
```

### File Upload Zone

```typescript
import { createDndManager, pointerWithin } from '@philjs/dnd';

const manager = createDndManager({
  collisionDetection: pointerWithin,

  onDragOver: ({ over }) => {
    const zone = document.getElementById(over.id);
    zone?.classList.add('drag-over');
  },

  onDragEnd: ({ active, over }) => {
    if (over?.id === 'upload-zone') {
      const file = active.data?.file;
      if (file) {
        uploadFile(file);
      }
    }
  },
});
```

---

## Types Reference

```typescript
// Position
interface Position {
  x: number;
  y: number;
}

// Rectangle
interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

// Drag item
interface DragItem {
  id: string;
  data?: Record<string, unknown>;
}

// Drop target
interface DropTarget {
  id: string;
  rect: Rect;
  data?: Record<string, unknown>;
}

// Drag state
interface DragState {
  isDragging: boolean;
  activeId: string | null;
  activeItem: DragItem | null;
  overId: string | null;
  initialPosition: Position | null;
  currentPosition: Position | null;
  delta: Position;
}

// Sensor options
interface SensorOptions {
  activationConstraint?: {
    distance?: number;
    delay?: number;
    tolerance?: number;
  };
}

// DnD configuration
interface DndConfig {
  sensors?: SensorDescriptor[];
  collisionDetection?: CollisionDetection;
  modifiers?: Modifier[];
  accessibility?: {
    announcements?: {
      onDragStart?: (id: string) => string;
      onDragOver?: (id: string, overId: string) => string;
      onDragEnd?: (id: string, overId: string | null) => string;
      onDragCancel?: (id: string) => string;
    };
    screenReaderInstructions?: string;
  };
  onDragStart?: (event: DragStartEvent) => void;
  onDragMove?: (event: DragMoveEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragCancel?: (event: DragCancelEvent) => void;
}
```

---

## API Reference

### Core

| Export | Description |
|--------|-------------|
| `createDndManager` | Create drag and drop manager |
| `getDndManager` | Get global manager instance |
| `DndManager` | Manager class |
| `PhilDndContext` | Context web component |
| `PhilDraggable` | Draggable web component |
| `PhilDroppable` | Droppable web component |
| `PhilDragOverlay` | Drag overlay component |

### Sensors

| Export | Description |
|--------|-------------|
| `MouseSensor` | Mouse/pointer sensor |
| `TouchSensor` | Touch sensor |
| `KeyboardSensor` | Keyboard sensor |

### Collision Detection

| Export | Description |
|--------|-------------|
| `rectIntersection` | Rectangle intersection |
| `closestCenter` | Closest center point |
| `closestCorners` | Closest corners |
| `pointerWithin` | Pointer inside target |

### Modifiers

| Export | Description |
|--------|-------------|
| `restrictToWindowEdges` | Keep within viewport |
| `restrictToParentElement` | Keep within parent |
| `snapToGrid` | Snap to grid positions |

---

## Next Steps

- [Sortable Lists](../../patterns/sortable-lists.md)
- [Kanban Boards](../../patterns/kanban.md)
- [@philjs/ui Components](../ui/overview.md)
