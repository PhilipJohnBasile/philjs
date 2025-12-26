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

## License

MIT
