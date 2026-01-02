/**
 * Delete row benchmarks - compatible with js-framework-benchmark.
 * Tests the framework's ability to handle deletions efficiently.
 */

import { signal, batch, effect } from '@philjs/core';
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
 * Table with deletion support.
 */
function createDeletableTable(mockDOM: ReturnType<typeof createMockDOM>) {
  const rows = signal<RowData[]>([]);
  const tbody = mockDOM.document.createElement('tbody');
  const rowElements = new Map<number, any>();

  // Effect to sync DOM with rows state
  effect(() => {
    const currentRows = rows();
    const currentIds = new Set(currentRows.map(r => r.id));

    // Remove elements for deleted rows
    for (const [id, el] of rowElements) {
      if (!currentIds.has(id)) {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
        rowElements.delete(id);
      }
    }

    // Add elements for new rows (only if not already present)
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

        const td3 = mockDOM.document.createElement('td');
        const deleteBtn = mockDOM.document.createElement('span');
        deleteBtn.setAttribute('class', 'glyphicon glyphicon-remove');
        td3.appendChild(deleteBtn);
        tr.appendChild(td3);

        tbody.appendChild(tr);
        rowElements.set(row.id, tr);
      }
    }
  });

  const create = (count: number) => {
    rows.set(createRowsData(count));
  };

  const deleteRow = (id: number) => {
    rows.set(rows().filter(r => r.id !== id));
  };

  const deleteFirst = () => {
    const current = rows();
    if (current.length > 0) {
      deleteRow(current[0]!.id);
    }
  };

  const deleteLast = () => {
    const current = rows();
    if (current.length > 0) {
      deleteRow(current[current.length - 1]!.id);
    }
  };

  const deleteMiddle = () => {
    const current = rows();
    if (current.length > 0) {
      const midIdx = Math.floor(current.length / 2);
      deleteRow(current[midIdx]!.id);
    }
  };

  const deleteRandom = () => {
    const current = rows();
    if (current.length > 0) {
      const randomIdx = Math.floor(Math.random() * current.length);
      deleteRow(current[randomIdx]!.id);
    }
  };

  const deleteMultiple = (count: number) => {
    batch(() => {
      const current = rows();
      const indices = new Set<number>();
      while (indices.size < Math.min(count, current.length)) {
        indices.add(Math.floor(Math.random() * current.length));
      }
      const idsToDelete = new Set([...indices].map(i => current[i]!.id));
      rows.set(current.filter(r => !idsToDelete.has(r.id)));
    });
  };

  const clear = () => {
    rows.set([]);
  };

  return {
    rows,
    tbody,
    create,
    deleteRow,
    deleteFirst,
    deleteLast,
    deleteMiddle,
    deleteRandom,
    deleteMultiple,
    clear,
  };
}

/**
 * Table with keyed deletion for optimal performance.
 */
function createKeyedDeletableTable(mockDOM: ReturnType<typeof createMockDOM>) {
  const rows = signal<RowData[]>([]);
  const tbody = mockDOM.document.createElement('tbody');
  const rowElements = new Map<number, any>();

  const create = (count: number) => {
    const data = createRowsData(count);

    // Create all elements initially
    for (const row of data) {
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

    rows.set(data);
  };

  const deleteRow = (id: number) => {
    const el = rowElements.get(id);
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
    rowElements.delete(id);
    rows.set(rows().filter(r => r.id !== id));
  };

  const deleteRandom = () => {
    const current = rows();
    if (current.length > 0) {
      const randomIdx = Math.floor(Math.random() * current.length);
      deleteRow(current[randomIdx]!.id);
    }
  };

  const clear = () => {
    while (tbody.children.length > 0) {
      tbody.removeChild(tbody.children[0]);
    }
    rowElements.clear();
    rows.set([]);
  };

  return {
    rows,
    tbody,
    create,
    deleteRow,
    deleteRandom,
    clear,
  };
}

/**
 * Remove row benchmark.
 */
export const removeRow: Benchmark = {
  name: 'remove-row',
  iterations: 100,
  fn: async () => {
    const mockDOM = createMockDOM();
    const table = createDeletableTable(mockDOM);
    table.create(1000);
    table.deleteRandom();
  },
};

export const deleteRow = removeRow;

/**
 * Remove row with keyed reconciliation.
 */
export const removeRowKeyed: Benchmark = {
  name: 'remove-row-keyed',
  iterations: 100,
  fn: async () => {
    const mockDOM = createMockDOM();
    const table = createKeyedDeletableTable(mockDOM);
    table.create(1000);
    table.deleteRandom();
  },
};

/**
 * Remove first row.
 */
export const removeFirstRow: Benchmark = {
  name: 'remove-first-row',
  iterations: 100,
  fn: async () => {
    const mockDOM = createMockDOM();
    const table = createDeletableTable(mockDOM);
    table.create(1000);
    table.deleteFirst();
  },
};

/**
 * Remove last row.
 */
export const removeLastRow: Benchmark = {
  name: 'remove-last-row',
  iterations: 100,
  fn: async () => {
    const mockDOM = createMockDOM();
    const table = createDeletableTable(mockDOM);
    table.create(1000);
    table.deleteLast();
  },
};

/**
 * Remove multiple rows (10 at once).
 */
export const removeMultipleRows: Benchmark = {
  name: 'remove-10-rows',
  iterations: 100,
  fn: async () => {
    const mockDOM = createMockDOM();
    const table = createDeletableTable(mockDOM);
    table.create(1000);
    table.deleteMultiple(10);
  },
};

/**
 * Clear all rows benchmark.
 */
export const clearRows: Benchmark = {
  name: 'clear-rows',
  iterations: 100,
  fn: async () => {
    const mockDOM = createMockDOM();
    const table = createDeletableTable(mockDOM);
    table.create(1000);
    table.clear();
  },
};

/**
 * Clear 10,000 rows benchmark.
 */
export const clear10000Rows: Benchmark = {
  name: 'clear-10000-rows',
  iterations: 20,
  fn: async () => {
    const mockDOM = createMockDOM();
    const table = createDeletableTable(mockDOM);
    table.create(10000);
    table.clear();
  },
};

export const deleteRowBenchmarks: Benchmark[] = [
  removeRow,
  removeRowKeyed,
  removeFirstRow,
  removeLastRow,
  removeMultipleRows,
  clearRows,
  clear10000Rows,
];

export default deleteRowBenchmarks;
