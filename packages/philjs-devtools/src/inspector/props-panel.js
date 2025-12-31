/**
 * Props Panel - Display and edit component props
 */
export class PropsPanel {
    container = null;
    currentNode = null;
    onPropChange;
    constructor(container) {
        this.container = container;
    }
    setNode(node) {
        this.currentNode = node;
        this.render();
    }
    onPropsChange(callback) {
        this.onPropChange = callback;
    }
    render() {
        if (!this.container || !this.currentNode)
            return;
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
                const target = e.target;
                const propName = target.dataset['prop'];
                let value;
                try {
                    value = JSON.parse(target.value);
                }
                catch {
                    value = target.value;
                }
                this.onPropChange?.(propName, value);
            });
        });
    }
    analyzeProps(props) {
        return Object.entries(props).map(([name, value]) => ({
            name,
            value,
            type: this.getType(value),
            isRequired: false,
            isEditable: this.isEditable(value)
        }));
    }
    getType(value) {
        if (value === null)
            return 'null';
        if (value === undefined)
            return 'undefined';
        if (Array.isArray(value))
            return 'array';
        if (typeof value === 'object')
            return 'object';
        return typeof value;
    }
    isEditable(value) {
        const type = typeof value;
        return type === 'string' || type === 'number' || type === 'boolean';
    }
    renderProp(prop) {
        const typeColors = {
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
    formatValue(value, type) {
        switch (type) {
            case 'string':
                return `"${this.escapeHtml(String(value))}"`;
            case 'object':
            case 'array':
                try {
                    return this.escapeHtml(JSON.stringify(value, null, 2));
                }
                catch {
                    return '[Complex Object]';
                }
            case 'function':
                return 'ƒ()';
            default:
                return String(value);
        }
    }
    escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}
//# sourceMappingURL=props-panel.js.map