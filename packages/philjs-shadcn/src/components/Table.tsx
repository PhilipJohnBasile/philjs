/**
 * Table component - shadcn/ui style for PhilJS
 */

import { cn } from '../utils.js';

// Types
export interface TableProps {
    className?: string;
    children?: any;
}

export interface TableHeaderProps {
    className?: string;
    children?: any;
}

export interface TableBodyProps {
    className?: string;
    children?: any;
}

export interface TableFooterProps {
    className?: string;
    children?: any;
}

export interface TableRowProps {
    className?: string;
    children?: any;
}

export interface TableHeadProps {
    className?: string;
    children?: any;
}

export interface TableCellProps {
    className?: string;
    colSpan?: number;
    rowSpan?: number;
    children?: any;
}

export interface TableCaptionProps {
    className?: string;
    children?: any;
}

/**
 * Table root element
 */
export function Table(props: TableProps) {
    const { className, children } = props;

    return (
        <div class="relative w-full overflow-auto">
            <table
                class={cn('w-full caption-bottom text-sm', className)}
            >
                {children}
            </table>
        </div>
    );
}

/**
 * Table header section
 */
export function TableHeader(props: TableHeaderProps) {
    const { className, children } = props;

    return (
        <thead class={cn('[&_tr]:border-b', className)}>
            {children}
        </thead>
    );
}

/**
 * Table body section
 */
export function TableBody(props: TableBodyProps) {
    const { className, children } = props;

    return (
        <tbody class={cn('[&_tr:last-child]:border-0', className)}>
            {children}
        </tbody>
    );
}

/**
 * Table footer section
 */
export function TableFooter(props: TableFooterProps) {
    const { className, children } = props;

    return (
        <tfoot
            class={cn(
                'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
                className
            )}
        >
            {children}
        </tfoot>
    );
}

/**
 * Table row
 */
export function TableRow(props: TableRowProps) {
    const { className, children } = props;

    return (
        <tr
            class={cn(
                'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
                className
            )}
        >
            {children}
        </tr>
    );
}

/**
 * Table header cell
 */
export function TableHead(props: TableHeadProps) {
    const { className, children } = props;

    return (
        <th
            class={cn(
                'h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
                className
            )}
        >
            {children}
        </th>
    );
}

/**
 * Table data cell
 */
export function TableCell(props: TableCellProps) {
    const { className, colSpan, rowSpan, children } = props;

    return (
        <td
            colSpan={colSpan}
            rowSpan={rowSpan}
            class={cn(
                'p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
                className
            )}
        >
            {children}
        </td>
    );
}

/**
 * Table caption
 */
export function TableCaption(props: TableCaptionProps) {
    const { className, children } = props;

    return (
        <caption class={cn('mt-4 text-sm text-muted-foreground', className)}>
            {children}
        </caption>
    );
}

// Utility types for data tables
export interface DataTableColumn<T> {
    key: keyof T | string;
    header: string;
    cell?: (item: T) => any;
    className?: string;
    sortable?: boolean;
}

export interface DataTableProps<T> {
    data: T[];
    columns: DataTableColumn<T>[];
    className?: string;
    emptyMessage?: string;
    onRowClick?: (item: T) => void;
    selectedRows?: T[];
    onSelectionChange?: (items: T[]) => void;
}

/**
 * Data table - convenience component for rendering data
 */
export function DataTable<T extends Record<string, any>>(props: DataTableProps<T>) {
    const {
        data,
        columns,
        className,
        emptyMessage = 'No data available',
        onRowClick,
    } = props;

    return (
        <Table className={className}>
            <TableHeader>
                <TableRow>
                    {columns.map((col, i) => (
                        <TableHead key={i} className={col.className}>
                            {col.header}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.length === 0 ? (
                    <TableRow>
                        <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center"
                        >
                            {emptyMessage}
                        </TableCell>
                    </TableRow>
                ) : (
                    data.map((item, rowIndex) => (
                        <TableRow
                            key={rowIndex}
                            className={onRowClick ? 'cursor-pointer' : undefined}
                            onClick={() => onRowClick?.(item)}
                        >
                            {columns.map((col, colIndex) => (
                                <TableCell key={colIndex} className={col.className}>
                                    {col.cell
                                        ? col.cell(item)
                                        : item[col.key as keyof T]}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}
