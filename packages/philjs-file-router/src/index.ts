/**
 * @philjs/file-router
 *
 * Next.js/Nuxt-style file-based routing for PhilJS.
 *
 * @example
 * ```tsx
 * // vite.config.ts
 * import { fileRouter } from '@philjs/file-router/vite';
 *
 * export default defineConfig({
 *   plugins: [
 *     fileRouter({
 *       dir: './src/routes',
 *       extensions: ['.tsx', '.ts'],
 *     }),
 *   ],
 * });
 * ```
 *
 * @example File structure:
 * ```
 * src/routes/
 *   page.tsx                    → /
 *   about/page.tsx              → /about
 *   blog/[slug]/page.tsx        → /blog/:slug
 *   docs/[...path]/page.tsx     → /docs/*path
 *   (marketing)/pricing/page.tsx → /pricing (route group)
 *   @modal/login/page.tsx       → parallel route slot
 *   _components/Header.tsx      → ignored (underscore prefix)
 * ```
 */

// Types
export type {
  SpecialFileType,
  SegmentType,
  ParsedSegment,
  ParsedFilePath,
  RouteModule,
  RouteComponent,
  LoaderFunction,
  LoaderContext,
  ActionFunction,
  ActionContext,
  ErrorComponent,
  LoadingComponent,
  RouteConfig,
  RouteMetadata,
  GeneratedRoute,
  RouteManifest,
  ScanResult,
  ScannedFile,
  RouteNode,
  PluginOptions,
} from "./types.js";

// Parser - file path parsing utilities
export {
  parseFilePath,
  parseSegment,
  isSpecialFile,
  getFileType,
  shouldIgnore,
  SPECIAL_FILES,
  IGNORE_PATTERNS,
  ROUTE_EXTENSIONS,
} from "./parser.js";

// Scanner - directory scanning
export {
  scanDirectory,
  scanFile,
  buildRouteTree,
  flattenRoutes,
  type ScannerConfig,
} from "./scanner.js";

// Generator - route manifest generation
export {
  generateManifest,
  generateRouteCode,
  generateTypeDefinitions,
  generateImports,
  type GeneratorConfig,
} from "./generator.js";
