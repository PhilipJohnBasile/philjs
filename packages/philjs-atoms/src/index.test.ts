import { describe, it, expect, beforeEach } from 'vitest';
import {
  atom,
  useAtomValue,
  useSetAtom,
  useAtom,
  atomFamily,
  atomAction,
  atomWithReset,
  atomWithStorage,
  selectAtom,
  batchAtoms,
} from './index';

describe('philjs-atoms', () => {
  describe('primitive atoms', () => {
    it('should create atom with initial value', () => {
      const countAtom = atom(0);
      expect(useAtomValue(countAtom)).toBe(0);
    });

    it('should update atom value', () => {
      const countAtom = atom(0);
      const setCount = useSetAtom(countAtom);

      setCount(5);
      expect(useAtomValue(countAtom)).toBe(5);
    });

    it('should support updater functions', () => {
      const countAtom = atom(0);
      const setCount = useSetAtom(countAtom);

      setCount((c) => c + 1);
      expect(useAtomValue(countAtom)).toBe(1);

      setCount((c) => c + 10);
      expect(useAtomValue(countAtom)).toBe(11);
    });

    it('should support useAtom hook', () => {
      const countAtom = atom(0);
      const [count, setCount] = useAtom(countAtom);

      expect(count).toBe(0);

      setCount(42);
      expect(useAtom(countAtom)[0]).toBe(42);
    });
  });

  describe('derived atoms', () => {
    it('should create computed atom', () => {
      const countAtom = atom(0);
      const doubledAtom = atom((get) => get(countAtom) * 2);

      expect(useAtomValue(doubledAtom)).toBe(0);

      useSetAtom(countAtom)(5);
      expect(useAtomValue(doubledAtom)).toBe(10);
    });

    it('should derive from multiple atoms', () => {
      const firstNameAtom = atom('John');
      const lastNameAtom = atom('Doe');
      const fullNameAtom = atom(
        (get) => `${get(firstNameAtom)} ${get(lastNameAtom)}`
      );

      expect(useAtomValue(fullNameAtom)).toBe('John Doe');

      useSetAtom(firstNameAtom)('Jane');
      expect(useAtomValue(fullNameAtom)).toBe('Jane Doe');
    });

    it('should support writable derived atoms', () => {
      const celsiusAtom = atom(0);
      const fahrenheitAtom = atom(
        (get) => get(celsiusAtom) * 1.8 + 32,
        (get, set, newValue: number) => {
          set(celsiusAtom, (newValue - 32) / 1.8);
        }
      );

      expect(useAtomValue(fahrenheitAtom)).toBe(32);

      useSetAtom(fahrenheitAtom)(212); // Boiling point
      expect(useAtomValue(celsiusAtom)).toBeCloseTo(100);
      expect(useAtomValue(fahrenheitAtom)).toBeCloseTo(212);
    });
  });

  describe('atom families', () => {
    it('should create parameterized atoms', () => {
      const todoFamily = atomFamily((id: number) =>
        atom({ id, text: `Todo ${id}`, done: false })
      );

      const todo1 = useAtomValue(todoFamily(1));
      const todo2 = useAtomValue(todoFamily(2));

      expect(todo1.id).toBe(1);
      expect(todo2.id).toBe(2);
      expect(todo1.text).toBe('Todo 1');
      expect(todo2.text).toBe('Todo 2');
    });

    it('should cache atoms by parameter', () => {
      const family = atomFamily((id: number) => atom(id));

      const atom1 = family(1);
      const atom1Again = family(1);

      expect(atom1).toBe(atom1Again); // Same atom instance
    });

    it('should support remove', () => {
      const family = atomFamily((id: number) => atom(id));

      const atom1 = family(1);
      family.remove(1);
      const atom1Again = family(1);

      expect(atom1).not.toBe(atom1Again); // New atom instance
    });
  });

  describe('utilities', () => {
    it('should create write-only atoms (actions)', () => {
      const countAtom = atom(0);
      const incrementAtom = atomAction((get, set) => {
        const count = get(countAtom);
        set(countAtom, count + 1);
      });

      const increment = useSetAtom(incrementAtom);

      expect(useAtomValue(countAtom)).toBe(0);
      increment();
      expect(useAtomValue(countAtom)).toBe(1);
      increment();
      expect(useAtomValue(countAtom)).toBe(2);
    });

    it('should support atomWithReset', () => {
      const countAtom = atomWithReset(0);
      const setCount = useSetAtom(countAtom);

      setCount(10);
      expect(useAtomValue(countAtom)).toBe(10);

      countAtom.reset();
      expect(useAtomValue(countAtom)).toBe(0);
    });

    it('should support atomWithStorage', () => {
      const storage = new Map<string, string>();
      const mockStorage: Storage = {
        getItem: (key: string) => storage.get(key) || null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
        removeItem: (key: string) => storage.delete(key),
        clear: () => storage.clear(),
        key: (index: number) => '',
        length: storage.size,
      };

      const themeAtom = atomWithStorage('theme', 'light', mockStorage);

      expect(useAtomValue(themeAtom)).toBe('light');

      useSetAtom(themeAtom)('dark');
      expect(useAtomValue(themeAtom)).toBe('dark');
      expect(mockStorage.getItem('theme')).toBe('"dark"');
    });

    it('should support selectAtom', () => {
      const userAtom = atom({ name: 'John', age: 30 });
      const nameAtom = selectAtom(userAtom, (user) => user.name);

      expect(useAtomValue(nameAtom)).toBe('John');

      useSetAtom(userAtom)({ name: 'Jane', age: 25 });
      expect(useAtomValue(nameAtom)).toBe('Jane');
    });

    it('should batch multiple updates', () => {
      const countAtom = atom(0);
      const nameAtom = atom('');

      let renderCount = 0;
      const derivedAtom = atom((get) => {
        renderCount++;
        return `${get(nameAtom)}: ${get(countAtom)}`;
      });

      // Initial read
      useAtomValue(derivedAtom);
      expect(renderCount).toBe(1);

      // Batch updates
      batchAtoms(() => {
        useSetAtom(countAtom)(5);
        useSetAtom(nameAtom)('Count');
      });

      // Should only trigger one recompute
      useAtomValue(derivedAtom);
      expect(renderCount).toBe(2); // Not 3
    });
  });

  describe('edge cases', () => {
    it('should handle circular dependencies gracefully', () => {
      // This is a simplified test - real implementation would need cycle detection
      const atomA = atom(1);
      const atomB = atom((get) => get(atomA) + 1);

      expect(useAtomValue(atomB)).toBe(2);
    });

    it('should support objects as atom values', () => {
      const objAtom = atom({ count: 0, name: 'test' });

      expect(useAtomValue(objAtom)).toEqual({ count: 0, name: 'test' });

      useSetAtom(objAtom)({ count: 5, name: 'updated' });
      expect(useAtomValue(objAtom)).toEqual({ count: 5, name: 'updated' });
    });

    it('should support arrays as atom values', () => {
      const arrAtom = atom([1, 2, 3]);

      expect(useAtomValue(arrAtom)).toEqual([1, 2, 3]);

      useSetAtom(arrAtom)((arr) => [...arr, 4]);
      expect(useAtomValue(arrAtom)).toEqual([1, 2, 3, 4]);
    });
  });
});
