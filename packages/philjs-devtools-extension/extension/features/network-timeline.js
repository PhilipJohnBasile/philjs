/**
 * PhilJS DevTools - Network Timeline
 * Correlate network requests with signal state changes
 */

export class NetworkTimeline {
  constructor(container) {
    this.container = container;
    this.requests = [];
    this.signalUpdates = [];
    this.canvas = null;
    this.ctx = null;
    this.startTime = Date.now();
    this.selectedItem = null;

    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="network-timeline">
        <div class="timeline-controls">
          <button id="clear-timeline-btn" class="btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 2L14 14M2 14L14 2"/>
            </svg>
            Clear
          </button>
          <button id="export-timeline-btn" class="btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2v10M4 8l4 4 4-4"/>
            </svg>
            Export HAR
          </button>
          <div class="timeline-legend">
            <span class="legend-item">
              <span class="legend-color" style="background: #3b82f6"></span>
              Network Request
            </span>
            <span class="legend-item">
              <span class="legend-color" style="background: #10b981"></span>
              Signal Update
            </span>
          </div>
        </div>

        <div class="timeline-view">
          <canvas id="network-timeline-canvas"></canvas>
        </div>

        <div class="timeline-details">
          <div id="timeline-detail-content"></div>
        </div>

        <div class="correlation-list">
          <h3>Correlated Events</h3>
          <div id="correlation-items"></div>
        </div>
      </div>
    `;

    this.setupCanvas();
    this.setupEventListeners();
  }

  setupCanvas() {
    this.canvas = this.container.querySelector('#network-timeline-canvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');

    // Set dimensions
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = 400 * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    this.canvas.style.width = '100%';
    this.canvas.style.height = '400px';
    this.canvas.style.border = '1px solid var(--border)';
    this.canvas.style.borderRadius = '4px';
    this.canvas.style.cursor = 'pointer';

    // Events
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));

    window.addEventListener('resize', () => {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.canvas.width = rect.width * window.devicePixelRatio;
      this.canvas.height = 400 * window.devicePixelRatio;
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      this.render();
    });
  }

  setupEventListeners() {
    const clearBtn = this.container.querySelector('#clear-timeline-btn');
    const exportBtn = this.container.querySelector('#export-timeline-btn');

    clearBtn?.addEventListener('click', () => this.clear());
    exportBtn?.addEventListener('click', () => this.exportHAR());
  }

  addRequest(request) {
    this.requests.push({
      ...request,
      timestamp: Date.now(),
      relativeTime: Date.now() - this.startTime,
      type: 'request'
    });

    this.render();
    this.updateCorrelations();
  }

  addSignalUpdate(signal) {
    this.signalUpdates.push({
      id: signal.id,
      name: signal.name,
      value: signal.value,
      timestamp: Date.now(),
      relativeTime: Date.now() - this.startTime,
      type: 'signal'
    });

    this.render();
    this.updateCorrelations();
  }

  render() {
    if (!this.ctx) return;

    const width = this.canvas.width / window.devicePixelRatio;
    const height = this.canvas.height / window.devicePixelRatio;

    this.ctx.clearRect(0, 0, width, height);

    if (this.requests.length === 0 && this.signalUpdates.length === 0) {
      this.renderEmpty(width, height);
      return;
    }

    // Calculate time range
    const allEvents = [...this.requests, ...this.signalUpdates];
    const maxTime = Math.max(...allEvents.map(e => e.relativeTime + (e.duration || 0)));
    const timeRange = maxTime || 1000;

    // Draw time axis
    this.drawTimeAxis(width, height, timeRange);

    // Draw network requests
    this.drawRequests(width, height, timeRange);

    // Draw signal updates
    this.drawSignalUpdates(width, height, timeRange);

    // Draw correlations
    this.drawCorrelations(width, height, timeRange);
  }

  drawTimeAxis(width, height, timeRange) {
    const axisY = height - 40;

    // Background
    this.ctx.fillStyle = '#f3f4f6';
    this.ctx.fillRect(0, axisY, width, 40);

    // Grid lines
    this.ctx.strokeStyle = '#e5e7eb';
    this.ctx.lineWidth = 1;

    const numTicks = 10;
    for (let i = 0; i <= numTicks; i++) {
      const x = (i / numTicks) * width;

      // Vertical grid line
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, axisY);
      this.ctx.stroke();

      // Tick mark
      this.ctx.beginPath();
      this.ctx.moveTo(x, axisY);
      this.ctx.lineTo(x, axisY + 5);
      this.ctx.stroke();

      // Label
      const time = (i / numTicks) * timeRange;
      this.ctx.fillStyle = '#6b7280';
      this.ctx.font = '10px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.formatTime(time), x, axisY + 20);
    }
  }

  drawRequests(width, height, timeRange) {
    const trackHeight = 30;
    const trackSpacing = 5;
    const maxTracks = Math.floor((height - 100) / (trackHeight + trackSpacing) / 2);

    this.requests.forEach((request, i) => {
      const track = i % maxTracks;
      const x = (request.relativeTime / timeRange) * width;
      const duration = request.duration || 100;
      const barWidth = Math.max((duration / timeRange) * width, 2);
      const y = 50 + track * (trackHeight + trackSpacing);

      // Determine color based on status
      let color = '#3b82f6'; // Blue for success
      if (request.status >= 400) {
        color = '#ef4444'; // Red for error
      } else if (request.status >= 300) {
        color = '#f59e0b'; // Orange for redirect
      }

      // Draw bar
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, y, barWidth, trackHeight);

      // Draw border
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(x, y, barWidth, trackHeight);

      // Store bounds for hit testing
      request.bounds = { x, y, width: barWidth, height: trackHeight };

      // Draw label if wide enough
      if (barWidth > 50) {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '11px sans-serif';
        this.ctx.textBaseline = 'middle';
        const url = new URL(request.url, 'http://dummy').pathname;
        const text = url.length > 20 ? url.slice(0, 17) + '...' : url;
        this.ctx.fillText(text, x + 5, y + trackHeight / 2);
      }
    });

    // Draw section label
    this.ctx.fillStyle = '#111827';
    this.ctx.font = '12px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Network Requests', 10, 35);
  }

  drawSignalUpdates(width, height, timeRange) {
    const markerSize = 8;
    const baseY = height - 80;

    this.signalUpdates.forEach((update, i) => {
      const x = (update.relativeTime / timeRange) * width;
      const y = baseY - (i % 3) * 15;

      // Draw marker
      this.ctx.fillStyle = '#10b981';
      this.ctx.beginPath();
      this.ctx.arc(x, y, markerSize / 2, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Store bounds for hit testing
      update.bounds = { x: x - markerSize, y: y - markerSize, width: markerSize * 2, height: markerSize * 2 };
    });

    // Draw section label
    this.ctx.fillStyle = '#111827';
    this.ctx.font = '12px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Signal Updates', 10, height - 90);
  }

  drawCorrelations(width, height, timeRange) {
    // Draw lines connecting correlated events
    const correlations = this.findCorrelations();

    correlations.forEach(correlation => {
      const request = correlation.request;
      const signal = correlation.signal;

      if (!request.bounds || !signal.bounds) return;

      const x1 = request.bounds.x + request.bounds.width / 2;
      const y1 = request.bounds.y + request.bounds.height;
      const x2 = signal.bounds.x;
      const y2 = signal.bounds.y;

      this.ctx.strokeStyle = '#f59e0b';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([5, 5]);
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    });
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check requests
    const request = this.requests.find(r => {
      if (!r.bounds) return false;
      return x >= r.bounds.x && x <= r.bounds.x + r.bounds.width &&
             y >= r.bounds.y && y <= r.bounds.y + r.bounds.height;
    });

    if (request) {
      this.selectItem(request);
      return;
    }

    // Check signal updates
    const signal = this.signalUpdates.find(s => {
      if (!s.bounds) return false;
      return x >= s.bounds.x && x <= s.bounds.x + s.bounds.width &&
             y >= s.bounds.y && y <= s.bounds.y + s.bounds.height;
    });

    if (signal) {
      this.selectItem(signal);
      return;
    }
  }

  handleMouseMove(e) {
    // Hover effects are handled via CSS :hover pseudo-class
    // Additional tooltip/highlight behavior can be added here if needed
  }

  selectItem(item) {
    this.selectedItem = item;
    this.renderDetails(item);
    this.dispatchEvent('itemSelected', item);
  }

  renderDetails(item) {
    const detailContent = this.container.querySelector('#timeline-detail-content');
    if (!detailContent) return;

    if (item.type === 'request') {
      detailContent.innerHTML = `
        <div class="detail-section">
          <h3>Network Request</h3>
          <div class="detail-grid">
            <div class="detail-row">
              <div class="detail-label">URL</div>
              <div class="detail-value">${this.escapeHtml(item.url)}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Method</div>
              <div class="detail-value">${item.method}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Status</div>
              <div class="detail-value">${item.status} ${this.escapeHtml(item.statusText)}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Duration</div>
              <div class="detail-value">${item.duration}ms</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Timestamp</div>
              <div class="detail-value">${new Date(item.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      `;
    } else if (item.type === 'signal') {
      detailContent.innerHTML = `
        <div class="detail-section">
          <h3>Signal Update</h3>
          <div class="detail-grid">
            <div class="detail-row">
              <div class="detail-label">Name</div>
              <div class="detail-value">${this.escapeHtml(item.name)}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Value</div>
              <div class="detail-value">${JSON.stringify(item.value)}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Timestamp</div>
              <div class="detail-value">${new Date(item.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      `;
    }
  }

  findCorrelations() {
    const correlations = [];
    const timeWindow = 100; // ms

    this.requests.forEach(request => {
      const requestEndTime = request.relativeTime + (request.duration || 0);

      this.signalUpdates.forEach(signal => {
        // Signal updated shortly after request completed
        if (signal.relativeTime >= requestEndTime &&
            signal.relativeTime <= requestEndTime + timeWindow) {
          correlations.push({
            request,
            signal,
            timeDelta: signal.relativeTime - requestEndTime
          });
        }
      });
    });

    return correlations;
  }

  updateCorrelations() {
    const correlations = this.findCorrelations();
    const correlationItems = this.container.querySelector('#correlation-items');

    if (!correlationItems) return;

    if (correlations.length === 0) {
      correlationItems.innerHTML = `
        <div class="empty-state">
          <p>No correlated events found</p>
        </div>
      `;
      return;
    }

    correlationItems.innerHTML = correlations.map(corr => `
      <div class="correlation-item">
        <div class="correlation-header">
          <span class="badge primary">Correlation</span>
          <span class="correlation-delta">Δ ${corr.timeDelta}ms</span>
        </div>
        <div class="correlation-request">
          <strong>Request:</strong> ${this.escapeHtml(corr.request.url)}
        </div>
        <div class="correlation-signal">
          <strong>Signal:</strong> ${this.escapeHtml(corr.signal.name)}
        </div>
      </div>
    `).join('');
  }

  renderEmpty(width, height) {
    this.ctx.fillStyle = '#9ca3af';
    this.ctx.font = '14px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('No network activity or signal updates', width / 2, height / 2);
  }

  exportHAR() {
    // Export as HAR (HTTP Archive) format
    const har = {
      log: {
        version: '1.2',
        creator: {
          name: 'PhilJS DevTools',
          version: '1.0.0'
        },
        entries: this.requests.map(req => ({
          startedDateTime: new Date(req.timestamp).toISOString(),
          time: req.duration,
          request: {
            method: req.method,
            url: req.url,
            httpVersion: 'HTTP/1.1',
            headers: [],
            queryString: [],
            cookies: [],
            headersSize: -1,
            bodySize: -1
          },
          response: {
            status: req.status,
            statusText: req.statusText,
            httpVersion: 'HTTP/1.1',
            headers: [],
            cookies: [],
            content: {
              size: -1,
              mimeType: 'application/json'
            },
            redirectURL: '',
            headersSize: -1,
            bodySize: -1
          },
          cache: {},
          timings: {
            send: 0,
            wait: req.duration,
            receive: 0
          }
        }))
      }
    };

    const blob = new Blob([JSON.stringify(har, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `philjs-network-${Date.now()}.har`;
    a.click();
    URL.revokeObjectURL(url);
  }

  formatTime(ms) {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    } else {
      return `${(ms / 1000).toFixed(2)}s`;
    }
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  clear() {
    this.requests = [];
    this.signalUpdates = [];
    this.selectedItem = null;
    this.startTime = Date.now();
    this.render();
    this.updateCorrelations();
    this.container.querySelector('#timeline-detail-content').innerHTML = '';
  }

  dispatchEvent(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    this.container.dispatchEvent(event);
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
