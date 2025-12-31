/**
 * Optimistic UI helpers for forms
 *
 * Allows updating UI immediately while waiting for server response,
 * then rolling back if the request fails.
 */
import { type Signal, type Memo } from 'philjs-core/signals';
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
export declare function useOptimistic<T extends {
    id?: string | number;
}>(initialData: T[] | Signal<T[]>, options?: OptimisticOptions): {
    /**
     * Current data including optimistic updates
     */
    data: Memo<T[]>;
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
    hasPending: Memo<boolean>;
};
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
export declare function useOptimisticValue<T>(initialValue: T): {
    /**
     * Current value (optimistic or confirmed)
     */
    value: Memo<T>;
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
};
//# sourceMappingURL=optimistic.d.ts.map