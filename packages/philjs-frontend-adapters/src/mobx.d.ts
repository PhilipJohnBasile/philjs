export declare function useObservable<T extends object>(initialValue: T): T;
export declare function autorun(reaction: () => void): () => void;
export declare function computed<T>(getter: () => T): {
    get: any;
};
//# sourceMappingURL=mobx.d.ts.map