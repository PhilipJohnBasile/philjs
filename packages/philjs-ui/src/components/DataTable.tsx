// @ts-nocheck
/**
 * PhilJS UI - DataTable Component
 *
 * Advanced data table with sorting, filtering, pagination,
 * row selection, column visibility, and more.
 */

import { signal, memo, effect, batch } from 'philjs-core';

export type SortDirection = 'asc' | 'desc' | null;

export interface ColumnDef<T> {
  id: string;
  header: string | (() => any);
  cell: (row: T, index: number) => any;
  accessorKey?: keyof T;
  sortable?: boolean;
  filterable?: boolean;
  hidden?: boolean;
  width?: string | number;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  sticky?: 'left' | 'right';
  meta?: Record<string, any>;
}

export interface SortingState {
  id: string;
  direction: SortDirection;
}

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export interface RowSelectionState {
  [key: string]: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  getRowId?: (row: T, index: number) => string;

  // Sorting
  sortable?: boolean;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;

  // Pagination
  pagination?: boolean;
  paginationState?: PaginationState;
  onPaginationChange?: (pagination: PaginationState) => void;
  pageSizeOptions?: number[];
  manualPagination?: boolean;
  totalRows?: number;

  // Selection
  selectable?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  enableMultiSelect?: boolean;

  // Column visibility
  columnVisibility?: Record<string, boolean>;
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;

  // Filtering
  globalFilter?: string;
  onGlobalFilterChange?: (filter: string) => void;

  // Styling
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  compact?: boolean;
  stickyHeader?: boolean;

  // Loading/Empty
  loading?: boolean;
  emptyMessage?: string;
  loadingRows?: number;

  // Events
  onRowClick?: (row: T, index: number) => void;
  onRowDoubleClick?: (row: T, index: number) => void;

  className?: string;
}

export function DataTable<T>(props: DataTableProps<T>) {
  const {
    data,
    columns,
    getRowId = (_row: T, index: number) => String(index),

    // Sorting
    sortable = true,
    sorting: externalSorting,
    onSortingChange,

    // Pagination
    pagination = false,
    paginationState: externalPagination,
    onPaginationChange,
    pageSizeOptions = [10, 25, 50, 100],
    manualPagination = false,
    totalRows,

    // Selection
    selectable = false,
    rowSelection: externalSelection,
    onRowSelectionChange,
    enableMultiSelect = true,

    // Column visibility
    columnVisibility: externalVisibility,
    onColumnVisibilityChange,

    // Filtering
    globalFilter: externalFilter,
    onGlobalFilterChange,

    // Styling
    striped = true,
    hoverable = true,
    bordered = false,
    compact = false,
    stickyHeader = false,

    // Loading
    loading = false,
    emptyMessage = 'No data available',
    loadingRows = 5,

    // Events
    onRowClick,
    onRowDoubleClick,

    className = '',
  } = props;

  // Internal state
  const sorting = signal<SortingState>(externalSorting || { id: '', direction: null });
  const paginationLocal = signal<PaginationState>(externalPagination || { pageIndex: 0, pageSize: pageSizeOptions[0] });
  const selection = signal<RowSelectionState>(externalSelection || {});
  const visibility = signal<Record<string, boolean>>(externalVisibility || {});
  const filter = signal(externalFilter || '');

  // Sync external state
  effect(() => {
    if (externalSorting) sorting.set(externalSorting);
  });
  effect(() => {
    if (externalPagination) paginationLocal.set(externalPagination);
  });
  effect(() => {
    if (externalSelection) selection.set(externalSelection);
  });
  effect(() => {
    if (externalVisibility) visibility.set(externalVisibility);
  });
  effect(() => {
    if (externalFilter !== undefined) filter.set(externalFilter);
  });

  // Visible columns
  const visibleColumns = memo(() => {
    const vis = visibility();
    return columns.filter(col => !col.hidden && vis[col.id] !== false);
  });

  // Filtered data
  const filteredData = memo(() => {
    const filterText = filter().toLowerCase();
    if (!filterText) return data;

    return data.filter(row => {
      return columns.some(col => {
        if (!col.filterable && col.filterable !== undefined) return false;
        const value = col.accessorKey ? row[col.accessorKey] : '';
        return String(value).toLowerCase().includes(filterText);
      });
    });
  });

  // Sorted data
  const sortedData = memo(() => {
    const { id, direction } = sorting();
    if (!id || !direction) return filteredData();

    const column = columns.find(c => c.id === id);
    if (!column || !column.accessorKey) return filteredData();

    const sorted = [...filteredData()].sort((a, b) => {
      const aVal = a[column.accessorKey!];
      const bVal = b[column.accessorKey!];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  });

  // Paginated data
  const paginatedData = memo(() => {
    if (!pagination || manualPagination) return sortedData();

    const { pageIndex, pageSize } = paginationLocal();
    const start = pageIndex * pageSize;
    return sortedData().slice(start, start + pageSize);
  });

  // Pagination info
  const pageCount = memo(() => {
    const total = totalRows ?? filteredData().length;
    return Math.ceil(total / paginationLocal().pageSize);
  });

  // Selection helpers
  const allRowsSelected = memo(() => {
    const sel = selection();
    return paginatedData().every(row => sel[getRowId(row, 0)]);
  });

  const someRowsSelected = memo(() => {
    const sel = selection();
    const selected = paginatedData().filter(row => sel[getRowId(row, 0)]);
    return selected.length > 0 && selected.length < paginatedData().length;
  });

  // Handlers
  const handleSort = (columnId: string) => {
    if (!sortable) return;

    const column = columns.find(c => c.id === columnId);
    if (!column?.sortable) return;

    const current = sorting();
    let newDirection: SortDirection;

    if (current.id !== columnId) {
      newDirection = 'asc';
    } else if (current.direction === 'asc') {
      newDirection = 'desc';
    } else {
      newDirection = null;
    }

    const newSorting = { id: columnId, direction: newDirection };
    sorting.set(newSorting);
    onSortingChange?.(newSorting);
  };

  const handlePageChange = (pageIndex: number) => {
    const newPagination = { ...paginationLocal(), pageIndex };
    paginationLocal.set(newPagination);
    onPaginationChange?.(newPagination);
  };

  const handlePageSizeChange = (pageSize: number) => {
    const newPagination = { pageIndex: 0, pageSize };
    paginationLocal.set(newPagination);
    onPaginationChange?.(newPagination);
  };

  const handleRowSelect = (rowId: string) => {
    if (!selectable) return;

    const current = selection();
    let newSelection: RowSelectionState;

    if (enableMultiSelect) {
      newSelection = { ...current, [rowId]: !current[rowId] };
    } else {
      newSelection = current[rowId] ? {} : { [rowId]: true };
    }

    selection.set(newSelection);
    onRowSelectionChange?.(newSelection);
  };

  const handleSelectAll = () => {
    if (!selectable || !enableMultiSelect) return;

    const allSelected = allRowsSelected();
    const newSelection: RowSelectionState = {};

    if (!allSelected) {
      paginatedData().forEach((row, idx) => {
        newSelection[getRowId(row, idx)] = true;
      });
    }

    selection.set(newSelection);
    onRowSelectionChange?.(newSelection);
  };

  // Styles
  const cellPadding = compact ? 'px-3 py-2' : 'px-4 py-3';
  const headerPadding = compact ? 'px-3 py-2' : 'px-4 py-3';

  const renderSortIcon = (columnId: string) => {
    const current = sorting();
    if (current.id !== columnId) {
      return (
        <svg className="w-4 h-4 text-gray-300 ml-1" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5 8l5-5 5 5H5zm0 4l5 5 5-5H5z" />
        </svg>
      );
    }

    if (current.direction === 'asc') {
      return (
        <svg className="w-4 h-4 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5 12l5-5 5 5H5z" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 20 20">
        <path d="M5 8l5 5 5-5H5z" />
      </svg>
    );
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Toolbar: Filter */}
      {onGlobalFilterChange && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search..."
            value={filter()}
            onInput={(e: any) => {
              filter.set(e.target.value);
              onGlobalFilterChange?.(e.target.value);
            }}
            className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      {/* Table Container */}
      <div className={`overflow-auto ${bordered ? 'border border-gray-200 rounded-lg' : ''}`}>
        <table className="w-full">
          <thead className={`bg-gray-50 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
            <tr>
              {/* Selection Column */}
              {selectable && enableMultiSelect && (
                <th className={`${headerPadding} w-12`}>
                  <input
                    type="checkbox"
                    checked={allRowsSelected()}
                    indeterminate={someRowsSelected()}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
              )}

              {visibleColumns().map(column => (
                <th
                  key={column.id}
                  className={`
                    ${headerPadding}
                    text-left text-sm font-semibold text-gray-900
                    ${column.sortable !== false && sortable ? 'cursor-pointer select-none hover:bg-gray-100' : ''}
                    ${column.align === 'center' ? 'text-center' : ''}
                    ${column.align === 'right' ? 'text-right' : ''}
                  `}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth,
                  }}
                  onClick={() => column.sortable !== false && handleSort(column.id)}
                >
                  <div className="flex items-center">
                    {typeof column.header === 'function' ? column.header() : column.header}
                    {column.sortable !== false && sortable && renderSortIcon(column.id)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white">
            {/* Loading State */}
            {loading && (
              Array.from({ length: loadingRows }).map((_, i) => (
                <tr key={`loading-${i}`} className="animate-pulse">
                  {selectable && enableMultiSelect && (
                    <td className={cellPadding}>
                      <div className="h-4 w-4 bg-gray-200 rounded" />
                    </td>
                  )}
                  {visibleColumns().map(column => (
                    <td key={column.id} className={cellPadding}>
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            )}

            {/* Empty State */}
            {!loading && paginatedData().length === 0 && (
              <tr>
                <td
                  colSpan={visibleColumns().length + (selectable && enableMultiSelect ? 1 : 0)}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}

            {/* Data Rows */}
            {!loading && paginatedData().map((row, index) => {
              const rowId = getRowId(row, index);
              const isSelected = selection()[rowId];

              return (
                <tr
                  key={rowId}
                  className={`
                    ${striped && index % 2 === 1 ? 'bg-gray-50' : ''}
                    ${hoverable ? 'hover:bg-gray-100' : ''}
                    ${isSelected ? 'bg-blue-50' : ''}
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                  onClick={() => onRowClick?.(row, index)}
                  onDblClick={() => onRowDoubleClick?.(row, index)}
                >
                  {/* Selection Checkbox */}
                  {selectable && enableMultiSelect && (
                    <td className={cellPadding} onClick={(e: any) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected || false}
                        onChange={() => handleRowSelect(rowId)}
                        className="rounded border-gray-300"
                      />
                    </td>
                  )}

                  {/* Data Cells */}
                  {visibleColumns().map(column => (
                    <td
                      key={column.id}
                      className={`
                        ${cellPadding}
                        text-sm text-gray-900
                        ${column.align === 'center' ? 'text-center' : ''}
                        ${column.align === 'right' ? 'text-right' : ''}
                      `}
                    >
                      {column.cell(row, index)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span>Rows per page:</span>
            <select
              value={paginationLocal().pageSize}
              onChange={(e: any) => handlePageSizeChange(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              Page {paginationLocal().pageIndex + 1} of {pageCount()}
            </span>

            <div className="flex gap-1">
              <button
                type="button"
                disabled={paginationLocal().pageIndex === 0}
                onClick={() => handlePageChange(0)}
                className="px-2 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                ««
              </button>
              <button
                type="button"
                disabled={paginationLocal().pageIndex === 0}
                onClick={() => handlePageChange(paginationLocal().pageIndex - 1)}
                className="px-2 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                «
              </button>
              <button
                type="button"
                disabled={paginationLocal().pageIndex >= pageCount() - 1}
                onClick={() => handlePageChange(paginationLocal().pageIndex + 1)}
                className="px-2 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                »
              </button>
              <button
                type="button"
                disabled={paginationLocal().pageIndex >= pageCount() - 1}
                onClick={() => handlePageChange(pageCount() - 1)}
                className="px-2 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                »»
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Helper to create column definitions
 */
export function createColumnHelper<T>() {
  return {
    accessor: <K extends keyof T>(
      accessorKey: K,
      column: Omit<ColumnDef<T>, 'id' | 'accessorKey'>
    ): ColumnDef<T> => ({
      id: String(accessorKey),
      accessorKey,
      ...column,
    }),

    display: (column: ColumnDef<T>): ColumnDef<T> => column,
  };
}
