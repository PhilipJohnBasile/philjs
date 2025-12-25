import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  useContext,
  createContext,
} from 'react';
import { useDndContext } from './core/DndContext';
import type {
  DragItem,
  Position,
  Rect,
  DraggableRenderProps,
  DroppableRenderProps,
  SortableItemRenderProps,
  DragStartEvent,
  DragMoveEvent,
  DragOverEvent,
  DragEndEvent,
  DragCancelEvent,
} from './types';

// ============================================================================
// useDraggable Hook
// ============================================================================

export interface UseDraggableOptions {
  id: string;
  type?: string;
  data?: Record<string, unknown>;
  disabled?: boolean;
}

export interface UseDraggableReturn {
  isDragging: boolean;
  isOver: boolean;
  attributes: DraggableRenderProps['attributes'];
  listeners: DraggableRenderProps['listeners'];
  setNodeRef: (node: HTMLElement | null) => void;
  setHandleRef: (node: HTMLElement | null) => void;
  transform: Position | null;
  node: HTMLElement | null;
}

export function useDraggable(options: UseDraggableOptions): UseDraggableReturn {
  const { id, type = 'default', data, disabled = false } = options;
  const { state, startDrag, updateDrag, endDrag, cancelDrag } = useDndContext();

  const nodeRef = useRef<HTMLElement | null>(null);
  const handleRef = useRef<HTMLElement | null>(null);
  const isDraggingRef = useRef(false);

  const isDragging = state.activeId === id;
  const isOver = state.overId === id;

  const setNodeRef = useCallback((node: HTMLElement | null) => {
    nodeRef.current = node;
  }, []);

  const setHandleRef = useCallback((node: HTMLElement | null) => {
    handleRef.current = node;
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (disabled || !nodeRef.current) return;

      event.preventDefault();
      isDraggingRef.current = true;

      const position: Position = {
        x: event.clientX,
        y: event.clientY,
      };

      startDrag({ id, type, data }, nodeRef.current, position);

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
    [disabled, id, type, data, startDrag, updateDrag, endDrag, cancelDrag]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (disabled || !nodeRef.current) return;

      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();

        if (!isDraggingRef.current) {
          isDraggingRef.current = true;
          const rect = nodeRef.current.getBoundingClientRect();
          startDrag(
            { id, type, data },
            nodeRef.current,
            { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
          );
        } else {
          isDraggingRef.current = false;
          endDrag();
        }
      } else if (isDraggingRef.current && event.key === 'Escape') {
        isDraggingRef.current = false;
        cancelDrag();
      } else if (isDraggingRef.current && state.currentPosition) {
        const step = event.shiftKey ? 50 : 10;
        let deltaX = 0;
        let deltaY = 0;

        switch (event.key) {
          case 'ArrowUp': deltaY = -step; break;
          case 'ArrowDown': deltaY = step; break;
          case 'ArrowLeft': deltaX = -step; break;
          case 'ArrowRight': deltaX = step; break;
          default: return;
        }

        event.preventDefault();
        updateDrag({
          x: state.currentPosition.x + deltaX,
          y: state.currentPosition.y + deltaY,
        });
      }
    },
    [disabled, id, type, data, state.currentPosition, startDrag, updateDrag, endDrag, cancelDrag]
  );

  const attributes = useMemo(
    () => ({
      role: 'button' as const,
      tabIndex: disabled ? -1 : 0,
      'aria-roledescription': 'draggable',
      'aria-describedby': 'dnd-instructions',
      'aria-pressed': isDragging ? true : undefined,
      'aria-disabled': disabled ? true : undefined,
    }),
    [disabled, isDragging]
  );

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

  const transform = useMemo(() => {
    if (!isDragging) return null;
    return state.delta;
  }, [isDragging, state.delta]);

  return {
    isDragging,
    isOver,
    attributes,
    listeners,
    setNodeRef,
    setHandleRef,
    transform,
    node: nodeRef.current,
  };
}

// ============================================================================
// useDroppable Hook
// ============================================================================

export interface UseDroppableOptions {
  id: string;
  data?: Record<string, unknown>;
  disabled?: boolean;
}

export interface UseDroppableReturn {
  isOver: boolean;
  active: DragItem | null;
  setNodeRef: (node: HTMLElement | null) => void;
  node: HTMLElement | null;
}

export function useDroppable(options: UseDroppableOptions): UseDroppableReturn {
  const { id, data, disabled = false } = options;
  const { state, registerDroppable, unregisterDroppable } = useDndContext();

  const nodeRef = useRef<HTMLElement | null>(null);

  const isOver = state.overId === id && !disabled;
  const active = state.activeItem;

  const setNodeRef = useCallback(
    (node: HTMLElement | null) => {
      if (nodeRef.current && nodeRef.current !== node) {
        unregisterDroppable(id);
      }

      nodeRef.current = node;

      if (node && !disabled) {
        registerDroppable(id, node, data);
      }
    },
    [id, data, disabled, registerDroppable, unregisterDroppable]
  );

  useEffect(() => {
    if (nodeRef.current && !disabled) {
      registerDroppable(id, nodeRef.current, data);
    }
  }, [id, data, disabled, registerDroppable]);

  useEffect(() => {
    return () => {
      unregisterDroppable(id);
    };
  }, [id, unregisterDroppable]);

  return {
    isOver,
    active,
    setNodeRef,
    node: nodeRef.current,
  };
}

// ============================================================================
// useSortable Hook
// ============================================================================

export interface SortableContextValue {
  items: string[];
  activeIndex: number;
  overIndex: number;
  containerId: string;
}

export const SortableContext = createContext<SortableContextValue | null>(null);

export function useSortableContext(): SortableContextValue | null {
  return useContext(SortableContext);
}

export interface UseSortableOptions {
  id: string;
  disabled?: boolean;
  data?: Record<string, unknown>;
}

export interface UseSortableReturn extends UseDraggableReturn {
  index: number;
  isSorting: boolean;
  overIndex: number;
  activeIndex: number;
  transition: string | undefined;
  items: string[];
}

export function useSortable(options: UseSortableOptions): UseSortableReturn {
  const { id, disabled = false, data } = options;
  const sortableContext = useSortableContext();
  const draggable = useDraggable({ id, type: 'sortable', data, disabled });
  const droppable = useDroppable({ id, data, disabled });

  const items = sortableContext?.items ?? [];
  const index = items.indexOf(id);
  const activeIndex = sortableContext?.activeIndex ?? -1;
  const overIndex = sortableContext?.overIndex ?? -1;
  const isSorting = activeIndex !== -1;

  // Calculate transition for smooth reordering
  const transition = useMemo(() => {
    if (!isSorting || draggable.isDragging) return undefined;
    return 'transform 200ms ease';
  }, [isSorting, draggable.isDragging]);

  // Combine refs
  const setNodeRef = useCallback(
    (node: HTMLElement | null) => {
      draggable.setNodeRef(node);
      droppable.setNodeRef(node);
    },
    [draggable, droppable]
  );

  return {
    ...draggable,
    setNodeRef,
    isOver: droppable.isOver,
    index,
    isSorting,
    overIndex,
    activeIndex,
    transition,
    items,
  };
}

// ============================================================================
// useDndMonitor Hook
// ============================================================================

export interface DndMonitorOptions {
  onDragStart?: (event: DragStartEvent) => void;
  onDragMove?: (event: DragMoveEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragCancel?: (event: DragCancelEvent) => void;
}

export function useDndMonitor(options: DndMonitorOptions): void {
  const { state } = useDndContext();
  const optionsRef = useRef(options);
  const prevStateRef = useRef(state);

  // Keep options ref updated
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Monitor state changes and call appropriate callbacks
  useEffect(() => {
    const prevState = prevStateRef.current;
    const currentOptions = optionsRef.current;

    // Drag started
    if (!prevState.isDragging && state.isDragging && state.activeItem && state.initialPosition) {
      currentOptions.onDragStart?.({
        active: state.activeItem,
        initialPosition: state.initialPosition,
      });
    }

    // Drag moved
    if (state.isDragging && state.activeItem && state.currentPosition) {
      const hasMoved =
        prevState.currentPosition?.x !== state.currentPosition.x ||
        prevState.currentPosition?.y !== state.currentPosition.y;

      if (hasMoved) {
        currentOptions.onDragMove?.({
          active: state.activeItem,
          delta: state.delta,
          currentPosition: state.currentPosition,
          over: state.overId ? { id: state.overId, rect: { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 } } : null,
        });
      }
    }

    // Drag over changed
    if (state.isDragging && state.activeItem && prevState.overId !== state.overId && state.overId) {
      currentOptions.onDragOver?.({
        active: state.activeItem,
        over: { id: state.overId, rect: { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 } },
      });
    }

    // Drag ended
    if (prevState.isDragging && !state.isDragging && prevState.activeItem) {
      currentOptions.onDragEnd?.({
        active: prevState.activeItem,
        over: prevState.overId ? { id: prevState.overId, rect: { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 } } : null,
        delta: prevState.delta,
      });
    }

    prevStateRef.current = state;
  }, [state]);
}

// ============================================================================
// useAutoScroll Hook
// ============================================================================

export interface UseAutoScrollOptions {
  enabled?: boolean;
  speed?: number;
  threshold?: number;
  containerRef?: React.RefObject<HTMLElement>;
}

export function useAutoScroll(options: UseAutoScrollOptions = {}): void {
  const { enabled = true, speed = 10, threshold = 50, containerRef } = options;
  const { state } = useDndContext();
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !state.isDragging || !state.currentPosition) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const scroll = () => {
      if (!state.currentPosition) return;

      const container = containerRef?.current ?? document.documentElement;
      const containerRect = container.getBoundingClientRect();
      const { x, y } = state.currentPosition;

      let scrollX = 0;
      let scrollY = 0;

      // Check if near edges
      if (y < containerRect.top + threshold) {
        scrollY = -speed;
      } else if (y > containerRect.bottom - threshold) {
        scrollY = speed;
      }

      if (x < containerRect.left + threshold) {
        scrollX = -speed;
      } else if (x > containerRect.right - threshold) {
        scrollX = speed;
      }

      if (scrollX !== 0 || scrollY !== 0) {
        if (containerRef?.current) {
          containerRef.current.scrollBy(scrollX, scrollY);
        } else {
          window.scrollBy(scrollX, scrollY);
        }
      }

      animationFrameRef.current = requestAnimationFrame(scroll);
    };

    animationFrameRef.current = requestAnimationFrame(scroll);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, speed, threshold, containerRef, state.isDragging, state.currentPosition]);
}

// ============================================================================
// useDragLayer Hook
// ============================================================================

export interface DragLayerState {
  isDragging: boolean;
  item: DragItem | null;
  initialPosition: Position | null;
  currentPosition: Position | null;
  delta: Position;
}

export function useDragLayer(): DragLayerState {
  const { state } = useDndContext();

  return {
    isDragging: state.isDragging,
    item: state.activeItem,
    initialPosition: state.initialPosition,
    currentPosition: state.currentPosition,
    delta: state.delta,
  };
}

// ============================================================================
// useDropAnimation Hook
// ============================================================================

export interface UseDropAnimationOptions {
  duration?: number;
  easing?: string;
}

export function useDropAnimation(options: UseDropAnimationOptions = {}): {
  isAnimating: boolean;
  style: React.CSSProperties;
} {
  const { duration = 250, easing = 'ease' } = options;
  const { state } = useDndContext();
  const [isAnimating, setIsAnimating] = useState(false);
  const prevIsDraggingRef = useRef(state.isDragging);

  useEffect(() => {
    if (prevIsDraggingRef.current && !state.isDragging) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, duration);
      return () => clearTimeout(timer);
    }
    prevIsDraggingRef.current = state.isDragging;
  }, [state.isDragging, duration]);

  const style = useMemo<React.CSSProperties>(() => {
    if (!isAnimating) return {};
    return {
      transition: `transform ${duration}ms ${easing}`,
    };
  }, [isAnimating, duration, easing]);

  return { isAnimating, style };
}
