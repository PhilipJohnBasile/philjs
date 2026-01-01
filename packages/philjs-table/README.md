# @philjs/table

Headless, type-safe table component for PhilJS - TanStack Table inspired

<!-- PACKAGE_GUIDE_START -->
## Overview

Headless, type-safe table component for PhilJS - TanStack Table inspired

## Focus Areas

- table, datagrid, headless, sorting, filtering, pagination, philjs

## Entry Points

- packages/philjs-table/src/index.ts

## Quick Start

```ts
import { Cell, CellContext, Column } from '@philjs/table';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- Cell
- CellContext
- Column
- ColumnDef
- ColumnFiltersState
- ColumnHelper
- ColumnVisibilityState
- ExpandedState
- FilterFn
- Header
- HeaderContext
- HeaderGroup
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/table
```
## Usage

```ts
import { Cell, CellContext, Column } from '@philjs/table';
```

## Scripts

- pnpm run build
- pnpm run test

## Compatibility

- Node >=24
- TypeScript 6

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: .
- Source files: packages/philjs-table/src/index.ts

### Public API
- Direct exports: Cell, CellContext, Column, ColumnDef, ColumnFiltersState, ColumnHelper, ColumnVisibilityState, ExpandedState, FilterFn, Header, HeaderContext, HeaderGroup, PaginationState, Row, RowModel, RowSelectionState, SortDirection, SortingFn, SortingState, Table, TableOptions, TableState, createColumnHelper, createTable, filterFns, flexRender, getCoreRowModel, getFilteredRowModel, getPaginatedRowModel, getSortedRowModel, sortingFns
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT
