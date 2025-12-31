/**
 * TextInput Component
 *
 * A component for text input.
 * Supports various keyboard types, secure entry, and multiline.
 */
import { signal, effect } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';
// ============================================================================
// TextInput Component
// ============================================================================
/**
 * Create a TextInput component
 */
export function TextInput(props) {
    const platform = detectPlatform();
    // Merge styles if array
    const mergedStyle = Array.isArray(props.style)
        ? Object.assign({}, ...props.style.filter(Boolean))
        : props.style || {};
    const handleChange = (e) => {
        const text = e.target.value;
        props.onChangeText?.(text);
        props.onChange?.({
            nativeEvent: {
                text,
                target: 0,
            },
        });
    };
    const handleFocus = (e) => {
        if (props.selectTextOnFocus) {
            e.target.select();
        }
        props.onFocus?.({
            nativeEvent: {
                target: 0,
                text: e.target.value,
            },
        });
    };
    const handleBlur = (e) => {
        props.onBlur?.({
            nativeEvent: {
                target: 0,
                text: e.target.value,
            },
        });
        props.onEndEditing?.({
            nativeEvent: {
                text: e.target.value,
            },
        });
    };
    const handleKeyDown = (e) => {
        props.onKeyPress?.({
            nativeEvent: {
                key: e.key,
            },
        });
        if (e.key === 'Enter' && !props.multiline) {
            props.onSubmitEditing?.({
                nativeEvent: {
                    text: e.target.value,
                },
            });
            if (props.blurOnSubmit !== false) {
                e.target.blur();
            }
        }
    };
    const handleSelectionChange = (e) => {
        props.onSelectionChange?.({
            nativeEvent: {
                selection: {
                    start: e.target.selectionStart,
                    end: e.target.selectionEnd,
                },
            },
        });
    };
    if (platform === 'web') {
        const inputStyle = convertInputStyle(mergedStyle);
        // Map keyboard type to input type
        const inputType = mapKeyboardType(props.keyboardType, props.secureTextEntry);
        // Map autocomplete
        const autoCompleteValue = mapAutoComplete(props.autoComplete, props.textContentType);
        const commonProps = {
            style: inputStyle,
            value: props.value,
            defaultValue: props.defaultValue,
            placeholder: props.placeholder,
            disabled: props.editable === false || props.readOnly,
            readOnly: props.readOnly,
            maxLength: props.maxLength,
            autoFocus: props.autoFocus,
            autoComplete: autoCompleteValue,
            autoCorrect: props.autoCorrect ? 'on' : 'off',
            autoCapitalize: props.autoCapitalize,
            spellCheck: props.spellCheck,
            'data-testid': props.testID,
            'aria-label': props.accessibilityLabel,
            onChange: handleChange,
            onFocus: handleFocus,
            onBlur: handleBlur,
            onKeyDown: handleKeyDown,
            onSelect: handleSelectionChange,
        };
        // Apply placeholder color
        if (props.placeholderTextColor) {
            inputStyle['--placeholder-color'] = props.placeholderTextColor;
        }
        // Apply text alignment
        if (props.textAlign) {
            inputStyle['text-align'] = props.textAlign;
        }
        if (props.multiline) {
            return {
                type: 'textarea',
                props: {
                    ...commonProps,
                    rows: props.numberOfLines || 4,
                },
                children: null,
            };
        }
        return {
            type: 'input',
            props: {
                ...commonProps,
                type: inputType,
            },
            children: null,
        };
    }
    // Return native element descriptor
    return {
        type: 'NativeTextInput',
        props: {
            ...props,
            style: mergedStyle,
        },
        children: null,
    };
}
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Convert input style to CSS format
 */
function convertInputStyle(style) {
    const result = {
        outline: 'none',
        border: 'none',
        padding: '8px',
        'font-size': '16px',
        'font-family': 'inherit',
    };
    for (const [key, value] of Object.entries(style)) {
        if (value === undefined || value === null)
            continue;
        const cssKey = camelToKebab(key);
        result[cssKey] = convertValue(key, value);
    }
    return result;
}
/**
 * Map keyboard type to HTML input type
 */
function mapKeyboardType(keyboardType, secureTextEntry) {
    if (secureTextEntry)
        return 'password';
    const typeMap = {
        'default': 'text',
        'number-pad': 'number',
        'decimal-pad': 'number',
        'numeric': 'number',
        'email-address': 'email',
        'phone-pad': 'tel',
        'url': 'url',
        'ascii-capable': 'text',
        'numbers-and-punctuation': 'text',
        'name-phone-pad': 'tel',
        'twitter': 'text',
        'web-search': 'search',
        'visible-password': 'text',
    };
    return typeMap[keyboardType || 'default'] || 'text';
}
/**
 * Map auto-complete to HTML autocomplete
 */
function mapAutoComplete(autoComplete, textContentType) {
    if (autoComplete)
        return autoComplete;
    if (textContentType) {
        const contentTypeMap = {
            username: 'username',
            password: 'current-password',
            newPassword: 'new-password',
            emailAddress: 'email',
            telephoneNumber: 'tel',
            postalCode: 'postal-code',
            fullStreetAddress: 'street-address',
            creditCardNumber: 'cc-number',
            name: 'name',
            givenName: 'given-name',
            familyName: 'family-name',
        };
        return contentTypeMap[textContentType] || 'off';
    }
    return 'off';
}
/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(str) {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}
/**
 * Convert value to CSS-compatible format
 */
function convertValue(key, value) {
    const unitlessProperties = [
        'fontWeight',
        'lineHeight',
        'opacity',
    ];
    if (typeof value === 'number' && !unitlessProperties.includes(key)) {
        return `${value}px`;
    }
    return String(value);
}
// ============================================================================
// TextInput Utilities
// ============================================================================
/**
 * Create a TextInput reference
 */
export function createTextInputRef() {
    const state = { inputElement: null };
    return {
        focus() {
            state.inputElement?.focus();
        },
        blur() {
            state.inputElement?.blur();
        },
        clear() {
            if (state.inputElement) {
                state.inputElement.value = '';
            }
        },
        isFocused() {
            return document.activeElement === state.inputElement;
        },
        setNativeProps(props) {
            if (state.inputElement && props.value !== undefined) {
                state.inputElement.value = props.value;
            }
        },
        setSelection(start, end) {
            state.inputElement?.setSelectionRange(start, end);
        },
    };
}
// ============================================================================
// Exports
// ============================================================================
export default TextInput;
//# sourceMappingURL=TextInput.js.map