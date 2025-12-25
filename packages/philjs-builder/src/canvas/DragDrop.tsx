/**
 * Drag and Drop primitives for the visual builder
 */

import { signal, memo, effect, batch } from 'philjs-core';
import type { BuilderStore } from '../state/store.js';
import type {
  NodeId,
  ComponentNode,
  DragSource,
  DropTarget,
  DragState,
  ComponentType,
} from '../types.js';

// ============================================================================
// Types
// ============================================================================

export interface DragDropContextProps {
  store: BuilderStore;
  children: any;
  onDragStart?: (source: DragSource) => void;
  onDragMove?: (position: { x: number; y: number }, target: DropTarget | null) => void;
  onDragEnd?: (source: DragSource, target: DropTarget | null) => void;
  onDragCancel?: () => void;
}

export interface DraggableProps {
  store: BuilderStore;
  nodeId?: NodeId;
  componentType?: ComponentType;
  data?: any;
  disabled?: boolean;
  children: any;
  dragPreview?: any;
  onDragStart?: () => void;
  onDragEnd?: (dropped: boolean) => void;
}

export interface DroppableProps {
  store: BuilderStore;
  nodeId: NodeId;
  accept?: ComponentType[];
  disabled?: boolean;
  children: any;
  onDragEnter?: (source: DragSource) => void;
  onDragLeave?: () => void;
  onDrop?: (source: DragSource, position: 'before' | 'after' | 'inside') => void;
}

export interface DropIndicatorProps {
  position: 'before' | 'after' | 'inside';
  orientation?: 'horizontal' | 'vertical';
  visible: boolean;
}

// ============================================================================
// Drop Indicator Component
// ============================================================================

export function DropIndicator({
  position,
  orientation = 'horizontal',
  visible,
}: DropIndicatorProps) {
  if (!visible) return null;

  const style: Record<string, string | number> = {
    position: 'absolute',
    backgroundColor: '#0066ff',
    pointerEvents: 'none',
    zIndex: 1000,
    transition: 'opacity 0.15s ease',
  };

  if (position === 'inside') {
    return (
      <div
        style={{
          ...style,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'transparent',
          border: '2px dashed #0066ff',
          borderRadius: '4px',
        }}
      />
    );
  }

  if (orientation === 'horizontal') {
    if (position === 'before') {
      return (
        <div
          style={{
            ...style,
            top: 0,
            left: '-2px',
            width: '4px',
            height: '100%',
            borderRadius: '2px',
          }}
        />
      );
    } else {
      return (
        <div
          style={{
            ...style,
            top: 0,
            right: '-2px',
            width: '4px',
            height: '100%',
            borderRadius: '2px',
          }}
        />
      );
    }
  } else {
    if (position === 'before') {
      return (
        <div
          style={{
            ...style,
            top: '-2px',
            left: 0,
            width: '100%',
            height: '4px',
            borderRadius: '2px',
          }}
        />
      );
    } else {
      return (
        <div
          style={{
            ...style,
            bottom: '-2px',
            left: 0,
            width: '100%',
            height: '4px',
            borderRadius: '2px',
          }}
        />
      );
    }
  }
}

// ============================================================================
// Drag Preview Component
// ============================================================================

export interface DragPreviewProps {
  store: BuilderStore;
  children?: any;
}

export function DragPreview({ store, children }: DragPreviewProps) {
  const drag = store.drag;

  const style = memo(() => {
    const dragState = drag();
    if (!dragState.isDragging) return { display: 'none' };

    return {
      position: 'fixed' as const,
      left: dragState.position.x - dragState.offset.x,
      top: dragState.position.y - dragState.offset.y,
      pointerEvents: 'none' as const,
      zIndex: 10000,
      opacity: 0.8,
      transform: 'scale(1.02)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    };
  });

  const dragState = drag();
  if (!dragState.isDragging) return null;

  const defaultPreview = (
    <div
      style={{
        padding: '8px 16px',
        backgroundColor: '#0066ff',
        color: 'white',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: 500,
      }}
    >
      {dragState.source?.componentType || 'Component'}
    </div>
  );

  return (
    <div style={style()}>
      {children || dragState.preview || defaultPreview}
    </div>
  );
}

// ============================================================================
// Draggable Component
// ============================================================================

export function Draggable({
  store,
  nodeId,
  componentType,
  data,
  disabled,
  children,
  dragPreview,
  onDragStart,
  onDragEnd,
}: DraggableProps) {
  const isDragging = memo(() => {
    const dragState = store.drag();
    return dragState.isDragging && dragState.source?.nodeId === nodeId;
  });

  const handleDragStart = (event: DragEvent) => {
    if (disabled) return;

    event.stopPropagation();

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const offset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    const source: DragSource = {
      type: nodeId ? 'node' : 'palette',
      nodeId,
      componentType,
      data,
    };

    store.dispatch({ type: 'START_DRAG', payload: source });

    // Update initial position
    store.dispatch({
      type: 'UPDATE_DRAG',
      payload: {
        position: { x: event.clientX, y: event.clientY },
      },
    });

    // Set offset in drag state
    const currentDrag = store.drag();
    store.drag.set({
      ...currentDrag,
      offset,
      preview: dragPreview,
    });

    onDragStart?.();

    // Set drag image to empty (we'll render our own preview)
    const emptyImg = new Image();
    emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    event.dataTransfer?.setDragImage(emptyImg, 0, 0);
  };

  const handleDrag = (event: DragEvent) => {
    if (!store.drag().isDragging) return;

    // Prevent updating if the position is 0,0 (happens at the end of drag)
    if (event.clientX === 0 && event.clientY === 0) return;

    store.dispatch({
      type: 'UPDATE_DRAG',
      payload: {
        position: { x: event.clientX, y: event.clientY },
      },
    });
  };

  const handleDragEnd = (event: DragEvent) => {
    const dragState = store.drag();
    const dropped = dragState.target !== null;

    store.dispatch({ type: 'END_DRAG' });
    onDragEnd?.(dropped);
  };

  const style = isDragging() ? { opacity: 0.5 } : {};

  return (
    <div
      draggable={!disabled}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      style={{
        ...style,
        cursor: disabled ? 'default' : 'grab',
      }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Droppable Component
// ============================================================================

export function Droppable({
  store,
  nodeId,
  accept,
  disabled,
  children,
  onDragEnter,
  onDragLeave,
  onDrop,
}: DroppableProps) {
  const isOver = signal(false);
  const dropPosition = signal<'before' | 'after' | 'inside'>('inside');

  const canAccept = (source: DragSource): boolean => {
    if (disabled) return false;
    if (!accept) return true;
    if (source.componentType && accept.includes(source.componentType)) return true;
    if (source.nodeId) {
      const node = store.getNode(source.nodeId);
      if (node && accept.includes(node.type)) return true;
    }
    return false;
  };

  const calculateDropPosition = (
    event: DragEvent,
    element: HTMLElement
  ): 'before' | 'after' | 'inside' => {
    const rect = element.getBoundingClientRect();
    const y = event.clientY;
    const threshold = rect.height * 0.25;

    if (y < rect.top + threshold) {
      return 'before';
    } else if (y > rect.bottom - threshold) {
      return 'after';
    }
    return 'inside';
  };

  const handleDragEnter = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const dragState = store.drag();
    if (!dragState.isDragging || !dragState.source) return;

    if (!canAccept(dragState.source)) return;

    // Prevent dropping on self or descendants
    if (dragState.source.nodeId) {
      const descendants = store.getDescendants(dragState.source.nodeId);
      if (
        dragState.source.nodeId === nodeId ||
        descendants.some((d) => d.id === nodeId)
      ) {
        return;
      }
    }

    isOver.set(true);
    onDragEnter?.(dragState.source);
  };

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isOver()) return;

    const position = calculateDropPosition(event, event.currentTarget as HTMLElement);
    dropPosition.set(position);

    const target: DropTarget = {
      nodeId,
      position,
    };

    store.dispatch({
      type: 'UPDATE_DRAG',
      payload: {
        position: { x: event.clientX, y: event.clientY },
        target,
      },
    });
  };

  const handleDragLeave = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // Check if we're leaving to a child element
    const relatedTarget = event.relatedTarget as HTMLElement;
    const currentTarget = event.currentTarget as HTMLElement;
    if (relatedTarget && currentTarget.contains(relatedTarget)) {
      return;
    }

    isOver.set(false);
    onDragLeave?.();
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const dragState = store.drag();
    if (!dragState.isDragging || !dragState.source) return;

    if (!canAccept(dragState.source)) {
      isOver.set(false);
      return;
    }

    const position = dropPosition();

    // Handle the drop
    if (dragState.source.type === 'node' && dragState.source.nodeId) {
      // Moving an existing node
      handleNodeMove(dragState.source.nodeId, nodeId, position);
    } else if (dragState.source.type === 'palette' && dragState.source.componentType) {
      // Adding a new component from palette
      handleNewComponent(dragState.source.componentType, nodeId, position, dragState.source.data);
    }

    isOver.set(false);
    onDrop?.(dragState.source, position);
  };

  const handleNodeMove = (
    sourceId: NodeId,
    targetId: NodeId,
    position: 'before' | 'after' | 'inside'
  ) => {
    const sourceNode = store.getNode(sourceId);
    const targetNode = store.getNode(targetId);

    if (!sourceNode || !targetNode) return;

    let newParentId: NodeId;
    let insertIndex: number | undefined;

    if (position === 'inside') {
      newParentId = targetId;
      insertIndex = undefined;
    } else {
      newParentId = targetNode.parentId || store.rootId();
      const parent = store.getNode(newParentId);
      if (parent) {
        const targetIndex = parent.children.indexOf(targetId);
        insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
      }
    }

    store.dispatch({
      type: 'MOVE_NODE',
      payload: {
        nodeId: sourceId,
        newParentId,
        index: insertIndex,
      },
    });
  };

  const handleNewComponent = (
    componentType: ComponentType,
    targetId: NodeId,
    position: 'before' | 'after' | 'inside',
    data?: any
  ) => {
    const targetNode = store.getNode(targetId);
    if (!targetNode) return;

    const componentDef = store.components()[componentType];
    const newNode: ComponentNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: componentType,
      name: componentDef?.name || componentType,
      props: data?.props || {},
      styles: componentDef?.defaultStyles || {},
      children: [],
      parentId: null,
      events: [],
    };

    let parentId: NodeId;
    let insertIndex: number | undefined;

    if (position === 'inside') {
      parentId = targetId;
      insertIndex = undefined;
    } else {
      parentId = targetNode.parentId || store.rootId();
      const parent = store.getNode(parentId);
      if (parent) {
        const targetIndex = parent.children.indexOf(targetId);
        insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
      }
    }

    store.dispatch({
      type: 'ADD_NODE',
      payload: {
        node: newNode,
        parentId,
        index: insertIndex,
      },
    });

    // Select the new node
    store.dispatch({
      type: 'SELECT_NODE',
      payload: { nodeId: newNode.id },
    });
  };

  const showIndicator = memo(() => {
    return isOver() && store.drag().isDragging;
  });

  return (
    <div
      style={{ position: 'relative' }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
      <DropIndicator
        position={dropPosition()}
        orientation="vertical"
        visible={showIndicator()}
      />
    </div>
  );
}

// ============================================================================
// Drag Drop Context Component
// ============================================================================

export function DragDropContext({
  store,
  children,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragCancel,
}: DragDropContextProps) {
  // Set up global mouse move handler for drag tracking
  effect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const dragState = store.drag();
      if (!dragState.isDragging) return;

      store.dispatch({
        type: 'UPDATE_DRAG',
        payload: {
          position: { x: event.clientX, y: event.clientY },
        },
      });

      onDragMove?.(
        { x: event.clientX, y: event.clientY },
        dragState.target
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && store.drag().isDragging) {
        store.dispatch({ type: 'CANCEL_DRAG' });
        onDragCancel?.();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
    };
  });

  // Track drag state changes
  effect(() => {
    const dragState = store.drag();

    if (dragState.isDragging && dragState.source) {
      onDragStart?.(dragState.source);
    }
  });

  return (
    <>
      {children}
      <DragPreview store={store} />
    </>
  );
}

export default {
  DragDropContext,
  Draggable,
  Droppable,
  DropIndicator,
  DragPreview,
};
