/**
 * Type-safe Link component for navigation
 */
import type { z } from "zod";
import type { VNode } from "@philjs/core";
import type { RouteDefinition, PathParams, HasParams, LinkPropsWithRoute, LinkPropsWithPath } from "./types.js";
/**
 * Type-safe Link component.
 *
 * When using a route definition, params and search are type-checked:
 * ```typescript
 * <Link
 *   to={userRoute}
 *   params={{ userId: '123' }}
 *   search={{ tab: 'posts' }}
 * >
 *   View User
 * </Link>
 * ```
 *
 * Can also use string paths:
 * ```typescript
 * <Link to="/about">About</Link>
 * ```
 */
export declare function Link<TPath extends string = string, TSearchSchema extends z.ZodType | undefined = undefined>(props: LinkPropsWithRoute<TPath, TSearchSchema> | LinkPropsWithPath): VNode;
/**
 * Navigate link - programmatic navigation helper that returns a VNode.
 * Useful for conditional rendering.
 *
 * @example
 * ```typescript
 * const link = createNavigateLink(userRoute, { userId: '123' }, { tab: 'posts' });
 * // Use link.href to get the URL
 * // Use link.navigate() to navigate programmatically
 * ```
 */
export declare function createNavigateLink<TPath extends string, TSearchSchema extends z.ZodType | undefined>(route: RouteDefinition<TPath, TSearchSchema, unknown>, params: HasParams<TPath> extends true ? PathParams<TPath> : PathParams<TPath> | undefined, search?: TSearchSchema extends z.ZodType ? Partial<z.infer<TSearchSchema>> : never): {
    href: string;
    navigate: (options?: {
        replace?: boolean;
        state?: unknown;
    }) => Promise<void>;
};
/**
 * ActiveLink component - Link that automatically shows active state.
 *
 * @example
 * ```typescript
 * <ActiveLink
 *   to={aboutRoute}
 *   className="nav-link"
 *   activeClassName="nav-link--active"
 * >
 *   About
 * </ActiveLink>
 * ```
 */
export declare function ActiveLink<TPath extends string = string, TSearchSchema extends z.ZodType | undefined = undefined>(props: LinkPropsWithRoute<TPath, TSearchSchema> | LinkPropsWithPath): VNode;
/**
 * NavLink component - Alias for ActiveLink.
 */
export declare const NavLink: typeof ActiveLink;
/**
 * Redirect component - Performs navigation on mount.
 *
 * @example
 * ```typescript
 * function ProtectedRoute() {
 *   if (!isLoggedIn) {
 *     return <Redirect to={loginRoute} />;
 *   }
 *   return <Dashboard />;
 * }
 * ```
 */
export declare function Redirect<TPath extends string = string, TSearchSchema extends z.ZodType | undefined = undefined>(props: {
    to: RouteDefinition<TPath, TSearchSchema, unknown> | string;
    params?: HasParams<TPath> extends true ? PathParams<TPath> : PathParams<TPath> | undefined;
    search?: TSearchSchema extends z.ZodType ? Partial<z.infer<TSearchSchema>> : never;
    replace?: boolean;
}): VNode | null;
//# sourceMappingURL=link.d.ts.map