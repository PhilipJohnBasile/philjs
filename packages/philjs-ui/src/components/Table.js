import { jsx as _jsx, jsxs as _jsxs } from "philjs-core/jsx-runtime";
const sizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
};
export function Table(props) {
    const { children, variant = 'simple', size = 'md', hoverable = false, className = '', } = props;
    const variantClasses = {
        simple: 'divide-y divide-gray-200',
        striped: '[&_tbody_tr:nth-child(odd)]:bg-gray-50',
        unstyled: '',
    };
    return (_jsx("div", { className: `overflow-x-auto ${className}`, children: _jsx("table", { className: `
          min-w-full
          ${sizeStyles[size]}
          ${variantClasses[variant]}
          ${hoverable ? '[&_tbody_tr:hover]:bg-gray-50' : ''}
        `, children: children }) }));
}
/**
 * Table Head
 */
export function Thead(props) {
    return (_jsx("thead", { className: `bg-gray-50 ${props.className || ''}`, children: props.children }));
}
/**
 * Table Body
 */
export function Tbody(props) {
    return (_jsx("tbody", { className: `divide-y divide-gray-200 bg-white ${props.className || ''}`, children: props.children }));
}
/**
 * Table Foot
 */
export function Tfoot(props) {
    return (_jsx("tfoot", { className: `bg-gray-50 ${props.className || ''}`, children: props.children }));
}
export function Tr(props) {
    const { children, selected = false, onClick, className = '' } = props;
    return (_jsx("tr", { onClick: onClick, className: `
        ${selected ? 'bg-blue-50' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `, children: children }));
}
export function Th(props) {
    const { children, sortable = false, sortDirection = null, onSort, align = 'left', width, className = '', } = props;
    const alignClasses = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
    };
    const style = {};
    if (width)
        style.width = typeof width === 'number' ? `${width}px` : width;
    return (_jsx("th", { scope: "col", onClick: sortable ? onSort : undefined, style: style, className: `
        px-4 py-3
        font-semibold text-gray-900
        ${alignClasses[align]}
        ${sortable ? 'cursor-pointer select-none hover:bg-gray-100' : ''}
        ${className}
      `, children: _jsxs("div", { className: "flex items-center gap-2", children: [children, sortable && (_jsxs("span", { className: "inline-flex flex-col", children: [_jsx("svg", { className: `h-3 w-3 ${sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`, viewBox: "0 0 12 12", fill: "currentColor", children: _jsx("path", { d: "M6 0L12 6H0z" }) }), _jsx("svg", { className: `h-3 w-3 -mt-1 ${sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`, viewBox: "0 0 12 12", fill: "currentColor", children: _jsx("path", { d: "M6 12L0 6h12z" }) })] }))] }) }));
}
export function Td(props) {
    const { children, align = 'left', colSpan, rowSpan, className = '', } = props;
    const alignClasses = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
    };
    return (_jsx("td", { colSpan: colSpan, rowSpan: rowSpan, className: `
        px-4 py-3
        text-gray-600
        ${alignClasses[align]}
        ${className}
      `, children: children }));
}
/**
 * Table Caption
 */
export function TableCaption(props) {
    const { children, placement = 'bottom', className = '' } = props;
    return (_jsx("caption", { className: `
        px-4 py-2 text-sm text-gray-500
        ${placement === 'top' ? 'caption-top' : 'caption-bottom'}
        ${className}
      `, children: children }));
}
/**
 * Empty State for Table
 */
export function TableEmpty(props) {
    const { colSpan, message = 'No data available', icon } = props;
    return (_jsx("tr", { children: _jsx("td", { colSpan: colSpan, className: "px-4 py-12 text-center", children: _jsxs("div", { className: "flex flex-col items-center justify-center text-gray-500", children: [icon || (_jsx("svg", { className: "h-12 w-12 mb-4 text-gray-300", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1, d: "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" }) })), _jsx("p", { children: message })] }) }) }));
}
//# sourceMappingURL=Table.js.map