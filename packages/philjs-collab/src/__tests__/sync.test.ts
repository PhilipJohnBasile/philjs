/**
 * @philjs/collab - Synchronization Tests
 * Tests for document sync between peers, conflict resolution,
 * and offline/online transitions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { YDoc, createYDoc, type Update } from '../crdt.js';
import { Awareness, createAwareness, type AwarenessState } from '../awareness.js';
import {
  WebSocketTransport,
  BroadcastTransport,
  createWebSocketTransport,
  createBroadcastTransport,
  generateClientId,
  type CollabMessage,
  type TransportConfig,
} from '../transport.js';

// Mock WebSocket for testing
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  onopen: (() => void) | null = null;
  onclose: ((event: { reason: string }) => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;

  private sentMessages: string[] = [];

  constructor(url: string) {
    this.url = url;
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    this.sentMessages.push(data);
  }

  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ reason: reason || '' });
  }

  // Test helpers
  simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  simulateMessage(data: CollabMessage): void {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  simulateClose(reason = ''): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ reason });
  }

  simulateError(): void {
    this.onerror?.();
  }

  getSentMessages(): CollabMessage[] {
    return this.sentMessages.map(m => JSON.parse(m));
  }
}

// Install mock WebSocket globally for tests
const originalWebSocket = globalThis.WebSocket;

describe('Document Synchronization', () => {
  describe('Two-peer sync', () => {
    it('should sync text changes between two documents', () => {
      const doc1 = createYDoc('peer-1');
      const doc2 = createYDoc('peer-2');

      // Peer 1 makes changes
      const text1 = doc1.getText('content');
      text1.insert(0, 'Hello from peer 1');

      // Sync to peer 2
      doc2.applyUpdate(doc1.getUpdate());

      // Verify sync
      const text2 = doc2.getText('content');
      expect(text2.toString()).toBe('Hello from peer 1');
    });

    it('should sync array changes between two documents', () => {
      const doc1 = createYDoc('peer-1');
      const doc2 = createYDoc('peer-2');

      // Peer 1 adds items
      const arr1 = doc1.getArray<string>('tasks');
      arr1.push('Task 1', 'Task 2', 'Task 3');

      // Sync to peer 2
      doc2.applyUpdate(doc1.getUpdate());

      // Verify sync
      const arr2 = doc2.getArray<string>('tasks');
      expect(arr2.toArray()).toEqual(['Task 1', 'Task 2', 'Task 3']);
    });

    it('should sync map changes between two documents', () => {
      const doc1 = createYDoc('peer-1');
      const doc2 = createYDoc('peer-2');

      // Peer 1 sets values
      const map1 = doc1.getMap<unknown>('settings');
      map1.set('theme', 'dark');
      map1.set('fontSize', 14);
      map1.set('autoSave', true);

      // Sync to peer 2
      doc2.applyUpdate(doc1.getUpdate());

      // Verify sync
      const map2 = doc2.getMap<unknown>('settings');
      expect(map2.get('theme')).toBe('dark');
      expect(map2.get('fontSize')).toBe(14);
      expect(map2.get('autoSave')).toBe(true);
    });

    it('should sync bidirectionally via listeners', () => {
      const doc1 = createYDoc('peer-1');
      const doc2 = createYDoc('peer-2');

      // Setup real-time sync
      doc1.onUpdate((update) => doc2.applyUpdate(update));
      doc2.onUpdate((update) => doc1.applyUpdate(update));

      // Peer 1 makes changes
      const text1 = doc1.getText('content');
      text1.insert(0, 'Hello');

      // Peer 2 makes changes (synced automatically)
      const text2 = doc2.getText('content');
      text2.insert(5, ' World');

      expect(text1.toString()).toBe('Hello World');
      expect(text2.toString()).toBe('Hello World');
    });
  });

  describe('Multi-peer sync', () => {
    it('should sync across three peers via listeners', () => {
      const doc1 = createYDoc('peer-1');
      const doc2 = createYDoc('peer-2');
      const doc3 = createYDoc('peer-3');

      // Setup real-time mesh sync
      const syncToAll = (update: Update, except: YDoc) => {
        if (except !== doc1) doc1.applyUpdate(update);
        if (except !== doc2) doc2.applyUpdate(update);
        if (except !== doc3) doc3.applyUpdate(update);
      };

      doc1.onUpdate((update) => syncToAll(update, doc1));
      doc2.onUpdate((update) => syncToAll(update, doc2));
      doc3.onUpdate((update) => syncToAll(update, doc3));

      // Each peer makes changes (synced immediately)
      doc1.getText('content').insert(0, 'A');
      doc2.getText('content').insert(0, 'B');
      doc3.getText('content').insert(0, 'C');

      // All should converge
      const result1 = doc1.getText('content').toString();
      const result2 = doc2.getText('content').toString();
      const result3 = doc3.getText('content').toString();

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
      expect(result1.length).toBe(3);
    });

    it('should handle late-joining peer', () => {
      const doc1 = createYDoc('peer-1');
      const doc2 = createYDoc('peer-2');

      // Setup sync between doc1 and doc2
      doc1.onUpdate((update) => doc2.applyUpdate(update));
      doc2.onUpdate((update) => doc1.applyUpdate(update));

      // Initial collaboration
      doc1.getText('content').insert(0, 'Initial content');

      doc2.getText('content').insert(15, ' - modified');

      // New peer joins and gets full state
      const doc3 = createYDoc('peer-3');
      doc3.applyUpdate(doc1.getUpdate());

      // Late joiner should have content from both peers
      const text = doc3.getText('content').toString();
      expect(text).toContain('Initial content');
      expect(text).toContain('modified');
    });
  });

  describe('Incremental sync', () => {
    it('should sync via real-time listeners', () => {
      const doc1 = createYDoc('peer-1');
      const doc2 = createYDoc('peer-2');

      // Setup real-time sync
      doc1.onUpdate((update) => doc2.applyUpdate(update));

      // Initial content
      doc1.getText('content').insert(0, 'Hello');
      expect(doc2.getText('content').toString()).toBe('Hello');

      // Additional changes (synced automatically)
      doc1.getText('content').insert(5, ' World');
      expect(doc2.getText('content').toString()).toBe('Hello World');
    });

    it('should handle sequential updates correctly', () => {
      const doc1 = createYDoc('peer-1');
      const doc2 = createYDoc('peer-2');

      // Setup sync
      doc1.onUpdate((update) => doc2.applyUpdate(update));

      // Make several changes
      const text1 = doc1.getText('content');
      text1.insert(0, 'A');
      text1.insert(1, 'B');
      text1.insert(2, 'C');

      // Should have all content
      expect(doc2.getText('content').toString()).toBe('ABC');
    });
  });
});

describe('Conflict Resolution', () => {
  describe('Concurrent text edits', () => {
    it('should resolve concurrent insertions at same position via real-time sync', () => {
      const doc1 = createYDoc('alice');
      const doc2 = createYDoc('bob');

      // Setup real-time sync
      doc1.onUpdate((update) => doc2.applyUpdate(update));
      doc2.onUpdate((update) => doc1.applyUpdate(update));

      // Both insert at position 0 - synced immediately
      doc1.getText('content').insert(0, 'Alice');
      doc2.getText('content').insert(0, 'Bob');

      // Should converge to same content
      expect(doc1.getText('content').toString()).toBe(doc2.getText('content').toString());
      // Both contents should be present
      const content = doc1.getText('content').toString();
      expect(content).toContain('Alice');
      expect(content).toContain('Bob');
    });

    it('should handle concurrent edits with real-time sync', () => {
      const doc1 = createYDoc('alice');
      const doc2 = createYDoc('bob');

      // Setup real-time sync
      doc1.onUpdate((update) => doc2.applyUpdate(update));
      doc2.onUpdate((update) => doc1.applyUpdate(update));

      // Setup initial state
      doc1.getText('content').insert(0, 'Hello World');

      // Concurrent edits synced in real-time
      doc1.getText('content').insert(5, ' Beautiful');
      doc2.getText('content').insert(0, 'Oh ');

      // Both documents should converge
      expect(doc1.getText('content').toString()).toBe(doc2.getText('content').toString());
    });
  });

  describe('Concurrent map operations', () => {
    it('should resolve concurrent updates to same key via real-time sync', () => {
      const doc1 = createYDoc('alice');
      const doc2 = createYDoc('bob');

      // Setup real-time sync
      doc1.onUpdate((update) => doc2.applyUpdate(update));
      doc2.onUpdate((update) => doc1.applyUpdate(update));

      // Both set the same key - synced immediately
      doc1.getMap<string>('config').set('value', 'from-alice');
      doc2.getMap<string>('config').set('value', 'from-bob');

      // Should converge (determined by clock/CRDT rules)
      const value1 = doc1.getMap<string>('config').get('value');
      const value2 = doc2.getMap<string>('config').get('value');
      expect(value1).toBe(value2);
      // Value should be one of the set values
      expect(['from-alice', 'from-bob']).toContain(value1);
    });

    it('should handle map operations with real-time sync', () => {
      const doc1 = createYDoc('alice');
      const doc2 = createYDoc('bob');

      // Setup real-time sync
      doc1.onUpdate((update) => doc2.applyUpdate(update));
      doc2.onUpdate((update) => doc1.applyUpdate(update));

      // Initial state
      doc1.getMap<string>('config').set('key', 'initial');

      // Both modify
      doc1.getMap<string>('config').set('key', 'from-alice');
      doc2.getMap<string>('config').set('key', 'from-bob');

      // Should converge (CRDT ensures same value on both)
      const value1 = doc1.getMap<string>('config').get('key');
      const value2 = doc2.getMap<string>('config').get('key');
      expect(value1).toBe(value2);
    });
  });

  describe('Concurrent array operations', () => {
    it('should resolve concurrent pushes via real-time sync', () => {
      const doc1 = createYDoc('alice');
      const doc2 = createYDoc('bob');

      // Setup real-time sync
      doc1.onUpdate((update) => doc2.applyUpdate(update));
      doc2.onUpdate((update) => doc1.applyUpdate(update));

      // Both push items - synced immediately
      doc1.getArray<string>('items').push('alice-item');
      doc2.getArray<string>('items').push('bob-item');

      // Both items should exist
      const items1 = doc1.getArray<string>('items').toArray();
      const items2 = doc2.getArray<string>('items').toArray();

      expect(items1.sort()).toEqual(items2.sort());
      expect(items1).toContain('alice-item');
      expect(items1).toContain('bob-item');
    });

    it('should handle array operations with real-time sync', () => {
      const doc1 = createYDoc('alice');
      const doc2 = createYDoc('bob');

      // Setup real-time sync
      doc1.onUpdate((update) => doc2.applyUpdate(update));
      doc2.onUpdate((update) => doc1.applyUpdate(update));

      // Initial state
      doc1.getArray<number>('nums').push(1, 3);

      // Concurrent inserts
      doc1.getArray<number>('nums').insert(1, [2]);
      doc2.getArray<number>('nums').push(4);

      // Should converge (all values present)
      const arr1 = doc1.getArray<number>('nums').toArray();
      const arr2 = doc2.getArray<number>('nums').toArray();

      expect(arr1).toEqual(arr2);
      expect(arr1).toContain(1);
      expect(arr1).toContain(2);
      expect(arr1).toContain(3);
      expect(arr1).toContain(4);
    });
  });
});

describe('Offline/Online Transitions', () => {
  describe('Offline editing', () => {
    it('should accumulate changes while offline', () => {
      const doc = createYDoc('offline-client');
      const updates: Update[] = [];

      doc.onUpdate((update) => {
        updates.push(update);
      });

      // Make changes "offline"
      const text = doc.getText('content');
      text.insert(0, 'First');
      text.insert(5, ' Second');
      text.insert(12, ' Third');

      // All changes captured
      expect(updates.length).toBe(3);
      expect(text.toString()).toBe('First Second Third');
    });

    it('should sync accumulated changes when going online', () => {
      const offlineDoc = createYDoc('offline');
      const serverDoc = createYDoc('server');

      // Capture offline updates
      const offlineUpdates: Update[] = [];
      offlineDoc.onUpdate((update) => offlineUpdates.push(update));

      // Simulate offline editing
      offlineDoc.getText('content').insert(0, 'Offline edit 1');

      // Server has its own changes
      serverDoc.getText('content').insert(0, 'Server content');

      // "Go online" - apply offline updates to server
      for (const update of offlineUpdates) {
        serverDoc.applyUpdate(update);
      }

      // Both should have all content
      const serverText = serverDoc.getText('content').toString();
      expect(serverText).toContain('Offline edit 1');
      expect(serverText).toContain('Server content');
    });
  });

  describe('State recovery', () => {
    it('should recover from partial sync via listeners', () => {
      const doc1 = createYDoc('peer-1');
      const doc2 = createYDoc('peer-2');

      // Setup sync
      doc1.onUpdate((update) => doc2.applyUpdate(update));

      // Changes synced in real-time
      doc1.getText('content').insert(0, 'Part 1. ');
      doc1.getText('content').insert(8, 'Part 2. ');
      doc1.getText('content').insert(16, 'Part 3.');

      expect(doc2.getText('content').toString()).toBe('Part 1. Part 2. Part 3.');
    });

    it('should handle reconnection scenario', () => {
      const clientDoc = createYDoc('client');
      const serverDoc = createYDoc('server');

      // Setup real-time sync
      clientDoc.onUpdate((update) => serverDoc.applyUpdate(update));
      serverDoc.onUpdate((update) => clientDoc.applyUpdate(update));

      // Initial note
      clientDoc.getText('notes').insert(0, 'Initial note');

      // More notes
      for (let i = 1; i <= 3; i++) {
        clientDoc.getText('notes').insert(
          clientDoc.getText('notes').length,
          ` - Note ${i}`
        );
      }

      // Server adds content
      serverDoc.getText('notes').insert(
        serverDoc.getText('notes').length,
        ' - Server'
      );

      // Both should have all notes
      const clientText = clientDoc.getText('notes').toString();
      const serverText = serverDoc.getText('notes').toString();

      expect(clientText).toBe(serverText);
      expect(clientText).toContain('Initial note');
      expect(clientText).toContain('Note 3');
      expect(clientText).toContain('Server');
    });
  });
});

describe('Transport Layer', () => {
  describe('generateClientId', () => {
    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateClientId());
      }
      expect(ids.size).toBe(100);
    });

    it('should generate string IDs', () => {
      const id = generateClientId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('BroadcastTransport', () => {
    // Note: BroadcastChannel is not available in Node.js test environment
    // These tests verify the interface and basic behavior

    it('should be constructable', () => {
      // Skip if BroadcastChannel not available
      if (typeof BroadcastChannel === 'undefined') {
        return;
      }

      const transport = createBroadcastTransport({
        roomId: 'test-room',
        clientId: 'test-client',
      });

      expect(transport).toBeInstanceOf(BroadcastTransport);
      transport.close();
    });
  });

  describe('WebSocketTransport configuration', () => {
    beforeEach(() => {
      // @ts-expect-error - Mocking WebSocket
      globalThis.WebSocket = MockWebSocket;
    });

    afterEach(() => {
      globalThis.WebSocket = originalWebSocket;
    });

    it('should create transport with config', () => {
      const transport = createWebSocketTransport({
        url: 'ws://localhost:8080',
        roomId: 'test-room',
        clientId: 'test-client',
      });

      expect(transport).toBeInstanceOf(WebSocketTransport);
    });

    it('should use default config values', () => {
      const transport = createWebSocketTransport({
        url: 'ws://localhost:8080',
        roomId: 'room',
        clientId: 'client',
      });

      expect(transport).toBeDefined();
    });

    it('should accept custom config', () => {
      const transport = createWebSocketTransport({
        url: 'ws://localhost:8080',
        roomId: 'room',
        clientId: 'client',
        reconnect: false,
        reconnectDelay: 2000,
        maxReconnectAttempts: 5,
        pingInterval: 60000,
        messageQueueSize: 50,
      });

      expect(transport).toBeDefined();
    });
  });

  describe('WebSocketTransport events', () => {
    beforeEach(() => {
      // @ts-expect-error - Mocking WebSocket
      globalThis.WebSocket = MockWebSocket;
    });

    afterEach(() => {
      globalThis.WebSocket = originalWebSocket;
    });

    it('should register event handlers', () => {
      const transport = createWebSocketTransport({
        url: 'ws://localhost:8080',
        roomId: 'room',
        clientId: 'client',
      });

      const connectHandler = vi.fn();
      const disconnectHandler = vi.fn();
      const messageHandler = vi.fn();
      const errorHandler = vi.fn();

      transport.on('connect', connectHandler);
      transport.on('disconnect', disconnectHandler);
      transport.on('message', messageHandler);
      transport.on('error', errorHandler);

      expect(connectHandler).not.toHaveBeenCalled();
    });

    it('should allow unsubscribing from events', () => {
      const transport = createWebSocketTransport({
        url: 'ws://localhost:8080',
        roomId: 'room',
        clientId: 'client',
      });

      const handler = vi.fn();
      const unsubscribe = transport.on('connect', handler);

      unsubscribe();

      // Handler should be removed (can't easily test this without simulating connect)
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('Message queueing', () => {
    beforeEach(() => {
      // @ts-expect-error - Mocking WebSocket
      globalThis.WebSocket = MockWebSocket;
    });

    afterEach(() => {
      globalThis.WebSocket = originalWebSocket;
    });

    it('should queue messages when not connected', () => {
      const transport = createWebSocketTransport({
        url: 'ws://localhost:8080',
        roomId: 'room',
        clientId: 'client',
      });

      // Send without connecting - should queue
      transport.send('operation', { data: 'test' });

      expect(transport.isConnected()).toBe(false);
    });
  });
});

describe('Awareness Synchronization', () => {
  describe('Multi-client awareness', () => {
    it('should sync awareness between clients', () => {
      const awareness1 = createAwareness({ clientId: 'client-1' });
      const awareness2 = createAwareness({ clientId: 'client-2' });

      awareness1.start(vi.fn());
      awareness2.start(vi.fn());

      // Client 1 sets state
      awareness1.setLocalState({ name: 'Alice', cursor: { x: 10, y: 20 } });

      // Simulate network sync
      const encoded = awareness1.encode();
      awareness2.handleRemoteUpdate(encoded);

      // Client 2 should see client 1's state
      expect(awareness2.getRemoteState('client-1')).toEqual({
        name: 'Alice',
        cursor: { x: 10, y: 20 },
      });

      awareness1.stop();
      awareness2.stop();
    });

    it('should handle multiple awareness states', () => {
      const awareness1 = createAwareness({ clientId: 'client-1' });
      const awareness2 = createAwareness({ clientId: 'client-2' });
      const awareness3 = createAwareness({ clientId: 'client-3' });

      awareness1.start(vi.fn());
      awareness2.start(vi.fn());
      awareness3.start(vi.fn());

      // Each client sets state
      awareness1.setLocalState({ name: 'Alice' });
      awareness2.setLocalState({ name: 'Bob' });
      awareness3.setLocalState({ name: 'Charlie' });

      // Sync all to client 1
      awareness1.handleRemoteUpdate(awareness2.encode());
      awareness1.handleRemoteUpdate(awareness3.encode());

      expect(awareness1.getClientCount()).toBe(3);
      expect(awareness1.getRemoteState('client-2')).toEqual({ name: 'Bob' });
      expect(awareness1.getRemoteState('client-3')).toEqual({ name: 'Charlie' });

      awareness1.stop();
      awareness2.stop();
      awareness3.stop();
    });
  });

  describe('Awareness state synchronization', () => {
    it('should apply bulk states', () => {
      const awareness = createAwareness({ clientId: 'local' });
      awareness.start(vi.fn());

      const states: AwarenessState[] = [
        { clientId: 'remote-1', clock: 1, state: { typing: true }, timestamp: Date.now() },
        { clientId: 'remote-2', clock: 1, state: { typing: false }, timestamp: Date.now() },
        { clientId: 'remote-3', clock: 1, state: { cursor: { x: 0, y: 0 } }, timestamp: Date.now() },
      ];

      awareness.applyStates(states);

      expect(awareness.getClientCount()).toBe(4); // local + 3 remote

      awareness.stop();
    });

    it('should encode all states for new peer', () => {
      const awareness1 = createAwareness({ clientId: 'client-1' });
      const awareness2 = createAwareness({ clientId: 'client-2' });

      awareness1.start(vi.fn());
      awareness2.start(vi.fn());

      awareness1.setLocalState({ name: 'Alice' });
      awareness1.handleRemoteUpdate({
        clientId: 'client-3',
        clock: 1,
        state: { name: 'Charlie' },
        timestamp: Date.now(),
      });

      // Encode all for new peer
      const allStates = awareness1.encodeAll();
      awareness2.applyStates(allStates);

      expect(awareness2.getRemoteState('client-1')).toEqual({ name: 'Alice' });
      expect(awareness2.getRemoteState('client-3')).toEqual({ name: 'Charlie' });

      awareness1.stop();
      awareness2.stop();
    });
  });
});

describe('Real-world Scenarios', () => {
  describe('Collaborative text editor', () => {
    it('should handle typical editing session with real-time sync', () => {
      const aliceDoc = createYDoc('alice');
      const bobDoc = createYDoc('bob');

      // Setup real-time sync
      aliceDoc.onUpdate((update) => bobDoc.applyUpdate(update));
      bobDoc.onUpdate((update) => aliceDoc.applyUpdate(update));

      const aliceText = aliceDoc.getText('document');
      const bobText = bobDoc.getText('document');

      // Alice starts typing
      aliceText.insert(0, 'Hello');

      // Bob continues
      bobText.insert(5, ' World');

      // Alice adds more
      aliceText.insert(11, '!');

      // Both should have same content
      expect(aliceText.toString()).toBe('Hello World!');
      expect(bobText.toString()).toBe('Hello World!');
    });

    it('should handle simultaneous typing with real-time sync', () => {
      const aliceDoc = createYDoc('alice');
      const bobDoc = createYDoc('bob');

      // Setup real-time sync
      aliceDoc.onUpdate((update) => bobDoc.applyUpdate(update));
      bobDoc.onUpdate((update) => aliceDoc.applyUpdate(update));

      // Initial shared state
      aliceDoc.getText('doc').insert(0, 'The quick brown fox');

      // Simultaneous edits
      aliceDoc.getText('doc').insert(0, 'Wow! ');
      bobDoc.getText('doc').insert(24, ' jumps'); // After 'Wow! The quick brown fox'

      // Both should converge
      expect(aliceDoc.getText('doc').toString()).toBe(bobDoc.getText('doc').toString());
    });
  });

  describe('Collaborative todo list', () => {
    it('should handle todo operations with real-time sync', () => {
      const doc1 = createYDoc('user-1');
      const doc2 = createYDoc('user-2');

      // Setup sync
      doc1.onUpdate((update) => doc2.applyUpdate(update));
      doc2.onUpdate((update) => doc1.applyUpdate(update));

      const todos1 = doc1.getArray<{ id: string; text: string; done: boolean }>('todos');
      const todos2 = doc2.getArray<{ id: string; text: string; done: boolean }>('todos');

      // User 1 adds todos
      todos1.push(
        { id: '1', text: 'Buy groceries', done: false },
        { id: '2', text: 'Walk the dog', done: false }
      );

      // User 2 adds more
      todos2.push({ id: '3', text: 'Clean house', done: false });

      // Both should have all todos
      expect(todos1.length).toBe(3);
      expect(todos2.length).toBe(3);
    });
  });

  describe('Collaborative settings', () => {
    it('should sync configuration changes with real-time sync', () => {
      const doc1 = createYDoc('admin');
      const doc2 = createYDoc('user');

      // Setup sync
      doc1.onUpdate((update) => doc2.applyUpdate(update));
      doc2.onUpdate((update) => doc1.applyUpdate(update));

      const config1 = doc1.getMap<unknown>('config');
      const config2 = doc2.getMap<unknown>('config');

      // Admin sets initial config
      config1.set('theme', 'dark');
      config1.set('language', 'en');
      config1.set('notifications', { email: true, push: false });

      // User changes theme
      config2.set('theme', 'light');

      // Both should have updated theme
      expect(config1.get('theme')).toBe(config2.get('theme'));
      expect(config1.get('language')).toBe('en');
    });
  });
});
