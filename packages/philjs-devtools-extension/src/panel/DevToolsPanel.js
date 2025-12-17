/**
 * PhilJS DevTools - Main Panel Component
 */
export class DevToolsPanel {
    state;
    container;
    tabs = [];
    activeTab = 'components';
    constructor(container) {
        this.container = container;
        this.state = {
            connected: false,
            signals: new Map(),
            componentTree: null,
            selectedNode: null,
            performance: {
                fps: 0,
                memory: { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 },
                timing: { ttfb: 0, fcp: 0, lcp: 0, fid: 0, cls: 0, inp: 0 },
                renders: [],
                hydration: null,
            },
            networkRequests: [],
            consoleMessages: [],
        };
        this.render();
        this.setupMessageListener();
    }
    setupMessageListener() {
        window.addEventListener('message', (event) => {
            if (event.data?.source !== 'philjs-devtools-client')
                return;
            const message = event.data;
            this.handleMessage(message);
        });
    }
    handleMessage(message) {
        switch (message.type) {
            case 'INIT':
                this.state = { ...this.state, ...message.payload, connected: true };
                break;
            case 'SIGNAL_UPDATE':
                this.state.signals.set(message.payload.id, message.payload);
                break;
            case 'COMPONENT_TREE_UPDATE':
                this.state.componentTree = message.payload;
                break;
            case 'PERFORMANCE_UPDATE':
                this.state.performance = message.payload;
                break;
            case 'NETWORK_REQUEST':
                this.state.networkRequests.push(message.payload);
                break;
            case 'CONSOLE_MESSAGE':
                this.state.consoleMessages.push(message.payload);
                break;
        }
        this.render();
    }
    sendMessage(message) {
        window.postMessage({
            source: 'philjs-devtools-panel',
            ...message,
        }, '*');
    }
    render() {
        this.container.innerHTML = `
      <div class="devtools-panel">
        <header class="devtools-header">
          <div class="devtools-logo">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <circle cx="12" cy="12" r="10" fill="#3b82f6"/>
              <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">P</text>
            </svg>
            <span>PhilJS DevTools</span>
          </div>
          <div class="devtools-status ${this.state.connected ? 'connected' : 'disconnected'}">
            ${this.state.connected ? 'Connected' : 'Disconnected'}
          </div>
        </header>

        <nav class="devtools-tabs">
          ${this.renderTab('components', 'Components')}
          ${this.renderTab('signals', 'Signals')}
          ${this.renderTab('performance', 'Performance')}
          ${this.renderTab('network', 'Network')}
        </nav>

        <main class="devtools-content">
          ${this.renderActiveTab()}
        </main>
      </div>
    `;
        this.attachEventListeners();
    }
    renderTab(id, label) {
        return `
      <button
        class="devtools-tab ${this.activeTab === id ? 'active' : ''}"
        data-tab="${id}"
      >
        ${label}
      </button>
    `;
    }
    renderActiveTab() {
        switch (this.activeTab) {
            case 'components':
                return this.renderComponentsTab();
            case 'signals':
                return this.renderSignalsTab();
            case 'performance':
                return this.renderPerformanceTab();
            case 'network':
                return this.renderNetworkTab();
            default:
                return '';
        }
    }
    renderComponentsTab() {
        if (!this.state.componentTree) {
            return '<div class="devtools-empty">No component tree available</div>';
        }
        return `
      <div class="devtools-split">
        <div class="devtools-tree">
          ${this.renderComponentNode(this.state.componentTree)}
        </div>
        <div class="devtools-inspector">
          ${this.renderComponentInspector()}
        </div>
      </div>
    `;
    }
    renderComponentNode(node, depth = 0) {
        const isSelected = this.state.selectedNode === node.id;
        const indent = depth * 16;
        return `
      <div
        class="component-node ${isSelected ? 'selected' : ''}"
        data-component-id="${node.id}"
        style="padding-left: ${indent}px"
      >
        <span class="component-type">${node.type === 'component' ? '⚛' : '◇'}</span>
        <span class="component-name">${node.name}</span>
        ${node.renderCount > 1 ? `<span class="render-count">${node.renderCount}</span>` : ''}
      </div>
      ${node.children.map(child => this.renderComponentNode(child, depth + 1)).join('')}
    `;
    }
    renderComponentInspector() {
        if (!this.state.selectedNode || !this.state.componentTree) {
            return '<div class="inspector-placeholder">Select a component to inspect</div>';
        }
        const node = this.findComponentById(this.state.componentTree, this.state.selectedNode);
        if (!node)
            return '';
        return `
      <div class="inspector-content">
        <h3>${node.name}</h3>

        <section class="inspector-section">
          <h4>Props</h4>
          <pre>${JSON.stringify(node.props, null, 2)}</pre>
        </section>

        <section class="inspector-section">
          <h4>State</h4>
          <pre>${JSON.stringify(node.state, null, 2)}</pre>
        </section>

        <section class="inspector-section">
          <h4>Signals</h4>
          <ul>
            ${node.signals.map(id => {
            const signal = this.state.signals.get(id);
            return `<li>${signal?.name || id}: ${JSON.stringify(signal?.value)}</li>`;
        }).join('')}
          </ul>
        </section>

        <section class="inspector-section">
          <h4>Performance</h4>
          <p>Render count: ${node.renderCount}</p>
          ${node.renderTime ? `<p>Last render: ${node.renderTime.toFixed(2)}ms</p>` : ''}
        </section>
      </div>
    `;
    }
    renderSignalsTab() {
        const signals = Array.from(this.state.signals.values());
        if (signals.length === 0) {
            return '<div class="devtools-empty">No signals detected</div>';
        }
        return `
      <div class="signals-list">
        <table class="signals-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Value</th>
              <th>Subscribers</th>
              <th>Updates</th>
            </tr>
          </thead>
          <tbody>
            ${signals.map(signal => `
              <tr data-signal-id="${signal.id}">
                <td>${signal.name}</td>
                <td class="signal-value">${JSON.stringify(signal.value)}</td>
                <td>${signal.subscribers}</td>
                <td>${signal.updateCount}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    }
    renderPerformanceTab() {
        const { fps, memory, timing, renders } = this.state.performance;
        return `
      <div class="performance-panel">
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">${fps}</div>
            <div class="metric-label">FPS</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${(memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB</div>
            <div class="metric-label">Memory</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${timing.fcp.toFixed(0)}ms</div>
            <div class="metric-label">FCP</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${timing.lcp.toFixed(0)}ms</div>
            <div class="metric-label">LCP</div>
          </div>
        </div>

        <div class="render-timeline">
          <h4>Recent Renders</h4>
          <ul>
            ${renders.slice(-10).reverse().map(r => `
              <li>
                <span class="render-name">${r.componentName}</span>
                <span class="render-duration">${r.duration.toFixed(2)}ms</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;
    }
    renderNetworkTab() {
        const requests = this.state.networkRequests;
        if (requests.length === 0) {
            return '<div class="devtools-empty">No network requests captured</div>';
        }
        return `
      <div class="network-panel">
        <table class="network-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Method</th>
              <th>URL</th>
              <th>Type</th>
              <th>Duration</th>
              <th>Size</th>
            </tr>
          </thead>
          <tbody>
            ${requests.map(req => `
              <tr class="${req.status >= 400 ? 'error' : ''}">
                <td>${req.status}</td>
                <td>${req.method}</td>
                <td class="url">${req.url}</td>
                <td>${req.type}</td>
                <td>${req.duration}ms</td>
                <td>${(req.size / 1024).toFixed(1)}KB</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    }
    findComponentById(node, id) {
        if (node.id === id)
            return node;
        for (const child of node.children) {
            const found = this.findComponentById(child, id);
            if (found)
                return found;
        }
        return null;
    }
    attachEventListeners() {
        // Tab switching
        this.container.querySelectorAll('.devtools-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.activeTab = tab.dataset.tab || 'components';
                this.render();
            });
        });
        // Component selection
        this.container.querySelectorAll('.component-node').forEach(node => {
            node.addEventListener('click', () => {
                const id = node.dataset.componentId;
                if (id) {
                    this.state.selectedNode = id;
                    this.sendMessage({ type: 'SELECT_COMPONENT', payload: id });
                    this.render();
                }
            });
            node.addEventListener('mouseenter', () => {
                const id = node.dataset.componentId;
                if (id) {
                    this.sendMessage({ type: 'HIGHLIGHT_COMPONENT', payload: id });
                }
            });
            node.addEventListener('mouseleave', () => {
                this.sendMessage({ type: 'HIGHLIGHT_COMPONENT', payload: null });
            });
        });
        // Signal inspection
        this.container.querySelectorAll('[data-signal-id]').forEach(row => {
            row.addEventListener('click', () => {
                const id = row.dataset.signalId;
                if (id) {
                    this.sendMessage({ type: 'INSPECT_SIGNAL', payload: id });
                }
            });
        });
    }
}
// Exports for individual panel sections
export { SignalInspector } from './SignalInspector';
export { ComponentTree } from './ComponentTree';
export { PerformanceProfiler } from './PerformanceProfiler';
export { NetworkInspector } from './NetworkInspector';
//# sourceMappingURL=DevToolsPanel.js.map