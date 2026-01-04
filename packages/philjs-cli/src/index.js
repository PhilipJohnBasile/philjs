/**
 * PhilJS CLI - Main exports
 */
// Core CLI functionality
export { startDevServer } from "./dev-server.js";
export { buildProduction } from "./build.js";
export { analyze } from "./analyze.js";
export { generateTypes } from "./generate-types.js";
export { philJSPlugin, philJSSSRPlugin } from "./vite-plugin.js";
// Configuration
export { loadConfig, defineConfig, getGeneratorConfig } from "./config.js";
// Generators
export { generateComponent, generatePage, generateApi, generateModel, generateScaffold, generateHook, generateContext, generateRoute, generateStore, } from "./generators/index.js";
//# sourceMappingURL=index.js.map