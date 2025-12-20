/**
 * PhilJS CLI - Generators Index
 *
 * Export all generators from a single entry point
 */

export { generateComponent, type ComponentOptions } from './component.js';
export { generatePage, type PageOptions } from './page.js';
export { generateApi, type ApiOptions } from './api.js';
export { generateModel, type ModelOptions, type ModelField } from './model.js';
export { generateScaffold, type ScaffoldOptions } from './scaffold.js';
export { generateHook, type HookOptions } from './hook.js';
export { generateContext, type ContextOptions } from './context.js';
export { generateRoute, type RouteOptions } from './route.js';
export { generateStore, type StoreOptions } from './store.js';
export { generateAuth, type AuthGeneratorOptions, type AuthProvider } from './auth.js';
export { renderTemplate, type TemplateContext } from './template-engine.js';
export { generateRSS, type RSSGeneratorOptions } from './rss.js';
export { generateSitemap, type SitemapGeneratorOptions } from './sitemap.js';
