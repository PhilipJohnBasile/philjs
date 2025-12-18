import { jsx as _jsx, jsxs as _jsxs } from "philjs-core/jsx-runtime";
/**
 * PhilJS UI - Dropdown Component
 */
import { signal, effect } from 'philjs-core';
export function Dropdown(props) {
    const { trigger, children, placement = 'bottom-start', isOpen: controlledIsOpen, onOpenChange, closeOnSelect = true, className = '', } = props;
    const internalIsOpen = signal(false);
    const isOpen = controlledIsOpen ?? internalIsOpen();
    let dropdownRef = null;
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
    effect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef && !dropdownRef.contains(e.target) && isOpen) {
                close();
            }
        };
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                close();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    });
    const placementStyles = {
        'bottom-start': 'top-full left-0 mt-1',
        'bottom-end': 'top-full right-0 mt-1',
        'top-start': 'bottom-full left-0 mb-1',
        'top-end': 'bottom-full right-0 mb-1',
    };
    const handleItemClick = () => {
        if (closeOnSelect) {
            close();
        }
    };
    return (_jsxs("div", { ref: (el) => (dropdownRef = el), className: "relative inline-block", children: [_jsx("div", { onClick: toggleOpen, children: trigger }), isOpen && (_jsx("div", { role: "menu", className: `
            absolute z-50
            ${placementStyles[placement]}
            min-w-[160px]
            bg-white rounded-md shadow-lg border border-gray-200
            py-1
            ${className}
          `, onClick: handleItemClick, children: children }))] }));
}
export function DropdownItem(props) {
    const { children, onClick, disabled = false, icon, danger = false, className = '', } = props;
    const handleClick = () => {
        if (!disabled) {
            onClick?.();
        }
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    };
    return (_jsxs("button", { role: "menuitem", onClick: handleClick, onKeyDown: handleKeyDown, disabled: disabled, className: `
        w-full px-4 py-2 text-left text-sm
        flex items-center
        ${danger
            ? 'text-red-600 hover:bg-red-50'
            : 'text-gray-700 hover:bg-gray-100'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:bg-gray-100
        ${className}
      `, children: [icon && _jsx("span", { className: "mr-2 w-4 h-4", children: icon }), children] }));
}
/**
 * Dropdown Divider
 */
export function DropdownDivider() {
    return _jsx("hr", { className: "my-1 border-gray-200" });
}
/**
 * Dropdown Label
 */
export function DropdownLabel(props) {
    return (_jsx("div", { className: "px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider", children: props.children }));
}
//# sourceMappingURL=Dropdown.js.map