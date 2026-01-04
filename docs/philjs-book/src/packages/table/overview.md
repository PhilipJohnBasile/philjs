# @philjs/table

A headless, type-safe table component library for building powerful data tables with complete control over rendering.

## Introduction

`@philjs/table` is inspired by TanStack Table and provides a headless approach to building tables. Instead of rendering UI directly, it manages table state and logic while giving you complete control over the markup and styling. This makes it framework-agnostic and highly customizable.

The library handles:
- Sorting (single and multi-column)
- Filtering (column-specific and global search)
- Pagination
- Row selection
- Row expansion
- Column visibility
- Column pinning
- Column resizing

All with full TypeScript support and type inference.

## Installation

```bash
npm install @philjs/table
# or
pnpm add @philjs/table
```

## Features

### Complete Control Over Rendering

Unlike traditional table components, `@philjs/table` is headless - it provides the logic and state management while you control all the rendering. This means:

- No predefined styles or markup
- Works with any UI library or CSS framework
- Full customization of every cell, header, and row

### Sorting

Support for single and multi-column sorting with customizable sorting functions:

```typescript
import { createTable, getSortedRowModel, sortingFns } from '@philjs/table';

const table = createTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  enableSorting: true,
});
```

### Filtering

Both column-specific filtering and global search across all columns:

```typescript
import { createTable, getFilteredRowModel, filterFns } from '@philjs/table';

const table = createTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  enableFiltering: true,
});
```

### Pagination

Built-in pagination with navigation helpers:

```typescript
import { createTable, getPaginatedRowModel } from '@philjs/table';

const table = createTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginatedRowModel: getPaginatedRowModel(),
  enablePagination: true,
});

// Navigation methods
table.nextPage();
table.previousPage();
table.firstPage();
table.lastPage();
table.setPageSize(20);
```

### Row Selection

Single and multi-row selection with page-level and table-level operations:

```typescript
// Toggle single row
row.toggleSelected();

// Toggle all rows on current page
table.toggleAllPageRowsSelected();

// Toggle all rows in table
table.toggleAllRowsSelected();

// Check selection state
table.getIsAllRowsSelected();
table.getIsSomeRowsSelected();
```

### Column Visibility

Show/hide columns dynamically:

```typescript
// Toggle column visibility
column.toggleVisibility();

// Hide specific column
table.setColumnVisibility(prev => ({
  ...prev,
  email: false,
}));

// Toggle all columns
table.toggleAllColumnsVisible();
```

### Column Pinning

Pin columns to the left or right edges:

```typescript
// Pin column to left
column.pin('left');

// Pin column to right
column.pin('right');

// Unpin column
column.pin(false);

// Get pinned columns
table.getLeftVisibleLeafColumns();
table.getRightVisibleLeafColumns();
```

### Column Resizing

Configure column sizes with min/max constraints:

```typescript
const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    size: 200,
    minSize: 100,
    maxSize: 400,
    enableResizing: true,
  }),
];
```

### Full TypeScript Support

The library is written in TypeScript with comprehensive type definitions. Column helpers provide type-safe access to your data:

```typescript
interface Person {
  name: string;
  age: number;
  email: string;
}

const columnHelper = createColumnHelper<Person>();

// TypeScript knows 'name' is a valid key and its type is string
const nameColumn = columnHelper.accessor('name', {
  header: 'Name',
});
```

## Core Concepts

### Column Definitions (ColumnDef)

Column definitions describe how each column should behave. The `ColumnDef` interface includes:

```typescript
interface ColumnDef<TData, TValue = unknown> {
  // Identity
  id?: string;
  accessorKey?: keyof TData & string;
  accessorFn?: (row: TData) => TValue;

  // Display
  header?: string | ((context: HeaderContext<TData, TValue>) => any);
  footer?: string | ((context: HeaderContext<TData, TValue>) => any);
  cell?: (context: CellContext<TData, TValue>) => any;

  // Nested columns (for grouped headers)
  columns?: ColumnDef<TData, any>[];

  // Feature flags
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableHiding?: boolean;
  enableResizing?: boolean;
  enablePinning?: boolean;

  // Sorting configuration
  sortingFn?: SortingFn<TData>;
  sortDescFirst?: boolean;

  // Filtering configuration
  filterFn?: FilterFn<TData>;

  // Sizing
  size?: number;
  minSize?: number;
  maxSize?: number;

  // Custom metadata
  meta?: Record<string, any>;
}
```

### Row Models

Row models represent different views of your data at various stages of processing:

- **Core Row Model**: The base model created from your raw data
- **Sorted Row Model**: Rows after sorting has been applied
- **Filtered Row Model**: Rows after filtering has been applied
- **Paginated Row Model**: Rows for the current page only

The models form a pipeline:
```
Data -> Core -> Filtered -> Sorted -> Paginated
```

### Table State

The table maintains state for all features:

```typescript
interface TableState {
  sorting: SortingState[];
  pagination: PaginationState;
  columnFilters: ColumnFiltersState[];
  globalFilter: string;
  rowSelection: RowSelectionState;
  columnVisibility: ColumnVisibilityState;
  expanded: ExpandedState;
  columnOrder: string[];
  columnPinning: { left: string[]; right: string[] };
}
```

### Cells, Headers, and Header Groups

- **Cell**: Represents a single cell in the table body, providing access to its value and context
- **Header**: Represents a column header, with access to the column and header context
- **HeaderGroup**: A row of headers at a specific depth (for grouped headers)

```typescript
// Cells
interface Cell<TData, TValue> {
  id: string;
  row: Row<TData>;
  column: Column<TData, TValue>;
  getValue: () => TValue;
  renderValue: () => any;
  getContext: () => CellContext<TData, TValue>;
}

// Headers
interface Header<TData, TValue> {
  id: string;
  index: number;
  depth: number;
  column: Column<TData, TValue>;
  colSpan: number;
  rowSpan: number;
  isPlaceholder: boolean;
  getContext: () => HeaderContext<TData, TValue>;
  getLeafHeaders: () => Header<TData, unknown>[];
}

// Header Groups
interface HeaderGroup<TData> {
  id: string;
  depth: number;
  headers: Header<TData, unknown>[];
}
```

## Column Helper

The `createColumnHelper` function provides a type-safe way to define columns:

```typescript
import { createColumnHelper } from '@philjs/table';

interface Person {
  id: string;
  name: string;
  age: number;
  email: string;
  status: 'active' | 'inactive';
}

const columnHelper = createColumnHelper<Person>();
```

### accessor()

Create columns that access data from your row objects:

```typescript
const columns = [
  // Simple accessor using key
  columnHelper.accessor('name', {
    header: 'Full Name',
    enableSorting: true,
  }),

  // With custom cell rendering
  columnHelper.accessor('age', {
    header: 'Age',
    cell: info => `${info.getValue()} years old`,
  }),

  // With custom header
  columnHelper.accessor('email', {
    header: () => <span className="font-bold">Email Address</span>,
    footer: () => 'Contact information',
  }),
];
```

### display()

Create columns for custom content that does not access row data directly:

```typescript
const columns = [
  // Selection checkbox column
  columnHelper.display({
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllRowsSelected()}
        onChange={table.toggleAllRowsSelected}
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={() => row.toggleSelected()}
      />
    ),
  }),

  // Actions column
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div>
        <button onClick={() => edit(row.original)}>Edit</button>
        <button onClick={() => delete(row.original.id)}>Delete</button>
      </div>
    ),
  }),
];
```

### group()

Create grouped headers with nested columns:

```typescript
const columns = [
  columnHelper.accessor('name', { header: 'Name' }),

  columnHelper.group({
    id: 'contact',
    header: 'Contact Information',
    columns: [
      columnHelper.accessor('email', { header: 'Email' }),
      columnHelper.accessor('phone', { header: 'Phone' }),
    ],
  }),

  columnHelper.group({
    id: 'address',
    header: 'Address',
    columns: [
      columnHelper.accessor('city', { header: 'City' }),
      columnHelper.accessor('state', { header: 'State' }),
      columnHelper.accessor('zip', { header: 'ZIP' }),
    ],
  }),
];
```

## Row Models

Row models process your data at different stages. Import and configure the ones you need:

### getCoreRowModel()

The base row model that converts your data array into Row objects:

```typescript
import { createTable, getCoreRowModel } from '@philjs/table';

const table = createTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
});
```

### getSortedRowModel()

Sorts rows based on the current sorting state:

```typescript
import { createTable, getCoreRowModel, getSortedRowModel } from '@philjs/table';

const table = createTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  enableSorting: true,
  initialState: {
    sorting: [{ id: 'name', desc: false }],
  },
});
```

### getFilteredRowModel()

Filters rows based on column filters and global filter:

```typescript
import { createTable, getCoreRowModel, getFilteredRowModel } from '@philjs/table';

const table = createTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  enableFiltering: true,
});

// Apply filters
table.setGlobalFilter('search term');
table.setColumnFilters(prev => [...prev, { id: 'status', value: 'active' }]);
```

### getPaginatedRowModel()

Returns only the rows for the current page:

```typescript
import {
  createTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginatedRowModel
} from '@philjs/table';

const table = createTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginatedRowModel: getPaginatedRowModel(),
  enablePagination: true,
  initialState: {
    pagination: { pageIndex: 0, pageSize: 10 },
  },
});
```

## createTable() Configuration

The `createTable` function accepts a comprehensive options object:

### Basic Options

```typescript
interface TableOptions<TData> {
  // Required: Your data array
  data: TData[];

  // Required: Column definitions
  columns: ColumnDef<TData, any>[];

  // Required: Core row model factory
  getCoreRowModel: () => (table: Table<TData>) => RowModel<TData>;
}
```

### State Management

```typescript
const table = createTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),

  // Controlled state (overrides internal state)
  state: {
    sorting: sortingState,
    pagination: paginationState,
  },

  // Initial state (used on mount)
  initialState: {
    sorting: [{ id: 'name', desc: false }],
    pagination: { pageIndex: 0, pageSize: 20 },
    columnVisibility: { email: false },
  },

  // State change callbacks
  onStateChange: (updater) => setState(updater),
  onSortingChange: (updater) => setSorting(updater),
  onPaginationChange: (updater) => setPagination(updater),
  onColumnFiltersChange: (updater) => setFilters(updater),
  onGlobalFilterChange: (updater) => setGlobalFilter(updater),
  onRowSelectionChange: (updater) => setSelection(updater),
  onColumnVisibilityChange: (updater) => setVisibility(updater),
  onExpandedChange: (updater) => setExpanded(updater),
});
```

### Feature Flags

```typescript
const table = createTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),

  // Enable/disable features globally
  enableSorting: true,
  enableFiltering: true,
  enablePagination: true,
  enableRowSelection: true,
  enableColumnResizing: true,
  enableColumnPinning: true,
  enableExpanding: true,
});
```

### Row Configuration

```typescript
const table = createTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),

  // Custom row ID (default uses array index)
  getRowId: (row, index) => row.id,

  // For hierarchical data
  getSubRows: (row) => row.children,

  // Manual mode (server-side operations)
  manualSorting: true,
  manualFiltering: true,
  manualPagination: true,
  pageCount: 100, // Total pages for manual pagination

  // Auto-reset behavior
  autoResetPageIndex: true, // Reset to page 0 on filter/sort changes
});
```

### Debug Options

```typescript
const table = createTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),

  // Debug logging
  debugTable: true,
  debugHeaders: true,
  debugColumns: true,
  debugRows: true,
});
```

## Usage Examples

### Basic Table Setup

```typescript
import { createTable, createColumnHelper, getCoreRowModel } from '@philjs/table';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const data: User[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com', role: 'Admin' },
  { id: '2', name: 'Bob', email: 'bob@example.com', role: 'User' },
  { id: '3', name: 'Charlie', email: 'charlie@example.com', role: 'User' },
];

const columnHelper = createColumnHelper<User>();

const columns = [
  columnHelper.accessor('name', { header: 'Name' }),
  columnHelper.accessor('email', { header: 'Email' }),
  columnHelper.accessor('role', { header: 'Role' }),
];

const table = createTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
});

// Render the table
function renderTable() {
  return `
    <table>
      <thead>
        ${table.getHeaderGroups().map(headerGroup => `
          <tr>
            ${headerGroup.headers.map(header => `
              <th>${flexRender(header.column.columnDef.header, header.getContext())}</th>
            `).join('')}
          </tr>
        `).join('')}
      </thead>
      <tbody>
        ${table.getRowModel().rows.map(row => `
          <tr>
            ${row.getVisibleCells().map(cell => `
              <td>${flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
            `).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}
```

### Adding Sorting

```typescript
import {
  createTable,
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  flexRender
} from '@philjs/table';

const columnHelper = createColumnHelper<User>();

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    enableSorting: true,
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    enableSorting: true,
  }),
  columnHelper.accessor('role', {
    header: 'Role',
    enableSorting: true,
  }),
];

const table = createTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  enableSorting: true,
});

// Render sortable headers
function renderHeader(header) {
  const column = header.column;
  const canSort = column.getCanSort();
  const sorted = column.getIsSorted();

  return `
    <th
      onclick="${canSort ? () => column.toggleSorting() : undefined}"
      style="cursor: ${canSort ? 'pointer' : 'default'}"
    >
      ${flexRender(column.columnDef.header, header.getContext())}
      ${sorted === 'asc' ? ' (A-Z)' : sorted === 'desc' ? ' (Z-A)' : ''}
    </th>
  `;
}
```

### Filtering (Column and Global)

```typescript
import {
  createTable,
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  filterFns
} from '@philjs/table';

const columnHelper = createColumnHelper<User>();

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    enableFiltering: true,
    filterFn: filterFns.includesString,
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    enableFiltering: true,
  }),
  columnHelper.accessor('role', {
    header: 'Role',
    enableFiltering: true,
    filterFn: filterFns.equalsString,
  }),
];

const table = createTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  enableFiltering: true,
});

// Global search
function handleGlobalSearch(searchTerm: string) {
  table.setGlobalFilter(searchTerm);
}

// Column filter
function handleColumnFilter(columnId: string, value: string) {
  const column = table.getColumn(columnId);
  if (column) {
    column.setFilterValue(value);
  }
}

// Clear all filters
function clearFilters() {
  table.resetColumnFilters();
  table.resetGlobalFilter();
}
```

### Pagination

```typescript
import {
  createTable,
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginatedRowModel
} from '@philjs/table';

const table = createTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginatedRowModel: getPaginatedRowModel(),
  initialState: {
    pagination: {
      pageIndex: 0,
      pageSize: 10,
    },
  },
});

// Pagination controls
function renderPagination() {
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();

  return `
    <div class="pagination">
      <button
        onclick="${() => table.firstPage()}"
        disabled="${!table.getCanPreviousPage()}"
      >
        First
      </button>
      <button
        onclick="${() => table.previousPage()}"
        disabled="${!table.getCanPreviousPage()}"
      >
        Previous
      </button>
      <span>
        Page ${pageIndex + 1} of ${pageCount}
      </span>
      <button
        onclick="${() => table.nextPage()}"
        disabled="${!table.getCanNextPage()}"
      >
        Next
      </button>
      <button
        onclick="${() => table.lastPage()}"
        disabled="${!table.getCanNextPage()}"
      >
        Last
      </button>
      <select onchange="${(e) => table.setPageSize(Number(e.target.value))}">
        ${[10, 20, 50, 100].map(size => `
          <option value="${size}" ${size === pageSize ? 'selected' : ''}>
            Show ${size}
          </option>
        `).join('')}
      </select>
    </div>
  `;
}
```

### Row Selection

```typescript
import { createTable, createColumnHelper, getCoreRowModel } from '@philjs/table';

const columnHelper = createColumnHelper<User>();

const columns = [
  // Selection checkbox column
  columnHelper.display({
    id: 'select',
    header: ({ table }) => ({
      type: 'checkbox',
      checked: table.getIsAllRowsSelected(),
      indeterminate: table.getIsSomeRowsSelected(),
      onChange: () => table.toggleAllRowsSelected(),
    }),
    cell: ({ row }) => ({
      type: 'checkbox',
      checked: row.getIsSelected(),
      disabled: !row.getCanSelect(),
      onChange: () => row.toggleSelected(),
    }),
  }),
  columnHelper.accessor('name', { header: 'Name' }),
  columnHelper.accessor('email', { header: 'Email' }),
];

const table = createTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  enableRowSelection: true,
  getRowId: (row) => row.id,
});

// Get selected rows
function getSelectedUsers() {
  const selectedRowModel = table.getSelectedRowModel();
  return selectedRowModel.rows.map(row => row.original);
}

// Perform action on selected rows
function deleteSelected() {
  const selectedUsers = getSelectedUsers();
  // Delete logic here
  table.resetRowSelection();
}
```

### Custom Cell Rendering

```typescript
import { createTable, createColumnHelper, getCoreRowModel, flexRender } from '@philjs/table';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  image: string;
}

const columnHelper = createColumnHelper<Product>();

const columns = [
  // Image column
  columnHelper.accessor('image', {
    header: 'Image',
    cell: info => `<img src="${info.getValue()}" alt="Product" class="product-thumb" />`,
  }),

  // Name with link
  columnHelper.accessor('name', {
    header: 'Product Name',
    cell: info => `<a href="/products/${info.row.original.id}">${info.getValue()}</a>`,
  }),

  // Formatted price
  columnHelper.accessor('price', {
    header: 'Price',
    cell: info => {
      const value = info.getValue();
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);
    },
  }),

  // Stock with conditional styling
  columnHelper.accessor('stock', {
    header: 'Stock',
    cell: info => {
      const stock = info.getValue();
      const color = stock > 10 ? 'green' : stock > 0 ? 'orange' : 'red';
      return `<span style="color: ${color}">${stock} units</span>`;
    },
  }),

  // Status badge
  columnHelper.accessor('status', {
    header: 'Status',
    cell: info => {
      const status = info.getValue();
      const labels = {
        'in-stock': 'In Stock',
        'low-stock': 'Low Stock',
        'out-of-stock': 'Out of Stock',
      };
      const colors = {
        'in-stock': 'bg-green-100 text-green-800',
        'low-stock': 'bg-yellow-100 text-yellow-800',
        'out-of-stock': 'bg-red-100 text-red-800',
      };
      return `<span class="badge ${colors[status]}">${labels[status]}</span>`;
    },
  }),

  // Actions column
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => `
      <div class="action-buttons">
        <button onclick="editProduct('${row.original.id}')">Edit</button>
        <button onclick="deleteProduct('${row.original.id}')">Delete</button>
      </div>
    `,
  }),
];

const table = createTable({
  data: products,
  columns,
  getCoreRowModel: getCoreRowModel(),
});
```

## Sorting Functions

The library provides built-in sorting functions:

```typescript
import { sortingFns } from '@philjs/table';

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    sortingFn: sortingFns.text, // Case-sensitive text sorting
  }),

  columnHelper.accessor('version', {
    header: 'Version',
    sortingFn: sortingFns.alphanumeric, // Handles "v1", "v2", "v10" correctly
  }),

  columnHelper.accessor('createdAt', {
    header: 'Created',
    sortingFn: sortingFns.datetime, // Proper date/time comparison
  }),

  columnHelper.accessor('priority', {
    header: 'Priority',
    sortingFn: sortingFns.basic, // Simple greater/less than comparison
  }),
];
```

### Available Sorting Functions

| Function | Description |
|----------|-------------|
| `sortingFns.alphanumeric` | Handles mixed alphanumeric strings (e.g., "item1", "item10", "item2" sorts correctly) |
| `sortingFns.text` | Standard locale-aware text comparison |
| `sortingFns.datetime` | Compares dates (supports Date objects, ISO strings, and timestamps) |
| `sortingFns.basic` | Simple comparison using greater/less than operators |

### Custom Sorting Function

```typescript
const customSortFn: SortingFn<Product> = (rowA, rowB, columnId) => {
  const a = rowA.getValue<number>(columnId);
  const b = rowB.getValue<number>(columnId);

  // Custom logic here
  return a - b;
};

const columns = [
  columnHelper.accessor('priority', {
    header: 'Priority',
    sortingFn: customSortFn,
  }),
];
```

## Filter Functions

Built-in filter functions for common use cases:

```typescript
import { filterFns } from '@philjs/table';

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    filterFn: filterFns.includesString, // Substring match (case-insensitive)
  }),

  columnHelper.accessor('status', {
    header: 'Status',
    filterFn: filterFns.equalsString, // Exact match (case-insensitive)
  }),

  columnHelper.accessor('category', {
    header: 'Category',
    filterFn: filterFns.arrIncludes, // Value is in array of allowed values
  }),

  columnHelper.accessor('price', {
    header: 'Price',
    filterFn: filterFns.inNumberRange, // Value is within [min, max] range
  }),
];
```

### Available Filter Functions

| Function | Filter Value Type | Description |
|----------|------------------|-------------|
| `filterFns.includesString` | `string` | Case-insensitive substring match |
| `filterFns.equalsString` | `string` | Case-insensitive exact match |
| `filterFns.arrIncludes` | `unknown[]` | Value exists in the filter array |
| `filterFns.inNumberRange` | `[number, number]` | Value is between min and max (inclusive) |

### Custom Filter Function

```typescript
const fuzzyFilter: FilterFn<Product> = (row, columnId, filterValue) => {
  const cellValue = String(row.getValue(columnId) ?? '').toLowerCase();
  const searchValue = String(filterValue).toLowerCase();

  // Simple fuzzy matching
  let searchIndex = 0;
  for (const char of cellValue) {
    if (char === searchValue[searchIndex]) {
      searchIndex++;
    }
    if (searchIndex === searchValue.length) {
      return true;
    }
  }
  return false;
};

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    filterFn: fuzzyFilter,
  }),
];
```

## flexRender() Utility

The `flexRender` function handles rendering of both string values and function components:

```typescript
import { flexRender } from '@philjs/table';

// Usage with headers
table.getHeaderGroups().forEach(headerGroup => {
  headerGroup.headers.forEach(header => {
    const content = flexRender(
      header.column.columnDef.header,
      header.getContext()
    );
    // content is now the rendered header (string or component result)
  });
});

// Usage with cells
row.getVisibleCells().forEach(cell => {
  const content = flexRender(
    cell.column.columnDef.cell ?? cell.getValue,
    cell.getContext()
  );
  // content is now the rendered cell value
});
```

The function handles three cases:

1. **undefined/null**: Returns `null`
2. **string**: Returns the string as-is
3. **function**: Calls the function with the provided props and returns the result

```typescript
// These all work with flexRender
const column1 = columnHelper.accessor('name', {
  header: 'Name', // string - rendered as-is
});

const column2 = columnHelper.accessor('name', {
  header: (context) => `Name (${context.column.id})`, // function - called with context
});

const column3 = columnHelper.accessor('price', {
  cell: (info) => `$${info.getValue().toFixed(2)}`, // function for cell rendering
});
```

## Complete Example

Here is a complete example combining multiple features:

```typescript
import {
  createTable,
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginatedRowModel,
  flexRender,
  sortingFns,
  filterFns,
  type SortingState,
  type PaginationState,
  type ColumnFiltersState,
} from '@philjs/table';

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  salary: number;
  startDate: string;
  status: 'active' | 'inactive';
}

const employees: Employee[] = [
  // ... your data
];

const columnHelper = createColumnHelper<Employee>();

const columns = [
  // Selection column
  columnHelper.display({
    id: 'select',
    header: ({ table }) => ({
      type: 'checkbox',
      checked: table.getIsAllPageRowsSelected(),
      indeterminate: table.getIsSomePageRowsSelected(),
      onChange: () => table.toggleAllPageRowsSelected(),
    }),
    cell: ({ row }) => ({
      type: 'checkbox',
      checked: row.getIsSelected(),
      onChange: () => row.toggleSelected(),
    }),
  }),

  // Data columns
  columnHelper.accessor('name', {
    header: 'Name',
    enableSorting: true,
    sortingFn: sortingFns.text,
    enableFiltering: true,
    filterFn: filterFns.includesString,
  }),

  columnHelper.accessor('email', {
    header: 'Email',
    enableSorting: true,
    enableFiltering: true,
  }),

  columnHelper.accessor('department', {
    header: 'Department',
    enableSorting: true,
    enableFiltering: true,
    filterFn: filterFns.equalsString,
  }),

  columnHelper.accessor('salary', {
    header: 'Salary',
    cell: info => new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(info.getValue()),
    enableSorting: true,
    sortingFn: sortingFns.basic,
    enableFiltering: true,
    filterFn: filterFns.inNumberRange,
  }),

  columnHelper.accessor('startDate', {
    header: 'Start Date',
    cell: info => new Date(info.getValue()).toLocaleDateString(),
    enableSorting: true,
    sortingFn: sortingFns.datetime,
  }),

  columnHelper.accessor('status', {
    header: 'Status',
    cell: info => {
      const status = info.getValue();
      return `<span class="badge ${status === 'active' ? 'badge-success' : 'badge-muted'}">${status}</span>`;
    },
    enableFiltering: true,
    filterFn: filterFns.equalsString,
  }),

  // Actions column
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => `
      <button onclick="viewEmployee('${row.original.id}')">View</button>
      <button onclick="editEmployee('${row.original.id}')">Edit</button>
    `,
  }),
];

// Create table with all features
const table = createTable({
  data: employees,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginatedRowModel: getPaginatedRowModel(),

  enableSorting: true,
  enableFiltering: true,
  enableRowSelection: true,

  getRowId: (row) => row.id,

  initialState: {
    sorting: [{ id: 'name', desc: false }],
    pagination: { pageIndex: 0, pageSize: 10 },
    columnVisibility: {},
  },

  // Optional: State change handlers for controlled mode
  onSortingChange: (updater) => {
    // Update external state if needed
  },
  onPaginationChange: (updater) => {
    // Update external state if needed
  },
});

// Render function
function renderEmployeeTable() {
  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;
  const { pageIndex, pageSize } = table.getState().pagination;

  return `
    <div class="table-container">
      <!-- Global Search -->
      <input
        type="text"
        placeholder="Search all columns..."
        oninput="table.setGlobalFilter(this.value)"
      />

      <!-- Table -->
      <table>
        <thead>
          ${headerGroups.map(headerGroup => `
            <tr>
              ${headerGroup.headers.map(header => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return `
                  <th
                    onclick="${canSort ? `table.getColumn('${header.column.id}').toggleSorting()` : ''}"
                    class="${canSort ? 'sortable' : ''} ${sorted ? `sorted-${sorted}` : ''}"
                  >
                    ${flexRender(header.column.columnDef.header, header.getContext())}
                    ${sorted === 'asc' ? ' ^' : sorted === 'desc' ? ' v' : ''}
                  </th>
                `;
              }).join('')}
            </tr>
          `).join('')}
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr class="${row.getIsSelected() ? 'selected' : ''}">
              ${row.getVisibleCells().map(cell => `
                <td>${flexRender(cell.column.columnDef.cell, cell.getContext()) ?? cell.getValue()}</td>
              `).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="pagination">
        <button onclick="table.firstPage()" disabled="${!table.getCanPreviousPage()}">First</button>
        <button onclick="table.previousPage()" disabled="${!table.getCanPreviousPage()}">Prev</button>
        <span>Page ${pageIndex + 1} of ${table.getPageCount()}</span>
        <button onclick="table.nextPage()" disabled="${!table.getCanNextPage()}">Next</button>
        <button onclick="table.lastPage()" disabled="${!table.getCanNextPage()}">Last</button>
        <select onchange="table.setPageSize(Number(this.value))">
          ${[10, 20, 50].map(size => `
            <option value="${size}" ${size === pageSize ? 'selected' : ''}>${size} per page</option>
          `).join('')}
        </select>
      </div>

      <!-- Selection info -->
      <div class="selection-info">
        ${table.getSelectedRowModel().rows.length} of ${table.getCoreRowModel().rows.length} row(s) selected
      </div>
    </div>
  `;
}
```

## API Reference

### Table Instance Methods

#### State Management
- `getState()` - Get current table state
- `setState(updater)` - Update table state
- `resetState(defaultState?)` - Reset to default state

#### Column Methods
- `getAllColumns()` - Get all columns
- `getAllFlatColumns()` - Get all columns flattened
- `getAllLeafColumns()` - Get leaf columns only
- `getColumn(id)` - Get column by ID
- `getVisibleLeafColumns()` - Get visible leaf columns
- `getLeftVisibleLeafColumns()` - Get left-pinned visible columns
- `getRightVisibleLeafColumns()` - Get right-pinned visible columns
- `getCenterVisibleLeafColumns()` - Get center (unpinned) visible columns

#### Header Methods
- `getHeaderGroups()` - Get all header groups
- `getLeftHeaderGroups()` - Get left-pinned header groups
- `getCenterHeaderGroups()` - Get center header groups
- `getRightHeaderGroups()` - Get right-pinned header groups
- `getFooterGroups()` - Get footer groups
- `getFlatHeaders()` - Get all headers flattened
- `getLeafHeaders()` - Get leaf headers only

#### Row Model Methods
- `getCoreRowModel()` - Get core row model
- `getRowModel()` - Get final row model (after all processing)
- `getSortedRowModel()` - Get sorted row model
- `getFilteredRowModel()` - Get filtered row model
- `getPaginatedRowModel()` - Get paginated row model
- `getRow(id)` - Get row by ID

#### Sorting Methods
- `setSorting(updater)` - Update sorting state
- `resetSorting()` - Clear all sorting

#### Filtering Methods
- `setColumnFilters(updater)` - Update column filters
- `resetColumnFilters()` - Clear all column filters
- `setGlobalFilter(value)` - Set global filter
- `resetGlobalFilter()` - Clear global filter

#### Pagination Methods
- `setPagination(updater)` - Update pagination state
- `resetPagination()` - Reset to first page
- `setPageIndex(index)` - Go to specific page
- `setPageSize(size)` - Change page size
- `getPageCount()` - Get total page count
- `getCanPreviousPage()` - Check if can go to previous page
- `getCanNextPage()` - Check if can go to next page
- `previousPage()` - Go to previous page
- `nextPage()` - Go to next page
- `firstPage()` - Go to first page
- `lastPage()` - Go to last page

#### Selection Methods
- `setRowSelection(updater)` - Update row selection
- `resetRowSelection()` - Clear all selections
- `getSelectedRowModel()` - Get selected rows
- `getIsAllRowsSelected()` - Check if all rows selected
- `getIsSomeRowsSelected()` - Check if some rows selected
- `toggleAllRowsSelected(selected?)` - Toggle all rows
- `getIsAllPageRowsSelected()` - Check if all page rows selected
- `getIsSomePageRowsSelected()` - Check if some page rows selected
- `toggleAllPageRowsSelected(selected?)` - Toggle all page rows

#### Visibility Methods
- `setColumnVisibility(updater)` - Update column visibility
- `resetColumnVisibility()` - Show all columns
- `toggleAllColumnsVisible(visible?)` - Toggle all columns
- `getIsAllColumnsVisible()` - Check if all columns visible
- `getIsSomeColumnsVisible()` - Check if some columns visible

#### Expanding Methods
- `setExpanded(updater)` - Update expanded state
- `resetExpanded()` - Collapse all rows
- `toggleAllRowsExpanded(expanded?)` - Toggle all expandable rows
- `getIsAllRowsExpanded()` - Check if all rows expanded
- `getIsSomeRowsExpanded()` - Check if some rows expanded
- `getExpandedDepth()` - Get maximum expanded depth
