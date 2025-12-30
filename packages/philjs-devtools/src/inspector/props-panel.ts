/**
 * Props Panel - Display and edit component props
 */

import type { ComponentNode, PropInfo } from './types.js';

export class PropsPanel {
  private container: HTMLElement | null = null;
  private currentNode: ComponentNode | null = null;
  private onPropChange?: (name: string, value: unknown) => void;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public setNode(node: ComponentNode): void {
    this.currentNode = node;
    this.render();
  }

  public onPropsChange(callback: (name: string, value: unknown) => void): void {
    this.onPropChange = callback;
  }

  private render(): void {
    if (!this.container || !this.currentNode) return;

    const props = this.analyzeProps(this.currentNode.props);

    if (props.length === 0) {
      this.container.innerHTML = `
        <div style="padding: 16px; text-align: center; color: #888;">
          No props available
        </div>
      `;
      return;
    }

    this.container.innerHTML = `
      <div style="padding: 8px;">
        ${props.map(prop => this.renderProp(prop)).join('')}
      </div>
    `;

    // Attach edit handlers
    this.container.querySelectorAll('.prop-value-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const propName = target.dataset['prop']!;
        let value: unknown;

        try {
          value = JSON.parse(target.value);
        } catch {
          value = target.value;
        }

        this.onPropChange?.(propName, value);
      });
    });
  }

  private analyzeProps(props: Record<string, unknown>): PropInfo[] {
    return Object.entries(props).map(([name, value]) => ({
      name,
      value,
      type: this.getType(value),
      isRequired: false,
      isEditable: this.isEditable(value)
    }));
  }

  private getType(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return typeof value;
  }

  private isEditable(value: unknown): boolean {
    const type = typeof value;
    return type === 'string' || type === 'number' || type === 'boolean';
  }

  private renderProp(prop: PropInfo): string {
    const typeColors: Record<string, string> = {
      string: '#10b981',
      number: '#f59e0b',
      boolean: '#8b5cf6',
      object: '#3b82f6',
      array: '#ec4899',
      null: '#888',
      undefined: '#888',
      function: '#ef4444'
    };

    const valueDisplay = this.formatValue(prop.value, prop.type);

    return `
      <div style="padding: 6px 0; border-bottom: 1px solid #333; display: flex; align-items: flex-start; gap: 8px;">
        <span style="color: #3b82f6; min-width: 100px; word-break: break-word;">${prop.name}</span>
        <span style="color: #666;">:</span>
        ${prop.isEditable ? `
          <input
            type="text"
            class="prop-value-input"
            data-prop="${prop.name}"
            value="${this.escapeHtml(String(prop.value))}"
            style="
              flex: 1;
              background: #2d2d2d;
              border: 1px solid #444;
              border-radius: 2px;
              padding: 2px 4px;
              color: ${typeColors[prop.type]};
              font-family: monospace;
              font-size: 11px;
            "
          />
        ` : `
          <span style="color: ${typeColors[prop.type]}; word-break: break-all; flex: 1; font-family: monospace; font-size: 11px;">
            ${valueDisplay}
          </span>
        `}
        <span style="color: #666; font-size: 10px;">${prop.type}</span>
      </div>
    `;
  }

  private formatValue(value: unknown, type: string): string {
    switch (type) {
      case 'string':
        return `"${this.escapeHtml(String(value))}"`;
      case 'object':
      case 'array':
        try {
          return this.escapeHtml(JSON.stringify(value, null, 2));
        } catch {
          return '[Complex Object]';
        }
      case 'function':
        return 'ƒ()';
      default:
        return String(value);
    }
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
