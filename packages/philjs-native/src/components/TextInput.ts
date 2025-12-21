/**
 * TextInput Component
 *
 * A component for text input.
 * Supports various keyboard types, secure entry, and multiline.
 */

import { signal, effect, type Signal } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';
import type { TextStyle, ViewStyle } from '../styles.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Keyboard types
 */
export type KeyboardType =
  | 'default'
  | 'number-pad'
  | 'decimal-pad'
  | 'numeric'
  | 'email-address'
  | 'phone-pad'
  | 'url'
  | 'ascii-capable'
  | 'numbers-and-punctuation'
  | 'name-phone-pad'
  | 'twitter'
  | 'web-search'
  | 'visible-password';

/**
 * Return key types
 */
export type ReturnKeyType =
  | 'done'
  | 'go'
  | 'next'
  | 'search'
  | 'send'
  | 'none'
  | 'previous'
  | 'default'
  | 'emergency-call'
  | 'google'
  | 'join'
  | 'route'
  | 'yahoo';

/**
 * Auto-capitalize types
 */
export type AutoCapitalize = 'none' | 'sentences' | 'words' | 'characters';

/**
 * Text content types
 */
export type TextContentType =
  | 'none'
  | 'URL'
  | 'addressCity'
  | 'addressCityAndState'
  | 'addressState'
  | 'countryName'
  | 'creditCardNumber'
  | 'emailAddress'
  | 'familyName'
  | 'fullStreetAddress'
  | 'givenName'
  | 'jobTitle'
  | 'location'
  | 'middleName'
  | 'name'
  | 'namePrefix'
  | 'nameSuffix'
  | 'nickname'
  | 'organizationName'
  | 'postalCode'
  | 'streetAddressLine1'
  | 'streetAddressLine2'
  | 'sublocality'
  | 'telephoneNumber'
  | 'username'
  | 'password'
  | 'newPassword'
  | 'oneTimeCode';

/**
 * Selection state
 */
export interface TextInputSelection {
  start: number;
  end: number;
}

/**
 * Change event
 */
export interface TextInputChangeEvent {
  nativeEvent: {
    text: string;
    eventCount?: number;
    target?: number;
  };
}

/**
 * Focus event
 */
export interface TextInputFocusEvent {
  nativeEvent: {
    target: number;
    text: string;
  };
}

/**
 * Content size change event
 */
export interface TextInputContentSizeChangeEvent {
  nativeEvent: {
    contentSize: {
      width: number;
      height: number;
    };
  };
}

/**
 * Selection change event
 */
export interface TextInputSelectionChangeEvent {
  nativeEvent: {
    selection: TextInputSelection;
  };
}

/**
 * Key press event
 */
export interface TextInputKeyPressEvent {
  nativeEvent: {
    key: string;
  };
}

/**
 * TextInput props
 */
export interface TextInputProps {
  /**
   * Current value
   */
  value?: string;

  /**
   * Default value
   */
  defaultValue?: string;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Placeholder text color
   */
  placeholderTextColor?: string;

  /**
   * Style for the input
   */
  style?: TextStyle | TextStyle[];

  /**
   * Whether input is editable
   */
  editable?: boolean;

  /**
   * Keyboard type
   */
  keyboardType?: KeyboardType;

  /**
   * Return key type
   */
  returnKeyType?: ReturnKeyType;

  /**
   * Whether to enable auto-complete
   */
  autoComplete?:
    | 'off'
    | 'username'
    | 'password'
    | 'email'
    | 'name'
    | 'tel'
    | 'street-address'
    | 'postal-code'
    | 'cc-number'
    | 'cc-csc'
    | 'cc-exp'
    | 'cc-exp-month'
    | 'cc-exp-year';

  /**
   * Auto-capitalize behavior
   */
  autoCapitalize?: AutoCapitalize;

  /**
   * Auto-correct behavior
   */
  autoCorrect?: boolean;

  /**
   * Auto-focus on mount
   */
  autoFocus?: boolean;

  /**
   * Blur on submit
   */
  blurOnSubmit?: boolean;

  /**
   * Allow caret to be hidden
   */
  caretHidden?: boolean;

  /**
   * Context menu hidden
   */
  contextMenuHidden?: boolean;

  /**
   * Maximum length
   */
  maxLength?: number;

  /**
   * Whether multiline
   */
  multiline?: boolean;

  /**
   * Number of lines (multiline)
   */
  numberOfLines?: number;

  /**
   * Secure text entry (password)
   */
  secureTextEntry?: boolean;

  /**
   * Selection color
   */
  selectionColor?: string;

  /**
   * Selection state
   */
  selection?: TextInputSelection;

  /**
   * Select text on focus
   */
  selectTextOnFocus?: boolean;

  /**
   * Text content type (iOS)
   */
  textContentType?: TextContentType;

  /**
   * Spell check
   */
  spellCheck?: boolean;

  /**
   * Text align
   */
  textAlign?: 'left' | 'center' | 'right';

  /**
   * Text align vertical (Android)
   */
  textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center';

  /**
   * Callback when text changes
   */
  onChangeText?: (text: string) => void;

  /**
   * Callback on change event
   */
  onChange?: (event: TextInputChangeEvent) => void;

  /**
   * Callback on focus
   */
  onFocus?: (event: TextInputFocusEvent) => void;

  /**
   * Callback on blur
   */
  onBlur?: (event: TextInputFocusEvent) => void;

  /**
   * Callback on submit editing
   */
  onSubmitEditing?: (event: TextInputChangeEvent) => void;

  /**
   * Callback on end editing
   */
  onEndEditing?: (event: TextInputChangeEvent) => void;

  /**
   * Callback on content size change
   */
  onContentSizeChange?: (event: TextInputContentSizeChangeEvent) => void;

  /**
   * Callback on selection change
   */
  onSelectionChange?: (event: TextInputSelectionChangeEvent) => void;

  /**
   * Callback on key press
   */
  onKeyPress?: (event: TextInputKeyPressEvent) => void;

  /**
   * Callback on scroll (multiline)
   */
  onScroll?: (event: any) => void;

  /**
   * Test ID
   */
  testID?: string;

  /**
   * Accessibility label
   */
  accessibilityLabel?: string;

  /**
   * Accessibility hint
   */
  accessibilityHint?: string;

  /**
   * Input access mode (Android)
   */
  inputAccessoryViewID?: string;

  /**
   * Clear button mode (iOS)
   */
  clearButtonMode?: 'never' | 'while-editing' | 'unless-editing' | 'always';

  /**
   * Clear text on focus (iOS)
   */
  clearTextOnFocus?: boolean;

  /**
   * Data detector types (iOS)
   */
  dataDetectorTypes?: 'phoneNumber' | 'link' | 'address' | 'calendarEvent' | 'none' | 'all';

  /**
   * Enable return key automatically
   */
  enablesReturnKeyAutomatically?: boolean;

  /**
   * Keyboard appearance (iOS)
   */
  keyboardAppearance?: 'default' | 'light' | 'dark';

  /**
   * Password rules (iOS)
   */
  passwordRules?: string;

  /**
   * Read only
   */
  readOnly?: boolean;

  /**
   * Rejects spaces (Android)
   */
  rejectResponderTermination?: boolean;

  /**
   * Scroll enabled (multiline)
   */
  scrollEnabled?: boolean;

  /**
   * Disable full screen UI (Android)
   */
  disableFullscreenUI?: boolean;

  /**
   * Import font padding (Android)
   */
  importantForAutofill?: 'auto' | 'no' | 'noExcludeDescendants' | 'yes' | 'yesExcludeDescendants';

  /**
   * Inline image left (Android)
   */
  inlineImageLeft?: string;

  /**
   * Inline image padding (Android)
   */
  inlineImagePadding?: number;

  /**
   * Show soft input on focus (Android)
   */
  showSoftInputOnFocus?: boolean;

  /**
   * Underline color (Android)
   */
  underlineColorAndroid?: string;
}

/**
 * TextInput ref methods
 */
export interface TextInputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  isFocused: () => boolean;
  setNativeProps: (props: Partial<TextInputProps>) => void;
  setSelection: (start: number, end: number) => void;
}

// ============================================================================
// TextInput Component
// ============================================================================

/**
 * Create a TextInput component
 */
export function TextInput(props: TextInputProps): any {
  const platform = detectPlatform();

  // Merge styles if array
  const mergedStyle = Array.isArray(props.style)
    ? Object.assign({}, ...props.style.filter(Boolean))
    : props.style || {};

  const handleChange = (e: any) => {
    const text = e.target.value;
    props.onChangeText?.(text);
    props.onChange?.({
      nativeEvent: {
        text,
        target: 0,
      },
    });
  };

  const handleFocus = (e: any) => {
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

  const handleBlur = (e: any) => {
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

  const handleKeyDown = (e: any) => {
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

  const handleSelectionChange = (e: any) => {
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
function convertInputStyle(style: TextStyle): Record<string, any> {
  const result: Record<string, any> = {
    outline: 'none',
    border: 'none',
    padding: '8px',
    'font-size': '16px',
    'font-family': 'inherit',
  };

  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null) continue;

    const cssKey = camelToKebab(key);
    result[cssKey] = convertValue(key, value);
  }

  return result;
}

/**
 * Map keyboard type to HTML input type
 */
function mapKeyboardType(keyboardType?: KeyboardType, secureTextEntry?: boolean): string {
  if (secureTextEntry) return 'password';

  const typeMap: Record<KeyboardType, string> = {
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
function mapAutoComplete(
  autoComplete?: TextInputProps['autoComplete'],
  textContentType?: TextContentType
): string {
  if (autoComplete) return autoComplete;

  if (textContentType) {
    const contentTypeMap: Partial<Record<TextContentType, string>> = {
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
function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

/**
 * Convert value to CSS-compatible format
 */
function convertValue(key: string, value: any): string {
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
export function createTextInputRef(): TextInputRef {
  const state: { inputElement: HTMLInputElement | HTMLTextAreaElement | null } = { inputElement: null };

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
