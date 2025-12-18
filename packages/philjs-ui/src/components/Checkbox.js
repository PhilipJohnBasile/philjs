import { jsx as _jsx, jsxs as _jsxs } from "philjs-core/jsx-runtime";
const sizeStyles = {
    sm: { box: 'h-4 w-4', label: 'text-sm' },
    md: { box: 'h-5 w-5', label: 'text-base' },
    lg: { box: 'h-6 w-6', label: 'text-lg' },
};
export function Checkbox(props) {
    const { checked, defaultChecked, indeterminate = false, disabled = false, required = false, error = false, label, description, id, name, value, size = 'md', onChange, className = '', 'aria-label': ariaLabel, } = props;
    const checkboxId = id || `checkbox-${Math.random().toString(36).slice(2, 9)}`;
    const descriptionId = description ? `${checkboxId}-description` : undefined;
    const hasError = Boolean(error);
    const errorMessage = typeof error === 'string' ? error : undefined;
    const handleChange = (e) => {
        const target = e.target;
        onChange?.(target.checked);
    };
    const checkboxClasses = [
        sizeStyles[size].box,
        'rounded border-2 transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        hasError
            ? 'border-red-500 text-red-600'
            : 'border-gray-300 text-blue-600',
        disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer',
    ].join(' ');
    return (_jsxs("div", { className: `flex items-start ${className}`, children: [_jsx("div", { className: "flex items-center h-5", children: _jsx("input", { type: "checkbox", id: checkboxId, name: name, value: value, checked: checked, defaultChecked: defaultChecked, disabled: disabled, required: required, onChange: handleChange, className: checkboxClasses, "aria-label": ariaLabel || label, "aria-invalid": hasError, "aria-describedby": descriptionId, ref: (el) => {
                        if (el)
                            el.indeterminate = indeterminate;
                    } }) }), (label || description) && (_jsxs("div", { className: "ml-3", children: [label && (_jsxs("label", { htmlFor: checkboxId, className: `${sizeStyles[size].label} font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'} ${disabled ? '' : 'cursor-pointer'}`, children: [label, required && _jsx("span", { className: "text-red-500 ml-1", children: "*" })] })), description && (_jsx("p", { id: descriptionId, className: "text-sm text-gray-500", children: description }))] })), errorMessage && (_jsx("p", { className: "mt-1 text-sm text-red-600", role: "alert", children: errorMessage }))] }));
}
export function CheckboxGroup(props) {
    const { children, label, description, required = false, error = false, orientation = 'vertical', className = '', } = props;
    const hasError = Boolean(error);
    const errorMessage = typeof error === 'string' ? error : undefined;
    return (_jsxs("fieldset", { className: `${className}`, role: "group", children: [label && (_jsxs("legend", { className: "block text-sm font-medium text-gray-700 mb-2", children: [label, required && _jsx("span", { className: "text-red-500 ml-1", children: "*" })] })), description && (_jsx("p", { className: "text-sm text-gray-500 mb-3", children: description })), _jsx("div", { className: orientation === 'horizontal'
                    ? 'flex flex-wrap gap-4'
                    : 'flex flex-col gap-2', children: children }), errorMessage && (_jsx("p", { className: "mt-2 text-sm text-red-600", role: "alert", children: errorMessage }))] }));
}
//# sourceMappingURL=Checkbox.js.map