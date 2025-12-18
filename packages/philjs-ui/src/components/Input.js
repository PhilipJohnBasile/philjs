import { jsx as _jsx, jsxs as _jsxs } from "philjs-core/jsx-runtime";
const sizeStyles = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-base',
    lg: 'h-12 px-5 text-lg',
};
const variantStyles = {
    outline: {
        normal: 'border border-gray-300 rounded-md bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
        error: 'border border-red-500 rounded-md bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500',
    },
    filled: {
        normal: 'border-0 bg-gray-100 rounded-md focus:bg-white focus:ring-2 focus:ring-blue-500',
        error: 'border-0 bg-red-50 rounded-md focus:bg-white focus:ring-2 focus:ring-red-500',
    },
    flushed: {
        normal: 'border-0 border-b-2 border-gray-300 rounded-none bg-transparent focus:border-blue-500',
        error: 'border-0 border-b-2 border-red-500 rounded-none bg-transparent focus:border-red-500',
    },
};
export function Input(props) {
    const { type = 'text', placeholder, value, defaultValue, size = 'md', variant = 'outline', disabled = false, readOnly = false, required = false, error = false, helperText, label, id, name, leftElement, rightElement, onInput, onChange, onFocus, onBlur, className = '', inputClassName = '', 'aria-label': ariaLabel, 'aria-describedby': ariaDescribedBy, autoComplete, autoFocus, maxLength, minLength, pattern, } = props;
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;
    const hasError = Boolean(error);
    const errorMessage = typeof error === 'string' ? error : undefined;
    const baseStyles = `
    w-full
    outline-none
    transition-colors duration-150
    disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
    placeholder:text-gray-400
  `.trim().replace(/\s+/g, ' ');
    const variantStyle = variantStyles[variant][hasError ? 'error' : 'normal'];
    const inputClasses = [
        baseStyles,
        sizeStyles[size],
        variantStyle,
        leftElement ? 'pl-10' : '',
        rightElement ? 'pr-10' : '',
        inputClassName,
    ].filter(Boolean).join(' ');
    return (_jsxs("div", { className: `w-full ${className}`, children: [label && (_jsxs("label", { htmlFor: inputId, className: "block text-sm font-medium text-gray-700 mb-1", children: [label, required && _jsx("span", { className: "text-red-500 ml-1", children: "*" })] })), _jsxs("div", { className: "relative", children: [leftElement && (_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500", children: leftElement })), _jsx("input", { type: type, id: inputId, name: name, value: value, defaultValue: defaultValue, placeholder: placeholder, disabled: disabled, readOnly: readOnly, required: required, onInput: onInput, onChange: onChange, onFocus: onFocus, onBlur: onBlur, className: inputClasses, "aria-label": ariaLabel || label, "aria-invalid": hasError, "aria-describedby": [ariaDescribedBy, helperText && helperId, errorMessage && errorId]
                            .filter(Boolean)
                            .join(' ') || undefined, autoComplete: autoComplete, autoFocus: autoFocus, maxLength: maxLength, minLength: minLength, pattern: pattern }), rightElement && (_jsx("div", { className: "absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500", children: rightElement }))] }), helperText && !hasError && (_jsx("p", { id: helperId, className: "mt-1 text-sm text-gray-500", children: helperText })), errorMessage && (_jsx("p", { id: errorId, className: "mt-1 text-sm text-red-600", role: "alert", children: errorMessage }))] }));
}
export function Textarea(props) {
    const { placeholder, value, defaultValue, size = 'md', variant = 'outline', disabled = false, readOnly = false, required = false, error = false, helperText, label, id, name, rows = 4, resize = 'vertical', onInput, onChange, onFocus, onBlur, className = '', inputClassName = '', 'aria-label': ariaLabel, } = props;
    const textareaId = id || `textarea-${Math.random().toString(36).slice(2, 9)}`;
    const hasError = Boolean(error);
    const errorMessage = typeof error === 'string' ? error : undefined;
    const paddingStyles = {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-3 text-base',
        lg: 'px-5 py-4 text-lg',
    };
    const resizeStyles = {
        none: 'resize-none',
        vertical: 'resize-y',
        horizontal: 'resize-x',
        both: 'resize',
    };
    const variantStyle = variantStyles[variant][hasError ? 'error' : 'normal'];
    const textareaClasses = [
        'w-full outline-none transition-colors duration-150',
        'disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed',
        'placeholder:text-gray-400',
        paddingStyles[size],
        variantStyle,
        resizeStyles[resize],
        inputClassName,
    ].filter(Boolean).join(' ');
    return (_jsxs("div", { className: `w-full ${className}`, children: [label && (_jsxs("label", { htmlFor: textareaId, className: "block text-sm font-medium text-gray-700 mb-1", children: [label, required && _jsx("span", { className: "text-red-500 ml-1", children: "*" })] })), _jsx("textarea", { id: textareaId, name: name, value: value, defaultValue: defaultValue, placeholder: placeholder, disabled: disabled, readOnly: readOnly, required: required, rows: rows, onInput: onInput, onChange: onChange, onFocus: onFocus, onBlur: onBlur, className: textareaClasses, "aria-label": ariaLabel || label, "aria-invalid": hasError }), helperText && !hasError && (_jsx("p", { className: "mt-1 text-sm text-gray-500", children: helperText })), errorMessage && (_jsx("p", { className: "mt-1 text-sm text-red-600", role: "alert", children: errorMessage }))] }));
}
//# sourceMappingURL=Input.js.map