/**
 * PhilJS UI - Table Component
 */
import type { JSX } from '@philjs/core/jsx-runtime';

export type TableVariant = 'simple' | 'striped' | 'unstyled';
export type TableSize = 'sm' | 'md' | 'lg';

export interface TableProps {
  children: JSX.Element | JSX.Element[] | string;
  variant?: TableVariant;
  size?: TableSize;
  hoverable?: boolean;
  className?: string;
}

const sizeStyles: Record<TableSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function Table(props: TableProps): JSX.Element {
  const {
    children,
    variant = 'simple',
    size = 'md',
    hoverable = false,
    className = '',
  } = props;

  const variantClasses: Record<TableVariant, string> = {
    simple: 'divide-y divide-gray-200',
    striped: '[&_tbody_tr:nth-child(odd)]:bg-gray-50',
    unstyled: '',
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table
        className={`
          min-w-full
          ${sizeStyles[size]}
          ${variantClasses[variant]}
          ${hoverable ? '[&_tbody_tr:hover]:bg-gray-50' : ''}
        `}
      >
        {children}
      </table>
    </div>
  );
}

/**
 * Table Head
 */
export function Thead(props: { children: JSX.Element | JSX.Element[] | string; className?: string; }): JSX.Element {
  return (
    <thead className={`bg-gray-50 ${props.className || ''}`}>
      {props.children}
    </thead>
  );
}

/**
 * Table Body
 */
export function Tbody(props: { children: JSX.Element | JSX.Element[] | string; className?: string; }): JSX.Element {
  return (
    <tbody className={`divide-y divide-gray-200 bg-white ${props.className || ''}`}>
      {props.children}
    </tbody>
  );
}

/**
 * Table Foot
 */
export function Tfoot(props: { children: JSX.Element | JSX.Element[] | string; className?: string; }): JSX.Element {
  return (
    <tfoot className={`bg-gray-50 ${props.className || ''}`}>
      {props.children}
    </tfoot>
  );
}

export interface TrProps {
  children: JSX.Element | JSX.Element[] | string;
  selected?: boolean;
  onClick?: (e: MouseEvent) => void;
  className?: string;
}

export function Tr(props: TrProps): JSX.Element {
  const { children, selected = false, onClick, className = '' } = props;

  return (
    <tr
      onClick={onClick}
      className={`
        ${selected ? 'bg-blue-50' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </tr>
  );
}

export interface ThProps {
  children?: JSX.Element | JSX.Element[] | string;
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  className?: string;
}

export function Th(props: ThProps): JSX.Element {
  const {
    children,
    sortable = false,
    sortDirection = null,
    onSort,
    align = 'left',
    width,
    className = '',
  } = props;

  const alignClasses: Record<'left' | 'center' | 'right', string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const style: Record<string, string> = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;

  return (
    <th
      scope="col"
      onClick={sortable ? onSort : undefined}
      style={style}
      className={`
        px-4 py-3
        font-semibold text-gray-900
        ${alignClasses[align]}
        ${sortable ? 'cursor-pointer select-none hover:bg-gray-100' : ''}
        ${className}
      `}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortable && (
          <span className="inline-flex flex-col">
            <svg
              className={`h-3 w-3 ${sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`}
              viewBox="0 0 12 12"
              fill="currentColor"
            >
              <path d="M6 0L12 6H0z" />
            </svg>
            <svg
              className={`h-3 w-3 -mt-1 ${sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`}
              viewBox="0 0 12 12"
              fill="currentColor"
            >
              <path d="M6 12L0 6h12z" />
            </svg>
          </span>
        )}
      </div>
    </th>
  );
}

export interface TdProps {
  children?: JSX.Element | JSX.Element[] | string;
  align?: 'left' | 'center' | 'right';
  colSpan?: number;
  rowSpan?: number;
  className?: string;
}

export function Td(props: TdProps): JSX.Element {
  const {
    children,
    align = 'left',
    colSpan,
    rowSpan,
    className = '',
  } = props;

  const alignClasses: Record<'left' | 'center' | 'right', string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <td
      colSpan={colSpan}
      rowSpan={rowSpan}
      className={`
        px-4 py-3
        text-gray-600
        ${alignClasses[align]}
        ${className}
      `}
    >
      {children}
    </td>
  );
}

/**
 * Table Caption
 */
export function TableCaption(props: {
  children: JSX.Element | JSX.Element[] | string;
  placement?: 'top' | 'bottom';
  className?: string;
}): JSX.Element {
  const { children, placement = 'bottom', className = '' } = props;

  return (
    <caption
      className={`
        px-4 py-2 text-sm text-gray-500
        ${placement === 'top' ? 'caption-top' : 'caption-bottom'}
        ${className}
      `}
    >
      {children}
    </caption>
  );
}

/**
 * Empty State for Table
 */
export function TableEmpty(props: {
  colSpan: number;
  message?: string;
  icon?: JSX.Element | string;
}): JSX.Element {
  const { colSpan, message = 'No data available', icon } = props;

  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center">
        <div className="flex flex-col items-center justify-center text-gray-500">
          {icon || (
            <svg
              className="h-12 w-12 mb-4 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          )}
          <p>{message}</p>
        </div>
      </td>
    </tr>
  );
}
