/**
 * @philjs/experiments - A/B Testing Primitives
 *
 * Built-in experimentation framework with feature flags, variant assignment,
 * and analytics integration.
 *
 * @example
 * ```tsx
 * import { createExperiment, useExperiment, Experiment, Variant } from '@philjs/experiments';
 *
 * // Define experiments
 * const checkoutExperiment = createExperiment({
 *   id: 'checkout-flow',
 *   variants: ['control', 'one-page', 'express'],
 *   weights: [50, 25, 25], // Traffic allocation
 * });
 *
 * // Use in components
 * function CheckoutPage() {
 *   const variant = useExperiment('checkout-flow');
 *
 *   return (
 *     <Experiment id="checkout-flow">
 *       <Variant name="control"><ClassicCheckout /></Variant>
 *       <Variant name="one-page"><OnePageCheckout /></Variant>
 *       <Variant name="express"><ExpressCheckout /></Variant>
 *     </Experiment>
 *   );
 * }
 * ```
 */

import { signal, effect, type Signal } from '@philjs/core';

// Types

export interface ExperimentConfig {
  /** Unique experiment ID */
  id: string;
  /** Variant names */
  variants: string[];
  /** Traffic allocation weights (percentages, must sum to 100) */
  weights?: number[];
  /** Whether experiment is active */
  active?: boolean;
  /** Start date */
  startDate?: Date;
  /** End date */
  endDate?: Date;
  /** Targeting rules */
  targeting?: TargetingRule[];
  /** Sticky assignment (remember variant per user) */
  sticky?: boolean;
  /** Metrics to track */
  metrics?: MetricConfig[];
  /** Description */
  description?: string;
}

export interface TargetingRule {
  /** Attribute to target */
  attribute: string;
  /** Operator */
  operator: 'eq' | 'neq' | 'in' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'regex';
  /** Value to compare */
  value: any;
}

export interface MetricConfig {
  /** Metric name */
  name: string;
  /** Metric type */
  type: 'conversion' | 'revenue' | 'count' | 'duration';
  /** Event name to track */
  event: string;
  /** Value extractor for revenue/count metrics */
  valueExtractor?: (event: any) => number;
}

export interface UserContext {
  /** User ID */
  id?: string;
  /** User attributes */
  attributes?: Record<string, any>;
  /** Session ID */
  sessionId?: string;
  /** Device type */
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  /** Country */
  country?: string;
  /** Browser */
  browser?: string;
}

export interface ExperimentAssignment {
  /** Experiment ID */
  experimentId: string;
  /** Assigned variant */
  variant: string;
  /** Assignment timestamp */
  timestamp: number;
  /** User context at assignment */
  context: UserContext;
}

export interface ExperimentResult {
  /** Experiment ID */
  experimentId: string;
  /** Variant results */
  variants: VariantResult[];
  /** Statistical significance */
  significance: number;
  /** Winner (if any) */
  winner?: string;
  /** Sample size */
  sampleSize: number;
}

export interface VariantResult {
  /** Variant name */
  name: string;
  /** Sample size */
  sampleSize: number;
  /** Conversion rate */
  conversionRate: number;
  /** Confidence interval */
  confidenceInterval: [number, number];
  /** Metrics */
  metrics: Record<string, MetricResult>;
}

export interface MetricResult {
  /** Metric value */
  value: number;
  /** Standard deviation */
  stdDev: number;
  /** Uplift vs control */
  uplift: number;
  /** P-value */
  pValue: number;
}

export interface AnalyticsAdapter {
  /** Track experiment exposure */
  trackExposure: (assignment: ExperimentAssignment) => void;
  /** Track conversion */
  trackConversion: (experimentId: string, variant: string, metricName: string, value?: number) => void;
  /** Get results */
  getResults?: (experimentId: string) => Promise<ExperimentResult>;
}

export interface ExperimentSystemConfig {
  /** User context provider */
  getUserContext: () => UserContext;
  /** Analytics adapter */
  analytics?: AnalyticsAdapter;
  /** Storage adapter for sticky assignments */
  storage?: {
    get: (key: string) => string | null;
    set: (key: string, value: string) => void;
  };
  /** Enable debug mode */
  debug?: boolean;
}

// State

const experimentsSignal: Signal<Map<string, ExperimentConfig>> = signal(new Map());
const assignmentsSignal: Signal<Map<string, ExperimentAssignment>> = signal(new Map());
const exposuresSignal: Signal<Set<string>> = signal(new Set());

let systemConfig: ExperimentSystemConfig | null = null;

// Core Functions

/**
 * Initializes the experiment system
 */
export function initExperiments(config: ExperimentSystemConfig): void {
  systemConfig = {
    storage: typeof localStorage !== 'undefined'
      ? {
          get: (key) => localStorage.getItem(key),
          set: (key, value) => localStorage.setItem(key, value),
        }
      : undefined,
    ...config,
  };

  // Load saved assignments
  loadSavedAssignments();
}

/**
 * Creates an experiment configuration
 */
export function createExperiment(config: ExperimentConfig): ExperimentConfig {
  const experiment: ExperimentConfig = {
    active: true,
    sticky: true,
    ...config,
    weights: config.weights || equalWeights(config.variants.length),
  };

  // Validate weights sum to 100
  const totalWeight = experiment.weights!.reduce((a, b) => a + b, 0);
  if (Math.abs(totalWeight - 100) > 0.01) {
    console.warn(`Experiment "${config.id}" weights sum to ${totalWeight}, not 100`);
  }

  // Register experiment
  const experiments = new Map(experimentsSignal());
  experiments.set(config.id, experiment);
  experimentsSignal.set(experiments);

  return experiment;
}

/**
 * Gets the assigned variant for an experiment
 */
export function getVariant(experimentId: string): string | null {
  const experiment = experimentsSignal().get(experimentId);
  if (!experiment) {
    console.warn(`Experiment "${experimentId}" not found`);
    return null;
  }

  // Check if experiment is active
  if (!isExperimentActive(experiment)) {
    return experiment.variants[0]; // Return control
  }

  // Check for existing assignment
  const existingAssignment = assignmentsSignal().get(experimentId);
  if (existingAssignment && experiment.sticky) {
    return existingAssignment.variant;
  }

  // Get user context
  const context = systemConfig?.getUserContext() || {};

  // Check targeting rules
  if (experiment.targeting && !matchesTargeting(experiment.targeting, context)) {
    return null; // User not in experiment
  }

  // Assign variant
  const variant = assignVariant(experiment, context);

  // Track assignment
  const assignment: ExperimentAssignment = {
    experimentId,
    variant,
    timestamp: Date.now(),
    context,
  };

  // Save assignment
  const assignments = new Map(assignmentsSignal());
  assignments.set(experimentId, assignment);
  assignmentsSignal.set(assignments);

  // Persist if sticky
  if (experiment.sticky) {
    saveAssignment(experimentId, assignment);
  }

  return variant;
}

/**
 * Hook for accessing experiment variant
 */
export function useExperiment(experimentId: string): Signal<string | null> {
  const variantSignal: Signal<string | null> = signal(null);

  // Get initial variant
  const variant = getVariant(experimentId);
  variantSignal.set(variant);

  // Track exposure on first access
  if (variant && !exposuresSignal().has(experimentId)) {
    trackExposure(experimentId, variant);
  }

  return variantSignal;
}

/**
 * Tracks that user was exposed to an experiment
 */
export function trackExposure(experimentId: string, variant: string): void {
  const exposures = new Set(exposuresSignal());
  if (exposures.has(experimentId)) return;

  exposures.add(experimentId);
  exposuresSignal.set(exposures);

  const assignment = assignmentsSignal().get(experimentId);
  if (assignment && systemConfig?.analytics) {
    systemConfig.analytics.trackExposure(assignment);
  }

  if (systemConfig?.debug) {
    console.log(`[Experiments] Exposed to ${experimentId}: ${variant}`);
  }
}

/**
 * Tracks a conversion event
 */
export function trackConversion(
  experimentId: string,
  metricName: string,
  value?: number
): void {
  const assignment = assignmentsSignal().get(experimentId);
  if (!assignment) {
    console.warn(`No assignment found for experiment "${experimentId}"`);
    return;
  }

  if (systemConfig?.analytics) {
    systemConfig.analytics.trackConversion(experimentId, assignment.variant, metricName, value);
  }

  if (systemConfig?.debug) {
    console.log(`[Experiments] Conversion for ${experimentId}/${assignment.variant}: ${metricName}${value !== undefined ? ` = ${value}` : ''}`);
  }
}

/**
 * Gets experiment results
 */
export async function getResults(experimentId: string): Promise<ExperimentResult | null> {
  if (!systemConfig?.analytics?.getResults) {
    console.warn('Analytics adapter does not support getResults');
    return null;
  }

  return systemConfig.analytics.getResults(experimentId);
}

/**
 * Force assigns a variant (for testing/preview)
 */
export function forceVariant(experimentId: string, variant: string): void {
  const experiment = experimentsSignal().get(experimentId);
  if (!experiment) {
    console.warn(`Experiment "${experimentId}" not found`);
    return;
  }

  if (!experiment.variants.includes(variant)) {
    console.warn(`Variant "${variant}" not found in experiment "${experimentId}"`);
    return;
  }

  const assignment: ExperimentAssignment = {
    experimentId,
    variant,
    timestamp: Date.now(),
    context: systemConfig?.getUserContext() || {},
  };

  const assignments = new Map(assignmentsSignal());
  assignments.set(experimentId, assignment);
  assignmentsSignal.set(assignments);

  if (experiment.sticky) {
    saveAssignment(experimentId, assignment);
  }
}

/**
 * Clears all experiment assignments
 */
export function clearAssignments(): void {
  assignmentsSignal.set(new Map());
  exposuresSignal.set(new Set());

  if (systemConfig?.storage) {
    systemConfig.storage.set('philjs_experiments', '{}');
  }
}

// Components

/**
 * Experiment component for conditional rendering
 */
export function Experiment(props: {
  id: string;
  children: any[];
  fallback?: any;
}) {
  const variant = getVariant(props.id);

  if (!variant) {
    return props.fallback || null;
  }

  // Find matching Variant child
  for (const child of props.children) {
    if (child?.props?.name === variant) {
      // Track exposure
      if (!exposuresSignal().has(props.id)) {
        trackExposure(props.id, variant);
      }
      return child.props.children;
    }
  }

  return props.fallback || null;
}

/**
 * Variant component for experiment children
 */
export function Variant(props: {
  name: string;
  children: any;
}) {
  return props.children;
}

// Helper Functions

function equalWeights(count: number): number[] {
  const weight = 100 / count;
  return Array(count).fill(weight);
}

function isExperimentActive(experiment: ExperimentConfig): boolean {
  if (!experiment.active) return false;

  const now = new Date();
  if (experiment.startDate && now < experiment.startDate) return false;
  if (experiment.endDate && now > experiment.endDate) return false;

  return true;
}

function matchesTargeting(rules: TargetingRule[], context: UserContext): boolean {
  for (const rule of rules) {
    const value = context.attributes?.[rule.attribute] ?? (context as any)[rule.attribute];

    switch (rule.operator) {
      case 'eq':
        if (value !== rule.value) return false;
        break;
      case 'neq':
        if (value === rule.value) return false;
        break;
      case 'in':
        if (!Array.isArray(rule.value) || !rule.value.includes(value)) return false;
        break;
      case 'contains':
        if (!String(value).includes(String(rule.value))) return false;
        break;
      case 'gt':
        if (!(Number(value) > Number(rule.value))) return false;
        break;
      case 'lt':
        if (!(Number(value) < Number(rule.value))) return false;
        break;
      case 'gte':
        if (!(Number(value) >= Number(rule.value))) return false;
        break;
      case 'lte':
        if (!(Number(value) <= Number(rule.value))) return false;
        break;
      case 'regex':
        if (!new RegExp(rule.value).test(String(value))) return false;
        break;
    }
  }

  return true;
}

function assignVariant(experiment: ExperimentConfig, context: UserContext): string {
  // Use deterministic assignment based on user ID
  const seed = `${experiment.id}:${context.id || context.sessionId || Math.random()}`;
  const hash = hashString(seed);
  const bucket = Math.abs(hash) % 100;

  let cumulative = 0;
  for (let i = 0; i < experiment.variants.length; i++) {
    cumulative += experiment.weights![i];
    if (bucket < cumulative) {
      return experiment.variants[i];
    }
  }

  return experiment.variants[0]; // Fallback to control
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

function loadSavedAssignments(): void {
  if (!systemConfig?.storage) return;

  try {
    const saved = systemConfig.storage.get('philjs_experiments');
    if (saved) {
      const assignments = JSON.parse(saved);
      const map = new Map<string, ExperimentAssignment>();
      for (const [key, value] of Object.entries(assignments)) {
        map.set(key, value as ExperimentAssignment);
      }
      assignmentsSignal.set(map);
    }
  } catch {
    // Ignore parse errors
  }
}

function saveAssignment(experimentId: string, assignment: ExperimentAssignment): void {
  if (!systemConfig?.storage) return;

  try {
    const saved = systemConfig.storage.get('philjs_experiments');
    const assignments = saved ? JSON.parse(saved) : {};
    assignments[experimentId] = assignment;
    systemConfig.storage.set('philjs_experiments', JSON.stringify(assignments));
  } catch {
    // Ignore save errors
  }
}

// Analytics Adapters

/**
 * Creates a Google Analytics 4 adapter
 */
export function createGA4Adapter(measurementId: string): AnalyticsAdapter {
  return {
    trackExposure(assignment) {
      if (typeof gtag === 'function') {
        gtag('event', 'experiment_exposure', {
          experiment_id: assignment.experimentId,
          variant: assignment.variant,
        });
      }
    },
    trackConversion(experimentId, variant, metricName, value) {
      if (typeof gtag === 'function') {
        gtag('event', metricName, {
          experiment_id: experimentId,
          variant,
          value,
        });
      }
    },
  };
}

/**
 * Creates a PostHog adapter
 */
export function createPostHogAdapter(apiKey: string): AnalyticsAdapter {
  return {
    trackExposure(assignment) {
      if (typeof posthog !== 'undefined') {
        posthog.capture('$experiment_started', {
          $feature_flag: assignment.experimentId,
          $feature_flag_response: assignment.variant,
        });
      }
    },
    trackConversion(experimentId, variant, metricName, value) {
      if (typeof posthog !== 'undefined') {
        posthog.capture(metricName, {
          experiment_id: experimentId,
          variant,
          value,
        });
      }
    },
  };
}

/**
 * Creates a console adapter for debugging
 */
export function createConsoleAdapter(): AnalyticsAdapter {
  return {
    trackExposure(assignment) {
    },
    trackConversion(experimentId, variant, metricName, value) {
      console.log('[Experiment Conversion]', { experimentId, variant, metricName, value });
    },
  };
}

// Declare global types
declare const gtag: (...args: any[]) => void;
declare const posthog: { capture: (event: string, properties?: any) => void };

// Export types
export type {
  ExperimentConfig,
  TargetingRule,
  MetricConfig,
  UserContext,
  ExperimentAssignment,
  ExperimentResult,
  VariantResult,
  MetricResult,
  AnalyticsAdapter,
  ExperimentSystemConfig,
};
