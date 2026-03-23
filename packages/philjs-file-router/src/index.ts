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
  GeneratedRoute,
  RouteManifest,
  ScanResult,
  ScannedFile,
  RouteTreeNode,
  VitePluginOptions,
  WebpackPluginOptions,
} from "./types.js";

// Parser - file path parsing utilities
export {
  parseFilePath,
  parseSegment,
  getFileType,
  shouldIgnoreFile,
  shouldIgnoreSegment,
  SPECIAL_FILES,
  IGNORE_PATTERNS,
  ROUTE_EXTENSIONS,
} from "./parser.js";

// Scanner - directory scanning
export {
  scanDirectory,
  flattenRouteTree,
  findNodeByPath,
  getLayoutChain,
} from "./scanner.js";
export type { ScannerConfig } from "./types.js";

// Generator - route manifest generation
export {
  generateRoutes,
  generateManifestCode,
  generateTypeDefinitions,
  generateFromScanResult,
} from "./generator.js";
export type { GeneratorConfig } from "./types.js";
