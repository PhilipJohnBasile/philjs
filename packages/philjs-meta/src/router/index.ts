/**
 * PhilJS Meta - Router Module
 *
 * File-based routing and layout system exports
 */

// File-based routing
export {
  createFileRouter,
  generateRouteManifest,
  matchRoute,
  matchApiRoute,
  type FileRouter,
  type FileRouterOptions,
  type RouteDefinition,
  type RouteManifest,
  type RouteMetadata,
  type RouteSegment,
  type RouteSegmentType,
} from './file-based';

// Layouts
export {
  createLayoutTree,
  getLayoutsForRoute,
  getParallelSlots,
  parseInterceptedRoute,
  createErrorBoundary,
  createLoadingWrapper,
  LayoutContextManager,
  LayoutUtils,
  type LayoutProps,
  type ErrorBoundaryProps,
  type LoadingProps,
  type LayoutDefinition,
  type LayoutTreeNode,
  type LayoutContext,
  type LayoutComposition,
  type ErrorBoundaryConfig,
  type ErrorBoundaryFactory,
  type LoadingConfig,
  type LoadingFactory,
  type ParallelRouteSlot,
  type InterceptedRoute,
} from './layouts';
