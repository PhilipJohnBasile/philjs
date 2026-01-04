/**
 * Field Components for PhilJS Forms
 *
 * A collection of form field components that work with the Form class.
 * These provide consistent styling, validation, and accessibility features.
 */
// =============================================================================
// Field Component Factories
// =============================================================================
/**
 * Create a text input field configuration
 */
export function TextField(props) {
    const { name, label, type = 'text', placeholder, disabled, required, className, id, value, error, touched, onChange, onBlur, onFocus, minLength, maxLength, pattern, autoComplete, autoFocus, } = props;
    return {
        type: 'text',
        props,
        render: () => ({
            tag: 'input',
            attributes: {
                type,
                name,
                id: id ?? name,
                placeholder,
                disabled,
                required,
                className,
                value,
                minLength,
                maxLength,
                pattern,
                autoComplete,
                autoFocus,
                'aria-invalid': touched && error ? 'true' : undefined,
                'aria-describedby': props['aria-describedby'],
            },
        }),
    };
}
/**
 * Create a textarea field configuration
 */
export function TextAreaField(props) {
    const { name, id, placeholder, disabled, required, className, value, error, touched, rows, cols, minLength, maxLength, } = props;
    return {
        type: 'textarea',
        props,
        render: () => ({
            tag: 'textarea',
            attributes: {
                name,
                id: id ?? name,
                placeholder,
                disabled,
                required,
                className,
                value,
                rows,
                cols,
                minLength,
                maxLength,
                'aria-invalid': touched && error ? 'true' : undefined,
                'aria-describedby': props['aria-describedby'],
            },
        }),
    };
}
/**
 * Create a select field configuration
 */
export function SelectField(props) {
    const { name, id, disabled, required, className, value, error, touched, options, multiple, size, } = props;
    return {
        type: 'select',
        props,
        render: () => ({
            tag: 'select',
            attributes: {
                name,
                id: id ?? name,
                disabled,
                required,
                className,
                value,
                multiple,
                size,
                'aria-invalid': touched && error ? 'true' : undefined,
                'aria-describedby': props['aria-describedby'],
            },
            options,
        }),
    };
}
/**
 * Create a checkbox field configuration
 */
export function CheckboxField(props) {
    const { name, id, disabled, required, className, value, error, touched, indeterminate, } = props;
    return {
        type: 'checkbox',
        props,
        render: () => ({
            tag: 'input',
            attributes: {
                type: 'checkbox',
                name,
                id: id ?? name,
                disabled,
                required,
                className,
                checked: value,
                'aria-invalid': touched && error ? 'true' : undefined,
                'aria-describedby': props['aria-describedby'],
                'data-indeterminate': indeterminate ? 'true' : undefined,
            },
        }),
    };
}
/**
 * Create a radio field configuration
 */
export function RadioField(props) {
    const { name, id, disabled, required, className, value, error, touched, options, inline, } = props;
    return {
        type: 'radio',
        props,
        render: () => ({
            tag: 'fieldset',
            options,
            attributes: {
                name,
                id: id ?? name,
                disabled,
                required,
                className,
                'data-inline': inline ? 'true' : undefined,
                'data-value': value,
                'aria-invalid': touched && error ? 'true' : undefined,
                'aria-describedby': props['aria-describedby'],
            },
        }),
    };
}
/**
 * Create a file input field configuration
 */
export function FileField(props) {
    const { name, id, disabled, required, className, error, touched, accept, multiple, capture, } = props;
    return {
        type: 'file',
        props,
        render: () => ({
            tag: 'input',
            attributes: {
                type: 'file',
                name,
                id: id ?? name,
                disabled,
                required,
                className,
                accept,
                multiple,
                capture,
                'aria-invalid': touched && error ? 'true' : undefined,
                'aria-describedby': props['aria-describedby'],
            },
        }),
    };
}
/**
 * Create a number input field configuration
 */
export function NumberField(props) {
    const { name, id, placeholder, disabled, required, className, value, error, touched, min, max, step, } = props;
    return {
        type: 'number',
        props,
        render: () => ({
            tag: 'input',
            attributes: {
                type: 'number',
                name,
                id: id ?? name,
                placeholder,
                disabled,
                required,
                className,
                value: value ?? '',
                min,
                max,
                step,
                'aria-invalid': touched && error ? 'true' : undefined,
                'aria-describedby': props['aria-describedby'],
            },
        }),
    };
}
export function Field(type, props) {
    switch (type) {
        case 'text':
            return TextField(props);
        case 'textarea':
            return TextAreaField(props);
        case 'select':
            return SelectField(props);
        case 'checkbox':
            return CheckboxField(props);
        case 'radio':
            return RadioField(props);
        case 'file':
            return FileField(props);
        case 'number':
            return NumberField(props);
        default:
            throw new Error(`Unknown field type: ${type}`);
    }
}
//# sourceMappingURL=fields.js.map