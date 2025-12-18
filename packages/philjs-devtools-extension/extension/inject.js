// PhilJS DevTools - Injected Script
// Runs in the page context to access PhilJS internals

(function() {
  'use strict';

  // Check if PhilJS is available
  if (typeof window === 'undefined') return;

  // State management
  let isConnected = false;
  const signalRegistry = new Map();
  const componentRegistry = new Map();
  const performanceData = {
    fps: 0,
    memory: { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 },
    renders: [],
    effects: []
  };

  // Time travel state
  const stateHistory = [];
  let currentStateIndex = -1;
  const maxHistorySize = 100;

  // Send message to DevTools
  function sendToDevTools(message) {
    window.postMessage({
      source: 'philjs-devtools-client',
      ...message
    }, '*');
  }

  // Initialize DevTools connection
  function initDevTools() {
    if (isConnected) return;
    isConnected = true;

    console.log('[PhilJS DevTools] Initializing...');

    // Hook into PhilJS if available
    if (window.__PHILJS__) {
      hookIntoPhilJS();
    }

    // Set up listener for messages from panel
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;
      if (event.data?.source !== 'philjs-devtools-panel') return;

      handlePanelMessage(event.data);
    });

    // Start monitoring
    startPerformanceMonitoring();
    startComponentTreeMonitoring();

    // Send initial state
    sendInitialState();

    console.log('[PhilJS DevTools] Connected');
  }

  // Hook into PhilJS internals
  function hookIntoPhilJS() {
    const philjs = window.__PHILJS__;
    if (!philjs) return;

    // Expose devtools API
    philjs.devtools = {
      getSignals: () => Array.from(signalRegistry.values()),
      getComponents: () => Array.from(componentRegistry.values()),
      getPerformance: () => performanceData,
      getHistory: () => stateHistory,
      captureSnapshot: captureStateSnapshot,
      restoreSnapshot: restoreStateSnapshot
    };

    // Hook signal creation
    wrapSignalCreation();

    // Hook component rendering
    wrapComponentRendering();

    // Hook effects
    wrapEffects();
  }

  // Wrap signal creation to track all signals
  function wrapSignalCreation() {
    // This would need to be integrated with PhilJS core
    // For now, we'll use a global registry pattern
    window.__PHILJS_SIGNAL_HOOK__ = (signal, name, initialValue) => {
      const id = `signal-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const signalData = {
        id,
        name: name || id,
        value: initialValue,
        subscribers: 0,
        dependencies: [],
        dependents: [],
        updateCount: 0,
        lastUpdated: Date.now(),
        createdAt: Date.now(),
        history: [{
          timestamp: Date.now(),
          value: cloneValue(initialValue),
          trigger: 'init'
        }],
        source: getCallStack()
      };

      signalRegistry.set(id, signalData);
      signal.__devtools_id__ = id;

      // Wrap the signal's set method
      const originalSet = signal.set;
      signal.set = function(newValue) {
        const data = signalRegistry.get(id);
        if (data) {
          const oldValue = data.value;
          data.value = typeof newValue === 'function' ? newValue(oldValue) : newValue;
          data.updateCount++;
          data.lastUpdated = Date.now();
          data.history.push({
            timestamp: Date.now(),
            value: cloneValue(data.value),
            trigger: getCallStack()
          });

          // Maintain history size
          if (data.history.length > 50) {
            data.history = data.history.slice(-50);
          }

          sendToDevTools({
            type: 'SIGNAL_UPDATE',
            payload: signalData
          });

          // Capture state snapshot
          captureStateSnapshot('signal_update', { signalId: id, name: data.name });
        }

        return originalSet.call(signal, newValue);
      };

      sendToDevTools({
        type: 'SIGNAL_REGISTERED',
        payload: signalData
      });

      return signal;
    };
  }

  // Wrap component rendering to track render times
  function wrapComponentRendering() {
    window.__PHILJS_RENDER_HOOK__ = (component, startTime, endTime) => {
      const duration = endTime - startTime;
      const id = component.__devtools_id__ || `component-${Date.now()}`;
      component.__devtools_id__ = id;

      let componentData = componentRegistry.get(id);
      if (!componentData) {
        componentData = {
          id,
          name: component.name || component.constructor?.name || 'Unknown',
          type: 'component',
          props: {},
          state: {},
          signals: [],
          renderCount: 0,
          totalRenderTime: 0,
          averageRenderTime: 0,
          minRenderTime: Infinity,
          maxRenderTime: 0,
          lastRenderTime: 0,
          element: null,
          children: []
        };
        componentRegistry.set(id, componentData);
      }

      componentData.renderCount++;
      componentData.lastRenderTime = duration;
      componentData.totalRenderTime += duration;
      componentData.averageRenderTime = componentData.totalRenderTime / componentData.renderCount;
      componentData.minRenderTime = Math.min(componentData.minRenderTime, duration);
      componentData.maxRenderTime = Math.max(componentData.maxRenderTime, duration);

      performanceData.renders.push({
        componentId: id,
        componentName: componentData.name,
        duration,
        timestamp: Date.now(),
        cause: 'render'
      });

      // Maintain performance data size
      if (performanceData.renders.length > 100) {
        performanceData.renders = performanceData.renders.slice(-100);
      }

      sendToDevTools({
        type: 'COMPONENT_RENDER',
        payload: {
          component: componentData,
          duration
        }
      });
    };
  }

  // Wrap effects to track execution
  function wrapEffects() {
    window.__PHILJS_EFFECT_HOOK__ = (effect, duration) => {
      performanceData.effects.push({
        timestamp: Date.now(),
        duration,
        dependencies: []
      });

      if (performanceData.effects.length > 100) {
        performanceData.effects = performanceData.effects.slice(-100);
      }

      sendToDevTools({
        type: 'EFFECT_EXECUTED',
        payload: { duration, timestamp: Date.now() }
      });
    };
  }

  // Start performance monitoring
  function startPerformanceMonitoring() {
    let frameCount = 0;
    let lastTime = performance.now();

    function trackFPS() {
      frameCount++;
      const now = performance.now();

      if (now - lastTime >= 1000) {
        performanceData.fps = Math.round(frameCount * 1000 / (now - lastTime));
        frameCount = 0;
        lastTime = now;

        // Update memory if available
        if (performance.memory) {
          performanceData.memory = {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
          };
        }

        sendToDevTools({
          type: 'PERFORMANCE_UPDATE',
          payload: performanceData
        });
      }

      if (isConnected) {
        requestAnimationFrame(trackFPS);
      }
    }

    requestAnimationFrame(trackFPS);
  }

  // Monitor component tree changes
  function startComponentTreeMonitoring() {
    // Build and send component tree periodically
    setInterval(() => {
      const tree = buildComponentTree();
      if (tree) {
        sendToDevTools({
          type: 'COMPONENT_TREE',
          payload: tree
        });
      }
    }, 1000);
  }

  // Build component tree from DOM
  function buildComponentTree() {
    const root = document.querySelector('[data-philjs-root]') || document.body;
    return traverseDOM(root);
  }

  function traverseDOM(element, parent = null) {
    if (!element) return null;

    const node = {
      id: element.__philjs_component_id__ || `dom-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: element.tagName ? element.tagName.toLowerCase() : '#text',
      type: element.nodeType === Node.TEXT_NODE ? 'text' : 'element',
      props: extractProps(element),
      children: [],
      element: element,
      isIsland: element.hasAttribute?.('data-island'),
      isHydrated: element.hasAttribute?.('data-hydrated')
    };

    // Get component data if available
    const componentId = element.__devtools_id__;
    if (componentId) {
      const componentData = componentRegistry.get(componentId);
      if (componentData) {
        Object.assign(node, componentData);
      }
    }

    // Traverse children
    if (element.childNodes) {
      for (let i = 0; i < element.childNodes.length; i++) {
        const child = element.childNodes[i];
        if (child.nodeType === Node.ELEMENT_NODE || child.nodeType === Node.TEXT_NODE) {
          const childNode = traverseDOM(child, node);
          if (childNode) {
            node.children.push(childNode);
          }
        }
      }
    }

    return node;
  }

  function extractProps(element) {
    const props = {};

    if (element.attributes) {
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        props[attr.name] = attr.value;
      }
    }

    return props;
  }

  // Time travel debugging
  function captureStateSnapshot(action = 'manual', metadata = {}) {
    const snapshot = {
      id: `snapshot-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
      action,
      metadata,
      signals: Array.from(signalRegistry.values()).map(s => ({
        id: s.id,
        name: s.name,
        value: cloneValue(s.value)
      })),
      components: Array.from(componentRegistry.values()).map(c => ({
        id: c.id,
        name: c.name,
        props: cloneValue(c.props),
        state: cloneValue(c.state)
      }))
    };

    stateHistory.push(snapshot);
    currentStateIndex = stateHistory.length - 1;

    // Maintain history size
    if (stateHistory.length > maxHistorySize) {
      stateHistory.shift();
      currentStateIndex--;
    }

    sendToDevTools({
      type: 'SNAPSHOT_CAPTURED',
      payload: {
        snapshot,
        currentIndex: currentStateIndex,
        totalSnapshots: stateHistory.length
      }
    });

    return snapshot;
  }

  function restoreStateSnapshot(snapshotId) {
    const index = stateHistory.findIndex(s => s.id === snapshotId);
    if (index === -1) return false;

    const snapshot = stateHistory[index];
    currentStateIndex = index;

    // Restore signal values
    for (const signalSnapshot of snapshot.signals) {
      const signal = signalRegistry.get(signalSnapshot.id);
      if (signal) {
        // Find the actual signal object and restore its value
        // This would need PhilJS core support
        console.log('[PhilJS DevTools] Restoring signal:', signalSnapshot.name, signalSnapshot.value);
      }
    }

    sendToDevTools({
      type: 'SNAPSHOT_RESTORED',
      payload: {
        snapshot,
        currentIndex: currentStateIndex
      }
    });

    return true;
  }

  // Handle messages from DevTools panel
  function handlePanelMessage(message) {
    switch (message.type) {
      case 'GET_STATE':
        sendInitialState();
        break;

      case 'SELECT_COMPONENT':
        highlightComponent(message.payload);
        break;

      case 'MODIFY_SIGNAL':
        modifySignal(message.payload.id, message.payload.value);
        break;

      case 'CAPTURE_SNAPSHOT':
        captureStateSnapshot('manual');
        break;

      case 'RESTORE_SNAPSHOT':
        restoreStateSnapshot(message.payload);
        break;

      case 'CLEAR_HISTORY':
        stateHistory.length = 0;
        currentStateIndex = -1;
        sendToDevTools({ type: 'HISTORY_CLEARED' });
        break;
    }
  }

  // Send initial state to panel
  function sendInitialState() {
    sendToDevTools({
      type: 'INIT',
      payload: {
        signals: Array.from(signalRegistry.values()),
        components: Array.from(componentRegistry.values()),
        performance: performanceData,
        history: {
          snapshots: stateHistory,
          currentIndex: currentStateIndex
        },
        tree: buildComponentTree()
      }
    });
  }

  // Highlight component in page
  function highlightComponent(componentId) {
    // Remove existing highlight
    const existing = document.querySelector('[data-philjs-devtools-highlight]');
    if (existing) existing.remove();

    if (!componentId) return;

    const component = componentRegistry.get(componentId);
    if (!component?.element) return;

    const rect = component.element.getBoundingClientRect();
    const highlight = document.createElement('div');
    highlight.setAttribute('data-philjs-devtools-highlight', 'true');
    highlight.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      background: rgba(59, 130, 246, 0.2);
      border: 2px solid #3b82f6;
      pointer-events: none;
      z-index: 999999;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    `;

    document.body.appendChild(highlight);

    // Auto-remove after 3 seconds
    setTimeout(() => highlight.remove(), 3000);
  }

  // Modify signal value
  function modifySignal(signalId, newValue) {
    // This would need PhilJS core support to actually modify the signal
    console.log('[PhilJS DevTools] Modifying signal:', signalId, newValue);
    sendToDevTools({
      type: 'SIGNAL_MODIFIED',
      payload: { signalId, newValue }
    });
  }

  // Utility functions
  function cloneValue(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return String(value);
    }
  }

  function getCallStack() {
    try {
      throw new Error();
    } catch (e) {
      const stack = e.stack?.split('\n').slice(3, 6).join('\n');
      return stack || 'unknown';
    }
  }

  // Install hook
  window.__PHILJS_DEVTOOLS_HOOK__ = {
    connect: initDevTools,
    captureSnapshot,
    restoreSnapshot,
    getSignals: () => Array.from(signalRegistry.values()),
    getComponents: () => Array.from(componentRegistry.values())
  };

  // Auto-connect if PhilJS is already loaded
  if (window.__PHILJS__) {
    // Wait a bit for PhilJS to fully initialize
    setTimeout(initDevTools, 100);
  } else {
    // Wait for PhilJS to load
    Object.defineProperty(window, '__PHILJS__', {
      configurable: true,
      set(value) {
        Object.defineProperty(window, '__PHILJS__', {
          value,
          writable: true,
          configurable: true
        });
        setTimeout(initDevTools, 100);
      },
      get() {
        return undefined;
      }
    });
  }

  console.log('[PhilJS DevTools] Injected script loaded');
})();
