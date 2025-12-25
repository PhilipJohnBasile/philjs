import type { ReactNode, CSSProperties } from 'react';

// ============================================================================
// Core Types
// ============================================================================

export interface Position {
  x: number;
  y: number;
}

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface DragItem {
  id: string;
  type: string;
  data?: Record<string, unknown>;
}

export interface DragState {
  isDragging: boolean;
  activeId: string | null;
  activeItem: DragItem | null;
  overId: string | null;
  initialPosition: Position | null;
  currentPosition: Position | null;
  delta: Position;
}

export interface DropResult {
  draggedId: string;
  draggedItem: DragItem;
  sourceContainerId: string | null;
  targetContainerId: string | null;
  targetIndex: number;
}

// ============================================================================
// Event Types
// ============================================================================

export interface DragStartEvent {
  active: DragItem;
  initialPosition: Position;
}

export interface DragMoveEvent {
  active: DragItem;
  delta: Position;
  currentPosition: Position;
  over: { id: string; rect: Rect } | null;
}

export interface DragOverEvent {
  active: DragItem;
  over: { id: string; rect: Rect; data?: Record<string, unknown> };
}

export interface DragEndEvent {
  active: DragItem;
  over: { id: string; rect: Rect; data?: Record<string, unknown> } | null;
  delta: Position;
}

export interface DragCancelEvent {
  active: DragItem;
}

// ============================================================================
// Sensor Types
// ============================================================================

export type SensorActivator = 'pointer' | 'keyboard';

export interface SensorOptions {
  activationConstraint?: {
    distance?: number;
    delay?: number;
    tolerance?: number;
  };
}

export interface Sensor {
  type: SensorActivator;
  options?: SensorOptions;
  activate: (event: Event, handlers: SensorHandlers) => void;
  deactivate: () => void;
}

export interface SensorHandlers {
  onStart: (position: Position) => void;
  onMove: (position: Position) => void;
  onEnd: (position: Position) => void;
  onCancel: () => void;
}

export type SensorDescriptor = {
  sensor: (options?: SensorOptions) => Sensor;
  options?: SensorOptions;
};

// ============================================================================
// Collision Detection Types
// ============================================================================

export type CollisionDetection = (args: {
  active: DragItem;
  activeRect: Rect;
  droppables: Map<string, { id: string; rect: Rect; data?: Record<string, unknown> }>;
}) => { id: string; rect: Rect; data?: Record<string, unknown> } | null;

// ============================================================================
// Modifier Types
// ============================================================================

export type Modifier = (args: {
  transform: Position;
  active: DragItem;
  activeRect: Rect | null;
  containerRect: Rect | null;
}) => Position;

// ============================================================================
// Animation Types
// ============================================================================

export interface AnimationConfig {
  duration: number;
  easing: string;
  keyframes?: Keyframe[];
}

export interface DropAnimation {
  duration: number;
  easing: string;
  sideEffects?: (args: { active: DragItem; dragOverlay: HTMLElement }) => void;
}

// ============================================================================
// Context Types
// ============================================================================

export interface DndContextValue {
  state: DragState;
  activeNode: HTMLElement | null;
  overlayNode: HTMLElement | null;
  droppables: Map<string, { id: string; rect: Rect; node: HTMLElement; data?: Record<string, unknown> }>;
  sensors: SensorDescriptor[];
  collisionDetection: CollisionDetection;
  modifiers: Modifier[];

  // Actions
  registerDroppable: (id: string, node: HTMLElement, data?: Record<string, unknown>) => void;
  unregisterDroppable: (id: string) => void;
  startDrag: (item: DragItem, node: HTMLElement, position: Position) => void;
  updateDrag: (position: Position) => void;
  endDrag: () => void;
  cancelDrag: () => void;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface DndContextProps {
  children: ReactNode;
  sensors?: SensorDescriptor[];
  collisionDetection?: CollisionDetection;
  modifiers?: Modifier[];
  onDragStart?: (event: DragStartEvent) => void;
  onDragMove?: (event: DragMoveEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragCancel?: (event: DragCancelEvent) => void;
  accessibility?: {
    announcements?: {
      onDragStart?: (id: string) => string;
      onDragOver?: (id: string, overId: string) => string;
      onDragEnd?: (id: string, overId: string | null) => string;
      onDragCancel?: (id: string) => string;
    };
    screenReaderInstructions?: string;
  };
}

export interface DraggableProps {
  id: string;
  type?: string;
  data?: Record<string, unknown>;
  disabled?: boolean;
  children: ReactNode | ((props: DraggableRenderProps) => ReactNode);
  handle?: boolean;
}

export interface DraggableRenderProps {
  isDragging: boolean;
  isOver: boolean;
  attributes: {
    role: string;
    tabIndex: number;
    'aria-roledescription': string;
    'aria-describedby': string;
    'aria-pressed'?: boolean;
    'aria-disabled'?: boolean;
  };
  listeners: {
    onPointerDown?: (event: React.PointerEvent) => void;
    onKeyDown?: (event: React.KeyboardEvent) => void;
  };
  setNodeRef: (node: HTMLElement | null) => void;
  setHandleRef: (node: HTMLElement | null) => void;
  transform: Position | null;
}

export interface DroppableProps {
  id: string;
  data?: Record<string, unknown>;
  disabled?: boolean;
  children: ReactNode | ((props: DroppableRenderProps) => ReactNode);
}

export interface DroppableRenderProps {
  isOver: boolean;
  active: DragItem | null;
  setNodeRef: (node: HTMLElement | null) => void;
}

export interface DragOverlayProps {
  children?: ReactNode;
  dropAnimation?: DropAnimation | null;
  style?: CSSProperties;
  className?: string;
  zIndex?: number;
  adjustScale?: boolean;
}

// ============================================================================
// Preset Types
// ============================================================================

export interface SortableContextValue {
  items: string[];
  activeIndex: number;
  overIndex: number;
  containerId: string;
  strategy: SortingStrategy;
}

export type SortingStrategy = (args: {
  activeIndex: number;
  overIndex: number;
  index: number;
  rects: Rect[];
  activeRect: Rect;
}) => { x: number; y: number; scaleX: number; scaleY: number } | null;

export interface SortableProps {
  items: string[];
  id?: string;
  strategy?: SortingStrategy;
  disabled?: boolean;
  children: ReactNode;
  onReorder?: (items: string[]) => void;
}

export interface SortableItemProps {
  id: string;
  disabled?: boolean;
  children: ReactNode | ((props: SortableItemRenderProps) => ReactNode);
}

export interface SortableItemRenderProps extends DraggableRenderProps {
  index: number;
  isSorting: boolean;
  transition: string | undefined;
}

export interface KanbanColumn {
  id: string;
  title: string;
  items: KanbanItem[];
}

export interface KanbanItem {
  id: string;
  content: ReactNode;
  data?: Record<string, unknown>;
}

export interface KanbanProps {
  columns: KanbanColumn[];
  onMove?: (itemId: string, fromColumn: string, toColumn: string, newIndex: number) => void;
  onReorder?: (columnId: string, items: string[]) => void;
  renderColumn?: (column: KanbanColumn, children: ReactNode) => ReactNode;
  renderItem?: (item: KanbanItem) => ReactNode;
}

export interface TreeNode {
  id: string;
  children?: TreeNode[];
  collapsed?: boolean;
  data?: Record<string, unknown>;
}

export interface TreeViewProps {
  data: TreeNode[];
  onMove?: (nodeId: string, newParentId: string | null, newIndex: number) => void;
  onCollapse?: (nodeId: string, collapsed: boolean) => void;
  renderNode?: (node: TreeNode, depth: number) => ReactNode;
  indentWidth?: number;
  collapsible?: boolean;
}

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileItem[];
}

export interface FileListProps {
  items: FileItem[];
  onReorder?: (items: FileItem[]) => void;
  onMove?: (itemId: string, targetFolderId: string | null) => void;
  renderItem?: (item: FileItem) => ReactNode;
}

export interface ImageItem {
  id: string;
  src: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface ImageGalleryProps {
  images: ImageItem[];
  columns?: number;
  gap?: number;
  onReorder?: (images: ImageItem[]) => void;
  renderImage?: (image: ImageItem, index: number) => ReactNode;
}
