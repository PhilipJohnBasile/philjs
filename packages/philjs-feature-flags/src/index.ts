/**
 * @philjs/feature-flags - Built-in Feature Flag System
 *
 * A lightweight, edge-ready feature flag system with PhilJS signals integration.
 * Supports local flags, remote providers, and A/B testing.
 *
 * @example
 * ```tsx
 * import { createFeatureFlags, useFlag, Flag, FlagProvider } from '@philjs/feature-flags';
 *
 * // Define flags
 * const flags = createFeatureFlags({
 *   flags: {
 *     newDashboard: { default: false },
 *     darkMode: { default: true },
 *     experimentalChat: { default: false, variants: ['control', 'variant-a', 'variant-b'] },
 *   },
 * });
 *
 * // Use in components
 * function App() {
 *   const showNewDashboard = useFlag('newDashboard');
 *
 *   return showNewDashboard() ? <NewDashboard /> : <OldDashboard />;
 * }
 *
 * // Or use the Flag component
 * function App() {
 *   return (
 *     <Flag name="newDashboard" fallback={<OldDashboard />}>
 *       <NewDashboard />
 *     </Flag>
 *   );
 * }
 * ```
 */

import { signal, effect, type Signal } from '@philjs/core';

// Types

export interface FlagDefinition {
  /** Default value when flag is not set */
  default: boolean | string | number;
  /** Description for documentation */
  description?: string;
  /** Flag variants for A/B testing */
  variants?: string[];
  /** Percentage rollout (0-100) */
  rollout?: number;
  /** User targeting rules */
  targeting?: TargetingRule[];
  /** Expiration date for temporary flags */
  expiresAt?: Date;
  /** Tags for organization */
  tags?: string[];
}

export interface TargetingRule {
  /** Attribute to target */
  attribute: string;
  /** Operator for comparison */
  operator: 'eq' | 'neq' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'gt' | 'lt' | 'gte' | 'lte';
  /** Value to compare against */
  value: any;
  /** Value to return if rule matches */
  returnValue: boolean | string | number;
}

export interface UserContext {
  /** Unique user identifier */
  id?: string;
  /** User email */
  email?: string;
  /** User attributes for targeting */
  attributes?: Record<string, any>;
  /** User groups/segments */
  groups?: string[];
}

export interface FeatureFlagsConfig {
  /** Flag definitions */
  flags: Record<string, FlagDefinition>;
  /** User context provider */
  userContext?: () => UserContext;
  /** Remote flag provider */
  provider?: RemoteProvider;
  /** Polling interval for remote flags (ms) */
  pollingInterval?: number;
  /** Enable analytics tracking */
  analytics?: boolean;
  /** Custom analytics handler */
  onEvaluation?: (flag: string, value: any, context: UserContext) => void;
  /** Enable local storage persistence */
  persist?: boolean;
  /** Storage key prefix */
  storagePrefix?: string;
}

export interface RemoteProvider {
  /** Provider name */
  name: string;
  /** Fetch flags from remote */
  fetch: (context: UserContext) => Promise<Record<string, any>>;
  /** Initialize provider */
  init?: () => Promise<void>;
}

export interface FlagEvaluation {
  /** Flag name */
  flag: string;
  /** Evaluated value */
  value: any;
  /** Reason for the value */
  reason: 'default' | 'targeting' | 'rollout' | 'override' | 'remote';
  /** Matched rule (if targeting) */
  matchedRule?: TargetingRule;
  /** Timestamp */
  timestamp: number;
}

// State

const flagsSignal: Signal<Map<string, any>> = signal(new Map());
const overridesSignal: Signal<Map<string, any>> = signal(new Map());
const evaluationsSignal: Signal<FlagEvaluation[]> = signal([]);
const loadingSignal: Signal<boolean> = signal(false);
const errorSignal: Signal<Error | null> = signal(null);

let config: FeatureFlagsConfig | null = null;
let pollingTimer: ReturnType<typeof setInterval> | null = null;

// Core Functions

/**
 * Creates and initializes the feature flags system
 */
export function createFeatureFlags(cfg: FeatureFlagsConfig) {
  config = {
    pollingInterval: 60000, // 1 minute default
    analytics: true,
    persist: false,
    storagePrefix: 'philjs_flags_',
    ...cfg,
  };

  // Initialize flags with defaults
  const initialFlags = new Map<string, any>();
  for (const [name, definition] of Object.entries(config.flags)) {
    initialFlags.set(name, definition.default);
  }
  flagsSignal.set(initialFlags);

  // Load persisted overrides
  if (config.persist && typeof localStorage !== 'undefined') {
    loadPersistedOverrides();
  }

  // Initialize remote provider
  if (config.provider) {
    initRemoteProvider();
  }

  return {
    getFlag,
    setFlag: setOverride,
    clearOverride,
    clearAllOverrides,
    refresh: fetchRemoteFlags,
    getEvaluations: () => evaluationsSignal(),
    isLoading: () => loadingSignal(),
    error: () => errorSignal(),
  };
}

/**
 * Gets a flag value as a reactive signal
 */
export function useFlag<T = boolean>(name: string): Signal<T> {
  const flagSignal = signal<T>(getFlag(name));

  // Update when flags change
  effect(() => {
    flagSignal.set(getFlag(name));
  });

  return flagSignal;
}

/**
 * Gets a flag value (non-reactive)
 */
export function getFlag<T = boolean>(name: string): T {
  if (!config) {
    console.warn('Feature flags not initialized. Call createFeatureFlags first.');
    return false as T;
  }

  // Check for override first
  if (overridesSignal().has(name)) {
    const value = overridesSignal().get(name);
    trackEvaluation(name, value, 'override');
    return value;
  }

  // Get flag definition
  const definition = config.flags[name];
  if (!definition) {
    console.warn(`Flag "${name}" not found`);
    return false as T;
  }

  // Get user context
  const context = config.userContext?.() || {};

  // Check targeting rules
  if (definition.targeting) {
    for (const rule of definition.targeting) {
      if (evaluateRule(rule, context)) {
        trackEvaluation(name, rule.returnValue, 'targeting', rule);
        return rule.returnValue as T;
      }
    }
  }

  // Check rollout percentage
  if (definition.rollout !== undefined && definition.rollout < 100) {
    const hash = hashUserForFlag(context.id || 'anonymous', name);
    const inRollout = hash < definition.rollout;
    const value = inRollout ? true : definition.default;
    trackEvaluation(name, value, 'rollout');
    return value as T;
  }

  // Check variants (random assignment)
  if (definition.variants && definition.variants.length > 0) {
    const hash = hashUserForFlag(context.id || 'anonymous', name);
    const variantIndex = Math.floor((hash / 100) * definition.variants.length);
    const variant = definition.variants[variantIndex];
    trackEvaluation(name, variant, 'default');
    return variant as T;
  }

  // Return default
  const value = flagsSignal().get(name) ?? definition.default;
  trackEvaluation(name, value, 'default');
  return value as T;
}

/**
 * Sets a local override for a flag
 */
export function setOverride(name: string, value: any): void {
  const overrides = new Map(overridesSignal());
  overrides.set(name, value);
  overridesSignal.set(overrides);

  if (config?.persist && typeof localStorage !== 'undefined') {
    localStorage.setItem(
      `${config.storagePrefix}overrides`,
      JSON.stringify(Object.fromEntries(overrides))
    );
  }
}

/**
 * Clears a local override
 */
export function clearOverride(name: string): void {
  const overrides = new Map(overridesSignal());
  overrides.delete(name);
  overridesSignal.set(overrides);

  if (config?.persist && typeof localStorage !== 'undefined') {
    localStorage.setItem(
      `${config.storagePrefix}overrides`,
      JSON.stringify(Object.fromEntries(overrides))
    );
  }
}

/**
 * Clears all local overrides
 */
export function clearAllOverrides(): void {
  overridesSignal.set(new Map());

  if (config?.persist && typeof localStorage !== 'undefined') {
    localStorage.removeItem(`${config.storagePrefix}overrides`);
  }
}

// Helper Functions

function evaluateRule(rule: TargetingRule, context: UserContext): boolean {
  const value = context.attributes?.[rule.attribute] ?? (context as any)[rule.attribute];

  switch (rule.operator) {
    case 'eq':
      return value === rule.value;
    case 'neq':
      return value !== rule.value;
    case 'contains':
      return String(value).includes(String(rule.value));
    case 'startsWith':
      return String(value).startsWith(String(rule.value));
    case 'endsWith':
      return String(value).endsWith(String(rule.value));
    case 'in':
      return Array.isArray(rule.value) && rule.value.includes(value);
    case 'gt':
      return Number(value) > Number(rule.value);
    case 'lt':
      return Number(value) < Number(rule.value);
    case 'gte':
      return Number(value) >= Number(rule.value);
    case 'lte':
      return Number(value) <= Number(rule.value);
    default:
      return false;
  }
}

function hashUserForFlag(userId: string, flagName: string): number {
  const str = `${userId}:${flagName}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % 100;
}

function trackEvaluation(
  flag: string,
  value: any,
  reason: FlagEvaluation['reason'],
  matchedRule?: TargetingRule
): void {
  if (!config?.analytics) return;

  const evaluation: FlagEvaluation = {
    flag,
    value,
    reason,
    matchedRule,
    timestamp: Date.now(),
  };

  evaluationsSignal.set([...evaluationsSignal(), evaluation]);

  // Call custom analytics handler
  if (config.onEvaluation) {
    const context = config.userContext?.() || {};
    config.onEvaluation(flag, value, context);
  }
}

function loadPersistedOverrides(): void {
  if (!config) return;

  try {
    const stored = localStorage.getItem(`${config.storagePrefix}overrides`);
    if (stored) {
      const overrides = JSON.parse(stored);
      overridesSignal.set(new Map(Object.entries(overrides)));
    }
  } catch (e) {
    console.warn('Failed to load persisted flag overrides');
  }
}

async function initRemoteProvider(): Promise<void> {
  if (!config?.provider) return;

  try {
    loadingSignal.set(true);
    await config.provider.init?.();
    await fetchRemoteFlags();

    // Start polling
    if (config.pollingInterval && config.pollingInterval > 0) {
      pollingTimer = setInterval(fetchRemoteFlags, config.pollingInterval);
    }
  } catch (error) {
    errorSignal.set(error as Error);
  } finally {
    loadingSignal.set(false);
  }
}

async function fetchRemoteFlags(): Promise<void> {
  if (!config?.provider) return;

  try {
    loadingSignal.set(true);
    const context = config.userContext?.() || {};
    const remoteFlags = await config.provider.fetch(context);

    const flags = new Map(flagsSignal());
    for (const [name, value] of Object.entries(remoteFlags)) {
      flags.set(name, value);
    }
    flagsSignal.set(flags);
  } catch (error) {
    errorSignal.set(error as Error);
  } finally {
    loadingSignal.set(false);
  }
}

// Components

/**
 * Flag component for conditional rendering
 */
export function Flag(props: {
  name: string;
  children: any;
  fallback?: any;
  variant?: string;
}) {
  const value = getFlag(props.name);

  if (props.variant) {
    return value === props.variant ? props.children : props.fallback || null;
  }

  return value ? props.children : props.fallback || null;
}

/**
 * Provider component for context
 */
export function FlagProvider(props: {
  config: FeatureFlagsConfig;
  children: any;
}) {
  createFeatureFlags(props.config);
  return props.children;
}

// Remote Provider Factories

/**
 * Creates a simple HTTP provider
 */
export function createHttpProvider(options: {
  url: string;
  headers?: Record<string, string>;
  transform?: (data: any) => Record<string, any>;
}): RemoteProvider {
  return {
    name: 'http',
    async fetch(context) {
      const response = await fetch(options.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify(context),
      });

      const data = await response.json();
      return options.transform ? options.transform(data) : data;
    },
  };
}

/**
 * Creates a LaunchDarkly-compatible provider
 */
export function createLaunchDarklyProvider(options: {
  clientSideId: string;
  baseUrl?: string;
}): RemoteProvider {
  return {
    name: 'launchdarkly',
    async init() {
      // LaunchDarkly SDK initialization
    },
    async fetch(context) {
      const url = `${options.baseUrl || 'https://sdk.launchdarkly.com'}/sdk/evalx/${options.clientSideId}/context`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      });

      const data = await response.json();
      const flags: Record<string, any> = {};
      for (const [key, flag] of Object.entries(data as Record<string, any>)) {
        flags[key] = flag.value;
      }
      return flags;
    },
  };
}

/**
 * Creates a PostHog-compatible provider
 */
export function createPostHogProvider(options: {
  apiKey: string;
  host?: string;
}): RemoteProvider {
  return {
    name: 'posthog',
    async fetch(context) {
      const url = `${options.host || 'https://app.posthog.com'}/decide/?v=3`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: options.apiKey,
          distinct_id: context.id || 'anonymous',
          groups: context.groups,
          person_properties: context.attributes,
        }),
      });

      const data = await response.json();
      return data.featureFlags || {};
    },
  };
}

/**
 * Creates an Unleash-compatible provider
 */
export function createUnleashProvider(options: {
  url: string;
  clientKey: string;
  appName: string;
}): RemoteProvider {
  return {
    name: 'unleash',
    async fetch(context) {
      const response = await fetch(`${options.url}/api/frontend`, {
        headers: {
          Authorization: options.clientKey,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      const flags: Record<string, any> = {};
      for (const toggle of data.toggles || []) {
        flags[toggle.name] = toggle.enabled;
      }
      return flags;
    },
  };
}

// DevTools integration

/**
 * Get all flag states for DevTools
 */
export function getDevToolsState() {
  return {
    flags: Object.fromEntries(flagsSignal()),
    overrides: Object.fromEntries(overridesSignal()),
    definitions: config?.flags || {},
    evaluations: evaluationsSignal(),
  };
}

/**
 * Cleanup function
 */
export function cleanup(): void {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
  flagsSignal.set(new Map());
  overridesSignal.set(new Map());
  evaluationsSignal.set([]);
  config = null;
}
