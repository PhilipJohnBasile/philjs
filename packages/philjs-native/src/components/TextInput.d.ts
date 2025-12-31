/**
 * TextInput Component
 *
 * A component for text input.
 * Supports various keyboard types, secure entry, and multiline.
 */
import type { TextStyle } from '../styles.js';
/**
 * Keyboard types
 */
export type KeyboardType = 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad' | 'url' | 'ascii-capable' | 'numbers-and-punctuation' | 'name-phone-pad' | 'twitter' | 'web-search' | 'visible-password';
/**
 * Return key types
 */
export type ReturnKeyType = 'done' | 'go' | 'next' | 'search' | 'send' | 'none' | 'previous' | 'default' | 'emergency-call' | 'google' | 'join' | 'route' | 'yahoo';
/**
 * Auto-capitalize types
 */
export type AutoCapitalize = 'none' | 'sentences' | 'words' | 'characters';
/**
 * Text content types
 */
export type TextContentType = 'none' | 'URL' | 'addressCity' | 'addressCityAndState' | 'addressState' | 'countryName' | 'creditCardNumber' | 'emailAddress' | 'familyName' | 'fullStreetAddress' | 'givenName' | 'jobTitle' | 'location' | 'middleName' | 'name' | 'namePrefix' | 'nameSuffix' | 'nickname' | 'organizationName' | 'postalCode' | 'streetAddressLine1' | 'streetAddressLine2' | 'sublocality' | 'telephoneNumber' | 'username' | 'password' | 'newPassword' | 'oneTimeCode';
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
    autoComplete?: 'off' | 'username' | 'password' | 'email' | 'name' | 'tel' | 'street-address' | 'postal-code' | 'cc-number' | 'cc-csc' | 'cc-exp' | 'cc-exp-month' | 'cc-exp-year';
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
/**
 * Create a TextInput component
 */
export declare function TextInput(props: TextInputProps): any;
/**
 * Create a TextInput reference
 */
export declare function createTextInputRef(): TextInputRef;
export default TextInput;
//# sourceMappingURL=TextInput.d.ts.map