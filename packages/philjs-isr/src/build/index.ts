/**
 * PhilJS ISR Build Module
 *
 * Build-time static generation utilities.
 */

// Path collection
export {
  PathCollector,
  createPathCollector,
  parseRoutePattern,
  isDynamicRoute,
  expandPathTemplate,
  getStaticPaths,
  type CollectedPath,
  type RoutePattern,
  type PathCollectorOptions,
  type PathCollectionResult,
} from './path-collector.js';

// HTML generation
export {
  HTMLGenerator,
  DefaultDocumentWrapper,
  createHTMLGenerator,
  getStaticProps,
  createPrerenderedPage,
  type HTMLGeneratorOptions,
  type DocumentWrapper,
  type DocumentWrapOptions,
  type PageMeta,
  type HTMLGenerationResult,
} from './html-generator.js';

// Static generation
export {
  StaticGenerator,
  createStaticGenerator,
  buildStaticPages,
  type StaticGeneratorOptions,
  type StaticGenerationResult,
  type PageLoader,
  type ComponentRenderer,
} from './static-generator.js';
