import { signal, memo } from '@philjs/core';
// Compatibility wrapper to provide tuple-style API
function createSignal(initialValue) {
    const sig = signal(initialValue);
    return [() => sig.get(), (v) => sig.set(v)];
}
// Global store for atoms to ensure singleton behavior per key
const atomStore = new Map();
function getAtomSignal(atom) {
    if (!atomStore.has(atom.key)) {
        atomStore.set(atom.key, createSignal(atom.default));
    }
    return atomStore.get(atom.key);
}
export function atom(options) {
    return { key: options.key, default: options.default };
}
export function useRecoilState(atom) {
    const [value, setValue] = getAtomSignal(atom);
    return [value, setValue];
}
export function useRecoilValue(atom) {
    const [value] = getAtomSignal(atom);
    return value;
}
export function selector(options) {
    // Selectors in PhilJS maps directly to Memos
    // However, because 'get' is dynamic in Recoil but static in memo,
    // we pass a 'get' helper that unwraps the atom's signal.
    return memo(() => {
        return options.get({
            get: (atom) => {
                const [val] = getAtomSignal(atom);
                return val();
            }
        });
    });
}
export function atomFamily(options) {
    const atoms = new Map();
    return (param) => {
        if (!atoms.has(param)) {
            const defaultValue = typeof options.default === 'function'
                ? options.default(param)
                : options.default;
            atoms.set(param, atom({
                key: `${options.key}__${param}`,
                default: defaultValue
            }));
        }
        return atoms.get(param);
    };
}
//# sourceMappingURL=recoil.js.map