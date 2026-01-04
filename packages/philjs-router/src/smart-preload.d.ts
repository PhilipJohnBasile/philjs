/**
 * Smart Preloading System
 *
 * Predicts user navigation based on:
 * - Hover patterns (time on link, distance traveled)
 * - Mouse trajectory (moving toward a link)
 * - User behavior patterns (frequently visited routes)
 * - Viewport visibility (links about to enter viewport)
 */
export type PreloadStrategy = "hover" | "visible" | "intent" | "eager" | "manual";
export type PreloadOptions = {
    strategy?: PreloadStrategy;
    hoverDelay?: number;
    intentThreshold?: number;
    maxConcurrent?: number;
    priority?: "high" | "low" | "auto";
};
export type UserIntentData = {
    mouseX: number;
    mouseY: number;
    mouseVelocity: number;
    mouseDirection: {
        x: number;
        y: number;
    };
    hoverDuration: number;
    visitHistory: string[];
    currentPath: string;
};
/**
 * Calculate probability that user intends to click a link
 * based on mouse trajectory and position
 */
export declare function calculateClickIntent(mousePos: {
    x: number;
    y: number;
}, mouseVelocity: {
    x: number;
    y: number;
}, linkBounds: DOMRect): number;
/**
 * Predict next navigation based on user history
 */
export declare function predictNextRoute(currentPath: string, visitHistory: string[]): Map<string, number>;
export declare class SmartPreloader {
    private queue;
    private queueStart;
    private loading;
    private loaded;
    private options;
    private mousePos;
    private lastMousePos;
    private mouseVelocity;
    private visitHistory;
    private intentFrame;
    private observers;
    private hoverTimers;
    constructor(options?: PreloadOptions);
    private initMouseTracking;
    private scheduleIntentCheck;
    private checkIntentForVisibleLinks;
    /**
     * Register a link for smart preloading
     */
    register(element: HTMLAnchorElement, options?: PreloadOptions): void;
    private registerHoverPreload;
    private registerVisibilityPreload;
    /**
     * Preload a URL
     */
    preload(url: string, options?: {
        strategy: PreloadStrategy;
        priority?: "high" | "low" | "auto";
    }): Promise<void>;
    private calculatePriority;
    private processQueue;
    private preloadItem;
    private fetchRoute;
    /**
     * Record navigation for history-based prediction
     */
    recordNavigation(path: string): void;
    /**
     * Get preload statistics
     */
    getStats(): {
        loaded: number;
        loading: number;
        queued: number;
        visitHistory: number;
    };
    /**
     * Clear all preload data
     */
    clear(): void;
    /**
     * Cleanup
     */
    destroy(): void;
    private compactQueue;
}
export declare function initSmartPreloader(options?: PreloadOptions): SmartPreloader;
export declare function getSmartPreloader(): SmartPreloader | null;
export declare function usePreload(href: string, options?: PreloadOptions): () => void;
export declare function preloadLink(element: HTMLAnchorElement, options?: PreloadOptions): () => void;
//# sourceMappingURL=smart-preload.d.ts.map