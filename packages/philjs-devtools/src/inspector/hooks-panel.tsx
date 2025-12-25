/**
 * Hooks Panel - Inspect React-style hooks state
 *
 * Shows all hooks used by a component:
 * - useState values
 * - useEffect dependencies
 * - useMemo cached values
 * - useRef current values
 * - Custom hooks
 */

import type { ComponentNode } from './types';

export interface HookInfo {
  id: number;
  name: string;
  type: 'state' | 'effect' | 'memo' | 'ref' | 'callback' | 'reducer' | 'context' | 'custom';
  value: unknown;
  deps?: unknown[];
  isStale?: boolean;
  lastUpdated?: number;
  stackTrace?: string;
}

export interface HooksPanelProps {
  component: ComponentNode | null;
  hooks: HookInfo[];
  onHookValueChange?: (hookId: number, value: unknown) => void;
  onBreakOnHook?: (hookId: number) => void;
}

/**
 * Hooks inspection panel
 */
export class HooksPanel {
  private container: HTMLElement | null = null;
  private hooks: HookInfo[] = [];
  private selectedHook: number | null = null;
  private expandedHooks: Set<number> = new Set();
  private onValueChange?: (hookId: number, value: unknown) => void;

  constructor(options: Partial<HooksPanelProps> = {}) {
    this.onValueChange = options.onHookValueChange;
    if (options.hooks) {
      this.hooks = options.hooks;
    }
  }

  /**
   * Mount the panel
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.render();
  }

  /**
   * Unmount the panel
   */
  unmount(): void {
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
  }

  /**
   * Update hooks data
   */
  setHooks(hooks: HookInfo[]): void {
    this.hooks = hooks;
    this.render();
  }

  /**
   * Select a hook for detailed view
   */
  selectHook(hookId: number): void {
    this.selectedHook = hookId;
    this.render();
  }

  /**
   * Toggle hook expansion
   */
  toggleExpanded(hookId: number): void {
    if (this.expandedHooks.has(hookId)) {
      this.expandedHooks.delete(hookId);
    } else {
      this.expandedHooks.add(hookId);
    }
    this.render();
  }

  /**
   * Render the panel
   */
  private render(): void {
    if (!this.container) return;

    const html = `
      <div class="philjs-hooks-panel">
        <div class="hooks-header">
          <h3>Hooks (${this.hooks.length})</h3>
          <div class="hooks-actions">
            <button class="action-btn" data-action="collapse-all" title="Collapse All">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="4 14 10 14 10 20"></polyline>
                <polyline points="20 10 14 10 14 4"></polyline>
                <line x1="14" y1="10" x2="21" y2="3"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            </button>
            <button class="action-btn" data-action="expand-all" title="Expand All">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            </button>
          </div>
        </div>
        <div class="hooks-list">
          ${this.renderHooksList()}
        </div>
        ${this.selectedHook !== null ? this.renderHookDetails() : ''}
      </div>
      <style>
        .philjs-hooks-panel {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 12px;
          color: #e0e0e0;
          background: #1e1e1e;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .hooks-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-bottom: 1px solid #333;
          background: #252525;
        }
        .hooks-header h3 {
          margin: 0;
          font-size: 13px;
          font-weight: 500;
        }
        .hooks-actions {
          display: flex;
          gap: 4px;
        }
        .action-btn {
          background: transparent;
          border: none;
          color: #888;
          cursor: pointer;
          padding: 4px;
          border-radius: 3px;
        }
        .action-btn:hover {
          background: #333;
          color: #e0e0e0;
        }
        .hooks-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px 0;
        }
        .hook-item {
          padding: 6px 12px;
          cursor: pointer;
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        .hook-item:hover {
          background: #2a2a2a;
        }
        .hook-item.selected {
          background: #264f78;
        }
        .hook-expand {
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #888;
          flex-shrink: 0;
        }
        .hook-expand.has-children {
          cursor: pointer;
        }
        .hook-expand.has-children:hover {
          color: #e0e0e0;
        }
        .hook-icon {
          width: 16px;
          height: 16px;
          border-radius: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
          flex-shrink: 0;
        }
        .hook-icon.state { background: #4fc3f7; color: #000; }
        .hook-icon.effect { background: #ba68c8; color: #fff; }
        .hook-icon.memo { background: #81c784; color: #000; }
        .hook-icon.ref { background: #ffb74d; color: #000; }
        .hook-icon.callback { background: #f06292; color: #fff; }
        .hook-icon.reducer { background: #9575cd; color: #fff; }
        .hook-icon.context { background: #4db6ac; color: #000; }
        .hook-icon.custom { background: #90a4ae; color: #000; }
        .hook-info {
          flex: 1;
          min-width: 0;
        }
        .hook-name {
          font-weight: 500;
          color: #e0e0e0;
        }
        .hook-value {
          color: #888;
          font-family: 'Fira Code', monospace;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 2px;
        }
        .hook-value.stale {
          color: #f48fb1;
        }
        .hook-deps {
          font-size: 10px;
          color: #666;
          margin-top: 2px;
        }
        .hook-children {
          padding-left: 24px;
          border-left: 1px solid #333;
          margin-left: 8px;
        }
        .hook-details {
          border-top: 1px solid #333;
          padding: 12px;
          background: #252525;
          max-height: 200px;
          overflow-y: auto;
        }
        .hook-details h4 {
          margin: 0 0 8px 0;
          font-size: 12px;
          font-weight: 500;
        }
        .detail-row {
          display: flex;
          margin-bottom: 6px;
        }
        .detail-label {
          width: 80px;
          color: #888;
          flex-shrink: 0;
        }
        .detail-value {
          flex: 1;
          font-family: 'Fira Code', monospace;
          word-break: break-all;
        }
        .value-string { color: #ce9178; }
        .value-number { color: #b5cea8; }
        .value-boolean { color: #569cd6; }
        .value-null { color: #808080; }
        .value-object { color: #dcdcaa; }
        .edit-value {
          background: #333;
          border: 1px solid #444;
          color: #e0e0e0;
          padding: 4px 8px;
          border-radius: 3px;
          font-family: 'Fira Code', monospace;
          font-size: 11px;
          width: 100%;
          margin-top: 4px;
        }
        .edit-value:focus {
          border-color: #007acc;
          outline: none;
        }
      </style>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  /**
   * Render hooks list
   */
  private renderHooksList(): string {
    if (this.hooks.length === 0) {
      return '<div style="padding: 12px; color: #888; text-align: center;">No hooks found</div>';
    }

    return this.hooks.map(hook => this.renderHookItem(hook)).join('');
  }

  /**
   * Render single hook item
   */
  private renderHookItem(hook: HookInfo): string {
    const isExpanded = this.expandedHooks.has(hook.id);
    const isSelected = this.selectedHook === hook.id;
    const hasChildren = typeof hook.value === 'object' && hook.value !== null;
    const iconLetter = this.getHookIconLetter(hook.type);

    return `
      <div class="hook-item ${isSelected ? 'selected' : ''}" data-hook-id="${hook.id}">
        <span class="hook-expand ${hasChildren ? 'has-children' : ''}" data-expand="${hook.id}">
          ${hasChildren ? (isExpanded ? '▼' : '▶') : ''}
        </span>
        <span class="hook-icon ${hook.type}">${iconLetter}</span>
        <div class="hook-info">
          <div class="hook-name">${hook.name}</div>
          <div class="hook-value ${hook.isStale ? 'stale' : ''}">${this.formatValue(hook.value)}</div>
          ${hook.deps ? `<div class="hook-deps">deps: [${hook.deps.length}]</div>` : ''}
        </div>
      </div>
      ${isExpanded && hasChildren ? this.renderHookChildren(hook) : ''}
    `;
  }

  /**
   * Render hook children (for objects/arrays)
   */
  private renderHookChildren(hook: HookInfo): string {
    if (typeof hook.value !== 'object' || hook.value === null) return '';

    const entries = Array.isArray(hook.value)
      ? hook.value.map((v, i) => [i, v])
      : Object.entries(hook.value);

    return `
      <div class="hook-children">
        ${entries.map(([key, value]) => `
          <div class="hook-item" style="padding-left: 8px;">
            <span class="hook-expand"></span>
            <div class="hook-info">
              <div class="hook-name" style="color: #9cdcfe;">${key}:</div>
              <div class="hook-value">${this.formatValue(value)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Render hook details panel
   */
  private renderHookDetails(): string {
    const hook = this.hooks.find(h => h.id === this.selectedHook);
    if (!hook) return '';

    return `
      <div class="hook-details">
        <h4>${hook.name} Details</h4>
        <div class="detail-row">
          <span class="detail-label">Type:</span>
          <span class="detail-value">${hook.type}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Value:</span>
          <span class="detail-value">${this.formatValueWithClass(hook.value)}</span>
        </div>
        ${hook.deps ? `
          <div class="detail-row">
            <span class="detail-label">Dependencies:</span>
            <span class="detail-value">[${hook.deps.map(d => this.formatValue(d)).join(', ')}]</span>
          </div>
        ` : ''}
        ${hook.lastUpdated ? `
          <div class="detail-row">
            <span class="detail-label">Updated:</span>
            <span class="detail-value">${new Date(hook.lastUpdated).toLocaleTimeString()}</span>
          </div>
        ` : ''}
        ${hook.type === 'state' ? `
          <div class="detail-row">
            <span class="detail-label">Edit:</span>
          </div>
          <input type="text" class="edit-value" data-hook-id="${hook.id}"
                 value="${this.formatValue(hook.value)}" />
        ` : ''}
      </div>
    `;
  }

  /**
   * Get hook icon letter
   */
  private getHookIconLetter(type: HookInfo['type']): string {
    const letters: Record<HookInfo['type'], string> = {
      state: 'S',
      effect: 'E',
      memo: 'M',
      ref: 'R',
      callback: 'C',
      reducer: 'D',
      context: 'X',
      custom: '?'
    };
    return letters[type] || '?';
  }

  /**
   * Format value for display
   */
  private formatValue(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value.length > 50 ? value.slice(0, 50) + '...' : value}"`;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return String(value);
    if (typeof value === 'function') return `ƒ ${(value as Function).name || 'anonymous'}()`;
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (typeof value === 'object') {
      const keys = Object.keys(value);
      return `{${keys.slice(0, 3).join(', ')}${keys.length > 3 ? ', ...' : ''}}`;
    }
    return String(value);
  }

  /**
   * Format value with syntax highlighting class
   */
  private formatValueWithClass(value: unknown): string {
    if (value === null) return '<span class="value-null">null</span>';
    if (value === undefined) return '<span class="value-null">undefined</span>';
    if (typeof value === 'string') return `<span class="value-string">"${value}"</span>`;
    if (typeof value === 'number') return `<span class="value-number">${value}</span>`;
    if (typeof value === 'boolean') return `<span class="value-boolean">${value}</span>`;
    if (typeof value === 'object') return `<span class="value-object">${this.formatValue(value)}</span>`;
    return String(value);
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    if (!this.container) return;

    // Hook item click
    this.container.querySelectorAll('.hook-item').forEach(el => {
      el.addEventListener('click', (e) => {
        const hookId = parseInt((el as HTMLElement).dataset.hookId || '0');
        this.selectHook(hookId);
      });
    });

    // Expand toggle
    this.container.querySelectorAll('.hook-expand.has-children').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const hookId = parseInt((el as HTMLElement).dataset.expand || '0');
        this.toggleExpanded(hookId);
      });
    });

    // Edit value
    this.container.querySelectorAll('.edit-value').forEach(el => {
      el.addEventListener('change', (e) => {
        const hookId = parseInt((el as HTMLElement).dataset.hookId || '0');
        const value = (el as HTMLInputElement).value;
        try {
          const parsed = JSON.parse(value);
          this.onValueChange?.(hookId, parsed);
        } catch {
          this.onValueChange?.(hookId, value);
        }
      });
    });

    // Action buttons
    this.container.querySelectorAll('.action-btn').forEach(el => {
      el.addEventListener('click', () => {
        const action = (el as HTMLElement).dataset.action;
        if (action === 'collapse-all') {
          this.expandedHooks.clear();
          this.render();
        } else if (action === 'expand-all') {
          this.hooks.forEach(h => this.expandedHooks.add(h.id));
          this.render();
        }
      });
    });
  }
}

export function createHooksPanel(options?: Partial<HooksPanelProps>): HooksPanel {
  return new HooksPanel(options);
}
