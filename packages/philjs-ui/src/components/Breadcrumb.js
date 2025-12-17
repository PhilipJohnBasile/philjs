import { jsx as _jsx, jsxs as _jsxs } from "philjs-core/jsx-runtime";
export function Breadcrumb(props) {
    const { children, separator = '/', className = '', } = props;
    const items = Array.isArray(children) ? children : [children];
    const defaultSeparator = typeof separator === 'string' ? (_jsx("span", { className: "mx-2 text-gray-400", children: separator })) : (_jsx("span", { className: "mx-2", children: separator }));
    return (_jsx("nav", { "aria-label": "Breadcrumb", className: className, children: _jsx("ol", { className: "flex items-center flex-wrap", children: items.map((item, index) => (_jsxs("li", { className: "flex items-center", children: [item, index < items.length - 1 && defaultSeparator] }, index))) }) }));
}
export function BreadcrumbItem(props) {
    const { children, href, isCurrentPage = false, onClick, className = '', } = props;
    const baseClasses = 'text-sm';
    const activeClasses = 'text-gray-900 font-medium';
    const inactiveClasses = 'text-gray-500 hover:text-gray-700';
    if (isCurrentPage) {
        return (_jsx("span", { "aria-current": "page", className: `${baseClasses} ${activeClasses} ${className}`, children: children }));
    }
    if (href) {
        return (_jsx("a", { href: href, onClick: onClick, className: `${baseClasses} ${inactiveClasses} ${className}`, children: children }));
    }
    return (_jsx("button", { type: "button", onClick: onClick, className: `${baseClasses} ${inactiveClasses} ${className}`, children: children }));
}
/**
 * Breadcrumb Link (Alias for BreadcrumbItem with href)
 */
export function BreadcrumbLink(props) {
    return _jsx(BreadcrumbItem, { ...props });
}
export function BreadcrumbSeparator(props) {
    const { children = '/', className = '' } = props;
    return (_jsx("span", { className: `mx-2 text-gray-400 ${className}`, "aria-hidden": "true", children: children }));
}
/**
 * Common Breadcrumb Icons
 */
export const BreadcrumbIcons = {
    chevron: (_jsx("svg", { className: "h-4 w-4 text-gray-400", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z", clipRule: "evenodd" }) })),
    arrow: (_jsx("svg", { className: "h-4 w-4 text-gray-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) })),
    dot: (_jsx("span", { className: "h-1 w-1 rounded-full bg-gray-400" })),
};
//# sourceMappingURL=Breadcrumb.js.map