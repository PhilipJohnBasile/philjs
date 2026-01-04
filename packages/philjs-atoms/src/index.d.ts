/**
 * Jotai-style atomic state management for PhilJS
 *
 * Features:
 * - Primitive atoms (read/write state)
 * - Derived atoms (computed from other atoms)
 * - Async atoms (promises)
 * - Atom families (parameterized atoms)
 * - Write-only atoms (actions)
 * - Atom utilities (reset, freeze, etc.)
 */
import { type Signal } from '@philjs/core';
export type Getter = <Value>(atom: Atom<Value>) => Value;
export type Setter = <Value, Args extends unknown[], Result>(atom: WritableAtom<Value, Args, Result>, ...args: Args) => Result;
export interface Atom<Value> {
    read: (get: Getter) => Value;
    debugLabel?: string;
}
export interface WritableAtom<Value, Args extends unknown[], Result> extends Atom<Value> {
    write: (get: Getter, set: Setter, ...args: Args) => Result;
}
export type SetStateAction<Value> = Value | ((prev: Value) => Value);
export type PrimitiveAtom<Value> = WritableAtom<Value, [SetStateAction<Value>], void>;
export interface AtomFamily<Param, AtomType> {
    (param: Param): AtomType;
    remove: (param: Param) => void;
}
/**
 * Create a primitive atom (read/write state)
 *
 * @example
 * ```ts
 * const countAtom = atom(0);
 *
 * // In component
 * const count = useAtom(countAtom);
 * const setCount = useSetAtom(countAtom);
 * setCount(5);
 * setCount(c => c + 1);
 * ```
 */
export declare function atom<Value>(initialValue: Value): PrimitiveAtom<Value>;
/**
 * Create a derived atom (computed from other atoms)
 *
 * @example
 * ```ts
 * const countAtom = atom(0);
 * const doubledAtom = atom((get) => get(countAtom) * 2);
 * ```
 */
export declare function atom<Value>(read: (get: Getter) => Value): Atom<Value>;
/**
 * Create a writable derived atom
 *
 * @example
 * ```ts
 * const countAtom = atom(0);
 * const incrementAtom = atom(
 *   (get) => get(countAtom),
 *   (get, set) => set(countAtom, get(countAtom) + 1)
 * );
 * ```
 */
export declare function atom<Value, Args extends unknown[], Result>(read: (get: Getter) => Value, write: (get: Getter, set: Setter, ...args: Args) => Result): WritableAtom<Value, Args, Result>;
/**
 * Read atom value
 *
 * @example
 * ```ts
 * const count = useAtomValue(countAtom);
 * ```
 */
export declare function useAtomValue<Value>(atomInstance: Atom<Value>): Value;
/**
 * Get setter function for atom
 *
 * @example
 * ```ts
 * const setCount = useSetAtom(countAtom);
 * setCount(5);
 * ```
 */
export declare function useSetAtom<Value, Args extends unknown[], Result>(atomInstance: WritableAtom<Value, Args, Result>): (...args: Args) => Result;
/**
 * Read and write atom
 *
 * @example
 * ```ts
 * const [count, setCount] = useAtom(countAtom);
 * ```
 */
export declare function useAtom<Value, Args extends unknown[], Result>(atomInstance: WritableAtom<Value, Args, Result>): [Value, (...args: Args) => Result];
export interface AsyncAtom<Value> extends Atom<Value> {
    loading: Signal<boolean>;
    error: Signal<Error | null>;
}
/**
 * Create an async atom that fetches data
 *
 * @example
 * ```ts
 * const userAtom = asyncAtom(async (get) => {
 *   const userId = get(userIdAtom);
 *   const response = await fetch(`/api/users/${userId}`);
 *   return response.json();
 * });
 *
 * // In component
 * const user = useAtomValue(userAtom);
 * if (userAtom.loading()) return <Spinner />;
 * if (userAtom.error()) return <Error />;
 * return <div>{user.name}</div>;
 * ```
 */
export declare function asyncAtom<Value>(read: (get: Getter) => Promise<Value>): AsyncAtom<Value>;
/**
 * Create a loadable async atom (doesn't throw)
 *
 * @example
 * ```ts
 * const userAtom = loadable(async (get) => {
 *   const response = await fetch('/api/user');
 *   return response.json();
 * });
 *
 * const loadableUser = useAtomValue(userAtom);
 * if (loadableUser.state === 'loading') return <Spinner />;
 * if (loadableUser.state === 'hasError') return <Error error={loadableUser.error} />;
 * return <div>{loadableUser.data.name}</div>;
 * ```
 */
export declare function loadable<Value>(asyncAtomInstance: Atom<Value>): Atom<{
    state: 'loading';
} | {
    state: 'hasData';
    data: Value;
} | {
    state: 'hasError';
    error: Error;
}>;
/**
 * Create a family of atoms parameterized by a value
 *
 * @example
 * ```ts
 * const todoAtomFamily = atomFamily((id: number) =>
 *   atom({ id, text: '', completed: false })
 * );
 *
 * // Use with different IDs
 * const todo1 = useAtomValue(todoAtomFamily(1));
 * const todo2 = useAtomValue(todoAtomFamily(2));
 * ```
 */
export declare function atomFamily<Param, Value>(initializeAtom: (param: Param) => PrimitiveAtom<Value>): AtomFamily<Param, PrimitiveAtom<Value>>;
export declare function atomFamily<Param, Value>(initializeAtom: (param: Param) => Atom<Value>): AtomFamily<Param, Atom<Value>>;
/**
 * Create a write-only atom (action)
 *
 * @example
 * ```ts
 * const incrementAtom = atomAction((get, set) => {
 *   const count = get(countAtom);
 *   set(countAtom, count + 1);
 * });
 *
 * const increment = useSetAtom(incrementAtom);
 * increment();
 * ```
 */
export declare function atomAction<Args extends unknown[]>(write: (get: Getter, set: Setter, ...args: Args) => void): WritableAtom<null, Args, void>;
/**
 * Create an atom that can be reset to its initial value
 *
 * @example
 * ```ts
 * const countAtom = atomWithReset(0);
 *
 * const reset = useResetAtom(countAtom);
 * reset(); // Resets to 0
 * ```
 */
export declare function atomWithReset<Value>(initialValue: Value): PrimitiveAtom<Value> & {
    reset: () => void;
};
/**
 * Reset an atom to its initial value
 *
 * @example
 * ```ts
 * const reset = useResetAtom(countAtom);
 * reset();
 * ```
 */
export declare function useResetAtom(atomInstance: PrimitiveAtom<any>): () => void;
/**
 * Create an atom with localStorage persistence
 *
 * @example
 * ```ts
 * const themeAtom = atomWithStorage('theme', 'light');
 * ```
 */
export declare function atomWithStorage<Value>(key: string, initialValue: Value, storage?: Storage): PrimitiveAtom<Value>;
/**
 * Freeze an atom (make it read-only)
 *
 * @example
 * ```ts
 * const frozenAtom = freezeAtom(countAtom);
 * // frozenAtom cannot be modified
 * ```
 */
export declare function freezeAtom<Value>(atomInstance: Atom<Value>): Atom<Value>;
/**
 * Select a property from an atom
 *
 * @example
 * ```ts
 * const userAtom = atom({ name: 'John', age: 30 });
 * const nameAtom = selectAtom(userAtom, (user) => user.name);
 * ```
 */
export declare function selectAtom<Value, Selected>(atomInstance: Atom<Value>, selector: (value: Value) => Selected): Atom<Selected>;
/**
 * Focus on a property of an atom (read/write)
 *
 * @example
 * ```ts
 * const userAtom = atom({ name: 'John', age: 30 });
 * const nameAtom = focusAtom(userAtom, (optic) => optic.prop('name'));
 *
 * const [name, setName] = useAtom(nameAtom);
 * setName('Jane'); // Updates only the name property
 * ```
 */
export declare function focusAtom<Value, Focused>(atomInstance: WritableAtom<Value, [SetStateAction<Value>], void>, focus: (value: Value) => Focused): WritableAtom<Focused, [SetStateAction<Focused>], void>;
/**
 * Split an atom into read and write atoms
 *
 * @example
 * ```ts
 * const [readAtom, writeAtom] = splitAtom(userAtom);
 * const user = useAtomValue(readAtom);
 * const setUser = useSetAtom(writeAtom);
 * ```
 */
export declare function splitAtom<Value, Args extends unknown[], Result>(atomInstance: WritableAtom<Value, Args, Result>): [Atom<Value>, WritableAtom<null, Args, Result>];
/**
 * Batch multiple atom updates
 *
 * @example
 * ```ts
 * batchAtoms(() => {
 *   setCount(5);
 *   setName('John');
 *   setAge(30);
 * }); // Only one render
 * ```
 */
export declare function batchAtoms<T>(fn: () => T): T;
//# sourceMappingURL=index.d.ts.map