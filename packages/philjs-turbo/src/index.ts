/**
 * PhilJS Turbo - Hotwire/Turbo-style page navigation and streaming
 *
 * Full Hotwire-style integration with Turbo Drive, Frames, and Streams.
 * Enables SPA-like navigation without writing JavaScript.
 *
 * @example
 * ```typescript
 * import {
 *   initTurboDrive,
 *   TurboFrame,
 *   createTurboStream,
 *   useStreamSource,
 * } from '@philjs/turbo';
 *
 * // Initialize Turbo Drive
 * initTurboDrive({ progressBar: true });
 *
 * // Use Turbo Frames
 * <TurboFrame id="messages" src="/messages" />
 *
 * // Stream updates
 * const stream = createTurboStream();
 * stream.append('messages', '<div>New message</div>');
 * ```
 */

import { signal, effect, computed, type Signal, type Computed } from '@philjs/core';

// ============================================================================
// Types
// ============================================================================

export interface TurboDriveConfig {
  /** Enable Turbo Drive */
  enabled?: boolean;
  /** Show progress bar during navigation */
  progressBar?: boolean;
  /** Progress bar color */
  progressBarColor?: string;
  /** Progress bar delay (ms) before showing */
  progressBarDelay?: number;
  /** Cache pages for back/forward navigation */
  cachePages?: boolean;
  /** Max cached pages */
  maxCachedPages?: number;
  /** Restore scroll position on back/forward */
  restoreScroll?: boolean;
  /** Root element for page updates */
  rootSelector?: string;
  /** Enable prefetching on hover */
  prefetch?: boolean;
  /** Prefetch delay (ms) */
  prefetchDelay?: number;
}

export interface TurboFrameConfig {
  /** Frame ID */
  id: string;
  /** Source URL */
  src?: string;
  /** Lazy loading */
  lazy?: boolean;
  /** Loading indicator */
  loading?: 'eager' | 'lazy';
  /** Target for navigation */
  target?: string | '_top';
  /** Disable frame */
  disabled?: boolean;
  /** Auto-refresh interval (ms) */
  refresh?: number;
}

export interface TurboStreamAction {
  action: 'append' | 'prepend' | 'replace' | 'update' | 'remove' | 'before' | 'after' | 'morph' | 'refresh';
  target: string;
  targets?: string;
  template?: string;
  method?: 'morph' | 'replace';
}

export interface NavigationEvent {
  url: string;
  type: 'visit' | 'replace' | 'restore' | 'advance';
  direction?: 'forward' | 'back';
  action: 'push' | 'replace';
}

export interface VisitOptions {
  action?: 'advance' | 'replace' | 'restore';
  frame?: string;
  acceptsStreamResponse?: boolean;
  headers?: Record<string, string>;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: FormData | URLSearchParams | string;
}

export interface PageSnapshot {
  url: string;
  html: string;
  scrollPosition: { x: number; y: number };
  timestamp: number;
}

export interface MorphOptions {
  /** Elements to preserve during morph */
  permanentElements?: string[];
  /** Callback before element removal */
  beforeRemove?: (element: Element) => boolean;
  /** Callback after morph */
  afterMorph?: (element: Element) => void;
  /** Morphing strategy */
  strategy?: 'replace' | 'morph' | 'update';
}

// ============================================================================
// State
// ============================================================================

const driveEnabled = signal(true);
const currentUrl = signal(typeof window !== 'undefined' ? window.location.href : '');
const isNavigating = signal(false);
const progressVisible = signal(false);
const progressValue = signal(0);
const pageCache = new Map<string, PageSnapshot>();
const frames = new Map<string, TurboFrameConfig>();
const streamSources = new Map<string, EventSource>();

let driveConfig: Required<TurboDriveConfig> = {
  enabled: true,
  progressBar: true,
  progressBarColor: '#0076ff',
  progressBarDelay: 500,
  cachePages: true,
  maxCachedPages: 10,
  restoreScroll: true,
  rootSelector: 'body',
  prefetch: true,
  prefetchDelay: 100,
};

// ============================================================================
// Turbo Drive
// ============================================================================

/**
 * Initialize Turbo Drive for SPA-like navigation
 */
export function initTurboDrive(config: TurboDriveConfig = {}): void {
  driveConfig = { ...driveConfig, ...config };
  driveEnabled.set(driveConfig.enabled);

  if (typeof window === 'undefined') return;

  // Intercept link clicks
  document.addEventListener('click', handleLinkClick, true);

  // Handle popstate for back/forward
  window.addEventListener('popstate', handlePopState);

  // Handle form submissions
  document.addEventListener('submit', handleFormSubmit, true);

  // Set up prefetching
  if (driveConfig.prefetch) {
    setupPrefetching();
  }

  // Create progress bar
  if (driveConfig.progressBar) {
    createProgressBar();
  }

  // Initialize frames
  initializeFrames();
}

/**
 * Disable Turbo Drive
 */
export function disableTurboDrive(): void {
  driveEnabled.set(false);
}

/**
 * Enable Turbo Drive
 */
export function enableTurboDrive(): void {
  driveEnabled.set(true);
}

/**
 * Visit a URL programmatically
 */
export async function visit(url: string, options: VisitOptions = {}): Promise<void> {
  if (!driveEnabled.get()) {
    window.location.href = url;
    return;
  }

  const { action = 'advance', frame, method = 'GET', body, headers = {} } = options;

  // Check cache for restore visits
  if (action === 'restore' && driveConfig.cachePages) {
    const cached = pageCache.get(url);
    if (cached) {
      restoreFromCache(cached);
      return;
    }
  }

  isNavigating.set(true);
  showProgress();

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Accept': 'text/html, application/xhtml+xml',
        'Turbo-Frame': frame || '',
        ...headers,
      },
    };

    if (body) {
      fetchOptions.body = body;
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Check for stream response
    const contentType = response.headers.get('Content-Type') || '';
    if (contentType.includes('text/vnd.turbo-stream.html')) {
      processTurboStreamResponse(html);
      return;
    }

    // Handle frame-specific response
    if (frame) {
      updateFrame(frame, html);
      return;
    }

    // Update page
    await updatePage(url, html, action);

    // Dispatch events
    dispatchNavigationEvent({ url, type: 'visit', action: action === 'replace' ? 'replace' : 'push' });
  } catch (error) {
    console.error('Turbo navigation error:', error);
    // Fallback to standard navigation
    window.location.href = url;
  } finally {
    isNavigating.set(false);
    hideProgress();
  }
}

/**
 * Replace current page without adding history entry
 */
export async function replace(url: string): Promise<void> {
  return visit(url, { action: 'replace' });
}

/**
 * Refresh the current page
 */
export async function refresh(): Promise<void> {
  return visit(currentUrl.get(), { action: 'replace' });
}

/**
 * Clear the page cache
 */
export function clearCache(): void {
  pageCache.clear();
}

// ============================================================================
// Turbo Frames
// ============================================================================

/**
 * Create a Turbo Frame component
 */
export function TurboFrame(config: TurboFrameConfig): unknown {
  frames.set(config.id, config);

  const loading = signal(false);
  const error = signal<Error | null>(null);
  const content = signal<string>('');

  // Load content if src is provided and not lazy
  if (config.src && config.loading !== 'lazy') {
    loadFrameContent(config.id, config.src, content, loading, error);
  }

  // Set up auto-refresh
  if (config.refresh && config.src) {
    const intervalId = setInterval(() => {
      loadFrameContent(config.id, config.src!, content, loading, error);
    }, config.refresh);

    // Cleanup on unmount would happen here in real implementation
  }

  return {
    type: 'turbo-frame',
    id: config.id,
    loading,
    error,
    content,
    reload: () => config.src && loadFrameContent(config.id, config.src, content, loading, error),
  };
}

async function loadFrameContent(
  id: string,
  src: string,
  content: Signal<string>,
  loading: Signal<boolean>,
  error: Signal<Error | null>
): Promise<void> {
  loading.set(true);
  error.set(null);

  try {
    const response = await fetch(src, {
      headers: {
        'Accept': 'text/html; turbo-frame',
        'Turbo-Frame': id,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const frameContent = extractFrameContent(html, id);
    content.set(frameContent);
  } catch (err) {
    error.set(err instanceof Error ? err : new Error(String(err)));
  } finally {
    loading.set(false);
  }
}

function extractFrameContent(html: string, frameId: string): string {
  // Parse HTML and extract frame content
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const frame = doc.querySelector(`turbo-frame#${frameId}, [data-turbo-frame="${frameId}"]`);
  return frame?.innerHTML || html;
}

function updateFrame(frameId: string, html: string): void {
  const frameContent = extractFrameContent(html, frameId);
  const frameElement = document.getElementById(frameId);

  if (frameElement) {
    frameElement.innerHTML = frameContent;
    dispatchEvent(new CustomEvent('turbo:frame-render', {
      detail: { frameId, html: frameContent },
    }));
  }
}

/**
 * Load a frame by ID
 */
export async function loadFrame(frameId: string, src?: string): Promise<void> {
  const frame = frames.get(frameId);
  if (!frame) return;

  const url = src || frame.src;
  if (!url) return;

  const content = signal('');
  const loading = signal(false);
  const error = signal<Error | null>(null);

  await loadFrameContent(frameId, url, content, loading, error);
}

// ============================================================================
// Turbo Streams
// ============================================================================

/**
 * Create a Turbo Stream controller for DOM updates
 */
export function createTurboStream(): {
  append: (target: string, html: string) => void;
  prepend: (target: string, html: string) => void;
  replace: (target: string, html: string) => void;
  update: (target: string, html: string) => void;
  remove: (target: string) => void;
  before: (target: string, html: string) => void;
  after: (target: string, html: string) => void;
  morph: (target: string, html: string, options?: MorphOptions) => void;
  refresh: (target?: string) => void;
  process: (streamHtml: string) => void;
} {
  return {
    append(target: string, html: string) {
      const elements = document.querySelectorAll(target);
      elements.forEach(el => el.insertAdjacentHTML('beforeend', html));
      dispatchStreamEvent('append', target, html);
    },

    prepend(target: string, html: string) {
      const elements = document.querySelectorAll(target);
      elements.forEach(el => el.insertAdjacentHTML('afterbegin', html));
      dispatchStreamEvent('prepend', target, html);
    },

    replace(target: string, html: string) {
      const elements = document.querySelectorAll(target);
      elements.forEach(el => {
        el.outerHTML = html;
      });
      dispatchStreamEvent('replace', target, html);
    },

    update(target: string, html: string) {
      const elements = document.querySelectorAll(target);
      elements.forEach(el => {
        el.innerHTML = html;
      });
      dispatchStreamEvent('update', target, html);
    },

    remove(target: string) {
      const elements = document.querySelectorAll(target);
      elements.forEach(el => el.remove());
      dispatchStreamEvent('remove', target);
    },

    before(target: string, html: string) {
      const elements = document.querySelectorAll(target);
      elements.forEach(el => el.insertAdjacentHTML('beforebegin', html));
      dispatchStreamEvent('before', target, html);
    },

    after(target: string, html: string) {
      const elements = document.querySelectorAll(target);
      elements.forEach(el => el.insertAdjacentHTML('afterend', html));
      dispatchStreamEvent('after', target, html);
    },

    morph(target: string, html: string, options?: MorphOptions) {
      const element = document.querySelector(target);
      if (element) {
        morphElement(element, html, options);
      }
      dispatchStreamEvent('morph', target, html);
    },

    refresh(target?: string) {
      if (target) {
        const frame = frames.get(target);
        if (frame?.src) {
          loadFrame(target, frame.src);
        }
      } else {
        refresh();
      }
      dispatchStreamEvent('refresh', target || 'page');
    },

    process(streamHtml: string) {
      processTurboStreamResponse(streamHtml);
    },
  };
}

function processTurboStreamResponse(html: string): void {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const streams = doc.querySelectorAll('turbo-stream');
  const ts = createTurboStream();

  streams.forEach(stream => {
    const action = stream.getAttribute('action') as TurboStreamAction['action'];
    const target = stream.getAttribute('target') || '';
    const targets = stream.getAttribute('targets');
    const template = stream.querySelector('template')?.innerHTML || stream.innerHTML;

    const selector = targets || `#${target}`;

    switch (action) {
      case 'append':
        ts.append(selector, template);
        break;
      case 'prepend':
        ts.prepend(selector, template);
        break;
      case 'replace':
        ts.replace(selector, template);
        break;
      case 'update':
        ts.update(selector, template);
        break;
      case 'remove':
        ts.remove(selector);
        break;
      case 'before':
        ts.before(selector, template);
        break;
      case 'after':
        ts.after(selector, template);
        break;
      case 'morph':
        ts.morph(selector, template);
        break;
      case 'refresh':
        ts.refresh(target);
        break;
    }
  });
}

function dispatchStreamEvent(action: string, target: string, html?: string): void {
  dispatchEvent(new CustomEvent('turbo:stream', {
    detail: { action, target, html },
  }));
}

// ============================================================================
// Server-Sent Events (SSE) Streaming
// ============================================================================

/**
 * Hook for connecting to an SSE stream source
 */
export function useStreamSource(url: string): {
  connected: Signal<boolean>;
  error: Signal<Error | null>;
  lastMessage: Signal<string | null>;
  connect: () => void;
  disconnect: () => void;
} {
  const connected = signal(false);
  const error = signal<Error | null>(null);
  const lastMessage = signal<string | null>(null);
  let eventSource: EventSource | null = null;

  function connect() {
    if (eventSource) return;

    eventSource = new EventSource(url);
    streamSources.set(url, eventSource);

    eventSource.onopen = () => {
      connected.set(true);
      error.set(null);
    };

    eventSource.onerror = (e) => {
      error.set(new Error('Stream connection error'));
      connected.set(false);
    };

    eventSource.onmessage = (e) => {
      lastMessage.set(e.data);

      // Process Turbo Stream messages
      if (e.data.includes('<turbo-stream')) {
        processTurboStreamResponse(e.data);
      }
    };

    // Listen for typed events
    eventSource.addEventListener('turbo-stream', (e: MessageEvent) => {
      processTurboStreamResponse(e.data);
    });
  }

  function disconnect() {
    if (eventSource) {
      eventSource.close();
      streamSources.delete(url);
      eventSource = null;
      connected.set(false);
    }
  }

  // Auto-connect
  effect(() => {
    connect();
    return () => disconnect();
  });

  return { connected, error, lastMessage, connect, disconnect };
}

/**
 * Create a WebSocket-based stream source
 */
export function useWebSocketStream(url: string): {
  connected: Signal<boolean>;
  error: Signal<Error | null>;
  send: (data: string) => void;
  disconnect: () => void;
} {
  const connected = signal(false);
  const error = signal<Error | null>(null);
  let ws: WebSocket | null = null;

  effect(() => {
    ws = new WebSocket(url);

    ws.onopen = () => {
      connected.set(true);
      error.set(null);
    };

    ws.onerror = () => {
      error.set(new Error('WebSocket error'));
    };

    ws.onclose = () => {
      connected.set(false);
    };

    ws.onmessage = (e) => {
      if (typeof e.data === 'string' && e.data.includes('<turbo-stream')) {
        processTurboStreamResponse(e.data);
      }
    };

    return () => {
      ws?.close();
    };
  });

  return {
    connected,
    error,
    send: (data: string) => ws?.send(data),
    disconnect: () => ws?.close(),
  };
}

// ============================================================================
// DOM Morphing
// ============================================================================

/**
 * Morph an element to match new HTML using efficient DOM diffing
 */
export function morphElement(
  target: Element,
  newHtml: string,
  options: MorphOptions = {}
): void {
  const { permanentElements = [], beforeRemove, afterMorph, strategy = 'morph' } = options;

  if (strategy === 'replace') {
    target.outerHTML = newHtml;
    return;
  }

  if (strategy === 'update') {
    target.innerHTML = newHtml;
    return;
  }

  // Parse new HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${newHtml}</div>`, 'text/html');
  const newElement = doc.body.firstElementChild;

  if (!newElement) return;

  // Preserve permanent elements
  const preserved = new Map<string, Element>();
  permanentElements.forEach(selector => {
    const el = target.querySelector(selector);
    if (el) {
      preserved.set(selector, el.cloneNode(true) as Element);
    }
  });

  // Morph the DOM
  morphDom(target, newElement, { beforeRemove });

  // Restore permanent elements
  preserved.forEach((el, selector) => {
    const placeholder = target.querySelector(selector);
    if (placeholder) {
      placeholder.replaceWith(el);
    }
  });

  afterMorph?.(target);
}

function morphDom(
  from: Element,
  to: Element,
  options: { beforeRemove?: (el: Element) => boolean } = {}
): void {
  // Update attributes
  const fromAttrs = Array.from(from.attributes);
  const toAttrs = Array.from(to.attributes);

  // Remove old attributes
  fromAttrs.forEach(attr => {
    if (!to.hasAttribute(attr.name)) {
      from.removeAttribute(attr.name);
    }
  });

  // Add/update attributes
  toAttrs.forEach(attr => {
    if (from.getAttribute(attr.name) !== attr.value) {
      from.setAttribute(attr.name, attr.value);
    }
  });

  // Morph children
  const fromChildren = Array.from(from.children);
  const toChildren = Array.from(to.children);

  // Build key map for efficient diffing
  const fromKeyMap = new Map<string, Element>();
  fromChildren.forEach(child => {
    const key = child.getAttribute('data-turbo-permanent') || child.id;
    if (key) fromKeyMap.set(key, child);
  });

  // Process to children
  let fromIndex = 0;
  toChildren.forEach(toChild => {
    const key = toChild.getAttribute('data-turbo-permanent') || toChild.id;
    const fromChild = key ? fromKeyMap.get(key) : fromChildren[fromIndex];

    if (fromChild) {
      if (fromChild.tagName === toChild.tagName) {
        morphDom(fromChild, toChild, options);
      } else {
        if (!options.beforeRemove || options.beforeRemove(fromChild)) {
          fromChild.replaceWith(toChild.cloneNode(true));
        }
      }
    } else {
      from.appendChild(toChild.cloneNode(true));
    }

    fromIndex++;
  });

  // Remove extra children
  while (from.children.length > toChildren.length) {
    const lastChild = from.lastElementChild;
    if (lastChild) {
      if (!options.beforeRemove || options.beforeRemove(lastChild)) {
        lastChild.remove();
      }
    }
  }

  // Handle text content for leaf nodes
  if (toChildren.length === 0 && from.textContent !== to.textContent) {
    from.textContent = to.textContent;
  }
}

// ============================================================================
// Progress Bar
// ============================================================================

let progressBarElement: HTMLDivElement | null = null;
let progressInterval: ReturnType<typeof setInterval> | null = null;
let progressDelayTimeout: ReturnType<typeof setTimeout> | null = null;

function createProgressBar(): void {
  if (typeof document === 'undefined') return;

  progressBarElement = document.createElement('div');
  progressBarElement.className = 'turbo-progress-bar';
  progressBarElement.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background-color: ${driveConfig.progressBarColor};
    z-index: 2147483647;
    transition: width 100ms ease-out, opacity 150ms ease-in;
    opacity: 0;
    width: 0%;
  `;
  document.body.appendChild(progressBarElement);
}

function showProgress(): void {
  if (!progressBarElement || !driveConfig.progressBar) return;

  progressDelayTimeout = setTimeout(() => {
    if (progressBarElement) {
      progressBarElement.style.opacity = '1';
      progressBarElement.style.width = '0%';
    }

    progressValue.set(0);
    progressVisible.set(true);

    // Animate progress
    progressInterval = setInterval(() => {
      const current = progressValue.get();
      if (current < 90) {
        const increment = Math.random() * 10;
        const newValue = Math.min(current + increment, 90);
        progressValue.set(newValue);
        if (progressBarElement) {
          progressBarElement.style.width = `${newValue}%`;
        }
      }
    }, 200);
  }, driveConfig.progressBarDelay);
}

function hideProgress(): void {
  if (progressDelayTimeout) {
    clearTimeout(progressDelayTimeout);
    progressDelayTimeout = null;
  }

  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }

  if (progressBarElement) {
    progressBarElement.style.width = '100%';
    setTimeout(() => {
      if (progressBarElement) {
        progressBarElement.style.opacity = '0';
        setTimeout(() => {
          if (progressBarElement) {
            progressBarElement.style.width = '0%';
          }
        }, 150);
      }
    }, 100);
  }

  progressVisible.set(false);
}

// ============================================================================
// Event Handlers
// ============================================================================

function handleLinkClick(event: MouseEvent): void {
  if (!driveEnabled.get()) return;

  const target = (event.target as Element).closest('a');
  if (!target) return;

  const href = target.getAttribute('href');
  if (!href) return;

  // Skip external links, downloads, and special links
  if (
    target.hasAttribute('download') ||
    target.getAttribute('target') === '_blank' ||
    target.hasAttribute('data-turbo') && target.getAttribute('data-turbo') === 'false' ||
    !isInternalUrl(href) ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }

  event.preventDefault();

  // Check for frame target
  const frameTarget = target.getAttribute('data-turbo-frame') || target.closest('turbo-frame')?.id;

  visit(href, { frame: frameTarget });
}

function handleFormSubmit(event: SubmitEvent): void {
  if (!driveEnabled.get()) return;

  const form = event.target as HTMLFormElement;

  if (form.hasAttribute('data-turbo') && form.getAttribute('data-turbo') === 'false') {
    return;
  }

  const method = (form.getAttribute('method') || 'GET').toUpperCase() as VisitOptions['method'];
  const action = form.getAttribute('action') || window.location.href;

  if (!isInternalUrl(action)) return;

  event.preventDefault();

  const formData = new FormData(form);
  const frameTarget = form.getAttribute('data-turbo-frame');

  if (method === 'GET') {
    const params = new URLSearchParams(formData as any);
    const url = `${action}${action.includes('?') ? '&' : '?'}${params}`;
    visit(url, { frame: frameTarget });
  } else {
    visit(action, {
      method,
      body: formData,
      frame: frameTarget,
      acceptsStreamResponse: true,
    });
  }
}

function handlePopState(_event: PopStateEvent): void {
  const url = window.location.href;
  currentUrl.set(url);

  // Try to restore from cache
  if (driveConfig.cachePages) {
    const cached = pageCache.get(url);
    if (cached) {
      restoreFromCache(cached);
      return;
    }
  }

  // Fetch fresh content
  visit(url, { action: 'restore' });
}

// ============================================================================
// Page Updates
// ============================================================================

async function updatePage(url: string, html: string, action: string): Promise<void> {
  // Save current page to cache
  if (driveConfig.cachePages) {
    cacheCurrentPage();
  }

  // Parse and update DOM
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Update title
  const newTitle = doc.querySelector('title')?.textContent;
  if (newTitle) {
    document.title = newTitle;
  }

  // Update head (scripts, styles, meta)
  updateHead(doc.head);

  // Update body
  const rootSelector = driveConfig.rootSelector;
  const newBody = rootSelector === 'body'
    ? doc.body.innerHTML
    : doc.querySelector(rootSelector)?.innerHTML;

  if (newBody) {
    const targetElement = rootSelector === 'body'
      ? document.body
      : document.querySelector(rootSelector);

    if (targetElement) {
      targetElement.innerHTML = newBody;
    }
  }

  // Update URL
  if (action === 'advance') {
    history.pushState({ turbo: true }, '', url);
  } else if (action === 'replace') {
    history.replaceState({ turbo: true }, '', url);
  }

  currentUrl.set(url);

  // Restore scroll or scroll to top
  if (!driveConfig.restoreScroll || action !== 'restore') {
    window.scrollTo(0, 0);
  }

  // Re-initialize frames
  initializeFrames();

  // Dispatch render event
  dispatchEvent(new CustomEvent('turbo:render', { detail: { url } }));
}

function updateHead(newHead: HTMLHeadElement): void {
  // Update meta tags, title, and non-script elements
  const currentMeta = document.head.querySelectorAll('meta[name], meta[property]');
  const newMeta = newHead.querySelectorAll('meta[name], meta[property]');

  // Remove old meta
  currentMeta.forEach(meta => {
    const name = meta.getAttribute('name') || meta.getAttribute('property');
    if (name && !newHead.querySelector(`meta[name="${name}"], meta[property="${name}"]`)) {
      meta.remove();
    }
  });

  // Add/update new meta
  newMeta.forEach(meta => {
    const name = meta.getAttribute('name') || meta.getAttribute('property');
    const existing = document.head.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    if (existing) {
      existing.setAttribute('content', meta.getAttribute('content') || '');
    } else {
      document.head.appendChild(meta.cloneNode(true));
    }
  });
}

function cacheCurrentPage(): void {
  const url = currentUrl.get();

  pageCache.set(url, {
    url,
    html: document.documentElement.outerHTML,
    scrollPosition: { x: window.scrollX, y: window.scrollY },
    timestamp: Date.now(),
  });

  // Trim cache if needed
  if (pageCache.size > driveConfig.maxCachedPages) {
    const oldest = Array.from(pageCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
    if (oldest) {
      pageCache.delete(oldest[0]);
    }
  }
}

function restoreFromCache(snapshot: PageSnapshot): void {
  const parser = new DOMParser();
  const doc = parser.parseFromString(snapshot.html, 'text/html');

  document.title = doc.title;
  document.body.innerHTML = doc.body.innerHTML;

  if (driveConfig.restoreScroll) {
    window.scrollTo(snapshot.scrollPosition.x, snapshot.scrollPosition.y);
  }

  currentUrl.set(snapshot.url);
  initializeFrames();

  dispatchEvent(new CustomEvent('turbo:restore', { detail: { url: snapshot.url } }));
}

// ============================================================================
// Prefetching
// ============================================================================

const prefetchedUrls = new Set<string>();
let prefetchTimeout: ReturnType<typeof setTimeout> | null = null;

function setupPrefetching(): void {
  document.addEventListener('mouseover', handlePrefetchHover, true);
  document.addEventListener('touchstart', handlePrefetchTouch, true);
}

function handlePrefetchHover(event: MouseEvent): void {
  const target = (event.target as Element).closest('a');
  if (!target) return;

  const href = target.getAttribute('href');
  if (!href || !shouldPrefetch(target, href)) return;

  prefetchTimeout = setTimeout(() => {
    prefetchUrl(href);
  }, driveConfig.prefetchDelay);
}

function handlePrefetchTouch(event: TouchEvent): void {
  const target = (event.target as Element).closest('a');
  if (!target) return;

  const href = target.getAttribute('href');
  if (href && shouldPrefetch(target, href)) {
    prefetchUrl(href);
  }
}

function shouldPrefetch(link: Element, href: string): boolean {
  return (
    isInternalUrl(href) &&
    !prefetchedUrls.has(href) &&
    link.getAttribute('data-turbo-prefetch') !== 'false' &&
    !link.hasAttribute('download')
  );
}

async function prefetchUrl(url: string): Promise<void> {
  if (prefetchedUrls.has(url)) return;
  prefetchedUrls.add(url);

  try {
    const response = await fetch(url, {
      headers: { 'Purpose': 'prefetch' },
    });

    if (response.ok) {
      const html = await response.text();
      pageCache.set(url, {
        url,
        html,
        scrollPosition: { x: 0, y: 0 },
        timestamp: Date.now(),
      });
    }
  } catch {
    // Silently fail prefetch
  }
}

// ============================================================================
// Frame Initialization
// ============================================================================

function initializeFrames(): void {
  if (typeof document === 'undefined') return;

  document.querySelectorAll('turbo-frame').forEach(frame => {
    const id = frame.id;
    const src = frame.getAttribute('src');
    const lazy = frame.hasAttribute('lazy') || frame.getAttribute('loading') === 'lazy';

    if (id && src && !lazy) {
      const content = signal('');
      const loading = signal(false);
      const error = signal<Error | null>(null);
      loadFrameContent(id, src, content, loading, error);
    }
  });
}

// ============================================================================
// Utilities
// ============================================================================

function isInternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.origin === window.location.origin;
  } catch {
    return url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
  }
}

function dispatchNavigationEvent(event: NavigationEvent): void {
  dispatchEvent(new CustomEvent('turbo:navigate', { detail: event }));
}

// ============================================================================
// Reactive State Exports
// ============================================================================

export const turboState = {
  /** Whether Turbo Drive is currently enabled */
  enabled: driveEnabled as Computed<boolean>,
  /** Current URL */
  currentUrl: currentUrl as Computed<string>,
  /** Whether navigation is in progress */
  isNavigating: isNavigating as Computed<boolean>,
  /** Whether progress bar is visible */
  progressVisible: progressVisible as Computed<boolean>,
  /** Progress bar value (0-100) */
  progressValue: progressValue as Computed<number>,
};

// ============================================================================
// Form Helpers
// ============================================================================

/**
 * Submit a form with Turbo
 */
export function submitForm(form: HTMLFormElement): void {
  const event = new SubmitEvent('submit', { bubbles: true, cancelable: true });
  form.dispatchEvent(event);
}

/**
 * Create a form submission helper
 */
export function createFormSubmission(options: {
  url: string;
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: Record<string, any>;
  frame?: string;
}): Promise<void> {
  const formData = new FormData();
  if (options.data) {
    Object.entries(options.data).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
  }

  return visit(options.url, {
    method: options.method || 'POST',
    body: formData,
    frame: options.frame,
    acceptsStreamResponse: true,
  });
}

// ============================================================================
// Server Integration
// ============================================================================

/**
 * Generate Turbo Stream response HTML
 */
export function turboStreamResponse(actions: TurboStreamAction[]): string {
  return actions.map(action => {
    const targetAttr = action.targets
      ? `targets="${action.targets}"`
      : `target="${action.target}"`;

    if (action.action === 'remove') {
      return `<turbo-stream action="${action.action}" ${targetAttr}></turbo-stream>`;
    }

    return `<turbo-stream action="${action.action}" ${targetAttr}>
  <template>${action.template || ''}</template>
</turbo-stream>`;
  }).join('\n');
}

/**
 * Check if request accepts Turbo Stream response
 */
export function acceptsTurboStream(headers: Headers | Record<string, string>): boolean {
  const accept = headers instanceof Headers
    ? headers.get('Accept')
    : headers['Accept'] || headers['accept'];

  return accept?.includes('text/vnd.turbo-stream.html') ?? false;
}

/**
 * Get Turbo Frame ID from request
 */
export function getTurboFrameId(headers: Headers | Record<string, string>): string | null {
  return headers instanceof Headers
    ? headers.get('Turbo-Frame')
    : headers['Turbo-Frame'] || headers['turbo-frame'] || null;
}
