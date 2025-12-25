import React, { useRef, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useDndContext } from './DndContext';
import type { DraggableProps, DraggableRenderProps, Position } from '../types';

// ============================================================================
// Draggable Component
// ============================================================================

export function Draggable({
  id,
  type = 'default',
  data,
  disabled = false,
  children,
  handle = false,
}: DraggableProps) {
  const { state, startDrag, updateDrag, endDrag, cancelDrag } = useDndContext();

  const nodeRef = useRef<HTMLElement | null>(null);
  const handleRef = useRef<HTMLElement | null>(null);
  const isDraggingRef = useRef(false);

  const isDragging = state.activeId === id;
  const isOver = state.overId === id;

  // Set node ref
  const setNodeRef = useCallback((node: HTMLElement | null) => {
    nodeRef.current = node;
  }, []);

  // Set handle ref
  const setHandleRef = useCallback((node: HTMLElement | null) => {
    handleRef.current = node;
  }, []);

  // Get the element that triggers drag
  const getDragElement = useCallback(() => {
    return handle ? handleRef.current : nodeRef.current;
  }, [handle]);

  // Handle pointer down
  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (disabled) return;

      const dragElement = getDragElement();
      const targetElement = nodeRef.current;

      if (!dragElement || !targetElement) return;

      // Only start if clicking on the drag element (or its children)
      if (!dragElement.contains(event.target as Node)) return;

      event.preventDefault();

      const position: Position = {
        x: event.clientX,
        y: event.clientY,
      };

      isDraggingRef.current = true;

      startDrag(
        { id, type, data },
        targetElement,
        position
      );

      // Add global listeners
      const handlePointerMove = (e: PointerEvent) => {
        if (!isDraggingRef.current) return;
        updateDrag({ x: e.clientX, y: e.clientY });
      };

      const handlePointerUp = () => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        endDrag();
        cleanup();
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          isDraggingRef.current = false;
          cancelDrag();
          cleanup();
        }
      };

      const cleanup = () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
        document.removeEventListener('keydown', handleKeyDown);
      };

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      document.addEventListener('keydown', handleKeyDown);
    },
    [disabled, getDragElement, id, type, data, startDrag, updateDrag, endDrag, cancelDrag]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (disabled) return;

      const targetElement = nodeRef.current;
      if (!targetElement) return;

      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();

        if (!isDraggingRef.current) {
          // Start keyboard drag
          isDraggingRef.current = true;
          const rect = targetElement.getBoundingClientRect();
          const position: Position = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          };
          startDrag({ id, type, data }, targetElement, position);
        } else {
          // End keyboard drag
          isDraggingRef.current = false;
          endDrag();
        }
      } else if (isDraggingRef.current) {
        // Arrow key navigation during keyboard drag
        const moveDistance = event.shiftKey ? 50 : 10;
        let deltaX = 0;
        let deltaY = 0;

        switch (event.key) {
          case 'ArrowUp':
            deltaY = -moveDistance;
            break;
          case 'ArrowDown':
            deltaY = moveDistance;
            break;
          case 'ArrowLeft':
            deltaX = -moveDistance;
            break;
          case 'ArrowRight':
            deltaX = moveDistance;
            break;
          case 'Escape':
            isDraggingRef.current = false;
            cancelDrag();
            return;
          default:
            return;
        }

        event.preventDefault();

        if (state.currentPosition) {
          updateDrag({
            x: state.currentPosition.x + deltaX,
            y: state.currentPosition.y + deltaY,
          });
        }
      }
    },
    [disabled, id, type, data, state.currentPosition, startDrag, updateDrag, endDrag, cancelDrag]
  );

  // Calculate transform
  const transform = useMemo(() => {
    if (!isDragging) return null;
    return state.delta;
  }, [isDragging, state.delta]);

  // Accessibility attributes
  const attributes = useMemo(
    () => ({
      role: 'button',
      tabIndex: disabled ? -1 : 0,
      'aria-roledescription': 'draggable',
      'aria-describedby': 'dnd-instructions',
      'aria-pressed': isDragging ? true : undefined,
      'aria-disabled': disabled ? true : undefined,
    }),
    [disabled, isDragging]
  );

  // Event listeners
  const listeners = useMemo(
    () =>
      disabled
        ? {}
        : {
            onPointerDown: handlePointerDown,
            onKeyDown: handleKeyDown,
          },
    [disabled, handlePointerDown, handleKeyDown]
  );

  // Render props
  const renderProps: DraggableRenderProps = useMemo(
    () => ({
      isDragging,
      isOver,
      attributes,
      listeners,
      setNodeRef,
      setHandleRef,
      transform,
    }),
    [isDragging, isOver, attributes, listeners, setNodeRef, setHandleRef, transform]
  );

  // Render
  if (typeof children === 'function') {
    return <>{children(renderProps)}</>;
  }

  return (
    <div
      ref={setNodeRef as React.Ref<HTMLDivElement>}
      {...attributes}
      {...listeners}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      {children}
    </div>
  );
}

export default Draggable;
