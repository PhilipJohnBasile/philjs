/**
 * Undo/Redo history management for the builder
 */
import { signal, memo } from 'philjs-core';
// ============================================================================
// History Manager Implementation
// ============================================================================
/**
 * Create a new history manager
 */
export function createHistoryManager(options = {}) {
    const { maxEntries = 100, onUndo, onRedo, onChange, debounceTime = 300, } = options;
    // State signals
    const entries = signal([]);
    const currentIndex = signal(-1);
    // Transaction state
    let transactionInProgress = false;
    let transactionEntries = [];
    let transactionDescription = '';
    let transactionStartState = null;
    // Debounce state for combining similar actions
    let lastActionType = null;
    let lastActionTime = 0;
    // Notify change listeners
    const notifyChange = () => {
        onChange?.({
            entries: entries(),
            currentIndex: currentIndex(),
            maxEntries,
        });
    };
    /**
     * Push a new entry to the history stack
     */
    const push = (entry) => {
        if (transactionInProgress) {
            // Collect entries during transaction
            transactionEntries.push(entry);
            return;
        }
        const now = Date.now();
        const currentEntries = entries();
        const currentIdx = currentIndex();
        // Check if we should combine with the previous entry (debounce)
        if (debounceTime > 0 &&
            lastActionType === entry.type &&
            now - lastActionTime < debounceTime &&
            currentIdx >= 0) {
            // Update the last entry instead of adding a new one
            const lastEntry = currentEntries[currentIdx];
            const updatedEntry = {
                id: lastEntry.id,
                type: lastEntry.type,
                description: lastEntry.description,
                before: lastEntry.before,
                after: entry.after,
                timestamp: now,
            };
            const newEntries = [...currentEntries];
            newEntries[currentIdx] = updatedEntry;
            entries.set(newEntries);
            lastActionTime = now;
            notifyChange();
            return;
        }
        // Remove any entries after current index (discard redo stack)
        const trimmedEntries = currentEntries.slice(0, currentIdx + 1);
        // Add new entry
        const newEntries = [...trimmedEntries, entry];
        // Enforce max entries limit
        if (newEntries.length > maxEntries) {
            newEntries.shift();
        }
        entries.set(newEntries);
        currentIndex.set(newEntries.length - 1);
        lastActionType = entry.type;
        lastActionTime = now;
        notifyChange();
    };
    /**
     * Undo the last action
     */
    const undo = () => {
        const currentIdx = currentIndex();
        const currentEntries = entries();
        if (currentIdx < 0)
            return;
        const entry = currentEntries[currentIdx];
        if (!entry)
            return;
        // Call the undo callback
        onUndo?.(entry);
        currentIndex.set(currentIdx - 1);
        lastActionType = null; // Reset debounce
        notifyChange();
    };
    /**
     * Redo the last undone action
     */
    const redo = () => {
        const currentIdx = currentIndex();
        const currentEntries = entries();
        if (currentIdx >= currentEntries.length - 1)
            return;
        const nextIdx = currentIdx + 1;
        const entry = currentEntries[nextIdx];
        if (!entry)
            return;
        // Call the redo callback
        onRedo?.(entry);
        currentIndex.set(nextIdx);
        lastActionType = null; // Reset debounce
        notifyChange();
    };
    /**
     * Check if undo is available
     */
    const canUndo = () => {
        return currentIndex() >= 0;
    };
    /**
     * Check if redo is available
     */
    const canRedo = () => {
        return currentIndex() < entries().length - 1;
    };
    /**
     * Get the current history state
     */
    const getState = () => ({
        entries: entries(),
        currentIndex: currentIndex(),
        maxEntries,
    });
    /**
     * Get all history entries
     */
    const getEntries = () => entries();
    /**
     * Get the current position in history
     */
    const getCurrentIndex = () => currentIndex();
    /**
     * Go to a specific point in history
     */
    const goTo = (index) => {
        const currentEntries = entries();
        if (index < -1 || index >= currentEntries.length) {
            console.warn(`Invalid history index: ${index}`);
            return;
        }
        const currentIdx = currentIndex();
        if (index === currentIdx)
            return;
        if (index < currentIdx) {
            // Going back - apply undo for each step
            for (let i = currentIdx; i > index; i--) {
                const entry = currentEntries[i];
                if (entry) {
                    onUndo?.(entry);
                }
            }
        }
        else {
            // Going forward - apply redo for each step
            for (let i = currentIdx + 1; i <= index; i++) {
                const entry = currentEntries[i];
                if (entry) {
                    onRedo?.(entry);
                }
            }
        }
        currentIndex.set(index);
        lastActionType = null;
        notifyChange();
    };
    /**
     * Clear all history
     */
    const clear = () => {
        entries.set([]);
        currentIndex.set(-1);
        transactionInProgress = false;
        transactionEntries = [];
        transactionStartState = null;
        lastActionType = null;
        notifyChange();
    };
    /**
     * Start a transaction (group multiple changes)
     */
    const startTransaction = (description) => {
        if (transactionInProgress) {
            console.warn('Transaction already in progress');
            return;
        }
        transactionInProgress = true;
        transactionDescription = description;
        transactionEntries = [];
        transactionStartState = null;
    };
    /**
     * End the current transaction
     */
    const endTransaction = () => {
        if (!transactionInProgress) {
            console.warn('No transaction in progress');
            return;
        }
        if (transactionEntries.length > 0) {
            // Combine all transaction entries into one
            const firstEntry = transactionEntries[0];
            const lastEntry = transactionEntries[transactionEntries.length - 1];
            const combinedEntry = {
                id: firstEntry.id,
                type: 'batch',
                timestamp: Date.now(),
                description: transactionDescription,
                before: firstEntry.before,
                after: lastEntry.after,
            };
            transactionInProgress = false;
            transactionEntries = [];
            transactionStartState = null;
            push(combinedEntry);
        }
        else {
            transactionInProgress = false;
            transactionEntries = [];
            transactionStartState = null;
        }
    };
    /**
     * Cancel the current transaction
     */
    const cancelTransaction = () => {
        if (!transactionInProgress) {
            console.warn('No transaction in progress');
            return;
        }
        // If we have a start state, we could restore it here
        // For now, just clear the transaction state
        transactionInProgress = false;
        transactionEntries = [];
        transactionStartState = null;
    };
    /**
     * Check if a transaction is in progress
     */
    const isInTransaction = () => transactionInProgress;
    /**
     * Get a summary of the history for debugging
     */
    const getSummary = () => {
        const currentEntries = entries();
        const currentIdx = currentIndex();
        return currentEntries.map((entry, index) => {
            const marker = index === currentIdx ? '-> ' : '   ';
            const time = new Date(entry.timestamp).toLocaleTimeString();
            return `${marker}[${index}] ${entry.description} (${entry.type}) - ${time}`;
        });
    };
    return {
        push,
        undo,
        redo,
        canUndo,
        canRedo,
        getState,
        getEntries,
        getCurrentIndex,
        goTo,
        clear,
        startTransaction,
        endTransaction,
        cancelTransaction,
        isInTransaction,
        getSummary,
    };
}
// ============================================================================
// History Hooks
// ============================================================================
/**
 * Create keyboard shortcuts for undo/redo
 */
export function createHistoryKeyboardHandler(history) {
    return (event) => {
        const isCtrlOrCmd = event.ctrlKey || event.metaKey;
        if (isCtrlOrCmd && event.key === 'z' && !event.shiftKey) {
            event.preventDefault();
            history.undo();
        }
        else if ((isCtrlOrCmd && event.key === 'z' && event.shiftKey) ||
            (isCtrlOrCmd && event.key === 'y')) {
            event.preventDefault();
            history.redo();
        }
    };
}
/**
 * Create a decorator that automatically records history
 */
export function withHistory(fn, history, getDescription, getStateSnapshot) {
    return ((...args) => {
        const before = getStateSnapshot();
        const result = fn(...args);
        const after = getStateSnapshot();
        history.push({
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'batch',
            timestamp: Date.now(),
            description: getDescription(...args),
            before,
            after,
        });
        return result;
    });
}
//# sourceMappingURL=history.js.map