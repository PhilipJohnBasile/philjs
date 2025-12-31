/**
 * Component Tree for the visual builder
 */
import type { NodeId, ComponentNode } from '../types.js';
export interface TreeState {
    expandedIds: Set<NodeId>;
    selectedIds: Set<NodeId>;
    draggedId: NodeId | null;
    dropTargetId: NodeId | null;
}
export interface TreeNodeProps {
    node: ComponentNode;
    depth?: number;
    isExpanded?: boolean;
    isSelected?: boolean;
    isDragging?: boolean;
    isDropTarget?: boolean;
    onToggle?: () => void;
    onSelect?: () => void;
    onDragStart?: () => void;
    onDragOver?: () => void;
    onDrop?: () => void;
    children?: unknown;
}
export interface ComponentTreeProps {
    nodes: Record<NodeId, ComponentNode>;
    rootId: NodeId;
    selectedIds?: NodeId[];
    expandedIds?: NodeId[];
    onSelect?: (nodeId: NodeId, addToSelection?: boolean) => void;
    onToggle?: (nodeId: NodeId) => void;
    onMove?: (nodeId: NodeId, newParentId: NodeId, index?: number) => void;
    onRename?: (nodeId: NodeId, newName: string) => void;
    onDelete?: (nodeId: NodeId) => void;
    onDuplicate?: (nodeId: NodeId) => void;
}
export declare function ComponentTree(_props: ComponentTreeProps): unknown;
//# sourceMappingURL=ComponentTree.d.ts.map