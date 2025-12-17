/**
 * High-level router helpers built atop the low-level manifest system.
 * Provides declarative routes, navigation, and view helpers similar to
 * frameworks like Next.js or Remix, but backed by PhilJS signals and resumability.
 */
import { render, signal, isResult, isOk, isErr } from "philjs-core";
import { initSmartPreloader, getSmartPreloader, } from "./smart-preload.js";
import { initViewTransitions, getViewTransitionManager, } from "./view-transitions.js";
const routerStateSignal = signal({
    route: null,
    navigate: async () => { },
});
let activeRouter = null;
/**
 * Create a high-level router with declarative routes.
 */
export function createAppRouter(options) {
    const targetElement = resolveTarget(options.target ?? "#app");
    const preloader = ensureSmartPreloader(options.prefetch);
    const transitionManager = ensureTransitionManager(options.transitions);
    const { manifest, routeMap } = buildManifestGraph(options.routes, normalizeBase(options.base ?? ""));
    const historyListeners = new Set();
    const navigate = async (to, navOptions) => {
        const url = new URL(to, window.location.origin);
        if (navOptions?.replace) {
            window.history.replaceState(navOptions.state ?? {}, "", url.toString());
        }
        else {
            window.history.pushState(navOptions?.state ?? {}, "", url.toString());
        }
        await renderCurrentRoute(routeMap, transitionManager, preloader, targetElement, url, navigate);
        historyListeners.forEach((listener) => listener());
    };
    const getCurrentRoute = () => routerStateSignal().route;
    const router = {
        manifest,
        navigate,
        getCurrentRoute,
        dispose: () => {
            window.removeEventListener("popstate", handlePopState);
            historyListeners.clear();
            activeRouter = null;
            preloader?.clear();
        },
    };
    activeRouter = router;
    routerStateSignal.set({ route: null, navigate });
    function handlePopState() {
        void renderCurrentRoute(routeMap, transitionManager, preloader, targetElement, new URL(window.location.href), navigate);
    }
    window.addEventListener("popstate", handlePopState);
    void renderCurrentRoute(routeMap, transitionManager, preloader, targetElement, new URL(window.location.href), navigate);
    return router;
}
export function createRouteManifest(routes, options = {}) {
    return buildManifestGraph(routes, normalizeBase(options.base ?? "")).manifest;
}
export function createRouteMatcher(routes, options = {}) {
    const { routeMap } = buildManifestGraph(routes, normalizeBase(options.base ?? ""));
    return (pathname) => matchCurrentRoute(routeMap, pathname);
}
export function generateRouteTypes(routes, options = {}) {
    const base = normalizeBase(options.base ?? "");
    const entries = collectRouteEntries(routes, base);
    const inModule = Boolean(options.moduleName);
    const header = inModule
        ? [`declare module "${options.moduleName}" {`, "  export interface RouteParams {"]
        : ["export interface RouteParams {"];
    const entryIndent = inModule ? "    " : "  ";
    const body = entries.map((entry) => formatRouteEntry(entry, entryIndent));
    const footer = inModule
        ? ["  }", "  export type RoutePath = keyof RouteParams;", "}"]
        : ["}", "export type RoutePath = keyof RouteParams;"];
    return [...header, ...body, ...footer, ""].join("\n");
}
/**
 * Hook to access current router state (route + navigate).
 */
export function useRouter() {
    return routerStateSignal();
}
/**
 * Hook to access the current matched route detail.
 */
export function useRoute() {
    return routerStateSignal().route ?? null;
}
/**
 * View component that renders the current route.
 */
export function RouterView() {
    const state = useRouter();
    if (!state.route)
        return null;
    const Component = state.route.component;
    return Component({
        params: state.route.params,
        data: state.route.data,
        error: state.route.error,
        url: new URL(window.location.href),
        navigate: state.navigate,
    });
}
/**
 * Declarative navigation component.
 */
export function Link(props) {
    const { to, replace, children, ...rest } = props;
    const state = useRouter();
    const handleClick = (event) => {
        if (rest.onClick)
            rest.onClick(event);
        if (event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.altKey ||
            event.ctrlKey ||
            event.shiftKey) {
            return;
        }
        event.preventDefault();
        return state.navigate(to, { replace });
    };
    const linkProps = {
        href: to,
        "data-router-link": "",
        ...rest,
        onClick: handleClick,
        children,
    };
    return {
        type: "a",
        props: linkProps,
    };
}
// ----------------------------------------------------------------------------
// Internal helpers
// ----------------------------------------------------------------------------
function ensureSmartPreloader(prefetch) {
    if (!prefetch)
        return null;
    const options = typeof prefetch === "boolean" ? {} : prefetch;
    const existing = getSmartPreloader();
    if (existing)
        return existing;
    return initSmartPreloader({
        strategy: options?.strategy ?? "intent",
        intentThreshold: options?.intentThreshold ?? 0.6,
        priority: options?.priority ?? "auto",
    });
}
function ensureTransitionManager(transitions) {
    if (!transitions)
        return null;
    const existing = getViewTransitionManager();
    if (existing)
        return existing;
    return initViewTransitions();
}
function buildManifestGraph(routes, base) {
    const manifest = Object.create(null);
    const routeMap = new Map();
    addRoutes(routes, base || "", [], null, manifest, routeMap);
    return { manifest, routeMap };
}
function addRoutes(routes, base, parentLayouts, parentPath, manifest, routeMap) {
    for (const route of routes) {
        const path = resolvePath(base, route.path);
        const layouts = [...parentLayouts];
        if (route.layout) {
            layouts.push(route.layout);
        }
        const module = {
            loader: route.loader,
            action: route.action,
            default: composeComponent(layouts, route.component),
            config: route.config,
        };
        manifest[path] = module;
        routeMap.set(path, {
            definition: route,
            module,
            parent: parentPath,
            layouts,
        });
        if (route.children?.length) {
            addRoutes(route.children, path, layouts, path, manifest, routeMap);
        }
    }
}
function collectRouteEntries(routes, base) {
    const entries = [];
    addRouteEntries(routes, base || "", entries);
    return entries;
}
function addRouteEntries(routes, base, entries) {
    for (const route of routes) {
        const path = resolvePath(base, route.path);
        entries.push({ path, params: extractParamsFromPath(path) });
        if (route.children?.length) {
            addRouteEntries(route.children, path, entries);
        }
    }
}
function extractParamsFromPath(path) {
    const parts = path.split("/").filter(Boolean);
    const params = [];
    for (const part of parts) {
        if (part.startsWith(":")) {
            params.push({ name: part.slice(1), type: "string" });
        }
        else if (part === "*") {
            params.push({ name: "*", type: "string" });
        }
    }
    return params;
}
function formatRouteEntry(entry, indent) {
    if (!entry.params.length) {
        return `${indent}${JSON.stringify(entry.path)}: {};`;
    }
    const paramLines = entry.params
        .map((param) => `${indent}  ${JSON.stringify(param.name)}: ${param.type};`)
        .join("\n");
    return `${indent}${JSON.stringify(entry.path)}: {\n${paramLines}\n${indent}};`;
}
function composeComponent(layouts, component) {
    if (!layouts.length) {
        return component;
    }
    return (props) => {
        let output = component(props);
        for (let i = layouts.length - 1; i >= 0; i--) {
            const layout = layouts[i];
            output = layout({ ...props, children: output });
        }
        return output;
    };
}
function resolvePath(base, segment) {
    const normalizedBase = base === "/" ? "" : base;
    const normalizedSegment = segment === "/" ? "" : segment;
    const full = `${normalizedBase}/${normalizedSegment}`.replace(/\/+/g, "/");
    return full || "/";
}
function normalizeBase(base) {
    if (!base)
        return "";
    if (base === "/")
        return "";
    return base.endsWith("/") ? base.slice(0, -1) : base;
}
async function renderCurrentRoute(routeMap, transitionManager, preloader, target, url, navigate) {
    const match = matchCurrentRoute(routeMap, url.pathname);
    if (!match) {
        routerStateSignal.set({ route: null, navigate });
        target.innerHTML = "";
        return;
    }
    if (preloader) {
        preloader.recordNavigation?.(url.pathname);
    }
    const cacheKey = url.pathname;
    const ssrDataCache = typeof window !== "undefined" ? (window.__PHILJS_ROUTE_DATA__ ||= {}) : undefined;
    const ssrErrorCache = typeof window !== "undefined" ? (window.__PHILJS_ROUTE_ERROR__ ||= {}) : undefined;
    let data = undefined;
    let error = undefined;
    if (ssrDataCache && cacheKey in ssrDataCache) {
        data = ssrDataCache[cacheKey];
        delete ssrDataCache[cacheKey];
        if (ssrErrorCache && cacheKey in ssrErrorCache) {
            error = ssrErrorCache[cacheKey];
            delete ssrErrorCache[cacheKey];
        }
    }
    else if (match.module.loader) {
        try {
            const result = await match.module.loader({
                params: match.params,
                request: new Request(url.toString()),
            });
            if (isResult(result)) {
                if (isOk(result)) {
                    data = result.value;
                }
                else if (isErr(result)) {
                    error = result.error;
                }
            }
            else {
                data = result;
            }
        }
        catch (err) {
            error = err;
        }
    }
    const routeInfo = { ...match, data, error };
    routerStateSignal.set({ route: routeInfo, navigate });
    if (typeof window !== "undefined") {
        const routeInfoStore = (window.__PHILJS_ROUTE_INFO__ ||= {});
        routeInfoStore.current = {
            path: url.pathname,
            params: match.params,
            error,
        };
        const dataStore = (window.__PHILJS_ROUTE_DATA__ ||= {});
        dataStore[cacheKey] = data;
        const errorStore = (window.__PHILJS_ROUTE_ERROR__ ||= {});
        errorStore[cacheKey] = error;
    }
    const renderFn = () => {
        const vnode = match.component({
            params: match.params,
            data,
            error,
            url,
            navigate,
        });
        render(vnode, target);
    };
    if (transitionManager) {
        await transitionManager.transition(renderFn);
    }
    else {
        renderFn();
    }
}
function matchCurrentRoute(routeMap, pathname) {
    for (const [path, entry] of routeMap.entries()) {
        const params = matchPath(path, pathname);
        if (params) {
            return {
                path,
                params,
                component: entry.module.default,
                module: entry.module,
            };
        }
    }
    return null;
}
function matchPath(pattern, pathname) {
    const patternParts = pattern.split("/").filter(Boolean);
    const pathParts = pathname.split("/").filter(Boolean);
    if (patternParts.length !== pathParts.length)
        return null;
    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
        const segment = patternParts[i];
        const value = pathParts[i];
        if (segment.startsWith(":")) {
            params[segment.slice(1)] = decodeURIComponent(value);
        }
        else if (segment === "*") {
            params["*"] = pathParts.slice(i).join("/");
            return params;
        }
        else if (segment !== value) {
            return null;
        }
    }
    return params;
}
function resolveTarget(target) {
    if (typeof target === "string") {
        const el = document.querySelector(target);
        if (!el) {
            throw new Error(`[PhilJS Router] Could not find target element "${target}"`);
        }
        return el;
    }
    if (target && target instanceof HTMLElement) {
        return target;
    }
    const fallback = document.getElementById("app");
    if (!fallback) {
        throw new Error('[PhilJS Router] Could not find router target. Provide options.target or add an element with id="app".');
    }
    return fallback;
}
//# sourceMappingURL=high-level.js.map