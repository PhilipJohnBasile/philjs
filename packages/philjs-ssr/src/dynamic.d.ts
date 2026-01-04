/**
 * Dynamic Boundary Component for Partial Prerendering (PPR)
 *
 * The `dynamic` component marks content that should be rendered at request time
 * rather than being prerendered at build time. This enables fresh data fetching
 * while maintaining the performance benefits of static shells.
 *
 * @example
 * ```tsx
 * import { dynamic } from '@philjs/ssr';
 *
 * function Page() {
 *   return (
 *     <div>
 *       <Header />
 *       <dynamic fallback={<Skeleton />}>
 *         <UserProfile />
 *       </dynamic>
 *     </div>
 *   );
 * }
 * ```
 */
import type { VNode } from "@philjs/core";
import type { DynamicProps, PPRContext } from "./ppr-types.js";
/**
 * Symbol to identify dynamic components
 */
export declare const DYNAMIC_SYMBOL: unique symbol;
/**
 * Check if a value is a dynamic component
 */
export declare function isDynamic(value: unknown): boolean;
/**
 * Marks content for dynamic (request-time) rendering in PPR.
 *
 * During build time, this component renders only the fallback placeholder.
 * During request time, the actual children are rendered and streamed.
 */
export declare function dynamic(props: DynamicProps): VNode;
/**
 * Register a dynamic boundary in the PPR context
 */
export declare function registerDynamicBoundary(ctx: PPRContext, props: DynamicProps): {
    id: string;
    placeholders: {
        start: string;
        end: string;
        fallbackStart: string;
        fallbackEnd: string;
    };
};
/**
 * Create a dynamic component with pre-configured options
 */
export declare function createDynamic(defaultOptions: Partial<Omit<DynamicProps, "children">>): (props: DynamicProps) => VNode;
/**
 * High-priority dynamic content (rendered first in stream)
 */
export declare const dynamicPriority: (props: DynamicProps) => VNode;
/**
 * Low-priority dynamic content (rendered last in stream)
 */
export declare const dynamicDeferred: (props: DynamicProps) => VNode;
/**
 * Create a dynamic boundary that depends on specific data sources.
 * When any of these sources change, the cached content is invalidated.
 */
export declare function dynamicWithDependencies(dependencies: string[], props: Omit<DynamicProps, "dataDependencies">): VNode;
/**
 * Conditionally render content dynamically based on a condition.
 * Useful for personalization or feature flags.
 */
export declare function dynamicIf(condition: () => boolean | Promise<boolean>, dynamicContent: VNode, staticContent: VNode, options?: Partial<Omit<DynamicProps, "children">>): VNode;
/**
 * Wrap an existing component to make it always dynamic
 */
export declare function makeDynamic<P extends object>(Component: (props: P) => VNode, options?: Partial<Omit<DynamicProps, "children">>): (props: P) => VNode;
/**
 * Get the dynamic boundary ID from a VNode if it's a dynamic component
 */
export declare function getDynamicBoundaryId(vnode: VNode): string | null;
/**
 * Content that is only rendered on the server, never hydrated.
 * Useful for sensitive data or server-only computations.
 */
export declare function serverOnly(props: Omit<DynamicProps, "priority">): VNode;
/**
 * Dynamic content that refreshes based on time intervals.
 * Useful for content that needs periodic updates.
 */
export declare function dynamicWithRevalidation(revalidateSeconds: number, props: Omit<DynamicProps, "dataDependencies">): VNode;
/**
 * Dynamic content that depends on user authentication state.
 * Always rendered at request time to ensure fresh user data.
 */
export declare function dynamicForUser(props: Omit<DynamicProps, "dataDependencies">): VNode;
export type { DynamicProps } from "./ppr-types.js";
//# sourceMappingURL=dynamic.d.ts.map