// @ts-nocheck
/**
 * CRDTs for PhilJS Collab
 *
 * Conflict-free Replicated Data Types for distributed collaboration:
 * - Y.Text - Collaborative text editing
 * - Y.Array - Collaborative arrays
 * - Y.Map - Collaborative maps
 * - Y.Doc - Document container
 */
/**
 * Y.Doc - Root document container
 */
export class YDoc {
    clientId;
    clock = 0;
    items = new Map();
    stateVector = new Map();
    listeners = new Set();
    types = new Map();
    constructor(clientId) {
        this.clientId = clientId || this.generateClientId();
        this.stateVector.set(this.clientId, 0);
    }
    getClientId() {
        return this.clientId;
    }
    getText(name) {
        let text = this.types.get(name);
        if (!text) {
            text = new YText(this, name);
            this.types.set(name, text);
        }
        return text;
    }
    getArray(name) {
        let arr = this.types.get(name);
        if (!arr) {
            arr = new YArray(this, name);
            this.types.set(name, arr);
        }
        return arr;
    }
    getMap(name) {
        let map = this.types.get(name);
        if (!map) {
            map = new YMap(this, name);
            this.types.set(name, map);
        }
        return map;
    }
    /**
     * Apply a remote update
     */
    applyUpdate(update) {
        // Apply items
        for (const item of update.items) {
            this.integrateItem(item);
        }
        // Apply deletions
        for (const [client, ranges] of update.deleteSet) {
            for (const range of ranges) {
                this.applyDelete(client, range.start, range.length);
            }
        }
        // Update state vector
        for (const [client, clock] of Object.entries(update.stateVector)) {
            const current = this.stateVector.get(client) || 0;
            if (clock > current) {
                this.stateVector.set(client, clock);
            }
        }
    }
    /**
     * Get update since a state vector
     */
    getUpdate(targetStateVector) {
        const items = [];
        const deleteSet = new Map();
        for (const [, typeItems] of this.items) {
            for (const item of typeItems) {
                const targetClock = targetStateVector?.get(item.id.client) || 0;
                if (item.id.clock >= targetClock) {
                    items.push(item);
                }
            }
        }
        return {
            items,
            deleteSet,
            stateVector: Object.fromEntries(this.stateVector),
        };
    }
    /**
     * Subscribe to updates
     */
    onUpdate(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    /**
     * Internal: Create a new item
     */
    _createItem(parent, parentSub, content, length, origin, rightOrigin) {
        const id = {
            client: this.clientId,
            clock: this.clock++,
        };
        this.stateVector.set(this.clientId, this.clock);
        const item = {
            id,
            origin,
            rightOrigin,
            parent,
            parentSub,
            content,
            deleted: false,
            length,
        };
        this.integrateItem(item);
        this.emitUpdate([item]);
        return item;
    }
    /**
     * Internal: Delete an item
     */
    _deleteItem(item) {
        item.deleted = true;
        this.emitUpdate([], [[item.id.client, [{ start: item.id.clock, length: 1 }]]]);
    }
    /**
     * Internal: Get items for a type
     */
    _getItems(parent) {
        return this.items.get(parent) || [];
    }
    integrateItem(item) {
        let typeItems = this.items.get(item.parent);
        if (!typeItems) {
            typeItems = [];
            this.items.set(item.parent, typeItems);
        }
        // Find insertion position using origin
        let insertPos = 0;
        if (item.origin) {
            for (let i = 0; i < typeItems.length; i++) {
                if (this.itemIdEquals(typeItems[i].id, item.origin)) {
                    insertPos = i + 1;
                    break;
                }
            }
        }
        // Handle conflicts with same origin
        while (insertPos < typeItems.length) {
            const other = typeItems[insertPos];
            if (other.origin && this.itemIdEquals(other.origin, item.origin)) {
                // Same origin - use client ID as tiebreaker
                if (item.id.client < other.id.client) {
                    break;
                }
                insertPos++;
            }
            else {
                break;
            }
        }
        typeItems.splice(insertPos, 0, item);
    }
    applyDelete(client, start, length) {
        for (const typeItems of this.items.values()) {
            for (const item of typeItems) {
                if (item.id.client === client && item.id.clock >= start && item.id.clock < start + length) {
                    item.deleted = true;
                }
            }
        }
    }
    itemIdEquals(a, b) {
        return a.client === b.client && a.clock === b.clock;
    }
    emitUpdate(items, deletes = []) {
        const update = {
            items,
            deleteSet: new Map(deletes),
            stateVector: Object.fromEntries(this.stateVector),
        };
        for (const listener of this.listeners) {
            listener(update);
        }
    }
    generateClientId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
/**
 * Y.Text - Collaborative text type
 */
export class YText {
    doc;
    name;
    listeners = new Set();
    constructor(doc, name) {
        this.doc = doc;
        this.name = name;
    }
    /**
     * Get text content
     */
    toString() {
        const items = this.doc._getItems(this.name);
        let result = '';
        for (const item of items) {
            if (!item.deleted && typeof item.content === 'string') {
                result += item.content;
            }
        }
        return result;
    }
    /**
     * Get length
     */
    get length() {
        return this.toString().length;
    }
    /**
     * Insert text at position
     */
    insert(index, text) {
        const items = this.doc._getItems(this.name);
        let pos = 0;
        let origin = null;
        for (const item of items) {
            if (item.deleted)
                continue;
            if (pos === index) {
                break;
            }
            pos += item.length;
            origin = item.id;
            if (pos > index) {
                // Need to split item
                break;
            }
        }
        this.doc._createItem(this.name, null, text, text.length, origin, null);
        this.emitEvent([{ insert: text }]);
    }
    /**
     * Delete text at position
     */
    delete(index, length) {
        const items = this.doc._getItems(this.name);
        let pos = 0;
        let remaining = length;
        for (const item of items) {
            if (remaining <= 0)
                break;
            if (item.deleted)
                continue;
            if (pos >= index && pos < index + length) {
                this.doc._deleteItem(item);
                remaining -= item.length;
            }
            pos += item.length;
        }
        this.emitEvent([{ delete: length }]);
    }
    /**
     * Apply delta operations
     */
    applyDelta(delta) {
        let index = 0;
        for (const op of delta) {
            if ('retain' in op) {
                index += op.retain;
            }
            else if ('insert' in op) {
                this.insert(index, op.insert);
                index += op.insert.length;
            }
            else if ('delete' in op) {
                this.delete(index, op.delete);
            }
        }
    }
    /**
     * Subscribe to changes
     */
    observe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    emitEvent(delta) {
        for (const listener of this.listeners) {
            listener({ delta });
        }
    }
}
/**
 * Y.Array - Collaborative array type
 */
export class YArray {
    doc;
    name;
    listeners = new Set();
    constructor(doc, name) {
        this.doc = doc;
        this.name = name;
    }
    /**
     * Get array contents
     */
    toArray() {
        const items = this.doc._getItems(this.name);
        const result = [];
        for (const item of items) {
            if (!item.deleted) {
                result.push(item.content);
            }
        }
        return result;
    }
    /**
     * Get length
     */
    get length() {
        return this.toArray().length;
    }
    /**
     * Get item at index
     */
    get(index) {
        return this.toArray()[index];
    }
    /**
     * Insert items at position
     */
    insert(index, items) {
        const existingItems = this.doc._getItems(this.name);
        let pos = 0;
        let origin = null;
        for (const item of existingItems) {
            if (item.deleted)
                continue;
            if (pos === index)
                break;
            pos++;
            origin = item.id;
        }
        for (const content of items) {
            const newItem = this.doc._createItem(this.name, null, content, 1, origin, null);
            origin = newItem.id;
        }
        this.emitEvent({ type: 'insert', index, items });
    }
    /**
     * Push items to end
     */
    push(...items) {
        this.insert(this.length, items);
    }
    /**
     * Delete items at position
     */
    delete(index, length = 1) {
        const items = this.doc._getItems(this.name);
        let pos = 0;
        let remaining = length;
        for (const item of items) {
            if (remaining <= 0)
                break;
            if (item.deleted)
                continue;
            if (pos >= index && pos < index + length) {
                this.doc._deleteItem(item);
                remaining--;
            }
            pos++;
        }
        this.emitEvent({ type: 'delete', index, length });
    }
    /**
     * Subscribe to changes
     */
    observe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    emitEvent(event) {
        for (const listener of this.listeners) {
            listener(event);
        }
    }
}
/**
 * Y.Map - Collaborative map type
 */
export class YMap {
    doc;
    name;
    listeners = new Set();
    constructor(doc, name) {
        this.doc = doc;
        this.name = name;
    }
    /**
     * Get map contents
     */
    toJSON() {
        const items = this.doc._getItems(this.name);
        const result = {};
        // Get latest value for each key
        for (const item of items) {
            if (!item.deleted && item.parentSub) {
                result[item.parentSub] = item.content;
            }
        }
        return result;
    }
    /**
     * Get value by key
     */
    get(key) {
        const items = this.doc._getItems(this.name);
        let latest = null;
        for (const item of items) {
            if (!item.deleted && item.parentSub === key) {
                if (!latest || item.id.clock > latest.id.clock) {
                    latest = item;
                }
            }
        }
        return latest?.content;
    }
    /**
     * Set value by key
     */
    set(key, value) {
        // Delete existing values for this key
        const items = this.doc._getItems(this.name);
        for (const item of items) {
            if (!item.deleted && item.parentSub === key) {
                this.doc._deleteItem(item);
            }
        }
        this.doc._createItem(this.name, key, value, 1, null, null);
        this.emitEvent({ type: 'set', key, value });
    }
    /**
     * Delete by key
     */
    delete(key) {
        const items = this.doc._getItems(this.name);
        for (const item of items) {
            if (!item.deleted && item.parentSub === key) {
                this.doc._deleteItem(item);
            }
        }
        this.emitEvent({ type: 'delete', key });
    }
    /**
     * Check if key exists
     */
    has(key) {
        return this.get(key) !== undefined;
    }
    /**
     * Get all keys
     */
    keys() {
        return Object.keys(this.toJSON());
    }
    /**
     * Subscribe to changes
     */
    observe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    emitEvent(event) {
        for (const listener of this.listeners) {
            listener(event);
        }
    }
}
/**
 * Create a new Y.Doc
 */
export function createYDoc(clientId) {
    return new YDoc(clientId);
}
//# sourceMappingURL=crdt.js.map