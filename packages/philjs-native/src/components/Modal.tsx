// @ts-nocheck
/**
 * PhilJS Native - Modal Component (TSX)
 *
 * A native-style modal component with various presentation styles,
 * animations, and gesture-based dismissal support.
 */

import { signal, effect, type Signal } from 'philjs-core';
import { detectPlatform, platformSelect } from '../runtime.js';
import type { ViewStyle } from '../styles.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Modal presentation style
 */
export type ModalPresentationStyle =
  | 'fullScreen'
  | 'pageSheet'
  | 'formSheet'
  | 'overFullScreen'
  | 'overCurrentContext'
  | 'popover';

/**
 * Modal animation type
 */
export type ModalAnimationType = 'none' | 'slide' | 'fade' | 'scale';

/**
 * Modal swipe direction for dismissal
 */
export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

/**
 * Modal props
 */
export interface ModalProps {
  /** Whether modal is visible */
  visible: boolean;
  /** Close handler */
  onClose: () => void;
  /** Child content */
  children?: any;
  /** Presentation style */
  presentationStyle?: ModalPresentationStyle;
  /** Animation type */
  animationType?: ModalAnimationType;
  /** Animation duration in ms */
  animationDuration?: number;
  /** Whether to show backdrop */
  showBackdrop?: boolean;
  /** Backdrop color */
  backdropColor?: string;
  /** Backdrop opacity */
  backdropOpacity?: number;
  /** Close on backdrop press */
  closeOnBackdropPress?: boolean;
  /** Swipe to dismiss directions */
  swipeDirections?: SwipeDirection[];
  /** Swipe threshold (0-1) */
  swipeThreshold?: number;
  /** Enable keyboard avoiding */
  keyboardAvoidingEnabled?: boolean;
  /** Enable gesture navigation (iOS) */
  gestureEnabled?: boolean;
  /** Custom backdrop component */
  backdropComponent?: () => any;
  /** Content container style */
  contentStyle?: ViewStyle;
  /** Modal container style */
  style?: ViewStyle;
  /** Handle area style (for sheet modals) */
  handleStyle?: ViewStyle;
  /** Show drag handle */
  showHandle?: boolean;
  /** On backdrop press (alternative to closeOnBackdropPress) */
  onBackdropPress?: () => void;
  /** Before close callback */
  onWillClose?: () => void;
  /** After close callback */
  onDidClose?: () => void;
  /** Before open callback */
  onWillOpen?: () => void;
  /** After open callback */
  onDidOpen?: () => void;
  /** Status bar style while modal is open */
  statusBarStyle?: 'light-content' | 'dark-content';
  /** Test ID */
  testID?: string;
}

// ============================================================================
// Constants
// ============================================================================

const ANIMATION_DURATION = 300;
const SWIPE_THRESHOLD = 0.3;
const HANDLE_HEIGHT = 20;
const BACKDROP_OPACITY = 0.5;

// ============================================================================
// State
// ============================================================================

/**
 * Track active modals
 */
const activeModals: Signal<Set<string>> = signal(new Set());
let modalCounter = 0;

// ============================================================================
// Modal Component
// ============================================================================

/**
 * Modal component
 */
export function Modal(props: ModalProps): any {
  const {
    visible,
    onClose,
    children,
    presentationStyle = 'pageSheet',
    animationType = 'slide',
    animationDuration = ANIMATION_DURATION,
    showBackdrop = true,
    backdropColor = '#000000',
    backdropOpacity = BACKDROP_OPACITY,
    closeOnBackdropPress = true,
    swipeDirections = ['down'],
    swipeThreshold = SWIPE_THRESHOLD,
    keyboardAvoidingEnabled = true,
    gestureEnabled = true,
    backdropComponent,
    contentStyle,
    style,
    handleStyle,
    showHandle = presentationStyle === 'pageSheet' || presentationStyle === 'formSheet',
    onBackdropPress,
    onWillClose,
    onDidClose,
    onWillOpen,
    onDidOpen,
    statusBarStyle,
    testID,
  } = props;

  const platform = detectPlatform();
  const modalId = signal(`modal_${++modalCounter}`);
  const isAnimating = signal(false);
  const translateY = signal(0);

  // Handle visibility changes
  effect(() => {
    if (visible) {
      onWillOpen?.();
      isAnimating.set(true);

      const modals = activeModals();
      modals.add(modalId());
      activeModals.set(new Set(modals));

      setTimeout(() => {
        isAnimating.set(false);
        onDidOpen?.();
      }, animationDuration);
    } else {
      const modals = activeModals();
      modals.delete(modalId());
      activeModals.set(new Set(modals));
    }
  });

  // Handle close
  const handleClose = () => {
    if (isAnimating()) return;

    onWillClose?.();
    isAnimating.set(true);

    setTimeout(() => {
      isAnimating.set(false);
      onClose();
      onDidClose?.();
    }, animationDuration);
  };

  // Handle backdrop press
  const handleBackdropPress = () => {
    if (onBackdropPress) {
      onBackdropPress();
    } else if (closeOnBackdropPress) {
      handleClose();
    }
  };

  if (!visible) {
    return null;
  }

  if (platform === 'web') {
    const modalStyles = getModalStyles(presentationStyle);
    const animationStyles = getAnimationStyles(animationType, visible, isAnimating());

    return {
      type: 'div',
      props: {
        style: {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: modalStyles.alignItems,
          justifyContent: modalStyles.justifyContent,
          zIndex: 1000 + activeModals().size,
          ...style,
        },
        'data-testid': testID,
        role: 'dialog',
        'aria-modal': true,
      },
      children: [
        // Backdrop
        showBackdrop && (backdropComponent?.() || {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: backdropColor,
              opacity: backdropOpacity,
              transition: `opacity ${animationDuration}ms ease`,
            },
            onClick: handleBackdropPress,
            'aria-hidden': true,
          },
        }),

        // Content container
        {
          type: 'div',
          props: {
            style: {
              position: 'relative',
              backgroundColor: '#FFFFFF',
              overflow: 'hidden',
              ...modalStyles.content,
              ...animationStyles,
              ...contentStyle,
              transform: translateY() !== 0
                ? `translateY(${translateY()}px)`
                : animationStyles.transform,
              transition: isAnimating()
                ? `all ${animationDuration}ms cubic-bezier(0.32, 0.72, 0, 1)`
                : 'none',
            },
            ...getSwipeHandlers({
              enabled: gestureEnabled && swipeDirections.length > 0,
              directions: swipeDirections,
              threshold: swipeThreshold,
              onSwipe: handleClose,
              translateY,
            }),
          },
          children: [
            // Handle
            showHandle && {
              type: 'div',
              props: {
                style: {
                  width: '100%',
                  height: `${HANDLE_HEIGHT}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: gestureEnabled ? 'grab' : undefined,
                  ...handleStyle,
                },
              },
              children: {
                type: 'div',
                props: {
                  style: {
                    width: '36px',
                    height: '5px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '2.5px',
                  },
                },
              },
            },

            // Content
            {
              type: 'div',
              props: {
                style: {
                  flex: 1,
                  overflow: 'auto',
                  WebkitOverflowScrolling: 'touch',
                },
              },
              children,
            },
          ].filter(Boolean),
        },
      ].filter(Boolean),
    };
  }

  // Native
  return {
    type: 'NativeModal',
    props: {
      visible,
      onClose,
      presentationStyle,
      animationType,
      animationDuration,
      showBackdrop,
      backdropColor,
      backdropOpacity,
      closeOnBackdropPress,
      swipeDirections,
      swipeThreshold,
      keyboardAvoidingEnabled,
      gestureEnabled,
      showHandle,
      statusBarStyle,
      contentStyle,
      handleStyle,
      testID,
    },
    children,
  };
}

// ============================================================================
// Style Helpers
// ============================================================================

function getModalStyles(presentationStyle: ModalPresentationStyle): {
  content: ViewStyle;
  alignItems: string;
  justifyContent: string;
} {
  switch (presentationStyle) {
    case 'fullScreen':
    case 'overFullScreen':
      return {
        content: {
          width: '100%',
          height: '100%',
        },
        alignItems: 'stretch',
        justifyContent: 'stretch',
      };

    case 'pageSheet':
      return {
        content: {
          width: '100%',
          maxHeight: '90%',
          minHeight: '50%',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        },
        alignItems: 'stretch',
        justifyContent: 'flex-end',
      };

    case 'formSheet':
      return {
        content: {
          width: '540px',
          maxWidth: '90%',
          maxHeight: '80%',
          borderRadius: 12,
        },
        alignItems: 'center',
        justifyContent: 'center',
      };

    case 'popover':
      return {
        content: {
          width: 'auto',
          maxWidth: '90%',
          maxHeight: '80%',
          borderRadius: 8,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        },
        alignItems: 'center',
        justifyContent: 'center',
      };

    case 'overCurrentContext':
    default:
      return {
        content: {
          width: '100%',
          height: '100%',
        },
        alignItems: 'stretch',
        justifyContent: 'stretch',
      };
  }
}

function getAnimationStyles(
  animationType: ModalAnimationType,
  visible: boolean,
  isAnimating: boolean
): ViewStyle {
  const entering = visible && isAnimating;
  const exiting = !visible && isAnimating;

  switch (animationType) {
    case 'slide':
      return {
        transform: entering ? 'translateY(0)' : exiting ? 'translateY(100%)' : 'translateY(0)',
      };

    case 'fade':
      return {
        opacity: entering || (!visible && !isAnimating) ? 0 : 1,
      };

    case 'scale':
      return {
        transform: entering ? 'scale(1)' : exiting ? 'scale(0.9)' : 'scale(1)',
        opacity: entering || exiting ? 0.8 : 1,
      };

    case 'none':
    default:
      return {};
  }
}

// ============================================================================
// Swipe Handlers
// ============================================================================

function getSwipeHandlers(options: {
  enabled: boolean;
  directions: SwipeDirection[];
  threshold: number;
  onSwipe: () => void;
  translateY: Signal<number>;
}): Record<string, any> {
  if (!options.enabled) {
    return {};
  }

  let startY = 0;
  let startX = 0;
  let isDragging = false;

  return {
    onTouchStart: (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
      isDragging = true;
    },
    onTouchMove: (e: TouchEvent) => {
      if (!isDragging) return;

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const diffY = currentY - startY;
      const diffX = currentX - startX;

      // Only handle vertical swipe for now
      if (options.directions.includes('down') && diffY > 0) {
        options.translateY.set(diffY);
      } else if (options.directions.includes('up') && diffY < 0) {
        options.translateY.set(diffY);
      }
    },
    onTouchEnd: (e: TouchEvent) => {
      if (!isDragging) return;
      isDragging = false;

      const currentY = options.translateY();
      const screenHeight = window.innerHeight;
      const threshold = screenHeight * options.threshold;

      if (Math.abs(currentY) > threshold) {
        options.onSwipe();
      }

      options.translateY.set(0);
    },
    onMouseDown: (e: MouseEvent) => {
      startY = e.clientY;
      startX = e.clientX;
      isDragging = true;
    },
    onMouseMove: (e: MouseEvent) => {
      if (!isDragging) return;

      const diffY = e.clientY - startY;

      if (options.directions.includes('down') && diffY > 0) {
        options.translateY.set(diffY);
      }
    },
    onMouseUp: () => {
      if (!isDragging) return;
      isDragging = false;

      const currentY = options.translateY();
      const screenHeight = window.innerHeight;
      const threshold = screenHeight * options.threshold;

      if (Math.abs(currentY) > threshold) {
        options.onSwipe();
      }

      options.translateY.set(0);
    },
  };
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook for modal visibility
 */
export function useModal(): {
  visible: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
} {
  const visibleSignal = signal(false);

  return {
    visible: visibleSignal(),
    open: () => visibleSignal.set(true),
    close: () => visibleSignal.set(false),
    toggle: () => visibleSignal.set(!visibleSignal()),
  };
}

/**
 * Hook for modal with data
 */
export function useModalWithData<T>(): {
  visible: boolean;
  data: T | null;
  open: (data: T) => void;
  close: () => void;
} {
  const visibleSignal = signal(false);
  const dataSignal = signal<T | null>(null);

  return {
    visible: visibleSignal(),
    data: dataSignal(),
    open: (data: T) => {
      dataSignal.set(data);
      visibleSignal.set(true);
    },
    close: () => {
      visibleSignal.set(false);
      // Delay clearing data until after animation
      setTimeout(() => dataSignal.set(null), ANIMATION_DURATION);
    },
  };
}

// ============================================================================
// Preset Configurations
// ============================================================================

export const ModalPresets = {
  /** Bottom sheet */
  bottomSheet: {
    presentationStyle: 'pageSheet' as ModalPresentationStyle,
    animationType: 'slide' as ModalAnimationType,
    swipeDirections: ['down'] as SwipeDirection[],
    showHandle: true,
  },

  /** Centered dialog */
  dialog: {
    presentationStyle: 'formSheet' as ModalPresentationStyle,
    animationType: 'scale' as ModalAnimationType,
    swipeDirections: [] as SwipeDirection[],
    showHandle: false,
  },

  /** Fullscreen modal */
  fullscreen: {
    presentationStyle: 'fullScreen' as ModalPresentationStyle,
    animationType: 'slide' as ModalAnimationType,
    swipeDirections: ['down'] as SwipeDirection[],
    showHandle: false,
  },

  /** Alert style */
  alert: {
    presentationStyle: 'formSheet' as ModalPresentationStyle,
    animationType: 'fade' as ModalAnimationType,
    swipeDirections: [] as SwipeDirection[],
    showHandle: false,
    closeOnBackdropPress: false,
    backdropOpacity: 0.4,
  },

  /** Popover */
  popover: {
    presentationStyle: 'popover' as ModalPresentationStyle,
    animationType: 'fade' as ModalAnimationType,
    swipeDirections: [] as SwipeDirection[],
    showHandle: false,
    backdropOpacity: 0.2,
  },
};

// ============================================================================
// Exports
// ============================================================================

export default Modal;
