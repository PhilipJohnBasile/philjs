
// Stub for Redux DevTools connection
export function connectDevTools(store: any) {
    if (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) {
        const devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect();
        devTools.init(store.getState());
        devTools.subscribe((message: any) => {
            if (message.type === 'DISPATCH' && message.state) {
                console.log('Redux DevTools Dispatch', message);
            }
        });
    }
}
