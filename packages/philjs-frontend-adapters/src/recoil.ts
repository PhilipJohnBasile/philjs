import { signal, memo, type Signal, type Memo } from '@philjs/core';

// Compatibility wrapper to provide tuple-style API
function createSignal<T>(initialValue: T): [() => T, (v: T) => void] {
    const sig = signal(initialValue);
    return [() => sig.get(), (v: T) => sig.set(v)];
}

export interface RecoilState<T> {
  key: string;
  default: T | Promise<T>;
  // Runtime storage for the signal backing this atom
  _signal?: [() => T, (v: T) => void];
}

export interface AtomOptions<T> {
  key: string;
  default: T;
}

export interface AtomFamilyOptions<T, P> {
  key: string;
  default: T | ((param: P) => T);
}

// Global store for atoms to ensure singleton behavior per key
const atomStore = new Map<string, [() => any, (v: any) => void]>();

function getAtomSignal<T>(atom: RecoilState<T>): [() => T, (v: T) => void] {
  if (!atomStore.has(atom.key)) {
    atomStore.set(atom.key, createSignal<T>(atom.default as T));
  }
  return atomStore.get(atom.key)!;
}

export function atom<T>(options: AtomOptions<T>): RecoilState<T> {
  return { key: options.key, default: options.default };
}

export function useRecoilState<T>(atom: RecoilState<T>): [() => T, (v: T) => void] {
  const [value, setValue] = getAtomSignal(atom);
  return [value, setValue];
}

export function useRecoilValue<T>(atom: RecoilState<T>): () => T {
  const [value] = getAtomSignal(atom);
  return value;
}

export function selector<T>(options: { key: string, get: (opts: { get: Function }) => T }): Memo<T> {
  // Selectors in PhilJS maps directly to Memos
  // However, because 'get' is dynamic in Recoil but static in memo,
  // we pass a 'get' helper that unwraps the atom's signal.

  return memo(() => {
    return options.get({
      get: (atom: RecoilState<any>) => {
        const [val] = getAtomSignal(atom);
        return val();
      }
    });
  });
}

export function atomFamily<T, P extends string = string>(options: AtomFamilyOptions<T, P>) {
  const atoms = new Map<string, RecoilState<T>>();

  return (param: P) => {
    if (!atoms.has(param)) {
      const defaultValue = typeof options.default === 'function'
        ? (options.default as Function)(param)
        : options.default;

      atoms.set(param, atom({
        key: `${options.key}__${param}`,
        default: defaultValue
      }));
    }
    return atoms.get(param)!;
  };
}
