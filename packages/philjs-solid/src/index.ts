
// SolidStart API Parity Stub

export function createRouteData(fetcher: () => Promise<any>) {
    // Stub for data loading
    return { resource: fetcher };
}

export function createServerAction(action: () => Promise<any>) {
    // Stub for RPC action
    return action;
}
