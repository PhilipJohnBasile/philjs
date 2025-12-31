/**
 * PhilJS Native Networking
 *
 * Network connectivity and enhanced fetch APIs.
 */
// NetInfo
export { NetInfo, configure as configureNetInfo, useNetInfo, useIsConnected, useIsInternetReachable, useNetworkType, netInfoState, isConnected, isInternetReachable, networkType, whenConnected, whenReachable, isOnWifi, isOnCellular, isExpensiveConnection, } from './NetInfo.js';
// Fetch
export { Fetch, enhancedFetch, get, post, put, patch, del as deleteFetch, head, interceptors, createFetchInstance, clearCache, useFetch, createAbortController, FetchError, } from './Fetch.js';
//# sourceMappingURL=index.js.map