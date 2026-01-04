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
export type SortDirection = 'asc' | 'desc' | false;
export interface SortingState {
    id: string;
    desc: boolean;
}
export interface PaginationState {
    pageIndex: number;
    pageSize: number;
}
export interface ColumnFiltersState {
    id: string;
    value: unknown;
}
export interface RowSelectionState {
    [key: string]: boolean;
}
export interface ColumnVisibilityState {
    [key: string]: boolean;
}
export interface ExpandedState {
    [key: string]: boolean;
}
export interface TableState {
    sorting: SortingState[];
    pagination: PaginationState;
    columnFilters: ColumnFiltersState[];
    globalFilter: string;
    rowSelection: RowSelectionState;
    columnVisibility: ColumnVisibilityState;
    expanded: ExpandedState;
    columnOrder: string[];
    columnPinning: {
        left: string[];
        right: string[];
    };
}
export interface ColumnDef<TData, TValue = unknown> {
    id?: string;
    accessorKey?: keyof TData & string;
    accessorFn?: (row: TData) => TValue;
    header?: string | ((context: HeaderContext<TData, TValue>) => any);
    footer?: string | ((context: HeaderContext<TData, TValue>) => any);
    cell?: (context: CellContext<TData, TValue>) => any;
    columns?: ColumnDef<TData, any>[];
    enableSorting?: boolean;
    enableFiltering?: boolean;
    enableHiding?: boolean;
    enableResizing?: boolean;
    enablePinning?: boolean;
    sortingFn?: SortingFn<TData>;
    sortDescFirst?: boolean;
    filterFn?: FilterFn<TData>;
    size?: number;
    minSize?: number;
    maxSize?: number;
    meta?: Record<string, any>;
}
export interface Column<TData, TValue = unknown> {
    id: string;
    columnDef: ColumnDef<TData, TValue>;
    depth: number;
    parent?: Column<TData, any>;
    columns: Column<TData, any>[];
    getIsVisible: () => boolean;
    getCanSort: () => boolean;
    getIsSorted: () => SortDirection;
    toggleSorting: (desc?: boolean) => void;
    clearSorting: () => void;
    getCanFilter: () => boolean;
    getFilterValue: () => unknown;
    setFilterValue: (value: unknown) => void;
    getCanHide: () => boolean;
    toggleVisibility: (visible?: boolean) => void;
    getCanPin: () => boolean;
    pin: (position: 'left' | 'right' | false) => void;
    getIsPinned: () => 'left' | 'right' | false;
    getSize: () => number;
    getStart: (position?: 'left' | 'center' | 'right') => number;
}
export interface Row<TData> {
    id: string;
    index: number;
    original: TData;
    depth: number;
    parentId?: string;
    subRows: Row<TData>[];
    getValue: <TValue>(columnId: string) => TValue;
    getVisibleCells: () => Cell<TData, unknown>[];
    getAllCells: () => Cell<TData, unknown>[];
    getIsSelected: () => boolean;
    toggleSelected: (selected?: boolean) => void;
    getCanSelect: () => boolean;
    getIsExpanded: () => boolean;
    toggleExpanded: (expanded?: boolean) => void;
    getCanExpand: () => boolean;
    getLeafRows: () => Row<TData>[];
}
export interface Cell<TData, TValue> {
    id: string;
    row: Row<TData>;
    column: Column<TData, TValue>;
    getValue: () => TValue;
    renderValue: () => any;
    getContext: () => CellContext<TData, TValue>;
}
export interface HeaderGroup<TData> {
    id: string;
    depth: number;
    headers: Header<TData, unknown>[];
}
export interface Header<TData, TValue> {
    id: string;
    index: number;
    depth: number;
    column: Column<TData, TValue>;
    colSpan: number;
    rowSpan: number;
    isPlaceholder: boolean;
    placeholderId?: string;
    getContext: () => HeaderContext<TData, TValue>;
    getLeafHeaders: () => Header<TData, unknown>[];
}
export interface HeaderContext<TData, TValue> {
    table: Table<TData>;
    header: Header<TData, TValue>;
    column: Column<TData, TValue>;
}
export interface CellContext<TData, TValue> {
    table: Table<TData>;
    row: Row<TData>;
    column: Column<TData, TValue>;
    cell: Cell<TData, TValue>;
    getValue: () => TValue;
    renderValue: () => any;
}
export type SortingFn<TData> = (rowA: Row<TData>, rowB: Row<TData>, columnId: string) => number;
export type FilterFn<TData> = (row: Row<TData>, columnId: string, filterValue: unknown) => boolean;
export interface RowModel<TData> {
    rows: Row<TData>[];
    flatRows: Row<TData>[];
    rowsById: {
        [key: string]: Row<TData>;
    };
}
export interface TableOptions<TData> {
    data: TData[];
    columns: ColumnDef<TData, any>[];
    state?: Partial<TableState>;
    initialState?: Partial<TableState>;
    onStateChange?: (updater: (state: TableState) => TableState) => void;
    onSortingChange?: (updater: (sorting: SortingState[]) => SortingState[]) => void;
    onPaginationChange?: (updater: (pagination: PaginationState) => PaginationState) => void;
    onColumnFiltersChange?: (updater: (filters: ColumnFiltersState[]) => ColumnFiltersState[]) => void;
    onGlobalFilterChange?: (updater: (filter: string) => string) => void;
    onRowSelectionChange?: (updater: (selection: RowSelectionState) => RowSelectionState) => void;
    onColumnVisibilityChange?: (updater: (visibility: ColumnVisibilityState) => ColumnVisibilityState) => void;
    onExpandedChange?: (updater: (expanded: ExpandedState) => ExpandedState) => void;
    getCoreRowModel: () => (table: Table<TData>) => RowModel<TData>;
    getSortedRowModel?: () => (table: Table<TData>) => RowModel<TData>;
    getFilteredRowModel?: () => (table: Table<TData>) => RowModel<TData>;
    getPaginatedRowModel?: () => (table: Table<TData>) => RowModel<TData>;
    getExpandedRowModel?: () => (table: Table<TData>) => RowModel<TData>;
    getGroupedRowModel?: () => (table: Table<TData>) => RowModel<TData>;
    enableSorting?: boolean;
    enableFiltering?: boolean;
    enablePagination?: boolean;
    enableRowSelection?: boolean;
    enableColumnResizing?: boolean;
    enableColumnPinning?: boolean;
    enableExpanding?: boolean;
    getRowId?: (row: TData, index: number) => string;
    getSubRows?: (row: TData) => TData[] | undefined;
    manualSorting?: boolean;
    manualFiltering?: boolean;
    manualPagination?: boolean;
    pageCount?: number;
    autoResetPageIndex?: boolean;
    debugTable?: boolean;
    debugHeaders?: boolean;
    debugColumns?: boolean;
    debugRows?: boolean;
}
export interface Table<TData> {
    getState: () => TableState;
    setState: (updater: (state: TableState) => TableState) => void;
    resetState: (defaultState?: Partial<TableState>) => void;
    getAllColumns: () => Column<TData, any>[];
    getAllFlatColumns: () => Column<TData, any>[];
    getAllLeafColumns: () => Column<TData, any>[];
    getColumn: (id: string) => Column<TData, any> | undefined;
    getVisibleLeafColumns: () => Column<TData, any>[];
    getLeftVisibleLeafColumns: () => Column<TData, any>[];
    getRightVisibleLeafColumns: () => Column<TData, any>[];
    getCenterVisibleLeafColumns: () => Column<TData, any>[];
    getHeaderGroups: () => HeaderGroup<TData>[];
    getLeftHeaderGroups: () => HeaderGroup<TData>[];
    getCenterHeaderGroups: () => HeaderGroup<TData>[];
    getRightHeaderGroups: () => HeaderGroup<TData>[];
    getFooterGroups: () => HeaderGroup<TData>[];
    getFlatHeaders: () => Header<TData, unknown>[];
    getLeafHeaders: () => Header<TData, unknown>[];
    getCoreRowModel: () => RowModel<TData>;
    getRowModel: () => RowModel<TData>;
    getSortedRowModel: () => RowModel<TData>;
    getFilteredRowModel: () => RowModel<TData>;
    getPaginatedRowModel: () => RowModel<TData>;
    getExpandedRowModel: () => RowModel<TData>;
    getPreFilteredRowModel: () => RowModel<TData>;
    getPrePaginatedRowModel: () => RowModel<TData>;
    getRow: (id: string) => Row<TData>;
    setSorting: (updater: (sorting: SortingState[]) => SortingState[]) => void;
    resetSorting: () => void;
    getPreSortedRowModel: () => RowModel<TData>;
    setColumnFilters: (updater: (filters: ColumnFiltersState[]) => ColumnFiltersState[]) => void;
    resetColumnFilters: () => void;
    setGlobalFilter: (filter: string) => void;
    resetGlobalFilter: () => void;
    setPagination: (updater: (pagination: PaginationState) => PaginationState) => void;
    resetPagination: () => void;
    setPageIndex: (index: number) => void;
    setPageSize: (size: number) => void;
    getPageCount: () => number;
    getCanPreviousPage: () => boolean;
    getCanNextPage: () => boolean;
    previousPage: () => void;
    nextPage: () => void;
    firstPage: () => void;
    lastPage: () => void;
    setRowSelection: (updater: (selection: RowSelectionState) => RowSelectionState) => void;
    resetRowSelection: () => void;
    getSelectedRowModel: () => RowModel<TData>;
    getFilteredSelectedRowModel: () => RowModel<TData>;
    getGroupedSelectedRowModel: () => RowModel<TData>;
    getIsAllRowsSelected: () => boolean;
    getIsSomeRowsSelected: () => boolean;
    toggleAllRowsSelected: (selected?: boolean) => void;
    getIsAllPageRowsSelected: () => boolean;
    getIsSomePageRowsSelected: () => boolean;
    toggleAllPageRowsSelected: (selected?: boolean) => void;
    setColumnVisibility: (updater: (visibility: ColumnVisibilityState) => ColumnVisibilityState) => void;
    resetColumnVisibility: () => void;
    toggleAllColumnsVisible: (visible?: boolean) => void;
    getIsAllColumnsVisible: () => boolean;
    getIsSomeColumnsVisible: () => boolean;
    setExpanded: (updater: (expanded: ExpandedState) => ExpandedState) => void;
    resetExpanded: () => void;
    toggleAllRowsExpanded: (expanded?: boolean) => void;
    getIsAllRowsExpanded: () => boolean;
    getIsSomeRowsExpanded: () => boolean;
    getExpandedDepth: () => number;
    options: TableOptions<TData>;
}
export interface ColumnHelper<TData> {
    accessor: <TValue>(accessorKey: keyof TData & string, columnDef?: Omit<ColumnDef<TData, TValue>, 'accessorKey'>) => ColumnDef<TData, TValue>;
    display: (columnDef: Omit<ColumnDef<TData, unknown>, 'accessorKey' | 'accessorFn'>) => ColumnDef<TData, unknown>;
    group: (columnDef: Omit<ColumnDef<TData, unknown>, 'accessorKey' | 'accessorFn'> & {
        columns: ColumnDef<TData, any>[];
    }) => ColumnDef<TData, unknown>;
}
/**
 * Create a column helper for type-safe column definitions
 */
export declare function createColumnHelper<TData>(): ColumnHelper<TData>;
/**
 * Create the core row model factory
 */
export declare function getCoreRowModel<TData>(): (table: Table<TData>) => RowModel<TData>;
/**
 * Create the sorted row model factory
 */
export declare function getSortedRowModel<TData>(): (table: Table<TData>) => RowModel<TData>;
/**
 * Create the filtered row model factory
 */
export declare function getFilteredRowModel<TData>(): (table: Table<TData>) => RowModel<TData>;
/**
 * Create the paginated row model factory
 */
export declare function getPaginatedRowModel<TData>(): (table: Table<TData>) => RowModel<TData>;
/**
 * Create a table instance
 */
export declare function createTable<TData>(options: TableOptions<TData>): Table<TData>;
export declare const sortingFns: {
    alphanumeric: <TData>(rowA: Row<TData>, rowB: Row<TData>, columnId: string) => number;
    text: <TData>(rowA: Row<TData>, rowB: Row<TData>, columnId: string) => number;
    datetime: <TData>(rowA: Row<TData>, rowB: Row<TData>, columnId: string) => number;
    basic: <TData>(rowA: Row<TData>, rowB: Row<TData>, columnId: string) => number;
};
export declare const filterFns: {
    includesString: <TData>(row: Row<TData>, columnId: string, filterValue: string) => boolean;
    equalsString: <TData>(row: Row<TData>, columnId: string, filterValue: string) => boolean;
    arrIncludes: <TData>(row: Row<TData>, columnId: string, filterValue: unknown[]) => boolean;
    inNumberRange: <TData>(row: Row<TData>, columnId: string, filterValue: [number, number]) => boolean;
};
/**
 * Flex render utility for rendering header/cell content
 */
export declare function flexRender<TProps>(component: string | ((props: TProps) => any) | undefined, props: TProps): any;
//# sourceMappingURL=index.d.ts.map