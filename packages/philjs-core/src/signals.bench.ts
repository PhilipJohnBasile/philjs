import { bench, describe } from 'vitest';
import { signal, memo, effect, batch, createRoot } from './signals.js';

describe('Signal Performance', () => {
  bench('signal creation', () => {
    signal(0);
  });

  bench('signal read', () => {
    const count = signal(0);
    count();
  });

  bench('signal write', () => {
    const count = signal(0);
    count.set(1);
  });

  bench('signal write with updater function', () => {
    const count = signal(0);
    count.set(c => c + 1);
  });

  bench('100 signal updates', () => {
    const count = signal(0);
    for (let i = 0; i < 100; i++) {
      count.set(i);
    }
  });
});

describe('Memo Performance', () => {
  bench('memo creation', () => {
    const count = signal(0);
    memo(() => count() * 2);
  });

  bench('memo computation', () => {
    const count = signal(0);
    const doubled = memo(() => count() * 2);
    doubled();
  });

  bench('memo re-computation on dependency change', () => {
    const count = signal(0);
    const doubled = memo(() => count() * 2);
    count.set(1);
    doubled();
  });

  bench('chained memos (5 levels deep)', () => {
    const a = signal(1);
    const b = memo(() => a() * 2);
    const c = memo(() => b() * 2);
    const d = memo(() => c() * 2);
    const e = memo(() => d() * 2);
    e();
  });

  bench('diamond dependency memo', () => {
    const a = signal(1);
    const b = memo(() => a() * 2);
    const c = memo(() => a() * 3);
    const d = memo(() => b() + c());
    d();
  });
});

describe('Effect Performance', () => {
  bench('effect creation and execution', () => {
    const count = signal(0);
    const dispose = effect(() => {
      count();
    });
    dispose();
  });

  bench('effect re-execution', () => {
    const count = signal(0);
    let value = 0;
    const dispose = effect(() => {
      value = count();
    });
    count.set(1);
    dispose();
  });

  bench('100 effects on single signal', () => {
    const count = signal(0);
    const disposes: Array<() => void> = [];

    for (let i = 0; i < 100; i++) {
      disposes.push(effect(() => { count(); }));
    }

    count.set(1);

    disposes.forEach(d => d());
  });

  bench('effect with cleanup', () => {
    const count = signal(0);
    const dispose = createRoot(dispose => {
      effect(() => {
        count();
        return () => {
          // cleanup
        };
      });
      return dispose;
    });
    count.set(1);
    dispose();
  });
});

describe('Batch Performance', () => {
  bench('batched updates (10 signals)', () => {
    const signals = Array.from({ length: 10 }, () => signal(0));
    let sum = 0;

    const dispose = effect(() => {
      sum = signals.reduce((acc, s) => acc + s(), 0);
    });

    batch(() => {
      signals.forEach((s, i) => s.set(i));
    });

    dispose();
  });

  bench('nested batches', () => {
    const a = signal(0);
    const b = signal(0);

    batch(() => {
      a.set(1);
      batch(() => {
        b.set(1);
      });
    });
  });

  bench('unbatched updates vs batched (50 signals)', () => {
    const signals = Array.from({ length: 50 }, () => signal(0));

    batch(() => {
      signals.forEach((s, i) => s.set(i));
    });
  });
});

describe('Real-world Scenarios', () => {
  bench('todo list: add 100 items', () => {
    const todos = signal<Array<{ id: number; text: string; done: boolean }>>([]);

    for (let i = 0; i < 100; i++) {
      todos.set(current => [
        ...current,
        { id: i, text: `Todo ${i}`, done: false }
      ]);
    }
  });

  bench('reactive counter with derived state', () => {
    const count = signal(0);
    const doubled = memo(() => count() * 2);
    const quadrupled = memo(() => doubled() * 2);

    let result = 0;
    const dispose = effect(() => {
      result = quadrupled();
    });

    for (let i = 0; i < 10; i++) {
      count.set(i);
    }

    dispose();
  });

  bench('form state management', () => {
    const formData = signal({
      name: '',
      email: '',
      age: 0
    });

    const isValid = memo(() => {
      const data = formData();
      return data.name.length > 0 && data.email.includes('@') && data.age >= 18;
    });

    formData.set({ name: 'John', email: 'john@example.com', age: 25 });
    isValid();
  });

  bench('nested component state (10 levels)', () => {
    const root = signal({ value: 0, children: [] as any[] });

    let current: any = root();
    for (let i = 0; i < 10; i++) {
      const child = { value: i, children: [] };
      current.children.push(child);
      current = child;
    }

    root.set({ ...root() });
  });
});
