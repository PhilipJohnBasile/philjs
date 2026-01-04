
export function useObservable<T extends object>(initialValue: T): T {
    console.log('MobX: Creating observable proxy');

    return new Proxy(initialValue, {
        get(target, prop, receiver) {
            console.log(`MobX: Read ${String(prop)}`);
            return Reflect.get(target, prop, receiver);
        },
        set(target, prop, value, receiver) {
            console.log(`MobX: Write ${String(prop)} =`, value);
            const result = Reflect.set(target, prop, value, receiver);
            // Trigger mock reactions
            return result;
        }
    });
}

export function autorun(reaction: () => void) {
    console.log('MobX: Running autorun');
    reaction();
    return () => console.log('MobX: Disposing autorun');
}

export function computed<T>(getter: () => T) {
    console.log('MobX: Creating computed value');
    return {
        get() {
            console.log('MobX: Reading computed');
            return getter();
        }
    };
}
