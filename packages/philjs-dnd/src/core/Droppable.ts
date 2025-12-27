/**
 * PhilJS Droppable Web Component
 * Pure Web Component - No React
 */

import type { DragState } from '../types.js';
import { getDndManager } from './DndContext.js';

// ============================================================================
// Droppable Component
// ============================================================================

export class PhilDroppable extends HTMLElement {
  static observedAttributes = ['drop-id', 'disabled'];

  private dropId: string = '';
  private disabled = false;
  private isOver = false;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.dropId = this.getAttribute('drop-id') || this.id || `droppable-${Date.now()}`;
    this.disabled = this.hasAttribute('disabled');

    this.render();
    this.registerWithManager();

    document.addEventListener('phil-dnd-state-change', this.handleStateChange);
  }

  disconnectedCallback(): void {
    document.removeEventListener('phil-dnd-state-change', this.handleStateChange);
    this.unregisterFromManager();
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string): void {
    if (name === 'drop-id') {
      this.unregisterFromManager();
      this.dropId = newValue;
      this.registerWithManager();
    } else if (name === 'disabled') {
      this.disabled = newValue !== null;
    }
  }

  private registerWithManager(): void {
    if (this.disabled) return;

    const manager = getDndManager();
    if (manager) {
      manager.registerDroppable(this.dropId, this, this.getDropData());
    }
  }

  private unregisterFromManager(): void {
    const manager = getDndManager();
    manager?.unregisterDroppable(this.dropId);
  }

  private handleStateChange = (e: Event): void => {
    const state = (e as CustomEvent<DragState>).detail;
    const wasOver = this.isOver;
    this.isOver = state.overId === this.dropId;

    if (wasOver !== this.isOver) {
      this.updateDropState();
    }
  };

  private updateDropState(): void {
    if (this.isOver) {
      this.setAttribute('over', '');
    } else {
      this.removeAttribute('over');
    }
  }

  private getDropData(): Record<string, unknown> {
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
          position: relative;
        }

        :host([disabled]) {
          pointer-events: none;
          opacity: 0.5;
        }

        :host([over]) {
          outline: 2px dashed var(--droppable-highlight, #3b82f6);
          outline-offset: 2px;
          background-color: var(--droppable-highlight-bg, rgba(59, 130, 246, 0.1));
        }
      </style>
      <slot></slot>
    `;
  }
}

customElements.define('phil-droppable', PhilDroppable);
