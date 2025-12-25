/**
 * PhilJS Benchmark for js-framework-benchmark
 *
 * Implements the standard benchmark operations:
 * - Create 1000 rows
 * - Create 10000 rows
 * - Append 1000 rows
 * - Update every 10th row
 * - Select row
 * - Swap rows
 * - Remove row
 * - Clear all rows
 *
 * @see https://github.com/nickyvanurk/js-framework-benchmark
 */

import { signal, memo, batch, jsx, render } from 'philjs-core';

// ============================================================================
// Data Types
// ============================================================================

interface Row {
  id: number;
  label: string;
}

// ============================================================================
// Random Data Generation
// ============================================================================

const adjectives = [
  'pretty', 'large', 'big', 'small', 'tall', 'short', 'long', 'handsome',
  'plain', 'quaint', 'clean', 'elegant', 'easy', 'angry', 'crazy', 'helpful',
  'mushy', 'odd', 'unsightly', 'adorable', 'important', 'inexpensive',
  'cheap', 'expensive', 'fancy'
];

const colours = [
  'red', 'yellow', 'blue', 'green', 'pink', 'brown', 'purple', 'brown',
  'white', 'black', 'orange'
];

const nouns = [
  'table', 'chair', 'house', 'bbq', 'desk', 'car', 'pony', 'cookie',
  'sandwich', 'burger', 'pizza', 'mouse', 'keyboard'
];

function random(max: number): number {
  return Math.round(Math.random() * 1000) % max;
}

let idCounter = 1;

function buildData(count: number): Row[] {
  const data: Row[] = [];
  for (let i = 0; i < count; i++) {
    data.push({
      id: idCounter++,
      label: `${adjectives[random(adjectives.length)]} ${colours[random(colours.length)]} ${nouns[random(nouns.length)]}`
    });
  }
  return data;
}

// ============================================================================
// State
// ============================================================================

const rows = signal<Row[]>([]);
const selected = signal<number>(0);

// ============================================================================
// Actions
// ============================================================================

function create() {
  rows.set(buildData(1000));
}

function createMany() {
  rows.set(buildData(10000));
}

function append() {
  rows.set([...rows(), ...buildData(1000)]);
}

function updateEvery10th() {
  const data = rows();
  for (let i = 0; i < data.length; i += 10) {
    data[i] = { ...data[i], label: data[i].label + ' !!!' };
  }
  rows.set([...data]);
}

function clear() {
  rows.set([]);
}

function swapRows() {
  const data = rows();
  if (data.length > 998) {
    const tmp = data[1];
    data[1] = data[998];
    data[998] = tmp;
    rows.set([...data]);
  }
}

function selectRow(id: number) {
  selected.set(id);
}

function removeRow(id: number) {
  rows.set(rows().filter(row => row.id !== id));
}

// ============================================================================
// Components
// ============================================================================

function Button({ id, text, onClick }: { id: string; text: string; onClick: () => void }) {
  return jsx('div', {
    class: 'col-sm-6 smallpad',
    children: jsx('button', {
      type: 'button',
      class: 'btn btn-primary btn-block',
      id,
      onClick,
      children: text
    })
  });
}

function Row({ row, isSelected }: { row: Row; isSelected: boolean }) {
  return jsx('tr', {
    class: isSelected ? 'danger' : '',
    children: [
      jsx('td', { class: 'col-md-1', children: String(row.id) }),
      jsx('td', {
        class: 'col-md-4',
        children: jsx('a', {
          onClick: () => selectRow(row.id),
          children: row.label
        })
      }),
      jsx('td', {
        class: 'col-md-1',
        children: jsx('a', {
          onClick: () => removeRow(row.id),
          children: jsx('span', {
            class: 'glyphicon glyphicon-remove',
            'aria-hidden': 'true'
          })
        })
      }),
      jsx('td', { class: 'col-md-6' })
    ]
  });
}

function App() {
  return jsx('div', {
    class: 'container',
    children: [
      jsx('div', {
        class: 'jumbotron',
        children: jsx('div', {
          class: 'row',
          children: [
            jsx('div', {
              class: 'col-md-6',
              children: jsx('h1', { children: 'PhilJS (keyed)' })
            }),
            jsx('div', {
              class: 'col-md-6',
              children: jsx('div', {
                class: 'row',
                children: [
                  Button({ id: 'run', text: 'Create 1,000 rows', onClick: create }),
                  Button({ id: 'runlots', text: 'Create 10,000 rows', onClick: createMany }),
                  Button({ id: 'add', text: 'Append 1,000 rows', onClick: append }),
                  Button({ id: 'update', text: 'Update every 10th row', onClick: updateEvery10th }),
                  Button({ id: 'clear', text: 'Clear', onClick: clear }),
                  Button({ id: 'swaprows', text: 'Swap Rows', onClick: swapRows })
                ]
              })
            })
          ]
        })
      }),
      jsx('table', {
        class: 'table table-hover table-striped test-data',
        children: jsx('tbody', {
          id: 'tbody',
          children: () => {
            const data = rows();
            const selectedId = selected();
            return data.map(row =>
              Row({ row, isSelected: row.id === selectedId })
            );
          }
        })
      }),
      jsx('span', {
        class: 'preloadicon glyphicon glyphicon-remove',
        'aria-hidden': 'true'
      })
    ]
  });
}

// ============================================================================
// Mount
// ============================================================================

const container = document.getElementById('main');
if (container) {
  render(() => App(), container);
}

// Export for testing
export { create, createMany, append, updateEvery10th, clear, swapRows, selectRow, removeRow };
