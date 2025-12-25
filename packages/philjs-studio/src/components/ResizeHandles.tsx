import React, { useCallback, useState, useEffect } from 'react';
import type { Bounds } from '../state/EditorStore';

export type ResizeDirection =
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w'
  | 'nw';

export interface ResizeHandlesProps {
  bounds: Bounds;
  zoom: number;
  isLocked: boolean;
  minWidth?: number;
  minHeight?: number;
  maintainAspectRatio?: boolean;
  onResizeStart?: (direction: ResizeDirection) => void;
  onResize?: (newBounds: Bounds) => void;
  onResizeEnd?: (newBounds: Bounds) => void;
}

interface HandlePosition {
  direction: ResizeDirection;
  style: React.CSSProperties;
  cursor: string;
}

export const ResizeHandles: React.FC<ResizeHandlesProps> = ({
  bounds,
  zoom,
  isLocked,
  minWidth = 20,
  minHeight = 20,
  maintainAspectRatio = false,
  onResizeStart,
  onResize,
  onResizeEnd,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null);
  const [startBounds, setStartBounds] = useState<Bounds | null>(null);
  const [startMouse, setStartMouse] = useState<{ x: number; y: number } | null>(null);

  const handleSize = 8 / zoom;
  const handleOffset = -handleSize / 2;

  const handlePositions: HandlePosition[] = [
    {
      direction: 'n',
      style: { top: handleOffset, left: '50%', transform: 'translateX(-50%)' },
      cursor: 'ns-resize',
    },
    {
      direction: 'ne',
      style: { top: handleOffset, right: handleOffset },
      cursor: 'nesw-resize',
    },
    {
      direction: 'e',
      style: { right: handleOffset, top: '50%', transform: 'translateY(-50%)' },
      cursor: 'ew-resize',
    },
    {
      direction: 'se',
      style: { bottom: handleOffset, right: handleOffset },
      cursor: 'nwse-resize',
    },
    {
      direction: 's',
      style: { bottom: handleOffset, left: '50%', transform: 'translateX(-50%)' },
      cursor: 'ns-resize',
    },
    {
      direction: 'sw',
      style: { bottom: handleOffset, left: handleOffset },
      cursor: 'nesw-resize',
    },
    {
      direction: 'w',
      style: { left: handleOffset, top: '50%', transform: 'translateY(-50%)' },
      cursor: 'ew-resize',
    },
    {
      direction: 'nw',
      style: { top: handleOffset, left: handleOffset },
      cursor: 'nwse-resize',
    },
  ];

  const handleMouseDown = useCallback(
    (direction: ResizeDirection) => (e: React.MouseEvent) => {
      if (isLocked) return;
      e.stopPropagation();
      e.preventDefault();

      setIsResizing(true);
      setResizeDirection(direction);
      setStartBounds({ ...bounds });
      setStartMouse({ x: e.clientX, y: e.clientY });
      onResizeStart?.(direction);
    },
    [bounds, isLocked, onResizeStart]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !startBounds || !startMouse || !resizeDirection) return;

      const dx = (e.clientX - startMouse.x) / zoom;
      const dy = (e.clientY - startMouse.y) / zoom;

      let newBounds: Bounds = { ...startBounds };

      // Handle each resize direction
      switch (resizeDirection) {
        case 'n':
          newBounds.y = startBounds.y + dy;
          newBounds.height = Math.max(minHeight, startBounds.height - dy);
          if (newBounds.height === minHeight) {
            newBounds.y = startBounds.y + startBounds.height - minHeight;
          }
          break;
        case 'ne':
          newBounds.y = startBounds.y + dy;
          newBounds.height = Math.max(minHeight, startBounds.height - dy);
          newBounds.width = Math.max(minWidth, startBounds.width + dx);
          if (newBounds.height === minHeight) {
            newBounds.y = startBounds.y + startBounds.height - minHeight;
          }
          break;
        case 'e':
          newBounds.width = Math.max(minWidth, startBounds.width + dx);
          break;
        case 'se':
          newBounds.width = Math.max(minWidth, startBounds.width + dx);
          newBounds.height = Math.max(minHeight, startBounds.height + dy);
          break;
        case 's':
          newBounds.height = Math.max(minHeight, startBounds.height + dy);
          break;
        case 'sw':
          newBounds.x = startBounds.x + dx;
          newBounds.width = Math.max(minWidth, startBounds.width - dx);
          newBounds.height = Math.max(minHeight, startBounds.height + dy);
          if (newBounds.width === minWidth) {
            newBounds.x = startBounds.x + startBounds.width - minWidth;
          }
          break;
        case 'w':
          newBounds.x = startBounds.x + dx;
          newBounds.width = Math.max(minWidth, startBounds.width - dx);
          if (newBounds.width === minWidth) {
            newBounds.x = startBounds.x + startBounds.width - minWidth;
          }
          break;
        case 'nw':
          newBounds.x = startBounds.x + dx;
          newBounds.y = startBounds.y + dy;
          newBounds.width = Math.max(minWidth, startBounds.width - dx);
          newBounds.height = Math.max(minHeight, startBounds.height - dy);
          if (newBounds.width === minWidth) {
            newBounds.x = startBounds.x + startBounds.width - minWidth;
          }
          if (newBounds.height === minHeight) {
            newBounds.y = startBounds.y + startBounds.height - minHeight;
          }
          break;
      }

      // Maintain aspect ratio if required
      if (maintainAspectRatio && startBounds.width && startBounds.height) {
        const aspectRatio = startBounds.width / startBounds.height;
        const isCorner = ['ne', 'se', 'sw', 'nw'].includes(resizeDirection);

        if (isCorner) {
          const currentAspect = newBounds.width / newBounds.height;
          if (currentAspect > aspectRatio) {
            newBounds.width = newBounds.height * aspectRatio;
          } else {
            newBounds.height = newBounds.width / aspectRatio;
          }
        }
      }

      onResize?.(newBounds);
    },
    [isResizing, startBounds, startMouse, resizeDirection, zoom, minWidth, minHeight, maintainAspectRatio, onResize]
  );

  const handleMouseUp = useCallback(() => {
    if (isResizing && startBounds) {
      const finalBounds = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      };
      onResizeEnd?.(finalBounds);
    }
    setIsResizing(false);
    setResizeDirection(null);
    setStartBounds(null);
    setStartMouse(null);
  }, [isResizing, bounds, startBounds, onResizeEnd]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  if (isLocked) return null;

  return (
    <div
      className="resize-handles"
      style={{
        position: 'absolute',
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height,
        pointerEvents: 'none',
      }}
    >
      {handlePositions.map(({ direction, style, cursor }) => (
        <div
          key={direction}
          className={`resize-handle resize-handle-${direction}`}
          style={{
            position: 'absolute',
            width: handleSize,
            height: handleSize,
            backgroundColor: '#fff',
            border: `${1 / zoom}px solid #3B82F6`,
            borderRadius: handleSize > 6 ? 2 / zoom : 0,
            cursor,
            pointerEvents: 'auto',
            ...style,
          }}
          onMouseDown={handleMouseDown(direction)}
        />
      ))}
    </div>
  );
};

export interface RotationHandleProps {
  bounds: Bounds;
  zoom: number;
  rotation: number;
  onRotationStart?: () => void;
  onRotate?: (angle: number) => void;
  onRotationEnd?: (angle: number) => void;
}

export const RotationHandle: React.FC<RotationHandleProps> = ({
  bounds,
  zoom,
  rotation,
  onRotationStart,
  onRotate,
  onRotationEnd,
}) => {
  const [isRotating, setIsRotating] = useState(false);
  const [center, setCenter] = useState({ x: 0, y: 0 });

  const handleSize = 10 / zoom;
  const handleOffset = 24 / zoom;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      setIsRotating(true);
      setCenter({
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height / 2,
      });
      onRotationStart?.();
    },
    [bounds, onRotationStart]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isRotating) return;

      const angle = Math.atan2(
        e.clientY / zoom - center.y,
        e.clientX / zoom - center.x
      );
      const degrees = (angle * 180) / Math.PI + 90;
      onRotate?.(degrees);
    },
    [isRotating, center, zoom, onRotate]
  );

  const handleMouseUp = useCallback(() => {
    if (isRotating) {
      onRotationEnd?.(rotation);
    }
    setIsRotating(false);
  }, [isRotating, rotation, onRotationEnd]);

  useEffect(() => {
    if (isRotating) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isRotating, handleMouseMove, handleMouseUp]);

  return (
    <>
      {/* Line connecting to rotation handle */}
      <div
        style={{
          position: 'absolute',
          left: bounds.x + bounds.width / 2,
          top: bounds.y - handleOffset + handleSize / 2,
          width: 1 / zoom,
          height: handleOffset - handleSize / 2,
          backgroundColor: '#3B82F6',
          pointerEvents: 'none',
        }}
      />
      {/* Rotation handle */}
      <div
        className="rotation-handle"
        style={{
          position: 'absolute',
          left: bounds.x + bounds.width / 2 - handleSize / 2,
          top: bounds.y - handleOffset - handleSize / 2,
          width: handleSize,
          height: handleSize,
          backgroundColor: '#fff',
          border: `${1.5 / zoom}px solid #3B82F6`,
          borderRadius: '50%',
          cursor: 'grab',
          pointerEvents: 'auto',
        }}
        onMouseDown={handleMouseDown}
      />
    </>
  );
};

export default ResizeHandles;
