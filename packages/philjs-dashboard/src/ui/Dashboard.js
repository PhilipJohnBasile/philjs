/**
 * Dashboard Web Component
 * Real-time metrics display with charts, time range selector, and filters
 * Pure Web Component - No React
 */
// ============================================================================
// Time Range Utilities
// ============================================================================
const TIME_RANGE_LABELS = {
    '15m': 'Last 15 minutes',
    '1h': 'Last hour',
    '6h': 'Last 6 hours',
    '24h': 'Last 24 hours',
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    custom: 'Custom range',
};
function getTimeRangeValue(range) {
    const now = Date.now();
    const durations = {
        '15m': 15 * 60 * 1000,
        '1h': 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        custom: 0,
    };
    return {
        start: now - durations[range],
        end: now,
        label: TIME_RANGE_LABELS[range],
    };
}
// ============================================================================
// Styles
// ============================================================================
const styles = `
  :host {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 100vh;
    background-color: var(--dashboard-bg, #f5f5f5);
    color: var(--dashboard-text, #333);
    font-family: system-ui, -apple-system, sans-serif;
  }

  :host([theme="dark"]) {
    --dashboard-bg: #1a1a2e;
    --dashboard-text: #e0e0e0;
    --dashboard-header-bg: #16213e;
    --dashboard-border: #2a2a4a;
    --dashboard-card-bg: #1e1e3e;
    --dashboard-text-secondary: #a0a0c0;
    --dashboard-input-bg: #2a2a4a;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    background-color: var(--dashboard-header-bg, #fff);
    border-bottom: 1px solid var(--dashboard-border, #e0e0e0);
  }

  .header-title {
    font-size: 24px;
    font-weight: 600;
    margin: 0;
  }

  .header-controls {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .tabs {
    display: flex;
    border-bottom: 1px solid var(--dashboard-border, #e0e0e0);
    background-color: var(--dashboard-header-bg, #fff);
    padding-left: 24px;
  }

  .tab {
    padding: 12px 20px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: var(--dashboard-text-secondary, #666);
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
  }

  .tab:hover {
    color: var(--dashboard-primary, #3b82f6);
  }

  .tab.active {
    color: var(--dashboard-primary, #3b82f6);
    border-bottom-color: var(--dashboard-primary, #3b82f6);
  }

  .content {
    flex: 1;
    padding: 24px;
    overflow: auto;
  }

  .select {
    padding: 8px 12px;
    border: 1px solid var(--dashboard-border, #e0e0e0);
    border-radius: 6px;
    background-color: var(--dashboard-input-bg, #fff);
    font-size: 14px;
    cursor: pointer;
    color: inherit;
  }

  .button {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    background-color: var(--dashboard-primary, #3b82f6);
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .button:hover {
    background-color: var(--dashboard-primary-hover, #2563eb);
  }

  .button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 200px;
    font-size: 16px;
    color: var(--dashboard-text-secondary, #666);
  }

  .error {
    padding: 16px;
    background-color: var(--dashboard-error-bg, #fef2f2);
    color: var(--dashboard-error-text, #dc2626);
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
  }

  .card {
    background-color: var(--dashboard-card-bg, #fff);
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .card-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--dashboard-text-secondary, #666);
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .card-value {
    font-size: 32px;
    font-weight: 700;
    color: var(--dashboard-text, #333);
  }

  .card-subtext {
    font-size: 12px;
    color: var(--dashboard-text-secondary, #666);
    margin-top: 4px;
  }
`;
// ============================================================================
// PhilJS Dashboard Component
// ============================================================================
const DEFAULT_TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'metrics', label: 'Metrics' },
    { id: 'traces', label: 'Traces' },
    { id: 'errors', label: 'Errors' },
];
export class PhilDashboard extends HTMLElement {
    static observedAttributes = ['theme', 'refresh-interval'];
    shadow;
    config = null;
    data = {
        metrics: [],
        spans: [],
        errors: [],
        errorGroups: [],
        isLoading: true,
        error: null,
    };
    selectedRange = '1h';
    timeRange = getTimeRangeValue('1h');
    filters = {};
    activeTab = 'overview';
    refreshTimer = null;
    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
        this.render();
        this.setupEventListeners();
        if (this.config) {
            this.fetchData();
            this.startAutoRefresh();
        }
    }
    disconnectedCallback() {
        this.stopAutoRefresh();
    }
    attributeChangedCallback(name, _oldValue, newValue) {
        if (name === 'theme') {
            this.render();
        }
        else if (name === 'refresh-interval' && this.config) {
            this.config.refreshInterval = parseInt(newValue, 10);
            this.startAutoRefresh();
        }
    }
    configure(config) {
        this.config = config;
        this.selectedRange = config.defaultTimeRange || '1h';
        this.timeRange = getTimeRangeValue(this.selectedRange);
        if (config.theme) {
            this.setAttribute('theme', config.theme);
        }
        this.fetchData();
        this.startAutoRefresh();
    }
    async fetchData() {
        if (!this.config)
            return;
        this.data = { ...this.data, isLoading: true, error: null };
        this.render();
        try {
            const result = await this.config.fetchData(this.timeRange, this.filters);
            this.data = { ...result, isLoading: false, error: null };
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Unknown error');
            this.data = { ...this.data, isLoading: false, error: err };
            this.config.onError?.(err);
        }
        this.render();
    }
    startAutoRefresh() {
        this.stopAutoRefresh();
        const interval = this.config?.refreshInterval ?? 30000;
        if (interval > 0) {
            this.refreshTimer = window.setInterval(() => this.fetchData(), interval);
        }
    }
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }
    setupEventListeners() {
        this.shadow.addEventListener('change', (e) => {
            const target = e.target;
            if (target.classList.contains('time-range-select')) {
                this.selectedRange = target.value;
                this.timeRange = getTimeRangeValue(this.selectedRange);
                this.fetchData();
            }
        });
        this.shadow.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('refresh-button')) {
                this.fetchData();
            }
            if (target.classList.contains('tab')) {
                const tabId = target.dataset['tab'];
                if (tabId) {
                    this.activeTab = tabId;
                    this.render();
                }
            }
        });
    }
    renderOverviewCards() {
        const latestMetrics = this.data.metrics[this.data.metrics.length - 1];
        const webVitals = latestMetrics?.webVitals;
        const errorCount = this.data.errors.length;
        const spanCount = this.data.spans.length;
        const avgDuration = spanCount > 0
            ? Math.round(this.data.spans.reduce((sum, s) => sum + (s.duration ?? 0), 0) / spanCount)
            : 0;
        return `
      <div class="grid">
        <div class="card">
          <div class="card-title">LCP</div>
          <div class="card-value">${webVitals?.lcp ? `${Math.round(webVitals.lcp)}ms` : '-'}</div>
          <div class="card-subtext">Largest Contentful Paint</div>
        </div>

        <div class="card">
          <div class="card-title">FID</div>
          <div class="card-value">${webVitals?.fid ? `${Math.round(webVitals.fid)}ms` : '-'}</div>
          <div class="card-subtext">First Input Delay</div>
        </div>

        <div class="card">
          <div class="card-title">CLS</div>
          <div class="card-value">${webVitals?.cls != null ? webVitals.cls.toFixed(3) : '-'}</div>
          <div class="card-subtext">Cumulative Layout Shift</div>
        </div>

        <div class="card">
          <div class="card-title">Errors</div>
          <div class="card-value">${errorCount}</div>
          <div class="card-subtext">${this.data.errorGroups.length} unique issues</div>
        </div>

        <div class="card">
          <div class="card-title">Traces</div>
          <div class="card-value">${spanCount}</div>
          <div class="card-subtext">Avg duration: ${avgDuration}ms</div>
        </div>

        <div class="card">
          <div class="card-title">TTFB</div>
          <div class="card-value">${webVitals?.ttfb ? `${Math.round(webVitals.ttfb)}ms` : '-'}</div>
          <div class="card-subtext">Time to First Byte</div>
        </div>
      </div>
    `;
    }
    render() {
        const tabs = this.config?.tabs ?? DEFAULT_TABS;
        this.shadow.innerHTML = `
      <style>${styles}</style>

      <header class="header">
        <h1 class="header-title">Performance Dashboard</h1>
        <div class="header-controls">
          <slot name="header-content"></slot>
          <select class="select time-range-select">
            <option value="15m" ${this.selectedRange === '15m' ? 'selected' : ''}>Last 15 minutes</option>
            <option value="1h" ${this.selectedRange === '1h' ? 'selected' : ''}>Last hour</option>
            <option value="6h" ${this.selectedRange === '6h' ? 'selected' : ''}>Last 6 hours</option>
            <option value="24h" ${this.selectedRange === '24h' ? 'selected' : ''}>Last 24 hours</option>
            <option value="7d" ${this.selectedRange === '7d' ? 'selected' : ''}>Last 7 days</option>
            <option value="30d" ${this.selectedRange === '30d' ? 'selected' : ''}>Last 30 days</option>
          </select>
          <button class="button refresh-button" ${this.data.isLoading ? 'disabled' : ''}>
            ${this.data.isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </header>

      <nav class="tabs">
        ${tabs.map(tab => `
          <button class="tab ${this.activeTab === tab.id ? 'active' : ''}" data-tab="${tab.id}">
            ${tab.icon ? `<span style="margin-right: 8px">${tab.icon}</span>` : ''}
            ${tab.label}
          </button>
        `).join('')}
      </nav>

      <main class="content">
        ${this.data.error ? `
          <div class="error">
            <strong>Error:</strong> ${this.data.error.message}
          </div>
        ` : ''}

        ${this.data.isLoading && !this.data.metrics.length ? `
          <div class="loading">Loading dashboard data...</div>
        ` : `
          ${this.activeTab === 'overview' ? this.renderOverviewCards() : ''}
          <slot name="${this.activeTab}"></slot>
        `}
      </main>
    `;
    }
}
// Register the component
customElements.define('phil-dashboard', PhilDashboard);
// ============================================================================
// Metric Card Component
// ============================================================================
export class PhilMetricCard extends HTMLElement {
    static observedAttributes = ['title', 'value', 'subtitle', 'trend', 'trend-value', 'color'];
    shadow;
    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
        this.render();
    }
    attributeChangedCallback() {
        this.render();
    }
    render() {
        const title = this.getAttribute('title') || '';
        const value = this.getAttribute('value') || '';
        const subtitle = this.getAttribute('subtitle') || '';
        const trend = this.getAttribute('trend');
        const trendValue = this.getAttribute('trend-value') || '';
        const color = this.getAttribute('color') || 'inherit';
        const trendColors = {
            up: '#22c55e',
            down: '#ef4444',
            neutral: '#6b7280',
        };
        this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .card {
          background-color: var(--dashboard-card-bg, #fff);
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .card-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--dashboard-text-secondary, #666);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .card-value {
          font-size: 32px;
          font-weight: 700;
        }
        .card-subtext {
          font-size: 12px;
          color: var(--dashboard-text-secondary, #666);
          margin-top: 4px;
        }
        .trend {
          margin-right: 8px;
        }
      </style>
      <div class="card">
        <div class="card-title">${title}</div>
        <div class="card-value" style="color: ${color}">${value}</div>
        ${(subtitle || trendValue) ? `
          <div class="card-subtext">
            ${trendValue ? `<span class="trend" style="color: ${trend ? trendColors[trend] : 'inherit'}">${trend === 'up' ? '+' : ''}${trendValue}</span>` : ''}
            ${subtitle}
          </div>
        ` : ''}
      </div>
    `;
    }
}
customElements.define('phil-metric-card', PhilMetricCard);
// ============================================================================
// Chart Container Component
// ============================================================================
export class PhilChartContainer extends HTMLElement {
    static observedAttributes = ['title', 'height'];
    shadow;
    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
        this.render();
    }
    attributeChangedCallback() {
        this.render();
    }
    render() {
        const title = this.getAttribute('title') || '';
        const height = this.getAttribute('height') || '300';
        this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          margin-top: 16px;
        }
        .card {
          background-color: var(--dashboard-card-bg, #fff);
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .card-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--dashboard-text-secondary, #666);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .chart-container {
          margin-top: 16px;
        }
      </style>
      <div class="card">
        <div class="card-title">${title}</div>
        <div class="chart-container" style="height: ${height}px">
          <slot></slot>
        </div>
      </div>
    `;
    }
}
customElements.define('phil-chart-container', PhilChartContainer);
// ============================================================================
// Exports
// ============================================================================
export {};
//# sourceMappingURL=Dashboard.js.map