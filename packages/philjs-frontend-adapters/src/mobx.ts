
// Stub for MobX useObservable
export function useObservable<T>(initialValue: T): T {
    console.log('useObservable stub called');
    // In a real implementation this would proxy to a PhilJS signal
    return initialValue;
}
