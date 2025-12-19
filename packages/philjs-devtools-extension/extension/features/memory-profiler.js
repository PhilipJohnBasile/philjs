/**
 * PhilJS DevTools - Memory Profiler
 * Track signal memory usage and detect leaks
 */

export class MemoryProfiler {
  constructor(container) {
    this.container = container;
    this.snapshots = [];
    this.currentSnapshot = null;
    this.memoryHistory = [];
    this.leakDetector = new LeakDetector();
    this.chart = null;
    this.maxHistory = 100;

    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="memory-profiler">
        <div class="memory-header">
          <div class="memory-stats">
            <div class="stat-item">
              <label>Current Heap</label>
              <span id="current-heap">0 MB</span>
            </div>
            <div class="stat-item">
              <label>Heap Limit</label>
              <span id="heap-limit">0 MB</span>
            </div>
            <div class="stat-item">
              <label>Signal Count</label>
              <span id="signal-count">0</span>
            </div>
            <div class="stat-item">
              <label>Est. Signal Memory</label>
              <span id="signal-memory">0 KB</span>
            </div>
          </div>
          <div class="memory-actions">
            <button id="take-snapshot-btn" class="btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="2" y="2" width="12" height="12" rx="2"/>
              </svg>
              Take Snapshot
            </button>
            <button id="gc-btn" class="btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2L14 14M2 14L14 2"/>
              </svg>
              Force GC
            </button>
          </div>
        </div>

        <div class="memory-chart">
          <h3>Memory Usage Over Time</h3>
          <canvas id="memory-timeline"></canvas>
        </div>

        <div class="memory-leaks">
          <h3>Potential Memory Leaks</h3>
          <div id="leak-list" class="leak-list"></div>
        </div>

        <div class="memory-snapshots">
          <h3>Heap Snapshots</h3>
          <div id="snapshot-list" class="snapshot-list"></div>
        </div>
      </div>
    `;

    this.setupEventListeners();
    this.setupChart();
  }

  setupEventListeners() {
    const takeSnapshotBtn = this.container.querySelector('#take-snapshot-btn');
    const gcBtn = this.container.querySelector('#gc-btn');

    takeSnapshotBtn?.addEventListener('click', () => this.takeSnapshot());
    gcBtn?.addEventListener('click', () => this.forceGC());
  }

  setupChart() {
    const canvas = this.container.querySelector('#memory-timeline');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    this.chart = { canvas, ctx };

    // Update dimensions
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = 200 * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    canvas.style.width = '100%';
    canvas.style.height = '200px';
  }

  updateMemory(memoryInfo, signals) {
    // Update current stats
    this.updateStats(memoryInfo, signals);

    // Add to history
    this.memoryHistory.push({
      timestamp: Date.now(),
      heapUsed: memoryInfo.usedJSHeapSize,
      heapTotal: memoryInfo.totalJSHeapSize,
      signalCount: signals.length,
      signalMemory: this.estimateSignalMemory(signals)
    });

    // Keep limited history
    if (this.memoryHistory.length > this.maxHistory) {
      this.memoryHistory.shift();
    }

    // Update chart
    this.renderChart();

    // Check for leaks
    this.leakDetector.analyze(signals, memoryInfo);
    this.renderLeaks();
  }

  updateStats(memoryInfo, signals) {
    const currentHeap = this.container.querySelector('#current-heap');
    const heapLimit = this.container.querySelector('#heap-limit');
    const signalCount = this.container.querySelector('#signal-count');
    const signalMemory = this.container.querySelector('#signal-memory');

    if (currentHeap) {
      currentHeap.textContent = this.formatBytes(memoryInfo.usedJSHeapSize);
    }

    if (heapLimit) {
      heapLimit.textContent = this.formatBytes(memoryInfo.jsHeapSizeLimit);
    }

    if (signalCount) {
      signalCount.textContent = signals.length;
    }

    if (signalMemory) {
      const estimated = this.estimateSignalMemory(signals);
      signalMemory.textContent = this.formatBytes(estimated);
    }
  }

  estimateSignalMemory(signals) {
    // Rough estimation of signal memory usage
    let totalBytes = 0;

    signals.forEach(signal => {
      // Base object overhead
      totalBytes += 64;

      // String name
      totalBytes += signal.name.length * 2;

      // Value estimation
      totalBytes += this.estimateValueSize(signal.value);

      // History
      if (signal.history) {
        signal.history.forEach(entry => {
          totalBytes += 32 + this.estimateValueSize(entry.value);
        });
      }

      // Dependencies array
      if (signal.dependencies) {
        totalBytes += signal.dependencies.length * 8;
      }
    });

    return totalBytes;
  }

  estimateValueSize(value) {
    if (value === null || value === undefined) return 8;

    switch (typeof value) {
      case 'boolean':
        return 4;
      case 'number':
        return 8;
      case 'string':
        return value.length * 2;
      case 'object':
        try {
          return JSON.stringify(value).length * 2;
        } catch {
          return 64;
        }
      default:
        return 64;
    }
  }

  renderChart() {
    if (!this.chart) return;

    const { canvas, ctx } = this.chart;
    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;

    ctx.clearRect(0, 0, width, height);

    if (this.memoryHistory.length === 0) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No memory data yet', width / 2, height / 2);
      return;
    }

    const maxHeap = Math.max(...this.memoryHistory.map(h => h.heapUsed));
    const step = width / (this.memoryHistory.length - 1 || 1);

    // Draw heap used line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    this.memoryHistory.forEach((data, i) => {
      const x = i * step;
      const y = height - (data.heapUsed / maxHeap) * (height - 20);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw signal memory line
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();

    this.memoryHistory.forEach((data, i) => {
      const x = i * step;
      const y = height - (data.signalMemory / maxHeap) * (height - 20);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
    ctx.setLineDash([]);

    // Draw labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Max: ${this.formatBytes(maxHeap)}`, 5, 15);

    ctx.fillStyle = '#3b82f6';
    ctx.fillText('■ Heap Used', 5, height - 5);

    ctx.fillStyle = '#10b981';
    ctx.fillText('■ Signal Memory (est.)', 100, height - 5);
  }

  renderLeaks() {
    const leakList = this.container.querySelector('#leak-list');
    if (!leakList) return;

    const leaks = this.leakDetector.getLeaks();

    if (leaks.length === 0) {
      leakList.innerHTML = `
        <div class="empty-state">
          <p>No memory leaks detected</p>
        </div>
      `;
      return;
    }

    leakList.innerHTML = leaks.map(leak => `
      <div class="leak-item ${leak.severity}">
        <div class="leak-header">
          <span class="leak-signal">${this.escapeHtml(leak.signalName)}</span>
          <span class="leak-severity badge ${leak.severity}">${leak.severity}</span>
        </div>
        <div class="leak-message">${this.escapeHtml(leak.message)}</div>
        <div class="leak-details">
          <span>Retention: ${leak.retentionSize ? this.formatBytes(leak.retentionSize) : 'unknown'}</span>
          <span>Updates: ${leak.updateCount}</span>
        </div>
      </div>
    `).join('');
  }

  takeSnapshot() {
    const snapshot = {
      id: `snapshot-${Date.now()}`,
      timestamp: Date.now(),
      memory: this.memoryHistory[this.memoryHistory.length - 1] || {},
      signals: []
    };

    this.snapshots.push(snapshot);
    this.renderSnapshots();

    // Dispatch event
    this.dispatchEvent('snapshotTaken', snapshot);
  }

  renderSnapshots() {
    const snapshotList = this.container.querySelector('#snapshot-list');
    if (!snapshotList) return;

    if (this.snapshots.length === 0) {
      snapshotList.innerHTML = `
        <div class="empty-state">
          <p>No snapshots taken</p>
        </div>
      `;
      return;
    }

    snapshotList.innerHTML = this.snapshots.slice().reverse().map((snapshot, i) => `
      <div class="snapshot-item" data-snapshot-id="${snapshot.id}">
        <div class="snapshot-header">
          <span class="snapshot-name">Snapshot ${this.snapshots.length - i}</span>
          <span class="snapshot-time">${this.formatTimestamp(snapshot.timestamp)}</span>
        </div>
        <div class="snapshot-stats">
          <span>${this.formatBytes(snapshot.memory.heapUsed || 0)}</span>
          <span>${snapshot.memory.signalCount || 0} signals</span>
        </div>
      </div>
    `).join('');
  }

  forceGC() {
    // Note: Actual GC cannot be forced in browser environment
    // This is just for UI demonstration
    this.dispatchEvent('gcRequested', {});

    // Show notification
    alert('Note: JavaScript garbage collection cannot be forced from DevTools.\nThe browser manages memory automatically.');
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  }

  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  dispatchEvent(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    this.container.dispatchEvent(event);
  }

  destroy() {
    this.container.innerHTML = '';
  }
}

class LeakDetector {
  constructor() {
    this.signalHistory = new Map();
    this.leaks = [];
  }

  analyze(signals, memoryInfo) {
    this.leaks = [];

    signals.forEach(signal => {
      const history = this.signalHistory.get(signal.id) || [];
      history.push({
        timestamp: Date.now(),
        updateCount: signal.updateCount,
        subscribers: signal.subscribers || 0,
        memoryEstimate: this.estimateSignalSize(signal)
      });

      // Keep last 50 entries
      if (history.length > 50) {
        history.shift();
      }

      this.signalHistory.set(signal.id, history);

      // Detect potential leaks
      if (history.length >= 10) {
        this.checkForLeak(signal, history);
      }
    });
  }

  checkForLeak(signal, history) {
    // Check for growing memory without cleanup
    const recent = history.slice(-10);
    const memoryGrowth = recent[recent.length - 1].memoryEstimate - recent[0].memoryEstimate;

    // High update count without cleanup
    if (signal.updateCount > 1000 && signal.history && signal.history.length > 500) {
      this.leaks.push({
        signalName: signal.name,
        signalId: signal.id,
        severity: 'warning',
        message: 'Signal has high update count with retained history',
        retentionSize: this.estimateSignalSize(signal),
        updateCount: signal.updateCount
      });
    }

    // Growing memory
    if (memoryGrowth > 10000 && memoryGrowth / recent[0].memoryEstimate > 0.5) {
      this.leaks.push({
        signalName: signal.name,
        signalId: signal.id,
        severity: 'error',
        message: 'Signal memory is growing rapidly',
        retentionSize: memoryGrowth,
        updateCount: signal.updateCount
      });
    }

    // Many subscribers but no updates
    if (signal.subscribers > 50 && recent.every(h => h.updateCount === recent[0].updateCount)) {
      this.leaks.push({
        signalName: signal.name,
        signalId: signal.id,
        severity: 'warning',
        message: 'Signal has many subscribers but is not updating',
        retentionSize: this.estimateSignalSize(signal),
        updateCount: signal.updateCount
      });
    }
  }

  estimateSignalSize(signal) {
    let size = 64; // Base overhead
    size += signal.name.length * 2;
    size += this.estimateValueSize(signal.value);

    if (signal.history) {
      size += signal.history.length * 64;
    }

    if (signal.dependencies) {
      size += signal.dependencies.length * 8;
    }

    return size;
  }

  estimateValueSize(value) {
    if (value === null || value === undefined) return 8;

    switch (typeof value) {
      case 'boolean':
        return 4;
      case 'number':
        return 8;
      case 'string':
        return value.length * 2;
      case 'object':
        try {
          return JSON.stringify(value).length * 2;
        } catch {
          return 64;
        }
      default:
        return 64;
    }
  }

  getLeaks() {
    return this.leaks;
  }
}
