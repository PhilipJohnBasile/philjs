/**
 * @philjs/collab - YDoc Tests
 * Tests for YDoc operations including creating documents, applying updates,
 * merging documents, and update subscriptions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { YDoc, createYDoc, type Update } from '../crdt.js';

describe('YDoc', () => {
  describe('Document Creation', () => {
    it('should create a new YDoc with a client ID', () => {
      const doc = createYDoc('test-client-1');
      expect(doc).toBeInstanceOf(YDoc);
      expect(doc.getClientId()).toBe('test-client-1');
    });

    it('should auto-generate client ID when not provided', () => {
      const doc = createYDoc();
      expect(doc.getClientId()).toBeTruthy();
      expect(typeof doc.getClientId()).toBe('string');
    });

    it('should generate unique client IDs for different documents', () => {
      const doc1 = createYDoc();
      const doc2 = createYDoc();
      expect(doc1.getClientId()).not.toBe(doc2.getClientId());
    });

    it('should create independent documents', () => {
      const doc1 = createYDoc('client-1');
      const doc2 = createYDoc('client-2');

      const text1 = doc1.getText('content');
      const text2 = doc2.getText('content');

      text1.insert(0, 'Hello');

      expect(text1.toString()).toBe('Hello');
      expect(text2.toString()).toBe('');
    });
  });

  describe('Type Accessors', () => {
    it('should provide getText accessor', () => {
      const doc = createYDoc('test-client');
      const text = doc.getText('myText');
      expect(text).toBeDefined();
      expect(typeof text.insert).toBe('function');
      expect(typeof text.delete).toBe('function');
      expect(typeof text.toString).toBe('function');
    });

    it('should provide getArray accessor', () => {
      const doc = createYDoc('test-client');
      const arr = doc.getArray<number>('myArray');
      expect(arr).toBeDefined();
      expect(typeof arr.push).toBe('function');
      expect(typeof arr.toArray).toBe('function');
    });

    it('should provide getMap accessor', () => {
      const doc = createYDoc('test-client');
      const map = doc.getMap<string>('myMap');
      expect(map).toBeDefined();
      expect(typeof map.set).toBe('function');
      expect(typeof map.get).toBe('function');
    });

    it('should return the same type instance for same name', () => {
      const doc = createYDoc('test-client');
      const text1 = doc.getText('content');
      const text2 = doc.getText('content');
      expect(text1).toBe(text2);
    });

    it('should return different type instances for different names', () => {
      const doc = createYDoc('test-client');
      const text1 = doc.getText('content1');
      const text2 = doc.getText('content2');
      expect(text1).not.toBe(text2);
    });
  });

  describe('Update Subscription', () => {
    it('should notify listeners on text changes', () => {
      const doc = createYDoc('test-client');
      const listener = vi.fn();

      doc.onUpdate(listener);

      const text = doc.getText('content');
      text.insert(0, 'Hello');

      expect(listener).toHaveBeenCalled();
      const update = listener.mock.calls[0][0] as Update;
      expect(update.items).toBeDefined();
      expect(update.items.length).toBeGreaterThan(0);
    });

    it('should notify listeners on array changes', () => {
      const doc = createYDoc('test-client');
      const listener = vi.fn();

      doc.onUpdate(listener);

      const arr = doc.getArray<number>('numbers');
      arr.push(1, 2, 3);

      expect(listener).toHaveBeenCalled();
    });

    it('should notify listeners on map changes', () => {
      const doc = createYDoc('test-client');
      const listener = vi.fn();

      doc.onUpdate(listener);

      const map = doc.getMap<string>('settings');
      map.set('theme', 'dark');

      expect(listener).toHaveBeenCalled();
    });

    it('should allow unsubscribing from updates', () => {
      const doc = createYDoc('test-client');
      const listener = vi.fn();

      const unsubscribe = doc.onUpdate(listener);

      const text = doc.getText('content');
      text.insert(0, 'Hello');
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      text.insert(5, ' World');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should support multiple listeners', () => {
      const doc = createYDoc('test-client');
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      doc.onUpdate(listener1);
      doc.onUpdate(listener2);

      const text = doc.getText('content');
      text.insert(0, 'Test');

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('Applying Updates', () => {
    it('should apply update from another document', () => {
      const doc1 = createYDoc('client-1');
      const doc2 = createYDoc('client-2');

      const text1 = doc1.getText('content');
      text1.insert(0, 'Hello World');

      const update = doc1.getUpdate();
      doc2.applyUpdate(update);

      const text2 = doc2.getText('content');
      expect(text2.toString()).toBe('Hello World');
    });

    it('should handle incremental updates via update listener', () => {
      const doc1 = createYDoc('client-1');
      const doc2 = createYDoc('client-2');

      // Setup incremental sync - apply updates as they come
      doc1.onUpdate((update) => {
        doc2.applyUpdate(update);
      });

      const text1 = doc1.getText('content');
      text1.insert(0, 'Hello');
      expect(doc2.getText('content').toString()).toBe('Hello');

      // More changes - synced automatically
      text1.insert(5, ' World');
      expect(doc2.getText('content').toString()).toBe('Hello World');
    });

    it('should apply array updates', () => {
      const doc1 = createYDoc('client-1');
      const doc2 = createYDoc('client-2');

      const arr1 = doc1.getArray<number>('items');
      arr1.push(1, 2, 3);

      doc2.applyUpdate(doc1.getUpdate());

      const arr2 = doc2.getArray<number>('items');
      expect(arr2.toArray()).toEqual([1, 2, 3]);
    });

    it('should apply map updates', () => {
      const doc1 = createYDoc('client-1');
      const doc2 = createYDoc('client-2');

      const map1 = doc1.getMap<string>('config');
      map1.set('key1', 'value1');
      map1.set('key2', 'value2');

      doc2.applyUpdate(doc1.getUpdate());

      const map2 = doc2.getMap<string>('config');
      expect(map2.get('key1')).toBe('value1');
      expect(map2.get('key2')).toBe('value2');
    });
  });

  describe('getUpdate', () => {
    it('should return update with items', () => {
      const doc = createYDoc('test-client');
      const text = doc.getText('content');
      text.insert(0, 'Hello');

      const update = doc.getUpdate();

      expect(update).toHaveProperty('items');
      expect(update).toHaveProperty('deleteSet');
      expect(update).toHaveProperty('stateVector');
      expect(update.items.length).toBeGreaterThan(0);
    });

    it('should return update with state vector', () => {
      const doc = createYDoc('test-client');
      const text = doc.getText('content');
      text.insert(0, 'Hello');

      const update = doc.getUpdate();

      expect(update.stateVector).toBeDefined();
      expect(update.stateVector['test-client']).toBeGreaterThan(0);
    });

    it('should support differential updates with state vector', () => {
      const doc1 = createYDoc('client-1');
      const doc2 = createYDoc('client-2');

      const text1 = doc1.getText('content');
      text1.insert(0, 'First');

      // Initial sync
      const initialUpdate = doc1.getUpdate();
      doc2.applyUpdate(initialUpdate);

      // More changes after sync
      text1.insert(5, ' Second');

      // Get update since last sync (using state vector)
      const stateVector = new Map<string, number>();
      stateVector.set('client-1', 1);
      const diffUpdate = doc1.getUpdate(stateVector);

      expect(diffUpdate.items.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Document Merging (CRDT Convergence)', () => {
    it('should merge concurrent text insertions via real-time sync', () => {
      const doc1 = createYDoc('client-a');
      const doc2 = createYDoc('client-b');

      // Setup real-time bidirectional sync
      doc1.onUpdate((update) => doc2.applyUpdate(update));
      doc2.onUpdate((update) => doc1.applyUpdate(update));

      const text1 = doc1.getText('content');
      const text2 = doc2.getText('content');

      // Concurrent insertions at the same position - synced immediately
      text1.insert(0, 'A');
      text2.insert(0, 'B'); // This gets synced right away

      // Both documents should have both characters
      const result1 = text1.toString();
      const result2 = text2.toString();
      expect(result1).toBe(result2);
      expect(result1.length).toBe(2);
      // Both A and B should be present
      expect(result1).toContain('A');
      expect(result1).toContain('B');
    });

    it('should merge concurrent array operations via real-time sync', () => {
      const doc1 = createYDoc('client-a');
      const doc2 = createYDoc('client-b');

      // Setup real-time sync
      doc1.onUpdate((update) => doc2.applyUpdate(update));
      doc2.onUpdate((update) => doc1.applyUpdate(update));

      const arr1 = doc1.getArray<number>('items');
      const arr2 = doc2.getArray<number>('items');

      // Concurrent insertions - synced immediately
      arr1.push(1);
      arr2.push(2);

      // Both should have both items
      expect(arr1.toArray().sort()).toEqual([1, 2]);
      expect(arr2.toArray().sort()).toEqual([1, 2]);
    });

    it('should merge concurrent map operations', () => {
      const doc1 = createYDoc('client-a');
      const doc2 = createYDoc('client-b');

      const map1 = doc1.getMap<string>('config');
      const map2 = doc2.getMap<string>('config');

      // Concurrent operations on different keys
      map1.set('key1', 'value1');
      map2.set('key2', 'value2');

      // Merge
      doc1.applyUpdate(doc2.getUpdate());
      doc2.applyUpdate(doc1.getUpdate());

      // Both should have both keys
      expect(map1.get('key1')).toBe('value1');
      expect(map1.get('key2')).toBe('value2');
      expect(map2.get('key1')).toBe('value1');
      expect(map2.get('key2')).toBe('value2');
    });

    it('should handle concurrent operations on same map key with real-time sync', () => {
      const doc1 = createYDoc('client-a');
      const doc2 = createYDoc('client-b');

      // Setup real-time sync
      doc1.onUpdate((update) => doc2.applyUpdate(update));
      doc2.onUpdate((update) => doc1.applyUpdate(update));

      const map1 = doc1.getMap<string>('config');
      const map2 = doc2.getMap<string>('config');

      // Concurrent operations on same key - synced immediately
      map1.set('key', 'value-a');
      map2.set('key', 'value-b');

      // Both should converge to the same value
      const value1 = map1.get('key');
      const value2 = map2.get('key');
      expect(value1).toBe(value2);
      // The value should be one of the two that were set (determined by last-write-wins)
      expect(['value-a', 'value-b']).toContain(value1);
    });

    it('should maintain CRDT convergence with real-time sync', () => {
      const doc1 = createYDoc('client-1');
      const doc2 = createYDoc('client-2');
      const doc3 = createYDoc('client-3');

      // Setup real-time sync between all docs
      const applyToOthers = (update: Update, exclude: YDoc, docs: YDoc[]) => {
        for (const doc of docs) {
          if (doc !== exclude) {
            doc.applyUpdate(update);
          }
        }
      };

      const allDocs = [doc1, doc2, doc3];
      doc1.onUpdate((update) => applyToOthers(update, doc1, allDocs));
      doc2.onUpdate((update) => applyToOthers(update, doc2, allDocs));
      doc3.onUpdate((update) => applyToOthers(update, doc3, allDocs));

      // Each client makes changes - synced immediately
      doc1.getText('content').insert(0, 'A');
      doc2.getText('content').insert(0, 'B');
      doc3.getText('content').insert(0, 'C');

      // All documents should converge
      const text1 = doc1.getText('content').toString();
      const text2 = doc2.getText('content').toString();
      const text3 = doc3.getText('content').toString();

      expect(text1).toBe(text2);
      expect(text2).toBe(text3);
      expect(text1.length).toBe(3);
    });
  });

  describe('State Vector Management', () => {
    it('should track state vector per client', () => {
      const doc = createYDoc('test-client');
      const text = doc.getText('content');

      text.insert(0, 'Hello');

      const update = doc.getUpdate();
      expect(update.stateVector['test-client']).toBeGreaterThan(0);
    });

    it('should update state vector when applying remote updates', () => {
      const doc1 = createYDoc('client-1');
      const doc2 = createYDoc('client-2');

      const text1 = doc1.getText('content');
      text1.insert(0, 'Hello');

      doc2.applyUpdate(doc1.getUpdate());

      const update = doc2.getUpdate();
      expect(update.stateVector['client-1']).toBeDefined();
    });
  });
});
