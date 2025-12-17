import { jsx as _jsx, jsxs as _jsxs } from "philjs-core/jsx-runtime";
/**
 * PhilJS UI - Drawer Component
 */
import { effect, onMount, onCleanup } from 'philjs-core';
const sizeStyles = {
    left: {
        xs: 'w-64',
        sm: 'w-80',
        md: 'w-96',
        lg: 'w-[32rem]',
        xl: 'w-[40rem]',
        full: 'w-screen',
    },
    right: {
        xs: 'w-64',
        sm: 'w-80',
        md: 'w-96',
        lg: 'w-[32rem]',
        xl: 'w-[40rem]',
        full: 'w-screen',
    },
    top: {
        xs: 'h-32',
        sm: 'h-48',
        md: 'h-64',
        lg: 'h-96',
        xl: 'h-[32rem]',
        full: 'h-screen',
    },
    bottom: {
        xs: 'h-32',
        sm: 'h-48',
        md: 'h-64',
        lg: 'h-96',
        xl: 'h-[32rem]',
        full: 'h-screen',
    },
};
const placementStyles = {
    left: {
        container: 'inset-y-0 left-0',
        panel: 'h-full',
        open: 'translate-x-0',
        closed: '-translate-x-full',
    },
    right: {
        container: 'inset-y-0 right-0',
        panel: 'h-full',
        open: 'translate-x-0',
        closed: 'translate-x-full',
    },
    top: {
        container: 'inset-x-0 top-0',
        panel: 'w-full',
        open: 'translate-y-0',
        closed: '-translate-y-full',
    },
    bottom: {
        container: 'inset-x-0 bottom-0',
        panel: 'w-full',
        open: 'translate-y-0',
        closed: 'translate-y-full',
    },
};
export function Drawer(props) {
    const { isOpen, onClose, children, placement = 'right', size = 'md', title, showCloseButton = true, closeOnOverlay = true, closeOnEscape = true, className = '', overlayClassName = '', } = props;
    let drawerRef = null;
    // Handle escape key
    onMount(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && closeOnEscape && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        onCleanup(() => {
            document.removeEventListener('keydown', handleKeyDown);
        });
    });
    // Lock body scroll
    effect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        else {
            document.body.style.overflow = '';
        }
    });
    const handleOverlayClick = () => {
        if (closeOnOverlay) {
            onClose();
        }
    };
    const styles = placementStyles[placement];
    const sizeClass = sizeStyles[placement][size];
    if (!isOpen)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 z-50 overflow-hidden", role: "dialog", "aria-modal": "true", children: [_jsx("div", { className: `absolute inset-0 bg-black/50 transition-opacity ${overlayClassName}`, onClick: handleOverlayClick, "aria-hidden": "true" }), _jsx("div", { className: `fixed ${styles.container}`, children: _jsxs("div", { ref: (el) => (drawerRef = el), className: `
            ${styles.panel}
            ${sizeClass}
            bg-white shadow-xl
            flex flex-col
            transform transition-transform duration-300 ease-in-out
            ${isOpen ? styles.open : styles.closed}
            ${className}
          `, children: [(title || showCloseButton) && (_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-gray-200", children: [title && (_jsx("h2", { className: "text-lg font-semibold text-gray-900", children: title })), showCloseButton && (_jsx("button", { type: "button", onClick: onClose, className: "p-1 text-gray-400 hover:text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", "aria-label": "Close drawer", children: _jsx("svg", { className: "h-5 w-5", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) }))] })), _jsx("div", { className: "flex-1 overflow-y-auto p-4", children: children })] }) })] }));
}
/**
 * Drawer Header
 */
export function DrawerHeader(props) {
    return (_jsx("div", { className: `px-4 py-3 border-b border-gray-200 ${props.className || ''}`, children: props.children }));
}
/**
 * Drawer Body
 */
export function DrawerBody(props) {
    return (_jsx("div", { className: `flex-1 overflow-y-auto px-4 py-3 ${props.className || ''}`, children: props.children }));
}
/**
 * Drawer Footer
 */
export function DrawerFooter(props) {
    return (_jsx("div", { className: `px-4 py-3 border-t border-gray-200 flex justify-end gap-2 ${props.className || ''}`, children: props.children }));
}
//# sourceMappingURL=Drawer.js.map