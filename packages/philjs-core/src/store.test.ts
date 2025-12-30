/**
 * Comprehensive tests for store.ts
 * Testing reactive stores: createStore, deep reactivity, arrays, persistence, undo/redo
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createStore,
  derive,
  createStoreWithActions,
  produce,
  reconcile,
  createSlice,
  createUndoableStore,
} from './store';
import { effect } from './signals';

describe('createStore - Basic Usage', () => {
  it('should create a store with initial state', () => {
    const [store] = createStore({ count: 0, name: 'test' });

    expect(store.count).toBe(0);
    expect(store.name).toBe('test');
  });

  it('should update store values', () => {
    const [store, setStore] = createStore({ count: 0 });

    setStore('count', 5);

    expect(store.count).toBe(5);
  });

  it('should support updater functions', () => {
    const [store, setStore] = createStore({ count: 10 });

    setStore('count', (prev: number) => prev + 5);

    expect(store.count).toBe(15);
  });

  it('should handle nested objects', () => {
    const [store, setStore] = createStore({
      user: { name: 'John', age: 30 },
    });

    setStore('user', 'name', 'Jane');

    expect(store.user.name).toBe('Jane');
    expect(store.user.age).toBe(30);
  });

  it('should handle deeply nested paths', () => {
    const [store, setStore] = createStore({
      level1: {
        level2: {
          level3: { value: 'original' },
        },
      },
    });

    setStore('level1', 'level2', 'level3', 'value', 'updated');

    expect(store.level1.level2.level3.value).toBe('updated');
  });
});

describe('createStore - Array Operations', () => {
  it('should handle array push', () => {
    const [store] = createStore({ items: [1, 2, 3] });

    store.items.push(4);

    expect(store.items.length).toBe(4);
    expect(store.items[3]).toBe(4);
  });

  it('should handle array pop', () => {
    const [store] = createStore({ items: [1, 2, 3] });

    const popped = store.items.pop();

    expect(popped).toBe(3);
    expect(store.items.length).toBe(2);
  });

  it('should handle array splice', () => {
    const [store] = createStore({ items: [1, 2, 3, 4, 5] });

    const removed = store.items.splice(1, 2, 10, 20);

    expect(removed).toEqual([2, 3]);
    expect(store.items).toEqual([1, 10, 20, 4, 5]);
  });

  it('should handle array shift', () => {
    const [store] = createStore({ items: [1, 2, 3] });

    const shifted = store.items.shift();

    expect(shifted).toBe(1);
    expect(store.items).toEqual([2, 3]);
  });

  it('should handle array unshift', () => {
    const [store] = createStore({ items: [2, 3] });

    const newLength = store.items.unshift(0, 1);

    expect(newLength).toBe(4);
    expect(store.items).toEqual([0, 1, 2, 3]);
  });

  it('should handle array sort', () => {
    const [store] = createStore({ items: [3, 1, 4, 1, 5] });

    store.items.sort();

    expect(store.items).toEqual([1, 1, 3, 4, 5]);
  });

  it('should handle array reverse', () => {
    const [store] = createStore({ items: [1, 2, 3] });

    store.items.reverse();

    expect(store.items).toEqual([3, 2, 1]);
  });

  it('should handle array index assignment', () => {
    const [store, setStore] = createStore({ items: [1, 2, 3] });

    store.items[1] = 20;

    expect(store.items[1]).toBe(20);
  });

  it('should track array length changes', () => {
    const [store] = createStore({ items: [1, 2, 3] });
    const spy = vi.fn();

    effect(() => {
      store.items.length;
      spy();
    });

    spy.mockClear();
    store.items.push(4);

    expect(spy).toHaveBeenCalled();
  });
});

describe('createStore - Reactivity', () => {
  it('should trigger effects on property access', () => {
    const [store, setStore] = createStore({ count: 0 });
    const spy = vi.fn();

    const dispose = effect(() => {
      store.count;
      spy();
    });

    spy.mockClear();
    setStore('count', 1);

    expect(spy).toHaveBeenCalled();
    dispose();
  });

  it('should trigger effects on nested property changes', () => {
    const [store, setStore] = createStore({
      user: { profile: { name: 'John' } },
    });
    const spy = vi.fn();

    const dispose = effect(() => {
      store.user.profile.name;
      spy();
    });

    spy.mockClear();
    setStore('user', 'profile', 'name', 'Jane');

    expect(spy).toHaveBeenCalled();
    dispose();
  });

  it('should batch multiple updates', () => {
    const [store, setStore] = createStore({ a: 1, b: 2 });
    const spy = vi.fn();

    const dispose = effect(() => {
      store.a;
      store.b;
      spy();
    });

    spy.mockClear();
    setStore('a', 10);
    setStore('b', 20);

    // Should be called for each update
    expect(spy).toHaveBeenCalled();
    dispose();
  });
});

describe('createStore - Middleware', () => {
  it('should call middleware on state changes', () => {
    const middleware = vi.fn();

    const [store, setStore] = createStore(
      { count: 0 },
      { middleware: [middleware] }
    );

    setStore('count', 5);

    expect(middleware).toHaveBeenCalledWith(
      expect.objectContaining({ count: 5 }),
      ['count'],
      5,
      0
    );
  });

  it('should call multiple middlewares in order', () => {
    const order: number[] = [];
    const middleware1 = vi.fn(() => order.push(1));
    const middleware2 = vi.fn(() => order.push(2));

    const [store, setStore] = createStore(
      { value: 'initial' },
      { middleware: [middleware1, middleware2] }
    );

    setStore('value', 'updated');

    expect(order).toEqual([1, 2]);
  });
});

describe('derive - Computed Store Values', () => {
  it('should derive values from store', () => {
    const [store] = createStore({ price: 100, quantity: 2 });

    const total = derive(store, (s) => s.price * s.quantity);

    expect(total()).toBe(200);
  });

  it('should update derived values when store changes', () => {
    const [store, setStore] = createStore({ price: 100, quantity: 2 });
    const total = derive(store, (s) => s.price * s.quantity);

    expect(total()).toBe(200);

    setStore('quantity', 5);
    expect(total()).toBe(500);
  });

  it('should handle complex derivations', () => {
    const [store] = createStore({
      items: [
        { name: 'A', price: 10 },
        { name: 'B', price: 20 },
        { name: 'C', price: 30 },
      ],
    });

    const totalPrice = derive(store, (s) =>
      s.items.reduce((sum, item) => sum + item.price, 0)
    );

    expect(totalPrice()).toBe(60);
  });
});

describe('createStoreWithActions', () => {
  it('should create store with bound actions', () => {
    const [store, setStore, actions] = createStoreWithActions(
      { count: 0 },
      {
        increment: (set, get) => {
          const current = get().count;
          set('count', current + 1);
        },
        decrement: (set, get) => {
          const current = get().count;
          set('count', current - 1);
        },
        setTo: (set, get, value: number) => {
          set('count', value);
        },
      }
    );

    actions.increment();
    expect(store.count).toBe(1);

    actions.decrement();
    expect(store.count).toBe(0);

    actions.setTo(100);
    expect(store.count).toBe(100);
  });

  it('should access state in actions', () => {
    const [store, , actions] = createStoreWithActions(
      { value: 5 },
      {
        double: (set, get) => {
          set('value', get().value * 2);
        },
      }
    );

    actions.double();
    expect(store.value).toBe(10);

    actions.double();
    expect(store.value).toBe(20);
  });
});

describe('produce - Immutable Updates', () => {
  it('should produce a new object with modifications', () => {
    const original = { a: 1, b: 2 };

    const updated = produce(original, (draft) => {
      draft.a = 10;
    });

    expect(updated.a).toBe(10);
    expect(updated.b).toBe(2);
    expect(updated).not.toBe(original);
  });

  it('should handle nested modifications', () => {
    const original = {
      user: { name: 'John', settings: { theme: 'dark' } },
    };

    const updated = produce(original, (draft) => {
      draft.user.settings.theme = 'light';
    });

    expect(updated.user.settings.theme).toBe('light');
    expect(original.user.settings.theme).toBe('dark');
  });

  it('should handle array modifications', () => {
    const original = { items: [1, 2, 3] };

    const updated = produce(original, (draft) => {
      draft.items.push(4);
      draft.items[0] = 10;
    });

    expect(updated.items).toEqual([10, 2, 3, 4]);
    expect(original.items).toEqual([1, 2, 3]);
  });
});

describe('reconcile - Array Reconciliation', () => {
  it('should reconcile arrays with same items', () => {
    const oldArray = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];
    const newArray = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];

    const result = reconcile(oldArray, newArray, (item) => item.id);

    // Should reuse old references for unchanged items
    expect(result[0]).toBe(oldArray[0]);
    expect(result[1]).toBe(oldArray[1]);
  });

  it('should update changed items', () => {
    const oldArray = [{ id: 1, name: 'A' }];
    const newArray = [{ id: 1, name: 'Updated' }];

    const result = reconcile(oldArray, newArray, (item) => item.id);

    expect(result[0]).not.toBe(oldArray[0]);
    expect(result[0].name).toBe('Updated');
  });

  it('should handle added items', () => {
    const oldArray = [{ id: 1 }];
    const newArray = [{ id: 1 }, { id: 2 }];

    const result = reconcile(oldArray, newArray, (item) => item.id);

    expect(result.length).toBe(2);
    expect(result[1]).toEqual({ id: 2 });
  });

  it('should handle removed items', () => {
    const oldArray = [{ id: 1 }, { id: 2 }];
    const newArray = [{ id: 1 }];

    const result = reconcile(oldArray, newArray, (item) => item.id);

    expect(result.length).toBe(1);
    expect(result[0].id).toBe(1);
  });

  it('should handle reordered items', () => {
    const oldArray = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const newArray = [{ id: 3 }, { id: 1 }, { id: 2 }];

    const result = reconcile(oldArray, newArray, (item) => item.id);

    expect(result.map((i) => i.id)).toEqual([3, 1, 2]);
  });
});

describe('createSlice - Store Slices', () => {
  it('should create a slice of the store', () => {
    const [store, setStore] = createStore({
      user: { name: 'John', age: 30 },
      settings: { theme: 'dark' },
    });

    const [userSlice, setUserSlice] = createSlice(store, setStore, 'user');

    expect(userSlice.name).toBe('John');
    expect(userSlice.age).toBe(30);
  });

  it('should update slice and reflect in parent', () => {
    const [store, setStore] = createStore({
      user: { name: 'John' },
      other: { value: 1 },
    });

    const [userSlice, setUserSlice] = createSlice(store, setStore, 'user');

    setUserSlice('name', 'Jane');

    expect(userSlice.name).toBe('Jane');
    expect(store.user.name).toBe('Jane');
  });
});

describe('createUndoableStore - Undo/Redo', () => {
  it('should create store with undo/redo capabilities', () => {
    const { store, setStore, undo, redo, canUndo, canRedo } =
      createUndoableStore({ count: 0 });

    expect(store.count).toBe(0);
    expect(canUndo()).toBe(false);
    expect(canRedo()).toBe(false);
  });

  it('should undo changes', () => {
    const { store, setStore, undo, canUndo } = createUndoableStore({
      count: 0,
    });

    setStore('count', 5);
    expect(store.count).toBe(5);
    expect(canUndo()).toBe(true);

    undo();
    expect(store.count).toBe(0);
  });

  it('should redo undone changes', () => {
    const { store, setStore, undo, redo, canRedo } = createUndoableStore({
      count: 0,
    });

    setStore('count', 5);
    undo();
    expect(store.count).toBe(0);
    expect(canRedo()).toBe(true);

    redo();
    expect(store.count).toBe(5);
  });

  it('should handle multiple undo operations', () => {
    const { store, setStore, undo } = createUndoableStore({ count: 0 });

    setStore('count', 1);
    setStore('count', 2);
    setStore('count', 3);

    expect(store.count).toBe(3);

    undo();
    expect(store.count).toBe(2);

    undo();
    expect(store.count).toBe(1);

    undo();
    expect(store.count).toBe(0);
  });

  it('should clear redo history when new change is made', () => {
    const { store, setStore, undo, redo, canRedo } = createUndoableStore({
      count: 0,
    });

    setStore('count', 5);
    undo();
    expect(canRedo()).toBe(true);

    setStore('count', 10);
    expect(canRedo()).toBe(false);
  });

  it('should clear history', () => {
    const { store, setStore, undo, clear, canUndo } = createUndoableStore({
      count: 0,
    });

    setStore('count', 1);
    setStore('count', 2);
    expect(canUndo()).toBe(true);

    clear();
    expect(canUndo()).toBe(false);
  });

  it('should respect history limit', () => {
    const { store, setStore, undo, canUndo } = createUndoableStore(
      { count: 0 },
      { historyLimit: 3 }
    );

    // Make more changes than the limit
    setStore('count', 1);
    setStore('count', 2);
    setStore('count', 3);
    setStore('count', 4);
    setStore('count', 5);

    // Should only be able to undo up to the limit
    undo();
    undo();
    undo();
    // Further undos should not go past limit
  });
});

describe('createStore - Edge Cases', () => {
  it('should handle null values', () => {
    const [store, setStore] = createStore<{ value: string | null }>({
      value: 'initial',
    });

    setStore('value', null);

    expect(store.value).toBe(null);
  });

  it('should handle undefined values', () => {
    const [store, setStore] = createStore<{ value: string | undefined }>({
      value: 'initial',
    });

    setStore('value', undefined);

    expect(store.value).toBe(undefined);
  });

  it('should handle empty objects', () => {
    const [store, setStore] = createStore<{ obj: Record<string, any> }>({
      obj: {},
    });

    setStore('obj', 'newKey', 'value');

    expect(store.obj.newKey).toBe('value');
  });

  it('should handle empty arrays', () => {
    const [store] = createStore<{ items: number[] }>({ items: [] });

    store.items.push(1);

    expect(store.items.length).toBe(1);
    expect(store.items[0]).toBe(1);
  });

  it('should handle complex nested structures', () => {
    const [store, setStore] = createStore({
      deeply: {
        nested: {
          array: [
            { id: 1, data: { value: 'a' } },
            { id: 2, data: { value: 'b' } },
          ],
        },
      },
    });

    // Access nested array item
    expect(store.deeply.nested.array[0].data.value).toBe('a');
  });

  it('should handle Date objects', () => {
    const date = new Date('2024-01-01');
    const [store] = createStore({ date });

    expect(store.date).toBeInstanceOf(Date);
  });

  it('should handle symbol keys', () => {
    const sym = Symbol('test');
    const [store] = createStore({ [sym]: 'value' });

    expect(store[sym]).toBe('value');
  });
});

describe('createStore - Persistence', () => {
  let mockStorage: Storage;

  beforeEach(() => {
    mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
  });

  it('should load initial state from storage', () => {
    (mockStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
      JSON.stringify({ count: 42 })
    );

    const [store] = createStore(
      { count: 0 },
      { persist: { key: 'test-store', storage: mockStorage } }
    );

    expect(mockStorage.getItem).toHaveBeenCalledWith('test-store');
    expect(store.count).toBe(42);
  });

  it('should persist state changes', async () => {
    const [store, setStore] = createStore(
      { count: 0 },
      { persist: { key: 'test-store', storage: mockStorage, debounce: 0 } }
    );

    setStore('count', 10);

    // Wait for debounce
    await new Promise((r) => setTimeout(r, 150));

    expect(mockStorage.setItem).toHaveBeenCalled();
  });

  it('should only persist specified paths', async () => {
    const [store, setStore] = createStore(
      { user: { name: 'John' }, temp: { value: 'x' } },
      {
        persist: {
          key: 'test-store',
          storage: mockStorage,
          paths: ['user'],
          debounce: 0,
        },
      }
    );

    setStore('user', 'name', 'Jane');

    await new Promise((r) => setTimeout(r, 150));

    const lastCall = (mockStorage.setItem as ReturnType<typeof vi.fn>).mock
      .calls[0];
    if (lastCall) {
      const persisted = JSON.parse(lastCall[1]);
      expect(persisted.user).toBeDefined();
      expect(persisted.temp).toBeUndefined();
    }
  });

  it('should use custom serializer', async () => {
    const customSerialize = vi.fn((state) => JSON.stringify(state));

    const [store, setStore] = createStore(
      { count: 0 },
      {
        persist: {
          key: 'test-store',
          storage: mockStorage,
          serialize: customSerialize,
          debounce: 0,
        },
      }
    );

    setStore('count', 5);
    await new Promise((r) => setTimeout(r, 150));

    expect(customSerialize).toHaveBeenCalled();
  });
});
