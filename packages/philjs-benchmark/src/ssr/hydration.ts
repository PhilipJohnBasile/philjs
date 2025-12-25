/**
 * Hydration benchmarks.
 * Tests client-side hydration performance.
 */

import { jsx, Fragment } from 'philjs-core/jsx-runtime';
import { signal, effect, memo } from 'philjs-core';
import { createMockDOM, randomLabel } from '../utils.js';
import type { Benchmark } from '../types.js';

/**
 * Simulated hydration process that attaches event handlers
 * and reactive bindings to existing DOM.
 */
function hydrate(
  vnode: any,
  container: any,
  mockDOM: ReturnType<typeof createMockDOM>
): () => void {
  const cleanups: (() => void)[] = [];

  function hydrateNode(node: any, domNode: any): void {
    if (node == null || typeof node === 'boolean') {
      return;
    }

    if (typeof node === 'string' || typeof node === 'number') {
      return;
    }

    if (Array.isArray(node)) {
      const children = domNode.children || [];
      node.forEach((child, i) => {
        if (children[i]) {
          hydrateNode(child, children[i]);
        }
      });
      return;
    }

    if (typeof node === 'object' && 'type' in node && 'props' in node) {
      const { type, props } = node;

      if (typeof type === 'function') {
        // Component
        if (type === Fragment || type.name === 'Fragment') {
          hydrateNode(props.children, domNode);
          return;
        }
        const result = type(props);
        hydrateNode(result, domNode);
        return;
      }

      if (typeof type === 'string') {
        const { children, ...attrs } = props;

        // Attach event handlers
        for (const [key, value] of Object.entries(attrs)) {
          if (key.startsWith('on') && typeof value === 'function') {
            domNode.addEventListener(key.slice(2).toLowerCase(), value);
            cleanups.push(() => {
              domNode.removeEventListener(key.slice(2).toLowerCase(), value);
            });
          }
        }

        // Hydrate children
        hydrateNode(children, domNode);
      }
    }

    // Handle signals/memos
    if (typeof node === 'function') {
      const dispose = effect(() => {
        const value = node();
        if (domNode && 'textContent' in domNode) {
          domNode.textContent = String(value);
        }
      });
      cleanups.push(dispose);
    }
  }

  hydrateNode(vnode, container);

  return () => {
    for (const cleanup of cleanups) {
      cleanup();
    }
  };
}

/**
 * Create a simple row component with event handlers.
 */
function InteractiveRow({
  id,
  label,
  onSelect,
  onDelete,
}: {
  id: number;
  label: string;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return jsx('tr', {
    children: [
      jsx('td', { className: 'col-md-1', children: String(id) }),
      jsx('td', {
        className: 'col-md-4',
        children: jsx('a', { onClick: onSelect, children: label }),
      }),
      jsx('td', {
        className: 'col-md-1',
        children: jsx('span', {
          className: 'glyphicon glyphicon-remove',
          onClick: onDelete,
        }),
      }),
      jsx('td', { className: 'col-md-6' }),
    ],
  });
}

/**
 * Create an interactive table component.
 */
function InteractiveTable({
  rows,
  onSelect,
  onDelete,
}: {
  rows: Array<{ id: number; label: string }>;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return jsx('table', {
    className: 'table table-hover table-striped test-data',
    children: jsx('tbody', {
      children: rows.map(row =>
        InteractiveRow({
          ...row,
          onSelect: () => onSelect(row.id),
          onDelete: () => onDelete(row.id),
        })
      ),
    }),
  });
}

/**
 * Create test data.
 */
function createRows(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    label: randomLabel(),
  }));
}

/**
 * Simulate pre-rendered DOM structure.
 */
function createPrerenderedDOM(count: number, mockDOM: ReturnType<typeof createMockDOM>) {
  const table = mockDOM.document.createElement('table');
  const tbody = mockDOM.document.createElement('tbody');
  table.appendChild(tbody);

  for (let i = 0; i < count; i++) {
    const tr = mockDOM.document.createElement('tr');
    const td1 = mockDOM.document.createElement('td');
    const td2 = mockDOM.document.createElement('td');
    const a = mockDOM.document.createElement('a');
    const td3 = mockDOM.document.createElement('td');
    const span = mockDOM.document.createElement('span');
    const td4 = mockDOM.document.createElement('td');

    td1.textContent = String(i + 1);
    a.textContent = randomLabel();
    td2.appendChild(a);
    td3.appendChild(span);

    tr.appendChild(td1);
    tr.appendChild(td2);
    tr.appendChild(td3);
    tr.appendChild(td4);
    tbody.appendChild(tr);

    // Store children reference
    tr.children = [td1, td2, td3, td4];
    td2.children = [a];
    td3.children = [span];
  }

  tbody.children = Array.from({ length: count }, (_, i) => (tbody as any).childNodes?.[i] || tbody);
  table.children = [tbody];

  return table;
}

/**
 * Hydration of 100 rows.
 */
export const hydrate100Rows: Benchmark = {
  name: 'hydrate-100-rows',
  iterations: 100,
  fn: async () => {
    const mockDOM = createMockDOM();
    const rows = createRows(100);
    const prerendered = createPrerenderedDOM(100, mockDOM);

    const vnode = InteractiveTable({
      rows,
      onSelect: (id) => {},
      onDelete: (id) => {},
    });

    const cleanup = hydrate(vnode, prerendered, mockDOM);
    cleanup();
  },
};

/**
 * Hydration of 1000 rows.
 */
export const hydrate1000Rows: Benchmark = {
  name: 'hydrate-1000-rows',
  iterations: 50,
  fn: async () => {
    const mockDOM = createMockDOM();
    const rows = createRows(1000);
    const prerendered = createPrerenderedDOM(1000, mockDOM);

    const vnode = InteractiveTable({
      rows,
      onSelect: (id) => {},
      onDelete: (id) => {},
    });

    const cleanup = hydrate(vnode, prerendered, mockDOM);
    cleanup();
  },
};

/**
 * Hydration with reactive state.
 */
export const hydrateWithState: Benchmark = {
  name: 'hydrate-with-reactive-state',
  iterations: 50,
  fn: async () => {
    const mockDOM = createMockDOM();
    const count = signal(0);
    const doubled = memo(() => count() * 2);

    const vnode = jsx('div', {
      children: [
        jsx('span', { children: () => count() }),
        jsx('span', { children: () => doubled() }),
        jsx('button', {
          onClick: () => count.set(c => c + 1),
          children: 'Increment',
        }),
      ],
    });

    const container = mockDOM.document.createElement('div');
    container.children = [
      mockDOM.document.createElement('span'),
      mockDOM.document.createElement('span'),
      mockDOM.document.createElement('button'),
    ];

    const cleanup = hydrate(vnode, container, mockDOM);

    // Simulate interactions
    for (let i = 0; i < 10; i++) {
      count.set(i);
    }

    cleanup();
  },
};

/**
 * Time to interactive simulation.
 */
export const timeToInteractive: Benchmark = {
  name: 'time-to-interactive',
  iterations: 50,
  fn: async () => {
    const mockDOM = createMockDOM();
    const rows = createRows(100);

    // 1. Parse HTML (simulated)
    const parseStart = performance.now();
    const prerendered = createPrerenderedDOM(100, mockDOM);
    const parseEnd = performance.now();

    // 2. Load JS and create VDOM (simulated)
    const jsStart = performance.now();
    const selectedId = signal<number | null>(null);
    const vnode = InteractiveTable({
      rows,
      onSelect: (id) => selectedId.set(id),
      onDelete: (id) => {},
    });
    const jsEnd = performance.now();

    // 3. Hydrate
    const hydrateStart = performance.now();
    const cleanup = hydrate(vnode, prerendered, mockDOM);
    const hydrateEnd = performance.now();

    // 4. First interaction (simulated)
    const interactionStart = performance.now();
    selectedId.set(1);
    const interactionEnd = performance.now();

    cleanup();
  },
};

/**
 * Partial hydration simulation.
 */
export const partialHydration: Benchmark = {
  name: 'partial-hydration-islands',
  iterations: 50,
  fn: async () => {
    const mockDOM = createMockDOM();

    // Static shell
    const shell = mockDOM.document.createElement('div');

    // Only hydrate interactive islands
    const islands: any[] = [];
    for (let i = 0; i < 10; i++) {
      const island = mockDOM.document.createElement('div');
      island.setAttribute('data-island', String(i));

      const count = signal(0);
      const vnode = jsx('div', {
        children: [
          jsx('span', { children: () => count() }),
          jsx('button', {
            onClick: () => count.set(c => c + 1),
            children: 'Click',
          }),
        ],
      });

      island.children = [
        mockDOM.document.createElement('span'),
        mockDOM.document.createElement('button'),
      ];

      const cleanup = hydrate(vnode, island, mockDOM);
      islands.push({ island, count, cleanup });
    }

    // Simulate interactions on islands
    for (const { count } of islands) {
      count.set(c => c + 1);
    }

    // Cleanup
    for (const { cleanup } of islands) {
      cleanup();
    }
  },
};

/**
 * Progressive hydration simulation.
 */
export const progressiveHydration: Benchmark = {
  name: 'progressive-hydration',
  iterations: 20,
  fn: async () => {
    const mockDOM = createMockDOM();
    const cleanups: (() => void)[] = [];

    // Simulate hydrating components in priority order
    const priorities = ['critical', 'high', 'normal', 'low'];

    for (const priority of priorities) {
      const count = 25; // 25 components per priority level
      for (let i = 0; i < count; i++) {
        const container = mockDOM.document.createElement('div');
        container.children = [mockDOM.document.createElement('span')];

        const state = signal(0);
        const vnode = jsx('div', {
          'data-priority': priority,
          children: jsx('span', { children: () => state() }),
        });

        const cleanup = hydrate(vnode, container, mockDOM);
        cleanups.push(cleanup);
      }

      // Yield to main thread (simulated)
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    // Cleanup
    for (const cleanup of cleanups) {
      cleanup();
    }
  },
};

export const hydrationBenchmarks: Benchmark[] = [
  hydrate100Rows,
  hydrate1000Rows,
  hydrateWithState,
  timeToInteractive,
  partialHydration,
  progressiveHydration,
];

export default hydrationBenchmarks;
