/**
 * PhilJS HTML Minimal Runtime
 *
 * Ultra-lightweight (<3KB) runtime for HTML-first apps.
 * Only includes essential features.
 */

import { signal, effect } from 'philjs-core';

// ============================================================================
// Minimal Directive System
// ============================================================================

type MinimalHandler = (el: HTMLElement, expr: string, data: Record<string, any>) => void | (() => void);

const handlers: Record<string, MinimalHandler> = {
  // x-text: Set text content
  text: (el, expr, data) => {
    return effect(() => {
      el.textContent = String(evaluate(expr, data) ?? '');
    });
  },

  // x-show: Toggle visibility
  show: (el, expr, data) => {
    const original = el.style.display;
    return effect(() => {
      el.style.display = evaluate(expr, data) ? original : 'none';
    });
  },

  // x-on: Event handling (shorthand: @click)
  on: (el, expr, data) => {
    const [event, handler] = expr.split('=');
    if (!event || !handler) return;
    const listener = (e: Event) => {
      const fn = new Function('$event', ...Object.keys(data), handler);
      const values = Object.values(data).map((s: any) => s());
      fn(e, ...values);
    };
    el.addEventListener(event, listener);
    return () => el.removeEventListener(event, listener);
  },

  // x-model: Two-way binding
  model: (el, expr, data) => {
    const input = el as HTMLInputElement;
    const sig = data[expr];
    if (!sig) return;

    const cleanup = effect(() => {
      input.value = String(sig() ?? '');
    });

    const handler = () => sig.set(input.value);
    input.addEventListener('input', handler);

    return () => {
      cleanup?.();
      input.removeEventListener('input', handler);
    };
  },

  // x-bind: Bind attribute (shorthand: :attr)
  bind: (el, expr, data) => {
    const [attr, value] = expr.split('=');
    if (!attr || !value) return;
    return effect(() => {
      const result = evaluate(value, data);
      if (result === false || result === null) {
        el.removeAttribute(attr);
      } else {
        el.setAttribute(attr, String(result));
      }
    });
  },
};

// ============================================================================
// Helpers
// ============================================================================

function evaluate(expr: string, data: Record<string, any>): any {
  try {
    const fn = new Function(...Object.keys(data), `return (${expr})`);
    const values = Object.values(data).map((s: any) =>
      typeof s === 'function' ? s() : s
    );
    return fn(...values);
  } catch {
    return undefined;
  }
}

function parseData(expr: string): Record<string, any> {
  try {
    const fn = new Function(`return (${expr})`);
    const raw = fn();
    const reactive: Record<string, any> = {};
    for (const [k, v] of Object.entries(raw)) {
      reactive[k] = signal(v);
    }
    return reactive;
  } catch {
    return {};
  }
}

// ============================================================================
// Main
// ============================================================================

/**
 * Initialize minimal runtime
 */
export function initMinimal(root: HTMLElement = document.body): void {
  // Find all x-data scopes
  const scopes = root.querySelectorAll('[x-data]');

  for (const scope of Array.from(scopes)) {
    if (!(scope instanceof HTMLElement)) continue;

    const data = parseData(scope.getAttribute('x-data') || '{}');
    processMinimal(scope, data);
  }
}

function processMinimal(el: HTMLElement, data: Record<string, any>): void {
  // Process attributes
  for (const attr of Array.from(el.attributes)) {
    let name: string | null = null;
    let expr = attr.value;

    if (attr.name.startsWith('x-')) {
      name = attr.name.slice(2);
    } else if (attr.name.startsWith('@')) {
      name = 'on';
      expr = `${attr.name.slice(1)}=${attr.value}`;
    } else if (attr.name.startsWith(':')) {
      name = 'bind';
      expr = `${attr.name.slice(1)}=${attr.value}`;
    }

    if (name && handlers[name]) {
      handlers[name]!(el, expr, data);
    }
  }

  // Process children
  for (const child of Array.from(el.children)) {
    if (child instanceof HTMLElement && !child.hasAttribute('x-data')) {
      processMinimal(child, data);
    }
  }
}

/**
 * Size: ~2.5KB minified + gzipped
 */
export const minimalVersion = '2.0.0';
