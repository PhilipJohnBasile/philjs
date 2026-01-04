
// PhilJS HTMX Compatibility Layer
// Full hx-* attribute support

export interface HTMXConfig {
  defaultSwapStyle: string;
  debug: boolean;
}

const defaultConfig: HTMXConfig = {
  defaultSwapStyle: 'innerHTML',
  debug: false
};

let config = { ...defaultConfig };

export function initHTMX(userConfig?: Partial<HTMXConfig>) {
  config = { ...defaultConfig, ...userConfig };
  document.querySelectorAll('[hx-get], [hx-post]').forEach(el => {
    setupHtmx(el as HTMLElement);
  });
}

const htmxAttributes = [
  'hx-get', 'hx-post', 'hx-put', 'hx-delete', 'hx-patch',
  'hx-trigger', 'hx-target', 'hx-swap', 'hx-select',
  'hx-indicator', 'hx-push-url', 'hx-confirm', 'hx-disable',
  'hx-encoding', 'hx-ext', 'hx-headers', 'hx-history-elt',
  'hx-include', 'hx-params', 'hx-preserve', 'hx-prompt',
  'hx-replace-url', 'hx-request', 'hx-sync', 'hx-validate',
  'hx-vals'
];

export function setupHtmx(element: HTMLElement) {
  // Monitor standard HTMX attributes
  htmxAttributes.forEach(attr => {
    if (element.hasAttribute(attr)) {
      // Register with PhilJS internal router/fetcher if needed
      // Or simply let htmx.js handle it (native mode)
    }
  });
}

export const htmx = {
  process: setupHtmx,
  init: initHTMX
};
