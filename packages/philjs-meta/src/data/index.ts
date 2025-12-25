/**
 * PhilJS Meta - Data Module
 *
 * Data loading and caching exports
 */

// Loaders
export {
  defineLoader,
  defineAction,
  executeLoader,
  executeAction,
  useLoaderData,
  useActionData,
  useIsSubmitting,
  useParams,
  useSearchParams,
  setRouteContext,
  getRouteKey,
  createFormAction,
  createServerContext,
  json,
  redirect,
  defer,
  hydration,
  RedirectResponse,
  NotFoundResponse,
  DeferredData,
  type LoaderContext,
  type ActionContext,
  type LoaderFunction,
  type ActionFunction,
  type ActionResponse,
  type ActionErrors,
  type ServerContext,
  type CookieStore,
  type CookieOptions,
  type FormActionHandler,
} from './loaders';

// Cache
export {
  cached,
  useSWR,
  revalidatePath,
  revalidateTag,
  cacheControl,
  unstable_cache,
  cache,
  ISRManager,
  type CacheEntry,
  type CacheOptions,
  type CacheStats,
  type CacheControlOptions,
  type RevalidateOptions,
  type SWRConfig,
  type SWRState,
  type ISRConfig,
} from './cache';
