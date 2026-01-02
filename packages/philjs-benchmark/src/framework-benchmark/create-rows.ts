/**
 * Create rows benchmarks - compatible with js-framework-benchmark.
 * Tests the framework's ability to create and render large numbers of rows.
 */

import { signal, batch, effect } from '@philjs/core';
import { jsx } from '@philjs/core/jsx-runtime';
import { randomLabel, now, createMockDOM } from '../utils.js';
import type { RowData, Benchmark } from '../types.js';

let nextId = 1;

/**
 * Create a row data object.
 */
function createRowData(): RowData {
  return {
    id: nextId++,
    label: randomLabel(),
    selected: false,
  };
}

/**
 * Create multiple row data objects.
 */
function createRowsData(count: number): RowData[] {
  const rows: RowData[] = [];
  for (let i = 0; i < count; i++) {
    rows.push(createRowData());
  }
  return rows;
}

/**
 * Render a single row using PhilJS signals and JSX.
 */
function renderRow(row: RowData, mockDOM: ReturnType<typeof createMockDOM>) {
  const tr = mockDOM.document.createElement('tr');
  tr.setAttribute('data-id', String(row.id));
  if (row.selected) {
    tr.setAttribute('class', 'danger');
  }

  const td1 = mockDOM.document.createElement('td');
  td1.textContent = String(row.id);
  tr.appendChild(td1);

  const td2 = mockDOM.document.createElement('td');
  const a = mockDOM.document.createElement('a');
  a.textContent = row.label;
  td2.appendChild(a);
  tr.appendChild(td2);

  const td3 = mockDOM.document.createElement('td');
  const deleteBtn = mockDOM.document.createElement('span');
  deleteBtn.setAttribute('class', 'glyphicon glyphicon-remove');
  td3.appendChild(deleteBtn);
  tr.appendChild(td3);

  return tr;
}

/**
 * Render the full table with rows.
 */
function renderTable(rows: RowData[], mockDOM: ReturnType<typeof createMockDOM>) {
  const tbody = mockDOM.document.createElement('tbody');
  for (const row of rows) {
    tbody.appendChild(renderRow(row, mockDOM));
  }
  return tbody;
}

/**
 * Reactive table implementation using signals.
 */
function createReactiveTable(mockDOM: ReturnType<typeof createMockDOM>) {
  const rows = signal<RowData[]>([]);
  const selectedId = signal<number | null>(null);

  const tbody = mockDOM.document.createElement('tbody');
  let currentRows: any[] = [];

  // Effect to update the DOM when rows change
  effect(() => {
    const newRows = rows();
    const selected = selectedId();

    // Clear existing rows
    while (tbody.children.length > 0) {
      tbody.removeChild(tbody.children[0]);
    }
    currentRows = [];

    // Render new rows
    for (const row of newRows) {
      const tr = renderRow({ ...row, selected: row.id === selected }, mockDOM);
      tbody.appendChild(tr);
      currentRows.push(tr);
    }
  });

  return {
    rows,
    selectedId,
    tbody,
    create: (count: number) => {
      rows.set(createRowsData(count));
    },
    append: (count: number) => {
      rows.set([...rows(), ...createRowsData(count)]);
    },
    clear: () => {
      rows.set([]);
    },
  };
}

/**
 * Create 1,000 rows benchmark.
 */
export const create1000Rows: Benchmark = {
  name: 'create-1000-rows',
  iterations: 50,
  fn: async () => {
    const mockDOM = createMockDOM();
    const table = createReactiveTable(mockDOM);
    table.create(1000);
  },
};

/**
 * Create 10,000 rows benchmark.
 */
export const create10000Rows: Benchmark = {
  name: 'create-10000-rows',
  iterations: 20,
  fn: async () => {
    const mockDOM = createMockDOM();
    const table = createReactiveTable(mockDOM);
    table.create(10000);
  },
};

/**
 * Append 1,000 rows benchmark (start with 1,000 rows and add 1,000 more).
 */
export const append1000Rows: Benchmark = {
  name: 'append-1000-rows',
  iterations: 50,
  fn: async () => {
    const mockDOM = createMockDOM();
    const table = createReactiveTable(mockDOM);
    table.create(1000);
    table.append(1000);
  },
};

/**
 * Replace all rows benchmark (replace 1,000 rows with new 1,000 rows).
 */
export const replaceAllRows: Benchmark = {
  name: 'replace-all-rows',
  iterations: 50,
  fn: async () => {
    const mockDOM = createMockDOM();
    const table = createReactiveTable(mockDOM);
    table.create(1000);
    table.create(1000); // Replace with new data
  },
};

/**
 * Non-reactive baseline for comparison.
 */
export const create1000RowsNonReactive: Benchmark = {
  name: 'create-1000-rows-non-reactive',
  iterations: 50,
  fn: async () => {
    const mockDOM = createMockDOM();
    const rows = createRowsData(1000);
    renderTable(rows, mockDOM);
  },
};

export const createRowsBenchmarks: Benchmark[] = [
  create1000Rows,
  create10000Rows,
  append1000Rows,
  replaceAllRows,
  create1000RowsNonReactive,
];

export default createRowsBenchmarks;
