/**
 * Nested layouts support for routes.
 * Allows _layout.tsx files to wrap child routes.
 */
export type VNode = any;
export type LayoutComponent = (props: {
    children: VNode;
    params: Record<string, string>;
}) => VNode;
export type LayoutChain = {
    /** Layout component */
    component: LayoutComponent;
    /** File path of the layout */
    filePath: string;
}[];
/**
 * Find all layouts that apply to a route.
 * Searches for _layout files from root to the route's directory.
 *
 * @param routeFilePath - Relative path to the route file
 * @param routesDir - Absolute path to routes directory
 * @param loadModule - Function to dynamically import a layout module
 * @returns Array of layouts from root to leaf
 */
export declare function findLayouts(routeFilePath: string, routesDir: string, loadModule: (path: string) => Promise<{
    default: LayoutComponent;
}>): Promise<LayoutChain>;
/**
 * Wrap a route component with its layout chain.
 * Layouts are applied from root to leaf.
 *
 * @param routeComponent - The route's component
 * @param layouts - Chain of layouts from root to leaf
 * @param params - Route parameters
 * @returns The wrapped component tree
 */
export declare function applyLayouts(routeComponent: VNode, layouts: LayoutChain, params: Record<string, string>): VNode;
//# sourceMappingURL=layouts.d.ts.map