/**
 * PhilJS Hooks - Mantine-style Hook Collection
 *
 * A comprehensive collection of utility hooks for PhilJS applications.
 * Inspired by Mantine Hooks, React Use, and VueUse.
 *
 * @example
 * ```typescript
 * import {
 *   useDisclosure,
 *   useToggle,
 *   useLocalStorage,
 *   useClickOutside,
 *   useDebouncedValue,
 *   useMediaQuery,
 * } from '@philjs/hooks';
 *
 * // Toggle state
 * const [value, toggle] = useToggle(false);
 *
 * // Persisted state
 * const theme = useLocalStorage('theme', 'light');
 *
 * // Responsive design
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * ```
 */

import { signal, computed, effect, batch, type Signal, type Computed } from '@philjs/core';

// ============================================================================
// STATE HOOKS
// ============================================================================

/**
 * Manage boolean state with open/close/toggle handlers
 */
export interface DisclosureHandlers {
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export interface DisclosureCallbacks {
  onOpen?: () => void;
  onClose?: () => void;
}

export function useDisclosure(
  initialState = false,
  callbacks?: DisclosureCallbacks
): [Signal<boolean>, DisclosureHandlers] {
  const opened = signal(initialState);

  const open = () => {
    if (!opened.get()) {
      opened.set(true);
      callbacks?.onOpen?.();
    }
  };

  const close = () => {
    if (opened.get()) {
      opened.set(false);
      callbacks?.onClose?.();
    }
  };

  const toggle = () => {
    opened.get() ? close() : open();
  };

  return [opened, { open, close, toggle }];
}

/**
 * Toggle between two or more values
 */
export function useToggle<T>(initialValue: T, options?: T[]): [Signal<T>, (value?: T) => void] {
  const values = options ?? ([true, false] as unknown as T[]);
  const state = signal<T>(initialValue);

  const toggle = (value?: T) => {
    if (value !== undefined) {
      state.set(value);
    } else {
      const currentIndex = values.indexOf(state.get());
      const nextIndex = (currentIndex + 1) % values.length;
      state.set(values[nextIndex]);
    }
  };

  return [state, toggle];
}

/**
 * Manage counter state with increment/decrement/set/reset
 */
export interface CounterHandlers {
  increment: () => void;
  decrement: () => void;
  set: (value: number) => void;
  reset: () => void;
}

export interface CounterOptions {
  min?: number;
  max?: number;
}

export function useCounter(
  initialValue = 0,
  options: CounterOptions = {}
): [Signal<number>, CounterHandlers] {
  const { min = -Infinity, max = Infinity } = options;
  const count = signal(Math.min(max, Math.max(min, initialValue)));

  const clamp = (value: number) => Math.min(max, Math.max(min, value));

  return [
    count,
    {
      increment: () => count.set(clamp(count.get() + 1)),
      decrement: () => count.set(clamp(count.get() - 1)),
      set: (value: number) => count.set(clamp(value)),
      reset: () => count.set(clamp(initialValue)),
    },
  ];
}

/**
 * Manage array state with list manipulation methods
 */
export interface ListStateHandlers<T> {
  append: (...items: T[]) => void;
  prepend: (...items: T[]) => void;
  insert: (index: number, ...items: T[]) => void;
  pop: () => void;
  shift: () => void;
  apply: (fn: (item: T, index: number) => T) => void;
  applyWhere: (condition: (item: T, index: number) => boolean, fn: (item: T, index: number) => T) => void;
  remove: (...indices: number[]) => void;
  reorder: (params: { from: number; to: number }) => void;
  setItem: (index: number, item: T) => void;
  setItemProp: <K extends keyof T>(index: number, prop: K, value: T[K]) => void;
  filter: (fn: (item: T, index: number) => boolean) => void;
  setState: (items: T[]) => void;
}

export function useListState<T>(initialValue: T[] = []): [Signal<T[]>, ListStateHandlers<T>] {
  const list = signal<T[]>([...initialValue]);

  const handlers: ListStateHandlers<T> = {
    append: (...items) => list.set([...list.get(), ...items]),
    prepend: (...items) => list.set([...items, ...list.get()]),
    insert: (index, ...items) => {
      const arr = [...list.get()];
      arr.splice(index, 0, ...items);
      list.set(arr);
    },
    pop: () => list.set(list.get().slice(0, -1)),
    shift: () => list.set(list.get().slice(1)),
    apply: (fn) => list.set(list.get().map(fn)),
    applyWhere: (condition, fn) =>
      list.set(list.get().map((item, index) => (condition(item, index) ? fn(item, index) : item))),
    remove: (...indices) =>
      list.set(list.get().filter((_, index) => !indices.includes(index))),
    reorder: ({ from, to }) => {
      const arr = [...list.get()];
      const item = arr.splice(from, 1)[0];
      arr.splice(to, 0, item);
      list.set(arr);
    },
    setItem: (index, item) => {
      const arr = [...list.get()];
      arr[index] = item;
      list.set(arr);
    },
    setItemProp: (index, prop, value) => {
      const arr = [...list.get()];
      arr[index] = { ...arr[index], [prop]: value };
      list.set(arr);
    },
    filter: (fn) => list.set(list.get().filter(fn)),
    setState: (items) => list.set([...items]),
  };

  return [list, handlers];
}

/**
 * Manage Map state
 */
export interface MapHandlers<K, V> {
  set: (key: K, value: V) => void;
  delete: (key: K) => void;
  clear: () => void;
}

export function useMap<K, V>(initialValue?: [K, V][]): [Signal<Map<K, V>>, MapHandlers<K, V>] {
  const map = signal(new Map<K, V>(initialValue));

  return [
    map,
    {
      set: (key, value) => {
        const newMap = new Map(map.get());
        newMap.set(key, value);
        map.set(newMap);
      },
      delete: (key) => {
        const newMap = new Map(map.get());
        newMap.delete(key);
        map.set(newMap);
      },
      clear: () => map.set(new Map()),
    },
  ];
}

/**
 * Manage Set state
 */
export interface SetHandlers<T> {
  add: (value: T) => void;
  delete: (value: T) => void;
  toggle: (value: T) => void;
  clear: () => void;
}

export function useSet<T>(initialValue?: T[]): [Signal<Set<T>>, SetHandlers<T>] {
  const set = signal(new Set<T>(initialValue));

  return [
    set,
    {
      add: (value) => {
        const newSet = new Set(set.get());
        newSet.add(value);
        set.set(newSet);
      },
      delete: (value) => {
        const newSet = new Set(set.get());
        newSet.delete(value);
        set.set(newSet);
      },
      toggle: (value) => {
        const newSet = new Set(set.get());
        if (newSet.has(value)) {
          newSet.delete(value);
        } else {
          newSet.add(value);
        }
        set.set(newSet);
      },
      clear: () => set.set(new Set()),
    },
  ];
}

/**
 * Store previous value
 */
export function usePrevious<T>(value: Signal<T>): Computed<T | undefined> {
  const previous = signal<T | undefined>(undefined);

  effect(() => {
    const current = value.get();
    // Schedule update for next tick
    queueMicrotask(() => {
      previous.set(current);
    });
  });

  return computed(() => previous.get());
}

/**
 * Manage queue state
 */
export interface QueueState<T> {
  state: Signal<T[]>;
  queue: Signal<T[]>;
  add: (...items: T[]) => void;
  update: (fn: (state: T[]) => T[]) => void;
  cleanQueue: () => void;
}

export function useQueue<T>(initialValue: T[] = []): QueueState<T> {
  const state = signal<T[]>([...initialValue]);
  const queue = signal<T[]>([]);

  return {
    state,
    queue,
    add: (...items) => {
      const current = state.get();
      const limit = initialValue.length || Infinity;
      if (current.length < limit) {
        state.set([...current, ...items].slice(0, limit));
      } else {
        queue.set([...queue.get(), ...items]);
      }
    },
    update: (fn) => {
      state.set(fn(state.get()));
      // Process queue if space available
      const q = queue.get();
      const limit = initialValue.length || Infinity;
      if (q.length > 0 && state.get().length < limit) {
        const toAdd = q.slice(0, limit - state.get().length);
        state.set([...state.get(), ...toAdd]);
        queue.set(q.slice(toAdd.length));
      }
    },
    cleanQueue: () => queue.set([]),
  };
}

// ============================================================================
// TIMING HOOKS
// ============================================================================

/**
 * Debounce a signal value
 */
export function useDebouncedValue<T>(value: Signal<T>, wait: number): Signal<T> {
  const debounced = signal<T>(value.get());
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  effect(() => {
    const current = value.get();
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      debounced.set(current);
    }, wait);
  });

  return debounced;
}

/**
 * Debounce a callback function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  wait: number
): T & { cancel: () => void; flush: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debouncedFn = ((...args: Parameters<T>) => {
    lastArgs = args;
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback(...args);
      lastArgs = null;
    }, wait);
  }) as T & { cancel: () => void; flush: () => void };

  debouncedFn.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
    lastArgs = null;
  };

  debouncedFn.flush = () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (lastArgs) {
      callback(...lastArgs);
      lastArgs = null;
    }
  };

  return debouncedFn;
}

/**
 * Throttle a signal value
 */
export function useThrottledValue<T>(value: Signal<T>, wait: number): Signal<T> {
  const throttled = signal<T>(value.get());
  let lastTime = 0;

  effect(() => {
    const current = value.get();
    const now = Date.now();
    if (now - lastTime >= wait) {
      throttled.set(current);
      lastTime = now;
    }
  });

  return throttled;
}

/**
 * Throttle a callback function
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  wait: number
): T {
  let lastTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - lastTime);

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastTime = now;
      callback(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now();
        timeoutId = null;
        callback(...args);
      }, remaining);
    }
  }) as T;
}

/**
 * Run callback at interval
 */
export function useInterval(
  callback: () => void,
  interval: number
): { start: () => void; stop: () => void; toggle: () => void; active: Signal<boolean> } {
  const active = signal(false);
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const start = () => {
    if (!active.get()) {
      active.set(true);
      intervalId = setInterval(callback, interval);
    }
  };

  const stop = () => {
    if (active.get() && intervalId) {
      active.set(false);
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const toggle = () => {
    active.get() ? stop() : start();
  };

  return { start, stop, toggle, active };
}

/**
 * Run callback after timeout
 */
export function useTimeout(
  callback: () => void,
  delay: number
): { start: () => void; clear: () => void; active: Signal<boolean> } {
  const active = signal(false);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const start = () => {
    if (!active.get()) {
      active.set(true);
      timeoutId = setTimeout(() => {
        callback();
        active.set(false);
      }, delay);
    }
  };

  const clear = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      active.set(false);
    }
  };

  return { start, clear, active };
}

/**
 * Count up or down timer
 */
export interface CountdownOptions {
  seconds: number;
  interval?: number;
  autostart?: boolean;
}

export function useCountdown(options: CountdownOptions): {
  count: Signal<number>;
  start: () => void;
  stop: () => void;
  reset: () => void;
  isRunning: Signal<boolean>;
} {
  const { seconds, interval = 1000, autostart = false } = options;
  const count = signal(seconds);
  const isRunning = signal(false);
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const start = () => {
    if (isRunning.get() || count.get() <= 0) return;
    isRunning.set(true);
    intervalId = setInterval(() => {
      count.set(count.get() - 1);
      if (count.get() <= 0) {
        stop();
      }
    }, interval);
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    isRunning.set(false);
  };

  const reset = () => {
    stop();
    count.set(seconds);
  };

  if (autostart) start();

  return { count, start, stop, reset, isRunning };
}

/**
 * Stopwatch functionality
 */
export function useStopwatch(interval = 100): {
  time: Signal<number>;
  start: () => void;
  stop: () => void;
  reset: () => void;
  isRunning: Signal<boolean>;
} {
  const time = signal(0);
  const isRunning = signal(false);
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let startTime = 0;
  let elapsed = 0;

  const start = () => {
    if (isRunning.get()) return;
    isRunning.set(true);
    startTime = Date.now() - elapsed;
    intervalId = setInterval(() => {
      elapsed = Date.now() - startTime;
      time.set(elapsed);
    }, interval);
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    isRunning.set(false);
  };

  const reset = () => {
    stop();
    elapsed = 0;
    time.set(0);
  };

  return { time, start, stop, reset, isRunning };
}

// ============================================================================
// DOM HOOKS
// ============================================================================

/**
 * Detect clicks outside an element
 */
export function useClickOutside<T extends HTMLElement>(
  handler: (event: MouseEvent | TouchEvent) => void,
  events: ('mousedown' | 'touchstart')[] = ['mousedown', 'touchstart']
): Signal<T | null> {
  const ref = signal<T | null>(null);

  if (typeof window !== 'undefined') {
    effect(() => {
      const element = ref.get();
      if (!element) return;

      const listener = (event: MouseEvent | TouchEvent) => {
        if (!element.contains(event.target as Node)) {
          handler(event);
        }
      };

      events.forEach(event => document.addEventListener(event, listener as EventListener));
      return () => {
        events.forEach(event => document.removeEventListener(event, listener as EventListener));
      };
    });
  }

  return ref;
}

/**
 * Listen for keyboard hotkeys
 */
export type HotkeyItem = [string, (event: KeyboardEvent) => void, { preventDefault?: boolean }?];

export function useHotkeys(hotkeys: HotkeyItem[], tagsToIgnore: string[] = ['INPUT', 'TEXTAREA', 'SELECT']): void {
  if (typeof window === 'undefined') return;

  const parseHotkey = (hotkey: string) => {
    const keys = hotkey.toLowerCase().split('+');
    return {
      ctrl: keys.includes('ctrl') || keys.includes('control'),
      alt: keys.includes('alt'),
      shift: keys.includes('shift'),
      meta: keys.includes('meta') || keys.includes('cmd') || keys.includes('command'),
      key: keys.filter(k => !['ctrl', 'control', 'alt', 'shift', 'meta', 'cmd', 'command'].includes(k))[0],
    };
  };

  effect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (tagsToIgnore.includes(target.tagName)) return;

      for (const [hotkey, handler, options] of hotkeys) {
        const parsed = parseHotkey(hotkey);

        const match =
          event.key.toLowerCase() === parsed.key &&
          event.ctrlKey === parsed.ctrl &&
          event.altKey === parsed.alt &&
          event.shiftKey === parsed.shift &&
          event.metaKey === parsed.meta;

        if (match) {
          if (options?.preventDefault !== false) {
            event.preventDefault();
          }
          handler(event);
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });
}

/**
 * Single hotkey listener
 */
export function useHotkey(
  hotkey: string,
  handler: (event: KeyboardEvent) => void,
  options?: { preventDefault?: boolean }
): void {
  useHotkeys([[hotkey, handler, options]]);
}

/**
 * Media query hook
 */
export function useMediaQuery(query: string): Signal<boolean> {
  const matches = signal(false);

  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia(query);
    matches.set(mediaQuery.matches);

    effect(() => {
      const handler = (event: MediaQueryListEvent) => {
        matches.set(event.matches);
      };

      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    });
  }

  return matches;
}

/**
 * Viewport size hook
 */
export function useViewportSize(): { width: Signal<number>; height: Signal<number> } {
  const width = signal(typeof window !== 'undefined' ? window.innerWidth : 0);
  const height = signal(typeof window !== 'undefined' ? window.innerHeight : 0);

  if (typeof window !== 'undefined') {
    effect(() => {
      const handleResize = () => {
        width.set(window.innerWidth);
        height.set(window.innerHeight);
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    });
  }

  return { width, height };
}

/**
 * Element size hook
 */
export function useElementSize<T extends HTMLElement>(): {
  ref: Signal<T | null>;
  width: Signal<number>;
  height: Signal<number>;
} {
  const ref = signal<T | null>(null);
  const width = signal(0);
  const height = signal(0);

  if (typeof window !== 'undefined' && typeof ResizeObserver !== 'undefined') {
    effect(() => {
      const element = ref.get();
      if (!element) return;

      const observer = new ResizeObserver(entries => {
        const entry = entries[0];
        if (entry) {
          width.set(entry.contentRect.width);
          height.set(entry.contentRect.height);
        }
      });

      observer.observe(element);
      return () => observer.disconnect();
    });
  }

  return { ref, width, height };
}

/**
 * Window scroll position
 */
export function useWindowScroll(): {
  x: Signal<number>;
  y: Signal<number>;
  scrollTo: (options: { x?: number; y?: number }) => void;
} {
  const x = signal(typeof window !== 'undefined' ? window.scrollX : 0);
  const y = signal(typeof window !== 'undefined' ? window.scrollY : 0);

  if (typeof window !== 'undefined') {
    effect(() => {
      const handleScroll = () => {
        x.set(window.scrollX);
        y.set(window.scrollY);
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    });
  }

  const scrollTo = (options: { x?: number; y?: number }) => {
    window?.scrollTo({
      left: options.x,
      top: options.y,
      behavior: 'smooth',
    });
  };

  return { x, y, scrollTo };
}

/**
 * Element scroll position
 */
export function useScrollIntoView<T extends HTMLElement>(options?: ScrollIntoViewOptions): {
  ref: Signal<T | null>;
  scrollIntoView: () => void;
  targetRef: Signal<T | null>;
} {
  const ref = signal<T | null>(null);
  const targetRef = signal<T | null>(null);

  const scrollIntoView = () => {
    const target = targetRef.get() || ref.get();
    target?.scrollIntoView(options ?? { behavior: 'smooth', block: 'start' });
  };

  return { ref, scrollIntoView, targetRef };
}

/**
 * Scroll lock for modals
 */
export function useScrollLock(lock = false): Signal<boolean> {
  const locked = signal(lock);

  if (typeof document !== 'undefined') {
    effect(() => {
      if (locked.get()) {
        const scrollY = window.scrollY;
        const body = document.body;
        const originalStyle = body.style.cssText;

        body.style.position = 'fixed';
        body.style.top = `-${scrollY}px`;
        body.style.left = '0';
        body.style.right = '0';
        body.style.overflow = 'hidden';

        return () => {
          body.style.cssText = originalStyle;
          window.scrollTo(0, scrollY);
        };
      }
    });
  }

  return locked;
}

/**
 * Focus trap for modals
 */
export function useFocusTrap<T extends HTMLElement>(active = true): Signal<T | null> {
  const ref = signal<T | null>(null);

  if (typeof document !== 'undefined') {
    effect(() => {
      const element = ref.get();
      if (!element || !active) return;

      const focusableElements = element.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      firstElement?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      element.addEventListener('keydown', handleKeyDown);
      return () => element.removeEventListener('keydown', handleKeyDown);
    });
  }

  return ref;
}

/**
 * Mouse position tracking
 */
export function useMouse(): { x: Signal<number>; y: Signal<number> } {
  const x = signal(0);
  const y = signal(0);

  if (typeof window !== 'undefined') {
    effect(() => {
      const handleMouseMove = (event: MouseEvent) => {
        x.set(event.clientX);
        y.set(event.clientY);
      };

      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    });
  }

  return { x, y };
}

/**
 * Element hover state
 */
export function useHover<T extends HTMLElement>(): {
  ref: Signal<T | null>;
  hovered: Signal<boolean>;
} {
  const ref = signal<T | null>(null);
  const hovered = signal(false);

  if (typeof window !== 'undefined') {
    effect(() => {
      const element = ref.get();
      if (!element) return;

      const handleEnter = () => hovered.set(true);
      const handleLeave = () => hovered.set(false);

      element.addEventListener('mouseenter', handleEnter);
      element.addEventListener('mouseleave', handleLeave);

      return () => {
        element.removeEventListener('mouseenter', handleEnter);
        element.removeEventListener('mouseleave', handleLeave);
      };
    });
  }

  return { ref, hovered };
}

/**
 * Element focus state
 */
export function useFocusWithin<T extends HTMLElement>(): {
  ref: Signal<T | null>;
  focused: Signal<boolean>;
} {
  const ref = signal<T | null>(null);
  const focused = signal(false);

  if (typeof window !== 'undefined') {
    effect(() => {
      const element = ref.get();
      if (!element) return;

      const handleFocusIn = () => focused.set(true);
      const handleFocusOut = (e: FocusEvent) => {
        if (!element.contains(e.relatedTarget as Node)) {
          focused.set(false);
        }
      };

      element.addEventListener('focusin', handleFocusIn);
      element.addEventListener('focusout', handleFocusOut);

      return () => {
        element.removeEventListener('focusin', handleFocusIn);
        element.removeEventListener('focusout', handleFocusOut);
      };
    });
  }

  return { ref, focused };
}

// ============================================================================
// BROWSER HOOKS
// ============================================================================

/**
 * Clipboard operations
 */
export function useClipboard(options?: { timeout?: number }): {
  copy: (text: string) => Promise<void>;
  copied: Signal<boolean>;
  error: Signal<Error | null>;
  reset: () => void;
} {
  const { timeout = 2000 } = options ?? {};
  const copied = signal(false);
  const error = signal<Error | null>(null);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      copied.set(true);
      error.set(null);

      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => copied.set(false), timeout);
    } catch (err) {
      error.set(err as Error);
      copied.set(false);
    }
  };

  const reset = () => {
    if (timeoutId) clearTimeout(timeoutId);
    copied.set(false);
    error.set(null);
  };

  return { copy, copied, error, reset };
}

/**
 * Local storage with signal
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [Signal<T>, (value: T | ((prev: T) => T)) => void, () => void] {
  const getStoredValue = (): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const state = signal<T>(getStoredValue());

  const setValue = (value: T | ((prev: T) => T)) => {
    const newValue = typeof value === 'function' ? (value as (prev: T) => T)(state.get()) : value;
    state.set(newValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(newValue));
    }
  };

  const removeValue = () => {
    state.set(defaultValue);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  };

  // Sync across tabs
  if (typeof window !== 'undefined') {
    effect(() => {
      const handleStorage = (e: StorageEvent) => {
        if (e.key === key && e.newValue !== null) {
          state.set(JSON.parse(e.newValue));
        }
      };
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    });
  }

  return [state, setValue, removeValue];
}

/**
 * Session storage with signal
 */
export function useSessionStorage<T>(
  key: string,
  defaultValue: T
): [Signal<T>, (value: T | ((prev: T) => T)) => void, () => void] {
  const getStoredValue = (): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const state = signal<T>(getStoredValue());

  const setValue = (value: T | ((prev: T) => T)) => {
    const newValue = typeof value === 'function' ? (value as (prev: T) => T)(state.get()) : value;
    state.set(newValue);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(key, JSON.stringify(newValue));
    }
  };

  const removeValue = () => {
    state.set(defaultValue);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(key);
    }
  };

  return [state, setValue, removeValue];
}

/**
 * Document title
 */
export function useDocumentTitle(title: string | Signal<string>): void {
  if (typeof document === 'undefined') return;

  if (typeof title === 'string') {
    document.title = title;
  } else {
    effect(() => {
      document.title = title.get();
    });
  }
}

/**
 * Fullscreen API
 */
export function useFullscreen<T extends HTMLElement>(): {
  ref: Signal<T | null>;
  toggle: () => Promise<void>;
  fullscreen: Signal<boolean>;
} {
  const ref = signal<T | null>(null);
  const fullscreen = signal(false);

  if (typeof document !== 'undefined') {
    effect(() => {
      const handleChange = () => {
        fullscreen.set(document.fullscreenElement !== null);
      };

      document.addEventListener('fullscreenchange', handleChange);
      return () => document.removeEventListener('fullscreenchange', handleChange);
    });
  }

  const toggle = async () => {
    const element = ref.get();
    if (!element) return;

    if (fullscreen.get()) {
      await document.exitFullscreen();
    } else {
      await element.requestFullscreen();
    }
  };

  return { ref, toggle, fullscreen };
}

/**
 * Online status
 */
export function useOnline(): Signal<boolean> {
  const online = signal(typeof navigator !== 'undefined' ? navigator.onLine : true);

  if (typeof window !== 'undefined') {
    effect(() => {
      const handleOnline = () => online.set(true);
      const handleOffline = () => online.set(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    });
  }

  return online;
}

/**
 * Page visibility
 */
export function usePageVisibility(): Signal<boolean> {
  const visible = signal(typeof document !== 'undefined' ? !document.hidden : true);

  if (typeof document !== 'undefined') {
    effect(() => {
      const handleChange = () => {
        visible.set(!document.hidden);
      };

      document.addEventListener('visibilitychange', handleChange);
      return () => document.removeEventListener('visibilitychange', handleChange);
    });
  }

  return visible;
}

/**
 * Favicon manipulation
 */
export function useFavicon(url: string | Signal<string>): void {
  if (typeof document === 'undefined') return;

  const setFavicon = (href: string) => {
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = href;
  };

  if (typeof url === 'string') {
    setFavicon(url);
  } else {
    effect(() => {
      setFavicon(url.get());
    });
  }
}

// ============================================================================
// NETWORK HOOKS
// ============================================================================

/**
 * Fetch with signal state
 */
export interface UseFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  immediate?: boolean;
}

export interface UseFetchResult<T> {
  data: Signal<T | null>;
  error: Signal<Error | null>;
  loading: Signal<boolean>;
  execute: () => Promise<void>;
  abort: () => void;
}

export function useFetch<T>(url: string, options: UseFetchOptions = {}): UseFetchResult<T> {
  const { method = 'GET', headers, body, immediate = true } = options;

  const data = signal<T | null>(null);
  const error = signal<Error | null>(null);
  const loading = signal(false);
  let abortController: AbortController | null = null;

  const execute = async () => {
    abortController = new AbortController();
    loading.set(true);
    error.set(null);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      data.set(result);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        error.set(err as Error);
      }
    } finally {
      loading.set(false);
    }
  };

  const abort = () => {
    abortController?.abort();
  };

  if (immediate) execute();

  return { data, error, loading, execute, abort };
}

/**
 * WebSocket connection
 */
export interface UseWebSocketOptions {
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
  reconnectAttempts?: number;
}

export interface UseWebSocketResult<T> {
  data: Signal<T | null>;
  readyState: Signal<number>;
  send: (data: string | object) => void;
  open: () => void;
  close: () => void;
}

export function useWebSocket<T>(
  url: string,
  options: UseWebSocketOptions = {}
): UseWebSocketResult<T> {
  const {
    onOpen,
    onClose,
    onError,
    onMessage,
    reconnect = false,
    reconnectInterval = 1000,
    reconnectAttempts = 3,
  } = options;

  const data = signal<T | null>(null);
  const readyState = signal<number>(WebSocket.CLOSED);
  let ws: WebSocket | null = null;
  let attempts = 0;

  const open = () => {
    if (typeof WebSocket === 'undefined') return;

    ws = new WebSocket(url);

    ws.onopen = (event) => {
      readyState.set(ws!.readyState);
      attempts = 0;
      onOpen?.(event);
    };

    ws.onclose = (event) => {
      readyState.set(ws!.readyState);
      onClose?.(event);

      if (reconnect && attempts < reconnectAttempts) {
        attempts++;
        setTimeout(open, reconnectInterval);
      }
    };

    ws.onerror = (event) => {
      onError?.(event);
    };

    ws.onmessage = (event) => {
      try {
        data.set(JSON.parse(event.data));
      } catch {
        data.set(event.data as T);
      }
      onMessage?.(event);
    };

    readyState.set(ws.readyState);
  };

  const close = () => {
    ws?.close();
  };

  const send = (message: string | object) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(typeof message === 'string' ? message : JSON.stringify(message));
    }
  };

  open();

  return { data, readyState, send, open, close };
}

// ============================================================================
// ACCESSIBILITY HOOKS
// ============================================================================

/**
 * Reduced motion preference
 */
export function useReducedMotion(): Signal<boolean> {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Color scheme preference
 */
export function usePrefersColorScheme(): Signal<'dark' | 'light'> {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  return computed(() => (prefersDark.get() ? 'dark' : 'light')) as unknown as Signal<'dark' | 'light'>;
}

/**
 * Color scheme with local storage
 */
export function useColorScheme(
  defaultValue: 'dark' | 'light' = 'light'
): [Signal<'dark' | 'light'>, (scheme: 'dark' | 'light') => void, () => void] {
  const [scheme, setScheme, removeScheme] = useLocalStorage<'dark' | 'light'>('color-scheme', defaultValue);
  const systemScheme = usePrefersColorScheme();

  // Apply to document
  if (typeof document !== 'undefined') {
    effect(() => {
      const value = scheme.get() ?? systemScheme.get();
      document.documentElement.setAttribute('data-color-scheme', value);
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(value);
    });
  }

  const toggle = () => {
    setScheme(scheme.get() === 'dark' ? 'light' : 'dark');
  };

  return [scheme, setScheme, toggle as () => void];
}

/**
 * High contrast preference
 */
export function usePrefersHighContrast(): Signal<boolean> {
  return useMediaQuery('(prefers-contrast: more)');
}

// ============================================================================
// FORM HOOKS
// ============================================================================

/**
 * Simple input state
 */
export function useInputState<T extends string | number>(
  initialValue: T
): [Signal<T>, (event: Event | T) => void] {
  const state = signal<T>(initialValue);

  const setValue = (eventOrValue: Event | T) => {
    if (eventOrValue instanceof Event) {
      const target = eventOrValue.target as HTMLInputElement;
      state.set(target.value as T);
    } else {
      state.set(eventOrValue);
    }
  };

  return [state, setValue];
}

/**
 * Form validation state
 */
export interface FormField<T> {
  value: Signal<T>;
  error: Signal<string | null>;
  touched: Signal<boolean>;
  dirty: Signal<boolean>;
  valid: Computed<boolean>;
  validate: () => boolean;
  reset: () => void;
  setError: (error: string | null) => void;
}

export interface FormFieldOptions<T> {
  initialValue: T;
  validate?: (value: T) => string | null;
  required?: boolean;
  requiredMessage?: string;
}

export function useField<T>(options: FormFieldOptions<T>): FormField<T> {
  const { initialValue, validate, required, requiredMessage = 'This field is required' } = options;

  const value = signal<T>(initialValue);
  const error = signal<string | null>(null);
  const touched = signal(false);
  const dirty = signal(false);

  const valid = computed(() => error.get() === null);

  const runValidation = (): boolean => {
    touched.set(true);

    // Check required
    if (required) {
      const val = value.get();
      if (val === '' || val === null || val === undefined) {
        error.set(requiredMessage);
        return false;
      }
    }

    // Run custom validator
    if (validate) {
      const validationError = validate(value.get());
      error.set(validationError);
      return validationError === null;
    }

    error.set(null);
    return true;
  };

  // Track dirty state
  effect(() => {
    const current = value.get();
    if (current !== initialValue) {
      dirty.set(true);
    }
  });

  return {
    value,
    error,
    touched,
    dirty,
    valid,
    validate: runValidation,
    reset: () => {
      value.set(initialValue);
      error.set(null);
      touched.set(false);
      dirty.set(false);
    },
    setError: (err) => error.set(err),
  };
}

/**
 * Simple form state management
 */
export interface FormOptions<T extends Record<string, any>> {
  initialValues: T;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit?: (values: T) => void | Promise<void>;
}

export interface Form<T extends Record<string, any>> {
  values: Signal<T>;
  errors: Signal<Partial<Record<keyof T, string>>>;
  touched: Signal<Set<keyof T>>;
  dirty: Signal<boolean>;
  submitting: Signal<boolean>;
  valid: Computed<boolean>;
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setFieldError: <K extends keyof T>(field: K, error: string | null) => void;
  setFieldTouched: <K extends keyof T>(field: K) => void;
  getFieldProps: <K extends keyof T>(field: K) => {
    value: Computed<T[K]>;
    onChange: (e: Event) => void;
    onBlur: () => void;
  };
  validate: () => boolean;
  handleSubmit: (e?: Event) => Promise<void>;
  reset: () => void;
}

export function useForm<T extends Record<string, any>>(options: FormOptions<T>): Form<T> {
  const { initialValues, validate: validateFn, onSubmit } = options;

  const values = signal<T>({ ...initialValues });
  const errors = signal<Partial<Record<keyof T, string>>>({});
  const touched = signal<Set<keyof T>>(new Set());
  const dirty = signal(false);
  const submitting = signal(false);

  const valid = computed(() => Object.keys(errors.get()).length === 0);

  const validate = (): boolean => {
    if (validateFn) {
      const validationErrors = validateFn(values.get());
      errors.set(validationErrors);
      return Object.keys(validationErrors).length === 0;
    }
    return true;
  };

  const setFieldValue = <K extends keyof T>(field: K, value: T[K]) => {
    values.set({ ...values.get(), [field]: value });
    dirty.set(true);
  };

  const setFieldError = <K extends keyof T>(field: K, error: string | null) => {
    const currentErrors = errors.get();
    if (error === null) {
      const { [field]: _, ...rest } = currentErrors;
      errors.set(rest as Partial<Record<keyof T, string>>);
    } else {
      errors.set({ ...currentErrors, [field]: error });
    }
  };

  const setFieldTouched = <K extends keyof T>(field: K) => {
    const current = touched.get();
    current.add(field);
    touched.set(new Set(current));
  };

  const getFieldProps = <K extends keyof T>(field: K) => ({
    value: computed(() => values.get()[field]),
    onChange: (e: Event) => {
      const target = e.target as HTMLInputElement;
      setFieldValue(field, target.value as T[K]);
    },
    onBlur: () => setFieldTouched(field),
  });

  const handleSubmit = async (e?: Event) => {
    e?.preventDefault();

    if (!validate()) return;

    submitting.set(true);
    try {
      await onSubmit?.(values.get());
    } finally {
      submitting.set(false);
    }
  };

  const reset = () => {
    values.set({ ...initialValues });
    errors.set({});
    touched.set(new Set());
    dirty.set(false);
  };

  return {
    values,
    errors,
    touched,
    dirty,
    submitting,
    valid,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    getFieldProps,
    validate,
    handleSubmit,
    reset,
  };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Force component re-render (signal update)
 */
export function useForceUpdate(): () => void {
  const tick = signal(0);
  return () => tick.set(tick.get() + 1);
}

/**
 * Random ID generator
 */
export function useId(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Safe component mounted check
 */
export function useMounted(): Signal<boolean> {
  const mounted = signal(false);

  if (typeof window !== 'undefined') {
    queueMicrotask(() => mounted.set(true));
  }

  return mounted;
}

/**
 * Run effect only once after mount
 */
export function useEffectOnce(callback: () => void | (() => void)): void {
  let hasRun = false;

  effect(() => {
    if (!hasRun) {
      hasRun = true;
      return callback();
    }
  });
}

/**
 * Run callback on unmount
 */
export function useUnmount(callback: () => void): void {
  effect(() => {
    return callback;
  });
}

/**
 * Log signal changes (development)
 */
export function useLogger<T>(name: string, value: Signal<T>): void {
  effect(() => {
    console.log(`[${name}]`, value.get());
  });
}

/**
 * Persist signal to URL hash
 */
export function useHash(): [Signal<string>, (hash: string) => void] {
  const getHash = () =>
    typeof window !== 'undefined' ? window.location.hash.slice(1) : '';

  const hash = signal(getHash());

  const setHash = (newHash: string) => {
    if (typeof window !== 'undefined') {
      window.location.hash = newHash;
      hash.set(newHash);
    }
  };

  if (typeof window !== 'undefined') {
    effect(() => {
      const handleHashChange = () => {
        hash.set(getHash());
      };

      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    });
  }

  return [hash, setHash];
}

/**
 * Lock orientation (mobile)
 */
export function useLockOrientation(
  orientation: 'portrait' | 'landscape' | 'portrait-primary' | 'landscape-primary'
): {
  lock: () => Promise<void>;
  unlock: () => void;
  supported: boolean;
} {
  const supported = typeof screen !== 'undefined' && 'orientation' in screen;

  const lock = async () => {
    if (supported) {
      try {
        await (screen.orientation as any).lock(orientation);
      } catch (e) {
        console.warn('Orientation lock not supported:', e);
      }
    }
  };

  const unlock = () => {
    if (supported) {
      screen.orientation.unlock();
    }
  };

  return { lock, unlock, supported };
}

/**
 * Network information
 */
export interface NetworkInfo {
  online: Signal<boolean>;
  downlink: Signal<number | undefined>;
  effectiveType: Signal<'slow-2g' | '2g' | '3g' | '4g' | undefined>;
  rtt: Signal<number | undefined>;
  saveData: Signal<boolean>;
}

export function useNetwork(): NetworkInfo {
  const online = useOnline();
  const downlink = signal<number | undefined>(undefined);
  const effectiveType = signal<'slow-2g' | '2g' | '3g' | '4g' | undefined>(undefined);
  const rtt = signal<number | undefined>(undefined);
  const saveData = signal<boolean>(false);

  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as any).connection;

    const updateInfo = () => {
      downlink.set(connection?.downlink);
      effectiveType.set(connection?.effectiveType);
      rtt.set(connection?.rtt);
      saveData.set(connection?.saveData ?? false);
    };

    updateInfo();

    effect(() => {
      connection?.addEventListener('change', updateInfo);
      return () => connection?.removeEventListener('change', updateInfo);
    });
  }

  return { online, downlink, effectiveType, rtt, saveData };
}

/**
 * Idle detection
 */
export function useIdle(timeout = 60000): Signal<boolean> {
  const idle = signal(false);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const resetTimer = () => {
    idle.set(false);
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => idle.set(true), timeout);
  };

  if (typeof window !== 'undefined') {
    const events = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];

    effect(() => {
      events.forEach(event => window.addEventListener(event, resetTimer, { passive: true }));
      resetTimer();

      return () => {
        events.forEach(event => window.removeEventListener(event, resetTimer));
        if (timeoutId) clearTimeout(timeoutId);
      };
    });
  }

  return idle;
}

/**
 * Text selection
 */
export function useTextSelection(): {
  text: Signal<string>;
  range: Signal<Range | null>;
  rects: Signal<DOMRectList | null>;
} {
  const text = signal('');
  const range = signal<Range | null>(null);
  const rects = signal<DOMRectList | null>(null);

  if (typeof document !== 'undefined') {
    effect(() => {
      const handleSelectionChange = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const selectedRange = selection.getRangeAt(0);
          text.set(selection.toString());
          range.set(selectedRange);
          rects.set(selectedRange.getClientRects());
        } else {
          text.set('');
          range.set(null);
          rects.set(null);
        }
      };

      document.addEventListener('selectionchange', handleSelectionChange);
      return () => document.removeEventListener('selectionchange', handleSelectionChange);
    });
  }

  return { text, range, rects };
}

/**
 * Eye dropper (color picker)
 */
export function useEyeDropper(): {
  open: () => Promise<string | null>;
  supported: boolean;
} {
  const supported = typeof window !== 'undefined' && 'EyeDropper' in window;

  const open = async (): Promise<string | null> => {
    if (!supported) return null;

    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      return result.sRGBHex;
    } catch {
      return null;
    }
  };

  return { open, supported };
}

// ============================================================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================================================

export { signal, computed, effect, batch };
export type { Signal, Computed };
