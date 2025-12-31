/**
 * CRDTs for PhilJS Collab
 *
 * Conflict-free Replicated Data Types for distributed collaboration:
 * - Y.Text - Collaborative text editing
 * - Y.Array - Collaborative arrays
 * - Y.Map - Collaborative maps
 * - Y.Doc - Document container
 */
export type ClientId = string;
export type Clock = number;
/**
 * Unique identifier for CRDT items
 */
export interface ItemId {
    client: ClientId;
    clock: Clock;
}
/**
 * Base CRDT item structure
 */
export interface Item<T = unknown> {
    id: ItemId;
    origin: ItemId | null;
    rightOrigin: ItemId | null;
    parent: string;
    parentSub: string | null;
    content: T;
    deleted: boolean;
    length: number;
}
/**
 * State vector for tracking client progress
 */
export type StateVector = Map<ClientId, Clock>;
/**
 * Update message for syncing
 */
export interface Update {
    items: Item[];
    deleteSet: DeleteSet;
    stateVector: Record<ClientId, Clock>;
}
/**
 * Delete set for tracking deletions
 */
export type DeleteSet = Map<ClientId, Array<{
    start: Clock;
    length: number;
}>>;
/**
 * Y.Doc - Root document container
 */
export declare class YDoc {
    private clientId;
    private clock;
    private items;
    private stateVector;
    private listeners;
    private types;
    constructor(clientId?: ClientId);
    getClientId(): ClientId;
    getText(name: string): YText;
    getArray<T>(name: string): YArray<T>;
    getMap<T>(name: string): YMap<T>;
    /**
     * Apply a remote update
     */
    applyUpdate(update: Update): void;
    /**
     * Get update since a state vector
     */
    getUpdate(targetStateVector?: StateVector): Update;
    /**
     * Subscribe to updates
     */
    onUpdate(listener: (update: Update) => void): () => void;
    /**
     * Internal: Create a new item
     */
    _createItem<T>(parent: string, parentSub: string | null, content: T, length: number, origin: ItemId | null, rightOrigin: ItemId | null): Item<T>;
    /**
     * Internal: Delete an item
     */
    _deleteItem(item: Item): void;
    /**
     * Internal: Get items for a type
     */
    _getItems(parent: string): Item[];
    private integrateItem;
    private applyDelete;
    private itemIdEquals;
    private emitUpdate;
    private generateClientId;
}
/**
 * Y.Text - Collaborative text type
 */
export declare class YText {
    private doc;
    private name;
    private listeners;
    constructor(doc: YDoc, name: string);
    /**
     * Get text content
     */
    toString(): string;
    /**
     * Get length
     */
    get length(): number;
    /**
     * Insert text at position
     */
    insert(index: number, text: string): void;
    /**
     * Delete text at position
     */
    delete(index: number, length: number): void;
    /**
     * Apply delta operations
     */
    applyDelta(delta: TextDelta[]): void;
    /**
     * Subscribe to changes
     */
    observe(listener: (event: {
        delta: TextDelta[];
    }) => void): () => void;
    private emitEvent;
}
export type TextDelta = {
    insert: string;
    attributes?: Record<string, unknown>;
} | {
    delete: number;
} | {
    retain: number;
    attributes?: Record<string, unknown>;
};
/**
 * Y.Array - Collaborative array type
 */
export declare class YArray<T> {
    private doc;
    private name;
    private listeners;
    constructor(doc: YDoc, name: string);
    /**
     * Get array contents
     */
    toArray(): T[];
    /**
     * Get length
     */
    get length(): number;
    /**
     * Get item at index
     */
    get(index: number): T | undefined;
    /**
     * Insert items at position
     */
    insert(index: number, items: T[]): void;
    /**
     * Push items to end
     */
    push(...items: T[]): void;
    /**
     * Delete items at position
     */
    delete(index: number, length?: number): void;
    /**
     * Subscribe to changes
     */
    observe(listener: (event: ArrayEvent<T>) => void): () => void;
    private emitEvent;
}
export type ArrayEvent<T> = {
    type: 'insert';
    index: number;
    items: T[];
} | {
    type: 'delete';
    index: number;
    length: number;
};
/**
 * Y.Map - Collaborative map type
 */
export declare class YMap<T> {
    private doc;
    private name;
    private listeners;
    constructor(doc: YDoc, name: string);
    /**
     * Get map contents
     */
    toJSON(): Record<string, T>;
    /**
     * Get value by key
     */
    get(key: string): T | undefined;
    /**
     * Set value by key
     */
    set(key: string, value: T): void;
    /**
     * Delete by key
     */
    delete(key: string): void;
    /**
     * Check if key exists
     */
    has(key: string): boolean;
    /**
     * Get all keys
     */
    keys(): string[];
    /**
     * Subscribe to changes
     */
    observe(listener: (event: MapEvent<T>) => void): () => void;
    private emitEvent;
}
export type MapEvent<T> = {
    type: 'set';
    key: string;
    value: T;
} | {
    type: 'delete';
    key: string;
};
/**
 * Create a new Y.Doc
 */
export declare function createYDoc(clientId?: string): YDoc;
//# sourceMappingURL=crdt.d.ts.map