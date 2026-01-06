/**
 * PhilJS UI - Hooks
 */

export {
  useClickOutside,
  type UseClickOutsideOptions
} from './useClickOutside.js';

export {
  useFocusTrap,
  getFocusableElements,
  getFirstFocusable,
  getLastFocusable,
  type UseFocusTrapOptions
} from './useFocusTrap.js';

export {
  useMediaQuery,
  useBreakpoint,
  useCurrentBreakpoint,
  usePrefersReducedMotion,
  usePrefersDark,
  useIsTouchDevice,
  breakpoints,
  type BreakpointKey
} from './useMediaQuery.js';

export {
  useId,
  useIds,
  useIdGenerator
} from './useId.js';

export {
  useKeyboard,
  useGlobalKeyboard,
  useRovingTabindex,
  Keys,
  type KeyName,
  type KeyHandlers,
  type UseKeyboardOptions,
  type UseRovingTabindexOptions
} from './useKeyboard.js';
