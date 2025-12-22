/**
 * React Suspense compatibility for PhilJS.
 * Provides async component loading with fallback UI.
 */

import { signal, effect, type Signal } from 'philjs-core';
import type { VNode, JSXElement } from 'philjs-core';

/**
 * Suspense component props.
 */
export interface SuspenseProps {
  /** Fallback UI to show while loading */
  fallback: VNode;
  /** Children to render when loaded */
  children: VNode;
}

/**
 * Internal state for tracking suspense boundaries.
 */
const suspenseState = new Map<symbol, {
  isLoading: Signal<boolean>;
  error: Signal<Error | null>;
}>();

/**
 * React-compatible Suspense component for handling async loading states.
 *
 * @example
 * ```tsx
 * import { Suspense } from 'philjs-react-compat';
 *
 * function App() {
 *   return (
 *     <Suspense fallback={<div>Loading...</div>}>
 *       <AsyncComponent />
 *     </Suspense>
 *   );
 * }
 *
 * async function AsyncComponent() {
 *   const data = await fetchData();
 *   return <div>{data}</div>;
 * }
 * ```
 */
export function Suspense(props: SuspenseProps): JSXElement {
  const { fallback, children } = props;

  const isLoading = signal(false);
  const error = signal<Error | null>(null);
  const content = signal<VNode>(children);

  // Handle async children
  effect(() => {
    if (children && typeof children === 'object' && 'then' in children) {
      isLoading.set(true);
      error.set(null);

      (children as any).then(
        (resolved: VNode) => {
          content.set(resolved);
          isLoading.set(false);
        },
        (err: Error) => {
          error.set(err);
          isLoading.set(false);
        }
      );
    } else {
      content.set(children);
      isLoading.set(false);
    }
  });

  // Render fallback while loading
  if (isLoading()) {
    return fallback as JSXElement;
  }

  // Throw error to error boundary
  if (error()) {
    throw error();
  }

  return content() as JSXElement;
}

/**
 * SuspenseList component for coordinating multiple Suspense boundaries.
 *
 * @example
 * ```tsx
 * import { SuspenseList, Suspense } from 'philjs-react-compat';
 *
 * function App() {
 *   return (
 *     <SuspenseList revealOrder="forwards">
 *       <Suspense fallback={<div>Loading 1...</div>}>
 *         <Component1 />
 *       </Suspense>
 *       <Suspense fallback={<div>Loading 2...</div>}>
 *         <Component2 />
 *       </Suspense>
 *       <Suspense fallback={<div>Loading 3...</div>}>
 *         <Component3 />
 *       </Suspense>
 *     </SuspenseList>
 *   );
 * }
 * ```
 */
export function SuspenseList(props: {
  children: VNode;
  revealOrder?: 'forwards' | 'backwards' | 'together';
  tail?: 'collapsed' | 'hidden';
}): JSXElement {
  const { children, revealOrder = 'together' } = props;

  // For now, just pass through children
  // Full SuspenseList coordination would require more complex state management
  return children as JSXElement;
}

/**
 * Hook to check if component is within a Suspense boundary.
 *
 * @example
 * ```tsx
 * function Component() {
 *   const isInSuspense = useIsSuspended();
 *
 *   if (isInSuspense) {
 *     // Different behavior when inside Suspense
 *   }
 * }
 * ```
 */
export function useIsSuspended(): boolean {
  // This would need context support to track Suspense boundaries
  // For now, return false
  return false;
}

/**
 * Utility to create a lazy-loaded component.
 *
 * @example
 * ```tsx
 * import { lazy, Suspense } from 'philjs-react-compat';
 *
 * const LazyComponent = lazy(() => import('./HeavyComponent'));
 *
 * function App() {
 *   return (
 *     <Suspense fallback={<div>Loading...</div>}>
 *       <LazyComponent />
 *     </Suspense>
 *   );
 * }
 * ```
 */
export function lazy<T extends (...args: any[]) => any>(
  factory: () => Promise<{ default: T }>
): T {
  let Component: T | null = null;
  let loadingPromise: Promise<T> | null = null;

  const LazyComponent = ((...args: any[]) => {
    if (Component) {
      return Component(...args);
    }

    if (!loadingPromise) {
      loadingPromise = factory().then((module) => {
        Component = module.default;
        return Component;
      });
    }

    // Throw promise to be caught by Suspense
    throw loadingPromise;
  }) as T;

  return LazyComponent;
}

/**
 * Preload a lazy component.
 *
 * @example
 * ```tsx
 * const LazyComponent = lazy(() => import('./HeavyComponent'));
 *
 * // Preload on hover
 * <button onMouseEnter={() => preload(LazyComponent)}>
 *   Show Component
 * </button>
 * ```
 */
export function preload<T>(LazyComponent: T): void {
  // Trigger the lazy load
  try {
    (LazyComponent as any)();
  } catch (promise: unknown) {
    // Promise thrown by lazy component
    if (promise && typeof (promise as any).then === 'function') {
      // Let it load in background
    }
  }
}
