/**
 * Table Component
 * Data table with sorting, selection, and responsive features
 */

import { jsx, signal, memo } from '@philjs/core';
import { cn, getValue, generateId } from '../utils.js';
import type { BaseProps, Size, MaybeSignal, TableColumn, SortState } from '../types.js';

export interface TableProps<T = Record<string, unknown>> extends BaseProps {
  /** Table columns configuration */
  columns: TableColumn<T>[];
  /** Table data */
  data: T[] | MaybeSignal<T[]>;
  /** Row key extractor */
  getRowKey?: (row: T, index: number) => string | number;
  /** Size variant */
  size?: Size;
  /** Striped rows */
  striped?: boolean;
  /** Hoverable rows */
  hoverable?: boolean;
  /** Bordered cells */
  bordered?: boolean;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Sortable columns */
  sortable?: boolean;
  /** Current sort state */
  sortState?: SortState | MaybeSignal<SortState>;
  /** Sort change handler */
  onSort?: (state: SortState) => void;
  /** Selectable rows */
  selectable?: boolean;
  /** Selected row keys */
  selectedKeys?: (string | number)[] | MaybeSignal<(string | number)[]>;
  /** Selection change handler */
  onSelectionChange?: (keys: (string | number)[]) => void;
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Empty state content */
  emptyContent?: JSX.Element | string;
  /** Loading state */
  loading?: boolean | MaybeSignal<boolean>;
  /** Caption for accessibility */
  caption?: string;
}

const sizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

const cellPaddingClasses = {
  xs: 'px-2 py-1',
  sm: 'px-3 py-2',
  md: 'px-4 py-3',
  lg: 'px-5 py-4',
  xl: 'px-6 py-5',
};

export function Table<T = Record<string, unknown>>(props: TableProps<T>): JSX.Element {
  const {
    columns,
    data,
    getRowKey = (_, index) => index,
    size = 'md',
    striped = false,
    hoverable = true,
    bordered = false,
    stickyHeader = false,
    sortable = false,
    sortState,
    onSort,
    selectable = false,
    selectedKeys,
    onSelectionChange,
    onRowClick,
    emptyContent = 'No data available',
    loading,
    caption,
    class: className,
    id: providedId,
    testId,
    ...rest
  } = props;

  const id = providedId || generateId('table');

  const getData = () => getValue(data as MaybeSignal<T[]>);
  const isLoading = getValue(loading as MaybeSignal<boolean>) || false;
  const currentSort = sortState !== undefined ? getValue(sortState as MaybeSignal<SortState>) : null;
  const currentSelectedKeys = selectedKeys !== undefined ? getValue(selectedKeys as MaybeSignal<(string | number)[]>) : [];

  const handleSort = (columnKey: string) => {
    if (!sortable) return;

    const column = columns.find(c => c.key === columnKey);
    if (!column?.sortable) return;

    const newDirection = currentSort?.column === columnKey && currentSort?.direction === 'asc' ? 'desc' : 'asc';
    onSort?.({ column: columnKey, direction: newDirection });
  };

  const handleSelectAll = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const tableData = getData();

    if (target.checked) {
      const allKeys = tableData.map((row, index) => getRowKey(row, index));
      onSelectionChange?.(allKeys);
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleSelectRow = (key: string | number, e: Event) => {
    e.stopPropagation();
    const target = e.target as HTMLInputElement;
    const current = [...currentSelectedKeys];

    if (target.checked) {
      current.push(key);
    } else {
      const index = current.indexOf(key);
      if (index >= 0) current.splice(index, 1);
    }

    onSelectionChange?.(current);
  };

  const tableData = getData();
  const isEmpty = tableData.length === 0;
  const allSelected = tableData.length > 0 && tableData.every((row, index) =>
    currentSelectedKeys.includes(getRowKey(row, index))
  );
  const someSelected = tableData.some((row, index) =>
    currentSelectedKeys.includes(getRowKey(row, index))
  );

  const tableClasses = cn(
    'w-full',
    sizeClasses[size],
    bordered && 'border border-gray-200 dark:border-gray-700',
    className
  );

  const headerCellClasses = cn(
    cellPaddingClasses[size],
    'text-left font-semibold',
    'text-gray-900 dark:text-gray-100',
    'bg-gray-50 dark:bg-gray-800',
    bordered && 'border-b border-gray-200 dark:border-gray-700',
    stickyHeader && 'sticky top-0 z-10'
  );

  const bodyCellClasses = cn(
    cellPaddingClasses[size],
    'text-gray-700 dark:text-gray-300',
    bordered && 'border-b border-gray-200 dark:border-gray-700'
  );

  const getRowClasses = (index: number, row: T) => {
    const rowKey = getRowKey(row, index);
    const isSelected = currentSelectedKeys.includes(rowKey);

    return cn(
      'transition-colors duration-150',
      striped && index % 2 === 1 && 'bg-gray-50 dark:bg-gray-800/50',
      hoverable && 'hover:bg-gray-100 dark:hover:bg-gray-800',
      isSelected && 'bg-blue-50 dark:bg-blue-900/20',
      onRowClick && 'cursor-pointer'
    );
  };

  // Sort icon
  const renderSortIcon = (columnKey: string) => {
    if (!currentSort || currentSort.column !== columnKey) {
      return jsx('svg', {
        class: 'w-4 h-4 text-gray-400',
        fill: 'none',
        stroke: 'currentColor',
        viewBox: '0 0 24 24',
        children: jsx('path', {
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'stroke-width': '2',
          d: 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4',
        }),
      });
    }

    return jsx('svg', {
      class: 'w-4 h-4 text-blue-600 dark:text-blue-400',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
      children: jsx('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: currentSort.direction === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7',
      }),
    });
  };

  return jsx('div', {
    class: 'overflow-x-auto',
    children: jsx('table', {
      class: tableClasses,
      id,
      'data-testid': testId,
      role: 'table',
      ...rest,
      children: [
        // Caption
        caption && jsx('caption', {
          class: 'sr-only',
          children: caption,
        }),
        // Header
        jsx('thead', {
          children: jsx('tr', {
            children: [
              // Selection checkbox column
              selectable && jsx('th', {
                class: cn(headerCellClasses, 'w-12'),
                scope: 'col',
                children: jsx('input', {
                  type: 'checkbox',
                  class: 'rounded border-gray-300 text-blue-600 focus:ring-blue-500',
                  checked: allSelected,
                  indeterminate: !allSelected && someSelected,
                  onchange: handleSelectAll,
                  'aria-label': 'Select all rows',
                }),
              }),
              // Data columns
              ...columns.map(column =>
                jsx('th', {
                  class: cn(
                    headerCellClasses,
                    column.sortable && sortable && 'cursor-pointer select-none',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right'
                  ),
                  style: column.width ? { width: typeof column.width === 'number' ? `${column.width}px` : column.width } : undefined,
                  scope: 'col',
                  onclick: () => column.sortable && handleSort(column.key),
                  'aria-sort': currentSort?.column === column.key
                    ? currentSort.direction === 'asc' ? 'ascending' : 'descending'
                    : undefined,
                  children: jsx('div', {
                    class: 'flex items-center gap-2',
                    children: [
                      jsx('span', {
                        children: typeof column.header === 'function' ? column.header() : column.header,
                      }),
                      column.sortable && sortable && renderSortIcon(column.key),
                    ],
                  }),
                })
              ),
            ],
          }),
        }),
        // Body
        jsx('tbody', {
          children: isLoading
            ? jsx('tr', {
                children: jsx('td', {
                  class: cn(bodyCellClasses, 'text-center py-8'),
                  colSpan: columns.length + (selectable ? 1 : 0),
                  children: jsx('div', {
                    class: 'flex items-center justify-center gap-2 text-gray-500',
                    children: [
                      jsx('svg', {
                        class: 'w-5 h-5 animate-spin',
                        fill: 'none',
                        viewBox: '0 0 24 24',
                        children: [
                          jsx('circle', {
                            class: 'opacity-25',
                            cx: '12',
                            cy: '12',
                            r: '10',
                            stroke: 'currentColor',
                            'stroke-width': '4',
                          }),
                          jsx('path', {
                            class: 'opacity-75',
                            fill: 'currentColor',
                            d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z',
                          }),
                        ],
                      }),
                      'Loading...',
                    ],
                  }),
                }),
              })
            : isEmpty
              ? jsx('tr', {
                  children: jsx('td', {
                    class: cn(bodyCellClasses, 'text-center py-8 text-gray-500'),
                    colSpan: columns.length + (selectable ? 1 : 0),
                    children: emptyContent,
                  }),
                })
              : tableData.map((row, rowIndex) => {
                  const rowKey = getRowKey(row, rowIndex);
                  const isSelected = currentSelectedKeys.includes(rowKey);

                  return jsx('tr', {
                    class: getRowClasses(rowIndex, row),
                    onclick: () => onRowClick?.(row, rowIndex),
                    'aria-selected': isSelected,
                    children: [
                      selectable && jsx('td', {
                        class: bodyCellClasses,
                        children: jsx('input', {
                          type: 'checkbox',
                          class: 'rounded border-gray-300 text-blue-600 focus:ring-blue-500',
                          checked: isSelected,
                          onchange: (e: Event) => handleSelectRow(rowKey, e),
                          'aria-label': `Select row ${rowIndex + 1}`,
                        }),
                      }),
                      ...columns.map(column =>
                        jsx('td', {
                          class: cn(
                            bodyCellClasses,
                            column.align === 'center' && 'text-center',
                            column.align === 'right' && 'text-right'
                          ),
                          children: column.cell
                            ? column.cell(row, rowIndex)
                            : (row as Record<string, unknown>)[column.key] as string,
                        })
                      ),
                    ],
                  });
                }),
        }),
      ],
    }),
  });
}
