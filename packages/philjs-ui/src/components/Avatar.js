import { jsx as _jsx, jsxs as _jsxs } from "philjs-core/jsx-runtime";
/**
 * PhilJS UI - Avatar Component
 */
import { signal } from 'philjs-core';
const sizeStyles = {
    xs: { container: 'h-6 w-6', text: 'text-xs', status: 'h-1.5 w-1.5' },
    sm: { container: 'h-8 w-8', text: 'text-sm', status: 'h-2 w-2' },
    md: { container: 'h-10 w-10', text: 'text-base', status: 'h-2.5 w-2.5' },
    lg: { container: 'h-12 w-12', text: 'text-lg', status: 'h-3 w-3' },
    xl: { container: 'h-14 w-14', text: 'text-xl', status: 'h-3.5 w-3.5' },
    '2xl': { container: 'h-16 w-16', text: 'text-2xl', status: 'h-4 w-4' },
};
const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-yellow-500',
};
const bgColors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-teal-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-purple-500',
    'bg-pink-500',
];
function getInitials(name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
function getBgColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return bgColors[Math.abs(hash) % bgColors.length];
}
export function Avatar(props) {
    const { src, alt, name, size = 'md', rounded = true, showBorder = false, borderColor = 'border-white', status, className = '', } = props;
    const hasError = signal(false);
    const { container, text, status: statusSize } = sizeStyles[size];
    const handleError = () => {
        hasError.set(true);
    };
    const showImage = src && !hasError.get();
    const initials = name ? getInitials(name) : '?';
    const bgColor = name ? getBgColor(name) : 'bg-gray-400';
    return (_jsxs("div", { className: `relative inline-flex ${className}`, children: [_jsx("div", { className: `
          ${container}
          flex items-center justify-center
          overflow-hidden
          ${rounded ? 'rounded-full' : 'rounded-md'}
          ${showBorder ? `border-2 ${borderColor}` : ''}
          ${showImage ? '' : bgColor}
        `, children: showImage ? (_jsx("img", { src: src, alt: alt || name || 'Avatar', onError: handleError, className: "h-full w-full object-cover" })) : (_jsx("span", { className: `${text} font-medium text-white`, children: initials })) }), status && (_jsx("span", { className: `
            absolute bottom-0 right-0
            ${statusSize}
            ${statusColors[status]}
            rounded-full
            ring-2 ring-white
          `, "aria-label": `Status: ${status}` }))] }));
}
export function AvatarGroup(props) {
    const { children, max, size = 'md', spacing = -3, className = '', } = props;
    const avatars = Array.isArray(children) ? children : [children];
    const displayCount = max ? Math.min(avatars.length, max) : avatars.length;
    const remaining = avatars.length - displayCount;
    return (_jsxs("div", { className: `flex items-center ${className}`, children: [avatars.slice(0, displayCount).map((avatar, index) => (_jsx("div", { style: { marginLeft: index > 0 ? `${spacing * 4}px` : 0 }, className: "relative", children: avatar }, index))), remaining > 0 && (_jsxs("div", { style: { marginLeft: `${spacing * 4}px` }, className: `
            ${sizeStyles[size].container}
            flex items-center justify-center
            rounded-full bg-gray-200
            ${sizeStyles[size].text} font-medium text-gray-600
          `, children: ["+", remaining] }))] }));
}
export function AvatarBadge(props) {
    const { children, badge, position = 'bottom-right', className = '', } = props;
    const positionStyles = {
        'top-right': 'top-0 right-0',
        'top-left': 'top-0 left-0',
        'bottom-right': 'bottom-0 right-0',
        'bottom-left': 'bottom-0 left-0',
    };
    return (_jsxs("div", { className: `relative inline-flex ${className}`, children: [children, _jsx("div", { className: `absolute ${positionStyles[position]}`, children: badge })] }));
}
//# sourceMappingURL=Avatar.js.map