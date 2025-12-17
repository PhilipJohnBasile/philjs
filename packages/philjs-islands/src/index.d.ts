/**
 * Islands architecture for selective hydration.
 */
export { registerIsland, loadIsland, initIslands, Island } from "./island-loader.js";
export type { IslandModule, IslandManifest } from "./island-loader.js";
/**
 * Mount islands marked with the [island] attribute.
 * Loads component chunks on visibility or interaction.
 * @param {HTMLElement} root - Root element to search for islands
 */
export declare function mountIslands(root?: HTMLElement): void;
/**
 * Hydrate a specific island immediately.
 * @param {HTMLElement} element - Island element to hydrate
 */
export declare function hydrateIsland(element: HTMLElement): void;
//# sourceMappingURL=index.d.ts.map