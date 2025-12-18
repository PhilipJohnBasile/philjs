import { jsx as _jsx, jsxs as _jsxs } from "philjs-core/jsx-runtime";
const variantStyles = {
    elevated: 'bg-white shadow-md',
    outlined: 'bg-white border border-gray-200',
    filled: 'bg-gray-50',
};
const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
};
export function Card(props) {
    const { children, variant = 'elevated', padding = 'md', hoverable = false, clickable = false, onClick, className = '', } = props;
    const classes = [
        'rounded-lg',
        variantStyles[variant],
        paddingStyles[padding],
        hoverable ? 'transition-shadow hover:shadow-lg' : '',
        clickable ? 'cursor-pointer' : '',
        className,
    ].filter(Boolean).join(' ');
    return (_jsx("div", { className: classes, onClick: clickable ? onClick : undefined, role: clickable ? 'button' : undefined, tabIndex: clickable ? 0 : undefined, children: children }));
}
/**
 * Card Header
 */
export function CardHeader(props) {
    const { children, action, className = '' } = props;
    return (_jsxs("div", { className: `flex items-center justify-between mb-4 ${className}`, children: [_jsx("div", { children: children }), action && _jsx("div", { children: action })] }));
}
/**
 * Card Title
 */
export function CardTitle(props) {
    const { children, subtitle, className = '' } = props;
    return (_jsxs("div", { className: className, children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: children }), subtitle && _jsx("p", { className: "text-sm text-gray-500 mt-1", children: subtitle })] }));
}
/**
 * Card Body
 */
export function CardBody(props) {
    return _jsx("div", { className: props.className || '', children: props.children });
}
/**
 * Card Footer
 */
export function CardFooter(props) {
    const { children, divider = false, className = '' } = props;
    return (_jsx("div", { className: `
        mt-4 pt-4
        ${divider ? 'border-t border-gray-200' : ''}
        ${className}
      `, children: children }));
}
/**
 * Card Image
 */
export function CardImage(props) {
    const { src, alt, position = 'top', className = '' } = props;
    const positionClasses = position === 'top'
        ? '-mx-4 -mt-4 mb-4 rounded-t-lg'
        : '-mx-4 -mb-4 mt-4 rounded-b-lg';
    return (_jsx("img", { src: src, alt: alt, className: `w-full object-cover ${positionClasses} ${className}` }));
}
//# sourceMappingURL=Card.js.map