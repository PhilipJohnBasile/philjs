import { createSignal, onCleanup } from '@philjs/core';
export function useSelector(store, selector) {
    const [selected, setSelected] = createSignal(selector(store.getState()));
    const unsubscribe = store.subscribe(() => {
        const nextValue = selector(store.getState());
        // PhilJS signals typically handle equality check, but explicit check here saves overhead
        if (nextValue !== selected()) {
            setSelected(nextValue);
        }
    });
    onCleanup(() => unsubscribe());
    return selected;
}
export function connectDevTools(store) {
    if (typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__) {
        const devTools = window.__REDUX_DEVTOOLS_EXTENSION__.connect({ name: 'PhilJS App' });
        devTools.init(store.getState());
        store.subscribe(() => {
            devTools.send('STATE_UPDATE', store.getState());
        });
        devTools.subscribe((message) => {
            if (message.type === 'DISPATCH' && message.payload?.type === 'JUMP_TO_ACTION') {
                console.log('Redux DevTools: Jump detected (Implementation requires store.setState which Redux lacks by default)');
            }
        });
    }
}
//# sourceMappingURL=redux.js.map