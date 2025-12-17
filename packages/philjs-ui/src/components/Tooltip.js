import { jsx as _jsx, jsxs as _jsxs } from "philjs-core/jsx-runtime";
/**
 * PhilJS UI - Tooltip Component
 */
import { signal, onMount, onCleanup } from 'philjs-core';
const placementStyles = {
    top: {
        tooltip: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        arrow: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900',
    },
    bottom: {
        tooltip: 'top-full left-1/2 -translate-x-1/2 mt-2',
        arrow: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900',
    },
    left: {
        tooltip: 'right-full top-1/2 -translate-y-1/2 mr-2',
        arrow: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900',
    },
    right: {
        tooltip: 'left-full top-1/2 -translate-y-1/2 ml-2',
        arrow: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900',
    },
};
export function Tooltip(props) {
    const { content, children, placement = 'top', delay = 0, disabled = false, className = '', arrow = true, } = props;
    const isVisible = signal(false);
    let timeoutId = null;
    const showTooltip = () => {
        if (disabled)
            return;
        if (delay > 0) {
            timeoutId = setTimeout(() => isVisible.set(true), delay);
        }
        else {
            isVisible.set(true);
        }
    };
    const hideTooltip = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        isVisible.set(false);
    };
    onCleanup(() => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    });
    return (_jsxs("div", { className: "relative inline-block", onMouseEnter: showTooltip, onMouseLeave: hideTooltip, onFocus: showTooltip, onBlur: hideTooltip, children: [children, isVisible.get() && (_jsxs("div", { role: "tooltip", className: `
            absolute z-50
            ${placementStyles[placement].tooltip}
            ${className}
          `, children: [_jsx("div", { className: "bg-gray-900 text-white text-sm px-2 py-1 rounded shadow-lg whitespace-nowrap", children: content }), arrow && (_jsx("div", { className: `
                absolute w-0 h-0
                border-4
                ${placementStyles[placement].arrow}
              ` }))] }))] }));
}
export function Popover(props) {
    const { trigger, children, placement = 'bottom', isOpen: controlledIsOpen, onOpenChange, closeOnClickOutside = true, className = '', } = props;
    const internalIsOpen = signal(false);
    const isOpen = controlledIsOpen ?? internalIsOpen.get();
    let popoverRef = null;
    const toggleOpen = () => {
        const newValue = !isOpen;
        if (controlledIsOpen === undefined) {
            internalIsOpen.set(newValue);
        }
        onOpenChange?.(newValue);
    };
    const close = () => {
        if (controlledIsOpen === undefined) {
            internalIsOpen.set(false);
        }
        onOpenChange?.(false);
    };
    onMount(() => {
        if (!closeOnClickOutside)
            return;
        const handleClickOutside = (e) => {
            if (popoverRef && !popoverRef.contains(e.target) && isOpen) {
                close();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        onCleanup(() => {
            document.removeEventListener('mousedown', handleClickOutside);
        });
    });
    const placementClasses = {
        top: 'bottom-full left-0 mb-2',
        bottom: 'top-full left-0 mt-2',
        left: 'right-full top-0 mr-2',
        right: 'left-full top-0 ml-2',
    };
    return (_jsxs("div", { ref: (el) => (popoverRef = el), className: "relative inline-block", children: [_jsx("div", { onClick: toggleOpen, children: trigger }), isOpen && (_jsx("div", { className: `
            absolute z-50
            ${placementClasses[placement]}
            bg-white rounded-lg shadow-lg border border-gray-200
            p-4 min-w-[200px]
            ${className}
          `, children: children }))] }));
}
//# sourceMappingURL=Tooltip.js.map