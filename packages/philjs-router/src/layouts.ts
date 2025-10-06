/**
 * Nested layouts support for routes.
 * Allows _layout.tsx files to wrap child routes.
 */

// VNode type from philjs-core
export type VNode = any;
import { join, dirname } from "node:path";
import { existsSync } from "node:fs";

export type LayoutComponent = (props: { children: VNode; params: Record<string, string> }) => VNode;

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
export async function findLayouts(
  routeFilePath: string,
  routesDir: string,
  loadModule: (path: string) => Promise<{ default: LayoutComponent }>
): Promise<LayoutChain> {
  const layouts: LayoutChain = [];
  const segments = dirname(routeFilePath).split("/").filter(Boolean);

  // Check root layout
  const rootLayoutPath = join(routesDir, "_layout.tsx");
  if (existsSync(rootLayoutPath)) {
    const mod = await loadModule(rootLayoutPath);
    if (mod.default) {
      layouts.push({ component: mod.default, filePath: "_layout.tsx" });
    }
  }

  // Check layouts in each directory segment
  let currentPath = "";
  for (const segment of segments) {
    currentPath = currentPath ? join(currentPath, segment) : segment;

    // Try .tsx, .ts, .jsx, .js
    for (const ext of [".tsx", ".ts", ".jsx", ".js"]) {
      const layoutPath = join(routesDir, currentPath, `_layout${ext}`);
      if (existsSync(layoutPath)) {
        const mod = await loadModule(layoutPath);
        if (mod.default) {
          layouts.push({
            component: mod.default,
            filePath: join(currentPath, `_layout${ext}`),
          });
        }
        break; // Found layout for this level
      }
    }
  }

  return layouts;
}

/**
 * Wrap a route component with its layout chain.
 * Layouts are applied from root to leaf.
 *
 * @param routeComponent - The route's component
 * @param layouts - Chain of layouts from root to leaf
 * @param params - Route parameters
 * @returns The wrapped component tree
 */
export function applyLayouts(
  routeComponent: VNode,
  layouts: LayoutChain,
  params: Record<string, string>
): VNode {
  // Apply layouts from leaf to root (reverse order)
  return layouts.reduceRight((children, layout) => {
    return layout.component({ children, params });
  }, routeComponent);
}
