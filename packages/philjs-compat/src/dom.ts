/**
 * DOM Polyfills
 *
 * Polyfills for modern DOM APIs in legacy browsers
 */

/**
 * Check if the environment needs DOM polyfills
 */
export function needsDOMPolyfills(): boolean {
  if (typeof window === 'undefined') return false;
  return !(
    'customElements' in window &&
    'attachShadow' in Element.prototype &&
    'IntersectionObserver' in window &&
    'ResizeObserver' in window
  );
}

/**
 * Initialize DOM polyfills
 */
export function initDOMPolyfills(): void {
  if (typeof window === 'undefined') return;

  // Polyfill for requestIdleCallback
  if (!('requestIdleCallback' in window)) {
    (window as any).requestIdleCallback = (callback: IdleRequestCallback) => {
      const start = Date.now();
      return setTimeout(() => {
        callback({
          didTimeout: false,
          timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
        });
      }, 1);
    };
  }

  // Polyfill for cancelIdleCallback
  if (!('cancelIdleCallback' in window)) {
    (window as any).cancelIdleCallback = (id: number) => {
      clearTimeout(id);
    };
  }

  // Polyfill for Element.replaceChildren
  if (!('replaceChildren' in Element.prototype)) {
    (Element.prototype as any).replaceChildren = function (
      this: Element,
      ...nodes: (Node | string)[]
    ): void {
      while (this.lastChild) {
        this.removeChild(this.lastChild);
      }
      this.append(...nodes);
    };
  }

  // Polyfill for Array.at()
  if (!Array.prototype.at) {
    Array.prototype.at = function (index: number) {
      if (index < 0) {
        index = this.length + index;
      }
      return this[index];
    };
  }

  // Polyfill for Object.hasOwn
  if (!Object.hasOwn) {
    Object.hasOwn = function (obj: object, prop: PropertyKey): boolean {
      return Object.prototype.hasOwnProperty.call(obj, prop);
    };
  }
}

/**
 * Minimal IntersectionObserver polyfill for SSR
 */
export class IntersectionObserverPolyfill {
  private _callback: IntersectionObserverCallback;
  private _elements = new Set<Element>();

  constructor(callback: IntersectionObserverCallback) {
    this._callback = callback;
  }

  observe(element: Element): void {
    this._elements.add(element);
    // Immediately trigger as visible for SSR/legacy browsers
    this._callback(
      [{
        target: element,
        isIntersecting: true,
        intersectionRatio: 1,
        boundingClientRect: element.getBoundingClientRect?.() || {} as DOMRect,
        intersectionRect: {} as DOMRect,
        rootBounds: null,
        time: Date.now(),
      }],
      this as unknown as IntersectionObserver
    );
  }

  unobserve(element: Element): void {
    this._elements.delete(element);
  }

  disconnect(): void {
    this._elements.clear();
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}