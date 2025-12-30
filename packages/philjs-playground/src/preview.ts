/**
 * PhilJS Playground Preview
 */

import type { PreviewConfig } from './types.js';

export function createPreview(container: HTMLElement, config: PreviewConfig = {}) {
  const { sandboxed = true } = config;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'width: 100%; height: 100%; border: none; background: white;';

  if (sandboxed) {
    iframe.sandbox.add('allow-scripts');
  }

  container.appendChild(iframe);

  return {
    render(code: string, options: {
      onConsole?: (type: string, ...args: any[]) => void;
      onError?: (error: Error) => void;
    } = {}) {
      const html = createPreviewHTML(code, options.onConsole, options.onError);
      const blob = new Blob([html], { type: 'text/html' });
      iframe.src = URL.createObjectURL(blob);
    },
    clear() {
      iframe.src = 'about:blank';
    },
    destroy() {
      iframe.remove();
    },
  };
}

function createPreviewHTML(
  code: string,
  onConsole?: (type: string, ...args: any[]) => void,
  onError?: (error: Error) => void
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 16px; font-family: system-ui, sans-serif; }
  </style>
</head>
<body>
  <div id="app"></div>

  <script type="module">
    // PhilJS runtime mock
    const signal = (initial) => {
      let value = initial;
      const listeners = new Set();
      return {
        get() { return value; },
        set(v) { value = v; listeners.forEach(fn => fn(v)); },
        subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
      };
    };

    const computed = (fn) => {
      return { get: fn };
    };

    const effect = (fn) => {
      fn();
    };

    // Console interception
    const originalConsole = { ...console };
    ['log', 'info', 'warn', 'error'].forEach(method => {
      console[method] = (...args) => {
        originalConsole[method](...args);
        window.parent.postMessage({ type: 'console', method, args: args.map(String) }, '*');
      };
    });

    // Error handling
    window.onerror = (msg, url, line, col, error) => {
      window.parent.postMessage({ type: 'error', message: error?.message || msg }, '*');
    };

    window.onunhandledrejection = (event) => {
      window.parent.postMessage({ type: 'error', message: event.reason?.message || String(event.reason) }, '*');
    };

    // Run user code
    try {
      ${code}
    } catch (error) {
      window.parent.postMessage({ type: 'error', message: error.message }, '*');
    }
  </script>
</body>
</html>
`;
}

export function Preview(props: PreviewConfig & { className?: string }) {
  const container = document.createElement('div');
  container.className = props.className || '';
  setTimeout(() => createPreview(container, props), 0);
  return container;
}
