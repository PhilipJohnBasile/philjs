/**
 * Cursor Sync for PhilJS Collab
 *
 * Real-time cursor and selection synchronization:
 * - Remote cursor rendering
 * - Selection highlighting
 * - Smooth cursor animations
 * - Cursor labels with user names
 */
/**
 * Cursor Manager for collaborative editing
 */
export class CursorManager {
    cursors = new Map();
    decorations = new Map();
    container = null;
    config;
    listeners = new Set();
    localClientId;
    labelTimers = new Map();
    constructor(localClientId, config = {}) {
        this.localClientId = localClientId;
        this.config = {
            showLabels: config.showLabels ?? true,
            labelTimeout: config.labelTimeout ?? 3000,
            smoothing: config.smoothing ?? true,
            smoothingDuration: config.smoothingDuration ?? 150,
            showSelections: config.showSelections ?? true,
            cursorStyle: config.cursorStyle ?? 'line',
        };
    }
    /**
     * Attach to a container element
     */
    attach(container) {
        this.container = container;
        container.style.position = 'relative';
        // Create cursor layer
        const layer = document.createElement('div');
        layer.className = 'philjs-cursor-layer';
        layer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 1000;
      overflow: hidden;
    `;
        container.appendChild(layer);
    }
    /**
     * Detach from container
     */
    detach() {
        for (const decoration of this.decorations.values()) {
            this.removeDecoration(decoration);
        }
        this.decorations.clear();
        this.container = null;
    }
    /**
     * Update a cursor position
     */
    updateCursor(cursor) {
        if (cursor.clientId === this.localClientId)
            return;
        this.cursors.set(cursor.clientId, cursor);
        if (this.container) {
            this.renderCursor(cursor);
        }
        this.notifyListeners();
    }
    /**
     * Remove a cursor
     */
    removeCursor(clientId) {
        this.cursors.delete(clientId);
        const decoration = this.decorations.get(clientId);
        if (decoration) {
            this.removeDecoration(decoration);
            this.decorations.delete(clientId);
        }
        this.notifyListeners();
    }
    /**
     * Get all cursors
     */
    getCursors() {
        return new Map(this.cursors);
    }
    /**
     * Subscribe to cursor changes
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    /**
     * Convert line/column to pixel position
     */
    getPixelPosition(position, editor) {
        // This would integrate with specific editors
        // For now, return a basic calculation
        const lineHeight = 20;
        const charWidth = 8;
        return {
            x: position.column * charWidth,
            y: position.line * lineHeight,
        };
    }
    renderCursor(cursor) {
        if (!this.container)
            return;
        let decoration = this.decorations.get(cursor.clientId);
        if (!decoration) {
            decoration = this.createDecoration(cursor);
            this.decorations.set(cursor.clientId, decoration);
        }
        this.updateDecoration(decoration, cursor);
    }
    createDecoration(cursor) {
        const layer = this.container.querySelector('.philjs-cursor-layer');
        // Create cursor element
        const element = document.createElement('div');
        element.className = 'philjs-remote-cursor';
        element.setAttribute('data-client-id', cursor.clientId);
        element.style.cssText = `
      position: absolute;
      width: 2px;
      height: 20px;
      background-color: ${cursor.color};
      transition: ${this.config.smoothing ? `all ${this.config.smoothingDuration}ms ease-out` : 'none'};
      opacity: 0.8;
    `;
        // Create label
        let labelElement;
        if (this.config.showLabels) {
            labelElement = document.createElement('div');
            labelElement.className = 'philjs-cursor-label';
            labelElement.textContent = cursor.name;
            labelElement.style.cssText = `
        position: absolute;
        top: -20px;
        left: 0;
        padding: 2px 6px;
        background-color: ${cursor.color};
        color: white;
        font-size: 11px;
        font-weight: 500;
        border-radius: 3px;
        white-space: nowrap;
        transition: opacity 0.2s ease-out;
        pointer-events: none;
      `;
            element.appendChild(labelElement);
        }
        layer.appendChild(element);
        return {
            clientId: cursor.clientId,
            element,
            position: cursor,
            ...(labelElement !== undefined && { labelElement }),
        };
    }
    updateDecoration(decoration, cursor) {
        const pixelPos = this.getPixelPosition(cursor.position);
        if (!pixelPos)
            return;
        // Update cursor position
        decoration.element.style.transform = `translate(${pixelPos.x}px, ${pixelPos.y}px)`;
        decoration.position = cursor;
        // Update selection
        if (this.config.showSelections && cursor.selection) {
            this.updateSelectionDecoration(decoration, cursor);
        }
        // Show/hide label
        if (decoration.labelElement && this.config.showLabels) {
            decoration.labelElement.style.opacity = '1';
            // Hide label after timeout
            const existingTimer = this.labelTimers.get(cursor.clientId);
            if (existingTimer) {
                clearTimeout(existingTimer);
            }
            const timer = setTimeout(() => {
                if (decoration.labelElement) {
                    decoration.labelElement.style.opacity = '0';
                }
            }, this.config.labelTimeout);
            this.labelTimers.set(cursor.clientId, timer);
        }
    }
    updateSelectionDecoration(decoration, cursor) {
        // Clear existing selection elements
        if (decoration.selectionElements) {
            for (const el of decoration.selectionElements) {
                el.remove();
            }
        }
        if (!cursor.selection) {
            decoration.selectionElements = undefined;
            return;
        }
        const layer = this.container.querySelector('.philjs-cursor-layer');
        const elements = [];
        const startPos = this.getPixelPosition(cursor.selection.start);
        const endPos = this.getPixelPosition(cursor.selection.end);
        if (!startPos || !endPos)
            return;
        // Simple single-line selection
        if (cursor.selection.start.line === cursor.selection.end.line) {
            const el = document.createElement('div');
            el.className = 'philjs-selection';
            el.style.cssText = `
        position: absolute;
        background-color: ${cursor.color};
        opacity: 0.2;
        height: 20px;
        left: ${startPos.x}px;
        top: ${startPos.y}px;
        width: ${endPos.x - startPos.x}px;
        pointer-events: none;
      `;
            layer.appendChild(el);
            elements.push(el);
        }
        else {
            // Multi-line selection - simplified
            const el = document.createElement('div');
            el.className = 'philjs-selection';
            el.style.cssText = `
        position: absolute;
        background-color: ${cursor.color};
        opacity: 0.2;
        left: ${Math.min(startPos.x, endPos.x)}px;
        top: ${startPos.y}px;
        width: ${Math.abs(endPos.x - startPos.x) + 100}px;
        height: ${endPos.y - startPos.y + 20}px;
        pointer-events: none;
      `;
            layer.appendChild(el);
            elements.push(el);
        }
        decoration.selectionElements = elements;
    }
    removeDecoration(decoration) {
        decoration.element.remove();
        if (decoration.selectionElements) {
            for (const el of decoration.selectionElements) {
                el.remove();
            }
        }
        if (decoration.animationFrame) {
            cancelAnimationFrame(decoration.animationFrame);
        }
        const timer = this.labelTimers.get(decoration.clientId);
        if (timer) {
            clearTimeout(timer);
            this.labelTimers.delete(decoration.clientId);
        }
    }
    notifyListeners() {
        const cursors = this.getCursors();
        for (const listener of this.listeners) {
            listener(cursors);
        }
    }
}
/**
 * Create a cursor manager
 */
export function createCursorManager(localClientId, config) {
    return new CursorManager(localClientId, config);
}
/**
 * CSS styles for cursors (inject into document)
 */
export const CURSOR_STYLES = `
  .philjs-cursor-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 1000;
    overflow: hidden;
  }

  .philjs-remote-cursor {
    position: absolute;
    width: 2px;
    border-radius: 1px;
    pointer-events: none;
  }

  .philjs-remote-cursor::after {
    content: '';
    position: absolute;
    top: 0;
    left: -1px;
    width: 4px;
    height: 4px;
    background-color: inherit;
    border-radius: 50%;
  }

  .philjs-cursor-label {
    position: absolute;
    bottom: 100%;
    left: 0;
    padding: 2px 6px;
    font-size: 11px;
    font-weight: 500;
    border-radius: 3px 3px 3px 0;
    white-space: nowrap;
    color: white;
    pointer-events: none;
    user-select: none;
  }

  .philjs-selection {
    position: absolute;
    pointer-events: none;
    border-radius: 2px;
  }

  @keyframes philjs-cursor-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
`;
/**
 * Inject cursor styles into document
 */
export function injectCursorStyles() {
    if (typeof document === 'undefined')
        return;
    if (document.getElementById('philjs-cursor-styles'))
        return;
    const style = document.createElement('style');
    style.id = 'philjs-cursor-styles';
    style.textContent = CURSOR_STYLES;
    document.head.appendChild(style);
}
//# sourceMappingURL=cursors.js.map