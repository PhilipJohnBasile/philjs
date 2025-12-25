/**
 * Simple router for marketing site.
 */

type RouteModule = {
  loader?: Function;
  action?: Function;
  default?: Function;
};

type RouteEntry = {
  id: string;
  pattern: RegExp;
  module: RouteModule;
  keys: string[];
};

type RouteMatch = {
  entry: RouteEntry;
  params: Record<string, string>;
};

const routes: RouteEntry[] = [];

export function registerRoute(id: string, path: string, module: RouteModule) {
  const keys: string[] = [];
  const pattern = pathToRegex(path, keys);
  routes.push({ id, pattern, module, keys });
}

export function matchRoute(pathname: string): RouteMatch | null {
  for (const route of routes) {
    const match = route.pattern.exec(pathname);
    if (match) {
      const params: Record<string, string> = {};
      route.keys.forEach((key, index) => {
        params[key] = match[index + 1];
      });
      return { entry: route, params };
    }
  }
  return null;
}

function pathToRegex(path: string, keys: string[]): RegExp {
  const pattern = path
    .replace(/\//g, "\\/")
    .replace(/:(\w+)/g, (_, key) => {
      keys.push(key);
      return "([^\\/]+)";
    });
  return new RegExp(`^${pattern}$`);
}

// Register routes
import * as indexRoute from "../routes/index.js";
import * as featuresRoute from "../routes/features.js";
import * as examplesRoute from "../routes/examples.js";
import * as blogRoute from "../routes/blog.js";
import * as blogPostRoute from "../routes/blog-post.js";
import * as communityRoute from "../routes/community.js";

registerRoute("index", "/", indexRoute);
registerRoute("features", "/features", featuresRoute);
registerRoute("examples", "/examples", examplesRoute);
registerRoute("blog", "/blog", blogRoute);
registerRoute("blog-post", "/blog/:slug", blogPostRoute);
registerRoute("community", "/community", communityRoute);
