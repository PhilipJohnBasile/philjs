/**
 * PhilJS Migrate
 *
 * Migration codemods to convert React, Vue, and Svelte applications to PhilJS.
 * Supports automated code transformation with manual review suggestions.
 */
export { migrate, MigrationOptions, MigrationResult } from './migrate';
export { ReactTransform } from './transforms/react';
export { VueTransform } from './transforms/vue';
export { SvelteTransform } from './transforms/svelte';
export { analyzeProject, ProjectAnalysis } from './analyze';
export { generateReport, MigrationReport } from './report';
//# sourceMappingURL=index.d.ts.map