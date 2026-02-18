import { type Memo } from '@philjs/core';
export interface RecoilState<T> {
    key: string;
    default: T | Promise<T>;
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
export declare function atom<T>(options: AtomOptions<T>): RecoilState<T>;
export declare function useRecoilState<T>(atom: RecoilState<T>): [() => T, (v: T) => void];
export declare function useRecoilValue<T>(atom: RecoilState<T>): () => T;
export declare function selector<T>(options: {
    key: string;
    get: (opts: {
        get: Function;
    }) => T;
}): Memo<T>;
export declare function atomFamily<T, P extends string = string>(options: AtomFamilyOptions<T, P>): (param: P) => RecoilState<T>;
