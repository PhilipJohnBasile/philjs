/**
 * State Panel - Display component state and signals
 */
export class StatePanel {
    container = null;
    currentNode = null;
    stateHistory = new Map();
    maxHistorySize = 50;
    constructor(container, maxHistorySize = 50) {
        this.container = container;
        this.maxHistorySize = maxHistorySize;
    }
    setNode(node) {
        this.currentNode = node;
        this.render();
    }
    recordStateChange(path, value) {
        if (!this.stateHistory.has(path)) {
            this.stateHistory.set(path, []);
        }
        const history = this.stateHistory.get(path);
        history.push({ value, timestamp: Date.now() });
        if (history.length > this.maxHistorySize) {
            history.shift();
        }
    }
    render() {
        if (!this.container || !this.currentNode)
            return;
        const signals = this.currentNode.signals;
        const state = this.currentNode.state;
        if (signals.length === 0 && Object.keys(state).length === 0) {
            this.container.innerHTML = `
        <div style="padding: 16px; text-align: center; color: #888;">
          No state or signals
        </div>
      `;
            return;
        }
        let html = '<div style="padding: 8px;">';
        // Signals section
        if (signals.length > 0) {
            html += `
        <div style="margin-bottom: 16px;">
          <div style="font-weight: 600; margin-bottom: 8px; color: #f59e0b; display: flex; align-items: center; gap: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            Signals
          </div>
          ${signals.map(signal => this.renderSignal(signal)).join('')}
        </div>
      `;
        }
        // State section
        if (Object.keys(state).length > 0) {
            html += `
        <div>
          <div style="font-weight: 600; margin-bottom: 8px; color: #3b82f6; display: flex; align-items: center; gap: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18"/>
            </svg>
            State
          </div>
          ${this.renderStateTree(state)}
        </div>
      `;
        }
        html += '</div>';
        this.container.innerHTML = html;
        // Attach expand/collapse handlers
        this.container.querySelectorAll('.state-expand-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const target = e.target;
                const content = target.parentElement?.querySelector('.state-children');
                if (content) {
                    const isHidden = content.style.display === 'none';
                    content.style.display = isHidden ? 'block' : 'none';
                    target.textContent = isHidden ? '▼' : '▶';
                }
            });
        });
    }
    renderSignal(signal) {
        const valueDisplay = this.formatValue(signal.value);
        return `
      <div style="padding: 6px 0; border-bottom: 1px solid #333;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #f59e0b; font-weight: 500;">${signal.name}</span>
          <span style="color: #10b981; font-family: monospace; font-size: 11px;">${valueDisplay}</span>
        </div>
        <div style="font-size: 10px; color: #666; margin-top: 4px;">
          ${signal.subscribers} subscriber${signal.subscribers !== 1 ? 's' : ''} •
          ${signal.updateCount} update${signal.updateCount !== 1 ? 's' : ''}
          ${signal.lastUpdate ? ` • ${this.formatTime(signal.lastUpdate)}` : ''}
        </div>
      </div>
    `;
    }
    renderStateTree(obj, path = [], depth = 0) {
        let html = '';
        for (const [key, value] of Object.entries(obj)) {
            const currentPath = [...path, key];
            const isObject = value !== null && typeof value === 'object';
            const isArray = Array.isArray(value);
            const indent = depth * 12;
            html += `
        <div style="padding: 4px 0; padding-left: ${indent}px; border-bottom: 1px solid #2a2a2a;">
          <div style="display: flex; align-items: flex-start; gap: 6px;">
            ${isObject ? `
              <span class="state-expand-toggle" style="cursor: pointer; color: #666; font-size: 10px; min-width: 12px;">▼</span>
            ` : `
              <span style="min-width: 12px;"></span>
            `}
            <span style="color: #3b82f6;">${key}</span>
            <span style="color: #666;">:</span>
            ${!isObject ? `
              <span style="color: ${this.getValueColor(value)}; font-family: monospace; font-size: 11px;">
                ${this.formatValue(value)}
              </span>
            ` : `
              <span style="color: #666; font-size: 11px;">
                ${isArray ? `Array(${value.length})` : 'Object'}
              </span>
            `}
          </div>
          ${isObject ? `
            <div class="state-children" style="margin-top: 4px;">
              ${this.renderStateTree(value, currentPath, depth + 1)}
            </div>
          ` : ''}
        </div>
      `;
        }
        return html;
    }
    formatValue(value) {
        if (value === null)
            return 'null';
        if (value === undefined)
            return 'undefined';
        if (typeof value === 'string')
            return `"${value}"`;
        if (typeof value === 'function')
            return 'ƒ()';
        if (typeof value === 'object') {
            try {
                return JSON.stringify(value);
            }
            catch {
                return '[Object]';
            }
        }
        return String(value);
    }
    getValueColor(value) {
        if (value === null || value === undefined)
            return '#888';
        switch (typeof value) {
            case 'string': return '#10b981';
            case 'number': return '#f59e0b';
            case 'boolean': return '#8b5cf6';
            default: return '#3b82f6';
        }
    }
    formatTime(timestamp) {
        const diff = Date.now() - timestamp;
        if (diff < 1000)
            return 'just now';
        if (diff < 60000)
            return `${Math.floor(diff / 1000)}s ago`;
        if (diff < 3600000)
            return `${Math.floor(diff / 60000)}m ago`;
        return new Date(timestamp).toLocaleTimeString();
    }
}
//# sourceMappingURL=state-panel.js.map