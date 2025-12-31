/**
 * Form Auto-Save System
 *
 * Automatically persist form data:
 * - Local storage persistence
 * - Draft recovery
 * - Conflict resolution
 * - Version history
 */
// =============================================================================
// Auto-Save Implementation
// =============================================================================
/**
 * Create an auto-save controller for form data
 */
export function createAutoSave(config) {
    const { key, debounceMs = 1000, maxVersions = 10, storage = typeof localStorage !== 'undefined' ? localStorage : null, encrypt: shouldEncrypt = false, onSave, onRestore, onConflict, } = config;
    let state = {
        isDirty: false,
        lastSaved: null,
        isSaving: false,
        hasRecovery: false,
        versions: [],
    };
    let currentData = {};
    let saveTimeout = null;
    let currentVersion = 0;
    // Storage keys
    const draftKey = `form_draft_${key}`;
    const versionsKey = `form_versions_${key}`;
    // Initialize state
    function init() {
        if (!storage)
            return;
        // Load existing draft
        const savedDraft = storage.getItem(draftKey);
        if (savedDraft) {
            try {
                const draft = JSON.parse(decryptData(savedDraft));
                state.hasRecovery = true;
                state.lastSaved = draft.timestamp;
                currentVersion = draft.version;
            }
            catch {
                // Invalid saved data
            }
        }
        // Load version history
        const savedVersions = storage.getItem(versionsKey);
        if (savedVersions) {
            try {
                state.versions = JSON.parse(decryptData(savedVersions));
            }
            catch {
                state.versions = [];
            }
        }
    }
    function encryptData(data) {
        if (!shouldEncrypt)
            return data;
        // Simple base64 encoding - in production, use proper encryption
        return btoa(data);
    }
    function decryptData(data) {
        if (!shouldEncrypt)
            return data;
        try {
            return atob(data);
        }
        catch {
            return data;
        }
    }
    function generateChecksum(data) {
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }
    function scheduleSave() {
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }
        saveTimeout = setTimeout(() => {
            save();
        }, debounceMs);
    }
    async function save() {
        if (!storage || !state.isDirty)
            return;
        state.isSaving = true;
        const draft = {
            id: `${key}_${Date.now()}`,
            data: { ...currentData },
            timestamp: Date.now(),
            version: ++currentVersion,
            checksum: generateChecksum(currentData),
        };
        try {
            // Save current draft
            storage.setItem(draftKey, encryptData(JSON.stringify(draft)));
            // Add to version history
            state.versions.unshift(draft);
            if (state.versions.length > maxVersions) {
                state.versions = state.versions.slice(0, maxVersions);
            }
            storage.setItem(versionsKey, encryptData(JSON.stringify(state.versions)));
            state.lastSaved = draft.timestamp;
            state.isDirty = false;
            onSave?.(draft);
        }
        finally {
            state.isSaving = false;
        }
    }
    function restore() {
        if (!storage)
            return null;
        const savedDraft = storage.getItem(draftKey);
        if (!savedDraft)
            return null;
        try {
            const draft = JSON.parse(decryptData(savedDraft));
            currentData = draft.data;
            currentVersion = draft.version;
            state.hasRecovery = false;
            onRestore?.(draft);
            return draft;
        }
        catch {
            return null;
        }
    }
    function clear() {
        if (!storage)
            return;
        storage.removeItem(draftKey);
        storage.removeItem(versionsKey);
        state.versions = [];
        state.hasRecovery = false;
        state.lastSaved = null;
        currentData = {};
        currentVersion = 0;
    }
    function getVersions() {
        return [...state.versions];
    }
    function restoreVersion(version) {
        const draft = state.versions.find((v) => v.version === version);
        if (!draft)
            return null;
        currentData = { ...draft.data };
        state.isDirty = true;
        scheduleSave();
        return draft;
    }
    function setData(data) {
        currentData = data;
        state.isDirty = true;
        scheduleSave();
    }
    function markClean() {
        state.isDirty = false;
    }
    function checkRecovery() {
        return state.hasRecovery;
    }
    function discardRecovery() {
        if (!storage)
            return;
        storage.removeItem(draftKey);
        state.hasRecovery = false;
    }
    // Initialize on creation
    init();
    return {
        get state() {
            return state;
        },
        save,
        restore,
        clear,
        getVersions,
        restoreVersion,
        setData,
        markClean,
        checkRecovery,
        discardRecovery,
    };
}
// =============================================================================
// React Integration Hook
// =============================================================================
/**
 * Hook for using auto-save with forms
 */
export function useAutoSave(formData, config) {
    const controller = createAutoSave(config);
    // Update auto-save when form data changes
    controller.setData(formData);
    return {
        controller,
        hasRecovery: controller.checkRecovery(),
        recover: () => {
            const draft = controller.restore();
            return draft?.data;
        },
        discard: () => controller.discardRecovery(),
    };
}
/**
 * Resolve conflicts between local and remote form data
 */
export function resolveConflict(local, remote, strategy) {
    switch (strategy) {
        case 'local':
            return local;
        case 'remote':
            return remote;
        case 'merge':
            // Merge strategy: combine fields, preferring newer values
            const merged = {};
            const allKeys = new Set([
                ...Object.keys(local.data),
                ...Object.keys(remote.data),
            ]);
            for (const key of allKeys) {
                if (key in local.data && key in remote.data) {
                    // Both have the field, use the newer one
                    merged[key] = local.timestamp > remote.timestamp
                        ? local.data[key]
                        : remote.data[key];
                }
                else if (key in local.data) {
                    merged[key] = local.data[key];
                }
                else {
                    merged[key] = remote.data[key];
                }
            }
            return {
                id: `merged_${Date.now()}`,
                data: merged,
                timestamp: Date.now(),
                version: Math.max(local.version, remote.version) + 1,
                checksum: '',
            };
        case 'manual':
        default:
            // Return both for manual resolution
            return local;
    }
}
// =============================================================================
// Storage Adapters
// =============================================================================
/**
 * Create an IndexedDB storage adapter
 */
export function createIndexedDBStorage(dbName = 'formDrafts') {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('drafts')) {
                db.createObjectStore('drafts');
            }
        };
        request.onsuccess = () => {
            const db = request.result;
            const storage = {
                get length() {
                    return 0; // Not easily available in IndexedDB
                },
                key(_index) {
                    return null;
                },
                getItem(key) {
                    return new Promise((res) => {
                        const tx = db.transaction('drafts', 'readonly');
                        const store = tx.objectStore('drafts');
                        const req = store.get(key);
                        req.onsuccess = () => res(req.result || null);
                        req.onerror = () => res(null);
                    });
                },
                setItem(key, value) {
                    const tx = db.transaction('drafts', 'readwrite');
                    const store = tx.objectStore('drafts');
                    store.put(value, key);
                },
                removeItem(key) {
                    const tx = db.transaction('drafts', 'readwrite');
                    const store = tx.objectStore('drafts');
                    store.delete(key);
                },
                clear() {
                    const tx = db.transaction('drafts', 'readwrite');
                    const store = tx.objectStore('drafts');
                    store.clear();
                },
            };
            resolve(storage);
        };
    });
}
/**
 * Create a session storage adapter (for non-persistent drafts)
 */
export function createSessionStorage() {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : {
        length: 0,
        key: () => null,
        getItem: () => null,
        setItem: () => { },
        removeItem: () => { },
        clear: () => { },
    };
}
/**
 * Format timestamp for display
 */
export function formatDraftTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - timestamp;
    // Less than a minute
    if (diff < 60000) {
        return 'Just now';
    }
    // Less than an hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    // Less than a day
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    // Format as date
    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
/**
 * Get recovery message for draft
 */
export function getRecoveryMessage(draft) {
    const timeAgo = formatDraftTimestamp(draft.timestamp);
    const fieldCount = Object.keys(draft.data).length;
    return `You have unsaved changes from ${timeAgo} (${fieldCount} fields). Would you like to recover them?`;
}
//# sourceMappingURL=auto-save.js.map