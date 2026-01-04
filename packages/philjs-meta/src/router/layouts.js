/**
 * PhilJS Meta - Nested Layouts Support
 *
 * Implements layout system with support for:
 * - _layout.tsx files for nested layouts
 * - _error.tsx for error boundaries
 * - _loading.tsx for loading states
 * - Layout composition and data passing
 */
/**
 * Create a layout tree from route definitions
 */
export function createLayoutTree(routes) {
    const root = {
        children: new Map(),
        routes: [],
    };
    for (const route of routes) {
        let currentNode = root;
        const segments = route.pattern.split('/').filter(Boolean);
        // Walk through segments, creating nodes as needed
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            if (!currentNode.children.has(segment)) {
                currentNode.children.set(segment, {
                    children: new Map(),
                    routes: [],
                });
            }
            currentNode = currentNode.children.get(segment);
        }
        // Add route to the final node
        currentNode.routes.push(route);
        // Process layouts for this route
        for (let i = 0; i < route.layouts.length; i++) {
            const layoutPath = route.layouts[i];
            const depth = i;
            // Find or create the node for this layout depth
            let layoutNode = root;
            for (let j = 0; j < depth; j++) {
                const seg = segments[j];
                if (layoutNode.children.has(seg)) {
                    layoutNode = layoutNode.children.get(seg);
                }
            }
            // Set layout if not already set
            if (!layoutNode.layout) {
                const newLayout = {
                    filePath: layoutPath,
                    segment: segments[depth - 1] ?? '',
                    depth,
                };
                if (route.error !== undefined) {
                    newLayout.errorBoundary = route.error;
                }
                if (route.loading !== undefined) {
                    newLayout.loading = route.loading;
                }
                layoutNode.layout = newLayout;
            }
        }
    }
    return root;
}
/**
 * Get all layouts for a specific route (from root to leaf)
 */
export function getLayoutsForRoute(route) {
    return route.layouts.map((filePath, index) => {
        const layout = {
            filePath,
            segment: route.pattern.split('/').filter(Boolean)[index - 1] ?? '',
            depth: index,
        };
        if (route.error !== undefined) {
            layout.errorBoundary = route.error;
        }
        if (route.loading !== undefined) {
            layout.loading = route.loading;
        }
        return layout;
    });
}
/**
 * Layout render context manager
 */
export class LayoutContextManager {
    contexts = new Map();
    /**
     * Create a new layout context for a route
     */
    createContext(route, params, searchParams) {
        const context = {
            route,
            params,
            searchParams,
            layoutData: new Map(),
            errors: new Map(),
            loading: new Map(),
        };
        const contextId = route.pattern + JSON.stringify(params);
        this.contexts.set(contextId, context);
        return context;
    }
    /**
     * Get context for a route
     */
    getContext(route, params) {
        const contextId = route.pattern + JSON.stringify(params);
        return this.contexts.get(contextId);
    }
    /**
     * Set layout data
     */
    setLayoutData(context, layoutPath, data) {
        context.layoutData.set(layoutPath, data);
    }
    /**
     * Get layout data
     */
    getLayoutData(context, layoutPath) {
        return context.layoutData.get(layoutPath);
    }
    /**
     * Set error for a layout
     */
    setError(context, layoutPath, error) {
        context.errors.set(layoutPath, error);
    }
    /**
     * Clear error for a layout
     */
    clearError(context, layoutPath) {
        context.errors.delete(layoutPath);
    }
    /**
     * Set loading state for a layout
     */
    setLoading(context, layoutPath, loading) {
        context.loading.set(layoutPath, loading);
    }
    /**
     * Check if any layout is loading
     */
    isLoading(context) {
        for (const loading of context.loading.values()) {
            if (loading)
                return true;
        }
        return false;
    }
    /**
     * Clean up context
     */
    destroyContext(route, params) {
        const contextId = route.pattern + JSON.stringify(params);
        this.contexts.delete(contextId);
    }
}
/**
 * Layout composition utilities
 */
export const LayoutUtils = {
    /**
     * Compose layouts into a nested structure
     */
    composeLayouts(layouts, pageContent, layoutData) {
        return {
            layouts,
            pageContent,
            layoutData,
            render: () => {
                // This will be implemented by the runtime renderer
                return null;
            },
        };
    },
    /**
     * Find the nearest error boundary for a given depth
     */
    findErrorBoundary(layouts, depth) {
        // Search from current depth upwards
        for (let i = depth; i >= 0; i--) {
            if (layouts[i]?.errorBoundary) {
                return layouts[i];
            }
        }
        return undefined;
    },
    /**
     * Find the nearest loading component for a given depth
     */
    findLoading(layouts, depth) {
        // Search from current depth upwards
        for (let i = depth; i >= 0; i--) {
            if (layouts[i]?.loading) {
                return layouts[i];
            }
        }
        return undefined;
    },
    /**
     * Check if a layout path is an ancestor of another
     */
    isAncestor(ancestorPath, descendantPath) {
        return descendantPath.startsWith(ancestorPath);
    },
    /**
     * Get the common ancestor layout between two routes
     */
    getCommonAncestor(layouts1, layouts2) {
        const minLength = Math.min(layouts1.length, layouts2.length);
        let commonAncestor;
        for (let i = 0; i < minLength; i++) {
            if (layouts1[i].filePath === layouts2[i].filePath) {
                commonAncestor = layouts1[i];
            }
            else {
                break;
            }
        }
        return commonAncestor;
    },
};
/**
 * Create error boundary wrapper
 */
export function createErrorBoundary(config = {}) {
    return {
        config,
        wrap: (content) => ({
            content,
            config,
        }),
    };
}
/**
 * Create loading wrapper
 */
export function createLoadingWrapper(config = {}) {
    return {
        config,
        wrap: (content) => ({
            content,
            config,
        }),
    };
}
/**
 * Get parallel route slots for a route
 */
export function getParallelSlots(route, allRoutes) {
    const slots = [];
    // Find sibling routes that are in parallel route directories
    const routeDir = route.filePath.substring(0, route.filePath.lastIndexOf('/'));
    for (const otherRoute of allRoutes) {
        const otherDir = otherRoute.filePath.substring(0, otherRoute.filePath.lastIndexOf('/'));
        // Check if it's in a parallel route directory (starts with @)
        const dirName = otherDir.split('/').pop();
        if (dirName?.startsWith('@')) {
            const slotName = dirName.substring(1);
            // Check if it's a sibling
            const otherParent = otherDir.substring(0, otherDir.lastIndexOf('/'));
            const routeParent = routeDir.substring(0, routeDir.lastIndexOf('/'));
            if (otherParent === routeParent) {
                slots.push({
                    name: slotName,
                    route: otherRoute,
                });
            }
        }
    }
    return slots;
}
/**
 * Parse intercepted route pattern
 */
export function parseInterceptedRoute(pattern) {
    const interceptPatterns = [
        { prefix: '(...)', type: 'root' },
        { prefix: '(..)(..)', type: 'two-levels-up' },
        { prefix: '(..)', type: 'one-level-up' },
        { prefix: '(.)', type: 'same-level' },
    ];
    for (const { prefix, type } of interceptPatterns) {
        if (pattern.includes(prefix)) {
            const originalPattern = pattern.replace(prefix, '');
            return {
                originalPattern,
                interceptPattern: pattern,
                type,
            };
        }
    }
    return null;
}
//# sourceMappingURL=layouts.js.map