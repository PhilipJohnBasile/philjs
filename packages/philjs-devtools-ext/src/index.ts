/**
 * PhilJS Chrome DevTools Extension
 * 
 * Chrome extension for debugging PhilJS applications.
 */

// ============ PANEL ============

export interface SignalInfo {
    name: string;
    value: any;
    subscriptions: number;
    lastUpdated: Date;
}

export interface ComponentInfo {
    id: string;
    name: string;
    props: Record<string, any>;
    signals: string[];
    children: ComponentInfo[];
    renderCount: number;
}

// Content script to inject into page
export const contentScript = `
(function() {
  if (window.__PHILJS_DEVTOOLS_INJECTED__) return;
  window.__PHILJS_DEVTOOLS_INJECTED__ = true;

  // Listen for devtools panel requests
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (!event.data || event.data.source !== 'philjs-devtools-panel') return;

    const devtools = window.__PHILJS_DEVTOOLS__;
    if (!devtools) {
      window.postMessage({
        source: 'philjs-devtools-content',
        type: 'error',
        message: 'PhilJS DevTools not found on this page'
      }, '*');
      return;
    }

    switch (event.data.type) {
      case 'getSignals': {
        const signals = [];
        devtools.signals.forEach((signal, name) => {
          signals.push({
            name,
            value: signal.value,
            subscriptions: signal.subscriptions?.size || 0,
            lastUpdated: signal.lastUpdated || new Date()
          });
        });
        window.postMessage({
          source: 'philjs-devtools-content',
          type: 'signals',
          data: signals
        }, '*');
        break;
      }

      case 'setSignal': {
        const signal = devtools.signals.get(event.data.name);
        if (signal) {
          signal.set(event.data.value);
          window.postMessage({
            source: 'philjs-devtools-content',
            type: 'signalUpdated',
            name: event.data.name
          }, '*');
        }
        break;
      }

      case 'getComponentTree': {
        window.postMessage({
          source: 'philjs-devtools-content',
          type: 'componentTree',
          data: devtools.componentTree
        }, '*');
        break;
      }

      case 'highlightComponent': {
        const element = devtools.components.get(event.data.id);
        if (element) {
          const overlay = document.createElement('div');
          overlay.id = 'philjs-highlight-overlay';
          overlay.style.cssText = \`
            position: fixed;
            background: rgba(59, 130, 246, 0.3);
            border: 2px solid #3b82f6;
            pointer-events: none;
            z-index: 999999;
          \`;
          const rect = element.getBoundingClientRect();
          overlay.style.top = rect.top + 'px';
          overlay.style.left = rect.left + 'px';
          overlay.style.width = rect.width + 'px';
          overlay.style.height = rect.height + 'px';
          document.body.appendChild(overlay);
          
          setTimeout(() => overlay.remove(), 2000);
        }
        break;
      }
    }
  });

  // Notify panel that devtools are ready
  window.postMessage({
    source: 'philjs-devtools-content',
    type: 'ready'
  }, '*');
})();
`;

// Panel HTML
export const panelHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>PhilJS DevTools</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a2e;
      color: #eaeaea;
      font-size: 12px;
    }
    .header {
      background: #16213e;
      padding: 8px 12px;
      border-bottom: 1px solid #0f3460;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header h1 {
      font-size: 14px;
      font-weight: 600;
      color: #3b82f6;
    }
    .tabs {
      display: flex;
      gap: 4px;
    }
    .tab {
      padding: 4px 12px;
      background: transparent;
      border: none;
      color: #888;
      cursor: pointer;
      border-radius: 4px;
    }
    .tab.active {
      background: #3b82f6;
      color: white;
    }
    .content { padding: 12px; }
    .signal-list { display: flex; flex-direction: column; gap: 8px; }
    .signal-item {
      background: #16213e;
      padding: 8px 12px;
      border-radius: 4px;
      border: 1px solid #0f3460;
    }
    .signal-name { color: #3b82f6; font-weight: 500; }
    .signal-value { 
      font-family: 'Monaco', monospace; 
      color: #22c55e;
      margin-top: 4px;
    }
    .tree-item { padding-left: 16px; }
    .tree-item-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
      cursor: pointer;
    }
    .tree-item-header:hover { background: rgba(59, 130, 246, 0.1); }
    .component-name { color: #f59e0b; }
    .empty { color: #666; font-style: italic; padding: 20px; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>₱ PhilJS</h1>
    <div class="tabs">
      <button class="tab active" data-tab="signals">Signals</button>
      <button class="tab" data-tab="components">Components</button>
      <button class="tab" data-tab="performance">Performance</button>
    </div>
  </div>
  <div class="content">
    <div id="signals-panel" class="panel">
      <div class="signal-list" id="signal-list">
        <div class="empty">Loading signals...</div>
      </div>
    </div>
    <div id="components-panel" class="panel" style="display: none;">
      <div id="component-tree">
        <div class="empty">Loading component tree...</div>
      </div>
    </div>
    <div id="performance-panel" class="panel" style="display: none;">
      <div class="empty">Performance metrics coming soon</div>
    </div>
  </div>
  <script src="panel.js"></script>
</body>
</html>
`;

// Panel JavaScript
export const panelJS = `
// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
    
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab + '-panel').style.display = 'block';
  });
});

// Request signals
function requestSignals() {
  chrome.devtools.inspectedWindow.eval(
    \`window.postMessage({ source: 'philjs-devtools-panel', type: 'getSignals' }, '*')\`
  );
}

function requestComponentTree() {
  chrome.devtools.inspectedWindow.eval(
    \`window.postMessage({ source: 'philjs-devtools-panel', type: 'getComponentTree' }, '*')\`
  );
}

// Initial requests
requestSignals();
requestComponentTree();

// Refresh every second
setInterval(requestSignals, 1000);

// Listen for responses from content script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'signals') {
    renderSignals(message.data);
  }
  if (message.type === 'componentTree') {
    renderComponentTree(message.data);
  }
});

function renderSignals(signals) {
  const list = document.getElementById('signal-list');
  if (!signals.length) {
    list.innerHTML = '<div class="empty">No signals found</div>';
    return;
  }
  
  list.innerHTML = signals.map(s => \`
    <div class="signal-item">
      <div class="signal-name">\${s.name}</div>
      <div class="signal-value">\${JSON.stringify(s.value, null, 2)}</div>
    </div>
  \`).join('');
}

function renderComponentTree(tree) {
  const container = document.getElementById('component-tree');
  if (!tree) {
    container.innerHTML = '<div class="empty">No component tree available</div>';
    return;
  }
  
  container.innerHTML = renderTreeItem(tree);
}

function renderTreeItem(item, depth = 0) {
  return \`
    <div class="tree-item" style="padding-left: \${depth * 16}px">
      <div class="tree-item-header">
        <span class="component-name">&lt;\${item.name}&gt;</span>
      </div>
      \${item.children?.map(child => renderTreeItem(child, depth + 1)).join('') || ''}
    </div>
  \`;
}
`;

// Manifest
export const manifest = {
    manifest_version: 3,
    name: 'PhilJS DevTools',
    version: '1.0.0',
    description: 'DevTools extension for debugging PhilJS applications',
    devtools_page: 'devtools.html',
    permissions: ['activeTab', 'scripting'],
    icons: {
        16: 'icons/icon16.png',
        48: 'icons/icon48.png',
        128: 'icons/icon128.png',
    },
    content_scripts: [
        {
            matches: ['<all_urls>'],
            js: ['content.js'],
            run_at: 'document_end',
        },
    ],
};

export { contentScript, panelHTML, panelJS, manifest };
