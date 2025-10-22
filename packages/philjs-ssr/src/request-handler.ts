/**
 * SSR request handler - executes loaders and renders routes.
 */

// Types would come from other packages
export type VNode = any;

import type { Loader, Action, ActionCtx } from "./types.js";
import { isResult, renderToString } from "philjs-core";
import type { RouteMatcher } from "philjs-router";

const defaultRenderToString = async (vnode: VNode): Promise<string> => {
  return renderToString(vnode);
};

function safeSerialize(value: any): string {
  try {
    return JSON.stringify(value ?? null);
  } catch (error) {
    console.warn("Failed to serialize loader data", error);
    return "null";
  }
}

export type RouteModule = {
  loader?: Loader<any>;
  action?: Action<any>;
  default: (props: { data?: any; error?: any; params: Record<string, string> }) => VNode;
};

export type RequestContext = {
  /** Original request object */
  request: Request;
  /** Request URL */
  url: URL;
  /** HTTP method */
  method: string;
  /** Request headers */
  headers: Headers;
  /** Route parameters */
  params: Record<string, string>;
  /** Form data (for POST requests) */
  formData?: FormData;
};

export type RenderOptions = {
  /** Function to match a pathname to a route module */
  match: RouteMatcher;
  /** Base URL for the application */
  baseUrl?: string;
  /** Custom renderer (defaults to philjs-core renderToString) */
  render?: (component: VNode) => Promise<string> | string;
};

/**
 * Handle an SSR request - match route, execute loader, render component.
 */
export async function handleRequest(
  request: Request,
  options: RenderOptions
): Promise<Response> {
  const url = new URL(request.url, options.baseUrl || "http://localhost");
  const pathname = url.pathname;

  // Match route
  const match = options.match(pathname);
  if (!match) {
    return new Response("Not Found", { status: 404 });
  }

  const { module, params } = match;

  try {
    // Load route module
    // Create request context
    const ctx: RequestContext = {
      request,
      url,
      method: request.method,
      headers: request.headers,
      params,
      formData: request.method === "POST" ? await request.formData() : undefined,
    };

    // Handle POST requests (actions)
    if (request.method === "POST" && module.action) {
      const actionCtx: ActionCtx = {
        ...ctx,
        formData: ctx.formData!,  // Safe to assert since we're in POST handler
      };
      const actionResult = await module.action(actionCtx);

      // If action returns a redirect, return it
      if (actionResult && typeof actionResult === "object" && "redirect" in actionResult) {
        return Response.redirect(actionResult.redirect as string, 303);
      }

      // If action returns data, it will be passed to the component
      // For now, reload the page (POST-Redirect-GET pattern)
      return Response.redirect(url.toString(), 303);
    }

    // Execute loader
    let loaderData: any = undefined;
    let loaderError: any = undefined;
    if (module.loader) {
      try {
        const result = await module.loader(ctx);
        if (isResult(result)) {
          if (result.ok) {
            loaderData = result.value;
          } else {
            loaderError = result.error;
          }
        } else {
          loaderData = result;
        }
      } catch (err) {
        loaderError = err;
      }
    }

    // Render component
    const Component = match.component ?? module.default;
    if (!Component) {
      return new Response("No default export in route module", { status: 500 });
    }

    const componentTree = Component({
      data: loaderData,
      error: loaderError,
      params,
      url,
      navigate: async () => {
        throw new Error("navigate() is not available during SSR rendering.");
      },
    });

    // Render to HTML
    const renderer = options.render ?? defaultRenderToString;
    const html = await renderer(componentTree);

    // Wrap in HTML document
    const serializedData = safeSerialize(loaderData);
    const serializedParams = safeSerialize(params);
    const serializedError = safeSerialize(loaderError);

    const document = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PhilJS App</title>
</head>
<body>
  ${html}
  <script>
    (function(){
      const path = ${JSON.stringify(pathname)};
      const data = ${serializedData};
      const params = ${serializedParams};
      const routeInfo = (window.__PHILJS_ROUTE_INFO__ = window.__PHILJS_ROUTE_INFO__ || {});
      routeInfo.current = { path, params, error: ${serializedError} };
      const routeData = (window.__PHILJS_ROUTE_DATA__ = window.__PHILJS_ROUTE_DATA__ || {});
      routeData[path] = data;
      const routeError = (window.__PHILJS_ROUTE_ERROR__ = window.__PHILJS_ROUTE_ERROR__ || {});
      routeError[path] = ${serializedError};
    })();
  </script>
</body>
</html>`;

    return new Response(document, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("Error handling request:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
