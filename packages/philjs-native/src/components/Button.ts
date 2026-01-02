/**
 * Button Component
 *
 * A basic button component that renders as a native button on each platform.
 * For more control over styling, use TouchableOpacity or Pressable.
 */

import { signal, type Signal } from '@philjs/core';
import { detectPlatform, nativeBridge, platformSelect } from '../runtime.js';
import type { ViewStyle } from '../styles.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Button props
 */
export interface ButtonProps {
  /**
   * Button title text
   */
  title: string;

  /**
   * Callback when pressed
   */
  onPress: () => void;

  /**
   * Button color
   */
  color?: string;

  /**
   * Whether button is disabled
   */
  disabled?: boolean;

  /**
   * Test ID for testing
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
   * Accessibility state
   */
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    busy?: boolean;
  };

  /**
   * TV preferred focus
   */
  hasTVPreferredFocus?: boolean;

  /**
   * Next focus direction (TV)
   */
  nextFocusDown?: number;
  nextFocusForward?: number;
  nextFocusLeft?: number;
  nextFocusRight?: number;
  nextFocusUp?: number;

  /**
   * Touch sound (Android)
   */
  touchSoundDisabled?: boolean;
}

// ============================================================================
// Button Component
// ============================================================================

/**
 * Create a Button component
 */
export function Button(props: ButtonProps): any {
  const platform = detectPlatform();
  const isPressed = signal(false);

  // Platform-specific default colors
  const defaultColor = platformSelect({
    ios: '#007AFF',
    android: '#2196F3',
    default: '#007AFF',
  });

  const color = props.color || defaultColor;

  if (platform === 'web') {
    const buttonStyle: Record<string, any> = {
      'background-color': props.disabled ? '#CCCCCC' : color,
      color: '#FFFFFF',
      border: 'none',
      'border-radius': '4px',
      padding: '10px 20px',
      'font-size': '16px',
      'font-weight': '600',
      cursor: props.disabled ? 'not-allowed' : 'pointer',
      opacity: isPressed() ? 0.8 : 1,
      transition: 'opacity 0.1s ease-in-out',
      'text-transform': 'uppercase',
      'letter-spacing': '0.5px',
    };

    // Platform-specific styling
    if (platform === 'web') {
      // iOS-like styling
      buttonStyle['border-radius'] = '8px';
      buttonStyle['text-transform'] = 'none';
    }

    const handleClick = (e: any) => {
      if (props.disabled) return;
      e.preventDefault();
      props.onPress();
    };

    const handleMouseDown = () => {
      if (!props.disabled) {
        isPressed.set(true);
      }
    };

    const handleMouseUp = () => {
      isPressed.set(false);
    };

    return {
      type: 'button',
      props: {
        style: buttonStyle,
        disabled: props.disabled,
        'data-testid': props.testID,
        'aria-label': props.accessibilityLabel || props.title,
        'aria-disabled': props.disabled,
        onClick: handleClick,
        onMouseDown: handleMouseDown,
        onMouseUp: handleMouseUp,
        onMouseLeave: handleMouseUp,
        onKeyDown: (e: any) => {
          if ((e.key === 'Enter' || e.key === ' ') && !props.disabled) {
            e.preventDefault();
            props.onPress();
          }
        },
      },
      children: props.title,
    };
  }

  // Return native element descriptor
  return {
    type: 'NativeButton',
    props: {
      ...props,
      color,
    },
    children: null,
  };
}

// ============================================================================
// Exports
// ============================================================================

export default Button;
