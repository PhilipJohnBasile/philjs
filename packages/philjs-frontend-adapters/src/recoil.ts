
export interface RecoilState<T> {
  key: string;
  default: T | Promise<T>;
}

export interface AtomOptions<T> {
  key: string;
  default: T;
}

export interface AtomFamilyOptions<T, P> {
  key: string;
  default: T | ((param: P) => T);
}

export function atom<T>(options: AtomOptions<T>): RecoilState<T> {
  console.log(`Recoil: Created atom "${options.key}"`);
  return { key: options.key, default: options.default };
}

export function selector<T>(options: { key: string, get: (opts: { get: Function }) => T }) {
  console.log(`Recoil: Created selector "${options.key}"`);
  return {
    key: options.key,
    // Mock getter execution
    getValue: () => options.get({ get: (atom: RecoilState<any>) => atom.default })
  };
}

export function atomFamily<T, P extends string = string>(options: AtomFamilyOptions<T, P>) {
  const atoms = new Map<string, RecoilState<T>>();

  return (param: P) => {
    if (!atoms.has(param)) {
      const defaultValue = typeof options.default === 'function'
        ? (options.default as Function)(param)
        : options.default;

      atoms.set(param, {
        key: `${options.key}__${param}`,
        default: defaultValue
      });
    }
    return atoms.get(param)!;
  };
}
