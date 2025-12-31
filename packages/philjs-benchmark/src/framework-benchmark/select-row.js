/**
 * Select row benchmarks - compatible with js-framework-benchmark.
 * Tests the framework's ability to handle selection state efficiently.
 */
import { signal, batch, effect, memo } from 'philjs-core';
import { randomLabel, createMockDOM } from '../utils.js';
let nextId = 1;
function createRowData() {
    return {
        id: nextId++,
        label: randomLabel(),
        selected: false,
    };
}
function createRowsData(count) {
    const rows = [];
    for (let i = 0; i < count; i++) {
        rows.push(createRowData());
    }
    return rows;
}
/**
 * Table with single selection using a global selectedId signal.
 */
function createSelectableTable(mockDOM) {
    const rows = signal([]);
    const selectedId = signal(null);
    const tbody = mockDOM.document.createElement('tbody');
    const rowElements = new Map();
    // Effect to handle selection class updates
    effect(() => {
        const selected = selectedId();
        for (const [id, el] of rowElements) {
            if (id === selected) {
                el.setAttribute('class', 'danger');
            }
            else {
                el.removeAttribute('class');
            }
        }
    });
    const create = (count) => {
        const data = createRowsData(count);
        // Clear existing
        while (tbody.children.length > 0) {
            tbody.removeChild(tbody.children[0]);
        }
        rowElements.clear();
        // Create rows
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
    const select = (id) => {
        selectedId.set(id);
    };
    const deselect = () => {
        selectedId.set(null);
    };
    const selectRandom = () => {
        const currentRows = rows();
        if (currentRows.length > 0) {
            const randomIdx = Math.floor(Math.random() * currentRows.length);
            const row = currentRows[randomIdx];
            if (row) {
                selectedId.set(row.id);
            }
        }
    };
    return {
        rows,
        selectedId,
        tbody,
        create,
        select,
        deselect,
        selectRandom,
    };
}
/**
 * Table with per-row selection signals for fine-grained updates.
 */
function createFineGrainedSelectableTable(mockDOM) {
    const rows = signal([]);
    const tbody = mockDOM.document.createElement('tbody');
    const create = (count) => {
        const data = createRowsData(count);
        // Clear existing
        while (tbody.children.length > 0) {
            tbody.removeChild(tbody.children[0]);
        }
        const reactiveRows = data.map(rowData => {
            const selectedSignal = signal(false);
            const tr = mockDOM.document.createElement('tr');
            tr.setAttribute('data-id', String(rowData.id));
            const td1 = mockDOM.document.createElement('td');
            td1.textContent = String(rowData.id);
            tr.appendChild(td1);
            const td2 = mockDOM.document.createElement('td');
            const a = mockDOM.document.createElement('a');
            a.textContent = rowData.label;
            td2.appendChild(a);
            tr.appendChild(td2);
            tbody.appendChild(tr);
            // Fine-grained effect for selection
            effect(() => {
                if (selectedSignal()) {
                    tr.setAttribute('class', 'danger');
                }
                else {
                    tr.removeAttribute('class');
                }
            });
            return {
                data: rowData,
                selected: selectedSignal,
                element: tr,
            };
        });
        rows.set(reactiveRows);
    };
    const selectById = (id) => {
        const currentRows = rows();
        for (const row of currentRows) {
            row.selected.set(row.data.id === id);
        }
    };
    const selectByIdBatched = (id) => {
        batch(() => {
            const currentRows = rows();
            for (const row of currentRows) {
                row.selected.set(row.data.id === id);
            }
        });
    };
    const selectRandom = () => {
        const currentRows = rows();
        if (currentRows.length > 0) {
            const randomIdx = Math.floor(Math.random() * currentRows.length);
            const row = currentRows[randomIdx];
            if (row) {
                selectById(row.data.id);
            }
        }
    };
    return {
        rows,
        tbody,
        create,
        selectById,
        selectByIdBatched,
        selectRandom,
    };
}
/**
 * Table using derived/computed selection state.
 */
function createComputedSelectableTable(mockDOM) {
    const rows = signal([]);
    const selectedId = signal(null);
    const tbody = mockDOM.document.createElement('tbody');
    const rowMemos = new Map();
    const create = (count) => {
        const data = createRowsData(count);
        // Clear existing
        while (tbody.children.length > 0) {
            tbody.removeChild(tbody.children[0]);
        }
        rowMemos.clear();
        // Create rows with computed selection state
        for (const row of data) {
            const isSelected = memo(() => selectedId() === row.id);
            rowMemos.set(row.id, isSelected);
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
            // Effect bound to the computed value
            effect(() => {
                if (isSelected()) {
                    tr.setAttribute('class', 'danger');
                }
                else {
                    tr.removeAttribute('class');
                }
            });
        }
        rows.set(data);
    };
    const selectRandom = () => {
        const currentRows = rows();
        if (currentRows.length > 0) {
            const randomIdx = Math.floor(Math.random() * currentRows.length);
            const row = currentRows[randomIdx];
            if (row) {
                selectedId.set(row.id);
            }
        }
    };
    return {
        rows,
        selectedId,
        tbody,
        create,
        selectRandom,
    };
}
/**
 * Select row benchmark.
 */
export const selectRow = {
    name: 'select-row',
    iterations: 100,
    fn: async () => {
        const mockDOM = createMockDOM();
        const table = createSelectableTable(mockDOM);
        table.create(1000);
        table.selectRandom();
    },
};
/**
 * Select row with fine-grained signals.
 */
export const selectRowFineGrained = {
    name: 'select-row-fine-grained',
    iterations: 100,
    fn: async () => {
        const mockDOM = createMockDOM();
        const table = createFineGrainedSelectableTable(mockDOM);
        table.create(1000);
        table.selectRandom();
    },
};
/**
 * Select row with fine-grained signals and batching.
 */
export const selectRowBatched = {
    name: 'select-row-batched',
    iterations: 100,
    fn: async () => {
        const mockDOM = createMockDOM();
        const table = createFineGrainedSelectableTable(mockDOM);
        table.create(1000);
        const currentRows = table.rows();
        if (currentRows.length > 0) {
            const randomIdx = Math.floor(Math.random() * currentRows.length);
            const row = currentRows[randomIdx];
            if (row) {
                table.selectByIdBatched(row.data.id);
            }
        }
    },
};
/**
 * Select row with computed/memo.
 */
export const selectRowComputed = {
    name: 'select-row-computed',
    iterations: 100,
    fn: async () => {
        const mockDOM = createMockDOM();
        const table = createComputedSelectableTable(mockDOM);
        table.create(1000);
        table.selectRandom();
    },
};
/**
 * Toggle selection rapidly.
 */
export const toggleSelection = {
    name: 'toggle-selection-10-times',
    iterations: 50,
    fn: async () => {
        const mockDOM = createMockDOM();
        const table = createSelectableTable(mockDOM);
        table.create(1000);
        // Toggle selection 10 times
        for (let i = 0; i < 10; i++) {
            table.selectRandom();
        }
    },
};
export const selectRowBenchmarks = [
    selectRow,
    selectRowFineGrained,
    selectRowBatched,
    selectRowComputed,
    toggleSelection,
];
export default selectRowBenchmarks;
//# sourceMappingURL=select-row.js.map