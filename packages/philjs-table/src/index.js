/**
 * PhilJS Table - Headless, type-safe table component
 *
 * Inspired by TanStack Table. Provides complete control over rendering
 * while handling sorting, filtering, pagination, and selection.
 *
 * @example
 * ```typescript
 * import { createTable, createColumnHelper } from '@philjs/table';
 *
 * const columnHelper = createColumnHelper<Person>();
 *
 * const columns = [
 *   columnHelper.accessor('name', { header: 'Name' }),
 *   columnHelper.accessor('age', { header: 'Age', enableSorting: true }),
 *   columnHelper.accessor('email', { header: 'Email' }),
 * ];
 *
 * const table = createTable({
 *   data,
 *   columns,
 *   getCoreRowModel: getCoreRowModel(),
 *   getSortedRowModel: getSortedRowModel(),
 * });
 * ```
 */
/**
 * Create a column helper for type-safe column definitions
 */
export function createColumnHelper() {
    return {
        accessor(accessorKey, columnDef = {}) {
            return {
                accessorKey,
                id: accessorKey,
                ...columnDef,
            };
        },
        display(columnDef) {
            return {
                ...columnDef,
            };
        },
        group(columnDef) {
            return {
                ...columnDef,
            };
        },
    };
}
// ============================================================================
// Core Row Model
// ============================================================================
/**
 * Create the core row model factory
 */
export function getCoreRowModel() {
    return (table) => {
        const data = table.options.data;
        const getRowId = table.options.getRowId ?? ((_, index) => String(index));
        const rows = data.map((original, index) => {
            const id = getRowId(original, index);
            return createRow(table, id, original, index, 0);
        });
        const flatRows = rows;
        const rowsById = {};
        rows.forEach(row => { rowsById[row.id] = row; });
        return { rows, flatRows, rowsById };
    };
}
function createRow(table, id, original, index, depth) {
    const row = {
        id,
        index,
        original,
        depth,
        subRows: [],
        getValue: (columnId) => {
            const column = table.getColumn(columnId);
            if (!column)
                return undefined;
            const def = column.columnDef;
            if (def.accessorFn)
                return def.accessorFn(original);
            if (def.accessorKey)
                return original[def.accessorKey];
            return undefined;
        },
        getVisibleCells: () => {
            return table.getVisibleLeafColumns().map(column => createCell(table, row, column));
        },
        getAllCells: () => {
            return table.getAllLeafColumns().map(column => createCell(table, row, column));
        },
        getIsSelected: () => {
            return table.getState().rowSelection[id] ?? false;
        },
        toggleSelected: (selected) => {
            table.setRowSelection(prev => ({
                ...prev,
                [id]: selected ?? !prev[id],
            }));
        },
        getCanSelect: () => true,
        getIsExpanded: () => {
            return table.getState().expanded[id] ?? false;
        },
        toggleExpanded: (expanded) => {
            table.setExpanded(prev => ({
                ...prev,
                [id]: expanded ?? !prev[id],
            }));
        },
        getCanExpand: () => row.subRows.length > 0,
        getLeafRows: () => {
            const leafRows = [];
            const recurse = (rows) => {
                rows.forEach(r => {
                    if (r.subRows.length === 0) {
                        leafRows.push(r);
                    }
                    else {
                        recurse(r.subRows);
                    }
                });
            };
            recurse([row]);
            return leafRows;
        },
    };
    return row;
}
function createCell(table, row, column) {
    const cell = {
        id: `${row.id}_${column.id}`,
        row,
        column,
        getValue: () => row.getValue(column.id),
        renderValue: () => {
            const value = cell.getValue();
            if (column.columnDef.cell) {
                return column.columnDef.cell(cell.getContext());
            }
            return value;
        },
        getContext: () => ({
            table,
            row,
            column,
            cell,
            getValue: cell.getValue,
            renderValue: cell.renderValue,
        }),
    };
    return cell;
}
// ============================================================================
// Sorted Row Model
// ============================================================================
/**
 * Create the sorted row model factory
 */
export function getSortedRowModel() {
    return (table) => {
        const rowModel = table.getPreSortedRowModel();
        const sorting = table.getState().sorting;
        if (!sorting.length) {
            return rowModel;
        }
        const sortedRows = [...rowModel.rows].sort((rowA, rowB) => {
            for (const sort of sorting) {
                const column = table.getColumn(sort.id);
                if (!column)
                    continue;
                const sortingFn = column.columnDef.sortingFn ?? defaultSortingFn;
                const result = sortingFn(rowA, rowB, sort.id);
                if (result !== 0) {
                    return sort.desc ? -result : result;
                }
            }
            return 0;
        });
        return {
            rows: sortedRows,
            flatRows: sortedRows,
            rowsById: rowModel.rowsById,
        };
    };
}
function defaultSortingFn(rowA, rowB, columnId) {
    const a = rowA.getValue(columnId);
    const b = rowB.getValue(columnId);
    if (a === b)
        return 0;
    if (a == null)
        return 1;
    if (b == null)
        return -1;
    if (typeof a === 'string' && typeof b === 'string') {
        return a.localeCompare(b);
    }
    return a < b ? -1 : 1;
}
// ============================================================================
// Filtered Row Model
// ============================================================================
/**
 * Create the filtered row model factory
 */
export function getFilteredRowModel() {
    return (table) => {
        const rowModel = table.getCoreRowModel();
        const columnFilters = table.getState().columnFilters;
        const globalFilter = table.getState().globalFilter;
        if (!columnFilters.length && !globalFilter) {
            return rowModel;
        }
        const filteredRows = rowModel.rows.filter(row => {
            // Column filters
            for (const filter of columnFilters) {
                const column = table.getColumn(filter.id);
                if (!column)
                    continue;
                const filterFn = column.columnDef.filterFn ?? defaultFilterFn;
                if (!filterFn(row, filter.id, filter.value)) {
                    return false;
                }
            }
            // Global filter
            if (globalFilter) {
                const searchValue = String(globalFilter).toLowerCase();
                const allColumns = table.getAllLeafColumns();
                const hasMatch = allColumns.some(column => {
                    const value = row.getValue(column.id);
                    return String(value ?? '').toLowerCase().includes(searchValue);
                });
                if (!hasMatch)
                    return false;
            }
            return true;
        });
        const rowsById = {};
        filteredRows.forEach(row => { rowsById[row.id] = row; });
        return {
            rows: filteredRows,
            flatRows: filteredRows,
            rowsById,
        };
    };
}
function defaultFilterFn(row, columnId, filterValue) {
    const value = row.getValue(columnId);
    if (filterValue == null || filterValue === '')
        return true;
    return String(value ?? '').toLowerCase().includes(String(filterValue).toLowerCase());
}
// ============================================================================
// Paginated Row Model
// ============================================================================
/**
 * Create the paginated row model factory
 */
export function getPaginatedRowModel() {
    return (table) => {
        const rowModel = table.getPrePaginatedRowModel();
        const { pageIndex, pageSize } = table.getState().pagination;
        const start = pageIndex * pageSize;
        const end = start + pageSize;
        const paginatedRows = rowModel.rows.slice(start, end);
        const rowsById = {};
        paginatedRows.forEach(row => { rowsById[row.id] = row; });
        return {
            rows: paginatedRows,
            flatRows: paginatedRows,
            rowsById,
        };
    };
}
// ============================================================================
// Create Table
// ============================================================================
const defaultState = {
    sorting: [],
    pagination: { pageIndex: 0, pageSize: 10 },
    columnFilters: [],
    globalFilter: '',
    rowSelection: {},
    columnVisibility: {},
    expanded: {},
    columnOrder: [],
    columnPinning: { left: [], right: [] },
};
/**
 * Create a table instance
 */
export function createTable(options) {
    let state = {
        ...defaultState,
        ...options.initialState,
        ...options.state,
    };
    const columns = [];
    const columnsById = new Map();
    // Initialize columns
    function initColumns(defs, depth = 0, parent) {
        return defs.map(def => {
            const id = def.id ?? def.accessorKey ?? `column_${columns.length}`;
            const column = {
                id,
                columnDef: def,
                depth,
                ...(parent !== undefined && { parent }),
                columns: [],
                getIsVisible: () => state.columnVisibility[id] !== false,
                getCanSort: () => def.enableSorting !== false && options.enableSorting !== false,
                getIsSorted: () => {
                    const sortEntry = state.sorting.find(s => s.id === id);
                    if (!sortEntry)
                        return false;
                    return sortEntry.desc ? 'desc' : 'asc';
                },
                toggleSorting: (desc) => {
                    table.setSorting(prev => {
                        const existing = prev.find(s => s.id === id);
                        if (existing) {
                            if (desc === undefined) {
                                // Toggle or remove
                                if (existing.desc) {
                                    return prev.filter(s => s.id !== id);
                                }
                                return prev.map(s => s.id === id ? { ...s, desc: true } : s);
                            }
                            return prev.map(s => s.id === id ? { ...s, desc } : s);
                        }
                        return [...prev, { id, desc: desc ?? false }];
                    });
                },
                clearSorting: () => {
                    table.setSorting(prev => prev.filter(s => s.id !== id));
                },
                getCanFilter: () => def.enableFiltering !== false && options.enableFiltering !== false,
                getFilterValue: () => {
                    const filter = state.columnFilters.find(f => f.id === id);
                    return filter?.value;
                },
                setFilterValue: (value) => {
                    table.setColumnFilters(prev => {
                        const existing = prev.find(f => f.id === id);
                        if (value == null || value === '') {
                            return prev.filter(f => f.id !== id);
                        }
                        if (existing) {
                            return prev.map(f => f.id === id ? { id, value } : f);
                        }
                        return [...prev, { id, value }];
                    });
                },
                getCanHide: () => def.enableHiding !== false,
                toggleVisibility: (visible) => {
                    table.setColumnVisibility(prev => ({
                        ...prev,
                        [id]: visible ?? !prev[id],
                    }));
                },
                getCanPin: () => def.enablePinning !== false && options.enableColumnPinning !== false,
                pin: (position) => {
                    // Implementation
                },
                getIsPinned: () => {
                    if (state.columnPinning.left.includes(id))
                        return 'left';
                    if (state.columnPinning.right.includes(id))
                        return 'right';
                    return false;
                },
                getSize: () => def.size ?? 150,
                getStart: () => 0,
            };
            columns.push(column);
            columnsById.set(id, column);
            if (def.columns) {
                column.columns = initColumns(def.columns, depth + 1, column);
            }
            return column;
        });
    }
    initColumns(options.columns);
    // Row model cache
    let coreRowModelCache = null;
    let sortedRowModelCache = null;
    let filteredRowModelCache = null;
    let paginatedRowModelCache = null;
    const table = {
        getState: () => state,
        setState: (updater) => {
            const newState = updater(state);
            state = newState;
            // Invalidate caches
            coreRowModelCache = null;
            sortedRowModelCache = null;
            filteredRowModelCache = null;
            paginatedRowModelCache = null;
            options.onStateChange?.(updater);
        },
        resetState: (defaultOverride) => {
            table.setState(() => ({ ...defaultState, ...defaultOverride }));
        },
        // Columns
        getAllColumns: () => columns,
        getAllFlatColumns: () => columns.flatMap(c => [c, ...c.columns]),
        getAllLeafColumns: () => columns.filter(c => c.columns.length === 0),
        getColumn: (id) => columnsById.get(id),
        getVisibleLeafColumns: () => table.getAllLeafColumns().filter(c => c.getIsVisible()),
        getLeftVisibleLeafColumns: () => table.getVisibleLeafColumns().filter(c => c.getIsPinned() === 'left'),
        getRightVisibleLeafColumns: () => table.getVisibleLeafColumns().filter(c => c.getIsPinned() === 'right'),
        getCenterVisibleLeafColumns: () => table.getVisibleLeafColumns().filter(c => !c.getIsPinned()),
        // Headers
        getHeaderGroups: () => {
            const maxDepth = Math.max(...columns.map(c => c.depth));
            const groups = [];
            for (let depth = 0; depth <= maxDepth; depth++) {
                const headersAtDepth = columns
                    .filter(c => c.depth === depth)
                    .map((column, index) => createHeader(table, column, index, depth));
                groups.push({ id: `header_${depth}`, depth, headers: headersAtDepth });
            }
            return groups;
        },
        getLeftHeaderGroups: () => [],
        getCenterHeaderGroups: () => table.getHeaderGroups(),
        getRightHeaderGroups: () => [],
        getFooterGroups: () => [],
        getFlatHeaders: () => table.getHeaderGroups().flatMap(g => g.headers),
        getLeafHeaders: () => table.getFlatHeaders().filter(h => h.column.columns.length === 0),
        // Row Models
        getCoreRowModel: () => {
            if (!coreRowModelCache) {
                coreRowModelCache = options.getCoreRowModel()(table);
            }
            return coreRowModelCache;
        },
        getRowModel: () => {
            if (options.getPaginatedRowModel) {
                return table.getPaginatedRowModel();
            }
            if (options.getSortedRowModel) {
                return table.getSortedRowModel();
            }
            if (options.getFilteredRowModel) {
                return table.getFilteredRowModel();
            }
            return table.getCoreRowModel();
        },
        getSortedRowModel: () => {
            if (!sortedRowModelCache && options.getSortedRowModel) {
                sortedRowModelCache = options.getSortedRowModel()(table);
            }
            return sortedRowModelCache ?? table.getPreSortedRowModel();
        },
        getFilteredRowModel: () => {
            if (!filteredRowModelCache && options.getFilteredRowModel) {
                filteredRowModelCache = options.getFilteredRowModel()(table);
            }
            return filteredRowModelCache ?? table.getCoreRowModel();
        },
        getPaginatedRowModel: () => {
            if (!paginatedRowModelCache && options.getPaginatedRowModel) {
                paginatedRowModelCache = options.getPaginatedRowModel()(table);
            }
            return paginatedRowModelCache ?? table.getPrePaginatedRowModel();
        },
        getExpandedRowModel: () => table.getCoreRowModel(),
        getPreFilteredRowModel: () => table.getCoreRowModel(),
        getPrePaginatedRowModel: () => options.getSortedRowModel ? table.getSortedRowModel() : table.getFilteredRowModel(),
        getPreSortedRowModel: () => options.getFilteredRowModel ? table.getFilteredRowModel() : table.getCoreRowModel(),
        getRow: (id) => table.getCoreRowModel().rowsById[id],
        // Sorting
        setSorting: (updater) => {
            table.setState(prev => ({ ...prev, sorting: updater(prev.sorting) }));
            options.onSortingChange?.(updater);
        },
        resetSorting: () => table.setSorting(() => []),
        // Filtering
        setColumnFilters: (updater) => {
            table.setState(prev => ({ ...prev, columnFilters: updater(prev.columnFilters) }));
            options.onColumnFiltersChange?.(updater);
        },
        resetColumnFilters: () => table.setColumnFilters(() => []),
        setGlobalFilter: (filter) => {
            table.setState(prev => ({ ...prev, globalFilter: filter }));
            options.onGlobalFilterChange?.(() => filter);
        },
        resetGlobalFilter: () => table.setGlobalFilter(''),
        // Pagination
        setPagination: (updater) => {
            table.setState(prev => ({ ...prev, pagination: updater(prev.pagination) }));
            options.onPaginationChange?.(updater);
        },
        resetPagination: () => table.setPagination(() => ({ pageIndex: 0, pageSize: 10 })),
        setPageIndex: (index) => table.setPagination(prev => ({ ...prev, pageIndex: index })),
        setPageSize: (size) => table.setPagination(prev => ({ ...prev, pageSize: size, pageIndex: 0 })),
        getPageCount: () => {
            const total = table.getPrePaginatedRowModel().rows.length;
            return Math.ceil(total / state.pagination.pageSize);
        },
        getCanPreviousPage: () => state.pagination.pageIndex > 0,
        getCanNextPage: () => state.pagination.pageIndex < table.getPageCount() - 1,
        previousPage: () => table.setPageIndex(Math.max(0, state.pagination.pageIndex - 1)),
        nextPage: () => table.setPageIndex(Math.min(table.getPageCount() - 1, state.pagination.pageIndex + 1)),
        firstPage: () => table.setPageIndex(0),
        lastPage: () => table.setPageIndex(table.getPageCount() - 1),
        // Selection
        setRowSelection: (updater) => {
            table.setState(prev => ({ ...prev, rowSelection: updater(prev.rowSelection) }));
            options.onRowSelectionChange?.(updater);
        },
        resetRowSelection: () => table.setRowSelection(() => ({})),
        getSelectedRowModel: () => {
            const rows = table.getCoreRowModel().rows.filter(r => r.getIsSelected());
            const rowsById = {};
            rows.forEach(r => { rowsById[r.id] = r; });
            return { rows, flatRows: rows, rowsById };
        },
        getFilteredSelectedRowModel: () => table.getSelectedRowModel(),
        getGroupedSelectedRowModel: () => table.getSelectedRowModel(),
        getIsAllRowsSelected: () => {
            const rows = table.getCoreRowModel().rows;
            return rows.length > 0 && rows.every(r => r.getIsSelected());
        },
        getIsSomeRowsSelected: () => {
            const rows = table.getCoreRowModel().rows;
            return rows.some(r => r.getIsSelected()) && !table.getIsAllRowsSelected();
        },
        toggleAllRowsSelected: (selected) => {
            const newSelection = {};
            if (selected ?? !table.getIsAllRowsSelected()) {
                table.getCoreRowModel().rows.forEach(r => { newSelection[r.id] = true; });
            }
            table.setRowSelection(() => newSelection);
        },
        getIsAllPageRowsSelected: () => {
            const rows = table.getPaginatedRowModel().rows;
            return rows.length > 0 && rows.every(r => r.getIsSelected());
        },
        getIsSomePageRowsSelected: () => {
            const rows = table.getPaginatedRowModel().rows;
            return rows.some(r => r.getIsSelected()) && !table.getIsAllPageRowsSelected();
        },
        toggleAllPageRowsSelected: (selected) => {
            const newSelection = { ...state.rowSelection };
            const rows = table.getPaginatedRowModel().rows;
            const shouldSelect = selected ?? !table.getIsAllPageRowsSelected();
            rows.forEach(r => {
                if (shouldSelect) {
                    newSelection[r.id] = true;
                }
                else {
                    delete newSelection[r.id];
                }
            });
            table.setRowSelection(() => newSelection);
        },
        // Visibility
        setColumnVisibility: (updater) => {
            table.setState(prev => ({ ...prev, columnVisibility: updater(prev.columnVisibility) }));
            options.onColumnVisibilityChange?.(updater);
        },
        resetColumnVisibility: () => table.setColumnVisibility(() => ({})),
        toggleAllColumnsVisible: (visible) => {
            const newVisibility = {};
            table.getAllLeafColumns().forEach(c => {
                newVisibility[c.id] = visible ?? !table.getIsAllColumnsVisible();
            });
            table.setColumnVisibility(() => newVisibility);
        },
        getIsAllColumnsVisible: () => table.getAllLeafColumns().every(c => c.getIsVisible()),
        getIsSomeColumnsVisible: () => {
            const cols = table.getAllLeafColumns();
            return cols.some(c => c.getIsVisible()) && !table.getIsAllColumnsVisible();
        },
        // Expanding
        setExpanded: (updater) => {
            table.setState(prev => ({ ...prev, expanded: updater(prev.expanded) }));
            options.onExpandedChange?.(updater);
        },
        resetExpanded: () => table.setExpanded(() => ({})),
        toggleAllRowsExpanded: (expanded) => {
            const newExpanded = {};
            if (expanded ?? !table.getIsAllRowsExpanded()) {
                table.getCoreRowModel().flatRows.forEach(r => {
                    if (r.getCanExpand()) {
                        newExpanded[r.id] = true;
                    }
                });
            }
            table.setExpanded(() => newExpanded);
        },
        getIsAllRowsExpanded: () => {
            const expandable = table.getCoreRowModel().flatRows.filter(r => r.getCanExpand());
            return expandable.length > 0 && expandable.every(r => r.getIsExpanded());
        },
        getIsSomeRowsExpanded: () => {
            return table.getCoreRowModel().flatRows.some(r => r.getIsExpanded());
        },
        getExpandedDepth: () => {
            let maxDepth = 0;
            table.getCoreRowModel().flatRows.forEach(r => {
                if (r.getIsExpanded() && r.depth > maxDepth) {
                    maxDepth = r.depth;
                }
            });
            return maxDepth;
        },
        options,
    };
    return table;
}
function createHeader(table, column, index, depth) {
    const header = {
        id: `${column.id}_header`,
        index,
        depth,
        column,
        colSpan: 1,
        rowSpan: 1,
        isPlaceholder: false,
        getContext: () => ({
            table,
            header,
            column,
        }),
        getLeafHeaders: () => column.columns.length === 0 ? [header] : [],
    };
    return header;
}
// ============================================================================
// Sorting Functions
// ============================================================================
export const sortingFns = {
    alphanumeric: (rowA, rowB, columnId) => {
        const a = String(rowA.getValue(columnId) ?? '');
        const b = String(rowB.getValue(columnId) ?? '');
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    },
    text: (rowA, rowB, columnId) => {
        const a = String(rowA.getValue(columnId) ?? '');
        const b = String(rowB.getValue(columnId) ?? '');
        return a.localeCompare(b);
    },
    datetime: (rowA, rowB, columnId) => {
        const a = rowA.getValue(columnId);
        const b = rowB.getValue(columnId);
        const dateA = new Date(a).getTime();
        const dateB = new Date(b).getTime();
        return dateA - dateB;
    },
    basic: (rowA, rowB, columnId) => {
        const a = rowA.getValue(columnId);
        const b = rowB.getValue(columnId);
        return a === b ? 0 : a > b ? 1 : -1;
    },
};
// ============================================================================
// Filter Functions
// ============================================================================
export const filterFns = {
    includesString: (row, columnId, filterValue) => {
        const value = String(row.getValue(columnId) ?? '').toLowerCase();
        return value.includes(String(filterValue).toLowerCase());
    },
    equalsString: (row, columnId, filterValue) => {
        const value = String(row.getValue(columnId) ?? '').toLowerCase();
        return value === String(filterValue).toLowerCase();
    },
    arrIncludes: (row, columnId, filterValue) => {
        const value = row.getValue(columnId);
        return filterValue.includes(value);
    },
    inNumberRange: (row, columnId, filterValue) => {
        const value = row.getValue(columnId);
        const [min, max] = filterValue;
        return value >= min && value <= max;
    },
};
// ============================================================================
// Utilities
// ============================================================================
/**
 * Flex render utility for rendering header/cell content
 */
export function flexRender(component, props) {
    if (!component)
        return null;
    if (typeof component === 'string')
        return component;
    return component(props);
}
//# sourceMappingURL=index.js.map