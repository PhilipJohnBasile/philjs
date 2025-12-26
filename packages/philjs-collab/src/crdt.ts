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
export type DeleteSet = Map<ClientId, Array<{ start: Clock; length: number }>>;

/**
 * Y.Doc - Root document container
 */
export class YDoc {
  private clientId: ClientId;
  private clock: Clock = 0;
  private items: Map<string, Item[]> = new Map();
  private stateVector: StateVector = new Map();
  private listeners: Set<(update: Update) => void> = new Set();
  private types: Map<string, YText | YArray<unknown> | YMap<unknown>> = new Map();

  constructor(clientId?: ClientId) {
    this.clientId = clientId || this.generateClientId();
    this.stateVector.set(this.clientId, 0);
  }

  getClientId(): ClientId {
    return this.clientId;
  }

  getText(name: string): YText {
    let text = this.types.get(name) as YText | undefined;
    if (!text) {
      text = new YText(this, name);
      this.types.set(name, text);
    }
    return text;
  }

  getArray<T>(name: string): YArray<T> {
    let arr = this.types.get(name) as YArray<T> | undefined;
    if (!arr) {
      arr = new YArray<T>(this, name);
      this.types.set(name, arr);
    }
    return arr;
  }

  getMap<T>(name: string): YMap<T> {
    let map = this.types.get(name) as YMap<T> | undefined;
    if (!map) {
      map = new YMap<T>(this, name);
      this.types.set(name, map);
    }
    return map;
  }

  /**
   * Apply a remote update
   */
  applyUpdate(update: Update): void {
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
  getUpdate(targetStateVector?: StateVector): Update {
    const items: Item[] = [];
    const deleteSet: DeleteSet = new Map();

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
  onUpdate(listener: (update: Update) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Internal: Create a new item
   */
  _createItem<T>(parent: string, parentSub: string | null, content: T, length: number, origin: ItemId | null, rightOrigin: ItemId | null): Item<T> {
    const id: ItemId = {
      client: this.clientId,
      clock: this.clock++,
    };

    this.stateVector.set(this.clientId, this.clock);

    const item: Item<T> = {
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
  _deleteItem(item: Item): void {
    item.deleted = true;
    this.emitUpdate([], [[item.id.client, [{ start: item.id.clock, length: 1 }]]]);
  }

  /**
   * Internal: Get items for a type
   */
  _getItems(parent: string): Item[] {
    return this.items.get(parent) || [];
  }

  private integrateItem(item: Item): void {
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
      } else {
        break;
      }
    }

    typeItems.splice(insertPos, 0, item);
  }

  private applyDelete(client: ClientId, start: Clock, length: number): void {
    for (const typeItems of this.items.values()) {
      for (const item of typeItems) {
        if (item.id.client === client && item.id.clock >= start && item.id.clock < start + length) {
          item.deleted = true;
        }
      }
    }
  }

  private itemIdEquals(a: ItemId, b: ItemId): boolean {
    return a.client === b.client && a.clock === b.clock;
  }

  private emitUpdate(items: Item[], deletes: Array<[ClientId, Array<{ start: Clock; length: number }>]> = []): void {
    const update: Update = {
      items,
      deleteSet: new Map(deletes),
      stateVector: Object.fromEntries(this.stateVector),
    };

    for (const listener of this.listeners) {
      listener(update);
    }
  }

  private generateClientId(): ClientId {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Y.Text - Collaborative text type
 */
export class YText {
  private doc: YDoc;
  private name: string;
  private listeners: Set<(event: { delta: TextDelta[] }) => void> = new Set();

  constructor(doc: YDoc, name: string) {
    this.doc = doc;
    this.name = name;
  }

  /**
   * Get text content
   */
  toString(): string {
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
  get length(): number {
    return this.toString().length;
  }

  /**
   * Insert text at position
   */
  insert(index: number, text: string): void {
    const items = this.doc._getItems(this.name);
    let pos = 0;
    let origin: ItemId | null = null;

    for (const item of items) {
      if (item.deleted) continue;

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
  delete(index: number, length: number): void {
    const items = this.doc._getItems(this.name);
    let pos = 0;
    let remaining = length;

    for (const item of items) {
      if (remaining <= 0) break;
      if (item.deleted) continue;

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
  applyDelta(delta: TextDelta[]): void {
    let index = 0;

    for (const op of delta) {
      if ('retain' in op) {
        index += op.retain;
      } else if ('insert' in op) {
        this.insert(index, op.insert);
        index += op.insert.length;
      } else if ('delete' in op) {
        this.delete(index, op.delete);
      }
    }
  }

  /**
   * Subscribe to changes
   */
  observe(listener: (event: { delta: TextDelta[] }) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emitEvent(delta: TextDelta[]): void {
    for (const listener of this.listeners) {
      listener({ delta });
    }
  }
}

export type TextDelta =
  | { insert: string; attributes?: Record<string, unknown> }
  | { delete: number }
  | { retain: number; attributes?: Record<string, unknown> };

/**
 * Y.Array - Collaborative array type
 */
export class YArray<T> {
  private doc: YDoc;
  private name: string;
  private listeners: Set<(event: ArrayEvent<T>) => void> = new Set();

  constructor(doc: YDoc, name: string) {
    this.doc = doc;
    this.name = name;
  }

  /**
   * Get array contents
   */
  toArray(): T[] {
    const items = this.doc._getItems(this.name);
    const result: T[] = [];

    for (const item of items) {
      if (!item.deleted) {
        result.push(item.content as T);
      }
    }

    return result;
  }

  /**
   * Get length
   */
  get length(): number {
    return this.toArray().length;
  }

  /**
   * Get item at index
   */
  get(index: number): T | undefined {
    return this.toArray()[index];
  }

  /**
   * Insert items at position
   */
  insert(index: number, items: T[]): void {
    const existingItems = this.doc._getItems(this.name);
    let pos = 0;
    let origin: ItemId | null = null;

    for (const item of existingItems) {
      if (item.deleted) continue;
      if (pos === index) break;
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
  push(...items: T[]): void {
    this.insert(this.length, items);
  }

  /**
   * Delete items at position
   */
  delete(index: number, length: number = 1): void {
    const items = this.doc._getItems(this.name);
    let pos = 0;
    let remaining = length;

    for (const item of items) {
      if (remaining <= 0) break;
      if (item.deleted) continue;

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
  observe(listener: (event: ArrayEvent<T>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emitEvent(event: ArrayEvent<T>): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

export type ArrayEvent<T> =
  | { type: 'insert'; index: number; items: T[] }
  | { type: 'delete'; index: number; length: number };

/**
 * Y.Map - Collaborative map type
 */
export class YMap<T> {
  private doc: YDoc;
  private name: string;
  private listeners: Set<(event: MapEvent<T>) => void> = new Set();

  constructor(doc: YDoc, name: string) {
    this.doc = doc;
    this.name = name;
  }

  /**
   * Get map contents
   */
  toJSON(): Record<string, T> {
    const items = this.doc._getItems(this.name);
    const result: Record<string, T> = {};

    // Get latest value for each key
    for (const item of items) {
      if (!item.deleted && item.parentSub) {
        result[item.parentSub] = item.content as T;
      }
    }

    return result;
  }

  /**
   * Get value by key
   */
  get(key: string): T | undefined {
    const items = this.doc._getItems(this.name);
    let latest: Item | null = null;

    for (const item of items) {
      if (!item.deleted && item.parentSub === key) {
        if (!latest || item.id.clock > latest.id.clock) {
          latest = item;
        }
      }
    }

    return latest?.content as T | undefined;
  }

  /**
   * Set value by key
   */
  set(key: string, value: T): void {
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
  delete(key: string): void {
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
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Object.keys(this.toJSON());
  }

  /**
   * Subscribe to changes
   */
  observe(listener: (event: MapEvent<T>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emitEvent(event: MapEvent<T>): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

export type MapEvent<T> =
  | { type: 'set'; key: string; value: T }
  | { type: 'delete'; key: string };

/**
 * Create a new Y.Doc
 */
export function createYDoc(clientId?: string): YDoc {
  return new YDoc(clientId);
}
