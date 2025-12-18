// PhilJS DevTools - Panel Script

(function() {
  'use strict';

  // State
  const state = {
    connected: false,
    signals: new Map(),
    components: new Map(),
    performance: {
      fps: 0,
      memory: { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 },
      renders: [],
      effects: [],
      fpsHistory: [],
      memoryHistory: []
    },
    snapshots: [],
    currentSnapshotIndex: -1,
    networkRequests: [],
    selectedSignal: null,
    selectedComponent: null,
    selectedSnapshot: null,
    componentTree: null
  };

  // Performance charts
  let fpsChart = null;
  let memoryChart = null;

  // Initialize
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    console.log('[PhilJS DevTools] Panel initializing...');

    setupTabs();
    setupSignalsPanel();
    setupComponentsPanel();
    setupPerformancePanel();
    setupTimeTravelPanel();
    setupNetworkPanel();
    setupMessageHandling();
    setupCharts();

    // Request initial state
    sendToPage({ type: 'GET_STATE' });

    console.log('[PhilJS DevTools] Panel initialized');
  }

  // Tab Management
  function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const panels = document.querySelectorAll('.panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetPanel = tab.dataset.tab;

        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        document.getElementById(`${targetPanel}-panel`).classList.add('active');
      });
    });
  }

  // Signals Panel
  function setupSignalsPanel() {
    const searchInput = document.getElementById('signal-search');
    const clearBtn = document.getElementById('signal-clear-btn');
    const refreshBtn = document.getElementById('signal-refresh-btn');

    searchInput?.addEventListener('input', (e) => {
      filterSignals(e.target.value);
    });

    clearBtn?.addEventListener('click', () => {
      state.signals.clear();
      renderSignals();
    });

    refreshBtn?.addEventListener('click', () => {
      sendToPage({ type: 'GET_STATE' });
    });
  }

  function renderSignals(filter = '') {
    const container = document.getElementById('signal-items');
    if (!container) return;

    const signals = Array.from(state.signals.values())
      .filter(s => !filter || s.name.toLowerCase().includes(filter.toLowerCase()));

    if (signals.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No signals detected</p>
          <small>Signals will appear here when your app creates them</small>
        </div>
      `;
      return;
    }

    container.innerHTML = signals.map(signal => `
      <div class="list-item ${state.selectedSignal?.id === signal.id ? 'selected' : ''}"
           data-signal-id="${signal.id}">
        <div class="list-item-name">${escapeHtml(signal.name)}</div>
        <div class="list-item-value">${formatValue(signal.value)}</div>
        <div class="list-item-meta">${signal.updateCount}</div>
      </div>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.list-item').forEach(item => {
      item.addEventListener('click', () => {
        const signalId = item.dataset.signalId;
        selectSignal(signalId);
      });
    });
  }

  function selectSignal(signalId) {
    state.selectedSignal = state.signals.get(signalId);
    renderSignals();
    renderSignalDetails();
    renderDependencyGraph();
  }

  function renderSignalDetails() {
    const container = document.getElementById('signal-detail-content');
    if (!container) return;

    const signal = state.selectedSignal;
    if (!signal) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Select a signal to view details</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="detail-section">
        <h3>Signal: ${escapeHtml(signal.name)}</h3>
        <div class="detail-grid">
          <div class="detail-row">
            <div class="detail-label">ID</div>
            <div class="detail-value">${escapeHtml(signal.id)}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Current Value</div>
            <div class="detail-value">${formatValue(signal.value, true)}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Type</div>
            <div class="detail-value">${typeof signal.value}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Update Count</div>
            <div class="detail-value">${signal.updateCount}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Subscribers</div>
            <div class="detail-value">${signal.subscribers || 0}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Dependencies</div>
            <div class="detail-value">${(signal.dependencies || []).length}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Created At</div>
            <div class="detail-value">${formatTimestamp(signal.createdAt)}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Last Updated</div>
            <div class="detail-value">${formatTimestamp(signal.lastUpdated)}</div>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h3>Update History</h3>
        ${renderSignalHistory(signal)}
      </div>

      <div class="detail-section">
        <h3>Source</h3>
        <div class="code-block">${escapeHtml(signal.source || 'unknown')}</div>
      </div>
    `;
  }

  function renderSignalHistory(signal) {
    if (!signal.history || signal.history.length === 0) {
      return '<div class="empty-state"><p>No history</p></div>';
    }

    return `
      <div class="list-items" style="max-height: 300px;">
        ${signal.history.slice().reverse().map(entry => `
          <div class="history-item">
            <div class="history-item-header">
              <div class="history-item-action">${escapeHtml(entry.trigger || 'update')}</div>
              <div class="history-item-time">${formatTimestamp(entry.timestamp)}</div>
            </div>
            <div class="history-item-value">${formatValue(entry.value)}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function filterSignals(search) {
    renderSignals(search);
  }

  // Components Panel
  function setupComponentsPanel() {
    const searchInput = document.getElementById('component-search');
    const expandBtn = document.getElementById('component-expand-btn');
    const collapseBtn = document.getElementById('component-collapse-btn');
    const refreshBtn = document.getElementById('component-refresh-btn');

    searchInput?.addEventListener('input', (e) => {
      filterComponents(e.target.value);
    });

    expandBtn?.addEventListener('click', () => {
      expandAllNodes();
    });

    collapseBtn?.addEventListener('click', () => {
      collapseAllNodes();
    });

    refreshBtn?.addEventListener('click', () => {
      sendToPage({ type: 'GET_STATE' });
    });
  }

  function renderComponentTree(tree = state.componentTree) {
    const container = document.getElementById('component-tree-items');
    if (!container) return;

    if (!tree) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No components detected</p>
          <small>The component tree will appear here</small>
        </div>
      `;
      return;
    }

    container.innerHTML = renderTreeNode(tree);

    // Add event listeners
    container.querySelectorAll('.tree-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const nodeId = toggle.closest('.tree-node').dataset.nodeId;
        toggleNode(nodeId);
      });
    });

    container.querySelectorAll('.tree-node-content').forEach(content => {
      content.addEventListener('click', () => {
        const nodeId = content.closest('.tree-node').dataset.nodeId;
        selectComponent(nodeId);
      });

      content.addEventListener('mouseenter', () => {
        const nodeId = content.closest('.tree-node').dataset.nodeId;
        highlightComponent(nodeId);
      });

      content.addEventListener('mouseleave', () => {
        highlightComponent(null);
      });
    });
  }

  function renderTreeNode(node, depth = 0) {
    const hasChildren = node.children && node.children.length > 0;
    const indent = depth * 20;

    return `
      <div class="tree-node" data-node-id="${node.id}">
        <div class="tree-node-content ${state.selectedComponent?.id === node.id ? 'selected' : ''}"
             style="margin-left: ${indent}px">
          ${hasChildren ? `
            <button class="tree-toggle">
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M6 4L10 8L6 12"/>
              </svg>
            </button>
          ` : '<span style="width: 16px"></span>'}
          <span class="tree-node-name">${escapeHtml(node.name)}</span>
          <span class="tree-node-type">${node.type}</span>
          ${node.isIsland ? '<span class="badge primary">island</span>' : ''}
          ${node.isHydrated ? '<span class="badge success">hydrated</span>' : ''}
        </div>
        ${hasChildren ? `
          <div class="tree-node-children">
            ${node.children.map(child => renderTreeNode(child, depth + 1)).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  function toggleNode(nodeId) {
    const node = document.querySelector(`[data-node-id="${nodeId}"]`);
    if (!node) return;

    const children = node.querySelector('.tree-node-children');
    const toggle = node.querySelector('.tree-toggle');

    if (children && toggle) {
      children.classList.toggle('expanded');
      toggle.classList.toggle('expanded');
    }
  }

  function expandAllNodes() {
    document.querySelectorAll('.tree-node-children').forEach(el => {
      el.classList.add('expanded');
    });
    document.querySelectorAll('.tree-toggle').forEach(el => {
      el.classList.add('expanded');
    });
  }

  function collapseAllNodes() {
    document.querySelectorAll('.tree-node-children').forEach(el => {
      el.classList.remove('expanded');
    });
    document.querySelectorAll('.tree-toggle').forEach(el => {
      el.classList.remove('expanded');
    });
  }

  function selectComponent(componentId) {
    const component = findComponentById(state.componentTree, componentId);
    state.selectedComponent = component;
    renderComponentTree();
    renderComponentDetails();
    sendToPage({ type: 'SELECT_COMPONENT', payload: componentId });
  }

  function highlightComponent(componentId) {
    sendToPage({ type: 'HIGHLIGHT_COMPONENT', payload: componentId });
  }

  function renderComponentDetails() {
    const container = document.getElementById('component-detail-content');
    if (!container) return;

    const component = state.selectedComponent;
    if (!component) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Select a component to view details</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="detail-section">
        <h3>Component: ${escapeHtml(component.name)}</h3>
        <div class="detail-grid">
          <div class="detail-row">
            <div class="detail-label">ID</div>
            <div class="detail-value">${escapeHtml(component.id)}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Type</div>
            <div class="detail-value">${component.type}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Render Count</div>
            <div class="detail-value">${component.renderCount || 0}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Avg Render Time</div>
            <div class="detail-value">${(component.averageRenderTime || 0).toFixed(2)}ms</div>
          </div>
          ${component.isIsland ? `
            <div class="detail-row">
              <div class="detail-label">Island</div>
              <div class="detail-value"><span class="badge primary">Yes</span></div>
            </div>
          ` : ''}
          ${component.isHydrated ? `
            <div class="detail-row">
              <div class="detail-label">Hydrated</div>
              <div class="detail-value"><span class="badge success">Yes</span></div>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="detail-section">
        <h3>Props</h3>
        <div class="code-block">${formatValue(component.props, true)}</div>
      </div>

      ${component.state && Object.keys(component.state).length > 0 ? `
        <div class="detail-section">
          <h3>State</h3>
          <div class="code-block">${formatValue(component.state, true)}</div>
        </div>
      ` : ''}

      ${component.signals && component.signals.length > 0 ? `
        <div class="detail-section">
          <h3>Signals</h3>
          <div class="list-items">
            ${component.signals.map(signalId => {
              const signal = state.signals.get(signalId);
              return signal ? `
                <div class="list-item" onclick="selectSignalById('${signalId}')">
                  <div class="list-item-name">${escapeHtml(signal.name)}</div>
                  <div class="list-item-value">${formatValue(signal.value)}</div>
                </div>
              ` : '';
            }).join('')}
          </div>
        </div>
      ` : ''}
    `;
  }

  function filterComponents(search) {
    // TODO: Implement component filtering
    renderComponentTree();
  }

  // Performance Panel
  function setupPerformancePanel() {
    const recordBtn = document.getElementById('perf-record-btn');
    const clearBtn = document.getElementById('perf-clear-btn');

    recordBtn?.addEventListener('click', () => {
      // TODO: Implement recording
    });

    clearBtn?.addEventListener('click', () => {
      state.performance.renders = [];
      state.performance.fpsHistory = [];
      state.performance.memoryHistory = [];
      renderPerformance();
    });
  }

  function setupCharts() {
    const fpsCanvas = document.getElementById('fps-chart');
    const memoryCanvas = document.getElementById('memory-chart');

    if (fpsCanvas) {
      const ctx = fpsCanvas.getContext('2d');
      fpsChart = { canvas: fpsCanvas, ctx };
    }

    if (memoryCanvas) {
      const ctx = memoryCanvas.getContext('2d');
      memoryChart = { canvas: memoryCanvas, ctx };
    }
  }

  function renderPerformance() {
    // Update metrics
    document.getElementById('fps-value').textContent = Math.round(state.performance.fps);
    document.getElementById('memory-value').textContent = formatBytes(state.performance.memory.usedJSHeapSize);
    document.getElementById('render-count').textContent = state.performance.renders.length;

    // Update charts
    updateFPSChart();
    updateMemoryChart();
    updateRenderTimeline();
    updateRenderList();
  }

  function updateFPSChart() {
    if (!fpsChart) return;

    const { canvas, ctx } = fpsChart;
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;

    ctx.clearRect(0, 0, width, height);

    const data = state.performance.fpsHistory.slice(-60);
    if (data.length === 0) return;

    const maxFps = 60;
    const step = width / (data.length - 1 || 1);

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((fps, i) => {
      const x = i * step;
      const y = height - (fps / maxFps) * height;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw 60fps line
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, 0);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function updateMemoryChart() {
    if (!memoryChart) return;

    const { canvas, ctx } = memoryChart;
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;

    ctx.clearRect(0, 0, width, height);

    const data = state.performance.memoryHistory.slice(-60);
    if (data.length === 0) return;

    const maxMemory = Math.max(...data, state.performance.memory.jsHeapSizeLimit);
    const step = width / (data.length - 1 || 1);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((memory, i) => {
      const x = i * step;
      const y = height - (memory / maxMemory) * height;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  }

  function updateRenderTimeline() {
    const container = document.getElementById('render-timeline');
    if (!container) return;

    const renders = state.performance.renders.slice(-50);
    if (renders.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No renders</p></div>';
      return;
    }

    const minTime = Math.min(...renders.map(r => r.timestamp));
    const maxTime = Math.max(...renders.map(r => r.timestamp));
    const timeRange = maxTime - minTime || 1;

    container.innerHTML = renders.map((render, i) => {
      const left = ((render.timestamp - minTime) / timeRange) * 100;
      const width = Math.max((render.duration / timeRange) * 100, 0.5);
      const top = (i % 5) * 25 + 10;

      return `
        <div class="timeline-item"
             style="left: ${left}%; width: ${width}%; top: ${top}px"
             title="${render.componentName}: ${render.duration.toFixed(2)}ms">
          ${render.componentName}
        </div>
      `;
    }).join('');
  }

  function updateRenderList() {
    const container = document.getElementById('render-items');
    if (!container) return;

    const renders = state.performance.renders.slice().reverse().slice(0, 50);

    if (renders.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No renders recorded</p></div>';
      return;
    }

    container.innerHTML = renders.map(render => `
      <div class="list-item">
        <div class="list-item-name">${escapeHtml(render.componentName)}</div>
        <div class="list-item-value">${render.duration.toFixed(2)}ms</div>
        <div class="list-item-meta">${formatTimestamp(render.timestamp)}</div>
      </div>
    `).join('');
  }

  // Time Travel Panel
  function setupTimeTravelPanel() {
    const prevBtn = document.getElementById('tt-prev-btn');
    const nextBtn = document.getElementById('tt-next-btn');
    const snapshotBtn = document.getElementById('tt-snapshot-btn');
    const clearBtn = document.getElementById('tt-clear-btn');

    prevBtn?.addEventListener('click', () => {
      if (state.currentSnapshotIndex > 0) {
        restoreSnapshot(state.snapshots[state.currentSnapshotIndex - 1].id);
      }
    });

    nextBtn?.addEventListener('click', () => {
      if (state.currentSnapshotIndex < state.snapshots.length - 1) {
        restoreSnapshot(state.snapshots[state.currentSnapshotIndex + 1].id);
      }
    });

    snapshotBtn?.addEventListener('click', () => {
      sendToPage({ type: 'CAPTURE_SNAPSHOT' });
    });

    clearBtn?.addEventListener('click', () => {
      state.snapshots = [];
      state.currentSnapshotIndex = -1;
      sendToPage({ type: 'CLEAR_HISTORY' });
      renderTimeTravel();
    });
  }

  function renderTimeTravel() {
    updateTimeTravelControls();
    renderSnapshotTimeline();
    renderSnapshotList();
  }

  function updateTimeTravelControls() {
    const prevBtn = document.getElementById('tt-prev-btn');
    const nextBtn = document.getElementById('tt-next-btn');
    const position = document.getElementById('tt-position');

    if (prevBtn) prevBtn.disabled = state.currentSnapshotIndex <= 0;
    if (nextBtn) nextBtn.disabled = state.currentSnapshotIndex >= state.snapshots.length - 1;
    if (position) position.textContent = `${state.currentSnapshotIndex + 1} / ${state.snapshots.length}`;
  }

  function renderSnapshotTimeline() {
    const container = document.getElementById('snapshot-timeline');
    if (!container) return;

    if (state.snapshots.length === 0) {
      container.innerHTML = '';
      return;
    }

    const width = container.offsetWidth;
    const spacing = width / (state.snapshots.length + 1);

    container.innerHTML = `
      <div class="snapshot-line"></div>
      ${state.snapshots.map((snapshot, i) => `
        <div class="snapshot-marker ${i === state.currentSnapshotIndex ? 'current' : ''}"
             style="left: ${(i + 1) * spacing}px"
             data-snapshot-id="${snapshot.id}"
             title="${snapshot.action} - ${formatTimestamp(snapshot.timestamp)}">
        </div>
      `).join('')}
    `;

    container.querySelectorAll('.snapshot-marker').forEach(marker => {
      marker.addEventListener('click', () => {
        const snapshotId = marker.dataset.snapshotId;
        restoreSnapshot(snapshotId);
      });
    });
  }

  function renderSnapshotList() {
    const container = document.getElementById('snapshot-items');
    if (!container) return;

    if (state.snapshots.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No snapshots captured</p>
          <small>Click "Capture Snapshot" to save the current state</small>
        </div>
      `;
      return;
    }

    container.innerHTML = state.snapshots.slice().reverse().map((snapshot, i) => {
      const index = state.snapshots.length - 1 - i;
      return `
        <div class="list-item ${index === state.currentSnapshotIndex ? 'selected' : ''}"
             data-snapshot-id="${snapshot.id}">
          <div class="list-item-name">
            ${escapeHtml(snapshot.action)}
            ${index === state.currentSnapshotIndex ? '<span class="badge success">Current</span>' : ''}
          </div>
          <div class="list-item-value">${snapshot.signals?.length || 0} signals</div>
          <div class="list-item-meta">${formatTimestamp(snapshot.timestamp)}</div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.list-item').forEach(item => {
      item.addEventListener('click', () => {
        const snapshotId = item.dataset.snapshotId;
        selectSnapshot(snapshotId);
      });

      item.addEventListener('dblclick', () => {
        const snapshotId = item.dataset.snapshotId;
        restoreSnapshot(snapshotId);
      });
    });
  }

  function selectSnapshot(snapshotId) {
    state.selectedSnapshot = state.snapshots.find(s => s.id === snapshotId);
    renderSnapshotList();
    renderSnapshotDetails();
  }

  function restoreSnapshot(snapshotId) {
    sendToPage({ type: 'RESTORE_SNAPSHOT', payload: snapshotId });
  }

  function renderSnapshotDetails() {
    const container = document.getElementById('snapshot-detail-content');
    if (!container) return;

    const snapshot = state.selectedSnapshot;
    if (!snapshot) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Select a snapshot to view details</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="detail-section">
        <h3>Snapshot: ${escapeHtml(snapshot.action)}</h3>
        <div class="detail-grid">
          <div class="detail-row">
            <div class="detail-label">Timestamp</div>
            <div class="detail-value">${formatTimestamp(snapshot.timestamp)}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Signals</div>
            <div class="detail-value">${snapshot.signals?.length || 0}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Components</div>
            <div class="detail-value">${snapshot.components?.length || 0}</div>
          </div>
        </div>
      </div>

      ${snapshot.signals && snapshot.signals.length > 0 ? `
        <div class="detail-section">
          <h3>Signal States</h3>
          <div class="list-items" style="max-height: 400px;">
            ${snapshot.signals.map(signal => `
              <div class="list-item">
                <div class="list-item-name">${escapeHtml(signal.name)}</div>
                <div class="list-item-value">${formatValue(signal.value)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
  }

  // Network Panel
  function setupNetworkPanel() {
    const searchInput = document.getElementById('network-search');
    const clearBtn = document.getElementById('network-clear-btn');

    searchInput?.addEventListener('input', (e) => {
      filterNetworkRequests(e.target.value);
    });

    clearBtn?.addEventListener('click', () => {
      state.networkRequests = [];
      renderNetworkRequests();
    });
  }

  function renderNetworkRequests(filter = '') {
    const container = document.getElementById('network-items');
    if (!container) return;

    const requests = state.networkRequests
      .filter(r => !filter || r.url.toLowerCase().includes(filter.toLowerCase()));

    if (requests.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No network requests</p>
          <small>Network requests will appear here</small>
        </div>
      `;
      return;
    }

    container.innerHTML = requests.map(request => `
      <div class="list-item">
        <div class="list-item-name">
          <span class="badge ${getStatusBadgeClass(request.status)}">${request.method}</span>
          ${escapeHtml(request.url)}
        </div>
        <div class="list-item-value">${request.status} ${escapeHtml(request.statusText)}</div>
        <div class="list-item-meta">${request.duration}ms</div>
      </div>
    `).join('');
  }

  function filterNetworkRequests(search) {
    renderNetworkRequests(search);
  }

  // Message Handling
  function setupMessageHandling() {
    // Connect to background script
    const port = chrome.runtime.connect({ name: 'philjs-devtools' });

    // Listen for messages
    port.onMessage.addListener((message) => {
      handleMessage(message);
    });

    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'FORWARD_TO_PANEL') {
        handleMessage(message.payload);
      }
    });

    // Listen for tab updates
    chrome.devtools.network.onNavigated.addListener(() => {
      resetState();
      sendToPage({ type: 'GET_STATE' });
    });

    console.log('[PhilJS DevTools] Message handling set up');
  }

  function handleMessage(message) {
    if (!message || message.source !== 'philjs-devtools-client') return;

    console.log('[PhilJS DevTools] Received message:', message.type);

    switch (message.type) {
      case 'INIT':
        handleInit(message.payload);
        break;

      case 'SIGNAL_REGISTERED':
      case 'SIGNAL_UPDATE':
        handleSignalUpdate(message.payload);
        break;

      case 'COMPONENT_TREE':
        handleComponentTree(message.payload);
        break;

      case 'COMPONENT_RENDER':
        handleComponentRender(message.payload);
        break;

      case 'PERFORMANCE_UPDATE':
        handlePerformanceUpdate(message.payload);
        break;

      case 'SNAPSHOT_CAPTURED':
        handleSnapshotCaptured(message.payload);
        break;

      case 'NETWORK_REQUEST':
        handleNetworkRequest(message.payload);
        break;
    }
  }

  function handleInit(payload) {
    state.connected = true;
    updateConnectionStatus();

    if (payload.signals) {
      payload.signals.forEach(signal => {
        state.signals.set(signal.id, signal);
      });
    }

    if (payload.tree) {
      state.componentTree = payload.tree;
    }

    if (payload.performance) {
      Object.assign(state.performance, payload.performance);
    }

    if (payload.history) {
      state.snapshots = payload.history.snapshots || [];
      state.currentSnapshotIndex = payload.history.currentIndex || -1;
    }

    renderAll();
  }

  function handleSignalUpdate(signal) {
    state.signals.set(signal.id, signal);
    renderSignals();
    if (state.selectedSignal?.id === signal.id) {
      renderSignalDetails();
    }
  }

  function handleComponentTree(tree) {
    state.componentTree = tree;
    renderComponentTree();
  }

  function handleComponentRender(payload) {
    if (payload.component) {
      state.components.set(payload.component.id, payload.component);
    }

    if (payload.duration !== undefined) {
      state.performance.renders.push({
        componentId: payload.component.id,
        componentName: payload.component.name,
        duration: payload.duration,
        timestamp: Date.now(),
        cause: 'render'
      });

      // Keep only recent renders
      if (state.performance.renders.length > 100) {
        state.performance.renders = state.performance.renders.slice(-100);
      }
    }

    renderPerformance();
  }

  function handlePerformanceUpdate(perf) {
    state.performance.fps = perf.fps || state.performance.fps;
    state.performance.memory = perf.memory || state.performance.memory;

    // Track history
    if (perf.fps) {
      state.performance.fpsHistory.push(perf.fps);
      if (state.performance.fpsHistory.length > 60) {
        state.performance.fpsHistory.shift();
      }
    }

    if (perf.memory) {
      state.performance.memoryHistory.push(perf.memory.usedJSHeapSize);
      if (state.performance.memoryHistory.length > 60) {
        state.performance.memoryHistory.shift();
      }
    }

    renderPerformance();
  }

  function handleSnapshotCaptured(payload) {
    if (payload.snapshot) {
      const existingIndex = state.snapshots.findIndex(s => s.id === payload.snapshot.id);
      if (existingIndex >= 0) {
        state.snapshots[existingIndex] = payload.snapshot;
      } else {
        state.snapshots.push(payload.snapshot);
      }
    }

    if (payload.currentIndex !== undefined) {
      state.currentSnapshotIndex = payload.currentIndex;
    }

    renderTimeTravel();
  }

  function handleNetworkRequest(request) {
    state.networkRequests.push(request);
    if (state.networkRequests.length > 100) {
      state.networkRequests.shift();
    }
    renderNetworkRequests();
  }

  function updateConnectionStatus() {
    const indicator = document.getElementById('connection-indicator');
    const text = document.getElementById('connection-text');

    if (indicator) {
      indicator.className = `status-indicator ${state.connected ? 'connected' : 'disconnected'}`;
    }

    if (text) {
      text.textContent = state.connected ? 'Connected' : 'Disconnected';
    }
  }

  function sendToPage(message) {
    chrome.devtools.inspectedWindow.eval(`
      window.postMessage({
        source: 'philjs-devtools-panel',
        ...${JSON.stringify(message)}
      }, '*');
    `);
  }

  // Utility Functions
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatValue(value, multiline = false) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'function') return '[Function]';

    if (typeof value === 'object') {
      try {
        const json = JSON.stringify(value, null, multiline ? 2 : 0);
        return multiline ? json : json.slice(0, 100) + (json.length > 100 ? '...' : '');
      } catch {
        return '[Object]';
      }
    }

    const str = String(value);
    return multiline ? str : str.slice(0, 100) + (str.length > 100 ? '...' : '');
  }

  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString() + '.' + date.getMilliseconds();
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  }

  function getStatusBadgeClass(status) {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 400) return 'error';
    return 'warning';
  }

  function findComponentById(node, id) {
    if (!node) return null;
    if (node.id === id) return node;

    for (const child of node.children || []) {
      const found = findComponentById(child, id);
      if (found) return found;
    }

    return null;
  }

  function renderAll() {
    renderSignals();
    renderComponentTree();
    renderPerformance();
    renderTimeTravel();
    renderNetworkRequests();
  }

  function resetState() {
    state.connected = false;
    state.signals.clear();
    state.components.clear();
    state.componentTree = null;
    state.selectedSignal = null;
    state.selectedComponent = null;
    state.selectedSnapshot = null;
    updateConnectionStatus();
    renderAll();
  }

  function renderDependencyGraph() {
    const canvas = document.getElementById('dependency-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = 200;

    ctx.clearRect(0, 0, width, height);

    // Simple visualization of signal dependencies
    const signal = state.selectedSignal;
    if (!signal) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 30;

    // Draw central signal
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(signal.name.slice(0, 10), centerX, centerY);

    // Draw dependencies
    const deps = signal.dependencies || [];
    deps.forEach((depId, i) => {
      const angle = (Math.PI * 2 * i) / deps.length;
      const x = centerX + Math.cos(angle) * 100;
      const y = centerY + Math.sin(angle) * 80;

      // Draw line
      ctx.strokeStyle = '#d1d5db';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Draw dependency node
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();

      const depSignal = state.signals.get(depId);
      if (depSignal) {
        ctx.fillStyle = '#fff';
        ctx.fillText(depSignal.name.slice(0, 8), x, y);
      }
    });
  }

  // Make selectSignalById available globally for onclick handlers
  window.selectSignalById = function(signalId) {
    selectSignal(signalId);
    document.querySelector('[data-tab="signals"]')?.click();
  };

})();
