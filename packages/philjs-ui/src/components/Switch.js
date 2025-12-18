import { jsx as _jsx, jsxs as _jsxs } from "philjs-core/jsx-runtime";
/**
 * PhilJS UI - Switch Component
 */
import { signal } from 'philjs-core';
const sizeStyles = {
    sm: { track: 'h-5 w-9', thumb: 'h-4 w-4', translate: 'translate-x-4' },
    md: { track: 'h-6 w-11', thumb: 'h-5 w-5', translate: 'translate-x-5' },
    lg: { track: 'h-7 w-14', thumb: 'h-6 w-6', translate: 'translate-x-7' },
};
export function Switch(props) {
    const { checked, defaultChecked = false, disabled = false, label, description, id, name, size = 'md', onChange, className = '', 'aria-label': ariaLabel, } = props;
    const isControlled = checked !== undefined;
    const internalChecked = signal(defaultChecked);
    const switchId = id || `switch-${Math.random().toString(36).slice(2, 9)}`;
    const descriptionId = description ? `${switchId}-description` : undefined;
    const isChecked = isControlled ? checked : internalChecked();
    const handleClick = () => {
        if (disabled)
            return;
        const newValue = !isChecked;
        if (!isControlled) {
            internalChecked.set(newValue);
        }
        onChange?.(newValue);
    };
    const handleKeyDown = (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            handleClick();
        }
    };
    const { track, thumb, translate } = sizeStyles[size];
    return (_jsxs("div", { className: `flex items-start ${className}`, children: [_jsx("button", { type: "button", id: switchId, role: "switch", "aria-checked": isChecked, "aria-label": ariaLabel || label, "aria-describedby": descriptionId, disabled: disabled, onClick: handleClick, onKeyDown: handleKeyDown, className: `
          ${track}
          relative inline-flex flex-shrink-0
          rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          ${isChecked ? 'bg-blue-600' : 'bg-gray-200'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `, children: _jsx("span", { className: `
            ${thumb}
            pointer-events-none inline-block
            rounded-full bg-white shadow-lg
            transform ring-0
            transition duration-200 ease-in-out
            ${isChecked ? translate : 'translate-x-0'}
          ` }) }), _jsx("input", { type: "checkbox", name: name, checked: isChecked, disabled: disabled, className: "sr-only", readOnly: true, tabIndex: -1 }), (label || description) && (_jsxs("div", { className: "ml-3", children: [label && (_jsx("label", { htmlFor: switchId, className: `text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'} ${disabled ? '' : 'cursor-pointer'}`, onClick: handleClick, children: label })), description && (_jsx("p", { id: descriptionId, className: "text-sm text-gray-500", children: description }))] }))] }));
}
//# sourceMappingURL=Switch.js.map