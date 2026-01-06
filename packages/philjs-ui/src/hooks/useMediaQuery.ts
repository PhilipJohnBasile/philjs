/**
 * PhilJS UI - useMediaQuery Hook
 *
 * Reactive media query matching for responsive components.
 */

import { signal, effect, onCleanup, type Signal } from '@philjs/core';

/**
 * Common breakpoint presets
 */
export const breakpoints = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
  dark: '(prefers-color-scheme: dark)',
  light: '(prefers-color-scheme: light)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
  highContrast: '(prefers-contrast: high)',
  touch: '(hover: none) and (pointer: coarse)',
  mouse: '(hover: hover) and (pointer: fine)',
} as const;

export type BreakpointKey = keyof typeof breakpoints;

/**
 * Subscribes to a media query and returns a signal with the match state.
 *
 * @example
 * ```tsx
 * function ResponsiveComponent() {
 *   const isMobile = useMediaQuery('(max-width: 768px)');
 *   const isDark = useMediaQuery(breakpoints.dark);
 *
 *   return (
 *     <div>
 *       {isMobile() ? 'Mobile view' : 'Desktop view'}
 *       {isDark() ? 'Dark mode' : 'Light mode'}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMediaQuery(query: string): Signal<boolean> {
  // Check if we're in a browser environment
  const isClient = typeof window !== 'undefined' && typeof window.matchMedia !== 'undefined';

  // Get initial value
  const getMatches = (): boolean => {
    if (!isClient) return false;
    return window.matchMedia(query).matches;
  };

  const matches = signal(getMatches());

  effect(() => {
    if (!isClient) return;

    const mediaQuery = window.matchMedia(query);

    // Update signal when media query changes
    const handleChange = (event: MediaQueryListEvent) => {
      matches.set(event.matches);
    };

    // Modern browsers
    mediaQuery.addEventListener('change', handleChange);

    // Ensure initial value is correct
    matches.set(mediaQuery.matches);

    onCleanup(() => {
      mediaQuery.removeEventListener('change', handleChange);
    });
  });

  return matches;
}

/**
 * Subscribes to a named breakpoint from the preset list.
 *
 * @example
 * ```tsx
 * const isDesktop = useBreakpoint('desktop');
 * const prefersReducedMotion = useBreakpoint('reducedMotion');
 * ```
 */
export function useBreakpoint(breakpoint: BreakpointKey): Signal<boolean> {
  return useMediaQuery(breakpoints[breakpoint]);
}

/**
 * Returns the current breakpoint name based on window width.
 *
 * @example
 * ```tsx
 * const currentBreakpoint = useCurrentBreakpoint();
 * // Returns 'sm', 'md', 'lg', 'xl', or '2xl'
 * ```
 */
export function useCurrentBreakpoint(): Signal<'sm' | 'md' | 'lg' | 'xl' | '2xl' | null> {
  const sm = useMediaQuery(breakpoints.sm);
  const md = useMediaQuery(breakpoints.md);
  const lg = useMediaQuery(breakpoints.lg);
  const xl = useMediaQuery(breakpoints.xl);
  const xxl = useMediaQuery(breakpoints['2xl']);

  const current = signal<'sm' | 'md' | 'lg' | 'xl' | '2xl' | null>(null);

  effect(() => {
    if (xxl()) {
      current.set('2xl');
    } else if (xl()) {
      current.set('xl');
    } else if (lg()) {
      current.set('lg');
    } else if (md()) {
      current.set('md');
    } else if (sm()) {
      current.set('sm');
    } else {
      current.set(null);
    }
  });

  return current;
}

/**
 * Checks if the user prefers reduced motion.
 */
export function usePrefersReducedMotion(): Signal<boolean> {
  return useMediaQuery(breakpoints.reducedMotion);
}

/**
 * Checks if the user prefers dark color scheme.
 */
export function usePrefersDark(): Signal<boolean> {
  return useMediaQuery(breakpoints.dark);
}

/**
 * Checks if the device has touch input.
 */
export function useIsTouchDevice(): Signal<boolean> {
  return useMediaQuery(breakpoints.touch);
}

export default useMediaQuery;
