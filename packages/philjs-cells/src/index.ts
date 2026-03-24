
import { type Signal, signal, effect } from '@philjs/core';

interface CellProps<T> {
  query: () => Promise<T>;
  Loading?: () => any;
  Error?: (props: { error: Error }) => any;
  Success: (props: { data: T }) => any;
}

export function Cell<T>(props: CellProps<T>) {
  const data = signal<T | undefined>(undefined);
  const error = signal<Error | undefined>(undefined);
  const loading = signal(true);

  effect(() => {
    // Wrap async in self-invoking function inside effect for safe execution
    (async () => {
      try {
        loading.set(true);
        data.set(await props.query());
      } catch (e: any) {
        error.set(e);
      } finally {
        loading.set(false);
      }
    })();
  });

  return () => {
    if (loading()) return props.Loading ? props.Loading() : 'Loading...';
    if (error()) return props.Error ? props.Error({ error: error()! }) : 'Error';
    // @ts-ignore
    return props.Success({ data: data()! });
  };
}
