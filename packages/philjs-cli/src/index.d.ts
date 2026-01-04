/**
 * PhilJS CLI - Main exports
 */
export { startDevServer } from "./dev-server.js";
export { buildProduction } from "./build.js";
export { analyze } from "./analyze.js";
export { generateTypes } from "./generate-types.js";
export { philJSPlugin, philJSSSRPlugin } from "./vite-plugin.js";
export { loadConfig, defineConfig, getGeneratorConfig } from "./config.js";
export { generateComponent, generatePage, generateApi, generateModel, generateScaffold, generateHook, generateContext, generateRoute, generateStore, } from "./generators/index.js";
export type { DevServerOptions } from "./dev-server.js";
export type { BuildOptions } from "./build.js";
export type { PhilJSConfig, GeneratorConfig } from "./config.js";
export type { ComponentOptions, PageOptions, ApiOptions, ModelOptions, ScaffoldOptions, HookOptions, ContextOptions, RouteOptions, StoreOptions, TemplateContext, } from "./generators/index.js";
//# sourceMappingURL=index.d.ts.map