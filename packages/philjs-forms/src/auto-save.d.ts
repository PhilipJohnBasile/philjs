/**
 * Form Auto-Save System
 *
 * Automatically persist form data:
 * - Local storage persistence
 * - Draft recovery
 * - Conflict resolution
 * - Version history
 */
export interface AutoSaveConfig {
    key: string;
    debounceMs?: number;
    maxVersions?: number;
    storage?: Storage;
    encrypt?: boolean;
    onSave?: (data: FormDraft) => void;
    onRestore?: (data: FormDraft) => void;
    onConflict?: (local: FormDraft, remote: FormDraft) => FormDraft;
}
export interface FormDraft {
    id: string;
    data: Record<string, unknown>;
    timestamp: number;
    version: number;
    checksum: string;
    metadata?: Record<string, unknown>;
}
export interface AutoSaveState {
    isDirty: boolean;
    lastSaved: number | null;
    isSaving: boolean;
    hasRecovery: boolean;
    versions: FormDraft[];
}
export interface AutoSaveController {
    state: AutoSaveState;
    save: () => Promise<void>;
    restore: () => FormDraft | null;
    clear: () => void;
    getVersions: () => FormDraft[];
    restoreVersion: (version: number) => FormDraft | null;
    setData: (data: Record<string, unknown>) => void;
    markClean: () => void;
    checkRecovery: () => boolean;
    discardRecovery: () => void;
}
/**
 * Create an auto-save controller for form data
 */
export declare function createAutoSave(config: AutoSaveConfig): AutoSaveController;
/**
 * Hook for using auto-save with forms
 */
export declare function useAutoSave<T extends Record<string, unknown>>(formData: T, config: Omit<AutoSaveConfig, 'key'> & {
    key: string;
}): {
    controller: AutoSaveController;
    hasRecovery: boolean;
    recover: () => T | null;
    discard: () => void;
};
export type ConflictStrategy = 'local' | 'remote' | 'merge' | 'manual';
/**
 * Resolve conflicts between local and remote form data
 */
export declare function resolveConflict(local: FormDraft, remote: FormDraft, strategy: ConflictStrategy): FormDraft;
/**
 * Create an IndexedDB storage adapter
 */
export declare function createIndexedDBStorage(dbName?: string): Promise<Storage>;
/**
 * Create a session storage adapter (for non-persistent drafts)
 */
export declare function createSessionStorage(): Storage;
export interface RecoveryDialogProps {
    draft: FormDraft;
    onRecover: () => void;
    onDiscard: () => void;
}
/**
 * Format timestamp for display
 */
export declare function formatDraftTimestamp(timestamp: number): string;
/**
 * Get recovery message for draft
 */
export declare function getRecoveryMessage(draft: FormDraft): string;
//# sourceMappingURL=auto-save.d.ts.map