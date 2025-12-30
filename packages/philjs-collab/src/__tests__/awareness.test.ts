/**
 * @philjs/collab - Awareness Tests
 * Tests for awareness protocol including local state updates,
 * remote state synchronization, and user presence tracking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  Awareness,
  createAwareness,
  createTypedAwareness,
  type AwarenessState,
  type AwarenessUpdate,
  type AwarenessConfig,
  type StandardAwarenessState,
} from '../awareness.js';

describe('Awareness', () => {
  let awareness: Awareness;

  beforeEach(() => {
    awareness = createAwareness({ clientId: 'test-client' });
  });

  afterEach(() => {
    awareness.stop();
  });

  describe('Creation', () => {
    it('should create awareness instance with client ID', () => {
      const aw = createAwareness({ clientId: 'my-client' });
      expect(aw).toBeInstanceOf(Awareness);
      aw.stop();
    });

    it('should accept custom timeout config', () => {
      const aw = createAwareness({
        clientId: 'client',
        timeout: 60000,
      });
      expect(aw).toBeInstanceOf(Awareness);
      aw.stop();
    });

    it('should accept custom gc interval config', () => {
      const aw = createAwareness({
        clientId: 'client',
        gcInterval: 5000,
      });
      expect(aw).toBeInstanceOf(Awareness);
      aw.stop();
    });
  });

  describe('Local State Management', () => {
    it('should start with empty local state', () => {
      expect(awareness.getLocalState()).toEqual({});
    });

    it('should set local state', () => {
      awareness.setLocalState({ name: 'Alice', cursor: { x: 10, y: 20 } });
      expect(awareness.getLocalState()).toEqual({
        name: 'Alice',
        cursor: { x: 10, y: 20 },
      });
    });

    it('should replace local state on setLocalState', () => {
      awareness.setLocalState({ a: 1, b: 2 });
      awareness.setLocalState({ c: 3 });
      expect(awareness.getLocalState()).toEqual({ c: 3 });
    });

    it('should update local state (merge)', () => {
      awareness.setLocalState({ name: 'Alice', color: 'blue' });
      awareness.updateLocalState({ color: 'red', cursor: { x: 0, y: 0 } });
      expect(awareness.getLocalState()).toEqual({
        name: 'Alice',
        color: 'red',
        cursor: { x: 0, y: 0 },
      });
    });

    it('should return copy of local state', () => {
      awareness.setLocalState({ value: 42 });
      const state1 = awareness.getLocalState();
      const state2 = awareness.getLocalState();
      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });
  });

  describe('Start/Stop Lifecycle', () => {
    it('should call onUpdate when started', () => {
      const onUpdate = vi.fn();
      awareness.start(onUpdate);

      expect(onUpdate).toHaveBeenCalled();
      const update = onUpdate.mock.calls[0][0] as AwarenessState;
      expect(update.clientId).toBe('test-client');
    });

    it('should emit updates after start', () => {
      const onUpdate = vi.fn();
      awareness.start(onUpdate);

      awareness.setLocalState({ test: true });

      expect(onUpdate).toHaveBeenCalledTimes(2); // Initial + setLocalState
    });

    it('should increment clock on state changes', () => {
      const onUpdate = vi.fn();
      awareness.start(onUpdate);

      const initialClock = (onUpdate.mock.calls[0][0] as AwarenessState).clock;

      awareness.setLocalState({ a: 1 });
      const secondClock = (onUpdate.mock.calls[1][0] as AwarenessState).clock;

      expect(secondClock).toBeGreaterThan(initialClock);
    });

    it('should clear state on stop', () => {
      const onUpdate = vi.fn();
      awareness.start(onUpdate);

      awareness.setLocalState({ test: true });
      awareness.stop();

      expect(awareness.getLocalState()).toEqual({});
    });
  });

  describe('Remote State Management', () => {
    it('should handle remote update', () => {
      awareness.start(vi.fn());

      const remoteState: AwarenessState = {
        clientId: 'remote-client',
        clock: 1,
        state: { name: 'Bob' },
        timestamp: Date.now(),
      };

      awareness.handleRemoteUpdate(remoteState);

      expect(awareness.getRemoteState('remote-client')).toEqual({ name: 'Bob' });
    });

    it('should ignore remote update from self', () => {
      awareness.start(vi.fn());

      const selfState: AwarenessState = {
        clientId: 'test-client',
        clock: 100,
        state: { shouldIgnore: true },
        timestamp: Date.now(),
      };

      awareness.handleRemoteUpdate(selfState);

      expect(awareness.getRemoteState('test-client')).toBeUndefined();
    });

    it('should update remote state with higher clock', () => {
      awareness.start(vi.fn());

      const state1: AwarenessState = {
        clientId: 'remote-client',
        clock: 1,
        state: { version: 1 },
        timestamp: Date.now(),
      };

      const state2: AwarenessState = {
        clientId: 'remote-client',
        clock: 2,
        state: { version: 2 },
        timestamp: Date.now(),
      };

      awareness.handleRemoteUpdate(state1);
      awareness.handleRemoteUpdate(state2);

      expect(awareness.getRemoteState('remote-client')).toEqual({ version: 2 });
    });

    it('should ignore remote update with lower or equal clock', () => {
      awareness.start(vi.fn());

      const state1: AwarenessState = {
        clientId: 'remote-client',
        clock: 5,
        state: { version: 'latest' },
        timestamp: Date.now(),
      };

      const state2: AwarenessState = {
        clientId: 'remote-client',
        clock: 3,
        state: { version: 'old' },
        timestamp: Date.now(),
      };

      awareness.handleRemoteUpdate(state1);
      awareness.handleRemoteUpdate(state2);

      expect(awareness.getRemoteState('remote-client')).toEqual({ version: 'latest' });
    });

    it('should handle client leaving', () => {
      awareness.start(vi.fn());

      const remoteState: AwarenessState = {
        clientId: 'remote-client',
        clock: 1,
        state: { name: 'Bob' },
        timestamp: Date.now(),
      };

      awareness.handleRemoteUpdate(remoteState);
      expect(awareness.getRemoteState('remote-client')).toBeDefined();

      awareness.handleClientLeave('remote-client');
      expect(awareness.getRemoteState('remote-client')).toBeUndefined();
    });

    it('should handle leaving of non-existent client', () => {
      awareness.start(vi.fn());
      expect(() => awareness.handleClientLeave('nonexistent')).not.toThrow();
    });
  });

  describe('getAllStates', () => {
    it('should include local state', () => {
      awareness.start(vi.fn());
      awareness.setLocalState({ local: true });

      const allStates = awareness.getAllStates();

      expect(allStates.get('test-client')).toEqual({ local: true });
    });

    it('should include remote states', () => {
      awareness.start(vi.fn());

      awareness.handleRemoteUpdate({
        clientId: 'client-a',
        clock: 1,
        state: { name: 'A' },
        timestamp: Date.now(),
      });

      awareness.handleRemoteUpdate({
        clientId: 'client-b',
        clock: 1,
        state: { name: 'B' },
        timestamp: Date.now(),
      });

      const allStates = awareness.getAllStates();

      expect(allStates.size).toBe(3); // local + 2 remotes
      expect(allStates.get('client-a')).toEqual({ name: 'A' });
      expect(allStates.get('client-b')).toEqual({ name: 'B' });
    });
  });

  describe('Subscription', () => {
    it('should notify subscriber on remote update', () => {
      awareness.start(vi.fn());

      const subscriber = vi.fn();
      awareness.subscribe(subscriber);

      awareness.handleRemoteUpdate({
        clientId: 'remote',
        clock: 1,
        state: { name: 'Test' },
        timestamp: Date.now(),
      });

      // First call is initial state, second is remote update
      expect(subscriber).toHaveBeenCalled();
      const lastCall = subscriber.mock.calls[subscriber.mock.calls.length - 1][0] as AwarenessUpdate;
      expect(lastCall.added).toContain('remote');
    });

    it('should notify subscriber on client leave', () => {
      awareness.start(vi.fn());

      awareness.handleRemoteUpdate({
        clientId: 'remote',
        clock: 1,
        state: { name: 'Test' },
        timestamp: Date.now(),
      });

      const subscriber = vi.fn();
      awareness.subscribe(subscriber);

      awareness.handleClientLeave('remote');

      const lastCall = subscriber.mock.calls[subscriber.mock.calls.length - 1][0] as AwarenessUpdate;
      expect(lastCall.removed).toContain('remote');
    });

    it('should send current states to new subscriber', () => {
      awareness.start(vi.fn());

      awareness.handleRemoteUpdate({
        clientId: 'existing-client',
        clock: 1,
        state: { name: 'Existing' },
        timestamp: Date.now(),
      });

      const subscriber = vi.fn();
      awareness.subscribe(subscriber);

      expect(subscriber).toHaveBeenCalled();
      const update = subscriber.mock.calls[0][0] as AwarenessUpdate;
      expect(update.added).toContain('existing-client');
    });

    it('should allow unsubscribing', () => {
      awareness.start(vi.fn());

      // First add a remote client so subscribe will have something to report
      awareness.handleRemoteUpdate({
        clientId: 'existing',
        clock: 1,
        state: { name: 'existing' },
        timestamp: Date.now(),
      });

      const subscriber = vi.fn();
      const unsubscribe = awareness.subscribe(subscriber);

      // Initial call with existing states
      expect(subscriber).toHaveBeenCalled();
      const initialCallCount = subscriber.mock.calls.length;

      unsubscribe();

      awareness.handleRemoteUpdate({
        clientId: 'new-remote',
        clock: 1,
        state: {},
        timestamp: Date.now(),
      });

      // Should not receive update after unsubscribe
      expect(subscriber).toHaveBeenCalledTimes(initialCallCount);
    });

    it('should track added vs updated clients', () => {
      awareness.start(vi.fn());

      const subscriber = vi.fn();
      awareness.subscribe(subscriber);

      // First update - should be "added"
      awareness.handleRemoteUpdate({
        clientId: 'remote',
        clock: 1,
        state: { v: 1 },
        timestamp: Date.now(),
      });

      let lastUpdate = subscriber.mock.calls[subscriber.mock.calls.length - 1][0] as AwarenessUpdate;
      expect(lastUpdate.added).toContain('remote');
      expect(lastUpdate.updated).not.toContain('remote');

      // Second update - should be "updated"
      awareness.handleRemoteUpdate({
        clientId: 'remote',
        clock: 2,
        state: { v: 2 },
        timestamp: Date.now(),
      });

      lastUpdate = subscriber.mock.calls[subscriber.mock.calls.length - 1][0] as AwarenessUpdate;
      expect(lastUpdate.added).not.toContain('remote');
      expect(lastUpdate.updated).toContain('remote');
    });
  });

  describe('Client Count and Activity', () => {
    it('should count local client', () => {
      awareness.start(vi.fn());
      expect(awareness.getClientCount()).toBe(1);
    });

    it('should count remote clients', () => {
      awareness.start(vi.fn());

      awareness.handleRemoteUpdate({
        clientId: 'client-a',
        clock: 1,
        state: {},
        timestamp: Date.now(),
      });

      awareness.handleRemoteUpdate({
        clientId: 'client-b',
        clock: 1,
        state: {},
        timestamp: Date.now(),
      });

      expect(awareness.getClientCount()).toBe(3);
    });

    it('should check if local client is active', () => {
      awareness.start(vi.fn());
      expect(awareness.isClientActive('test-client')).toBe(true);
    });

    it('should check if remote client is active', () => {
      awareness.start(vi.fn());

      expect(awareness.isClientActive('remote')).toBe(false);

      awareness.handleRemoteUpdate({
        clientId: 'remote',
        clock: 1,
        state: {},
        timestamp: Date.now(),
      });

      expect(awareness.isClientActive('remote')).toBe(true);
    });
  });

  describe('Encoding', () => {
    it('should encode local state', () => {
      awareness.start(vi.fn());
      awareness.setLocalState({ cursor: { x: 10, y: 20 } });

      const encoded = awareness.encode();

      expect(encoded.clientId).toBe('test-client');
      expect(encoded.state).toEqual({ cursor: { x: 10, y: 20 } });
      expect(encoded.clock).toBeGreaterThanOrEqual(0);
      expect(encoded.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it('should encode all states', () => {
      awareness.start(vi.fn());
      awareness.setLocalState({ local: true });

      awareness.handleRemoteUpdate({
        clientId: 'remote-1',
        clock: 1,
        state: { remote: 1 },
        timestamp: Date.now(),
      });

      awareness.handleRemoteUpdate({
        clientId: 'remote-2',
        clock: 1,
        state: { remote: 2 },
        timestamp: Date.now(),
      });

      const encoded = awareness.encodeAll();

      expect(encoded.length).toBe(3);
      expect(encoded.find(s => s.clientId === 'test-client')).toBeDefined();
      expect(encoded.find(s => s.clientId === 'remote-1')).toBeDefined();
      expect(encoded.find(s => s.clientId === 'remote-2')).toBeDefined();
    });
  });

  describe('applyStates', () => {
    it('should apply multiple states at once', () => {
      awareness.start(vi.fn());

      const states: AwarenessState[] = [
        { clientId: 'client-a', clock: 1, state: { a: true }, timestamp: Date.now() },
        { clientId: 'client-b', clock: 1, state: { b: true }, timestamp: Date.now() },
        { clientId: 'client-c', clock: 1, state: { c: true }, timestamp: Date.now() },
      ];

      awareness.applyStates(states);

      expect(awareness.getRemoteState('client-a')).toEqual({ a: true });
      expect(awareness.getRemoteState('client-b')).toEqual({ b: true });
      expect(awareness.getRemoteState('client-c')).toEqual({ c: true });
    });

    it('should ignore self state in applyStates', () => {
      awareness.start(vi.fn());
      awareness.setLocalState({ original: true });

      const states: AwarenessState[] = [
        { clientId: 'test-client', clock: 999, state: { hacked: true }, timestamp: Date.now() },
      ];

      awareness.applyStates(states);

      expect(awareness.getLocalState()).toEqual({ original: true });
    });

    it('should only apply states with higher clock', () => {
      awareness.start(vi.fn());

      // Initial state
      awareness.handleRemoteUpdate({
        clientId: 'remote',
        clock: 5,
        state: { version: 'latest' },
        timestamp: Date.now(),
      });

      // Apply mix of old and new states
      const states: AwarenessState[] = [
        { clientId: 'remote', clock: 3, state: { version: 'old' }, timestamp: Date.now() },
        { clientId: 'new-client', clock: 1, state: { new: true }, timestamp: Date.now() },
      ];

      awareness.applyStates(states);

      expect(awareness.getRemoteState('remote')).toEqual({ version: 'latest' });
      expect(awareness.getRemoteState('new-client')).toEqual({ new: true });
    });

    it('should notify subscribers on applyStates', () => {
      awareness.start(vi.fn());

      const subscriber = vi.fn();
      awareness.subscribe(subscriber);

      const states: AwarenessState[] = [
        { clientId: 'new-client', clock: 1, state: {}, timestamp: Date.now() },
      ];

      awareness.applyStates(states);

      const lastCall = subscriber.mock.calls[subscriber.mock.calls.length - 1][0] as AwarenessUpdate;
      expect(lastCall.added).toContain('new-client');
    });
  });
});

describe('createTypedAwareness', () => {
  it('should provide type-safe state access', () => {
    const awareness = createAwareness({ clientId: 'test' });
    awareness.start(vi.fn());

    const typedAwareness = createTypedAwareness<StandardAwarenessState>(awareness);

    typedAwareness.setLocalState({
      user: { name: 'Alice', color: '#ff0000' },
      cursor: { line: 10, column: 5 },
      typing: true,
    });

    const state = typedAwareness.getLocalState();
    expect(state.user?.name).toBe('Alice');
    expect(state.cursor?.line).toBe(10);
    expect(state.typing).toBe(true);

    awareness.stop();
  });

  it('should provide typed update method', () => {
    const awareness = createAwareness({ clientId: 'test' });
    awareness.start(vi.fn());

    const typedAwareness = createTypedAwareness<StandardAwarenessState>(awareness);

    typedAwareness.setLocalState({ typing: false });
    typedAwareness.updateLocalState({ typing: true });

    expect(typedAwareness.getLocalState().typing).toBe(true);

    awareness.stop();
  });

  it('should provide typed remote state access', () => {
    const awareness = createAwareness({ clientId: 'local' });
    awareness.start(vi.fn());

    awareness.handleRemoteUpdate({
      clientId: 'remote',
      clock: 1,
      state: { user: { name: 'Bob' }, typing: false },
      timestamp: Date.now(),
    });

    const typedAwareness = createTypedAwareness<StandardAwarenessState>(awareness);
    const remoteState = typedAwareness.getRemoteState('remote');

    expect(remoteState?.user?.name).toBe('Bob');
    expect(remoteState?.typing).toBe(false);

    awareness.stop();
  });

  it('should provide typed getAllStates', () => {
    const awareness = createAwareness({ clientId: 'local' });
    awareness.start(vi.fn());

    awareness.setLocalState({ typing: true });
    awareness.handleRemoteUpdate({
      clientId: 'remote',
      clock: 1,
      state: { typing: false },
      timestamp: Date.now(),
    });

    const typedAwareness = createTypedAwareness<StandardAwarenessState>(awareness);
    const allStates = typedAwareness.getAllStates();

    expect(allStates.get('local')?.typing).toBe(true);
    expect(allStates.get('remote')?.typing).toBe(false);

    awareness.stop();
  });
});

describe('User Presence Tracking', () => {
  it('should track cursor position', () => {
    const awareness = createAwareness({ clientId: 'editor-1' });
    awareness.start(vi.fn());

    awareness.setLocalState({
      cursor: { line: 10, column: 5, offset: 150 },
    });

    const state = awareness.getLocalState();
    expect(state.cursor).toEqual({ line: 10, column: 5, offset: 150 });

    awareness.stop();
  });

  it('should track selection range', () => {
    const awareness = createAwareness({ clientId: 'editor-1' });
    awareness.start(vi.fn());

    awareness.setLocalState({
      selection: {
        anchor: { line: 1, column: 0 },
        head: { line: 3, column: 10 },
      },
    });

    const state = awareness.getLocalState();
    expect(state.selection).toEqual({
      anchor: { line: 1, column: 0 },
      head: { line: 3, column: 10 },
    });

    awareness.stop();
  });

  it('should track typing indicator', () => {
    const awareness = createAwareness({ clientId: 'editor-1' });
    awareness.start(vi.fn());

    awareness.setLocalState({ typing: false });
    expect(awareness.getLocalState().typing).toBe(false);

    awareness.updateLocalState({ typing: true });
    expect(awareness.getLocalState().typing).toBe(true);

    awareness.stop();
  });

  it('should track user info', () => {
    const awareness = createAwareness({ clientId: 'editor-1' });
    awareness.start(vi.fn());

    awareness.setLocalState({
      user: {
        id: 'user-123',
        name: 'Alice Smith',
        color: '#ff5733',
        avatar: 'https://example.com/avatar.png',
      },
    });

    const state = awareness.getLocalState();
    expect(state.user).toEqual({
      id: 'user-123',
      name: 'Alice Smith',
      color: '#ff5733',
      avatar: 'https://example.com/avatar.png',
    });

    awareness.stop();
  });

  it('should track viewport', () => {
    const awareness = createAwareness({ clientId: 'editor-1' });
    awareness.start(vi.fn());

    awareness.setLocalState({
      viewportStart: 0,
      viewportEnd: 50,
    });

    const state = awareness.getLocalState();
    expect(state.viewportStart).toBe(0);
    expect(state.viewportEnd).toBe(50);

    awareness.stop();
  });

  it('should track last activity', () => {
    const awareness = createAwareness({ clientId: 'editor-1' });
    awareness.start(vi.fn());

    const now = Date.now();
    awareness.setLocalState({ lastActivity: now });

    const state = awareness.getLocalState();
    expect(state.lastActivity).toBe(now);

    awareness.stop();
  });
});
