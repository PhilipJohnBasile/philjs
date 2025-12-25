/**
 * Swap rows benchmarks - compatible with js-framework-benchmark.
 * Tests the framework's ability to efficiently reorder elements.
 */

import { signal, batch, effect } from 'philjs-core';
import { randomLabel, createMockDOM } from '../utils.js';
import type { RowData, Benchmark } from '../types.js';

let nextId = 1;

function createRowData(): RowData {
  return {
    id: nextId++,
    label: randomLabel(),
    selected: false,
  };
}

function createRowsData(count: number): RowData[] {
  const rows: RowData[] = [];
  for (let i = 0; i < count; i++) {
    rows.push(createRowData());
  }
  return rows;
}

/**
 * Create a reactive table that handles swap operations.
 */
function createSwappableTable(mockDOM: ReturnType<typeof createMockDOM>) {
  const rows = signal<RowData[]>([]);
  const tbody = mockDOM.document.createElement('tbody');
  const rowElements = new Map<number, any>();

  // Effect to sync DOM with rows state
  effect(() => {
    const currentRows = rows();

    // Clear existing elements
    while (tbody.children.length > 0) {
      tbody.removeChild(tbody.children[0]);
    }
    rowElements.clear();

    // Render all rows
    for (const row of currentRows) {
      const tr = mockDOM.document.createElement('tr');
      tr.setAttribute('data-id', String(row.id));

      const td1 = mockDOM.document.createElement('td');
      td1.textContent = String(row.id);
      tr.appendChild(td1);

      const td2 = mockDOM.document.createElement('td');
      const a = mockDOM.document.createElement('a');
      a.textContent = row.label;
      td2.appendChild(a);
      tr.appendChild(td2);

      tbody.appendChild(tr);
      rowElements.set(row.id, tr);
    }
  });

  const create = (count: number) => {
    rows.set(createRowsData(count));
  };

  // Swap first and last rows
  const swapFirstLast = () => {
    const currentRows = [...rows()];
    if (currentRows.length < 2) return;
    const temp = currentRows[0];
    currentRows[0] = currentRows[currentRows.length - 1];
    currentRows[currentRows.length - 1] = temp;
    rows.set(currentRows);
  };

  // Swap rows at indices 1 and 998 (js-framework-benchmark standard)
  const swap1And998 = () => {
    const currentRows = [...rows()];
    if (currentRows.length < 999) return;
    const temp = currentRows[1];
    currentRows[1] = currentRows[998];
    currentRows[998] = temp;
    rows.set(currentRows);
  };

  // Swap random pair of rows
  const swapRandom = () => {
    const currentRows = [...rows()];
    if (currentRows.length < 2) return;
    const i = Math.floor(Math.random() * currentRows.length);
    let j = Math.floor(Math.random() * currentRows.length);
    while (j === i) {
      j = Math.floor(Math.random() * currentRows.length);
    }
    const temp = currentRows[i];
    currentRows[i] = currentRows[j];
    currentRows[j] = temp;
    rows.set(currentRows);
  };

  // Reverse all rows
  const reverse = () => {
    rows.set([...rows()].reverse());
  };

  // Shuffle all rows
  const shuffle = () => {
    const currentRows = [...rows()];
    for (let i = currentRows.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [currentRows[i], currentRows[j]] = [currentRows[j], currentRows[i]];
    }
    rows.set(currentRows);
  };

  return {
    rows,
    tbody,
    create,
    swapFirstLast,
    swap1And998,
    swapRandom,
    reverse,
    shuffle,
  };
}

/**
 * Keyed swap implementation using a keyed approach for optimal updates.
 */
function createKeyedSwappableTable(mockDOM: ReturnType<typeof createMockDOM>) {
  const rows = signal<RowData[]>([]);
  const tbody = mockDOM.document.createElement('tbody');
  const rowElements = new Map<number, any>();

  // Keyed reconciliation effect
  effect(() => {
    const currentRows = rows();
    const existingIds = new Set(rowElements.keys());
    const newIds = new Set(currentRows.map(r => r.id));

    // Remove elements that no longer exist
    for (const id of existingIds) {
      if (!newIds.has(id)) {
        const el = rowElements.get(id);
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }
        rowElements.delete(id);
      }
    }

    // Create elements for new rows
    for (const row of currentRows) {
      if (!rowElements.has(row.id)) {
        const tr = mockDOM.document.createElement('tr');
        tr.setAttribute('data-id', String(row.id));

        const td1 = mockDOM.document.createElement('td');
        td1.textContent = String(row.id);
        tr.appendChild(td1);

        const td2 = mockDOM.document.createElement('td');
        const a = mockDOM.document.createElement('a');
        a.textContent = row.label;
        td2.appendChild(a);
        tr.appendChild(td2);

        rowElements.set(row.id, tr);
      }
    }

    // Reorder elements to match new order
    let lastElement: any = null;
    for (let i = currentRows.length - 1; i >= 0; i--) {
      const row = currentRows[i];
      const el = rowElements.get(row.id);
      if (lastElement) {
        tbody.insertBefore(el, lastElement);
      } else {
        tbody.appendChild(el);
      }
      lastElement = el;
    }
  });

  return {
    rows,
    tbody,
    create: (count: number) => rows.set(createRowsData(count)),
    swap1And998: () => {
      const currentRows = [...rows()];
      if (currentRows.length >= 999) {
        const temp = currentRows[1];
        currentRows[1] = currentRows[998];
        currentRows[998] = temp;
        rows.set(currentRows);
      }
    },
  };
}

/**
 * Swap rows benchmark (swap rows 1 and 998).
 */
export const swapRows: Benchmark = {
  name: 'swap-rows',
  iterations: 100,
  fn: async () => {
    const mockDOM = createMockDOM();
    const table = createSwappableTable(mockDOM);
    table.create(1000);
    table.swap1And998();
  },
};

/**
 * Swap rows with keyed reconciliation.
 */
export const swapRowsKeyed: Benchmark = {
  name: 'swap-rows-keyed',
  iterations: 100,
  fn: async () => {
    const mockDOM = createMockDOM();
    const table = createKeyedSwappableTable(mockDOM);
    table.create(1000);
    table.swap1And998();
  },
};

/**
 * Swap first and last rows.
 */
export const swapFirstLast: Benchmark = {
  name: 'swap-first-last',
  iterations: 100,
  fn: async () => {
    const mockDOM = createMockDOM();
    const table = createSwappableTable(mockDOM);
    table.create(1000);
    table.swapFirstLast();
  },
};

/**
 * Reverse all rows benchmark.
 */
export const reverseRows: Benchmark = {
  name: 'reverse-rows',
  iterations: 50,
  fn: async () => {
    const mockDOM = createMockDOM();
    const table = createSwappableTable(mockDOM);
    table.create(1000);
    table.reverse();
  },
};

/**
 * Shuffle all rows benchmark.
 */
export const shuffleRows: Benchmark = {
  name: 'shuffle-rows',
  iterations: 50,
  fn: async () => {
    const mockDOM = createMockDOM();
    const table = createSwappableTable(mockDOM);
    table.create(1000);
    table.shuffle();
  },
};

export const swapRowsBenchmarks: Benchmark[] = [
  swapRows,
  swapRowsKeyed,
  swapFirstLast,
  reverseRows,
  shuffleRows,
];

export default swapRowsBenchmarks;
