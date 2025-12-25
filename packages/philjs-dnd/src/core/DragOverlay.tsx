import React, { useRef, useEffect, useMemo, type ReactNode, type CSSProperties } from 'react';
import { useDndContext } from './DndContext';
import type { DragOverlayProps, DropAnimation } from '../types';
import { defaultDropAnimation, applyDropAnimation } from '../utils/animations';

// ============================================================================
// DragOverlay Component
// ============================================================================

export function DragOverlay({
  children,
  dropAnimation = defaultDropAnimation,
  style,
  className,
  zIndex = 999,
  adjustScale = false,
}: DragOverlayProps) {
  const { state, activeNode } = useDndContext();

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const initialRectRef = useRef<DOMRect | null>(null);

  const { isDragging, activeItem, delta, initialPosition } = state;

  // Capture initial rect when drag starts
  useEffect(() => {
    if (isDragging && activeNode) {
      initialRectRef.current = activeNode.getBoundingClientRect();
    } else {
      initialRectRef.current = null;
    }
  }, [isDragging, activeNode]);

  // Apply drop animation when drag ends
  useEffect(() => {
    if (!isDragging && overlayRef.current && dropAnimation && initialRectRef.current) {
      const overlay = overlayRef.current;
      applyDropAnimation(overlay, dropAnimation);
    }
  }, [isDragging, dropAnimation]);

  // Calculate overlay styles
  const overlayStyle = useMemo<CSSProperties>(() => {
    if (!isDragging || !initialRectRef.current) {
      return { display: 'none' };
    }

    const rect = initialRectRef.current;

    return {
      position: 'fixed',
      left: rect.left + delta.x,
      top: rect.top + delta.y,
      width: rect.width,
      height: rect.height,
      zIndex,
      pointerEvents: 'none',
      touchAction: 'none',
      transform: adjustScale ? 'scale(1.02)' : undefined,
      transformOrigin: 'center center',
      willChange: 'transform',
      ...style,
    };
  }, [isDragging, delta, zIndex, adjustScale, style]);

  // Don't render if not dragging and no animation
  if (!isDragging && !children) {
    return null;
  }

  // Clone the active node content if no children provided
  const content = children ?? (
    isDragging && activeNode ? (
      <div
        dangerouslySetInnerHTML={{ __html: activeNode.outerHTML }}
        style={{ opacity: 0.8 }}
      />
    ) : null
  );

  return (
    <div
      ref={overlayRef}
      className={className}
      style={overlayStyle}
      aria-hidden="true"
      data-drag-overlay
    >
      {content}
    </div>
  );
}

// ============================================================================
// Snap Back Overlay
// ============================================================================

export function SnapBackOverlay({
  children,
  duration = 250,
  easing = 'ease',
  ...props
}: DragOverlayProps & { duration?: number; easing?: string }) {
  return (
    <DragOverlay
      {...props}
      dropAnimation={{
        duration,
        easing,
        sideEffects: ({ dragOverlay }) => {
          dragOverlay.style.transition = `transform ${duration}ms ${easing}, opacity ${duration}ms ${easing}`;
          dragOverlay.style.transform = 'translate3d(0, 0, 0)';
          dragOverlay.style.opacity = '0';
        },
      }}
    >
      {children}
    </DragOverlay>
  );
}

// ============================================================================
// Custom Overlay
// ============================================================================

export function CustomOverlay({
  children,
  render,
  ...props
}: DragOverlayProps & { render?: (activeItem: { id: string; type: string; data?: Record<string, unknown> } | null) => ReactNode }) {
  const { state } = useDndContext();

  return (
    <DragOverlay {...props}>
      {render ? render(state.activeItem) : children}
    </DragOverlay>
  );
}

export default DragOverlay;
