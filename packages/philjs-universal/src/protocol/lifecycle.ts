/**
 * Lifecycle Management
 * Coordinates component lifecycles across framework boundaries.
 */

import type {
  LifecycleEvent,
  LifecycleHandler,
  ErrorHandler,
  LifecycleManager,
  LifecycleHandle,
} from '../types.js';

/**
 * Implementation of LifecycleHandle
 */
class LifecycleHandleImpl implements LifecycleHandle {
  readonly instanceId: string;
  private handlers = new Map<LifecycleEvent, Set<LifecycleHandler>>();
  private errorHandlers = new Set<ErrorHandler>();
  private disposed = false;

  constructor(instanceId: string) {
    this.instanceId = instanceId;
  }

  on(event: LifecycleEvent, handler: LifecycleHandler): () => void {
    if (this.disposed) {
      console.warn(`[Lifecycle: ${this.instanceId}] Cannot add handler to disposed lifecycle`);
      return () => {};
    }

    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  onError(handler: ErrorHandler): () => void {
    if (this.disposed) {
      console.warn(`[Lifecycle: ${this.instanceId}] Cannot add error handler to disposed lifecycle`);
      return () => {};
    }

    this.errorHandlers.add(handler);

    return () => {
      this.errorHandlers.delete(handler);
    };
  }

  emit(event: LifecycleEvent, error?: Error): void {
    if (this.disposed && event !== 'unmounted') {
      return;
    }

    if (event === 'error' && error) {
      for (const handler of this.errorHandlers) {
        try {
          handler(error);
        } catch (e) {
          console.error(`[Lifecycle: ${this.instanceId}] Error in error handler:`, e);
        }
      }
    }

    const handlers = this.handlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler();
        } catch (e) {
          console.error(`[Lifecycle: ${this.instanceId}] Error in ${event} handler:`, e);
        }
      }
    }
  }

  dispose(): void {
    if (this.disposed) return;

    this.disposed = true;
    this.handlers.clear();
    this.errorHandlers.clear();
  }

  isDisposed(): boolean {
    return this.disposed;
  }
}

/**
 * Implementation of LifecycleManager
 */
export class LifecycleManagerImpl implements LifecycleManager {
  private handles = new Map<string, LifecycleHandleImpl>();

  register(instanceId: string): LifecycleHandle {
    if (this.handles.has(instanceId)) {
      console.warn(`[LifecycleManager] Instance "${instanceId}" already registered`);
      return this.handles.get(instanceId)!;
    }

    const handle = new LifecycleHandleImpl(instanceId);
    this.handles.set(instanceId, handle);
    return handle;
  }

  unregister(instanceId: string): void {
    const handle = this.handles.get(instanceId);
    if (handle) {
      handle.dispose();
      this.handles.delete(instanceId);
    }
  }

  emit(instanceId: string, event: LifecycleEvent, error?: Error): void {
    const handle = this.handles.get(instanceId);
    if (handle) {
      handle.emit(event, error);
    }
  }

  getHandle(instanceId: string): LifecycleHandle | undefined {
    return this.handles.get(instanceId);
  }

  listInstances(): string[] {
    return Array.from(this.handles.keys());
  }

  clear(): void {
    for (const handle of this.handles.values()) {
      handle.dispose();
    }
    this.handles.clear();
  }
}

/**
 * Global lifecycle manager instance
 */
let globalLifecycleManager: LifecycleManagerImpl | null = null;

export function getGlobalLifecycleManager(): LifecycleManagerImpl {
  if (!globalLifecycleManager) {
    globalLifecycleManager = new LifecycleManagerImpl();
  }
  return globalLifecycleManager;
}

/**
 * Create a scoped lifecycle manager
 */
export function createScopedLifecycleManager(): LifecycleManagerImpl {
  return new LifecycleManagerImpl();
}

/**
 * Generate a unique instance ID
 */
let instanceCounter = 0;

export function generateInstanceId(componentName: string): string {
  return `${componentName}-${++instanceCounter}-${Date.now().toString(36)}`;
}

/**
 * Lifecycle phases in order
 */
export const LIFECYCLE_ORDER: LifecycleEvent[] = [
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeUnmount',
  'unmounted',
];

/**
 * Check if a lifecycle event is valid
 */
export function isValidLifecycleEvent(event: string): event is LifecycleEvent {
  return LIFECYCLE_ORDER.includes(event as LifecycleEvent) || event === 'error';
}
