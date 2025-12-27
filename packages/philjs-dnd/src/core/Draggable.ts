/**
 * PhilJS Draggable Web Component
 * Pure Web Component - No React
 */

import type { DragItem, DragState, Position } from '../types.js';
import { getDndManager } from './DndContext.js';

// ============================================================================
// Draggable Component
// ============================================================================

export class PhilDraggable extends HTMLElement {
  static observedAttributes = ['drag-id', 'disabled'];

  private dragId: string = '';
  private disabled = false;
  private isDragging = false;
  private startPosition: Position | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.dragId = this.getAttribute('drag-id') || this.id || `draggable-${Date.now()}`;
    this.disabled = this.hasAttribute('disabled');

    this.render();
    this.setupEventListeners();

    document.addEventListener('phil-dnd-state-change', this.handleStateChange);
  }

  disconnectedCallback(): void {
    document.removeEventListener('phil-dnd-state-change', this.handleStateChange);
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string): void {
    if (name === 'drag-id') {
      this.dragId = newValue;
    } else if (name === 'disabled') {
      this.disabled = newValue !== null;
    }
  }

  private handleStateChange = (e: Event): void => {
    const state = (e as CustomEvent<DragState>).detail;
    const wasDragging = this.isDragging;
    this.isDragging = state.activeId === this.dragId;

    if (wasDragging !== this.isDragging) {
      this.updateDragState(state);
    }
  };

  private updateDragState(state: DragState): void {
    if (this.isDragging) {
      this.setAttribute('dragging', '');
      this.style.setProperty('--drag-delta-x', `${state.delta.x}px`);
      this.style.setProperty('--drag-delta-y', `${state.delta.y}px`);
    } else {
      this.removeAttribute('dragging');
      this.style.removeProperty('--drag-delta-x');
      this.style.removeProperty('--drag-delta-y');
    }
  }

  private setupEventListeners(): void {
    // Mouse events
    this.addEventListener('mousedown', this.handleMouseDown);
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);

    // Touch events
    this.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd);

    // Keyboard events
    this.addEventListener('keydown', this.handleKeyDown);

    // Set up accessibility
    this.setAttribute('tabindex', '0');
    this.setAttribute('role', 'button');
    this.setAttribute('aria-describedby', 'dnd-instructions');
  }

  private handleMouseDown = (e: MouseEvent): void => {
    if (this.disabled || e.button !== 0) return;

    this.startPosition = { x: e.clientX, y: e.clientY };

    const manager = getDndManager();
    if (manager) {
      const item: DragItem = {
        id: this.dragId,
        data: this.getItemData(),
      };
      manager.startDrag(item, this, this.startPosition);
    }
  };

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.isDragging) return;

    const manager = getDndManager();
    manager?.updateDrag({ x: e.clientX, y: e.clientY });
  };

  private handleMouseUp = (): void => {
    if (!this.isDragging) return;

    const manager = getDndManager();
    manager?.endDrag();
    this.startPosition = null;
  };

  private handleTouchStart = (e: TouchEvent): void => {
    if (this.disabled) return;

    const touch = e.touches[0];
    if (!touch) return;

    this.startPosition = { x: touch.clientX, y: touch.clientY };

    const manager = getDndManager();
    if (manager) {
      const item: DragItem = {
        id: this.dragId,
        data: this.getItemData(),
      };
      manager.startDrag(item, this, this.startPosition);
    }
  };

  private handleTouchMove = (e: TouchEvent): void => {
    if (!this.isDragging) return;

    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;

    const manager = getDndManager();
    manager?.updateDrag({ x: touch.clientX, y: touch.clientY });
  };

  private handleTouchEnd = (): void => {
    if (!this.isDragging) return;

    const manager = getDndManager();
    manager?.endDrag();
    this.startPosition = null;
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (this.disabled) return;

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const manager = getDndManager();

      if (this.isDragging) {
        manager?.endDrag();
      } else {
        const rect = this.getBoundingClientRect();
        const position = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
        const item: DragItem = {
          id: this.dragId,
          data: this.getItemData(),
        };
        manager?.startDrag(item, this, position);
      }
    } else if (e.key === 'Escape' && this.isDragging) {
      e.preventDefault();
      const manager = getDndManager();
      manager?.cancelDrag();
    } else if (this.isDragging && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const manager = getDndManager();
      const state = manager?.getState();
      if (state?.currentPosition) {
        const step = e.shiftKey ? 20 : 5;
        const delta = {
          x: e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0,
          y: e.key === 'ArrowDown' ? step : e.key === 'ArrowUp' ? -step : 0,
        };
        manager?.updateDrag({
          x: state.currentPosition.x + delta.x,
          y: state.currentPosition.y + delta.y,
        });
      }
    }
  };

  private getItemData(): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    for (const attr of this.attributes) {
      if (attr.name.startsWith('data-')) {
        const key = attr.name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        data[key] = attr.value;
      }
    }
    return data;
  }

  private render(): void {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          cursor: grab;
          user-select: none;
          touch-action: none;
        }

        :host([disabled]) {
          cursor: not-allowed;
          opacity: 0.5;
        }

        :host([dragging]) {
          cursor: grabbing;
          transform: translate(var(--drag-delta-x, 0), var(--drag-delta-y, 0));
          z-index: 9999;
          opacity: 0.8;
        }
      </style>
      <slot></slot>
    `;
  }
}

customElements.define('phil-draggable', PhilDraggable);
