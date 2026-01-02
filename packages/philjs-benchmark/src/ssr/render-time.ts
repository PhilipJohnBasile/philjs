/**
 * SSR render time benchmarks.
 * Tests server-side rendering performance.
 */

import { jsx, Fragment } from '@philjs/core/jsx-runtime';
import { signal, memo } from '@philjs/core';
import { now, randomLabel } from '../utils.js';
import type { Benchmark } from '../types.js';

/**
 * Simple render to string implementation for benchmarking.
 */
function renderToString(vnode: any): string {
  if (vnode == null || typeof vnode === 'boolean') {
    return '';
  }

  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return escapeHtml(String(vnode));
  }

  if (Array.isArray(vnode)) {
    return vnode.map(renderToString).join('');
  }

  if (typeof vnode === 'object' && 'type' in vnode && 'props' in vnode) {
    const { type, props } = vnode;

    if (typeof type === 'function') {
      // Handle Fragment
      if (type === Fragment || type.name === 'Fragment') {
        return renderToString(props.children);
      }
      // Component
      const result = type(props);
      return renderToString(result);
    }

    if (typeof type === 'string') {
      const { children, ...attrs } = props;
      const attrsString = renderAttrs(attrs);
      const openTag = attrsString ? `<${type} ${attrsString}>` : `<${type}>`;

      if (isVoidElement(type)) {
        return openTag;
      }

      const childrenHtml = renderToString(children);
      return `${openTag}${childrenHtml}</${type}>`;
    }
  }

  // Handle signals and memos
  if (typeof vnode === 'function') {
    return renderToString(vnode());
  }

  return '';
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderAttrs(attrs: Record<string, any>): string {
  return Object.entries(attrs)
    .filter(([key, value]) => {
      if (value == null || value === false) return false;
      if (typeof value === 'function') return false;
      if (key.startsWith('__')) return false;
      return true;
    })
    .map(([key, value]) => {
      const attrName = key === 'className' ? 'class' : key === 'htmlFor' ? 'for' : key;
      if (typeof value === 'boolean') return value ? attrName : '';
      return `${attrName}="${escapeHtml(String(value))}"`;
    })
    .filter(Boolean)
    .join(' ');
}

function isVoidElement(tag: string): boolean {
  return /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(tag);
}

/**
 * Generate a row component.
 */
function Row({ id, label, selected }: { id: number; label: string; selected?: boolean }) {
  return jsx('tr', {
    className: selected ? 'danger' : undefined,
    children: [
      jsx('td', { className: 'col-md-1', children: String(id) }),
      jsx('td', { className: 'col-md-4', children: jsx('a', { children: label }) }),
      jsx('td', { className: 'col-md-1', children: jsx('span', { className: 'glyphicon glyphicon-remove' }) }),
      jsx('td', { className: 'col-md-6' }),
    ],
  });
}

/**
 * Generate a table component with rows.
 */
function Table({ rows }: { rows: Array<{ id: number; label: string; selected?: boolean }> }) {
  return jsx('table', {
    className: 'table table-hover table-striped test-data',
    children: jsx('tbody', {
      children: rows.map(row => Row(row)),
    }),
  });
}

/**
 * Generate a complex page component.
 */
function Page({ title, rows }: { title: string; rows: Array<{ id: number; label: string }> }) {
  return jsx('html', {
    lang: 'en',
    children: [
      jsx('head', {
        children: [
          jsx('meta', { charset: 'UTF-8' }),
          jsx('meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }),
          jsx('title', { children: title }),
          jsx('link', { rel: 'stylesheet', href: '/styles.css' }),
        ],
      }),
      jsx('body', {
        children: [
          jsx('header', {
            children: jsx('nav', {
              className: 'navbar',
              children: jsx('a', { href: '/', children: 'Home' }),
            }),
          }),
          jsx('main', {
            children: [
              jsx('h1', { children: title }),
              Table({ rows }),
            ],
          }),
          jsx('footer', {
            children: jsx('p', { children: '2024 PhilJS' }),
          }),
          jsx('script', { src: '/app.js' }),
        ],
      }),
    ],
  });
}

/**
 * Create test data for SSR benchmarks.
 */
function createRows(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    label: randomLabel(),
    selected: i === 0,
  }));
}

/**
 * Render simple elements benchmark.
 */
export const renderSimpleElements: Benchmark = {
  name: 'ssr-render-simple-1k',
  iterations: 100,
  fn: async () => {
    for (let i = 0; i < 1000; i++) {
      const vnode = jsx('div', {
        className: 'item',
        children: jsx('span', { children: `Item ${i}` }),
      });
      renderToString(vnode);
    }
  },
};

/**
 * Render 1000 rows benchmark.
 */
export const render1000Rows: Benchmark = {
  name: 'ssr-render-1000-rows',
  iterations: 50,
  fn: async () => {
    const rows = createRows(1000);
    const vnode = Table({ rows });
    renderToString(vnode);
  },
};

/**
 * Render 10000 rows benchmark.
 */
export const render10000Rows: Benchmark = {
  name: 'ssr-render-10000-rows',
  iterations: 10,
  fn: async () => {
    const rows = createRows(10000);
    const vnode = Table({ rows });
    renderToString(vnode);
  },
};

/**
 * Render full page benchmark.
 */
export const renderFullPage: Benchmark = {
  name: 'ssr-render-full-page',
  iterations: 50,
  fn: async () => {
    const rows = createRows(100);
    const vnode = Page({ title: 'Test Page', rows });
    renderToString(vnode);
  },
};

/**
 * Render deeply nested components.
 */
export const renderDeepNesting: Benchmark = {
  name: 'ssr-render-deep-nesting-100',
  iterations: 50,
  fn: async () => {
    function NestedComponent({ depth }: { depth: number }): any {
      if (depth === 0) {
        return jsx('span', { children: 'Leaf' });
      }
      return jsx('div', {
        className: `level-${depth}`,
        children: NestedComponent({ depth: depth - 1 }),
      });
    }

    const vnode = NestedComponent({ depth: 100 });
    renderToString(vnode);
  },
};

/**
 * Render with fragments.
 */
export const renderWithFragments: Benchmark = {
  name: 'ssr-render-fragments-1k',
  iterations: 50,
  fn: async () => {
    const items = Array.from({ length: 1000 }, (_, i) =>
      jsx(Fragment, {
        children: [
          jsx('div', { children: `Item ${i}` }),
          jsx('span', { children: `Detail ${i}` }),
        ],
      })
    );

    const vnode = jsx('div', { children: items });
    renderToString(vnode);
  },
};

/**
 * Render with many attributes.
 */
export const renderManyAttributes: Benchmark = {
  name: 'ssr-render-many-attributes',
  iterations: 100,
  fn: async () => {
    const elements = Array.from({ length: 100 }, (_, i) =>
      jsx('div', {
        id: `elem-${i}`,
        className: 'item test-class another-class',
        'data-id': String(i),
        'data-value': `value-${i}`,
        'data-category': 'test',
        'aria-label': `Element ${i}`,
        role: 'listitem',
        tabindex: i,
        style: 'color: red; background: blue;',
        children: `Content ${i}`,
      })
    );

    const vnode = jsx('div', { children: elements });
    renderToString(vnode);
  },
};

/**
 * Render with reactive signals.
 */
export const renderWithSignals: Benchmark = {
  name: 'ssr-render-with-signals',
  iterations: 50,
  fn: async () => {
    const count = signal(0);
    const doubled = memo(() => count() * 2);

    const items = Array.from({ length: 100 }, (_, i) => {
      count.set(i);
      return jsx('div', {
        children: [
          jsx('span', { children: String(count()) }),
          jsx('span', { children: String(doubled()) }),
        ],
      });
    });

    const vnode = jsx('div', { children: items });
    renderToString(vnode);
  },
};

/**
 * Measure HTML output size.
 */
export const measureOutputSize: Benchmark = {
  name: 'ssr-output-size-1000-rows',
  iterations: 10,
  fn: async () => {
    const rows = createRows(1000);
    const vnode = Table({ rows });
    const html = renderToString(vnode);

    // Return size metrics
    const sizeBytes = new TextEncoder().encode(html).length;
    const sizeKB = sizeBytes / 1024;

    // Store for reporting (not used in timing)
    (globalThis as any).__lastSSRSize = {
      bytes: sizeBytes,
      kb: sizeKB,
      chars: html.length,
    };
  },
};

export const renderTimeBenchmarks: Benchmark[] = [
  renderSimpleElements,
  render1000Rows,
  render10000Rows,
  renderFullPage,
  renderDeepNesting,
  renderWithFragments,
  renderManyAttributes,
  renderWithSignals,
  measureOutputSize,
];

export default renderTimeBenchmarks;
