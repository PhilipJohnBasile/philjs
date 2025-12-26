/**
 * PhilJS HTMX Compatibility Layer
 *
 * Use HTMX-style hx-* attributes with PhilJS reactivity.
 * Progressive enhancement for HTML-first development.
 *
 * @example
 * ```html
 * <button hx-get="/api/users" hx-target="#user-list" hx-swap="innerHTML">
 *   Load Users
 * </button>
 *
 * <div id="user-list"></div>
 * ```
 *
 * @example
 * ```typescript
 * import { initHTMX, htmx } from '@philjs/htmx';
 *
 * // Initialize HTMX processing
 * initHTMX();
 *
 * // Or use programmatically
 * htmx.ajax('GET', '/api/users', { target: '#user-list' });
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export interface HTMXConfig {
  /** Default swap style */
  defaultSwapStyle?: SwapStyle;
  /** Default swap delay in ms */
  defaultSwapDelay?: number;
  /** Default settle delay in ms */
  defaultSettleDelay?: number;
  /** Enable history API integration */
  historyEnabled?: boolean;
  /** Timeout for requests in ms */
  timeout?: number;
  /** Include credentials in requests */
  withCredentials?: boolean;
  /** Default indicator class */
  indicatorClass?: string;
  /** Request class added during loading */
  requestClass?: string;
  /** Enable scroll behavior */
  scrollBehavior?: 'smooth' | 'auto';
  /** Global error handler */
  onError?: (error: HTMXError) => void;
  /** Global before request hook */
  onBeforeRequest?: (event: HTMXRequestEvent) => boolean | void;
  /** Global after request hook */
  onAfterRequest?: (event: HTMXResponseEvent) => void;
  /** Global before swap hook */
  onBeforeSwap?: (event: HTMXSwapEvent) => boolean | void;
  /** Global after swap hook */
  onAfterSwap?: (event: HTMXSwapEvent) => void;
  /** Enable debug mode */
  debug?: boolean;
}

export type SwapStyle =
  | 'innerHTML'
  | 'outerHTML'
  | 'beforebegin'
  | 'afterbegin'
  | 'beforeend'
  | 'afterend'
  | 'delete'
  | 'none';

export type TriggerEvent =
  | 'click'
  | 'change'
  | 'submit'
  | 'input'
  | 'focus'
  | 'blur'
  | 'keyup'
  | 'keydown'
  | 'load'
  | 'revealed'
  | 'intersect'
  | 'every';

export interface TriggerSpec {
  event: TriggerEvent;
  modifiers: TriggerModifier[];
  pollInterval?: number;
}

export interface TriggerModifier {
  type: 'once' | 'changed' | 'delay' | 'throttle' | 'from' | 'target' | 'consume' | 'queue';
  value?: string | number;
}

export interface HTMXRequestEvent {
  element: Element;
  target: Element;
  verb: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  headers: Record<string, string>;
  parameters: Record<string, string>;
}

export interface HTMXResponseEvent {
  element: Element;
  target: Element;
  xhr: Response;
  successful: boolean;
  html: string;
}

export interface HTMXSwapEvent {
  element: Element;
  target: Element;
  html: string;
  swapStyle: SwapStyle;
}

export interface HTMXError {
  type: 'network' | 'timeout' | 'abort' | 'parse' | 'swap';
  message: string;
  element?: Element;
  xhr?: Response;
}

export interface AjaxOptions {
  target?: string | Element;
  swap?: SwapStyle;
  values?: Record<string, string>;
  headers?: Record<string, string>;
  select?: string;
  indicator?: string | Element;
}

// ============================================================================
// Default Configuration
// ============================================================================

const defaultConfig: Required<HTMXConfig> = {
  defaultSwapStyle: 'innerHTML',
  defaultSwapDelay: 0,
  defaultSettleDelay: 20,
  historyEnabled: true,
  timeout: 0,
  withCredentials: false,
  indicatorClass: 'htmx-indicator',
  requestClass: 'htmx-request',
  scrollBehavior: 'smooth',
  onError: () => {},
  onBeforeRequest: () => true,
  onAfterRequest: () => {},
  onBeforeSwap: () => true,
  onAfterSwap: () => {},
  debug: false,
};

let config: Required<HTMXConfig> = { ...defaultConfig };

// ============================================================================
// Core HTMX Implementation
// ============================================================================

/**
 * Initialize HTMX attribute processing
 */
export function initHTMX(userConfig?: HTMXConfig): void {
  config = { ...defaultConfig, ...userConfig };

  // Process existing elements
  processHTMXElements(document.body);

  // Watch for new elements
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) {
          processHTMXElements(node);
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  if (config.debug) {
    console.log('[HTMX] Initialized with config:', config);
  }
}

/**
 * Process HTMX attributes on element and descendants
 */
function processHTMXElements(root: Element): void {
  // Find all elements with hx-* attributes
  const elements = root.querySelectorAll('[hx-get], [hx-post], [hx-put], [hx-patch], [hx-delete]');
  elements.forEach(processElement);

  // Process the root element itself if it has attributes
  if (hasHTMXAttributes(root)) {
    processElement(root);
  }
}

function hasHTMXAttributes(element: Element): boolean {
  return (
    element.hasAttribute('hx-get') ||
    element.hasAttribute('hx-post') ||
    element.hasAttribute('hx-put') ||
    element.hasAttribute('hx-patch') ||
    element.hasAttribute('hx-delete')
  );
}

function processElement(element: Element): void {
  // Skip already processed elements
  if (element.hasAttribute('data-htmx-processed')) return;
  element.setAttribute('data-htmx-processed', 'true');

  const verb = getVerb(element);
  if (!verb) return;

  const trigger = parseTrigger(element.getAttribute('hx-trigger') || getDefaultTrigger(element));

  // Set up event listener
  setupTrigger(element, verb, trigger);
}

function getVerb(element: Element): 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | null {
  if (element.hasAttribute('hx-get')) return 'GET';
  if (element.hasAttribute('hx-post')) return 'POST';
  if (element.hasAttribute('hx-put')) return 'PUT';
  if (element.hasAttribute('hx-patch')) return 'PATCH';
  if (element.hasAttribute('hx-delete')) return 'DELETE';
  return null;
}

function getPath(element: Element, verb: string): string {
  const attrMap: Record<string, string> = {
    GET: 'hx-get',
    POST: 'hx-post',
    PUT: 'hx-put',
    PATCH: 'hx-patch',
    DELETE: 'hx-delete',
  };
  return element.getAttribute(attrMap[verb]) || '';
}

function getDefaultTrigger(element: Element): string {
  const tagName = element.tagName.toLowerCase();
  if (tagName === 'form') return 'submit';
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    const type = element.getAttribute('type');
    if (type === 'submit') return 'click';
    return 'change';
  }
  return 'click';
}

function parseTrigger(triggerStr: string): TriggerSpec {
  const parts = triggerStr.split(/\s+/);
  const event = parts[0] as TriggerEvent;
  const modifiers: TriggerModifier[] = [];

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (part.startsWith('delay:')) {
      modifiers.push({ type: 'delay', value: parseInt(part.slice(6), 10) });
    } else if (part.startsWith('throttle:')) {
      modifiers.push({ type: 'throttle', value: parseInt(part.slice(9), 10) });
    } else if (part.startsWith('from:')) {
      modifiers.push({ type: 'from', value: part.slice(5) });
    } else if (part.startsWith('target:')) {
      modifiers.push({ type: 'target', value: part.slice(7) });
    } else if (part === 'once') {
      modifiers.push({ type: 'once' });
    } else if (part === 'changed') {
      modifiers.push({ type: 'changed' });
    } else if (part === 'consume') {
      modifiers.push({ type: 'consume' });
    } else if (part.startsWith('queue:')) {
      modifiers.push({ type: 'queue', value: part.slice(6) });
    }
  }

  // Handle polling
  let pollInterval: number | undefined;
  if (event === 'every') {
    const match = triggerStr.match(/every\s+(\d+)(s|ms)?/);
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2] || 's';
      pollInterval = unit === 'ms' ? value : value * 1000;
    }
  }

  return { event, modifiers, pollInterval };
}

function setupTrigger(
  element: Element,
  verb: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  trigger: TriggerSpec
): void {
  const delayMod = trigger.modifiers.find(m => m.type === 'delay');
  const throttleMod = trigger.modifiers.find(m => m.type === 'throttle');
  const onceMod = trigger.modifiers.find(m => m.type === 'once');

  let handler = () => executeRequest(element, verb);

  // Apply delay
  if (delayMod && typeof delayMod.value === 'number') {
    const delay = delayMod.value;
    const originalHandler = handler;
    let timeoutId: ReturnType<typeof setTimeout>;
    handler = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(originalHandler, delay);
    };
  }

  // Apply throttle
  if (throttleMod && typeof throttleMod.value === 'number') {
    const throttleMs = throttleMod.value;
    const originalHandler = handler;
    let lastCall = 0;
    handler = () => {
      const now = Date.now();
      if (now - lastCall >= throttleMs) {
        lastCall = now;
        originalHandler();
      }
    };
  }

  const eventOptions = onceMod ? { once: true } : {};

  if (trigger.event === 'load') {
    // Execute immediately
    handler();
  } else if (trigger.event === 'revealed') {
    // Use intersection observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          handler();
          if (onceMod) observer.disconnect();
        }
      });
    });
    observer.observe(element);
  } else if (trigger.event === 'every' && trigger.pollInterval) {
    // Polling
    const interval = setInterval(handler, trigger.pollInterval);
    // Store for cleanup
    (element as any).__htmxPollingInterval = interval;
  } else {
    // Regular event
    element.addEventListener(trigger.event, (e) => {
      if (trigger.event === 'submit') {
        e.preventDefault();
      }
      handler();
    }, eventOptions);
  }
}

async function executeRequest(
  element: Element,
  verb: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
): Promise<void> {
  const path = getPath(element, verb);
  if (!path) return;

  const targetSelector = element.getAttribute('hx-target') || 'this';
  const target = targetSelector === 'this'
    ? element
    : document.querySelector(targetSelector);

  if (!target) {
    console.warn(`[HTMX] Target not found: ${targetSelector}`);
    return;
  }

  const swapStyle = (element.getAttribute('hx-swap') || config.defaultSwapStyle) as SwapStyle;
  const select = element.getAttribute('hx-select');
  const indicator = element.getAttribute('hx-indicator');

  // Show indicator
  const indicatorEl = indicator ? document.querySelector(indicator) : null;
  if (indicatorEl) {
    indicatorEl.classList.add(config.indicatorClass);
  }
  element.classList.add(config.requestClass);

  // Build headers
  const headers: Record<string, string> = {
    'HX-Request': 'true',
    'HX-Current-URL': window.location.href,
    'HX-Target': target.id || '',
  };

  // Add custom headers
  const customHeaders = element.getAttribute('hx-headers');
  if (customHeaders) {
    try {
      Object.assign(headers, JSON.parse(customHeaders));
    } catch (e) {
      console.warn('[HTMX] Invalid hx-headers JSON');
    }
  }

  // Build request body for non-GET requests
  let body: string | FormData | undefined;
  if (verb !== 'GET') {
    const vals = element.getAttribute('hx-vals');
    const include = element.getAttribute('hx-include');

    if (element.tagName === 'FORM') {
      body = new FormData(element as HTMLFormElement);
    } else if (vals) {
      try {
        const values = JSON.parse(vals);
        body = new URLSearchParams(values).toString();
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      } catch (e) {
        console.warn('[HTMX] Invalid hx-vals JSON');
      }
    } else if (include) {
      const includeEl = document.querySelector(include);
      if (includeEl?.tagName === 'FORM') {
        body = new FormData(includeEl as HTMLFormElement);
      }
    }
  }

  // Before request hook
  const requestEvent: HTMXRequestEvent = {
    element,
    target,
    verb,
    path,
    headers,
    parameters: {},
  };

  if (config.onBeforeRequest(requestEvent) === false) {
    element.classList.remove(config.requestClass);
    if (indicatorEl) indicatorEl.classList.remove(config.indicatorClass);
    return;
  }

  // Emit event
  element.dispatchEvent(new CustomEvent('htmx:beforeRequest', {
    detail: requestEvent,
    bubbles: true,
  }));

  try {
    const response = await fetch(path, {
      method: verb,
      headers,
      body,
      credentials: config.withCredentials ? 'include' : 'same-origin',
    });

    let html = await response.text();

    // Apply select filter
    if (select) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const selected = tempDiv.querySelector(select);
      html = selected?.innerHTML || '';
    }

    // Response event
    const responseEvent: HTMXResponseEvent = {
      element,
      target,
      xhr: response,
      successful: response.ok,
      html,
    };

    config.onAfterRequest(responseEvent);

    element.dispatchEvent(new CustomEvent('htmx:afterRequest', {
      detail: responseEvent,
      bubbles: true,
    }));

    if (!response.ok) {
      element.dispatchEvent(new CustomEvent('htmx:responseError', {
        detail: responseEvent,
        bubbles: true,
      }));
      return;
    }

    // Swap content
    const swapEvent: HTMXSwapEvent = {
      element,
      target,
      html,
      swapStyle,
    };

    if (config.onBeforeSwap(swapEvent) === false) {
      return;
    }

    element.dispatchEvent(new CustomEvent('htmx:beforeSwap', {
      detail: swapEvent,
      bubbles: true,
    }));

    performSwap(target, html, swapStyle);

    // Settle delay for CSS transitions
    await new Promise(resolve => setTimeout(resolve, config.defaultSettleDelay));

    config.onAfterSwap(swapEvent);

    element.dispatchEvent(new CustomEvent('htmx:afterSwap', {
      detail: swapEvent,
      bubbles: true,
    }));

    // Process new HTMX elements
    processHTMXElements(target);

    // Handle hx-push-url
    const pushUrl = element.getAttribute('hx-push-url');
    if (pushUrl && config.historyEnabled) {
      const url = pushUrl === 'true' ? path : pushUrl;
      window.history.pushState({}, '', url);
    }

  } catch (error) {
    const htmxError: HTMXError = {
      type: 'network',
      message: error instanceof Error ? error.message : 'Request failed',
      element,
    };

    config.onError(htmxError);

    element.dispatchEvent(new CustomEvent('htmx:error', {
      detail: htmxError,
      bubbles: true,
    }));
  } finally {
    element.classList.remove(config.requestClass);
    if (indicatorEl) {
      indicatorEl.classList.remove(config.indicatorClass);
    }
  }
}

function performSwap(target: Element, html: string, swapStyle: SwapStyle): void {
  switch (swapStyle) {
    case 'innerHTML':
      target.innerHTML = html;
      break;
    case 'outerHTML':
      target.outerHTML = html;
      break;
    case 'beforebegin':
      target.insertAdjacentHTML('beforebegin', html);
      break;
    case 'afterbegin':
      target.insertAdjacentHTML('afterbegin', html);
      break;
    case 'beforeend':
      target.insertAdjacentHTML('beforeend', html);
      break;
    case 'afterend':
      target.insertAdjacentHTML('afterend', html);
      break;
    case 'delete':
      target.remove();
      break;
    case 'none':
      // Do nothing
      break;
  }
}

// ============================================================================
// Programmatic API
// ============================================================================

export const htmx = {
  /**
   * Configure HTMX
   */
  config(userConfig: HTMXConfig): void {
    config = { ...config, ...userConfig };
  },

  /**
   * Process HTMX attributes on element
   */
  process(element: Element): void {
    processHTMXElements(element);
  },

  /**
   * Make an AJAX request
   */
  async ajax(
    verb: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    options: AjaxOptions = {}
  ): Promise<void> {
    const {
      target,
      swap = config.defaultSwapStyle,
      values,
      headers = {},
      select,
      indicator,
    } = options;

    const targetEl = typeof target === 'string'
      ? document.querySelector(target)
      : target;

    if (!targetEl) {
      console.warn(`[HTMX] Target not found: ${target}`);
      return;
    }

    // Show indicator
    const indicatorEl = typeof indicator === 'string'
      ? document.querySelector(indicator)
      : indicator;
    if (indicatorEl) {
      indicatorEl.classList.add(config.indicatorClass);
    }

    const requestHeaders: Record<string, string> = {
      'HX-Request': 'true',
      'HX-Current-URL': window.location.href,
      ...headers,
    };

    let body: string | undefined;
    if (values && verb !== 'GET') {
      body = new URLSearchParams(values).toString();
      requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    try {
      const response = await fetch(path, {
        method: verb,
        headers: requestHeaders,
        body,
        credentials: config.withCredentials ? 'include' : 'same-origin',
      });

      let html = await response.text();

      if (select) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const selected = tempDiv.querySelector(select);
        html = selected?.innerHTML || '';
      }

      performSwap(targetEl, html, swap);
      processHTMXElements(targetEl);

    } finally {
      if (indicatorEl) {
        indicatorEl.classList.remove(config.indicatorClass);
      }
    }
  },

  /**
   * Find elements with HTMX attributes
   */
  find(selector: string): Element[] {
    return Array.from(document.querySelectorAll(selector));
  },

  /**
   * Add class after transition
   */
  addClass(element: Element, className: string): void {
    element.classList.add(className);
  },

  /**
   * Remove class after transition
   */
  removeClass(element: Element, className: string): void {
    element.classList.remove(className);
  },

  /**
   * Toggle class
   */
  toggleClass(element: Element, className: string): void {
    element.classList.toggle(className);
  },

  /**
   * Trigger an event
   */
  trigger(element: Element | string, eventName: string, detail?: any): void {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) {
      el.dispatchEvent(new CustomEvent(eventName, { detail, bubbles: true }));
    }
  },

  /**
   * Remove element with optional swap animation
   */
  remove(element: Element, swapDelay?: number): void {
    if (swapDelay) {
      element.classList.add('htmx-swapping');
      setTimeout(() => element.remove(), swapDelay);
    } else {
      element.remove();
    }
  },

  /**
   * Get closest element matching selector
   */
  closest(element: Element, selector: string): Element | null {
    return element.closest(selector);
  },

  /**
   * Refresh element (re-issue its request)
   */
  refresh(element: Element): void {
    const verb = getVerb(element);
    if (verb) {
      executeRequest(element, verb);
    }
  },
};

// ============================================================================
// Extensions System
// ============================================================================

export interface HTMXExtension {
  name: string;
  onEvent?: (name: string, event: CustomEvent) => boolean | void;
  transformResponse?: (text: string, xhr: Response, element: Element) => string;
  isInlineSwap?: (swapStyle: string) => boolean;
  handleSwap?: (swapStyle: string, target: Element, fragment: DocumentFragment) => boolean;
  encodeParameters?: (xhr: XMLHttpRequest, parameters: any, element: Element) => any;
}

const extensions: Map<string, HTMXExtension> = new Map();

/**
 * Define an HTMX extension
 */
export function defineExtension(extension: HTMXExtension): void {
  extensions.set(extension.name, extension);
}

/**
 * Remove an extension
 */
export function removeExtension(name: string): void {
  extensions.delete(name);
}

// ============================================================================
// Built-in Extensions
// ============================================================================

// JSON encoding extension
defineExtension({
  name: 'json-enc',
  encodeParameters: (_xhr, parameters, _element) => {
    return JSON.stringify(parameters);
  },
});

// Class tools extension (adds hx-classes support)
defineExtension({
  name: 'class-tools',
  onEvent: (name, event) => {
    if (name === 'htmx:afterSwap') {
      const target = event.detail.target as Element;
      const classes = target.getAttribute('hx-classes');
      if (classes) {
        // Parse class operations like "add foo, remove bar"
        const operations = classes.split(',').map(s => s.trim());
        operations.forEach(op => {
          const [action, className] = op.split(/\s+/);
          if (action === 'add') target.classList.add(className);
          if (action === 'remove') target.classList.remove(className);
          if (action === 'toggle') target.classList.toggle(className);
        });
      }
    }
  },
});

// ============================================================================
// Server-Side Helpers
// ============================================================================

/**
 * Create HTMX response headers
 */
export function htmxResponse(options: {
  trigger?: string | Record<string, any>;
  triggerAfterSettle?: string | Record<string, any>;
  triggerAfterSwap?: string | Record<string, any>;
  push?: string;
  redirect?: string;
  refresh?: boolean;
  retarget?: string;
  reswap?: SwapStyle;
}): Record<string, string> {
  const headers: Record<string, string> = {};

  if (options.trigger) {
    headers['HX-Trigger'] = typeof options.trigger === 'string'
      ? options.trigger
      : JSON.stringify(options.trigger);
  }

  if (options.triggerAfterSettle) {
    headers['HX-Trigger-After-Settle'] = typeof options.triggerAfterSettle === 'string'
      ? options.triggerAfterSettle
      : JSON.stringify(options.triggerAfterSettle);
  }

  if (options.triggerAfterSwap) {
    headers['HX-Trigger-After-Swap'] = typeof options.triggerAfterSwap === 'string'
      ? options.triggerAfterSwap
      : JSON.stringify(options.triggerAfterSwap);
  }

  if (options.push) {
    headers['HX-Push-Url'] = options.push;
  }

  if (options.redirect) {
    headers['HX-Redirect'] = options.redirect;
  }

  if (options.refresh) {
    headers['HX-Refresh'] = 'true';
  }

  if (options.retarget) {
    headers['HX-Retarget'] = options.retarget;
  }

  if (options.reswap) {
    headers['HX-Reswap'] = options.reswap;
  }

  return headers;
}

/**
 * Check if request is from HTMX
 */
export function isHTMXRequest(request: Request): boolean {
  return request.headers.get('HX-Request') === 'true';
}

/**
 * Get HTMX request info
 */
export function getHTMXInfo(request: Request): {
  isHTMX: boolean;
  target?: string;
  trigger?: string;
  triggerName?: string;
  prompt?: string;
  currentUrl?: string;
  boosted?: boolean;
} {
  return {
    isHTMX: request.headers.get('HX-Request') === 'true',
    target: request.headers.get('HX-Target') || undefined,
    trigger: request.headers.get('HX-Trigger') || undefined,
    triggerName: request.headers.get('HX-Trigger-Name') || undefined,
    prompt: request.headers.get('HX-Prompt') || undefined,
    currentUrl: request.headers.get('HX-Current-URL') || undefined,
    boosted: request.headers.get('HX-Boosted') === 'true',
  };
}

// ============================================================================
// CSS for Indicators
// ============================================================================

export const htmxStyles = `
.htmx-indicator {
  opacity: 0;
  transition: opacity 200ms ease-in;
}

.htmx-request .htmx-indicator {
  opacity: 1;
}

.htmx-request.htmx-indicator {
  opacity: 1;
}

.htmx-swapping {
  opacity: 0;
  transition: opacity 100ms ease-out;
}

.htmx-settling {
  transition: all 200ms ease-in;
}

.htmx-added {
  opacity: 0;
}
`;

/**
 * Inject HTMX styles into document
 */
export function injectStyles(): void {
  if (document.getElementById('htmx-styles')) return;

  const style = document.createElement('style');
  style.id = 'htmx-styles';
  style.textContent = htmxStyles;
  document.head.appendChild(style);
}

// Export types
export type {
  HTMXConfig,
  SwapStyle,
  TriggerEvent,
  TriggerSpec,
  HTMXRequestEvent,
  HTMXResponseEvent,
  HTMXSwapEvent,
  HTMXError,
  AjaxOptions,
  HTMXExtension,
};
