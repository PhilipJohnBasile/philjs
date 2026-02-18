/**
 * Tests for PhilJS Hooks - State Hooks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  useDisclosure,
  useToggle,
  useCounter,
  useListState,
  useMap,
  useSet,
  useQueue,
} from './index';

describe('State Hooks', () => {
  describe('useDisclosure', () => {
    it('should initialize with default value false', () => {
      const [opened] = useDisclosure();
      expect(opened.get()).toBe(false);
    });

    it('should initialize with custom initial value', () => {
      const [opened] = useDisclosure(true);
      expect(opened.get()).toBe(true);
    });

    it('should open disclosure', () => {
      const [opened, handlers] = useDisclosure(false);
      handlers.open();
      expect(opened.get()).toBe(true);
    });

    it('should close disclosure', () => {
      const [opened, handlers] = useDisclosure(true);
      handlers.close();
      expect(opened.get()).toBe(false);
    });

    it('should toggle disclosure', () => {
      const [opened, handlers] = useDisclosure(false);
      handlers.toggle();
      expect(opened.get()).toBe(true);
      handlers.toggle();
      expect(opened.get()).toBe(false);
    });

    it('should call onOpen callback when opening', () => {
      const onOpen = vi.fn();
      const [, handlers] = useDisclosure(false, { onOpen });
      handlers.open();
      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('should call onClose callback when closing', () => {
      const onClose = vi.fn();
      const [, handlers] = useDisclosure(true, { onClose });
      handlers.close();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onOpen if already open', () => {
      const onOpen = vi.fn();
      const [, handlers] = useDisclosure(true, { onOpen });
      handlers.open();
      expect(onOpen).not.toHaveBeenCalled();
    });

    it('should not call onClose if already closed', () => {
      const onClose = vi.fn();
      const [, handlers] = useDisclosure(false, { onClose });
      handlers.close();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('useToggle', () => {
    it('should initialize with initial value', () => {
      const [state] = useToggle('a', ['a', 'b', 'c']);
      expect(state.get()).toBe('a');
    });

    it('should toggle through values', () => {
      const [state, toggle] = useToggle('a', ['a', 'b', 'c']);
      toggle();
      expect(state.get()).toBe('b');
      toggle();
      expect(state.get()).toBe('c');
      toggle();
      expect(state.get()).toBe('a');
    });

    it('should set specific value', () => {
      const [state, toggle] = useToggle('a', ['a', 'b', 'c']);
      toggle('c');
      expect(state.get()).toBe('c');
    });

    it('should work with boolean by default', () => {
      const [state, toggle] = useToggle(false);
      expect(state.get()).toBe(false);
      toggle();
      expect(state.get()).toBe(true);
      toggle();
      expect(state.get()).toBe(false);
    });
  });

  describe('useCounter', () => {
    it('should initialize with default value 0', () => {
      const [count] = useCounter();
      expect(count.get()).toBe(0);
    });

    it('should initialize with custom value', () => {
      const [count] = useCounter(10);
      expect(count.get()).toBe(10);
    });

    it('should increment', () => {
      const [count, handlers] = useCounter(0);
      handlers.increment();
      expect(count.get()).toBe(1);
    });

    it('should decrement', () => {
      const [count, handlers] = useCounter(5);
      handlers.decrement();
      expect(count.get()).toBe(4);
    });

    it('should set value', () => {
      const [count, handlers] = useCounter(0);
      handlers.set(42);
      expect(count.get()).toBe(42);
    });

    it('should reset to initial value', () => {
      const [count, handlers] = useCounter(10);
      handlers.increment();
      handlers.increment();
      handlers.reset();
      expect(count.get()).toBe(10);
    });

    it('should respect min boundary', () => {
      const [count, handlers] = useCounter(5, { min: 0 });
      handlers.set(-10);
      expect(count.get()).toBe(0);
      handlers.decrement();
      handlers.decrement();
      handlers.decrement();
      handlers.decrement();
      handlers.decrement();
      handlers.decrement();
      expect(count.get()).toBe(0);
    });

    it('should respect max boundary', () => {
      const [count, handlers] = useCounter(5, { max: 10 });
      handlers.set(100);
      expect(count.get()).toBe(10);
      handlers.increment();
      handlers.increment();
      handlers.increment();
      handlers.increment();
      handlers.increment();
      handlers.increment();
      expect(count.get()).toBe(10);
    });

    it('should clamp initial value to boundaries', () => {
      const [count] = useCounter(100, { min: 0, max: 10 });
      expect(count.get()).toBe(10);
    });
  });

  describe('useListState', () => {
    it('should initialize with empty array by default', () => {
      const [list] = useListState<number>();
      expect(list.get()).toEqual([]);
    });

    it('should initialize with provided array', () => {
      const [list] = useListState([1, 2, 3]);
      expect(list.get()).toEqual([1, 2, 3]);
    });

    it('should append items', () => {
      const [list, handlers] = useListState([1, 2]);
      handlers.append(3, 4);
      expect(list.get()).toEqual([1, 2, 3, 4]);
    });

    it('should prepend items', () => {
      const [list, handlers] = useListState([3, 4]);
      handlers.prepend(1, 2);
      expect(list.get()).toEqual([1, 2, 3, 4]);
    });

    it('should insert items at index', () => {
      const [list, handlers] = useListState([1, 4]);
      handlers.insert(1, 2, 3);
      expect(list.get()).toEqual([1, 2, 3, 4]);
    });

    it('should pop last item', () => {
      const [list, handlers] = useListState([1, 2, 3]);
      handlers.pop();
      expect(list.get()).toEqual([1, 2]);
    });

    it('should shift first item', () => {
      const [list, handlers] = useListState([1, 2, 3]);
      handlers.shift();
      expect(list.get()).toEqual([2, 3]);
    });

    it('should apply function to all items', () => {
      const [list, handlers] = useListState([1, 2, 3]);
      handlers.apply((item) => item * 2);
      expect(list.get()).toEqual([2, 4, 6]);
    });

    it('should apply function conditionally', () => {
      const [list, handlers] = useListState([1, 2, 3, 4]);
      handlers.applyWhere(
        (item) => item % 2 === 0,
        (item) => item * 10
      );
      expect(list.get()).toEqual([1, 20, 3, 40]);
    });

    it('should remove items by indices', () => {
      const [list, handlers] = useListState([1, 2, 3, 4, 5]);
      handlers.remove(1, 3);
      expect(list.get()).toEqual([1, 3, 5]);
    });

    it('should reorder items', () => {
      const [list, handlers] = useListState(['a', 'b', 'c', 'd']);
      handlers.reorder({ from: 0, to: 2 });
      expect(list.get()).toEqual(['b', 'c', 'a', 'd']);
    });

    it('should set item at index', () => {
      const [list, handlers] = useListState([1, 2, 3]);
      handlers.setItem(1, 99);
      expect(list.get()).toEqual([1, 99, 3]);
    });

    it('should set item property', () => {
      const [list, handlers] = useListState([
        { name: 'a', value: 1 },
        { name: 'b', value: 2 },
      ]);
      handlers.setItemProp(0, 'value', 100);
      expect(list.get()[0].value).toBe(100);
    });

    it('should filter items', () => {
      const [list, handlers] = useListState([1, 2, 3, 4, 5]);
      handlers.filter((item) => item > 2);
      expect(list.get()).toEqual([3, 4, 5]);
    });

    it('should set entire state', () => {
      const [list, handlers] = useListState([1, 2, 3]);
      handlers.setState([7, 8, 9]);
      expect(list.get()).toEqual([7, 8, 9]);
    });
  });

  describe('useMap', () => {
    it('should initialize with empty map by default', () => {
      const [map] = useMap<string, number>();
      expect(map.get().size).toBe(0);
    });

    it('should initialize with provided entries', () => {
      const [map] = useMap([
        ['a', 1],
        ['b', 2],
      ]);
      expect(map.get().get('a')).toBe(1);
      expect(map.get().get('b')).toBe(2);
    });

    it('should set key-value pair', () => {
      const [map, handlers] = useMap<string, number>();
      handlers.set('key', 42);
      expect(map.get().get('key')).toBe(42);
    });

    it('should delete key', () => {
      const [map, handlers] = useMap([['key', 1]]);
      handlers.delete('key');
      expect(map.get().has('key')).toBe(false);
    });

    it('should clear all entries', () => {
      const [map, handlers] = useMap([
        ['a', 1],
        ['b', 2],
      ]);
      handlers.clear();
      expect(map.get().size).toBe(0);
    });
  });

  describe('useSet', () => {
    it('should initialize with empty set by default', () => {
      const [set] = useSet<number>();
      expect(set.get().size).toBe(0);
    });

    it('should initialize with provided values', () => {
      const [set] = useSet([1, 2, 3]);
      expect(set.get().size).toBe(3);
      expect(set.get().has(1)).toBe(true);
    });

    it('should add value', () => {
      const [set, handlers] = useSet<number>();
      handlers.add(42);
      expect(set.get().has(42)).toBe(true);
    });

    it('should delete value', () => {
      const [set, handlers] = useSet([1, 2, 3]);
      handlers.delete(2);
      expect(set.get().has(2)).toBe(false);
    });

    it('should toggle value (add if not present)', () => {
      const [set, handlers] = useSet<number>();
      handlers.toggle(5);
      expect(set.get().has(5)).toBe(true);
    });

    it('should toggle value (remove if present)', () => {
      const [set, handlers] = useSet([5]);
      handlers.toggle(5);
      expect(set.get().has(5)).toBe(false);
    });

    it('should clear all values', () => {
      const [set, handlers] = useSet([1, 2, 3]);
      handlers.clear();
      expect(set.get().size).toBe(0);
    });
  });

  describe('useQueue', () => {
    it('should initialize with provided values', () => {
      const queue = useQueue([1, 2, 3]);
      expect(queue.state.get()).toEqual([1, 2, 3]);
    });

    it('should add items to state', () => {
      const queue = useQueue<number>([]);
      queue.add(1, 2);
      expect(queue.state.get()).toEqual([1, 2]);
    });

    it('should update state', () => {
      const queue = useQueue([1, 2, 3]);
      queue.update((state) => state.filter((x) => x > 1));
      expect(queue.state.get()).toEqual([2, 3]);
    });

    it('should clean queue', () => {
      const queue = useQueue<number>([]);
      // Fill state to capacity (empty initial = Infinity limit)
      queue.add(1, 2, 3);
      queue.cleanQueue();
      expect(queue.queue.get()).toEqual([]);
    });
  });
});
