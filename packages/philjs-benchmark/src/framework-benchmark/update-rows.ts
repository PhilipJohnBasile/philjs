/**
 * Update rows benchmarks - compatible with js-framework-benchmark.
 * Tests the framework's ability to perform partial updates efficiently.
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
 * Create a reactive row with individual signals for fine-grained updates.
 */
function createReactiveRow(initialData: RowData) {
  const id = signal(initialData.id);
  const label = signal(initialData.label);
  const selected = signal(initialData.selected ?? false);

  return {
    id,
    label,
    selected,
    update: (newLabel: string) => label.set(newLabel),
    select: () => selected.set(true),
    deselect: () => selected.set(false),
  };
}

/**
 * Create a reactive table with fine-grained updates.
 */
function createFineGrainedTable(mockDOM: ReturnType<typeof createMockDOM>) {
  type ReactiveRow = ReturnType<typeof createReactiveRow> & { element?: any };
  const rows = signal<ReactiveRow[]>([]);

  const tbody = mockDOM.document.createElement('tbody');

  // Create table with individual reactive rows
  const create = (count: number) => {
    const initialData = createRowsData(count);
    const reactiveRows: ReactiveRow[] = initialData.map(data => {
      const row = createReactiveRow(data);
      const tr = mockDOM.document.createElement('tr');
      tr.setAttribute('data-id', String(data.id));

      const td1 = mockDOM.document.createElement('td');
      const td2 = mockDOM.document.createElement('td');
      const a = mockDOM.document.createElement('a');
      const td3 = mockDOM.document.createElement('td');

      td1.textContent = String(data.id);
      a.textContent = data.label;
      td2.appendChild(a);
      tr.appendChild(td1);
      tr.appendChild(td2);
      tr.appendChild(td3);
      tbody.appendChild(tr);

      // Set up reactive bindings for label updates
      effect(() => {
        a.textContent = row.label();
      });

      effect(() => {
        if (row.selected()) {
          tr.setAttribute('class', 'danger');
        } else {
          tr.removeAttribute('class');
        }
      });

      (row as ReactiveRow).element = tr;
      return row as ReactiveRow;
    });

    rows.set(reactiveRows);
  };

  // Update every 10th row
  const updateEvery10th = () => {
    const currentRows = rows();
    for (let i = 0; i < currentRows.length; i += 10) {
      currentRows[i]!.label.set(currentRows[i]!.label() + ' !!!');
    }
  };

  // Update every 10th row with batching
  const updateEvery10thBatched = () => {
    batch(() => {
      const currentRows = rows();
      for (let i = 0; i < currentRows.length; i += 10) {
        currentRows[i]!.label.set(currentRows[i]!.label() + ' !!!');
      }
    });
  };

  // Clear all rows
  const clear = () => {
    while (tbody.children.length > 0) {
      tbody.removeChild(tbody.children[0]);
    }
    rows.set([]);
  };

  return {
    rows,
    tbody,
    create,
    updateEvery10th,
    updateEvery10thBatched,
    clear,
  };
}

/**
 * Update every 10th row benchmark (1,000 rows).
 */
export const updateEvery10thRow: Benchmark = {
  name: 'update-every-10th-row',
  iterations: 100,
  fn: async () => {
    const mockDOM = createMockDOM();
    const table = createFineGrainedTable(mockDOM);
    table.create(1000);
    table.updateEvery10th();
  },
};

export const updateEvery10th = updateEvery10thRow;

/**
 * Update every 10th row with batching benchmark (1,000 rows).
 */
export const updateEvery10thRowBatched: Benchmark = {
  name: 'update-every-10th-row-batched',
  iterations: 100,
  fn: async () => {
    const mockDOM = createMockDOM();
    const table = createFineGrainedTable(mockDOM);
    table.create(1000);
    table.updateEvery10thBatched();
  },
};

/**
 * Partial update benchmark (update 100 random rows).
 */
export const partialUpdate: Benchmark = {
  name: 'partial-update-100-rows',
  iterations: 100,
  fn: async () => {
    const mockDOM = createMockDOM();
    const table = createFineGrainedTable(mockDOM);
    table.create(1000);

    // Update 100 random rows
    const currentRows = table.rows();
    const indices = new Set<number>();
    while (indices.size < 100) {
      indices.add(Math.floor(Math.random() * currentRows.length));
    }

    batch(() => {
      for (const idx of indices) {
        currentRows[idx]!.label.set(randomLabel());
      }
    });
  },
};

/**
 * Single row update benchmark.
 */
export const singleRowUpdate: Benchmark = {
  name: 'single-row-update',
  iterations: 1000,
  fn: async () => {
    const mockDOM = createMockDOM();
    const table = createFineGrainedTable(mockDOM);
    table.create(1000);

    const currentRows = table.rows();
    const randomIdx = Math.floor(Math.random() * currentRows.length);
    currentRows[randomIdx]!.label.set(randomLabel());
  },
};

/**
 * Coarse-grained update (replace entire rows array).
 */
export const coarseGrainedUpdate: Benchmark = {
  name: 'coarse-grained-update',
  iterations: 50,
  fn: async () => {
    const mockDOM = createMockDOM();
    const rows = signal<RowData[]>(createRowsData(1000));

    // Simulate effect that re-renders on change
    let renderCount = 0;
    effect(() => {
      const data = rows();
      renderCount++;
      // Simulate DOM update work
      for (const row of data) {
        mockDOM.document.createElement('tr');
      }
    });

    // Update every 10th row (coarse - replaces entire array)
    rows.set(rows().map((row, i) =>
      i % 10 === 0 ? { ...row, label: row.label + ' !!!' } : row
    ));
  },
};

export const updateRowsBenchmarks: Benchmark[] = [
  updateEvery10thRow,
  updateEvery10thRowBatched,
  partialUpdate,
  singleRowUpdate,
  coarseGrainedUpdate,
];

export default updateRowsBenchmarks;
