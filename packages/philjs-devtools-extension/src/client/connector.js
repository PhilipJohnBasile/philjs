/**
 * PhilJS DevTools - Client Connector
 *
 * Connects PhilJS applications to the DevTools extension.
 */
let isConnected = false;
let signalRegistry = new Map();
let componentRoot = null;
/**
 * Connect to PhilJS DevTools
 */
export function connectDevTools() {
    if (typeof window === 'undefined')
        return;
    if (isConnected)
        return;
    // Check if DevTools is available
    if (!window.__PHILJS_DEVTOOLS__) {
        // Create hook for extension to detect
        window.__PHILJS_DEVTOOLS_HOOK__ = {
            onConnect: initializeConnection,
            getState: getDevToolsState,
        };
        return;
    }
    initializeConnection();
}
/**
 * Initialize connection with DevTools
 */
function initializeConnection() {
    isConnected = true;
    // Set up message listener
    window.addEventListener('message', handleDevToolsMessage);
    // Notify DevTools of connection
    sendToDevTools({
        type: 'INIT',
        payload: getDevToolsState(),
    });
    // Hook into PhilJS internals
    hookIntoSignals();
    hookIntoComponents();
    hookIntoPerformance();
    hookIntoNetwork();
}
/**
 * Disconnect from DevTools
 */
export function disconnectDevTools() {
    if (!isConnected)
        return;
    isConnected = false;
    window.removeEventListener('message', handleDevToolsMessage);
}
/**
 * Check if DevTools is connected
 */
export function isDevToolsConnected() {
    return isConnected;
}
/**
 * Get current DevTools state
 */
function getDevToolsState() {
    return {
        connected: isConnected,
        signals: signalRegistry,
        componentTree: componentRoot,
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
}
/**
 * Send message to DevTools
 */
function sendToDevTools(message) {
    if (!isConnected)
        return;
    window.postMessage({
        source: 'philjs-devtools-client',
        ...message,
    }, '*');
}
/**
 * Handle messages from DevTools
 */
function handleDevToolsMessage(event) {
    if (event.data?.source !== 'philjs-devtools-panel')
        return;
    const message = event.data;
    switch (message.type) {
        case 'SELECT_COMPONENT':
            handleSelectComponent(message.payload);
            break;
        case 'HIGHLIGHT_COMPONENT':
            handleHighlightComponent(message.payload);
            break;
        case 'INSPECT_SIGNAL':
            handleInspectSignal(message.payload);
            break;
        case 'MODIFY_SIGNAL':
            handleModifySignal(message.payload.id, message.payload.value);
            break;
    }
}
/**
 * Hook into PhilJS signal system
 */
function hookIntoSignals() {
    const philjs = window.__PHILJS__;
    if (!philjs?.internals?.signals)
        return;
    const originalCreate = philjs.internals.signals.create;
    philjs.internals.signals.create = function (initialValue, options) {
        const signal = originalCreate(initialValue, options);
        const id = options?.id || `signal-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const signalData = {
            id,
            name: options?.name || id,
            value: initialValue,
            subscribers: 0,
            lastUpdated: Date.now(),
            updateCount: 0,
            source: new Error().stack?.split('\n')[3]?.trim() || 'unknown',
            history: [{ timestamp: Date.now(), value: initialValue, trigger: 'initial' }],
        };
        signalRegistry.set(id, signalData);
        sendToDevTools({ type: 'SIGNAL_UPDATE', payload: signalData });
        // Wrap set method
        const originalSet = signal.set;
        signal.set = function (newValue) {
            const data = signalRegistry.get(id);
            if (data) {
                data.value = newValue;
                data.lastUpdated = Date.now();
                data.updateCount++;
                data.history.push({
                    timestamp: Date.now(),
                    value: newValue,
                    trigger: new Error().stack?.split('\n')[2]?.trim() || 'unknown',
                });
                // Keep history limited
                if (data.history.length > 100) {
                    data.history = data.history.slice(-100);
                }
                sendToDevTools({ type: 'SIGNAL_UPDATE', payload: data });
            }
            return originalSet(newValue);
        };
        return signal;
    };
}
/**
 * Hook into component rendering
 */
function hookIntoComponents() {
    const philjs = window.__PHILJS__;
    if (!philjs?.internals?.components)
        return;
    // Hook into component mounting
    const originalMount = philjs.internals.components.mount;
    philjs.internals.components.mount = function (component, container) {
        const result = originalMount(component, container);
        updateComponentTree();
        return result;
    };
    // Hook into component updates
    const originalUpdate = philjs.internals.components.update;
    philjs.internals.components.update = function (component) {
        const startTime = performance.now();
        const result = originalUpdate(component);
        const duration = performance.now() - startTime;
        // Track render time
        sendToDevTools({
            type: 'PERFORMANCE_UPDATE',
            payload: {
                fps: 0,
                memory: getMemoryMetrics(),
                timing: getTimingMetrics(),
                renders: [{
                        componentId: component.id || 'unknown',
                        componentName: component.name || 'Unknown',
                        duration,
                        timestamp: Date.now(),
                        cause: 'update',
                    }],
                hydration: null,
            },
        });
        updateComponentTree();
        return result;
    };
}
/**
 * Hook into performance APIs
 */
function hookIntoPerformance() {
    // Web Vitals
    if ('PerformanceObserver' in window) {
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    // Update timing metrics based on entry type
                    sendToDevTools({
                        type: 'PERFORMANCE_UPDATE',
                        payload: {
                            fps: 0,
                            memory: getMemoryMetrics(),
                            timing: getTimingMetrics(),
                            renders: [],
                            hydration: null,
                        },
                    });
                }
            });
            observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] });
        }
        catch (e) {
            // Some entry types may not be supported
        }
    }
    // FPS tracking
    let frameCount = 0;
    let lastTime = performance.now();
    function trackFps() {
        frameCount++;
        const now = performance.now();
        if (now - lastTime >= 1000) {
            const fps = Math.round(frameCount * 1000 / (now - lastTime));
            frameCount = 0;
            lastTime = now;
            sendToDevTools({
                type: 'PERFORMANCE_UPDATE',
                payload: {
                    fps,
                    memory: getMemoryMetrics(),
                    timing: getTimingMetrics(),
                    renders: [],
                    hydration: null,
                },
            });
        }
        if (isConnected) {
            requestAnimationFrame(trackFps);
        }
    }
    requestAnimationFrame(trackFps);
}
/**
 * Hook into network requests
 */
function hookIntoNetwork() {
    // Hook into fetch
    const originalFetch = window.fetch;
    window.fetch = async function (input, init) {
        const id = `fetch-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        const method = init?.method || 'GET';
        const startTime = Date.now();
        try {
            const response = await originalFetch(input, init);
            const endTime = Date.now();
            sendToDevTools({
                type: 'NETWORK_REQUEST',
                payload: {
                    id,
                    url,
                    method,
                    status: response.status,
                    statusText: response.statusText,
                    type: 'fetch',
                    startTime,
                    endTime,
                    duration: endTime - startTime,
                    size: parseInt(response.headers.get('content-length') || '0'),
                    headers: Object.fromEntries(response.headers.entries()),
                },
            });
            return response;
        }
        catch (error) {
            const endTime = Date.now();
            sendToDevTools({
                type: 'NETWORK_REQUEST',
                payload: {
                    id,
                    url,
                    method,
                    status: 0,
                    statusText: 'Network Error',
                    type: 'fetch',
                    startTime,
                    endTime,
                    duration: endTime - startTime,
                    size: 0,
                    headers: {},
                    error: String(error),
                },
            });
            throw error;
        }
    };
}
/**
 * Update component tree
 */
function updateComponentTree() {
    const philjs = window.__PHILJS__;
    if (!philjs?.internals?.getComponentTree)
        return;
    componentRoot = philjs.internals.getComponentTree();
    if (componentRoot) {
        sendToDevTools({ type: 'COMPONENT_TREE_UPDATE', payload: componentRoot });
    }
}
/**
 * Handle component selection
 */
function handleSelectComponent(componentId) {
    const philjs = window.__PHILJS__;
    if (!philjs?.internals?.getComponentById)
        return;
    const component = philjs.internals.getComponentById(componentId);
    if (component?.element) {
        // Scroll into view
        component.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}
/**
 * Handle component highlighting
 */
function handleHighlightComponent(componentId) {
    // Remove existing highlight
    const existing = document.querySelector('[data-philjs-highlight]');
    if (existing) {
        existing.remove();
    }
    if (!componentId)
        return;
    const philjs = window.__PHILJS__;
    if (!philjs?.internals?.getComponentById)
        return;
    const component = philjs.internals.getComponentById(componentId);
    if (!component?.element)
        return;
    // Create highlight overlay
    const rect = component.element.getBoundingClientRect();
    const highlight = document.createElement('div');
    highlight.setAttribute('data-philjs-highlight', 'true');
    highlight.style.cssText = `
    position: fixed;
    top: ${rect.top}px;
    left: ${rect.left}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    background: rgba(59, 130, 246, 0.2);
    border: 2px solid rgb(59, 130, 246);
    pointer-events: none;
    z-index: 99999;
    transition: all 0.2s;
  `;
    document.body.appendChild(highlight);
}
/**
 * Handle signal inspection
 */
function handleInspectSignal(signalId) {
    const data = signalRegistry.get(signalId);
    if (data) {
    }
}
/**
 * Handle signal modification
 */
function handleModifySignal(signalId, value) {
    const philjs = window.__PHILJS__;
    if (!philjs?.internals?.getSignalById)
        return;
    const signal = philjs.internals.getSignalById(signalId);
    if (signal) {
        signal.set(value);
    }
}
/**
 * Get memory metrics
 */
function getMemoryMetrics() {
    const memory = performance.memory;
    return {
        usedJSHeapSize: memory?.usedJSHeapSize || 0,
        totalJSHeapSize: memory?.totalJSHeapSize || 0,
        jsHeapSizeLimit: memory?.jsHeapSizeLimit || 0,
    };
}
/**
 * Get timing metrics
 */
function getTimingMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
        ttfb: navigation?.responseStart - navigation?.requestStart || 0,
        fcp: 0,
        lcp: 0,
        fid: 0,
        cls: 0,
        inp: 0,
    };
}
//# sourceMappingURL=connector.js.map