/**
 * Island component loader with automatic code splitting.
 */
export type VNode = any;
export type IslandModule = {
    default: (props: any) => VNode;
};
export type IslandManifest = {
    [key: string]: {
        /** Import path for the island component */
        import: string;
        /** Props to pass to the component */
        props?: Record<string, any>;
        /** Hydration trigger: visible, idle, or immediate */
        trigger?: "visible" | "idle" | "immediate";
    };
};
/**
 * Register an island component loader.
 */
export declare function registerIsland(name: string, loader: () => Promise<IslandModule>): void;
/**
 * Load and hydrate an island component.
 */
export declare function loadIsland(element: Element, manifest: IslandManifest): Promise<void>;
/**
 * Initialize islands with hydration strategies.
 */
export declare function initIslands(manifest: IslandManifest): void;
/**
 * Create an island wrapper component for SSR.
 */
export declare function Island(props: {
    name: string;
    trigger?: "visible" | "idle" | "immediate";
    props?: Record<string, any>;
    children: VNode;
}): VNode;
//# sourceMappingURL=island-loader.d.ts.map