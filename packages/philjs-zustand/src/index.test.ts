// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore, persist, devtools, immer, shallow, combine } from './index';

const createMemoryStorage = (): Storage => {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => {
      store.clear();
    },
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  } as Storage;
};

const ensureTestStorage = () => {
  if (typeof window === 'undefined') {
    (globalThis as any).window = globalThis;
  }
  if (!globalThis.localStorage || typeof globalThis.localStorage.clear !== 'function') {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
    });
  }
};

ensureTestStorage();

describe('philjs-zustand', () => {
  describe('createStore', () => {
    it('should create a store with initial state', () => {
      const useStore = createStore(() => ({
        count: 0,
        text: 'hello',
      }));

      const state = useStore.getState();
      expect(state.count).toBe(0);
      expect(state.text).toBe('hello');
    });

    it('should update state with setState', () => {
      const useStore = createStore(() => ({
        count: 0,
      }));

      useStore.setState({ count: 5 });
      expect(useStore.getState().count).toBe(5);
    });

    it('should support function updates', () => {
      const useStore = createStore(() => ({
        count: 0,
      }));

      useStore.setState((state) => ({ count: state.count + 1 }));
      expect(useStore.getState().count).toBe(1);
    });

    it('should support actions in state', () => {
      interface CounterStore {
        count: number;
        increment: () => void;
        decrement: () => void;
      }
      const useStore = createStore<CounterStore>((set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
        decrement: () => set((state) => ({ count: state.count - 1 })),
      }));

      useStore.getState().increment();
      expect(useStore.getState().count).toBe(1);

      useStore.getState().decrement();
      expect(useStore.getState().count).toBe(0);
    });

    it('should notify subscribers', () => {
      const useStore = createStore(() => ({
        count: 0,
      }));

      const listener = vi.fn();
      useStore.subscribe(listener);

      useStore.setState({ count: 5 });
      expect(listener).toHaveBeenCalledWith(
        { count: 5 },
        { count: 0 }
      );
    });

    it('should support unsubscribe', () => {
      const useStore = createStore(() => ({
        count: 0,
      }));

      const listener = vi.fn();
      const unsubscribe = useStore.subscribe(listener);

      useStore.setState({ count: 5 });
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      useStore.setState({ count: 10 });
      expect(listener).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should support replace mode', () => {
      const useStore = createStore(() => ({
        count: 0,
        text: 'hello',
      }));

      useStore.setState({ count: 5 } as any, true); // Replace
      const state = useStore.getState();
      expect(state.count).toBe(5);
      expect((state as any).text).toBeUndefined();
    });

    it('should destroy store and clear listeners', () => {
      const useStore = createStore(() => ({
        count: 0,
      }));

      const listener = vi.fn();
      useStore.subscribe(listener);

      useStore.destroy();
      useStore.setState({ count: 5 });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('persist middleware', () => {
    beforeEach(() => {
      ensureTestStorage();
      localStorage.clear();
    });

    it('should persist state to localStorage', () => {
      const useStore = createStore(
        persist(
          () => ({
            count: 0,
          }),
          {
            name: 'test-storage',
          }
        )
      );

      useStore.setState({ count: 42 });

      const stored = localStorage.getItem('test-storage');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.count).toBe(42);
    });

    it('should rehydrate state from localStorage', () => {
      localStorage.setItem('test-storage', JSON.stringify({ count: 99, _version: 0 }));

      const useStore = createStore(
        persist(
          () => ({
            count: 0,
          }),
          {
            name: 'test-storage',
          }
        )
      );

      expect(useStore.getState().count).toBe(99);
    });

    it('should support partialize option', () => {
      const useStore = createStore(
        persist(
          () => ({
            count: 0,
            temp: 'not-persisted',
          }),
          {
            name: 'test-storage',
            partialize: (state) => ({ count: state.count }),
          }
        )
      );

      useStore.setState({ count: 5, temp: 'ignore' });

      const stored = localStorage.getItem('test-storage');
      const parsed = JSON.parse(stored!);
      expect(parsed.count).toBe(5);
      expect(parsed.temp).toBeUndefined();
    });
  });

  describe('immer middleware', () => {
    it('should support mutable-style updates', () => {
      const useStore = createStore(
        immer(() => ({
          nested: { count: 0 },
        }))
      );

      useStore.setState((state) => {
        state.nested.count++;
        return state;
      });

      expect(useStore.getState().nested.count).toBe(1);
    });

    it('should work with arrays', () => {
      const useStore = createStore(
        immer(() => ({
          items: [1, 2, 3],
        }))
      );

      useStore.setState((state) => {
        state.items.push(4);
        return state;
      });

      expect(useStore.getState().items).toEqual([1, 2, 3, 4]);
    });
  });

  describe('utilities', () => {
    describe('shallow', () => {
      it('should compare primitives', () => {
        expect(shallow(1, 1)).toBe(true);
        expect(shallow(1, 2)).toBe(false);
        expect(shallow('a', 'a')).toBe(true);
        expect(shallow('a', 'b')).toBe(false);
      });

      it('should compare objects shallowly', () => {
        expect(shallow({ a: 1 }, { a: 1 })).toBe(true);
        expect(shallow({ a: 1 }, { a: 2 })).toBe(false);
        expect(shallow({ a: 1, b: 2 }, { a: 1 })).toBe(false);
      });

      it('should use Object.is for nested values', () => {
        const obj = { x: 1 };
        expect(shallow({ a: obj }, { a: obj })).toBe(true);
        expect(shallow({ a: obj }, { a: { x: 1 } })).toBe(false);
      });
    });

    describe('combine', () => {
      it('should combine multiple stores', () => {
        interface UserState { name: string; }
        interface CartState { items: string[]; }

        const useUserStore = createStore<UserState>(() => ({
          name: 'John',
        }));

        const useCartStore = createStore<CartState>(() => ({
          items: ['item1'],
        }));

        const useCombinedStore = combine({
          user: useUserStore,
          cart: useCartStore,
        });

        const state = useCombinedStore.getState() as { user: UserState; cart: CartState };
        expect(state.user.name).toBe('John');
        expect(state.cart.items).toEqual(['item1']);
      });

      it('should sync when individual stores update', () => {
        interface UserState { name: string; }
        interface CartState { items: string[]; }

        const useUserStore = createStore<UserState>(() => ({
          name: 'John',
        }));

        const useCartStore = createStore<CartState>(() => ({
          items: ['item1'],
        }));

        const useCombinedStore = combine({
          user: useUserStore,
          cart: useCartStore,
        });

        useUserStore.setState({ name: 'Jane' });

        const state = useCombinedStore.getState() as { user: UserState; cart: CartState };
        expect(state.user.name).toBe('Jane');
      });
    });
  });
});
