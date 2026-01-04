/**
 * PhilJS Drag and Drop - Type Definitions
 * Pure TypeScript - No React
 */
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
    data?: Record<string, unknown>;
}
export interface DropTarget {
    id: string;
    rect: Rect;
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
export interface DragStartEvent {
    active: DragItem;
    initialPosition: Position;
}
export interface DragMoveEvent {
    active: DragItem;
    delta: Position;
    currentPosition: Position;
    over: DropTarget | null;
}
export interface DragOverEvent {
    active: DragItem;
    over: DropTarget;
}
export interface DragEndEvent {
    active: DragItem;
    over: DropTarget | null;
    delta: Position;
}
export interface DragCancelEvent {
    active: DragItem;
}
export interface CollisionArgs {
    active: DragItem;
    activeRect: Rect;
    droppables: Map<string, {
        id: string;
        rect: Rect;
        node: HTMLElement;
        data?: Record<string, unknown>;
    }>;
}
export type CollisionDetection = (args: CollisionArgs) => DropTarget | null;
export interface ModifierArgs {
    transform: Position;
    active: DragItem;
    activeRect: Rect | null;
    containerRect: Rect | null;
}
export type Modifier = (args: ModifierArgs) => Position;
export interface SensorOptions {
    activationConstraint?: {
        distance?: number;
        delay?: number;
        tolerance?: number;
    };
}
export interface SensorHandlers {
    onStart(position: Position): void;
    onMove(position: Position): void;
    onEnd(position: Position): void;
    onCancel(): void;
}
export interface Sensor {
    type: string;
    options: SensorOptions;
    activate(event: Event, handlers: SensorHandlers): void;
    deactivate(): void;
}
export type SensorFactory = (options?: SensorOptions) => Sensor;
export interface SensorDescriptor {
    sensor: SensorFactory;
    options?: SensorOptions;
}
export interface DndConfig {
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
export interface AnimationConfig {
    duration: number;
    easing: string;
}
export interface DropAnimationSideEffects {
    active: {
        id: string;
        type: string;
    };
    dragOverlay: HTMLElement;
}
export interface DropAnimation {
    duration: number;
    easing: string;
    sideEffects?: (args: DropAnimationSideEffects) => void;
}
//# sourceMappingURL=types.d.ts.map