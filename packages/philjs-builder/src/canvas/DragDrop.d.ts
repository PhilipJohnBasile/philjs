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
    position: {
        x: number;
        y: number;
    };
    visible?: boolean;
}
export interface DragPreviewProps {
    id: string;
    children?: unknown;
}
export declare function DragDropContext(_props: DragDropContextProps): HTMLElement;
export declare function Draggable(_props: DraggableProps): HTMLElement;
export declare function Droppable(_props: DroppableProps): HTMLElement;
export declare function DropIndicator(_props: DropIndicatorProps): HTMLElement;
export declare function DragPreview(_props: DragPreviewProps): HTMLElement;
//# sourceMappingURL=DragDrop.d.ts.map