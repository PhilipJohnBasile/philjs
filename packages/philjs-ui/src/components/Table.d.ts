/**
 * PhilJS UI - Table Component
 */
import { JSX } from 'philjs-core';
export type TableVariant = 'simple' | 'striped' | 'unstyled';
export type TableSize = 'sm' | 'md' | 'lg';
export interface TableProps {
    children: JSX.Element;
    variant?: TableVariant;
    size?: TableSize;
    hoverable?: boolean;
    className?: string;
}
export declare function Table(props: TableProps): import("philjs-core").JSXElement;
/**
 * Table Head
 */
export declare function Thead(props: {
    children: JSX.Element;
    className?: string;
}): import("philjs-core").JSXElement;
/**
 * Table Body
 */
export declare function Tbody(props: {
    children: JSX.Element | JSX.Element[];
    className?: string;
}): import("philjs-core").JSXElement;
/**
 * Table Foot
 */
export declare function Tfoot(props: {
    children: JSX.Element;
    className?: string;
}): import("philjs-core").JSXElement;
/**
 * Table Row
 */
export interface TrProps {
    children: JSX.Element | JSX.Element[];
    selected?: boolean;
    onClick?: () => void;
    className?: string;
}
export declare function Tr(props: TrProps): import("philjs-core").JSXElement;
/**
 * Table Header Cell
 */
export interface ThProps {
    children?: JSX.Element;
    sortable?: boolean;
    sortDirection?: 'asc' | 'desc' | null;
    onSort?: () => void;
    align?: 'left' | 'center' | 'right';
    width?: string | number;
    className?: string;
}
export declare function Th(props: ThProps): import("philjs-core").JSXElement;
/**
 * Table Data Cell
 */
export interface TdProps {
    children?: JSX.Element;
    align?: 'left' | 'center' | 'right';
    colSpan?: number;
    rowSpan?: number;
    className?: string;
}
export declare function Td(props: TdProps): import("philjs-core").JSXElement;
/**
 * Table Caption
 */
export declare function TableCaption(props: {
    children: JSX.Element;
    placement?: 'top' | 'bottom';
    className?: string;
}): import("philjs-core").JSXElement;
/**
 * Empty State for Table
 */
export declare function TableEmpty(props: {
    colSpan: number;
    message?: string;
    icon?: JSX.Element;
}): import("philjs-core").JSXElement;
//# sourceMappingURL=Table.d.ts.map