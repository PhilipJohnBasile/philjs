import React, { useRef, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useDndContext } from './DndContext';
import type { DroppableProps, DroppableRenderProps } from '../types';

// ============================================================================
// Droppable Component
// ============================================================================

export function Droppable({
  id,
  data,
  disabled = false,
  children,
}: DroppableProps) {
  const { state, registerDroppable, unregisterDroppable } = useDndContext();

  const nodeRef = useRef<HTMLElement | null>(null);

  const isOver = state.overId === id && !disabled;
  const active = state.activeItem;

  // Set node ref and register/unregister droppable
  const setNodeRef = useCallback(
    (node: HTMLElement | null) => {
      // Unregister previous node
      if (nodeRef.current && nodeRef.current !== node) {
        unregisterDroppable(id);
      }

      nodeRef.current = node;

      // Register new node
      if (node && !disabled) {
        registerDroppable(id, node, data);
      }
    },
    [id, data, disabled, registerDroppable, unregisterDroppable]
  );

  // Update registration when data changes
  useEffect(() => {
    if (nodeRef.current && !disabled) {
      registerDroppable(id, nodeRef.current, data);
    }
  }, [id, data, disabled, registerDroppable]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unregisterDroppable(id);
    };
  }, [id, unregisterDroppable]);

  // Re-register when disabled state changes
  useEffect(() => {
    if (nodeRef.current) {
      if (disabled) {
        unregisterDroppable(id);
      } else {
        registerDroppable(id, nodeRef.current, data);
      }
    }
  }, [id, data, disabled, registerDroppable, unregisterDroppable]);

  // Render props
  const renderProps: DroppableRenderProps = useMemo(
    () => ({
      isOver,
      active,
      setNodeRef,
    }),
    [isOver, active, setNodeRef]
  );

  // Render
  if (typeof children === 'function') {
    return <>{children(renderProps)}</>;
  }

  return (
    <div
      ref={setNodeRef as React.Ref<HTMLDivElement>}
      data-droppable-id={id}
      data-droppable-disabled={disabled}
      style={{
        // Visual feedback for drop zone
        outline: isOver ? '2px dashed #4a90d9' : undefined,
        outlineOffset: isOver ? '2px' : undefined,
        transition: 'outline 150ms ease',
      }}
    >
      {children}
    </div>
  );
}

export default Droppable;
