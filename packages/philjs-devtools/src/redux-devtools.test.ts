import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ReduxDevTools,
  initReduxDevTools,
  ActionReplayer,
  StatePersistence,
  type ReduxAction,
} from './redux-devtools';

describe('philjs-devtools - Redux DevTools', () => {
  describe('ReduxDevTools', () => {
    it('should initialize with initial state', () => {
      const devTools = new ReduxDevTools({ count: 0 }, { name: 'TestStore' });

      expect(devTools.currentState()).toEqual({ count: 0 });
      expect(devTools.isConnected()).toBe(false); // No extension in test env
    });

    it('should send actions and update state', () => {
      const devTools = new ReduxDevTools({ count: 0 });

      devTools.send({ type: 'INCREMENT' }, { count: 1 });
      expect(devTools.currentState()).toEqual({ count: 1 });

      devTools.send({ type: 'INCREMENT' }, { count: 2 });
      expect(devTools.currentState()).toEqual({ count: 2 });
    });

    it('should track action history', () => {
      const devTools = new ReduxDevTools({ count: 0 });

      devTools.send({ type: 'INCREMENT' }, { count: 1 });
      devTools.send({ type: 'DECREMENT' }, { count: 0 });

      const history = devTools.getHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should export and import state', () => {
      const devTools = new ReduxDevTools({ count: 0 });

      devTools.send({ type: 'INCREMENT' }, { count: 1 });
      devTools.send({ type: 'INCREMENT' }, { count: 2 });

      const exported = devTools.exportState();
      expect(typeof exported).toBe('string');

      const newDevTools = new ReduxDevTools({ count: 0 });
      newDevTools.importState(exported);

      const current = newDevTools.getSnapshot();
      expect(current).toBeTruthy();
    });

    it('should get diff between states', () => {
      const devTools = new ReduxDevTools({ count: 0, name: 'test' });

      devTools.send({ type: 'INCREMENT' }, { count: 1, name: 'test' });
      devTools.send({ type: 'RENAME' }, { count: 1, name: 'updated' });

      const history = devTools.getHistory();
      if (history.length >= 2) {
        const diff = devTools.getDiff(0, 1);
        expect(diff.length).toBeGreaterThan(0);
      }
    });

    it('should respect action blacklist', () => {
      const devTools = new ReduxDevTools(
        { count: 0 },
        { actionsBlacklist: ['IGNORED_ACTION'] }
      );

      devTools.send({ type: 'IGNORED_ACTION' }, { count: 1 });
      const history = devTools.getHistory();

      const hasIgnoredAction = history.some(
        (h) => h.metadata?.action?.type === 'IGNORED_ACTION'
      );
      expect(hasIgnoredAction).toBe(false);
    });

    it('should respect action whitelist', () => {
      const devTools = new ReduxDevTools(
        { count: 0 },
        { actionsWhitelist: ['ALLOWED_ACTION'] }
      );

      devTools.send({ type: 'NOT_ALLOWED' }, { count: 1 });
      devTools.send({ type: 'ALLOWED_ACTION' }, { count: 2 });

      const history = devTools.getHistory();
      const hasNotAllowed = history.some(
        (h) => h.metadata?.action?.type === 'NOT_ALLOWED'
      );
      expect(hasNotAllowed).toBe(false);
    });

    it('should sanitize actions', () => {
      const actionSanitizer = vi.fn((action) => ({
        ...action,
        payload: '[SANITIZED]',
      }));

      const devTools = new ReduxDevTools(
        { count: 0 },
        { actionSanitizer }
      );

      devTools.send({ type: 'ACTION', payload: 'secret' }, { count: 1 });

      expect(actionSanitizer).toHaveBeenCalled();
    });

    it('should handle pause/unpause', () => {
      const devTools = new ReduxDevTools({ count: 0 });

      expect(devTools.isPaused()).toBe(false);

      // Simulate pause from DevTools
      devTools.isPaused.set(true);
      expect(devTools.isPaused()).toBe(true);

      // When paused, actions should not be sent
      const historyBefore = devTools.getHistory().length;
      devTools.send({ type: 'INCREMENT' }, { count: 1 });
      const historyAfter = devTools.getHistory().length;

      // Should not add to history when paused
      expect(historyAfter).toBe(historyBefore);
    });
  });

  describe('ActionReplayer', () => {
    it('should record actions', () => {
      const replayer = new ActionReplayer();

      replayer.record({ type: 'INCREMENT' }, { count: 1 });
      replayer.record({ type: 'INCREMENT' }, { count: 2 });

      const actions = replayer.getActions();
      expect(actions).toHaveLength(2);
    });

    it('should replay actions', async () => {
      const replayer = new ActionReplayer();
      const onAction = vi.fn();

      replayer.record({ type: 'INCREMENT' }, { count: 1 });
      replayer.record({ type: 'INCREMENT' }, { count: 2 });

      await replayer.replay(onAction, 10); // Fast replay

      expect(onAction).toHaveBeenCalledTimes(2);
      expect(onAction).toHaveBeenNthCalledWith(
        1,
        { type: 'INCREMENT' },
        { count: 1 }
      );
      expect(onAction).toHaveBeenNthCalledWith(
        2,
        { type: 'INCREMENT' },
        { count: 2 }
      );
    });

    it('should stop replay', async () => {
      const replayer = new ActionReplayer();
      const onAction = vi.fn();

      for (let i = 0; i < 10; i++) {
        replayer.record({ type: 'INCREMENT' }, { count: i });
      }

      const replayPromise = replayer.replay(onAction, 50);

      // Stop after a short delay
      setTimeout(() => replayer.stop(), 100);

      await replayPromise;

      // Should have called less than 10 times due to stop
      expect(onAction.mock.calls.length).toBeLessThan(10);
    });

    it('should clear actions', () => {
      const replayer = new ActionReplayer();

      replayer.record({ type: 'INCREMENT' }, { count: 1 });
      expect(replayer.getActions()).toHaveLength(1);

      replayer.clear();
      expect(replayer.getActions()).toHaveLength(0);
    });
  });

  describe('StatePersistence', () => {
    let mockStorage: Map<string, string>;
    let storage: Storage;

    beforeEach(() => {
      mockStorage = new Map();
      storage = {
        getItem: (key: string) => mockStorage.get(key) || null,
        setItem: (key: string, value: string) => {
          mockStorage.set(key, value);
        },
        removeItem: (key: string) => mockStorage.delete(key),
        clear: () => mockStorage.clear(),
        key: (index: number) => '',
        length: mockStorage.size,
      };
    });

    it('should save and load state', () => {
      const persistence = new StatePersistence({
        key: 'test-state',
        storage,
      });

      const state = { count: 42, name: 'test' };
      persistence.save(state);

      const loaded = persistence.load();
      expect(loaded).toEqual(state);
    });

    it('should return null when no state exists', () => {
      const persistence = new StatePersistence({
        key: 'non-existent',
        storage,
      });

      const loaded = persistence.load();
      expect(loaded).toBeNull();
    });

    it('should clear state', () => {
      const persistence = new StatePersistence({
        key: 'test-state',
        storage,
      });

      persistence.save({ count: 42 });
      expect(persistence.load()).toBeTruthy();

      persistence.clear();
      expect(persistence.load()).toBeNull();
    });

    it('should handle version migration', () => {
      const migrate = vi.fn((state, version) => {
        if (version === 1) {
          return { ...state, migrated: true };
        }
        return state;
      });

      const persistence = new StatePersistence({
        key: 'test-state',
        storage,
        version: 2,
        migrate,
      });

      // Simulate old version in storage
      mockStorage.set(
        'test-state',
        JSON.stringify({
          state: { count: 42 },
          version: 1,
          timestamp: Date.now(),
        })
      );

      const loaded = persistence.load();
      expect(migrate).toHaveBeenCalledWith({ count: 42 }, 1);
      expect(loaded).toHaveProperty('migrated', true);
    });

    it('should include timestamp', () => {
      const persistence = new StatePersistence({
        key: 'test-state',
        storage,
      });

      const before = Date.now();
      persistence.save({ count: 42 });
      const after = Date.now();

      const raw = storage.getItem('test-state');
      expect(raw).toBeTruthy();

      const data = JSON.parse(raw!);
      expect(data.timestamp).toBeGreaterThanOrEqual(before);
      expect(data.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('initReduxDevTools', () => {
    it('should create global instance', () => {
      const devTools = initReduxDevTools({ count: 0 }, { name: 'GlobalStore' });

      expect(devTools).toBeTruthy();
      expect(devTools.currentState()).toEqual({ count: 0 });
    });

    it('should reuse existing instance', () => {
      const devTools1 = initReduxDevTools({ count: 0 });
      const devTools2 = initReduxDevTools({ count: 999 }); // Different initial state

      // Should return the same instance
      expect(devTools1).toBe(devTools2);
    });
  });
});
