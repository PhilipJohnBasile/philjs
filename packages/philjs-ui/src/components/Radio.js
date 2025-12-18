import { jsx as _jsx, jsxs as _jsxs } from "philjs-core/jsx-runtime";
/**
 * PhilJS UI - Radio Component
 */
import { signal, createContext, useContext } from 'philjs-core';
const RadioContext = createContext(null);
const sizeStyles = {
    sm: { radio: 'h-4 w-4', label: 'text-sm' },
    md: { radio: 'h-5 w-5', label: 'text-base' },
    lg: { radio: 'h-6 w-6', label: 'text-lg' },
};
export function Radio(props) {
    const { value, label, description, disabled: localDisabled, id, className = '', 'aria-label': ariaLabel, } = props;
    const context = useContext(RadioContext);
    if (!context) {
        throw new Error('Radio must be used within a RadioGroup');
    }
    const { name, value: groupValue, onChange, disabled: groupDisabled, size } = context;
    const isDisabled = localDisabled ?? groupDisabled;
    const isChecked = groupValue === value;
    const radioId = id || `radio-${name}-${value}`;
    const descriptionId = description ? `${radioId}-description` : undefined;
    const handleChange = () => {
        if (!isDisabled) {
            onChange(value);
        }
    };
    const radioClasses = [
        sizeStyles[size].radio,
        'rounded-full border-2 transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        'border-gray-300 text-blue-600',
        isDisabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer',
    ].join(' ');
    return (_jsxs("div", { className: `flex items-start ${className}`, children: [_jsx("div", { className: "flex items-center h-5", children: _jsx("input", { type: "radio", id: radioId, name: name, value: value, checked: isChecked, disabled: isDisabled, onChange: handleChange, className: radioClasses, "aria-label": ariaLabel || label, "aria-describedby": descriptionId }) }), (label || description) && (_jsxs("div", { className: "ml-3", children: [label && (_jsx("label", { htmlFor: radioId, className: `${sizeStyles[size].label} font-medium ${isDisabled ? 'text-gray-400' : 'text-gray-700'} ${isDisabled ? '' : 'cursor-pointer'}`, children: label })), description && (_jsx("p", { id: descriptionId, className: "text-sm text-gray-500", children: description }))] }))] }));
}
export function RadioGroup(props) {
    const { name, value, defaultValue, children, label, description, required = false, disabled = false, error = false, size = 'md', orientation = 'vertical', onChange, className = '', } = props;
    const internalValue = signal(value ?? defaultValue ?? '');
    const hasError = Boolean(error);
    const errorMessage = typeof error === 'string' ? error : undefined;
    const handleChange = (newValue) => {
        internalValue.set(newValue);
        onChange?.(newValue);
    };
    const contextValue = {
        name,
        value: value ?? internalValue(),
        onChange: handleChange,
        disabled,
        size,
    };
    return (_jsx(RadioContext.Provider, { value: contextValue, children: _jsxs("fieldset", { className: `${className}`, role: "radiogroup", "aria-required": required, "aria-invalid": hasError, children: [label && (_jsxs("legend", { className: "block text-sm font-medium text-gray-700 mb-2", children: [label, required && _jsx("span", { className: "text-red-500 ml-1", children: "*" })] })), description && (_jsx("p", { className: "text-sm text-gray-500 mb-3", children: description })), _jsx("div", { className: orientation === 'horizontal'
                        ? 'flex flex-wrap gap-4'
                        : 'flex flex-col gap-2', children: children }), errorMessage && (_jsx("p", { className: "mt-2 text-sm text-red-600", role: "alert", children: errorMessage }))] }) }));
}
//# sourceMappingURL=Radio.js.map