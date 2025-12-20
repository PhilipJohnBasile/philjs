/**
 * Optimistic UI helpers for forms
 *
 * Allows updating UI immediately while waiting for server response,
 * then rolling back if the request fails.
 */

import { signal, computed, batch, type Signal } from 'philjs-core/signals';

export interface OptimisticUpdate<T> {
  id: string;
  type: 'add' | 'update' | 'delete';
  data: T;
  timestamp: number;
  pending: boolean;
  error: Error | null;
}

export interface OptimisticOptions {
  /**
   * Timeout for optimistic updates (auto-rollback if not confirmed)
   * @default 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Called when an update times out
   */
  onTimeout?: (update: OptimisticUpdate<any>) => void;

  /**
   * Called when an update is rolled back
   */
  onRollback?: (update: OptimisticUpdate<any>) => void;
}

/**
 * Hook for managing optimistic UI updates
 *
 * @example
 * ```tsx
 * const { data, addOptimistic, confirmUpdate, rollbackUpdate } = useOptimistic(
 *   initialTodos
 * );
 *
 * const handleAddTodo = async (text: string) => {
 *   const tempId = 'temp-' + Date.now();
 *   const newTodo = { id: tempId, text, done: false };
 *
 *   // Add optimistically
 *   addOptimistic('add', tempId, newTodo);
 *
 *   try {
 *     // Make API call
 *     const savedTodo = await fetch('/api/todos', {
 *       method: 'POST',
 *       body: JSON.stringify(newTodo)
 *     }).then(r => r.json());
 *
 *     // Confirm with real data
 *     confirmUpdate(tempId, savedTodo);
 *   } catch (error) {
 *     // Rollback on error
 *     rollbackUpdate(tempId);
 *   }
 * };
 * ```
 */
export function useOptimistic<T extends { id?: string | number }>(
  initialData: T[] | Signal<T[]>,
  options: OptimisticOptions = {}
): {
  /**
   * Current data including optimistic updates
   */
  data: Signal<T[]>;

  /**
   * Pending optimistic updates
   */
  pending: Signal<Map<string, OptimisticUpdate<T>>>;

  /**
   * Add an optimistic update
   */
  addOptimistic: (type: 'add' | 'update' | 'delete', id: string, data: T) => void;

  /**
   * Confirm an optimistic update with real data
   */
  confirmUpdate: (id: string, realData?: T) => void;

  /**
   * Rollback an optimistic update
   */
  rollbackUpdate: (id: string, error?: Error) => void;

  /**
   * Clear all pending updates
   */
  clearPending: () => void;

  /**
   * Check if there are any pending updates
   */
  hasPending: Signal<boolean>;
} {
  const { timeout = 30000, onTimeout, onRollback } = options;

  // Base data (without optimistic updates)
  const baseData = typeof initialData === 'function'
    ? initialData as Signal<T[]>
    : signal(initialData);

  // Pending optimistic updates
  const pending = signal(new Map<string, OptimisticUpdate<T>>());

  // Timeout handles
  const timeouts = new Map<string, number>();

  // Computed data with optimistic updates applied
  const data = computed(() => {
    let result = [...baseData()];
    const updates = pending();

    // Apply optimistic updates in order
    const sortedUpdates = Array.from(updates.values())
      .sort((a, b) => a.timestamp - b.timestamp);

    for (const update of sortedUpdates) {
      if (update.type === 'add') {
        result.push(update.data);
      } else if (update.type === 'update') {
        const index = result.findIndex(item => item.id === update.data.id);
        if (index >= 0) {
          result[index] = update.data;
        }
      } else if (update.type === 'delete') {
        result = result.filter(item => item.id !== update.data.id);
      }
    }

    return result;
  });

  /**
   * Add optimistic update
   */
  const addOptimistic = (
    type: 'add' | 'update' | 'delete',
    id: string,
    updateData: T
  ) => {
    const update: OptimisticUpdate<T> = {
      id,
      type,
      data: updateData,
      timestamp: Date.now(),
      pending: true,
      error: null,
    };

    // Add to pending
    const current = pending();
    current.set(id, update);
    pending.set(new Map(current));

    // Set timeout for auto-rollback
    const handle = window.setTimeout(() => {
      if (pending().has(id)) {
        rollbackUpdate(id);
        onTimeout?.(update);
      }
    }, timeout);

    timeouts.set(id, handle);
  };

  /**
   * Confirm optimistic update with real data
   */
  const confirmUpdate = (id: string, realData?: T) => {
    const update = pending().get(id);
    if (!update) return;

    batch(() => {
      // Update base data
      const current = baseData();
      let newBase = [...current];

      if (update.type === 'add') {
        newBase.push(realData || update.data);
      } else if (update.type === 'update') {
        const index = newBase.findIndex(item => item.id === update.data.id);
        if (index >= 0) {
          newBase[index] = realData || update.data;
        }
      } else if (update.type === 'delete') {
        newBase = newBase.filter(item => item.id !== update.data.id);
      }

      baseData.set(newBase);

      // Remove from pending
      const currentPending = pending();
      currentPending.delete(id);
      pending.set(new Map(currentPending));
    });

    // Clear timeout
    const handle = timeouts.get(id);
    if (handle) {
      clearTimeout(handle);
      timeouts.delete(id);
    }
  };

  /**
   * Rollback optimistic update
   */
  const rollbackUpdate = (id: string, error?: Error) => {
    const update = pending().get(id);
    if (!update) return;

    // Mark as error
    if (error) {
      update.error = error;
      update.pending = false;
    }

    // Remove from pending
    const current = pending();
    current.delete(id);
    pending.set(new Map(current));

    // Clear timeout
    const handle = timeouts.get(id);
    if (handle) {
      clearTimeout(handle);
      timeouts.delete(id);
    }

    onRollback?.(update);
  };

  /**
   * Clear all pending updates
   */
  const clearPending = () => {
    // Clear all timeouts
    timeouts.forEach(handle => clearTimeout(handle));
    timeouts.clear();

    // Clear pending
    pending.set(new Map());
  };

  /**
   * Check if there are pending updates
   */
  const hasPending = computed(() => pending().size > 0);

  return {
    data,
    pending,
    addOptimistic,
    confirmUpdate,
    rollbackUpdate,
    clearPending,
    hasPending,
  };
}

/**
 * Simple optimistic update wrapper for single values
 *
 * @example
 * ```tsx
 * const { value, update, confirm, rollback } = useOptimisticValue(0);
 *
 * const handleIncrement = async () => {
 *   update(value() + 1);
 *
 *   try {
 *     const newValue = await fetch('/api/increment').then(r => r.json());
 *     confirm(newValue);
 *   } catch (err) {
 *     rollback();
 *   }
 * };
 * ```
 */
export function useOptimisticValue<T>(initialValue: T): {
  /**
   * Current value (optimistic or confirmed)
   */
  value: Signal<T>;

  /**
   * Is there a pending update?
   */
  isPending: Signal<boolean>;

  /**
   * Update value optimistically
   */
  update: (newValue: T) => void;

  /**
   * Confirm optimistic update
   */
  confirm: (confirmedValue?: T) => void;

  /**
   * Rollback to previous value
   */
  rollback: () => void;

  /**
   * Reset to initial value
   */
  reset: () => void;
} {
  const baseValue = signal(initialValue);
  const optimisticValue = signal<T | null>(null);
  const isPending = signal(false);

  const value = computed(() => {
    const opt = optimisticValue();
    return opt !== null ? opt : baseValue();
  });

  const update = (newValue: T) => {
    optimisticValue.set(newValue);
    isPending.set(true);
  };

  const confirm = (confirmedValue?: T) => {
    baseValue.set(confirmedValue !== undefined ? confirmedValue : optimisticValue()!);
    optimisticValue.set(null);
    isPending.set(false);
  };

  const rollback = () => {
    optimisticValue.set(null);
    isPending.set(false);
  };

  const reset = () => {
    baseValue.set(initialValue);
    optimisticValue.set(null);
    isPending.set(false);
  };

  return {
    value,
    isPending,
    update,
    confirm,
    rollback,
    reset,
  };
}
