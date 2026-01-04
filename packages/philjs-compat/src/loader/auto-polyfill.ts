/**
 * Auto-Polyfill Loader
 *
 * Automatically detects and loads missing polyfills for browser compatibility.
 */

import type {
  FeatureName,
  AutoPolyfillOptions,
  PolyfillLoadResult,
  PolyfillModule,
} from '../types.js';
import { getMissingFeatures, isSupported, isBrowser } from '../detection/feature-detect.js';
import {
  polyfillModules,
  getPolyfillModule,
  getAvailablePolyfills,
} from '../polyfills/index.js';

/**
 * Default features to polyfill
 */
const DEFAULT_FEATURES: FeatureName[] = [
  'IntersectionObserver',
  'ResizeObserver',
  'requestIdleCallback',
  'structuredClone',
];

/**
 * Default CDN base URL
 */
const DEFAULT_CDN_BASE = 'https://cdnjs.cloudflare.com/ajax/libs';

/**
 * Get the list of missing features that need polyfilling
 */
export function getMissingPolyfillableFeatures(
  features: FeatureName[] = DEFAULT_FEATURES
): FeatureName[] {
  const availablePolyfills = getAvailablePolyfills();
  const polyfillableFeatures = features.filter((f) => availablePolyfills.includes(f));
  return getMissingFeatures(polyfillableFeatures);
}

/**
 * Load a single polyfill
 */
async function loadPolyfill(
  feature: FeatureName,
  options: AutoPolyfillOptions
): Promise<{ success: boolean; error?: Error }> {
  const polyfillModule = getPolyfillModule(feature);

  if (!polyfillModule) {
    return {
      success: false,
      error: new Error(`No polyfill available for ${feature}`),
    };
  }

  if (!polyfillModule.isNeeded()) {
    return { success: true };
  }

  try {
    await polyfillModule.apply();
    return { success: true };
  } catch (error) {
    // If using CDN and the module has a CDN URL, try loading from there
    if (options.useCDN && polyfillModule.cdnUrl) {
      try {
        await loadFromCDN(polyfillModule.cdnUrl);
        return { success: true };
      } catch (cdnError) {
        return {
          success: false,
          error: cdnError instanceof Error ? cdnError : new Error(String(cdnError)),
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Load a script from CDN
 */
function loadFromCDN(url: string): Promise<void> {
  if (!isBrowser()) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;

    script.onload = () => {
      resolve();
    };

    script.onerror = () => {
      reject(new Error(`Failed to load script from ${url}`));
    };

    document.head.appendChild(script);
  });
}

/**
 * Auto-polyfill missing features
 *
 * @param options Configuration options
 * @returns Result of the polyfill loading process
 *
 * @example
 * ```typescript
 * // Load all default polyfills
 * const result = await autoPolyfill();
 *
 * // Load specific polyfills
 * const result = await autoPolyfill({
 *   features: ['IntersectionObserver', 'ResizeObserver'],
 *   useCDN: true,
 * });
 * ```
 */
export async function autoPolyfill(
  options: AutoPolyfillOptions = {}
): Promise<PolyfillLoadResult> {
  const startTime = performance.now();

  const {
    features = DEFAULT_FEATURES,
    useCDN = false,
    lazy = false,
    onLoad,
    onError,
    skipNative = true,
  } = options;

  const loaded: FeatureName[] = [];
  const failed: Array<{ feature: FeatureName; error: Error }> = [];
  const skipped: FeatureName[] = [];

  // Determine which features need polyfilling
  const featuresToLoad = skipNative ? getMissingPolyfillableFeatures(features) : features;
  const skippedFeatures = features.filter((f) => !featuresToLoad.includes(f));
  skipped.push(...skippedFeatures);

  // Load polyfills
  if (lazy) {
    // Lazy loading - load polyfills on demand
    for (const feature of featuresToLoad) {
      // For lazy loading, we just register that it needs to be loaded
      // The actual loading happens when the feature is first used
      const polyfillModule = getPolyfillModule(feature);
      if (polyfillModule && polyfillModule.isNeeded()) {
        // Apply synchronous polyfills immediately
        try {
          await polyfillModule.apply();
          loaded.push(feature);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          failed.push({ feature, error: err });
          onError?.(feature, err);
        }
      } else {
        skipped.push(feature);
      }
    }
  } else {
    // Eager loading - load all polyfills in parallel
    const loadPromises = featuresToLoad.map(async (feature) => {
      const result = await loadPolyfill(feature, { ...options, useCDN });

      if (result.success) {
        loaded.push(feature);
      } else if (result.error) {
        failed.push({ feature, error: result.error });
        onError?.(feature, result.error);
      }
    });

    await Promise.all(loadPromises);
  }

  const loadTime = performance.now() - startTime;

  // Call onLoad callback if provided
  if (loaded.length > 0 && onLoad) {
    onLoad(loaded);
  }

  return {
    loaded,
    failed,
    skipped,
    loadTime,
  };
}

/**
 * Synchronously apply only the synchronous polyfills
 * (requestIdleCallback and structuredClone)
 *
 * This is useful for early initialization where async loading isn't possible.
 */
export function applySyncPolyfills(): FeatureName[] {
  const applied: FeatureName[] = [];

  // Apply requestIdleCallback polyfill
  const ricModule = polyfillModules['requestIdleCallback'];
  if (ricModule?.isNeeded()) {
    ricModule.apply();
    applied.push('requestIdleCallback');
  }

  // Apply structuredClone polyfill
  const scModule = polyfillModules['structuredClone'];
  if (scModule?.isNeeded()) {
    scModule.apply();
    applied.push('structuredClone');
  }

  return applied;
}

/**
 * Check if all required features are available (native or polyfilled)
 */
export function areAllFeaturesAvailable(features: FeatureName[] = DEFAULT_FEATURES): boolean {
  return features.every(isSupported);
}

/**
 * Get a report of feature support status
 */
export function getFeatureReport(features: FeatureName[] = DEFAULT_FEATURES): Array<{
  feature: FeatureName;
  supported: boolean;
  hasPolyfill: boolean;
}> {
  const availablePolyfills = getAvailablePolyfills();

  return features.map((feature) => ({
    feature,
    supported: isSupported(feature),
    hasPolyfill: availablePolyfills.includes(feature),
  }));
}
