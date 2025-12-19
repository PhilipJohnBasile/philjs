/**
 * React component compatibility layer for PhilJS.
 * Export all components with React-compatible APIs.
 */

// Fragment
export { Fragment } from './Fragment.js';

// Suspense
export {
  Suspense,
  SuspenseList,
  useIsSuspended,
  lazy,
  preload,
  type SuspenseProps
} from './Suspense.js';

// Portal
export {
  Portal,
  usePortal,
  ModalPortal,
  TooltipPortal,
  type PortalProps
} from './Portal.js';

// Re-export ErrorBoundary from philjs-core
export { ErrorBoundary, type ErrorBoundaryProps } from 'philjs-core';

// Additional component helpers
export {
  forwardRef,
  memo,
  createRef
} from './helpers.js';
