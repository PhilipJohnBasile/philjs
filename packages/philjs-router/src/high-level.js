/**
 * High-level router helpers built atop the low-level manifest system.
 * Provides declarative routes, navigation, and view helpers similar to
 * frameworks like Next.js or Remix, but backed by PhilJS signals and resumability.
 *
 * Enhanced with Remix-style nested routes with parallel data loading.
 */
import { render, signal, isResult, isOk, isErr } from "@philjs/core";
import { SmartPreloader, initSmartPreloader, getSmartPreloader, } from "./smart-preload.js";
import { ViewTransitionManager, initViewTransitions, getViewTransitionManager, } from "./view-transitions.js";
import { setCurrentRouteData, clearLoaderData, } from "./loader.js";
import { setRouteError, clearAllRouteErrors, } from "./error-boundary.js";
const routerStateSignal = signal({
    route: null,
    navigate: async () => { },
    matches: [],
});
let activeRouter = null;
/**
 * Create a high-level router with declarative routes.
 * Supports Remix-style nested routes with parallel data loading.
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
    const getMatches = () => routerStateSignal().matches;
    const revalidate = async () => {
        const url = new URL(window.location.href);
        // Clear cached data and re-run loaders
        clearLoaderData();
        await renderCurrentRoute(routeMap, transitionManager, preloader, targetElement, url, navigate, true);
    };
    const router = {
        manifest,
        navigate,
        getCurrentRoute,
        getMatches,
        revalidate,
        dispose: () => {
            window.removeEventListener("popstate", handlePopState);
            window.removeEventListener("philjs:revalidate", handleRevalidate);
            historyListeners.clear();
            activeRouter = null;
            preloader?.clear();
            clearLoaderData();
            clearAllRouteErrors();
        },
    };
    activeRouter = router;
    routerStateSignal.set({ route: null, navigate, matches: [] });
    function handlePopState() {
        void renderCurrentRoute(routeMap, transitionManager, preloader, targetElement, new URL(window.location.href), navigate);
    }
    function handleRevalidate() {
        void revalidate();
    }
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("philjs:revalidate", handleRevalidate);
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
        if (rest["onClick"])
            rest["onClick"](event);
        if (event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.altKey ||
            event.ctrlKey ||
            event.shiftKey) {
            return;
        }
        event.preventDefault();
        return state.navigate(to, replace !== undefined ? { replace } : {});
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
        // Generate route ID (use explicit id or path)
        const routeId = route.id || path;
        const module = {
            default: composeComponent(layouts, route.component),
            ...(route.loader !== undefined && { loader: route.loader }),
            ...(route.action !== undefined && { action: route.action }),
            ...(route.config !== undefined && { config: route.config }),
        };
        manifest[path] = module;
        routeMap.set(path, {
            definition: route,
            module,
            layouts,
            id: routeId,
            ...(parentPath !== null && { parent: parentPath }),
            ...(route.errorBoundary !== undefined && { errorBoundary: route.errorBoundary }),
            ...(route.handle !== undefined && { handle: route.handle }),
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
async function renderCurrentRoute(routeMap, transitionManager, preloader, target, url, navigate, forceRevalidate = false) {
    // Find all matching routes in the hierarchy
    const matchResult = matchNestedRoutes(routeMap, url.pathname);
    if (!matchResult) {
        routerStateSignal.set({ route: null, navigate, matches: [] });
        target.innerHTML = "";
        return;
    }
    const { leafMatch, matches } = matchResult;
    if (preloader) {
        preloader.recordNavigation?.(url.pathname);
    }
    const cacheKey = url.pathname;
    const ssrDataCache = typeof window !== "undefined" ? (window.__PHILJS_ROUTE_DATA__ ||= {}) : undefined;
    const ssrErrorCache = typeof window !== "undefined" ? (window.__PHILJS_ROUTE_ERROR__ ||= {}) : undefined;
    const hasLoader = matches.some((match) => Boolean(match.entry.module.loader));
    const hasSsrCache = !forceRevalidate &&
        ((ssrDataCache && cacheKey in ssrDataCache) ||
            (ssrErrorCache && cacheKey in ssrErrorCache));
    let loadedMatches;
    if (hasSsrCache) {
        const ssrData = ssrDataCache?.[cacheKey];
        const ssrError = ssrErrorCache?.[cacheKey];
        if (ssrDataCache && cacheKey in ssrDataCache) {
            delete ssrDataCache[cacheKey];
        }
        if (ssrErrorCache && cacheKey in ssrErrorCache) {
            delete ssrErrorCache[cacheKey];
        }
        loadedMatches = matches.map((m, i) => ({
            match: m.match,
            entry: m.entry,
            loaderData: i === matches.length - 1 ? ssrData : undefined,
            error: i === matches.length - 1 ? ssrError : undefined,
        }));
    }
    else if (!hasLoader) {
        loadedMatches = matches.map((m) => ({
            match: m.match,
            entry: m.entry,
            loaderData: undefined,
            error: undefined,
        }));
    }
    else {
        // Load all route data in parallel (no waterfall!)
        loadedMatches = await loadAllRouteData(matches, url, ssrDataCache, ssrErrorCache, forceRevalidate);
    }
    // Get leaf route data
    const leafData = loadedMatches[loadedMatches.length - 1];
    const data = leafData?.loaderData;
    const error = leafData?.error;
    const routeInfo = { ...leafMatch, data, error };
    // Create nested matched routes
    const nestedMatches = loadedMatches.map((m, i) => ({
        ...m.match,
        id: m.entry.id,
        ...(i > 0 && { parentId: loadedMatches[i - 1].entry.id }),
        loaderData: m.loaderData,
        error: m.error,
        handle: m.entry.handle,
    }));
    routerStateSignal.set({ route: routeInfo, navigate, matches: nestedMatches });
    // Store data for useLoaderData hook
    for (const loaded of loadedMatches) {
        setCurrentRouteData(loaded.entry.id, loaded.loaderData, loaded.error);
    }
    if (typeof window !== "undefined") {
        const routeInfoStore = (window.__PHILJS_ROUTE_INFO__ ||= {});
        routeInfoStore.current = {
            path: url.pathname,
            params: leafMatch.params,
            error,
        };
        const dataStore = (window.__PHILJS_ROUTE_DATA__ ||= {});
        dataStore[cacheKey] = data;
        const errorStore = (window.__PHILJS_ROUTE_ERROR__ ||= {});
        errorStore[cacheKey] = error;
        // Store matches for useMatches hook
        window.__PHILJS_ROUTE_MATCHES__ = nestedMatches.map((m) => ({
            id: m.id,
            pathname: m.path,
            params: m.params,
            data: m.loaderData,
            handle: m.handle,
        }));
    }
    const renderFn = () => {
        const vnode = leafMatch.component({
            params: leafMatch.params,
            data,
            error,
            url,
            navigate,
            searchParams: url.searchParams,
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
/**
 * Load data for all routes in parallel.
 * This is the key to avoiding waterfalls - all loaders run simultaneously.
 */
async function loadAllRouteData(matches, url, ssrDataCache, ssrErrorCache, forceRevalidate) {
    const cacheKey = url.pathname;
    // Check SSR cache first
    if (!forceRevalidate && ssrDataCache && cacheKey in ssrDataCache) {
        const ssrData = ssrDataCache[cacheKey];
        delete ssrDataCache[cacheKey];
        const ssrError = ssrErrorCache?.[cacheKey];
        if (ssrErrorCache)
            delete ssrErrorCache[cacheKey];
        // For SSR hydration, use cached data for all matches
        return matches.map((m, i) => ({
            match: m.match,
            entry: m.entry,
            loaderData: i === matches.length - 1 ? ssrData : undefined,
            error: i === matches.length - 1 ? ssrError : undefined,
        }));
    }
    // Execute all loaders in parallel
    const loaderPromises = matches.map(async (m) => {
        const { match, entry } = m;
        if (!entry.module.loader) {
            return { match, entry, loaderData: undefined, error: undefined };
        }
        try {
            const result = await entry.module.loader({
                params: match.params,
                request: new Request(url.toString()),
            });
            let loaderData;
            let error;
            if (isResult(result)) {
                if (isOk(result)) {
                    loaderData = result.value;
                }
                else if (isErr(result)) {
                    error = result.error;
                }
            }
            else {
                loaderData = result;
            }
            return { match, entry, loaderData, error };
        }
        catch (err) {
            // Handle error - check for error boundary
            if (entry.errorBoundary) {
                setRouteError(entry.id, err);
            }
            return { match, entry, loaderData: undefined, error: err };
        }
    });
    return Promise.all(loaderPromises);
}
/**
 * Match nested routes and return the full hierarchy.
 */
function matchNestedRoutes(routeMap, pathname) {
    // Find the leaf match
    let leafMatch = null;
    let leafEntry = null;
    for (const [path, entry] of routeMap.entries()) {
        const params = matchPath(path, pathname);
        if (params) {
            leafMatch = {
                path,
                params,
                component: entry.module.default,
                module: entry.module,
            };
            leafEntry = entry;
            break;
        }
    }
    if (!leafMatch || !leafEntry) {
        return null;
    }
    // Build the full match hierarchy (from root to leaf)
    const matches = [];
    // Walk up the tree to collect all parent routes
    const collectParents = (entry, match) => {
        if (entry.parent) {
            const parentEntry = routeMap.get(entry.parent);
            if (parentEntry) {
                const parentMatch = {
                    path: entry.parent,
                    params: match.params,
                    component: parentEntry.module.default,
                    module: parentEntry.module,
                };
                collectParents(parentEntry, parentMatch);
                matches.push({ match: parentMatch, entry: parentEntry });
            }
        }
    };
    collectParents(leafEntry, leafMatch);
    matches.push({ match: leafMatch, entry: leafEntry });
    return { leafMatch, matches };
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