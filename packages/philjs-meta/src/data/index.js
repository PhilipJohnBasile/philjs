/**
 * PhilJS Meta - Data Module
 *
 * Data loading and caching exports
 */
// Loaders
export { defineLoader, defineAction, executeLoader, executeAction, useLoaderData, useActionData, useIsSubmitting, useParams, useSearchParams, setRouteContext, getRouteKey, createFormAction, createServerContext, json, redirect, defer, hydration, RedirectResponse, NotFoundResponse, DeferredData, } from './loaders.js';
// Cache
export { cached, useSWR, revalidatePath, revalidateTag, cacheControl, unstable_cache, cache, ISRManager, } from './cache.js';
//# sourceMappingURL=index.js.map