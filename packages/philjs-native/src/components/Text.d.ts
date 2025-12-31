/**
 * Text Component
 *
 * A component for displaying text.
 * Supports nesting, styling, and touch handling.
 */
import type { TextStyle } from '../styles.js';
/**
 * Text props
 */
export interface TextProps {
    /**
     * Text content
     */
    children?: string | number | (string | number)[] | any;
    /**
     * Style for the text
     */
    style?: TextStyle | TextStyle[];
    /**
     * Number of lines before truncating
     */
    numberOfLines?: number;
    /**
     * Ellipsize mode
     */
    ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
    /**
     * Test ID for testing
     */
    testID?: string;
    /**
     * Native ID for native reference
     */
    nativeID?: string;
    /**
     * Accessibility label
     */
    accessibilityLabel?: string;
    /**
     * Accessibility role
     */
    accessibilityRole?: 'text' | 'header' | 'link' | 'button';
    /**
     * Whether text is selectable
     */
    selectable?: boolean;
    /**
     * Whether to allow font scaling
     */
    allowFontScaling?: boolean;
    /**
     * Maximum font scale
     */
    maxFontSizeMultiplier?: number;
    /**
     * Minimum font scale
     */
    minimumFontScale?: number;
    /**
     * Callback when text is pressed
     */
    onPress?: () => void;
    /**
     * Callback when text is long pressed
     */
    onLongPress?: () => void;
    /**
     * Callback when text layout changes
     */
    onTextLayout?: (event: TextLayoutEvent) => void;
    /**
     * Text decoration line
     */
    textDecorationLine?: 'none' | 'underline' | 'line-through' | 'underline line-through';
    /**
     * Adjust font size to fit
     */
    adjustsFontSizeToFit?: boolean;
    /**
     * Suppress highlighting on press
     */
    suppressHighlighting?: boolean;
    /**
     * Disabled state
     */
    disabled?: boolean;
    /**
     * Data detector types (iOS)
     */
    dataDetectorType?: 'phoneNumber' | 'link' | 'email' | 'all' | 'none';
}
/**
 * Text layout event
 */
export interface TextLayoutEvent {
    nativeEvent: {
        lines: TextLine[];
    };
}
/**
 * Text line info
 */
export interface TextLine {
    ascender: number;
    capHeight: number;
    descender: number;
    height: number;
    text: string;
    width: number;
    x: number;
    xHeight: number;
    y: number;
}
/**
 * Create a Text component
 */
export declare function Text(props: TextProps): any;
export default Text;
//# sourceMappingURL=Text.d.ts.map