import type { RouteModule } from "@philjs/router";

type RouteEntry = {
  id: string;
  pattern: RegExp;
  paramNames: string[];
  module: RouteModule;
};

type RouteMatch = {
  entry: RouteEntry;
  params: Record<string, string>;
};

const routeModules = import.meta.glob("../routes/**/*.{ts,tsx}", {
  eager: true
});

const entries: RouteEntry[] = Object.entries(routeModules)
  .filter(([path]) => !path.includes(".test."))
  .map(([path, mod]) => createRouteEntry(path, mod as RouteModule));

function normaliseRoutePath(path: string) {
  let result = path
    .replace(/^\.\.\/routes/, "")
    .replace(/\.(tsx|ts)$/, "");

  const segments = result.split("/").filter(Boolean);
  const paramNames: string[] = [];
  const regexParts: string[] = [];

  segments.forEach((segment, index) => {
    if (segment === "index" && index === segments.length - 1) {
      return;
    }

    if (segment.startsWith("[") && segment.endsWith("]")) {
      const param = segment.slice(1, -1);
      paramNames.push(param);
      regexParts.push("([^/]+)");
      return;
    }

    regexParts.push(segment);
  });

  const pathSegments = segments
    .filter((segment, index) => !(segment === "index" && index === segments.length - 1))
    .map((segment) => {
      if (segment.startsWith("[") && segment.endsWith("]")) {
        const param = segment.slice(1, -1);
        return `:${param}`;
      }
      return segment;
    });

  let routePath = `/${pathSegments.join("/")}`;
  if (routePath === "/") {
    return { routePath: "/", paramNames, regex: /^\/?$/ };
  }

  if (routePath.endsWith("/index")) {
    routePath = routePath.slice(0, -"/index".length) || "/";
  }

  if (regexParts.length === 0) {
    return { routePath: "/", paramNames, regex: /^\/?$/ };
  }

  const pattern = new RegExp(`^/${regexParts.join("/")}/?$`);

  return { routePath, paramNames, regex: pattern };
}

function createRouteEntry(path: string, mod: RouteModule): RouteEntry {
  const { routePath, regex, paramNames } = normaliseRoutePath(path);
  return {
    id: routePath,
    pattern: regex,
    paramNames,
    module: mod
  };
}

export function matchRoute(pathname: string): RouteMatch | null {
  for (const entry of entries) {
    const match = entry.pattern.exec(pathname.replace(/\/$/, ""));
    if (!match) continue;

    const params: Record<string, string> = {};
    entry.paramNames.forEach((name, index) => {
      params[name] = match[index + 1];
    });

    return { entry, params };
  }

  return null;
}

export function getRouteEntries() {
  return entries;
}

export function getRouteManifest(): Record<string, RouteModule> {
  return Object.fromEntries(entries.map((entry) => [entry.id, entry.module]));
}
