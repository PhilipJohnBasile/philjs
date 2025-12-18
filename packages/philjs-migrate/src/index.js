/**
 * PhilJS Migrate
 *
 * Migration codemods to convert React, Vue, and Svelte applications to PhilJS.
 * Supports automated code transformation with manual review suggestions.
 */
export { migrate } from './migrate';
export { ReactTransform } from './transforms/react';
export { VueTransform } from './transforms/vue';
export { SvelteTransform } from './transforms/svelte';
export { analyzeProject } from './analyze';
export { generateReport } from './report';
//# sourceMappingURL=index.js.map