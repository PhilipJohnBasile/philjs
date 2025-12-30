/**
 * Cursor Sync for PhilJS Collab
 *
 * Real-time cursor and selection synchronization:
 * - Remote cursor rendering
 * - Selection highlighting
 * - Smooth cursor animations
 * - Cursor labels with user names
 */

export interface CursorPosition {
  clientId: string;
  userId?: string;
  name: string;
  color: string;
  position: {
    line: number;
    column: number;
    offset?: number;
  };
  selection?: {
    start: { line: number; column: number; offset?: number };
    end: { line: number; column: number; offset?: number };
  };
  timestamp: number;
}

export interface CursorConfig {
  showLabels?: boolean;
  labelTimeout?: number;
  smoothing?: boolean;
  smoothingDuration?: number;
  showSelections?: boolean;
  cursorStyle?: 'line' | 'block' | 'underline';
}

export interface CursorDecoration {
  clientId: string;
  element: HTMLElement;
  labelElement?: HTMLElement;
  selectionElements?: HTMLElement[] | undefined;
  position: CursorPosition;
  animationFrame?: number;
}

/**
 * Cursor Manager for collaborative editing
 */
export class CursorManager {
  private cursors: Map<string, CursorPosition> = new Map();
  private decorations: Map<string, CursorDecoration> = new Map();
  private container: HTMLElement | null = null;
  private config: Required<CursorConfig>;
  private listeners: Set<(cursors: Map<string, CursorPosition>) => void> = new Set();
  private localClientId: string;
  private labelTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  constructor(localClientId: string, config: CursorConfig = {}) {
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
  attach(container: HTMLElement): void {
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
  detach(): void {
    for (const decoration of this.decorations.values()) {
      this.removeDecoration(decoration);
    }
    this.decorations.clear();
    this.container = null;
  }

  /**
   * Update a cursor position
   */
  updateCursor(cursor: CursorPosition): void {
    if (cursor.clientId === this.localClientId) return;

    this.cursors.set(cursor.clientId, cursor);

    if (this.container) {
      this.renderCursor(cursor);
    }

    this.notifyListeners();
  }

  /**
   * Remove a cursor
   */
  removeCursor(clientId: string): void {
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
  getCursors(): Map<string, CursorPosition> {
    return new Map(this.cursors);
  }

  /**
   * Subscribe to cursor changes
   */
  subscribe(listener: (cursors: Map<string, CursorPosition>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Convert line/column to pixel position
   */
  getPixelPosition(position: { line: number; column: number }, editor?: HTMLElement): { x: number; y: number } | null {
    // This would integrate with specific editors
    // For now, return a basic calculation
    const lineHeight = 20;
    const charWidth = 8;

    return {
      x: position.column * charWidth,
      y: position.line * lineHeight,
    };
  }

  private renderCursor(cursor: CursorPosition): void {
    if (!this.container) return;

    let decoration = this.decorations.get(cursor.clientId);

    if (!decoration) {
      decoration = this.createDecoration(cursor);
      this.decorations.set(cursor.clientId, decoration);
    }

    this.updateDecoration(decoration, cursor);
  }

  private createDecoration(cursor: CursorPosition): CursorDecoration {
    const layer = this.container!.querySelector('.philjs-cursor-layer') as HTMLElement;

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
    let labelElement: HTMLElement | undefined;
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

  private updateDecoration(decoration: CursorDecoration, cursor: CursorPosition): void {
    const pixelPos = this.getPixelPosition(cursor.position);
    if (!pixelPos) return;

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

  private updateSelectionDecoration(decoration: CursorDecoration, cursor: CursorPosition): void {
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

    const layer = this.container!.querySelector('.philjs-cursor-layer') as HTMLElement;
    const elements: HTMLElement[] = [];

    const startPos = this.getPixelPosition(cursor.selection.start);
    const endPos = this.getPixelPosition(cursor.selection.end);

    if (!startPos || !endPos) return;

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
    } else {
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

  private removeDecoration(decoration: CursorDecoration): void {
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

  private notifyListeners(): void {
    const cursors = this.getCursors();
    for (const listener of this.listeners) {
      listener(cursors);
    }
  }
}

/**
 * Create a cursor manager
 */
export function createCursorManager(localClientId: string, config?: CursorConfig): CursorManager {
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
export function injectCursorStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('philjs-cursor-styles')) return;

  const style = document.createElement('style');
  style.id = 'philjs-cursor-styles';
  style.textContent = CURSOR_STYLES;
  document.head.appendChild(style);
}
