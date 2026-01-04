/**
 * Optimistic UI helpers for forms
 *
 * Allows updating UI immediately while waiting for server response,
 * then rolling back if the request fails.
 */
import { signal, memo, batch } from '@philjs/core/signals';
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
export function useOptimistic(initialData, options = {}) {
    const { timeout = 30000, onTimeout, onRollback } = options;
    // Base data (without optimistic updates)
    const baseData = typeof initialData === 'function'
        ? initialData
        : signal(initialData);
    // Pending optimistic updates
    const pending = signal(new Map());
    // Timeout handles
    const timeouts = new Map();
    // Computed data with optimistic updates applied
    const data = memo(() => {
        let result = [...baseData()];
        const updates = pending();
        // Apply optimistic updates in order
        const sortedUpdates = Array.from(updates.values())
            .sort((a, b) => a.timestamp - b.timestamp);
        for (const update of sortedUpdates) {
            if (update.type === 'add') {
                result.push(update.data);
            }
            else if (update.type === 'update') {
                const index = result.findIndex(item => item.id === update.data.id);
                if (index >= 0) {
                    result[index] = update.data;
                }
            }
            else if (update.type === 'delete') {
                result = result.filter(item => item.id !== update.data.id);
            }
        }
        return result;
    });
    /**
     * Add optimistic update
     */
    const addOptimistic = (type, id, updateData) => {
        const update = {
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
    const confirmUpdate = (id, realData) => {
        const update = pending().get(id);
        if (!update)
            return;
        batch(() => {
            // Update base data
            const current = baseData();
            let newBase = [...current];
            if (update.type === 'add') {
                newBase.push(realData || update.data);
            }
            else if (update.type === 'update') {
                const index = newBase.findIndex(item => item.id === update.data.id);
                if (index >= 0) {
                    newBase[index] = realData || update.data;
                }
            }
            else if (update.type === 'delete') {
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
    const rollbackUpdate = (id, error) => {
        const update = pending().get(id);
        if (!update)
            return;
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
    const hasPending = memo(() => pending().size > 0);
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
export function useOptimisticValue(initialValue) {
    const baseValue = signal(initialValue);
    const optimisticValue = signal(null);
    const isPending = signal(false);
    const value = memo(() => {
        const opt = optimisticValue();
        return opt !== null ? opt : baseValue();
    });
    const update = (newValue) => {
        optimisticValue.set(newValue);
        isPending.set(true);
    };
    const confirm = (confirmedValue) => {
        baseValue.set(confirmedValue !== undefined ? confirmedValue : optimisticValue());
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
//# sourceMappingURL=optimistic.js.map