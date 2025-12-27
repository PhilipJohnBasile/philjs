/**
 * PhilJS Drag and Drop Context
 * Pure Web Component - No React
 */

import type {
  DndConfig,
  DragState,
  DragItem,
  Position,
  Rect,
  DropTarget,
  CollisionDetection,
  Modifier,
  SensorDescriptor,
  Sensor,
} from '../types.js';
import { rectIntersection } from '../utils/collision.js';
import { MouseSensor } from '../sensors/mouse.js';
import { TouchSensor } from '../sensors/touch.js';
import { KeyboardSensor } from '../sensors/keyboard.js';

// ============================================================================
// Default Configuration
// ============================================================================

const defaultSensors: SensorDescriptor[] = [
  { sensor: MouseSensor },
  { sensor: TouchSensor },
  { sensor: KeyboardSensor },
];

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
// DnD Manager (Singleton-like per context)
// ============================================================================

export class DndManager {
  private config: DndConfig;
  private state: DragState = {
    isDragging: false,
    activeId: null,
    activeItem: null,
    overId: null,
    initialPosition: null,
    currentPosition: null,
    delta: { x: 0, y: 0 },
  };

  private activeNode: HTMLElement | null = null;
  private droppables = new Map<string, { id: string; rect: Rect; node: HTMLElement; data?: Record<string, unknown> }>();
  private activeSensors: Sensor[] = [];
  private lastOverId: string | null = null;
  private announcements: typeof defaultAnnouncements;
  private liveRegion: HTMLElement | null = null;

  constructor(config: DndConfig = {}) {
    this.config = config;
    this.announcements = { ...defaultAnnouncements, ...config.accessibility?.announcements };
    this.initializeSensors();
    this.createLiveRegion();
  }

  private initializeSensors(): void {
    const sensors = this.config.sensors ?? defaultSensors;
    this.activeSensors = sensors.map((descriptor) => descriptor.sensor(descriptor.options));
  }

  private createLiveRegion(): void {
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('role', 'status');
    this.liveRegion.setAttribute('aria-live', 'assertive');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    Object.assign(this.liveRegion.style, {
      position: 'fixed',
      width: '1px',
      height: '1px',
      margin: '-1px',
      padding: '0',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0',
    });
    document.body.appendChild(this.liveRegion);
  }

  private announce(message: string): void {
    if (this.liveRegion) {
      this.liveRegion.textContent = message;
    }
  }

  getState(): DragState {
    return { ...this.state };
  }

  registerDroppable(id: string, node: HTMLElement, data?: Record<string, unknown>): void {
    const rect = node.getBoundingClientRect();
    this.droppables.set(id, {
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
  }

  unregisterDroppable(id: string): void {
    this.droppables.delete(id);
  }

  private updateDroppableRects(): void {
    this.droppables.forEach((droppable, id) => {
      const rect = droppable.node.getBoundingClientRect();
      this.droppables.set(id, {
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
  }

  private applyModifiers(transform: Position, active: DragItem, activeRect: Rect | null): Position {
    const modifiers = this.config.modifiers ?? [];
    return modifiers.reduce((acc, modifier) => modifier({ transform: acc, active, activeRect, containerRect: null }), transform);
  }

  startDrag(item: DragItem, node: HTMLElement, position: Position): void {
    this.activeNode = node;

    this.state = {
      isDragging: true,
      activeId: item.id,
      activeItem: item,
      overId: null,
      initialPosition: position,
      currentPosition: position,
      delta: { x: 0, y: 0 },
    };

    this.announce(this.announcements.onDragStart(item.id));

    this.config.onDragStart?.({
      active: item,
      initialPosition: position,
    });

    this.dispatchStateChange();
  }

  updateDrag(position: Position): void {
    if (!this.state.isDragging || !this.state.initialPosition || !this.state.activeItem) return;

    const rawDelta = {
      x: position.x - this.state.initialPosition.x,
      y: position.y - this.state.initialPosition.y,
    };

    const activeRect = this.activeNode?.getBoundingClientRect();
    const normalizedActiveRect = activeRect ? {
      left: activeRect.left,
      top: activeRect.top,
      right: activeRect.right,
      bottom: activeRect.bottom,
      width: activeRect.width,
      height: activeRect.height,
    } : null;

    const modifiedDelta = this.applyModifiers(rawDelta, this.state.activeItem, normalizedActiveRect);

    this.updateDroppableRects();

    const collisionDetection: CollisionDetection = this.config.collisionDetection ?? rectIntersection;

    const virtualRect: Rect = normalizedActiveRect
      ? {
          left: normalizedActiveRect.left + modifiedDelta.x,
          top: normalizedActiveRect.top + modifiedDelta.y,
          right: normalizedActiveRect.right + modifiedDelta.x,
          bottom: normalizedActiveRect.bottom + modifiedDelta.y,
          width: normalizedActiveRect.width,
          height: normalizedActiveRect.height,
        }
      : { left: position.x, top: position.y, right: position.x, bottom: position.y, width: 0, height: 0 };

    const collision = collisionDetection({
      active: this.state.activeItem,
      activeRect: virtualRect,
      droppables: this.droppables,
    });

    const newOverId = collision?.id ?? null;

    if (newOverId !== this.lastOverId && newOverId) {
      this.announce(this.announcements.onDragOver(this.state.activeItem.id, newOverId));
      this.config.onDragOver?.({
        active: this.state.activeItem,
        over: collision!,
      });
    }
    this.lastOverId = newOverId;

    this.config.onDragMove?.({
      active: this.state.activeItem,
      delta: modifiedDelta,
      currentPosition: position,
      over: collision,
    });

    this.state = {
      ...this.state,
      currentPosition: position,
      delta: modifiedDelta,
      overId: newOverId,
    };

    this.dispatchStateChange();
  }

  endDrag(): void {
    if (!this.state.activeItem) return;

    const collision = this.state.overId ? this.droppables.get(this.state.overId) : null;

    this.announce(this.announcements.onDragEnd(this.state.activeItem.id, this.state.overId));

    this.config.onDragEnd?.({
      active: this.state.activeItem,
      over: collision
        ? { id: collision.id, rect: collision.rect, data: collision.data }
        : null,
      delta: this.state.delta,
    });

    this.state = {
      isDragging: false,
      activeId: null,
      activeItem: null,
      overId: null,
      initialPosition: null,
      currentPosition: null,
      delta: { x: 0, y: 0 },
    };

    this.activeNode = null;
    this.lastOverId = null;

    this.dispatchStateChange();
  }

  cancelDrag(): void {
    if (this.state.activeItem) {
      this.announce(this.announcements.onDragCancel(this.state.activeItem.id));
      this.config.onDragCancel?.({ active: this.state.activeItem });
    }

    this.state = {
      isDragging: false,
      activeId: null,
      activeItem: null,
      overId: null,
      initialPosition: null,
      currentPosition: null,
      delta: { x: 0, y: 0 },
    };

    this.activeNode = null;
    this.lastOverId = null;

    this.dispatchStateChange();
  }

  private dispatchStateChange(): void {
    document.dispatchEvent(new CustomEvent('phil-dnd-state-change', {
      detail: this.getState(),
    }));
  }

  destroy(): void {
    this.activeSensors.forEach((sensor) => sensor.deactivate());
    if (this.liveRegion && this.liveRegion.parentNode) {
      this.liveRegion.parentNode.removeChild(this.liveRegion);
    }
  }
}

// ============================================================================
// DnD Context Element
// ============================================================================

export class PhilDndContext extends HTMLElement {
  private manager: DndManager | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.render();
  }

  disconnectedCallback(): void {
    this.manager?.destroy();
    this.manager = null;
  }

  configure(config: DndConfig): void {
    this.manager?.destroy();
    this.manager = new DndManager(config);
  }

  getManager(): DndManager | null {
    return this.manager;
  }

  private render(): void {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: contents;
        }
      </style>
      <slot></slot>
    `;
  }
}

customElements.define('phil-dnd-context', PhilDndContext);

// ============================================================================
// Global DnD Manager Access
// ============================================================================

let globalManager: DndManager | null = null;

export function createDndManager(config: DndConfig = {}): DndManager {
  globalManager = new DndManager(config);
  return globalManager;
}

export function getDndManager(): DndManager | null {
  return globalManager;
}
