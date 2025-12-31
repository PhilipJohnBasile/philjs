/**
 * PhilJS Drag and Drop Context
 * Pure Web Component - No React
 */
import { rectIntersection } from '../utils/collision.js';
import { MouseSensor } from '../sensors/mouse.js';
import { TouchSensor } from '../sensors/touch.js';
import { KeyboardSensor } from '../sensors/keyboard.js';
// ============================================================================
// Default Configuration
// ============================================================================
const defaultSensors = [
    { sensor: MouseSensor },
    { sensor: TouchSensor },
    { sensor: KeyboardSensor },
];
const defaultAnnouncements = {
    onDragStart: (id) => `Picked up draggable item ${id}`,
    onDragOver: (id, overId) => `Draggable item ${id} is over droppable area ${overId}`,
    onDragEnd: (id, overId) => overId ? `Dropped item ${id} into ${overId}` : `Dropped item ${id}`,
    onDragCancel: (id) => `Cancelled dragging item ${id}`,
};
const defaultScreenReaderInstructions = 'To pick up a draggable item, press space or enter. While dragging, use the arrow keys to move the item. Press space or enter again to drop the item, or press escape to cancel.';
// ============================================================================
// DnD Manager (Singleton-like per context)
// ============================================================================
export class DndManager {
    config;
    state = {
        isDragging: false,
        activeId: null,
        activeItem: null,
        overId: null,
        initialPosition: null,
        currentPosition: null,
        delta: { x: 0, y: 0 },
    };
    activeNode = null;
    droppables = new Map();
    activeSensors = [];
    lastOverId = null;
    announcements;
    liveRegion = null;
    constructor(config = {}) {
        this.config = config;
        this.announcements = { ...defaultAnnouncements, ...config.accessibility?.announcements };
        this.initializeSensors();
        this.createLiveRegion();
    }
    initializeSensors() {
        const sensors = this.config.sensors ?? defaultSensors;
        this.activeSensors = sensors.map((descriptor) => descriptor.sensor(descriptor.options));
    }
    createLiveRegion() {
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
    announce(message) {
        if (this.liveRegion) {
            this.liveRegion.textContent = message;
        }
    }
    getState() {
        return { ...this.state };
    }
    registerDroppable(id, node, data) {
        const rect = node.getBoundingClientRect();
        const droppableEntry = {
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
        };
        if (data !== undefined) {
            droppableEntry.data = data;
        }
        this.droppables.set(id, droppableEntry);
    }
    unregisterDroppable(id) {
        this.droppables.delete(id);
    }
    updateDroppableRects() {
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
    applyModifiers(transform, active, activeRect) {
        const modifiers = this.config.modifiers ?? [];
        return modifiers.reduce((acc, modifier) => modifier({ transform: acc, active, activeRect, containerRect: null }), transform);
    }
    startDrag(item, node, position) {
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
    updateDrag(position) {
        if (!this.state.isDragging || !this.state.initialPosition || !this.state.activeItem)
            return;
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
        const collisionDetection = this.config.collisionDetection ?? rectIntersection;
        const virtualRect = normalizedActiveRect
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
                over: collision,
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
    endDrag() {
        if (!this.state.activeItem)
            return;
        const collision = this.state.overId ? this.droppables.get(this.state.overId) : null;
        this.announce(this.announcements.onDragEnd(this.state.activeItem.id, this.state.overId));
        let overTarget = null;
        if (collision) {
            overTarget = { id: collision.id, rect: collision.rect };
            if (collision.data !== undefined) {
                overTarget.data = collision.data;
            }
        }
        this.config.onDragEnd?.({
            active: this.state.activeItem,
            over: overTarget,
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
    cancelDrag() {
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
    dispatchStateChange() {
        document.dispatchEvent(new CustomEvent('phil-dnd-state-change', {
            detail: this.getState(),
        }));
    }
    destroy() {
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
    manager = null;
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
        this.render();
    }
    disconnectedCallback() {
        this.manager?.destroy();
        this.manager = null;
    }
    configure(config) {
        this.manager?.destroy();
        this.manager = new DndManager(config);
    }
    getManager() {
        return this.manager;
    }
    render() {
        if (!this.shadowRoot)
            return;
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
let globalManager = null;
export function createDndManager(config = {}) {
    globalManager = new DndManager(config);
    return globalManager;
}
export function getDndManager() {
    return globalManager;
}
//# sourceMappingURL=DndContext.js.map