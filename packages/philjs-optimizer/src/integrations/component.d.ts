/**
 * Component lazy loading integration
 */
/**
 * Lazy component wrapper
 */
export interface LazyComponent<P = any> {
    symbolId: string;
    component?: (props: P) => any;
    loaded: boolean;
    fallback?: (props: P) => any;
}
/**
 * Create a lazy component
 */
export declare function lazy<P = any>(loader: () => Promise<any>, options?: {
    fallback?: (props: P) => any;
}): LazyComponent<P>;
/**
 * Load a lazy component
 */
export declare function loadComponent<P = any>(lazyComponent: LazyComponent<P>): Promise<(props: P) => any>;
/**
 * Suspense-like component for lazy loading
 */
export declare function Suspense<P = any>(props: {
    children: any;
    fallback?: any;
    lazy?: LazyComponent<P>;
}): any;
/**
 * Prefetch a component
 */
export declare function prefetchComponent<P = any>(lazyComponent: LazyComponent<P>): Promise<void>;
/**
 * Component registry for tracking lazy components
 */
export declare class ComponentRegistry {
    private components;
    register<P = any>(component: LazyComponent<P>): void;
    get(symbolId: string): LazyComponent | undefined;
    loadAll(): Promise<void>;
    getLoadedCount(): number;
    getTotalCount(): number;
}
/**
 * Global component registry
 */
export declare const componentRegistry: ComponentRegistry;
//# sourceMappingURL=component.d.ts.map