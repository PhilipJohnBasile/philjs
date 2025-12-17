import { jsx as _jsx, jsxs as _jsxs } from "philjs-core/jsx-runtime";
/**
 * PhilJS UI - Select Component
 */
import { signal, effect } from 'philjs-core';
const sizeStyles = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-base',
    lg: 'h-12 px-5 text-lg',
};
export function Select(props) {
    const { options, value, defaultValue, placeholder, size = 'md', disabled = false, required = false, error = false, helperText, label, id, name, onChange, className = '', 'aria-label': ariaLabel, } = props;
    const selectId = id || `select-${Math.random().toString(36).slice(2, 9)}`;
    const hasError = Boolean(error);
    const errorMessage = typeof error === 'string' ? error : undefined;
    const baseStyles = `
    w-full appearance-none
    border rounded-md bg-white
    outline-none
    transition-colors duration-150
    cursor-pointer
    disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
    pr-10
  `.trim().replace(/\s+/g, ' ');
    const borderStyle = hasError
        ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
        : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500';
    const selectClasses = [
        baseStyles,
        sizeStyles[size],
        borderStyle,
    ].join(' ');
    const handleChange = (e) => {
        const target = e.target;
        onChange?.(target.value);
    };
    return (_jsxs("div", { className: `w-full ${className}`, children: [label && (_jsxs("label", { htmlFor: selectId, className: "block text-sm font-medium text-gray-700 mb-1", children: [label, required && _jsx("span", { className: "text-red-500 ml-1", children: "*" })] })), _jsxs("div", { className: "relative", children: [_jsxs("select", { id: selectId, name: name, value: value, defaultValue: defaultValue, disabled: disabled, required: required, onChange: handleChange, className: selectClasses, "aria-label": ariaLabel || label, "aria-invalid": hasError, children: [placeholder && (_jsx("option", { value: "", disabled: true, children: placeholder })), options.map((option) => (_jsx("option", { value: option.value, disabled: option.disabled, children: option.label }, option.value)))] }), _jsx("div", { className: "absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none", children: _jsx("svg", { className: "h-5 w-5 text-gray-400", xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 20 20", fill: "currentColor", "aria-hidden": "true", children: _jsx("path", { fillRule: "evenodd", d: "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z", clipRule: "evenodd" }) }) })] }), helperText && !hasError && (_jsx("p", { className: "mt-1 text-sm text-gray-500", children: helperText })), errorMessage && (_jsx("p", { className: "mt-1 text-sm text-red-600", role: "alert", children: errorMessage }))] }));
}
export function MultiSelect(props) {
    const { options, value = [], placeholder, size = 'md', disabled = false, required = false, error = false, helperText, label, onChange, maxSelections, className = '', } = props;
    const selectedValues = signal(value);
    const isOpen = signal(false);
    effect(() => {
        selectedValues.set(value);
    });
    const toggleOption = (optionValue) => {
        const current = selectedValues.get();
        let newValues;
        if (current.includes(optionValue)) {
            newValues = current.filter(v => v !== optionValue);
        }
        else {
            if (maxSelections && current.length >= maxSelections) {
                return; // Max reached
            }
            newValues = [...current, optionValue];
        }
        selectedValues.set(newValues);
        onChange?.(newValues);
    };
    const removeValue = (optionValue) => {
        const newValues = selectedValues.get().filter(v => v !== optionValue);
        selectedValues.set(newValues);
        onChange?.(newValues);
    };
    const hasError = Boolean(error);
    const errorMessage = typeof error === 'string' ? error : undefined;
    return (_jsxs("div", { className: `w-full ${className}`, children: [label && (_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: [label, required && _jsx("span", { className: "text-red-500 ml-1", children: "*" })] })), _jsxs("div", { className: "relative", children: [_jsxs("div", { className: `
            min-h-10 w-full border rounded-md bg-white p-2
            flex flex-wrap gap-1
            ${hasError ? 'border-red-500' : 'border-gray-300'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'}
          `, onClick: () => !disabled && isOpen.set(!isOpen.get()), children: [selectedValues.get().length === 0 && (_jsx("span", { className: "text-gray-400", children: placeholder })), selectedValues.get().map(val => {
                                const option = options.find(o => o.value === val);
                                return (_jsxs("span", { className: "inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-800 text-sm", children: [option?.label || val, _jsx("button", { type: "button", className: "ml-1 hover:text-blue-600", onClick: (e) => {
                                                e.stopPropagation();
                                                removeValue(val);
                                            }, children: "\u00D7" })] }, val));
                            })] }), isOpen.get() && !disabled && (_jsx("div", { className: "absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto", children: options.map(option => (_jsxs("div", { className: `
                  px-4 py-2 cursor-pointer
                  ${option.disabled ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}
                  ${selectedValues.get().includes(option.value) ? 'bg-blue-50' : ''}
                `, onClick: () => !option.disabled && toggleOption(option.value), children: [_jsx("input", { type: "checkbox", checked: selectedValues.get().includes(option.value), disabled: option.disabled, readOnly: true, className: "mr-2" }), option.label] }, option.value))) }))] }), helperText && !hasError && (_jsx("p", { className: "mt-1 text-sm text-gray-500", children: helperText })), errorMessage && (_jsx("p", { className: "mt-1 text-sm text-red-600", role: "alert", children: errorMessage }))] }));
}
//# sourceMappingURL=Select.js.map