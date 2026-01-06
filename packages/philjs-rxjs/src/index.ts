/**
 * @philjs/rxjs - Comprehensive RxJS Integration for PhilJS
 *
 * Seamless interoperability between RxJS Observables and PhilJS Signals.
 * Features include:
 * - Bidirectional conversion between Observables and Signals
 * - Signal-aware RxJS operators
 * - Subject integrations (BehaviorSubject, ReplaySubject, AsyncSubject)
 * - Stream composition utilities
 * - Resource management and cleanup
 * - Error boundary integration
 * - Custom operators for PhilJS patterns
 *
 * @example
 * ```typescript
 * import { fromObservable, toObservable, useSubject, signalOperator } from '@philjs/rxjs';
 * import { interval, map, filter } from 'rxjs';
 *
 * // Convert Observable to Signal
 * const counter = fromObservable(interval(1000), 0);
 *
 * // Convert Signal to Observable
 * const signal = signal(0);
 * const obs$ = toObservable(signal);
 *
 * // Use Subject with Signals
 * const { signal: value, subject } = useSubject<number>(0);
 * subject.next(42);
 * ```
 */

import { signal, computed, effect, batch, type Signal } from '@philjs/core';
import type {
  Observable,
  Subscription,
  Subject,
  BehaviorSubject,
  ReplaySubject,
  AsyncSubject,
  Observer,
  OperatorFunction,
  MonoTypeOperatorFunction,
  Subscribable,
  TeardownLogic,
} from 'rxjs';

// ============================================================================
// Types
// ============================================================================

/** Options for Observable to Signal conversion */
export interface FromObservableOptions<T> {
  /** Initial value before first emission */
  initialValue: T;
  /** Error handler */
  onError?: (error: Error) => void;
  /** Completion handler */
  onComplete?: () => void;
  /** Whether to keep subscription alive after component unmount */
  keepAlive?: boolean;
}

/** Signal with subscription management */
export interface ObservableSignal<T> extends Signal<T> {
  /** Current error if any */
  readonly error: Signal<Error | null>;
  /** Whether the observable is still loading */
  readonly loading: Signal<boolean>;
  /** Whether the observable has completed */
  readonly completed: Signal<boolean>;
  /** Unsubscribe from the observable */
  unsubscribe: () => void;
  /** Resubscribe to the observable */
  resubscribe: () => void;
}

/** Options for toObservable conversion */
export interface ToObservableOptions {
  /** Emit initial value immediately */
  emitInitial?: boolean;
  /** Only emit when value changes (by reference) */
  distinctUntilChanged?: boolean;
  /** Custom equality function */
  equals?: <T>(a: T, b: T) => boolean;
}

/** Subject integration result */
export interface SubjectSignal<T> {
  /** Signal holding current value */
  signal: Signal<T>;
  /** The underlying subject */
  subject: Subject<T>;
  /** Emit a new value */
  next: (value: T) => void;
  /** Signal error */
  error: (err: Error) => void;
  /** Complete the subject */
  complete: () => void;
  /** Unsubscribe */
  unsubscribe: () => void;
}

/** BehaviorSubject integration result */
export interface BehaviorSubjectSignal<T> extends SubjectSignal<T> {
  /** The underlying BehaviorSubject */
  subject: BehaviorSubject<T>;
  /** Get current value synchronously */
  getValue: () => T;
}

/** ReplaySubject integration result */
export interface ReplaySubjectSignal<T> extends SubjectSignal<T> {
  /** The underlying ReplaySubject */
  subject: ReplaySubject<T>;
  /** Number of values being buffered */
  bufferSize: number;
}

/** Stream composition options */
export interface StreamOptions {
  /** Share the observable among multiple subscribers */
  share?: boolean;
  /** Replay last N values to new subscribers */
  replayCount?: number;
  /** Buffer time window for replay */
  replayWindow?: number;
}

/** Subscription manager */
export interface SubscriptionBag {
  /** Add a subscription */
  add: (subscription: Subscription | (() => void)) => void;
  /** Remove a subscription */
  remove: (subscription: Subscription) => void;
  /** Unsubscribe all */
  unsubscribeAll: () => void;
  /** Number of active subscriptions */
  readonly count: Signal<number>;
}

// ============================================================================
// Observable to Signal Conversion
// ============================================================================

/**
 * Convert an RxJS Observable to a PhilJS Signal
 *
 * @example
 * ```typescript
 * const timer$ = interval(1000);
 * const seconds = fromObservable(timer$, 0);
 *
 * // With error handling
 * const data = fromObservable(fetchData$, null, {
 *   onError: (err) => console.error(err),
 *   onComplete: () => console.log('Done'),
 * });
 * ```
 */
export function fromObservable<T>(
  observable: Observable<T>,
  initialValue: T,
  options: Partial<Omit<FromObservableOptions<T>, 'initialValue'>> = {}
): ObservableSignal<T> {
  const { onError, onComplete, keepAlive = false } = options;

  const value = signal<T>(initialValue);
  const error = signal<Error | null>(null);
  const loading = signal(true);
  const completed = signal(false);

  let subscription: Subscription | null = null;

  const subscribe = () => {
    loading.set(true);
    error.set(null);
    completed.set(false);

    subscription = observable.subscribe({
      next: (v) => {
        batch(() => {
          value.set(v);
          loading.set(false);
        });
      },
      error: (e) => {
        batch(() => {
          error.set(e);
          loading.set(false);
        });
        onError?.(e);
      },
      complete: () => {
        batch(() => {
          completed.set(true);
          loading.set(false);
        });
        onComplete?.();
      },
    });
  };

  const unsubscribe = () => {
    subscription?.unsubscribe();
    subscription = null;
  };

  const resubscribe = () => {
    unsubscribe();
    subscribe();
  };

  // Initial subscription
  subscribe();

  // Cleanup on effect disposal if not keepAlive
  if (!keepAlive) {
    effect(() => {
      return () => unsubscribe();
    });
  }

  // Create ObservableSignal by extending the value signal
  const observableSignal = Object.assign(
    (() => value()) as Signal<T>,
    {
      error,
      loading,
      completed,
      unsubscribe,
      resubscribe,
      set: value.set.bind(value),
      update: value.update.bind(value),
      peek: value.peek.bind(value),
    }
  );

  return observableSignal as ObservableSignal<T>;
}

/**
 * Hook-style Observable to Signal conversion with full state
 *
 * @example
 * ```typescript
 * const { value, error, loading, refetch } = useObservable(
 *   fetchUser(userId),
 *   null
 * );
 * ```
 */
export function useObservable<T>(
  observable: Observable<T>,
  initialValue: T
): {
  value: Signal<T>;
  error: Signal<Error | null>;
  loading: Signal<boolean>;
  completed: Signal<boolean>;
  refetch: () => void;
  unsubscribe: () => void;
} {
  const sig = fromObservable(observable, initialValue);

  return {
    value: sig,
    error: sig.error,
    loading: sig.loading,
    completed: sig.completed,
    refetch: sig.resubscribe,
    unsubscribe: sig.unsubscribe,
  };
}

/**
 * Convert Observable to Signal with automatic retry on error
 *
 * @example
 * ```typescript
 * const data = fromObservableWithRetry(
 *   fetchData$,
 *   null,
 *   { maxRetries: 3, retryDelay: 1000 }
 * );
 * ```
 */
export function fromObservableWithRetry<T>(
  observable: Observable<T>,
  initialValue: T,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    shouldRetry?: (error: Error, attempt: number) => boolean;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): ObservableSignal<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    shouldRetry = () => true,
    onRetry,
  } = options;

  const value = signal<T>(initialValue);
  const error = signal<Error | null>(null);
  const loading = signal(true);
  const completed = signal(false);
  const retryCount = signal(0);

  let subscription: Subscription | null = null;
  let retryTimeout: ReturnType<typeof setTimeout> | null = null;

  const subscribe = () => {
    loading.set(true);
    error.set(null);

    subscription = observable.subscribe({
      next: (v) => {
        batch(() => {
          value.set(v);
          loading.set(false);
          retryCount.set(0);
        });
      },
      error: (e) => {
        const attempt = retryCount.peek() + 1;

        if (attempt <= maxRetries && shouldRetry(e, attempt)) {
          retryCount.set(attempt);
          onRetry?.(e, attempt);

          retryTimeout = setTimeout(() => {
            subscribe();
          }, retryDelay * attempt);
        } else {
          batch(() => {
            error.set(e);
            loading.set(false);
          });
        }
      },
      complete: () => {
        batch(() => {
          completed.set(true);
          loading.set(false);
        });
      },
    });
  };

  const unsubscribe = () => {
    subscription?.unsubscribe();
    subscription = null;
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeout = null;
    }
  };

  const resubscribe = () => {
    unsubscribe();
    retryCount.set(0);
    subscribe();
  };

  subscribe();

  effect(() => () => unsubscribe());

  const observableSignal = Object.assign(
    (() => value()) as Signal<T>,
    {
      error,
      loading,
      completed,
      unsubscribe,
      resubscribe,
      set: value.set.bind(value),
      update: value.update.bind(value),
      peek: value.peek.bind(value),
    }
  );

  return observableSignal as ObservableSignal<T>;
}

// ============================================================================
// Signal to Observable Conversion
// ============================================================================

/**
 * Convert a PhilJS Signal to an RxJS Observable
 *
 * @example
 * ```typescript
 * const count = signal(0);
 * const count$ = toObservable(count);
 *
 * count$.pipe(
 *   filter(x => x > 5),
 *   map(x => x * 2)
 * ).subscribe(console.log);
 * ```
 */
export function toObservable<T>(
  sig: Signal<T>,
  options: ToObservableOptions = {}
): Observable<T> {
  const { emitInitial = true, distinctUntilChanged = false, equals = Object.is } = options;

  return {
    subscribe(observerOrNext?: Observer<T> | ((value: T) => void) | null): Subscription {
      let previousValue: T | undefined;
      let isFirst = true;

      const observer: Observer<T> =
        typeof observerOrNext === 'function'
          ? { next: observerOrNext, error: () => {}, complete: () => {} }
          : observerOrNext || { next: () => {}, error: () => {}, complete: () => {} };

      const cleanup = effect(() => {
        const value = sig();

        if (isFirst) {
          isFirst = false;
          if (emitInitial) {
            previousValue = value;
            observer.next?.(value);
          } else {
            previousValue = value;
          }
          return;
        }

        if (distinctUntilChanged && equals(previousValue as T, value)) {
          return;
        }

        previousValue = value;
        observer.next?.(value);
      });

      return {
        unsubscribe: cleanup,
        closed: false,
        add: () => {},
        remove: () => {},
      } as unknown as Subscription;
    },
    pipe(...operators: OperatorFunction<any, any>[]): Observable<any> {
      let result: Observable<any> = this;
      for (const op of operators) {
        result = op(result);
      }
      return result;
    },
  } as Observable<T>;
}

/**
 * Create a hot observable from a signal that shares the subscription
 *
 * @example
 * ```typescript
 * const shared$ = toSharedObservable(mySignal);
 * ```
 */
export function toSharedObservable<T>(
  sig: Signal<T>,
  options: ToObservableOptions & { refCount?: boolean } = {}
): Observable<T> {
  const { refCount = true, ...toObsOptions } = options;
  const observers: Set<Observer<T>> = new Set();
  let cleanup: (() => void) | null = null;
  let currentValue: T;

  const startListening = () => {
    cleanup = effect(() => {
      currentValue = sig();
      observers.forEach((observer) => observer.next?.(currentValue));
    });
  };

  const stopListening = () => {
    cleanup?.();
    cleanup = null;
  };

  return {
    subscribe(observerOrNext?: Observer<T> | ((value: T) => void) | null): Subscription {
      const observer: Observer<T> =
        typeof observerOrNext === 'function'
          ? { next: observerOrNext, error: () => {}, complete: () => {} }
          : observerOrNext || { next: () => {}, error: () => {}, complete: () => {} };

      if (observers.size === 0) {
        startListening();
      }

      observers.add(observer);

      // Emit current value immediately
      if (toObsOptions.emitInitial !== false) {
        observer.next?.(currentValue ?? sig());
      }

      return {
        unsubscribe: () => {
          observers.delete(observer);
          if (refCount && observers.size === 0) {
            stopListening();
          }
        },
        closed: false,
        add: () => {},
        remove: () => {},
      } as unknown as Subscription;
    },
    pipe(...operators: OperatorFunction<any, any>[]): Observable<any> {
      let result: Observable<any> = this;
      for (const op of operators) {
        result = op(result);
      }
      return result;
    },
  } as Observable<T>;
}

// ============================================================================
// Subject Integrations
// ============================================================================

/**
 * Create a Subject with Signal integration
 *
 * @example
 * ```typescript
 * const { signal: value, subject, next } = useSubject<number>(0);
 *
 * next(42);
 * console.log(value()); // 42
 * ```
 */
export function useSubject<T>(initialValue: T): SubjectSignal<T> {
  const value = signal<T>(initialValue);
  const observers: Set<Observer<T>> = new Set();
  let isCompleted = false;
  let hasError = false;

  const subject: Subject<T> = {
    next: (v: T) => {
      if (isCompleted || hasError) return;
      value.set(v);
      observers.forEach((obs) => obs.next?.(v));
    },
    error: (err: Error) => {
      if (isCompleted || hasError) return;
      hasError = true;
      observers.forEach((obs) => obs.error?.(err));
    },
    complete: () => {
      if (isCompleted || hasError) return;
      isCompleted = true;
      observers.forEach((obs) => obs.complete?.());
    },
    subscribe: (observerOrNext?: Observer<T> | ((value: T) => void) | null) => {
      const observer: Observer<T> =
        typeof observerOrNext === 'function'
          ? { next: observerOrNext, error: () => {}, complete: () => {} }
          : observerOrNext || { next: () => {}, error: () => {}, complete: () => {} };

      observers.add(observer);

      return {
        unsubscribe: () => observers.delete(observer),
        closed: false,
        add: () => {},
        remove: () => {},
      } as unknown as Subscription;
    },
    pipe(...operators: OperatorFunction<any, any>[]): Observable<any> {
      let result: Observable<any> = this;
      for (const op of operators) {
        result = op(result);
      }
      return result;
    },
    asObservable: () => subject as unknown as Observable<T>,
    observers: observers as any,
    closed: false,
    isStopped: false,
    hasError: false,
    thrownError: null,
    observed: false,
    lift: () => subject as any,
    forEach: () => Promise.resolve(),
    toPromise: () => Promise.resolve(value.peek()),
  } as unknown as Subject<T>;

  return {
    signal: value,
    subject,
    next: subject.next.bind(subject),
    error: subject.error.bind(subject),
    complete: subject.complete.bind(subject),
    unsubscribe: () => observers.clear(),
  };
}

/**
 * Create a BehaviorSubject with Signal integration
 *
 * @example
 * ```typescript
 * const { signal: count, getValue, next } = useBehaviorSubject(0);
 *
 * next(5);
 * console.log(getValue()); // 5
 * console.log(count()); // 5
 * ```
 */
export function useBehaviorSubject<T>(initialValue: T): BehaviorSubjectSignal<T> {
  const base = useSubject(initialValue);

  const behaviorSubject = Object.assign(base.subject, {
    getValue: () => base.signal.peek(),
    value: base.signal.peek(),
  }) as BehaviorSubject<T>;

  return {
    ...base,
    subject: behaviorSubject,
    getValue: () => base.signal.peek(),
  };
}

/**
 * Create a ReplaySubject with Signal integration
 *
 * @example
 * ```typescript
 * const { signal: value, next } = useReplaySubject<number>(3);
 *
 * next(1);
 * next(2);
 * next(3);
 * // New subscribers will receive [1, 2, 3]
 * ```
 */
export function useReplaySubject<T>(bufferSize = 1, windowTime?: number): ReplaySubjectSignal<T> {
  const buffer: { value: T; timestamp: number }[] = [];
  const value = signal<T>(undefined as T);
  const observers: Set<Observer<T>> = new Set();
  let isCompleted = false;

  const trimBuffer = () => {
    const now = Date.now();
    while (buffer.length > bufferSize) {
      buffer.shift();
    }
    if (windowTime !== undefined) {
      while (buffer.length > 0 && now - buffer[0].timestamp > windowTime) {
        buffer.shift();
      }
    }
  };

  const subject: ReplaySubject<T> = {
    next: (v: T) => {
      if (isCompleted) return;
      buffer.push({ value: v, timestamp: Date.now() });
      trimBuffer();
      value.set(v);
      observers.forEach((obs) => obs.next?.(v));
    },
    error: (err: Error) => {
      if (isCompleted) return;
      observers.forEach((obs) => obs.error?.(err));
    },
    complete: () => {
      if (isCompleted) return;
      isCompleted = true;
      observers.forEach((obs) => obs.complete?.());
    },
    subscribe: (observerOrNext?: Observer<T> | ((value: T) => void) | null) => {
      const observer: Observer<T> =
        typeof observerOrNext === 'function'
          ? { next: observerOrNext, error: () => {}, complete: () => {} }
          : observerOrNext || { next: () => {}, error: () => {}, complete: () => {} };

      // Replay buffered values
      trimBuffer();
      buffer.forEach(({ value: v }) => observer.next?.(v));

      observers.add(observer);

      return {
        unsubscribe: () => observers.delete(observer),
        closed: false,
        add: () => {},
        remove: () => {},
      } as unknown as Subscription;
    },
    pipe(...operators: OperatorFunction<any, any>[]): Observable<any> {
      let result: Observable<any> = this;
      for (const op of operators) {
        result = op(result);
      }
      return result;
    },
    asObservable: () => subject as unknown as Observable<T>,
  } as unknown as ReplaySubject<T>;

  return {
    signal: value,
    subject,
    next: subject.next.bind(subject),
    error: subject.error.bind(subject),
    complete: subject.complete.bind(subject),
    unsubscribe: () => observers.clear(),
    bufferSize,
  };
}

/**
 * Create an AsyncSubject with Signal integration
 *
 * @example
 * ```typescript
 * const { signal: result, next, complete } = useAsyncSubject<number>();
 *
 * next(1);
 * next(2);
 * next(3);
 * complete(); // Only now will subscribers receive 3
 * ```
 */
export function useAsyncSubject<T>(): SubjectSignal<T> {
  const value = signal<T>(undefined as T);
  const observers: Set<Observer<T>> = new Set();
  let lastValue: T | undefined;
  let hasValue = false;
  let isCompleted = false;

  const subject: AsyncSubject<T> = {
    next: (v: T) => {
      if (isCompleted) return;
      lastValue = v;
      hasValue = true;
    },
    error: (err: Error) => {
      if (isCompleted) return;
      observers.forEach((obs) => obs.error?.(err));
    },
    complete: () => {
      if (isCompleted) return;
      isCompleted = true;
      if (hasValue) {
        value.set(lastValue as T);
        observers.forEach((obs) => {
          obs.next?.(lastValue as T);
          obs.complete?.();
        });
      } else {
        observers.forEach((obs) => obs.complete?.());
      }
    },
    subscribe: (observerOrNext?: Observer<T> | ((value: T) => void) | null) => {
      const observer: Observer<T> =
        typeof observerOrNext === 'function'
          ? { next: observerOrNext, error: () => {}, complete: () => {} }
          : observerOrNext || { next: () => {}, error: () => {}, complete: () => {} };

      if (isCompleted && hasValue) {
        observer.next?.(lastValue as T);
        observer.complete?.();
      } else if (!isCompleted) {
        observers.add(observer);
      }

      return {
        unsubscribe: () => observers.delete(observer),
        closed: false,
        add: () => {},
        remove: () => {},
      } as unknown as Subscription;
    },
    pipe(...operators: OperatorFunction<any, any>[]): Observable<any> {
      let result: Observable<any> = this;
      for (const op of operators) {
        result = op(result);
      }
      return result;
    },
    asObservable: () => subject as unknown as Observable<T>,
  } as unknown as AsyncSubject<T>;

  return {
    signal: value,
    subject: subject as unknown as Subject<T>,
    next: subject.next.bind(subject),
    error: subject.error.bind(subject),
    complete: subject.complete.bind(subject),
    unsubscribe: () => observers.clear(),
  };
}

// ============================================================================
// Signal-Aware Operators
// ============================================================================

/**
 * Create a custom operator that reads from a signal
 *
 * @example
 * ```typescript
 * const multiplier = signal(2);
 *
 * source$.pipe(
 *   withSignal(multiplier, (value, mult) => value * mult)
 * ).subscribe(console.log);
 * ```
 */
export function withSignal<T, S, R>(
  sig: Signal<S>,
  project: (value: T, signalValue: S) => R
): OperatorFunction<T, R> {
  return (source: Observable<T>): Observable<R> => ({
    subscribe(observerOrNext?: Observer<R> | ((value: R) => void) | null): Subscription {
      const observer: Observer<R> =
        typeof observerOrNext === 'function'
          ? { next: observerOrNext, error: () => {}, complete: () => {} }
          : observerOrNext || { next: () => {}, error: () => {}, complete: () => {} };

      const subscription = source.subscribe({
        next: (value) => observer.next?.(project(value, sig())),
        error: (err) => observer.error?.(err),
        complete: () => observer.complete?.(),
      });

      return subscription;
    },
    pipe(...operators: OperatorFunction<any, any>[]): Observable<any> {
      let result: Observable<any> = this;
      for (const op of operators) {
        result = op(result);
      }
      return result;
    },
  }) as Observable<R>;
}

/**
 * Filter based on signal value
 *
 * @example
 * ```typescript
 * const isEnabled = signal(true);
 *
 * source$.pipe(
 *   filterBySignal(isEnabled)
 * ).subscribe(console.log);
 * ```
 */
export function filterBySignal<T>(
  sig: Signal<boolean>,
  predicate?: (value: T) => boolean
): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>): Observable<T> => ({
    subscribe(observerOrNext?: Observer<T> | ((value: T) => void) | null): Subscription {
      const observer: Observer<T> =
        typeof observerOrNext === 'function'
          ? { next: observerOrNext, error: () => {}, complete: () => {} }
          : observerOrNext || { next: () => {}, error: () => {}, complete: () => {} };

      const subscription = source.subscribe({
        next: (value) => {
          if (sig() && (!predicate || predicate(value))) {
            observer.next?.(value);
          }
        },
        error: (err) => observer.error?.(err),
        complete: () => observer.complete?.(),
      });

      return subscription;
    },
    pipe(...operators: OperatorFunction<any, any>[]): Observable<any> {
      let result: Observable<any> = this;
      for (const op of operators) {
        result = op(result);
      }
      return result;
    },
  }) as Observable<T>;
}

/**
 * Pause/resume stream based on signal
 *
 * @example
 * ```typescript
 * const isPaused = signal(false);
 *
 * source$.pipe(
 *   pauseBySignal(isPaused)
 * ).subscribe(console.log);
 * ```
 */
export function pauseBySignal<T>(isPaused: Signal<boolean>): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>): Observable<T> => {
    const buffer: T[] = [];

    return {
      subscribe(observerOrNext?: Observer<T> | ((value: T) => void) | null): Subscription {
        const observer: Observer<T> =
          typeof observerOrNext === 'function'
            ? { next: observerOrNext, error: () => {}, complete: () => {} }
            : observerOrNext || { next: () => {}, error: () => {}, complete: () => {} };

        let cleanup: (() => void) | null = null;

        const subscription = source.subscribe({
          next: (value) => {
            if (isPaused()) {
              buffer.push(value);
            } else {
              observer.next?.(value);
            }
          },
          error: (err) => observer.error?.(err),
          complete: () => observer.complete?.(),
        });

        // Watch for unpause to flush buffer
        cleanup = effect(() => {
          if (!isPaused() && buffer.length > 0) {
            const items = buffer.splice(0);
            items.forEach((item) => observer.next?.(item));
          }
        });

        return {
          unsubscribe: () => {
            subscription.unsubscribe();
            cleanup?.();
          },
          closed: false,
          add: () => {},
          remove: () => {},
        } as unknown as Subscription;
      },
      pipe(...operators: OperatorFunction<any, any>[]): Observable<any> {
        let result: Observable<any> = this;
        for (const op of operators) {
          result = op(result);
        }
        return result;
      },
    } as Observable<T>;
  };
}

/**
 * Rate limit based on signal value
 *
 * @example
 * ```typescript
 * const throttleMs = signal(1000);
 *
 * source$.pipe(
 *   throttleBySignal(throttleMs)
 * ).subscribe(console.log);
 * ```
 */
export function throttleBySignal<T>(durationSignal: Signal<number>): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>): Observable<T> => {
    let lastEmitTime = 0;

    return {
      subscribe(observerOrNext?: Observer<T> | ((value: T) => void) | null): Subscription {
        const observer: Observer<T> =
          typeof observerOrNext === 'function'
            ? { next: observerOrNext, error: () => {}, complete: () => {} }
            : observerOrNext || { next: () => {}, error: () => {}, complete: () => {} };

        const subscription = source.subscribe({
          next: (value) => {
            const now = Date.now();
            const duration = durationSignal();

            if (now - lastEmitTime >= duration) {
              lastEmitTime = now;
              observer.next?.(value);
            }
          },
          error: (err) => observer.error?.(err),
          complete: () => observer.complete?.(),
        });

        return subscription;
      },
      pipe(...operators: OperatorFunction<any, any>[]): Observable<any> {
        let result: Observable<any> = this;
        for (const op of operators) {
          result = op(result);
        }
        return result;
      },
    } as Observable<T>;
  };
}

/**
 * Debounce based on signal value
 *
 * @example
 * ```typescript
 * const debounceMs = signal(300);
 *
 * source$.pipe(
 *   debounceBySignal(debounceMs)
 * ).subscribe(console.log);
 * ```
 */
export function debounceBySignal<T>(durationSignal: Signal<number>): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>): Observable<T> => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let latestValue: T;
    let hasValue = false;

    return {
      subscribe(observerOrNext?: Observer<T> | ((value: T) => void) | null): Subscription {
        const observer: Observer<T> =
          typeof observerOrNext === 'function'
            ? { next: observerOrNext, error: () => {}, complete: () => {} }
            : observerOrNext || { next: () => {}, error: () => {}, complete: () => {} };

        const subscription = source.subscribe({
          next: (value) => {
            latestValue = value;
            hasValue = true;

            if (timeout) {
              clearTimeout(timeout);
            }

            timeout = setTimeout(() => {
              if (hasValue) {
                observer.next?.(latestValue);
                hasValue = false;
              }
            }, durationSignal());
          },
          error: (err) => observer.error?.(err),
          complete: () => {
            if (timeout) {
              clearTimeout(timeout);
            }
            if (hasValue) {
              observer.next?.(latestValue);
            }
            observer.complete?.();
          },
        });

        return {
          unsubscribe: () => {
            subscription.unsubscribe();
            if (timeout) {
              clearTimeout(timeout);
            }
          },
          closed: false,
          add: () => {},
          remove: () => {},
        } as unknown as Subscription;
      },
      pipe(...operators: OperatorFunction<any, any>[]): Observable<any> {
        let result: Observable<any> = this;
        for (const op of operators) {
          result = op(result);
        }
        return result;
      },
    } as Observable<T>;
  };
}

// ============================================================================
// Subscription Management
// ============================================================================

/**
 * Create a subscription bag for managing multiple subscriptions
 *
 * @example
 * ```typescript
 * const bag = createSubscriptionBag();
 *
 * bag.add(observable1.subscribe(...));
 * bag.add(observable2.subscribe(...));
 *
 * // Later: clean up all
 * bag.unsubscribeAll();
 * ```
 */
export function createSubscriptionBag(): SubscriptionBag {
  const subscriptions = new Set<Subscription | (() => void)>();
  const count = signal(0);

  return {
    add: (subscription) => {
      subscriptions.add(subscription);
      count.set(subscriptions.size);
    },
    remove: (subscription) => {
      subscriptions.delete(subscription);
      count.set(subscriptions.size);
    },
    unsubscribeAll: () => {
      subscriptions.forEach((sub) => {
        if (typeof sub === 'function') {
          sub();
        } else {
          sub.unsubscribe();
        }
      });
      subscriptions.clear();
      count.set(0);
    },
    count,
  };
}

/**
 * Use a subscription bag that auto-cleans on effect disposal
 *
 * @example
 * ```typescript
 * const bag = useSubscriptionBag();
 *
 * bag.add(timer$.subscribe(console.log));
 * // Auto-cleaned when component unmounts
 * ```
 */
export function useSubscriptionBag(): SubscriptionBag {
  const bag = createSubscriptionBag();

  effect(() => {
    return () => bag.unsubscribeAll();
  });

  return bag;
}

// ============================================================================
// Stream Composition
// ============================================================================

/**
 * Combine multiple signals into a single observable
 *
 * @example
 * ```typescript
 * const firstName = signal('John');
 * const lastName = signal('Doe');
 *
 * combineSignals({ firstName, lastName }).subscribe(
 *   ({ firstName, lastName }) => console.log(`${firstName} ${lastName}`)
 * );
 * ```
 */
export function combineSignals<T extends Record<string, Signal<any>>>(
  signals: T
): Observable<{ [K in keyof T]: T[K] extends Signal<infer V> ? V : never }> {
  type Result = { [K in keyof T]: T[K] extends Signal<infer V> ? V : never };

  return {
    subscribe(observerOrNext?: Observer<Result> | ((value: Result) => void) | null): Subscription {
      const observer: Observer<Result> =
        typeof observerOrNext === 'function'
          ? { next: observerOrNext, error: () => {}, complete: () => {} }
          : observerOrNext || { next: () => {}, error: () => {}, complete: () => {} };

      const cleanup = effect(() => {
        const result = {} as Result;
        for (const key in signals) {
          (result as any)[key] = signals[key]();
        }
        observer.next?.(result);
      });

      return {
        unsubscribe: cleanup,
        closed: false,
        add: () => {},
        remove: () => {},
      } as unknown as Subscription;
    },
    pipe(...operators: OperatorFunction<any, any>[]): Observable<any> {
      let result: Observable<any> = this;
      for (const op of operators) {
        result = op(result);
      }
      return result;
    },
  } as Observable<Result>;
}

/**
 * Combine latest values from multiple signals as an array
 *
 * @example
 * ```typescript
 * const a = signal(1);
 * const b = signal(2);
 * const c = signal(3);
 *
 * combineLatestSignals([a, b, c]).subscribe(
 *   ([aVal, bVal, cVal]) => console.log(aVal + bVal + cVal)
 * );
 * ```
 */
export function combineLatestSignals<T extends readonly Signal<any>[]>(
  signals: T
): Observable<{ [K in keyof T]: T[K] extends Signal<infer V> ? V : never }> {
  type Result = { [K in keyof T]: T[K] extends Signal<infer V> ? V : never };

  return {
    subscribe(observerOrNext?: Observer<Result> | ((value: Result) => void) | null): Subscription {
      const observer: Observer<Result> =
        typeof observerOrNext === 'function'
          ? { next: observerOrNext, error: () => {}, complete: () => {} }
          : observerOrNext || { next: () => {}, error: () => {}, complete: () => {} };

      const cleanup = effect(() => {
        const result = signals.map((sig) => sig()) as unknown as Result;
        observer.next?.(result);
      });

      return {
        unsubscribe: cleanup,
        closed: false,
        add: () => {},
        remove: () => {},
      } as unknown as Subscription;
    },
    pipe(...operators: OperatorFunction<any, any>[]): Observable<any> {
      let result: Observable<any> = this;
      for (const op of operators) {
        result = op(result);
      }
      return result;
    },
  } as Observable<Result>;
}

/**
 * Merge multiple observables into a single observable with signals tracking each
 *
 * @example
 * ```typescript
 * const { merged$, sources } = mergeWithSignals([http1$, http2$, http3$]);
 *
 * // Access individual source states
 * console.log(sources[0].loading());
 * ```
 */
export function mergeWithSignals<T>(
  observables: Observable<T>[]
): {
  merged$: Observable<T>;
  sources: Array<{
    value: Signal<T | null>;
    loading: Signal<boolean>;
    error: Signal<Error | null>;
  }>;
} {
  const sources = observables.map(() => ({
    value: signal<T | null>(null),
    loading: signal(true),
    error: signal<Error | null>(null),
  }));

  const merged$: Observable<T> = {
    subscribe(observerOrNext?: Observer<T> | ((value: T) => void) | null): Subscription {
      const observer: Observer<T> =
        typeof observerOrNext === 'function'
          ? { next: observerOrNext, error: () => {}, complete: () => {} }
          : observerOrNext || { next: () => {}, error: () => {}, complete: () => {} };

      const subscriptions = observables.map((obs, index) =>
        obs.subscribe({
          next: (value) => {
            batch(() => {
              sources[index].value.set(value);
              sources[index].loading.set(false);
            });
            observer.next?.(value);
          },
          error: (err) => {
            batch(() => {
              sources[index].error.set(err);
              sources[index].loading.set(false);
            });
            observer.error?.(err);
          },
          complete: () => {
            sources[index].loading.set(false);
          },
        })
      );

      return {
        unsubscribe: () => subscriptions.forEach((s) => s.unsubscribe()),
        closed: false,
        add: () => {},
        remove: () => {},
      } as unknown as Subscription;
    },
    pipe(...operators: OperatorFunction<any, any>[]): Observable<any> {
      let result: Observable<any> = this;
      for (const op of operators) {
        result = op(result);
      }
      return result;
    },
  } as Observable<T>;

  return { merged$, sources };
}

// ============================================================================
// Event Stream Utilities
// ============================================================================

/**
 * Create an observable from DOM events with signal-based filtering
 *
 * @example
 * ```typescript
 * const isEnabled = signal(true);
 * const clicks$ = fromEvent(button, 'click', { filter: isEnabled });
 * ```
 */
export function fromEvent<K extends keyof HTMLElementEventMap>(
  element: HTMLElement,
  eventName: K,
  options?: {
    filter?: Signal<boolean>;
    capture?: boolean;
    passive?: boolean;
  }
): Observable<HTMLElementEventMap[K]> {
  return {
    subscribe(
      observerOrNext?: Observer<HTMLElementEventMap[K]> | ((value: HTMLElementEventMap[K]) => void) | null
    ): Subscription {
      const observer: Observer<HTMLElementEventMap[K]> =
        typeof observerOrNext === 'function'
          ? { next: observerOrNext, error: () => {}, complete: () => {} }
          : observerOrNext || { next: () => {}, error: () => {}, complete: () => {} };

      const handler = (event: HTMLElementEventMap[K]) => {
        if (options?.filter && !options.filter()) {
          return;
        }
        observer.next?.(event);
      };

      element.addEventListener(eventName, handler as EventListener, {
        capture: options?.capture,
        passive: options?.passive,
      });

      return {
        unsubscribe: () => {
          element.removeEventListener(eventName, handler as EventListener, {
            capture: options?.capture,
          });
        },
        closed: false,
        add: () => {},
        remove: () => {},
      } as unknown as Subscription;
    },
    pipe(...operators: OperatorFunction<any, any>[]): Observable<any> {
      let result: Observable<any> = this;
      for (const op of operators) {
        result = op(result);
      }
      return result;
    },
  } as Observable<HTMLElementEventMap[K]>;
}

/**
 * Create an interval observable with signal-controlled duration
 *
 * @example
 * ```typescript
 * const duration = signal(1000);
 * const tick$ = signalInterval(duration);
 * ```
 */
export function signalInterval(durationSignal: Signal<number>): Observable<number> {
  return {
    subscribe(observerOrNext?: Observer<number> | ((value: number) => void) | null): Subscription {
      const observer: Observer<number> =
        typeof observerOrNext === 'function'
          ? { next: observerOrNext, error: () => {}, complete: () => {} }
          : observerOrNext || { next: () => {}, error: () => {}, complete: () => {} };

      let count = 0;
      let intervalId: ReturnType<typeof setInterval> | null = null;
      let cleanup: (() => void) | null = null;

      const startInterval = () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
        intervalId = setInterval(() => {
          observer.next?.(count++);
        }, durationSignal());
      };

      // Watch for duration changes
      cleanup = effect(() => {
        const _duration = durationSignal(); // Subscribe to changes
        startInterval();
      });

      return {
        unsubscribe: () => {
          if (intervalId) {
            clearInterval(intervalId);
          }
          cleanup?.();
        },
        closed: false,
        add: () => {},
        remove: () => {},
      } as unknown as Subscription;
    },
    pipe(...operators: OperatorFunction<any, any>[]): Observable<any> {
      let result: Observable<any> = this;
      for (const op of operators) {
        result = op(result);
      }
      return result;
    },
  } as Observable<number>;
}

/**
 * Create a timer observable with signal-controlled delay
 *
 * @example
 * ```typescript
 * const delay = signal(5000);
 * const timer$ = signalTimer(delay);
 * ```
 */
export function signalTimer(delaySignal: Signal<number>): Observable<0> {
  return {
    subscribe(observerOrNext?: Observer<0> | ((value: 0) => void) | null): Subscription {
      const observer: Observer<0> =
        typeof observerOrNext === 'function'
          ? { next: observerOrNext, error: () => {}, complete: () => {} }
          : observerOrNext || { next: () => {}, error: () => {}, complete: () => {} };

      const timeoutId = setTimeout(() => {
        observer.next?.(0);
        observer.complete?.();
      }, delaySignal());

      return {
        unsubscribe: () => clearTimeout(timeoutId),
        closed: false,
        add: () => {},
        remove: () => {},
      } as unknown as Subscription;
    },
    pipe(...operators: OperatorFunction<any, any>[]): Observable<any> {
      let result: Observable<any> = this;
      for (const op of operators) {
        result = op(result);
      }
      return result;
    },
  } as Observable<0>;
}

// ============================================================================
// State Management Integration
// ============================================================================

/**
 * Create a redux-like store with RxJS integration
 *
 * @example
 * ```typescript
 * const store = createRxStore(
 *   { count: 0 },
 *   (state, action) => {
 *     switch (action.type) {
 *       case 'increment': return { ...state, count: state.count + 1 };
 *       default: return state;
 *     }
 *   }
 * );
 *
 * store.dispatch({ type: 'increment' });
 * console.log(store.state()); // { count: 1 }
 * ```
 */
export function createRxStore<S, A extends { type: string }>(
  initialState: S,
  reducer: (state: S, action: A) => S
): {
  state: Signal<S>;
  state$: Observable<S>;
  actions$: Observable<A>;
  dispatch: (action: A) => void;
  select: <R>(selector: (state: S) => R) => Signal<R>;
  selectObservable: <R>(selector: (state: S) => R) => Observable<R>;
} {
  const state = signal<S>(initialState);
  const actionSubject = useSubject<A>({ type: '__INIT__' } as A);

  const dispatch = (action: A) => {
    const currentState = state.peek();
    const nextState = reducer(currentState, action);
    state.set(nextState);
    actionSubject.next(action);
  };

  const select = <R>(selector: (state: S) => R): Signal<R> => {
    return computed(() => selector(state()));
  };

  const selectObservable = <R>(selector: (state: S) => R): Observable<R> => {
    return toObservable(computed(() => selector(state())));
  };

  return {
    state,
    state$: toObservable(state),
    actions$: actionSubject.subject as unknown as Observable<A>,
    dispatch,
    select,
    selectObservable,
  };
}

/**
 * Create an effect that runs side effects based on actions
 *
 * @example
 * ```typescript
 * const effects = createRxEffects({
 *   fetchUser: (actions$) => actions$.pipe(
 *     filter(a => a.type === 'FETCH_USER'),
 *     switchMap(a => fetchUser(a.payload)),
 *     map(user => ({ type: 'USER_LOADED', payload: user }))
 *   ),
 * });
 * ```
 */
export function createRxEffects<A extends { type: string }>(
  effects: Record<string, (actions$: Observable<A>) => Observable<A>>
): {
  connect: (actions$: Observable<A>, dispatch: (action: A) => void) => () => void;
} {
  return {
    connect: (actions$, dispatch) => {
      const subscriptions: Subscription[] = [];

      for (const effectFn of Object.values(effects)) {
        const effect$ = effectFn(actions$);
        subscriptions.push(effect$.subscribe(dispatch));
      }

      return () => subscriptions.forEach((s) => s.unsubscribe());
    },
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert a Promise to a Signal
 *
 * @example
 * ```typescript
 * const data = fromPromise(fetchData(), null);
 * ```
 */
export function fromPromise<T>(
  promise: Promise<T>,
  initialValue: T
): ObservableSignal<T> {
  const value = signal<T>(initialValue);
  const error = signal<Error | null>(null);
  const loading = signal(true);
  const completed = signal(false);

  promise
    .then((result) => {
      batch(() => {
        value.set(result);
        loading.set(false);
        completed.set(true);
      });
    })
    .catch((err) => {
      batch(() => {
        error.set(err);
        loading.set(false);
      });
    });

  const observableSignal = Object.assign(
    (() => value()) as Signal<T>,
    {
      error,
      loading,
      completed,
      unsubscribe: () => {},
      resubscribe: () => {},
      set: value.set.bind(value),
      update: value.update.bind(value),
      peek: value.peek.bind(value),
    }
  );

  return observableSignal as ObservableSignal<T>;
}

/**
 * Create an observable that emits when any of the signals change
 *
 * @example
 * ```typescript
 * const a = signal(1);
 * const b = signal(2);
 *
 * whenAny(a, b).subscribe(() => {
 *   console.log('Something changed!');
 * });
 * ```
 */
export function whenAny(...signals: Signal<any>[]): Observable<void> {
  return {
    subscribe(observerOrNext?: Observer<void> | ((value: void) => void) | null): Subscription {
      const observer: Observer<void> =
        typeof observerOrNext === 'function'
          ? { next: observerOrNext, error: () => {}, complete: () => {} }
          : observerOrNext || { next: () => {}, error: () => {}, complete: () => {} };

      const cleanup = effect(() => {
        // Touch all signals to subscribe to them
        signals.forEach((sig) => sig());
        observer.next?.();
      });

      return {
        unsubscribe: cleanup,
        closed: false,
        add: () => {},
        remove: () => {},
      } as unknown as Subscription;
    },
    pipe(...operators: OperatorFunction<any, any>[]): Observable<any> {
      let result: Observable<any> = this;
      for (const op of operators) {
        result = op(result);
      }
      return result;
    },
  } as Observable<void>;
}

/**
 * Create a signal that syncs with localStorage/sessionStorage
 * and exposes as observable
 *
 * @example
 * ```typescript
 * const { signal: theme, observable: theme$ } = persistedSignal(
 *   'theme',
 *   'light'
 * );
 * ```
 */
export function persistedSignal<T>(
  key: string,
  initialValue: T,
  storage: Storage = typeof localStorage !== 'undefined' ? localStorage : ({} as Storage)
): {
  signal: Signal<T>;
  observable: Observable<T>;
  clear: () => void;
} {
  // Try to load from storage
  let storedValue: T = initialValue;
  try {
    const stored = storage.getItem(key);
    if (stored !== null) {
      storedValue = JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }

  const sig = signal<T>(storedValue);

  // Persist on change
  effect(() => {
    const value = sig();
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage errors
    }
  });

  return {
    signal: sig,
    observable: toObservable(sig),
    clear: () => {
      storage.removeItem(key);
      sig.set(initialValue);
    },
  };
}

// ============================================================================
// Type Exports
// ============================================================================

export type {
  Observable,
  Subscription,
  Subject,
  BehaviorSubject,
  ReplaySubject,
  AsyncSubject,
  Observer,
  OperatorFunction,
  MonoTypeOperatorFunction,
  Subscribable,
  TeardownLogic,
};
