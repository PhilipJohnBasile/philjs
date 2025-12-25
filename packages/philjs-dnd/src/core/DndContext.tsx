import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import type {
  DndContextValue,
  DndContextProps,
  DragState,
  DragItem,
  Position,
  Rect,
  Modifier,
  CollisionDetection,
  SensorDescriptor,
} from '../types';
import { rectIntersection } from '../utils/collision';
import { MouseSensor } from '../sensors/mouse';
import { TouchSensor } from '../sensors/touch';
import { KeyboardSensor } from '../sensors/keyboard';

// ============================================================================
// Context
// ============================================================================

const DndContext = createContext<DndContextValue | null>(null);

export function useDndContext(): DndContextValue {
  const context = useContext(DndContext);
  if (!context) {
    throw new Error('useDndContext must be used within a DndProvider');
  }
  return context;
}

// ============================================================================
// Default Sensors
// ============================================================================

const defaultSensors: SensorDescriptor[] = [
  { sensor: MouseSensor },
  { sensor: TouchSensor },
  { sensor: KeyboardSensor },
];

// ============================================================================
// Accessibility
// ============================================================================

const defaultAnnouncements = {
  onDragStart: (id: string) => `Picked up draggable item ${id}`,
  onDragOver: (id: string, overId: string) => `Draggable item ${id} is over droppable area ${overId}`,
  onDragEnd: (id: string, overId: string | null) =>
    overId ? `Dropped item ${id} into ${overId}` : `Dropped item ${id}`,
  onDragCancel: (id: string) => `Cancelled dragging item ${id}`,
};

const defaultScreenReaderInstructions =
  'To pick up a draggable item, press space or enter. While dragging, use the arrow keys to move the item. Press space or enter again to drop the item, or press escape to cancel.';

// ============================================================================
// Live Region for Announcements
// ============================================================================

function LiveRegion({ announcement }: { announcement: string }) {
  return (
    <div
      role="status"
      aria-live="assertive"
      aria-atomic="true"
      style={{
        position: 'fixed',
        width: 1,
        height: 1,
        margin: -1,
        padding: 0,
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {announcement}
    </div>
  );
}

// ============================================================================
// DndProvider Component
// ============================================================================

export function DndProvider({
  children,
  sensors = defaultSensors,
  collisionDetection = rectIntersection,
  modifiers = [],
  onDragStart,
  onDragMove,
  onDragOver,
  onDragEnd,
  onDragCancel,
  accessibility,
}: DndContextProps) {
  const [state, setState] = useState<DragState>({
    isDragging: false,
    activeId: null,
    activeItem: null,
    overId: null,
    initialPosition: null,
    currentPosition: null,
    delta: { x: 0, y: 0 },
  });

  const [announcement, setAnnouncement] = useState('');

  const activeNodeRef = useRef<HTMLElement | null>(null);
  const overlayNodeRef = useRef<HTMLElement | null>(null);
  const droppablesRef = useRef<Map<string, { id: string; rect: Rect; node: HTMLElement; data?: Record<string, unknown> }>>(
    new Map()
  );
  const activeSensorsRef = useRef<ReturnType<SensorDescriptor['sensor']>[]>([]);
  const lastOverIdRef = useRef<string | null>(null);

  const announcements = useMemo(
    () => ({ ...defaultAnnouncements, ...accessibility?.announcements }),
    [accessibility?.announcements]
  );

  // Register/unregister droppables
  const registerDroppable = useCallback(
    (id: string, node: HTMLElement, data?: Record<string, unknown>) => {
      const rect = node.getBoundingClientRect();
      droppablesRef.current.set(id, {
        id,
        rect: {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        },
        node,
        data,
      });
    },
    []
  );

  const unregisterDroppable = useCallback((id: string) => {
    droppablesRef.current.delete(id);
  }, []);

  // Update droppable rects on scroll/resize
  const updateDroppableRects = useCallback(() => {
    droppablesRef.current.forEach((droppable, id) => {
      const rect = droppable.node.getBoundingClientRect();
      droppablesRef.current.set(id, {
        ...droppable,
        rect: {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        },
      });
    });
  }, []);

  // Apply modifiers to transform
  const applyModifiers = useCallback(
    (transform: Position, active: DragItem, activeRect: Rect | null, containerRect: Rect | null): Position => {
      return modifiers.reduce((acc, modifier) => modifier({ transform: acc, active, activeRect, containerRect }), transform);
    },
    [modifiers]
  );

  // Start drag
  const startDrag = useCallback(
    (item: DragItem, node: HTMLElement, position: Position) => {
      activeNodeRef.current = node;

      setState({
        isDragging: true,
        activeId: item.id,
        activeItem: item,
        overId: null,
        initialPosition: position,
        currentPosition: position,
        delta: { x: 0, y: 0 },
      });

      setAnnouncement(announcements.onDragStart(item.id));

      onDragStart?.({
        active: item,
        initialPosition: position,
      });
    },
    [onDragStart, announcements]
  );

  // Update drag position
  const updateDrag = useCallback(
    (position: Position) => {
      setState((prev) => {
        if (!prev.isDragging || !prev.initialPosition || !prev.activeItem) return prev;

        const rawDelta = {
          x: position.x - prev.initialPosition.x,
          y: position.y - prev.initialPosition.y,
        };

        const activeRect = activeNodeRef.current?.getBoundingClientRect() ?? null;
        const modifiedDelta = applyModifiers(
          rawDelta,
          prev.activeItem,
          activeRect
            ? {
                left: activeRect.left,
                top: activeRect.top,
                right: activeRect.right,
                bottom: activeRect.bottom,
                width: activeRect.width,
                height: activeRect.height,
              }
            : null,
          null
        );

        // Update droppable rects
        updateDroppableRects();

        // Detect collision
        const virtualRect: Rect = activeRect
          ? {
              left: activeRect.left + modifiedDelta.x,
              top: activeRect.top + modifiedDelta.y,
              right: activeRect.right + modifiedDelta.x,
              bottom: activeRect.bottom + modifiedDelta.y,
              width: activeRect.width,
              height: activeRect.height,
            }
          : { left: position.x, top: position.y, right: position.x, bottom: position.y, width: 0, height: 0 };

        const collision = collisionDetection({
          active: prev.activeItem,
          activeRect: virtualRect,
          droppables: droppablesRef.current,
        });

        const newOverId = collision?.id ?? null;

        // Announce if over a new droppable
        if (newOverId !== lastOverIdRef.current && newOverId) {
          setAnnouncement(announcements.onDragOver(prev.activeItem.id, newOverId));
          onDragOver?.({
            active: prev.activeItem,
            over: collision!,
          });
        }
        lastOverIdRef.current = newOverId;

        onDragMove?.({
          active: prev.activeItem,
          delta: modifiedDelta,
          currentPosition: position,
          over: collision,
        });

        return {
          ...prev,
          currentPosition: position,
          delta: modifiedDelta,
          overId: newOverId,
        };
      });
    },
    [applyModifiers, collisionDetection, onDragMove, onDragOver, announcements, updateDroppableRects]
  );

  // End drag
  const endDrag = useCallback(() => {
    setState((prev) => {
      if (!prev.activeItem) return prev;

      const collision = prev.overId ? droppablesRef.current.get(prev.overId) : null;

      setAnnouncement(announcements.onDragEnd(prev.activeItem.id, prev.overId));

      onDragEnd?.({
        active: prev.activeItem,
        over: collision
          ? { id: collision.id, rect: collision.rect, data: collision.data }
          : null,
        delta: prev.delta,
      });

      return {
        isDragging: false,
        activeId: null,
        activeItem: null,
        overId: null,
        initialPosition: null,
        currentPosition: null,
        delta: { x: 0, y: 0 },
      };
    });

    activeNodeRef.current = null;
    lastOverIdRef.current = null;
  }, [onDragEnd, announcements]);

  // Cancel drag
  const cancelDrag = useCallback(() => {
    setState((prev) => {
      if (prev.activeItem) {
        setAnnouncement(announcements.onDragCancel(prev.activeItem.id));
        onDragCancel?.({ active: prev.activeItem });
      }

      return {
        isDragging: false,
        activeId: null,
        activeItem: null,
        overId: null,
        initialPosition: null,
        currentPosition: null,
        delta: { x: 0, y: 0 },
      };
    });

    activeNodeRef.current = null;
    lastOverIdRef.current = null;
  }, [onDragCancel, announcements]);

  // Initialize sensors
  useEffect(() => {
    activeSensorsRef.current = sensors.map((descriptor) => descriptor.sensor(descriptor.options));

    return () => {
      activeSensorsRef.current.forEach((sensor) => sensor.deactivate());
    };
  }, [sensors]);

  // Handle window scroll during drag
  useEffect(() => {
    if (!state.isDragging) return;

    const handleScroll = () => {
      updateDroppableRects();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [state.isDragging, updateDroppableRects]);

  const contextValue = useMemo<DndContextValue>(
    () => ({
      state,
      activeNode: activeNodeRef.current,
      overlayNode: overlayNodeRef.current,
      droppables: droppablesRef.current,
      sensors,
      collisionDetection,
      modifiers,
      registerDroppable,
      unregisterDroppable,
      startDrag,
      updateDrag,
      endDrag,
      cancelDrag,
    }),
    [
      state,
      sensors,
      collisionDetection,
      modifiers,
      registerDroppable,
      unregisterDroppable,
      startDrag,
      updateDrag,
      endDrag,
      cancelDrag,
    ]
  );

  return (
    <DndContext.Provider value={contextValue}>
      {children}
      <LiveRegion announcement={announcement} />
      {/* Screen reader instructions */}
      <div id="dnd-instructions" style={{ display: 'none' }}>
        {accessibility?.screenReaderInstructions ?? defaultScreenReaderInstructions}
      </div>
    </DndContext.Provider>
  );
}

export { DndContext };
