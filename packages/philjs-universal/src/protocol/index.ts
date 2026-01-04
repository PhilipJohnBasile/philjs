/**
 * Protocol module exports
 */

// Component
export {
  createUniversalComponent,
  createSimpleComponent,
  createLazyComponent,
  type CreateComponentOptions,
  type MountUtilities,
  type MountResult,
} from './component.js';

// Registry
export {
  ComponentRegistryImpl,
  getGlobalRegistry,
  createScopedRegistry,
  registerComponent,
  getComponent,
  hasComponent,
} from './registry.js';

// Lifecycle
export {
  LifecycleManagerImpl,
  getGlobalLifecycleManager,
  createScopedLifecycleManager,
  generateInstanceId,
  LIFECYCLE_ORDER,
  isValidLifecycleEvent,
} from './lifecycle.js';
