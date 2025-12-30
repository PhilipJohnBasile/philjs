/**
 * Dynamic Boundary Component for Partial Prerendering (PPR)
 *
 * The `dynamic` component marks content that should be rendered at request time
 * rather than being prerendered at build time. This enables fresh data fetching
 * while maintaining the performance benefits of static shells.
 *
 * @example
 * ```tsx
 * import { dynamic } from 'philjs-ssr';
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

import type { VNode } from "philjs-core";
import type {
  DynamicProps,
  PPRContext,
  DynamicBoundary,
} from "./ppr-types.js";
import {
  PPR_PLACEHOLDER_START,
  PPR_PLACEHOLDER_END,
  PPR_FALLBACK_START,
  PPR_FALLBACK_END,
} from "./ppr-types.js";

// ============================================================================
// Dynamic Component Symbol
// ============================================================================

/**
 * Symbol to identify dynamic components
 */
export const DYNAMIC_SYMBOL = Symbol.for("philjs.dynamic");

/**
 * Check if a value is a dynamic component
 */
export function isDynamic(value: unknown): boolean {
  if (value === null || typeof value !== "object") {
    return false;
  }

  // Check if the VNode itself has __dynamicType in props
  if (
    "props" in value &&
    value.props &&
    typeof value.props === "object" &&
    "__dynamicType" in value.props &&
    (value.props as any).__dynamicType === DYNAMIC_SYMBOL
  ) {
    return true;
  }

  // Check if it's directly marked (for internal use)
  if ("__dynamicType" in value && (value as any).__dynamicType === DYNAMIC_SYMBOL) {
    return true;
  }

  return false;
}

// ============================================================================
// Dynamic Component
// ============================================================================

/**
 * Marks content for dynamic (request-time) rendering in PPR.
 *
 * During build time, this component renders only the fallback placeholder.
 * During request time, the actual children are rendered and streamed.
 */
export function dynamic(props: DynamicProps): VNode {
  return {
    type: DynamicBoundary as any,
    props: {
      ...props,
      __dynamicType: DYNAMIC_SYMBOL,
    },
  } as any;
}

/**
 * Internal dynamic boundary component that handles PPR rendering
 */
function DynamicBoundary(
  props: DynamicProps & { __dynamicType: symbol }
): VNode {
  // This component is handled specially by the PPR renderer
  // During normal rendering, it just renders children
  return props.children;
}

// Attach symbol for identification
(DynamicBoundary as any).__dynamicType = DYNAMIC_SYMBOL;

// ============================================================================
// Dynamic Boundary Registration
// ============================================================================

/**
 * Register a dynamic boundary in the PPR context
 */
export function registerDynamicBoundary(
  ctx: PPRContext,
  props: DynamicProps
): {
  id: string;
  placeholders: { start: string; end: string; fallbackStart: string; fallbackEnd: string };
} {
  const id = props.id || `${ctx.placeholderPrefix}dynamic-${ctx.boundaryId++}`;

  const boundary: DynamicBoundary = {
    id,
    type: "dynamic",
    fallback: props.fallback || null,
    content: props.children,
    priority: props.priority ?? 5,
  };
  if (props.dataDependencies !== undefined) {
    boundary.dataDependencies = props.dataDependencies;
  }

  ctx.boundaries.set(id, boundary);

  return {
    id,
    placeholders: {
      start: PPR_PLACEHOLDER_START(id),
      end: PPR_PLACEHOLDER_END(id),
      fallbackStart: PPR_FALLBACK_START(id),
      fallbackEnd: PPR_FALLBACK_END(id),
    },
  };
}

// ============================================================================
// Dynamic Helpers
// ============================================================================

/**
 * Create a dynamic component with pre-configured options
 */
export function createDynamic(
  defaultOptions: Partial<Omit<DynamicProps, "children">>
) {
  return function configuredDynamic(props: DynamicProps): VNode {
    return dynamic({
      ...defaultOptions,
      ...props,
    });
  };
}

/**
 * High-priority dynamic content (rendered first in stream)
 */
export const dynamicPriority = createDynamic({ priority: 10 });

/**
 * Low-priority dynamic content (rendered last in stream)
 */
export const dynamicDeferred = createDynamic({ priority: 1 });

// ============================================================================
// Dynamic Data Dependencies
// ============================================================================

/**
 * Create a dynamic boundary that depends on specific data sources.
 * When any of these sources change, the cached content is invalidated.
 */
export function dynamicWithDependencies(
  dependencies: string[],
  props: Omit<DynamicProps, "dataDependencies">
): VNode {
  return dynamic({
    ...props,
    dataDependencies: dependencies,
  });
}

// ============================================================================
// Conditional Dynamic Rendering
// ============================================================================

/**
 * Conditionally render content dynamically based on a condition.
 * Useful for personalization or feature flags.
 */
export function dynamicIf(
  condition: () => boolean | Promise<boolean>,
  dynamicContent: VNode,
  staticContent: VNode,
  options?: Partial<Omit<DynamicProps, "children">>
): VNode {
  // The condition is evaluated at request time
  // For build time, we always render the fallback
  return dynamic({
    ...options,
    children: {
      type: ConditionalDynamic as any,
      props: {
        condition,
        dynamicContent,
        staticContent,
      },
    } as any,
    fallback: staticContent,
  });
}

/**
 * Internal component for conditional dynamic rendering
 */
function ConditionalDynamic(props: {
  condition: () => boolean | Promise<boolean>;
  dynamicContent: VNode;
  staticContent: VNode;
}): VNode {
  // This is evaluated at request time
  // The actual implementation happens in the PPR renderer
  return props.dynamicContent;
}

// ============================================================================
// Dynamic Component Utilities
// ============================================================================

/**
 * Wrap an existing component to make it always dynamic
 */
export function makeDynamic<P extends object>(
  Component: (props: P) => VNode,
  options?: Partial<Omit<DynamicProps, "children">>
): (props: P) => VNode {
  return function DynamicWrapper(props: P): VNode {
    return dynamic({
      ...options,
      children: { type: Component, props } as any,
    });
  };
}

/**
 * Get the dynamic boundary ID from a VNode if it's a dynamic component
 */
export function getDynamicBoundaryId(vnode: VNode): string | null {
  if (
    vnode &&
    typeof vnode === "object" &&
    "props" in vnode &&
    vnode.props &&
    typeof vnode.props === "object" &&
    "id" in vnode.props
  ) {
    const props = vnode.props as DynamicProps;
    if (isDynamic(vnode)) {
      return props.id || null;
    }
  }
  return null;
}

// ============================================================================
// Server-Only Dynamic Content
// ============================================================================

/**
 * Content that is only rendered on the server, never hydrated.
 * Useful for sensitive data or server-only computations.
 */
export function serverOnly(props: Omit<DynamicProps, "priority">): VNode {
  return dynamic({
    ...props,
    priority: 10, // Render immediately
  });
}

// ============================================================================
// Time-Based Dynamic Content
// ============================================================================

/**
 * Dynamic content that refreshes based on time intervals.
 * Useful for content that needs periodic updates.
 */
export function dynamicWithRevalidation(
  revalidateSeconds: number,
  props: Omit<DynamicProps, "dataDependencies">
): VNode {
  return dynamic({
    ...props,
    dataDependencies: [`revalidate:${revalidateSeconds}`],
  });
}

// ============================================================================
// User-Specific Dynamic Content
// ============================================================================

/**
 * Dynamic content that depends on user authentication state.
 * Always rendered at request time to ensure fresh user data.
 */
export function dynamicForUser(
  props: Omit<DynamicProps, "dataDependencies">
): VNode {
  return dynamic({
    ...props,
    dataDependencies: ["user:session"],
    priority: 8, // High priority for user-specific content
  });
}

// ============================================================================
// Export Types
// ============================================================================

export type { DynamicProps } from "./ppr-types.js";
