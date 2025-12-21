/**
 * Text Component
 *
 * A component for displaying text.
 * Supports nesting, styling, and touch handling.
 */

import { detectPlatform } from '../runtime.js';
import type { TextStyle } from '../styles.js';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Text Component
// ============================================================================

/**
 * Create a Text component
 */
export function Text(props: TextProps): any {
  const platform = detectPlatform();

  // Merge styles if array
  const mergedStyle = Array.isArray(props.style)
    ? Object.assign({}, ...props.style.filter(Boolean))
    : props.style || {};

  // Convert style to platform-specific format
  const platformStyle = convertTextStyle(mergedStyle, platform);

  // Add numberOfLines handling
  if (props.numberOfLines !== undefined && platform === 'web') {
    Object.assign(platformStyle, {
      display: '-webkit-box',
      '-webkit-line-clamp': props.numberOfLines,
      '-webkit-box-orient': 'vertical',
      overflow: 'hidden',
      textOverflow: props.ellipsizeMode === 'clip' ? 'clip' : 'ellipsis',
    });
  }

  if (platform === 'web') {
    // Determine element type based on role
    const elementType = props.accessibilityRole === 'header'
      ? 'h1'
      : props.onPress
      ? 'span'
      : 'span';

    return {
      type: elementType,
      props: {
        style: platformStyle,
        'data-testid': props.testID,
        id: props.nativeID,
        'aria-label': props.accessibilityLabel,
        role: props.accessibilityRole,
        onClick: props.disabled ? undefined : props.onPress,
        onContextMenu: props.onLongPress ? (e: any) => {
          e.preventDefault();
          props.onLongPress!();
        } : undefined,
        tabIndex: props.onPress && !props.disabled ? 0 : undefined,
      },
      children: props.children,
    };
  }

  // Return native element descriptor
  return {
    type: 'NativeText',
    props: {
      ...props,
      style: platformStyle,
    },
    children: props.children,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert text style to platform-specific format
 */
function convertTextStyle(style: TextStyle, platform: string): Record<string, any> {
  const result: Record<string, any> = {};

  // Map React Native style properties to CSS
  const styleMap: Record<string, string> = {
    color: 'color',
    fontFamily: 'font-family',
    fontSize: 'font-size',
    fontStyle: 'font-style',
    fontWeight: 'font-weight',
    lineHeight: 'line-height',
    textAlign: 'text-align',
    textDecorationLine: 'text-decoration',
    textDecorationColor: 'text-decoration-color',
    textDecorationStyle: 'text-decoration-style',
    textShadowColor: '--text-shadow-color',
    textShadowOffset: '--text-shadow-offset',
    textShadowRadius: '--text-shadow-radius',
    textTransform: 'text-transform',
    letterSpacing: 'letter-spacing',
    includeFontPadding: '--include-font-padding',
    fontVariant: 'font-variant',
    writingDirection: 'direction',
  };

  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null) continue;

    if (platform === 'web') {
      const cssKey = styleMap[key] || camelToKebab(key);
      result[cssKey] = convertTextValue(key, value);
    } else {
      result[key] = value;
    }
  }

  // Handle text shadow for web
  if (platform === 'web' && style.textShadowColor) {
    const offsetX = (style.textShadowOffset as any)?.width || 0;
    const offsetY = (style.textShadowOffset as any)?.height || 0;
    const radius = style.textShadowRadius || 0;
    result['text-shadow'] = `${offsetX}px ${offsetY}px ${radius}px ${style.textShadowColor}`;
    delete result['--text-shadow-color'];
    delete result['--text-shadow-offset'];
    delete result['--text-shadow-radius'];
  }

  return result;
}

/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

/**
 * Convert text value to CSS-compatible format
 */
function convertTextValue(key: string, value: any): string {
  // Add px to numeric values (except for certain properties)
  const unitlessProperties = [
    'fontWeight',
    'lineHeight',
    'opacity',
  ];

  if (typeof value === 'number' && !unitlessProperties.includes(key)) {
    return `${value}px`;
  }

  // Map font weight numbers to CSS values
  if (key === 'fontWeight' && typeof value === 'number') {
    return String(value);
  }

  // Handle lineHeight as multiplier when unitless
  if (key === 'lineHeight' && typeof value === 'number') {
    return String(value);
  }

  return String(value);
}

// ============================================================================
// Exports
// ============================================================================

export default Text;
