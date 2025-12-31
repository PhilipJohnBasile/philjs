/**
 * PhilJS Drag Overlay Web Component
 * Pure Web Component - No React
 */
// ============================================================================
// Drag Overlay Component
// ============================================================================
export class PhilDragOverlay extends HTMLElement {
    visible = false;
    position = { x: 0, y: 0 };
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
        this.render();
        document.addEventListener('phil-dnd-state-change', this.handleStateChange);
    }
    disconnectedCallback() {
        document.removeEventListener('phil-dnd-state-change', this.handleStateChange);
    }
    handleStateChange = (e) => {
        const state = e.detail;
        this.visible = state.isDragging;
        if (state.currentPosition) {
            this.position = state.currentPosition;
        }
        this.updatePosition();
    };
    updatePosition() {
        if (this.visible) {
            this.style.display = 'block';
            this.style.transform = `translate(${this.position.x}px, ${this.position.y}px)`;
        }
        else {
            this.style.display = 'none';
        }
    }
    render() {
        if (!this.shadowRoot)
            return;
        this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          pointer-events: none;
          z-index: 10000;
          will-change: transform;
        }
      </style>
      <slot></slot>
    `;
    }
}
customElements.define('phil-drag-overlay', PhilDragOverlay);
//# sourceMappingURL=DragOverlay.js.map