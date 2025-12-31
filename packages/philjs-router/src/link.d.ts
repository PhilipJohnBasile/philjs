/**
 * Enhanced Link Component with Qwik-style Prefetch Modes
 *
 * Prefetch modes:
 * - hover: Prefetch on hover (after configurable delay)
 * - visible: Prefetch when link enters viewport (Intersection Observer)
 * - intent: Prefetch on hover + focus (user intent signals)
 * - render: Prefetch immediately on render (critical paths)
 * - none: No prefetch (for external links or heavy pages)
 */
import type { VNode, JSXElement } from 'philjs-core';
import type { PrefetchMode, PrefetchPriority } from './prefetch.js';
export type { PrefetchMode };
export interface LinkPrefetchOptions {
    /** Prefetch mode */
    mode?: PrefetchMode;
    /** Priority level */
    priority?: PrefetchPriority;
    /** Delay before prefetch starts (for hover mode) */
    delay?: number;
    /** Also prefetch route data (run loader) */
    withData?: boolean;
    /** Preload data immediately (for critical routes) */
    preload?: boolean;
    /** Custom params for data prefetch */
    params?: Record<string, string>;
}
export interface EnhancedLinkProps {
    /** Target URL */
    href: string;
    /** Prefetch mode or options */
    prefetch?: PrefetchMode | LinkPrefetchOptions;
    /** Replace history instead of push */
    replace?: boolean;
    /** Children to render */
    children?: VNode | JSXElement | string;
    /** CSS class name */
    className?: string;
    /** Additional props */
    [key: string]: any;
}
/**
 * Enhanced Link component with Qwik-style prefetching
 *
 * @example
 * ```tsx
 * // Prefetch on hover (default, after 100ms delay)
 * <Link href="/dashboard" prefetch="hover">Dashboard</Link>
 *
 * // Prefetch when visible (Intersection Observer)
 * <Link href="/about" prefetch="visible">About</Link>
 *
 * // Prefetch on intent (hover + focus)
 * <Link href="/users" prefetch="intent">Users</Link>
 *
 * // Prefetch immediately on render
 * <Link href="/critical" prefetch="render">Critical</Link>
 *
 * // No prefetch
 * <Link href="/heavy" prefetch="none">Heavy Page</Link>
 *
 * // With data prefetching
 * <Link href="/users/123" prefetch={{ mode: 'hover', withData: true }}>
 *   User 123
 * </Link>
 * ```
 */
export declare function EnhancedLink(props: EnhancedLinkProps): VNode;
/**
 * Alias for backward compatibility
 */
export declare const PrefetchLink: typeof EnhancedLink;
export interface UsePrefetchLinkOptions extends LinkPrefetchOptions {
    /** Start prefetch immediately */
    immediate?: boolean;
}
export interface UsePrefetchLinkResult {
    /** Trigger prefetch manually */
    prefetch: () => Promise<void>;
    /** Check if prefetched */
    isPrefetched: boolean;
    /** Check if loading */
    isLoading: boolean;
    /** Event handlers to spread on link element */
    handlers: {
        onMouseEnter?: () => void;
        onMouseLeave?: () => void;
        onFocus?: () => void;
        onBlur?: () => void;
    };
}
/**
 * Hook for manual prefetch control
 *
 * @example
 * ```tsx
 * function NavLink({ href, children }) {
 *   const { prefetch, handlers, isPrefetched } = usePrefetchLink(href, {
 *     mode: 'hover',
 *     withData: true,
 *   });
 *
 *   return (
 *     <a
 *       href={href}
 *       {...handlers}
 *       data-prefetched={isPrefetched}
 *     >
 *       {children}
 *     </a>
 *   );
 * }
 * ```
 */
export declare function usePrefetchLink(href: string, options?: UsePrefetchLinkOptions): UsePrefetchLinkResult;
//# sourceMappingURL=link.d.ts.map