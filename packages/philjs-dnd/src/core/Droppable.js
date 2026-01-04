/**
 * PhilJS Droppable Web Component
 * Pure Web Component - No React
 */
import { getDndManager } from './DndContext.js';
// ============================================================================
// Droppable Component
// ============================================================================
export class PhilDroppable extends HTMLElement {
    static observedAttributes = ['drop-id', 'disabled'];
    dropId = '';
    disabled = false;
    isOver = false;
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
        this.dropId = this.getAttribute('drop-id') || this.id || `droppable-${Date.now()}`;
        this.disabled = this.hasAttribute('disabled');
        this.render();
        this.registerWithManager();
        document.addEventListener('phil-dnd-state-change', this.handleStateChange);
    }
    disconnectedCallback() {
        document.removeEventListener('phil-dnd-state-change', this.handleStateChange);
        this.unregisterFromManager();
    }
    attributeChangedCallback(name, _oldValue, newValue) {
        if (name === 'drop-id') {
            this.unregisterFromManager();
            this.dropId = newValue;
            this.registerWithManager();
        }
        else if (name === 'disabled') {
            this.disabled = newValue !== null;
        }
    }
    registerWithManager() {
        if (this.disabled)
            return;
        const manager = getDndManager();
        if (manager) {
            manager.registerDroppable(this.dropId, this, this.getDropData());
        }
    }
    unregisterFromManager() {
        const manager = getDndManager();
        manager?.unregisterDroppable(this.dropId);
    }
    handleStateChange = (e) => {
        const state = e.detail;
        const wasOver = this.isOver;
        this.isOver = state.overId === this.dropId;
        if (wasOver !== this.isOver) {
            this.updateDropState();
        }
    };
    updateDropState() {
        if (this.isOver) {
            this.setAttribute('over', '');
        }
        else {
            this.removeAttribute('over');
        }
    }
    getDropData() {
        const data = {};
        for (const attr of this.attributes) {
            if (attr.name.startsWith('data-')) {
                const key = attr.name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
                data[key] = attr.value;
            }
        }
        return data;
    }
    render() {
        if (!this.shadowRoot)
            return;
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
//# sourceMappingURL=Droppable.js.map