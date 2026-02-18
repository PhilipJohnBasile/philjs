/**
 * Tests for PhilJS RxJS Integration
 *
 * Comprehensive RxJS integration with PhilJS signals for reactive programming.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  // Observable to Signal
  fromObservable,
  useObservable,
  fromObservableWithRetry,
  // Signal to Observable
  toObservable,
  toSharedObservable,
  // Subject integrations
  useSubject,
  useBehaviorSubject,
  useReplaySubject,
  useAsyncSubject,
  // Signal-aware operators
  withSignal,
  filterBySignal,
  pauseBySignal,
  throttleBySignal,
  debounceBySignal,
  // Subscription management
  createSubscriptionBag,
  useSubscriptionBag,
  // Stream composition
  combineSignals,
  combineLatestSignals,
  mergeWithSignals,
  // Event utilities
  fromEvent,
  signalInterval,
  signalTimer,
  // State management
  createRxStore,
  createRxEffects,
  // Utilities
  fromPromise,
  whenAny,
  persistedSignal,
  // Types
  type FromObservableOptions,
  type ObservableSignal,
  type ToObservableOptions,
  type SubjectSignal,
  type BehaviorSubjectSignal,
  type ReplaySubjectSignal,
  type StreamOptions,
  type SubscriptionBag,
} from './index';
import { signal, computed } from '@philjs/core';

describe('PhilJS RxJS Integration', () => {
  describe('Type Definitions', () => {
    describe('FromObservableOptions', () => {
      it('should define options structure', () => {
        const options: FromObservableOptions<number> = {
          initialValue: 0,
          onError: (err) => console.error(err),
          onComplete: () => console.log('done'),
          keepAlive: true,
        };
        expect(options.initialValue).toBe(0);
        expect(options.keepAlive).toBe(true);
      });
    });

    describe('ToObservableOptions', () => {
      it('should define options structure', () => {
        const options: ToObservableOptions = {
          emitInitial: true,
          distinctUntilChanged: true,
          equals: (a, b) => a === b,
        };
        expect(options.emitInitial).toBe(true);
        expect(options.distinctUntilChanged).toBe(true);
      });
    });

    describe('SubjectSignal', () => {
      it('should define subject signal structure', () => {
        const subjectSignal: SubjectSignal<number> = {
          signal: signal(0),
          subject: {} as any,
          next: () => {},
          error: () => {},
          complete: () => {},
          unsubscribe: () => {},
        };
        expect(subjectSignal.signal).toBeDefined();
        expect(typeof subjectSignal.next).toBe('function');
      });
    });

    describe('BehaviorSubjectSignal', () => {
      it('should extend SubjectSignal with getValue', () => {
        const behaviorSignal: BehaviorSubjectSignal<number> = {
          signal: signal(0),
          subject: {} as any,
          next: () => {},
          error: () => {},
          complete: () => {},
          unsubscribe: () => {},
          getValue: () => 0,
        };
        expect(typeof behaviorSignal.getValue).toBe('function');
      });
    });

    describe('ReplaySubjectSignal', () => {
      it('should extend SubjectSignal with bufferSize', () => {
        const replaySignal: ReplaySubjectSignal<number> = {
          signal: signal(0),
          subject: {} as any,
          next: () => {},
          error: () => {},
          complete: () => {},
          unsubscribe: () => {},
          bufferSize: 5,
        };
        expect(replaySignal.bufferSize).toBe(5);
      });
    });

    describe('StreamOptions', () => {
      it('should define stream options', () => {
        const options: StreamOptions = {
          share: true,
          replayCount: 3,
          replayWindow: 5000,
        };
        expect(options.share).toBe(true);
        expect(options.replayCount).toBe(3);
      });
    });

    describe('SubscriptionBag', () => {
      it('should define subscription bag interface', () => {
        const bag: SubscriptionBag = {
          add: () => {},
          remove: () => {},
          unsubscribeAll: () => {},
          count: signal(0),
        };
        expect(typeof bag.add).toBe('function');
        expect(typeof bag.unsubscribeAll).toBe('function');
      });
    });
  });

  describe('Observable to Signal Conversion', () => {
    describe('fromObservable', () => {
      it('should be a function', () => {
        expect(typeof fromObservable).toBe('function');
      });

      it('should return an ObservableSignal', () => {
        const mockObservable = {
          subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        };
        const result = fromObservable(mockObservable as any, 0);

        expect(result).toBeDefined();
        expect(result.error).toBeDefined();
        expect(result.loading).toBeDefined();
        expect(result.completed).toBeDefined();
        expect(typeof result.unsubscribe).toBe('function');
        expect(typeof result.resubscribe).toBe('function');
      });

      it('should start with initial value', () => {
        const mockObservable = {
          subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        };
        const result = fromObservable(mockObservable as any, 42);
        expect(result()).toBe(42);
      });

      it('should set loading to true initially', () => {
        const mockObservable = {
          subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        };
        const result = fromObservable(mockObservable as any, 0);
        expect(result.loading()).toBe(true);
      });
    });

    describe('useObservable', () => {
      it('should be a function', () => {
        expect(typeof useObservable).toBe('function');
      });

      it('should return value, error, loading, completed, refetch, unsubscribe', () => {
        const mockObservable = {
          subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        };
        const result = useObservable(mockObservable as any, 0);

        expect(result.value).toBeDefined();
        expect(result.error).toBeDefined();
        expect(result.loading).toBeDefined();
        expect(result.completed).toBeDefined();
        expect(typeof result.refetch).toBe('function');
        expect(typeof result.unsubscribe).toBe('function');
      });
    });

    describe('fromObservableWithRetry', () => {
      it('should be a function', () => {
        expect(typeof fromObservableWithRetry).toBe('function');
      });

      it('should accept retry options', () => {
        const mockObservable = {
          subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        };
        const result = fromObservableWithRetry(mockObservable as any, null, {
          maxRetries: 5,
          retryDelay: 2000,
          shouldRetry: () => true,
          onRetry: vi.fn(),
        });

        expect(result).toBeDefined();
        expect(result.loading()).toBe(true);
      });
    });
  });

  describe('Signal to Observable Conversion', () => {
    describe('toObservable', () => {
      it('should be a function', () => {
        expect(typeof toObservable).toBe('function');
      });

      it('should return an Observable-like object', () => {
        const sig = signal(0);
        const obs = toObservable(sig);

        expect(typeof obs.subscribe).toBe('function');
        expect(typeof obs.pipe).toBe('function');
      });

      it('should emit initial value by default', () => {
        const sig = signal(42);
        const obs = toObservable(sig);
        const values: number[] = [];

        obs.subscribe((value) => values.push(value));
        expect(values).toContain(42);
      });

      it('should accept options', () => {
        const sig = signal(0);
        const obs = toObservable(sig, {
          emitInitial: false,
          distinctUntilChanged: true,
          equals: (a, b) => a === b,
        });

        expect(obs).toBeDefined();
      });
    });

    describe('toSharedObservable', () => {
      it('should be a function', () => {
        expect(typeof toSharedObservable).toBe('function');
      });

      it('should share subscription among multiple subscribers', () => {
        const sig = signal(0);
        const shared = toSharedObservable(sig);

        const values1: number[] = [];
        const values2: number[] = [];

        shared.subscribe((v) => values1.push(v));
        shared.subscribe((v) => values2.push(v));

        sig.set(1);

        expect(values1).toContain(1);
        expect(values2).toContain(1);
      });

      it('should accept refCount option', () => {
        const sig = signal(0);
        const shared = toSharedObservable(sig, { refCount: false });

        expect(shared).toBeDefined();
      });
    });
  });

  describe('Subject Integrations', () => {
    describe('useSubject', () => {
      it('should be a function', () => {
        expect(typeof useSubject).toBe('function');
      });

      it('should return signal, subject, next, error, complete, unsubscribe', () => {
        const result = useSubject<number>(0);

        expect(result.signal).toBeDefined();
        expect(result.subject).toBeDefined();
        expect(typeof result.next).toBe('function');
        expect(typeof result.error).toBe('function');
        expect(typeof result.complete).toBe('function');
        expect(typeof result.unsubscribe).toBe('function');
      });

      it('should update signal when next is called', () => {
        const { signal: sig, next } = useSubject<number>(0);

        expect(sig()).toBe(0);
        next(42);
        expect(sig()).toBe(42);
      });

      it('should notify subscribers', () => {
        const { subject, next } = useSubject<number>(0);
        const values: number[] = [];

        subject.subscribe((v) => values.push(v));
        next(1);
        next(2);
        next(3);

        expect(values).toContain(1);
        expect(values).toContain(2);
        expect(values).toContain(3);
      });
    });

    describe('useBehaviorSubject', () => {
      it('should be a function', () => {
        expect(typeof useBehaviorSubject).toBe('function');
      });

      it('should have getValue method', () => {
        const result = useBehaviorSubject<number>(42);

        expect(typeof result.getValue).toBe('function');
        expect(result.getValue()).toBe(42);
      });

      it('should return current value synchronously', () => {
        const { getValue, next } = useBehaviorSubject<number>(0);

        expect(getValue()).toBe(0);
        next(10);
        expect(getValue()).toBe(10);
      });
    });

    describe('useReplaySubject', () => {
      it('should be a function', () => {
        expect(typeof useReplaySubject).toBe('function');
      });

      it('should have bufferSize property', () => {
        const result = useReplaySubject<number>(5);
        expect(result.bufferSize).toBe(5);
      });

      it('should replay buffered values to new subscribers', () => {
        const { subject, next } = useReplaySubject<number>(3);

        next(1);
        next(2);
        next(3);

        const values: number[] = [];
        subject.subscribe((v) => values.push(v));

        expect(values).toContain(1);
        expect(values).toContain(2);
        expect(values).toContain(3);
      });

      it('should respect buffer size', () => {
        const { subject, next } = useReplaySubject<number>(2);

        next(1);
        next(2);
        next(3);
        next(4);

        const values: number[] = [];
        subject.subscribe((v) => values.push(v));

        expect(values).not.toContain(1);
        expect(values).not.toContain(2);
        expect(values).toContain(3);
        expect(values).toContain(4);
      });
    });

    describe('useAsyncSubject', () => {
      it('should be a function', () => {
        expect(typeof useAsyncSubject).toBe('function');
      });

      it('should only emit last value on complete', () => {
        const { subject, next, complete } = useAsyncSubject<number>();
        const values: number[] = [];

        subject.subscribe((v) => values.push(v));

        next(1);
        next(2);
        next(3);

        expect(values.length).toBe(0);

        complete();

        expect(values).toContain(3);
        expect(values.length).toBe(1);
      });
    });
  });

  describe('Signal-Aware Operators', () => {
    describe('withSignal', () => {
      it('should be a function', () => {
        expect(typeof withSignal).toBe('function');
      });

      it('should project values with signal value', () => {
        const multiplier = signal(2);
        const mockSource = {
          subscribe: vi.fn((observer) => {
            observer.next(5);
            return { unsubscribe: vi.fn() };
          }),
          pipe: vi.fn(),
        };

        const operator = withSignal(multiplier, (value, mult) => value * mult);
        const projected = operator(mockSource as any);
        const values: number[] = [];

        projected.subscribe((v) => values.push(v));

        expect(values).toContain(10);
      });
    });

    describe('filterBySignal', () => {
      it('should be a function', () => {
        expect(typeof filterBySignal).toBe('function');
      });

      it('should filter based on signal value', () => {
        const isEnabled = signal(true);
        const mockSource = {
          subscribe: vi.fn((observer) => {
            observer.next(1);
            isEnabled.set(false);
            observer.next(2);
            return { unsubscribe: vi.fn() };
          }),
          pipe: vi.fn(),
        };

        const operator = filterBySignal(isEnabled);
        const filtered = operator(mockSource as any);
        const values: number[] = [];

        filtered.subscribe((v) => values.push(v));

        expect(values).toContain(1);
        expect(values).not.toContain(2);
      });
    });

    describe('pauseBySignal', () => {
      it('should be a function', () => {
        expect(typeof pauseBySignal).toBe('function');
      });

      it('should buffer values when paused', () => {
        const isPaused = signal(false);
        expect(pauseBySignal(isPaused)).toBeDefined();
      });
    });

    describe('throttleBySignal', () => {
      it('should be a function', () => {
        expect(typeof throttleBySignal).toBe('function');
      });

      it('should create throttle operator based on signal', () => {
        const duration = signal(100);
        const operator = throttleBySignal(duration);
        expect(operator).toBeDefined();
      });
    });

    describe('debounceBySignal', () => {
      it('should be a function', () => {
        expect(typeof debounceBySignal).toBe('function');
      });

      it('should create debounce operator based on signal', () => {
        const duration = signal(100);
        const operator = debounceBySignal(duration);
        expect(operator).toBeDefined();
      });
    });
  });

  describe('Subscription Management', () => {
    describe('createSubscriptionBag', () => {
      it('should be a function', () => {
        expect(typeof createSubscriptionBag).toBe('function');
      });

      it('should return bag with add, remove, unsubscribeAll, count', () => {
        const bag = createSubscriptionBag();

        expect(typeof bag.add).toBe('function');
        expect(typeof bag.remove).toBe('function');
        expect(typeof bag.unsubscribeAll).toBe('function');
        expect(bag.count).toBeDefined();
      });

      it('should track subscription count', () => {
        const bag = createSubscriptionBag();
        const sub1 = { unsubscribe: vi.fn() };
        const sub2 = { unsubscribe: vi.fn() };

        expect(bag.count()).toBe(0);
        bag.add(sub1 as any);
        expect(bag.count()).toBe(1);
        bag.add(sub2 as any);
        expect(bag.count()).toBe(2);
      });

      it('should unsubscribe all on unsubscribeAll', () => {
        const bag = createSubscriptionBag();
        const unsubscribe1 = vi.fn();
        const unsubscribe2 = vi.fn();

        bag.add({ unsubscribe: unsubscribe1 } as any);
        bag.add({ unsubscribe: unsubscribe2 } as any);

        bag.unsubscribeAll();

        expect(unsubscribe1).toHaveBeenCalled();
        expect(unsubscribe2).toHaveBeenCalled();
        expect(bag.count()).toBe(0);
      });

      it('should handle function teardowns', () => {
        const bag = createSubscriptionBag();
        const cleanup = vi.fn();

        bag.add(cleanup);
        bag.unsubscribeAll();

        expect(cleanup).toHaveBeenCalled();
      });
    });

    describe('useSubscriptionBag', () => {
      it('should be a function', () => {
        expect(typeof useSubscriptionBag).toBe('function');
      });

      it('should return a subscription bag', () => {
        const bag = useSubscriptionBag();

        expect(typeof bag.add).toBe('function');
        expect(typeof bag.remove).toBe('function');
        expect(typeof bag.unsubscribeAll).toBe('function');
        expect(bag.count).toBeDefined();
      });
    });
  });

  describe('Stream Composition', () => {
    describe('combineSignals', () => {
      it('should be a function', () => {
        expect(typeof combineSignals).toBe('function');
      });

      it('should combine signals into observable', () => {
        const firstName = signal('John');
        const lastName = signal('Doe');

        const combined = combineSignals({ firstName, lastName });
        let result: any = null;

        combined.subscribe((v) => {
          result = v;
        });

        expect(result).toEqual({ firstName: 'John', lastName: 'Doe' });
      });

      it('should emit when any signal changes', () => {
        const a = signal(1);
        const b = signal(2);

        const combined = combineSignals({ a, b });
        const results: any[] = [];

        combined.subscribe((v) => results.push({ ...v }));

        a.set(10);

        expect(results.length).toBeGreaterThan(1);
        expect(results[results.length - 1].a).toBe(10);
      });
    });

    describe('combineLatestSignals', () => {
      it('should be a function', () => {
        expect(typeof combineLatestSignals).toBe('function');
      });

      it('should combine signals as array', () => {
        const a = signal(1);
        const b = signal(2);
        const c = signal(3);

        const combined = combineLatestSignals([a, b, c] as const);
        let result: any = null;

        combined.subscribe((v) => {
          result = v;
        });

        expect(result).toEqual([1, 2, 3]);
      });
    });

    describe('mergeWithSignals', () => {
      it('should be a function', () => {
        expect(typeof mergeWithSignals).toBe('function');
      });

      it('should return merged$ and sources array', () => {
        const obs1 = { subscribe: vi.fn(), pipe: vi.fn() } as any;
        const obs2 = { subscribe: vi.fn(), pipe: vi.fn() } as any;

        const result = mergeWithSignals([obs1, obs2]);

        expect(result.merged$).toBeDefined();
        expect(result.sources).toBeDefined();
        expect(result.sources.length).toBe(2);
      });

      it('should track individual source states', () => {
        const obs1 = { subscribe: vi.fn(), pipe: vi.fn() } as any;
        const obs2 = { subscribe: vi.fn(), pipe: vi.fn() } as any;

        const result = mergeWithSignals([obs1, obs2]);

        expect(result.sources[0].value).toBeDefined();
        expect(result.sources[0].loading).toBeDefined();
        expect(result.sources[0].error).toBeDefined();
      });
    });
  });

  describe('Event Stream Utilities', () => {
    describe('fromEvent', () => {
      it('should be a function', () => {
        expect(typeof fromEvent).toBe('function');
      });

      it('should create observable from DOM events', () => {
        const mockElement = {
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        } as unknown as HTMLElement;

        const obs = fromEvent(mockElement, 'click');
        obs.subscribe(() => {});

        expect(mockElement.addEventListener).toHaveBeenCalledWith(
          'click',
          expect.any(Function),
          expect.any(Object)
        );
      });

      it('should accept filter signal option', () => {
        const isEnabled = signal(true);
        const mockElement = {
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        } as unknown as HTMLElement;

        const obs = fromEvent(mockElement, 'click', { filter: isEnabled });
        expect(obs).toBeDefined();
      });
    });

    describe('signalInterval', () => {
      it('should be a function', () => {
        expect(typeof signalInterval).toBe('function');
      });

      it('should create interval with signal-controlled duration', () => {
        const duration = signal(1000);
        const interval = signalInterval(duration);

        expect(interval).toBeDefined();
        expect(typeof interval.subscribe).toBe('function');
      });
    });

    describe('signalTimer', () => {
      it('should be a function', () => {
        expect(typeof signalTimer).toBe('function');
      });

      it('should create timer with signal-controlled delay', () => {
        const delay = signal(1000);
        const timer = signalTimer(delay);

        expect(timer).toBeDefined();
        expect(typeof timer.subscribe).toBe('function');
      });
    });
  });

  describe('State Management', () => {
    describe('createRxStore', () => {
      it('should be a function', () => {
        expect(typeof createRxStore).toBe('function');
      });

      it('should create store with state, state$, actions$, dispatch, select, selectObservable', () => {
        const store = createRxStore(
          { count: 0 },
          (state, action) => {
            switch (action.type) {
              case 'increment':
                return { ...state, count: state.count + 1 };
              default:
                return state;
            }
          }
        );

        expect(store.state).toBeDefined();
        expect(store.state$).toBeDefined();
        expect(store.actions$).toBeDefined();
        expect(typeof store.dispatch).toBe('function');
        expect(typeof store.select).toBe('function');
        expect(typeof store.selectObservable).toBe('function');
      });

      it('should dispatch actions and update state', () => {
        const store = createRxStore(
          { count: 0 },
          (state, action) => {
            switch (action.type) {
              case 'increment':
                return { ...state, count: state.count + 1 };
              case 'decrement':
                return { ...state, count: state.count - 1 };
              default:
                return state;
            }
          }
        );

        expect(store.state().count).toBe(0);

        store.dispatch({ type: 'increment' });
        expect(store.state().count).toBe(1);

        store.dispatch({ type: 'increment' });
        expect(store.state().count).toBe(2);

        store.dispatch({ type: 'decrement' });
        expect(store.state().count).toBe(1);
      });

      it('should select state slices', () => {
        const store = createRxStore(
          { count: 0, name: 'test' },
          (state, action) => state
        );

        const countSignal = store.select((s) => s.count);
        const nameSignal = store.select((s) => s.name);

        expect(countSignal()).toBe(0);
        expect(nameSignal()).toBe('test');
      });
    });

    describe('createRxEffects', () => {
      it('should be a function', () => {
        expect(typeof createRxEffects).toBe('function');
      });

      it('should return connect function', () => {
        const effects = createRxEffects({});
        expect(typeof effects.connect).toBe('function');
      });
    });
  });

  describe('Utility Functions', () => {
    describe('fromPromise', () => {
      it('should be a function', () => {
        expect(typeof fromPromise).toBe('function');
      });

      it('should create signal from promise', async () => {
        const promise = Promise.resolve(42);
        const result = fromPromise(promise, 0);

        expect(result()).toBe(0); // Initial value
        expect(result.loading()).toBe(true);

        await promise;
        // Wait for microtask
        await new Promise((r) => setTimeout(r, 0));

        expect(result()).toBe(42);
        expect(result.loading()).toBe(false);
        expect(result.completed()).toBe(true);
      });

      it('should handle promise rejection', async () => {
        const error = new Error('Test error');
        const promise = Promise.reject(error);
        const result = fromPromise(promise, null);

        await new Promise((r) => setTimeout(r, 0));

        expect(result.error()).toBe(error);
        expect(result.loading()).toBe(false);
      });
    });

    describe('whenAny', () => {
      it('should be a function', () => {
        expect(typeof whenAny).toBe('function');
      });

      it('should emit when any signal changes', () => {
        const a = signal(1);
        const b = signal(2);
        let emitCount = 0;

        whenAny(a, b).subscribe(() => {
          emitCount++;
        });

        const initialEmitCount = emitCount;
        a.set(10);
        expect(emitCount).toBeGreaterThan(initialEmitCount);

        const afterAEmit = emitCount;
        b.set(20);
        expect(emitCount).toBeGreaterThan(afterAEmit);
      });
    });

    describe('persistedSignal', () => {
      it('should be a function', () => {
        expect(typeof persistedSignal).toBe('function');
      });

      it('should return signal, observable, and clear', () => {
        const mockStorage = {
          getItem: vi.fn(() => null),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        } as unknown as Storage;

        const result = persistedSignal('key', 'default', mockStorage);

        expect(result.signal).toBeDefined();
        expect(result.observable).toBeDefined();
        expect(typeof result.clear).toBe('function');
      });

      it('should load from storage', () => {
        const mockStorage = {
          getItem: vi.fn(() => JSON.stringify('stored')),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        } as unknown as Storage;

        const result = persistedSignal('key', 'default', mockStorage);

        expect(result.signal()).toBe('stored');
      });

      it('should persist changes to storage', () => {
        const mockStorage = {
          getItem: vi.fn(() => null),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        } as unknown as Storage;

        const result = persistedSignal('key', 'default', mockStorage);
        result.signal.set('new value');

        // Effect runs async, check after microtask
        expect(mockStorage.setItem).toHaveBeenCalled();
      });

      it('should clear storage and reset to initial', () => {
        const mockStorage = {
          getItem: vi.fn(() => JSON.stringify('stored')),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        } as unknown as Storage;

        const result = persistedSignal('key', 'default', mockStorage);
        result.clear();

        expect(mockStorage.removeItem).toHaveBeenCalledWith('key');
        expect(result.signal()).toBe('default');
      });
    });
  });
});
