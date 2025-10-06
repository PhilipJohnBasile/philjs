/**
 * Generate TypeScript types for file-based routes
 */

import * as fs from "fs/promises";
import * as path from "path";
import * as pc from "picocolors";

export async function generateTypes() {
  const routesDir = path.join(process.cwd(), "src/routes");

  try {
    await fs.access(routesDir);
  } catch {
    console.error(pc.red("No routes directory found at src/routes"));
    return;
  }

  const routes = await discoverRoutes(routesDir);

  // Generate route types
  const typeDefinitions = generateRouteTypes(routes);

  const outputPath = path.join(process.cwd(), "src/route-types.d.ts");
  await fs.writeFile(outputPath, typeDefinitions, "utf-8");

  console.log(pc.green(`✓ Generated types for ${routes.length} routes`));
  console.log(pc.dim(`  ${outputPath}`));
}

async function discoverRoutes(
  dir: string,
  base = ""
): Promise<Array<{ path: string; file: string }>> {
  const routes: Array<{ path: string; file: string }> = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const routePath = path.join(base, entry.name);

    if (entry.isDirectory()) {
      routes.push(...(await discoverRoutes(fullPath, routePath)));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))
    ) {
      // Convert file path to route path
      let route = routePath
        .replace(/\\/g, "/")
        .replace(/\.(tsx|ts)$/, "")
        .replace(/index$/, "")
        .replace(/\[([^\]]+)\]/g, ":$1"); // [id] -> :id

      if (!route.startsWith("/")) route = "/" + route;
      if (route.endsWith("/")) route = route.slice(0, -1);
      if (route === "") route = "/";

      routes.push({ path: route, file: fullPath });
    }
  }

  return routes;
}

function generateRouteTypes(routes: Array<{ path: string; file: string }>) {
  const routePaths = routes.map((r) => r.path);

  // Extract route params
  const routeParams: Record<string, string[]> = {};
  for (const route of routes) {
    const params = route.path.match(/:([a-zA-Z0-9_]+)/g);
    if (params) {
      routeParams[route.path] = params.map((p) => p.slice(1));
    }
  }

  return `/**
 * Auto-generated route types for PhilJS
 * Do not edit manually
 */

declare module "philjs-router" {
  export type RoutePath = ${routePaths.map((p) => `"${p}"`).join(" | ")};

  export type RouteParams<T extends RoutePath> = ${
    Object.keys(routeParams).length > 0
      ? Object.entries(routeParams)
          .map(
            ([path, params]) =>
              `T extends "${path}" ? { ${params.map((p) => `${p}: string`).join(", ")} } :`
          )
          .join("\n    ") + "\n    never"
      : "never"
  };

  export function navigate<T extends RoutePath>(
    path: T,
    ...params: RouteParams<T> extends never ? [] : [RouteParams<T>]
  ): void;
}

export {};
`;
}
