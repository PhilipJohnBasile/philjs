import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useEditorStore, useIsSelected, useIsHovered } from '../state/EditorStore';
import { SelectionBox } from './SelectionBox';
import { ResizeHandles } from './ResizeHandles';
import type { ComponentNode, Bounds, Position } from '../state/EditorStore';

export interface DraggableComponentProps {
  component: ComponentNode;
  zoom: number;
  gridSize: number;
  snapToGrid: boolean;
  children: React.ReactNode;
  onDoubleClick?: (component: ComponentNode) => void;
}

export const DraggableComponent: React.FC<DraggableComponentProps> = ({
  component,
  zoom,
  gridSize,
  snapToGrid,
  children,
  onDoubleClick,
}) => {
  const { id, bounds, isLocked, isVisible, name } = component;

  const isSelected = useIsSelected(id);
  const isHovered = useIsHovered(id);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position | null>(null);
  const [initialBounds, setInitialBounds] = useState<Bounds | null>(null);
  const [currentBounds, setCurrentBounds] = useState<Bounds>(bounds);

  const componentRef = useRef<HTMLDivElement>(null);

  const {
    select,
    setHovered,
    updateBounds,
    pushHistory,
    setDragging: setStoreDragging,
  } = useEditorStore();

  // Sync local bounds with store bounds
  useEffect(() => {
    setCurrentBounds(bounds);
  }, [bounds]);

  const snapToGridValue = useCallback(
    (value: number): number => {
      if (!snapToGrid) return value;
      return Math.round(value / gridSize) * gridSize;
    },
    [snapToGrid, gridSize]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isLocked) return;
      if (e.button !== 0) return; // Only left click

      e.stopPropagation();

      // Handle selection
      const isShiftClick = e.shiftKey;
      select(id, isShiftClick);

      // Start drag
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setInitialBounds({ ...bounds });
      setStoreDragging(true);
    },
    [id, bounds, isLocked, select, setStoreDragging]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragStart || !initialBounds) return;

      const dx = (e.clientX - dragStart.x) / zoom;
      const dy = (e.clientY - dragStart.y) / zoom;

      const newX = snapToGridValue(initialBounds.x + dx);
      const newY = snapToGridValue(initialBounds.y + dy);

      setCurrentBounds({
        ...initialBounds,
        x: newX,
        y: newY,
      });
    },
    [isDragging, dragStart, initialBounds, zoom, snapToGridValue]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging && initialBounds) {
      // Commit the change to store
      updateBounds(id, {
        x: currentBounds.x,
        y: currentBounds.y,
      });
      pushHistory('Move component');
    }

    setIsDragging(false);
    setDragStart(null);
    setInitialBounds(null);
    setStoreDragging(false);
  }, [isDragging, initialBounds, id, currentBounds, updateBounds, pushHistory, setStoreDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleMouseEnter = useCallback(() => {
    if (!isDragging) {
      setHovered(id);
    }
  }, [id, isDragging, setHovered]);

  const handleMouseLeave = useCallback(() => {
    if (!isDragging) {
      setHovered(null);
    }
  }, [isDragging, setHovered]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDoubleClick?.(component);
    },
    [component, onDoubleClick]
  );

  const handleResizeStart = useCallback(() => {
    setStoreDragging(true);
  }, [setStoreDragging]);

  const handleResize = useCallback((newBounds: Bounds) => {
    setCurrentBounds(newBounds);
  }, []);

  const handleResizeEnd = useCallback(
    (newBounds: Bounds) => {
      updateBounds(id, newBounds);
      pushHistory('Resize component');
      setStoreDragging(false);
    },
    [id, updateBounds, pushHistory, setStoreDragging]
  );

  if (!isVisible) return null;

  return (
    <>
      {/* Component wrapper */}
      <div
        ref={componentRef}
        className="draggable-component"
        style={{
          position: 'absolute',
          left: currentBounds.x,
          top: currentBounds.y,
          width: currentBounds.width,
          height: currentBounds.height,
          cursor: isLocked ? 'default' : isDragging ? 'grabbing' : 'grab',
          opacity: isVisible ? 1 : 0.3,
          userSelect: 'none',
          outline: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
        data-component-id={id}
        data-component-type={component.type}
      >
        {/* Rendered component content */}
        <div
          style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          {children}
        </div>
      </div>

      {/* Selection box overlay */}
      <SelectionBox
        bounds={currentBounds}
        isSelected={isSelected}
        isHovered={isHovered}
        isLocked={isLocked}
        zoom={zoom}
        showLabel={true}
        label={name}
      />

      {/* Resize handles */}
      {isSelected && (
        <ResizeHandles
          bounds={currentBounds}
          zoom={zoom}
          isLocked={isLocked}
          onResizeStart={handleResizeStart}
          onResize={handleResize}
          onResizeEnd={handleResizeEnd}
        />
      )}
    </>
  );
};

export interface DropZoneProps {
  parentId: string | null;
  index: number;
  isActive: boolean;
  onDrop: (parentId: string | null, index: number) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  parentId,
  index,
  isActive,
  onDrop,
}) => {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onDrop(parentId, index);
    },
    [parentId, index, onDrop]
  );

  return (
    <div
      className="drop-zone"
      style={{
        position: 'absolute',
        height: 4,
        left: 0,
        right: 0,
        backgroundColor: isActive ? '#3B82F6' : 'transparent',
        transition: 'background-color 0.15s ease',
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    />
  );
};

export default DraggableComponent;
