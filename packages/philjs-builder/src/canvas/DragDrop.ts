/**
 * Drag and drop components for canvas
 */

export interface DragDropContextProps {
  onDragStart?: (id: string) => void;
  onDragEnd?: (id: string) => void;
  onDrop?: (source: string, target: string) => void;
}

export interface DraggableProps {
  id: string;
  children?: unknown;
  disabled?: boolean;
}

export interface DroppableProps {
  id: string;
  children?: unknown;
  accept?: string[];
}

export interface DropIndicatorProps {
  position: { x: number; y: number };
  visible?: boolean;
}

export interface DragPreviewProps {
  id: string;
  children?: unknown;
}

export function DragDropContext(_props: DragDropContextProps): HTMLElement {
  return document.createElement('div');
}

export function Draggable(_props: DraggableProps): HTMLElement {
  return document.createElement('div');
}

export function Droppable(_props: DroppableProps): HTMLElement {
  return document.createElement('div');
}

export function DropIndicator(_props: DropIndicatorProps): HTMLElement {
  return document.createElement('div');
}

export function DragPreview(_props: DragPreviewProps): HTMLElement {
  return document.createElement('div');
}
