// PhilJS DevTools - Advanced Panel Script
// Integrates all advanced features

import { DependencyGraph } from './features/dependency-graph.js';
import { Flamegraph } from './features/flamegraph.js';
import { MemoryProfiler } from './features/memory-profiler.js';
import { NetworkTimeline } from './features/network-timeline.js';
import { StateExporter } from './features/state-export.js';
import { SignalDiff } from './features/signal-diff.js';
import { Breakpoints } from './features/breakpoints.js';
import { SearchFilter } from './features/search-filter.js';

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

  // Feature instances
  let dependencyGraph = null;
  let flamegraph = null;
  let memoryProfiler = null;
  let networkTimeline = null;
  let stateExporter = null;
  let signalDiff = null;
  let breakpoints = null;
  let searchFilter = null;

  // Performance charts
  let fpsChart = null;
  let memoryChart = null;

  // Initialize
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    console.log('[PhilJS DevTools] Advanced panel initializing...');

    setupTabs();
    setupSignalsPanel();
    setupComponentsPanel();
    setupPerformancePanel();
    setupAdvancedFeatures();
    setupMessageHandling();
    setupCharts();

    // Request initial state
    sendToPage({ type: 'GET_STATE' });

    console.log('[PhilJS DevTools] Advanced panel initialized');
  }

  // Advanced Features Setup
  function setupAdvancedFeatures() {
    // Dependency Graph
    const graphContainer = document.getElementById('dependency-graph-container');
    if (graphContainer) {
      dependencyGraph = new DependencyGraph(graphContainer);
      graphContainer.addEventListener('nodeClick', (e) => {
        const signal = state.signals.get(e.detail.id);
        if (signal) {
          selectSignal(signal.id);
          // Switch to signals tab
          document.querySelector('[data-tab="signals"]')?.click();
        }
      });
    }

    // Flamegraph
    const flamegraphContainer = document.getElementById('flamegraph-container');
    if (flamegraphContainer) {
      flamegraph = new Flamegraph(flamegraphContainer);
      flamegraphContainer.addEventListener('frameClick', (e) => {
        console.log('Frame clicked:', e.detail);
      });
    }

    // Memory Profiler
    const memoryContainer = document.getElementById('memory-profiler-container');
    if (memoryContainer) {
      memoryProfiler = new MemoryProfiler(memoryContainer);
      memoryContainer.addEventListener('snapshotTaken', (e) => {
        console.log('Snapshot taken:', e.detail);
      });
    }

    // Network Timeline
    const networkContainer = document.getElementById('network-timeline-container');
    if (networkContainer) {
      networkTimeline = new NetworkTimeline(networkContainer);
      networkContainer.addEventListener('itemSelected', (e) => {
        console.log('Timeline item selected:', e.detail);
      });
    }

    // State Exporter
    const exporterContainer = document.getElementById('state-exporter-container');
    if (exporterContainer) {
      stateExporter = new StateExporter(exporterContainer);
      exporterContainer.addEventListener('requestState', () => {
        // Gather state and send back
        const exportState = {
          signals: Array.from(state.signals.values()),
          components: Array.from(state.components.values()),
          componentTree: state.componentTree,
          performance: state.performance,
          history: {
            snapshots: state.snapshots,
            currentIndex: state.currentSnapshotIndex
          }
        };

        const event = new CustomEvent('stateResponse', {
          detail: { type: 'stateResponse', state: exportState }
        });
        exporterContainer.dispatchEvent(event);
      });

      exporterContainer.addEventListener('restoreState', (e) => {
        console.log('Restoring state:', e.detail.state);
        sendToPage({ type: 'RESTORE_STATE', payload: e.detail.state });
      });
    }

    // Signal Diff
    const diffContainer = document.getElementById('signal-diff-container');
    if (diffContainer) {
      signalDiff = new SignalDiff(diffContainer);
    }

    // Breakpoints
    const breakpointsContainer = document.getElementById('breakpoints-container');
    if (breakpointsContainer) {
      breakpoints = new Breakpoints(breakpointsContainer);

      breakpointsContainer.addEventListener('breakpointAdded', (e) => {
        console.log('Breakpoint added:', e.detail);
      });

      breakpointsContainer.addEventListener('paused', (e) => {
        console.log('Paused on breakpoint:', e.detail);
      });

      breakpointsContainer.addEventListener('resumed', () => {
        console.log('Resumed execution');
      });

      // Update signal list in breakpoints modal
      breakpoints.updateSignals(Array.from(state.signals.values()));
    }

    // Search Filter
    const filterContainer = document.getElementById('search-filter-container');
    if (filterContainer) {
      searchFilter = new SearchFilter(filterContainer);
      filterContainer.addEventListener('filterChange', (e) => {
        const filtered = searchFilter.applyFilters(Array.from(state.signals.values()));
        console.log(`Filtered signals: ${filtered.length}/${state.signals.size}`);
        // Update signals display
        renderFilteredSignals(filtered);
      });
    }
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

        // Update advanced features when their tab is shown
        updateActiveFeature(targetPanel);
      });
    });
  }

  function updateActiveFeature(tabName) {
    const signals = Array.from(state.signals.values());

    switch (tabName) {
      case 'graph':
        if (dependencyGraph) {
          dependencyGraph.updateGraph(signals, state.selectedSignal?.id);
        }
        break;

      case 'flamegraph':
        if (flamegraph) {
          flamegraph.updateData(state.performance.renders);
        }
        break;

      case 'memory':
        if (memoryProfiler) {
          memoryProfiler.updateMemory(state.performance.memory, signals);
        }
        break;

      case 'network-timeline':
        // Network timeline is updated in real-time
        break;

      case 'breakpoints':
        if (breakpoints) {
          breakpoints.updateSignals(signals);
        }
        break;
    }
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

  function renderFilteredSignals(filteredSignals) {
    const container = document.getElementById('signal-items');
    if (!container) return;

    if (filteredSignals.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No signals match the current filters</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredSignals.map(signal => `
      <div class="list-item ${state.selectedSignal?.id === signal.id ? 'selected' : ''}"
           data-signal-id="${signal.id}">
        <div class="list-item-name">${escapeHtml(signal.name)}</div>
        <div class="list-item-value">${formatValue(signal.value)}</div>
        <div class="list-item-meta">${signal.updateCount}</div>
      </div>
    `).join('');

    container.querySelectorAll('.list-item').forEach(item => {
      item.addEventListener('click', () => {
        const signalId = item.dataset.signalId;
        selectSignal(signalId);
      });
    });
  }

  function selectSignal(signalId) {
    const oldSignal = state.selectedSignal;
    state.selectedSignal = state.signals.get(signalId);

    renderSignals();
    renderSignalDetails();

    // Update dependency graph if visible
    const graphPanel = document.getElementById('graph-panel');
    if (graphPanel?.classList.contains('active') && dependencyGraph) {
      dependencyGraph.updateGraph(Array.from(state.signals.values()), signalId);
    }
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
    // Use existing implementation from panel.js
    // ... (keep existing implementation)
  }

  function filterComponents(search) {
    renderComponentTree();
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
    // Keep existing implementation from panel.js
    // ...
  }

  function updateMemoryChart() {
    // Keep existing implementation from panel.js
    // ...
  }

  function updateRenderTimeline() {
    // Keep existing implementation from panel.js
    // ...
  }

  function updateRenderList() {
    // Keep existing implementation from panel.js
    // ...
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

    renderAll();
  }

  function handleSignalUpdate(signal) {
    const oldValue = state.signals.get(signal.id)?.value;
    state.signals.set(signal.id, signal);

    // Update UI
    renderSignals();
    if (state.selectedSignal?.id === signal.id) {
      renderSignalDetails();
    }

    // Update advanced features
    if (signalDiff) {
      signalDiff.trackSignalUpdate(signal);
    }

    if (breakpoints) {
      breakpoints.checkBreakpoint(signal, oldValue, signal.value);
    }

    if (networkTimeline) {
      networkTimeline.addSignalUpdate(signal);
    }

    // Update dependency graph if visible
    const graphPanel = document.getElementById('graph-panel');
    if (graphPanel?.classList.contains('active') && dependencyGraph) {
      dependencyGraph.updateGraph(Array.from(state.signals.values()), state.selectedSignal?.id);
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
        cause: 'render',
        type: 'component',
        depth: 0
      });

      // Keep only recent renders
      if (state.performance.renders.length > 100) {
        state.performance.renders = state.performance.renders.slice(-100);
      }
    }

    renderPerformance();

    // Update flamegraph if visible
    const flamegraphPanel = document.getElementById('flamegraph-panel');
    if (flamegraphPanel?.classList.contains('active') && flamegraph) {
      flamegraph.updateData(state.performance.renders);
    }
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

    // Update memory profiler if visible
    const memoryPanel = document.getElementById('memory-panel');
    if (memoryPanel?.classList.contains('active') && memoryProfiler) {
      memoryProfiler.updateMemory(state.performance.memory, Array.from(state.signals.values()));
    }
  }

  function handleNetworkRequest(request) {
    state.networkRequests.push(request);
    if (state.networkRequests.length > 100) {
      state.networkRequests.shift();
    }

    // Update network timeline if visible
    if (networkTimeline) {
      networkTimeline.addRequest(request);
    }
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

  function renderAll() {
    renderSignals();
    renderComponentTree();
    renderPerformance();
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

})();
