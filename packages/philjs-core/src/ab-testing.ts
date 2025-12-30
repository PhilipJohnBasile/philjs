/**
 * Built-in A/B Testing - PhilJS 2026 Innovation
 * Run A/B tests directly in your app with zero external dependencies
 */

import { signal, memo, effect, type Signal } from './signals.js';

// ============================================================================
// Types
// ============================================================================

export interface Experiment {
  id: string;
  name: string;
  variants: Variant[];
  /** Traffic allocation (0-1, default 1 = 100%) */
  traffic?: number;
  /** User segments to target */
  targeting?: TargetingRules;
  /** Start/end dates */
  schedule?: {
    start?: Date;
    end?: Date;
  };
  /** Winner variant (when experiment concludes) */
  winner?: string;
}

export interface Variant {
  id: string;
  name: string;
  /** Weight for traffic distribution (default: equal split) */
  weight?: number;
  /** Configuration for this variant */
  config?: Record<string, any>;
}

export interface TargetingRules {
  /** User segments to include */
  segments?: string[];
  /** Custom targeting function */
  custom?: (user: User) => boolean;
  /** Geographic targeting */
  countries?: string[];
  /** Device targeting */
  devices?: ('mobile' | 'tablet' | 'desktop')[];
}

export interface User {
  id: string;
  segments?: string[];
  country?: string;
  device?: 'mobile' | 'tablet' | 'desktop';
  [key: string]: any;
}

export interface ExperimentAssignment {
  experimentId: string;
  variantId: string;
  timestamp: number;
}

export interface ExperimentEvent {
  experimentId: string;
  variantId: string;
  eventName: string;
  value?: number;
  timestamp: number;
  userId?: string;
}

export interface ExperimentResults {
  experimentId: string;
  variants: VariantResults[];
  winner?: string;
  confidence?: number; // Statistical significance (0-1)
  sampleSize: number;
}

export interface VariantResults {
  variantId: string;
  impressions: number;
  conversions: number;
  conversionRate: number;
  averageValue?: number;
  revenue?: number;
}

export interface ABTestConfig {
  /** Enable/disable A/B testing globally */
  enabled?: boolean;
  /** Storage mechanism for assignments */
  storage?: 'localStorage' | 'sessionStorage' | 'memory' | 'cookie';
  /** Callback when variant is assigned */
  onAssignment?: (assignment: ExperimentAssignment) => void;
  /** Callback when event is tracked */
  onEvent?: (event: ExperimentEvent) => void;
  /** Force specific variants (for QA) */
  forceVariants?: Record<string, string>;
}

// ============================================================================
// Storage
// ============================================================================

interface Storage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get(key: string): string | null {
    return this.data.get(key) || null;
  }

  set(key: string, value: string): void {
    this.data.set(key, value);
  }

  remove(key: string): void {
    this.data.delete(key);
  }
}

class LocalStorageAdapter implements Storage {
  get(key: string): string | null {
    if (typeof localStorage === 'undefined' || !localStorage.getItem) return null;
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  set(key: string, value: string): void {
    if (typeof localStorage === 'undefined' || !localStorage.setItem) return;
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // Ignore
    }
  }

  remove(key: string): void {
    if (typeof localStorage === 'undefined' || !localStorage.removeItem) return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore
    }
  }
}

class SessionStorageAdapter implements Storage {
  get(key: string): string | null {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage.getItem(key);
  }

  set(key: string, value: string): void {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(key, value);
  }

  remove(key: string): void {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.removeItem(key);
  }
}

// ============================================================================
// A/B Testing Engine
// ============================================================================

export class ABTestEngine {
  private experiments = new Map<string, Experiment>();
  private assignments = new Map<string, ExperimentAssignment>();
  private events: ExperimentEvent[] = [];
  private storage: Storage;
  private config: Required<ABTestConfig>;

  constructor(config: ABTestConfig = {}) {
    this.config = {
      enabled: true,
      storage: 'localStorage',
      onAssignment: () => {},
      onEvent: () => {},
      forceVariants: {},
      ...config,
    };

    // Initialize storage
    switch (this.config.storage) {
      case 'localStorage':
        this.storage = new LocalStorageAdapter();
        break;
      case 'sessionStorage':
        this.storage = new SessionStorageAdapter();
        break;
      default:
        this.storage = new MemoryStorage();
    }

    this.loadAssignments();
  }

  /**
   * Register an experiment
   */
  register(experiment: Experiment): void {
    this.experiments.set(experiment.id, experiment);
  }

  /**
   * Get variant for a user
   */
  getVariant(experimentId: string, user: User): Variant | null {
    if (!this.config.enabled) return null;

    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    // Check if experiment is within schedule
    if (!this.isExperimentActive(experiment)) {
      return null;
    }

    // Check if user matches targeting
    if (!this.matchesTargeting(experiment, user)) {
      return null;
    }

    // Check for forced variant (QA override)
    const forcedVariantId = this.config.forceVariants[experimentId];
    if (forcedVariantId) {
      const variant = experiment.variants.find(v => v.id === forcedVariantId);
      if (variant) return variant;
    }

    // Check for existing assignment
    const existingAssignment = this.assignments.get(
      this.getAssignmentKey(experimentId, user.id)
    );

    if (existingAssignment) {
      const variant = experiment.variants.find(v => v.id === existingAssignment.variantId);
      if (variant) return variant;
    }

    // Check traffic allocation
    const traffic = experiment.traffic ?? 1;
    if (Math.random() > traffic) {
      return null; // Not in experiment traffic
    }

    // Assign variant based on weights
    const variant = this.assignVariant(experiment, user);

    // Handle null variant (e.g., empty variants array)
    if (!variant) {
      return null;
    }

    // Store assignment
    const assignment: ExperimentAssignment = {
      experimentId,
      variantId: variant.id,
      timestamp: Date.now(),
    };

    this.assignments.set(this.getAssignmentKey(experimentId, user.id), assignment);
    this.saveAssignments();

    // Trigger callback
    this.config.onAssignment(assignment);

    return variant;
  }

  /**
   * Track an event (conversion, click, etc.)
   */
  track(
    experimentId: string,
    variantId: string,
    eventName: string,
    options: { value?: number; userId?: string } = {}
  ): void {
    const event: ExperimentEvent = {
      experimentId,
      variantId,
      eventName,
      timestamp: Date.now(),
    };
    if (options.value !== undefined) event.value = options.value;
    if (options.userId !== undefined) event.userId = options.userId;

    this.events.push(event);
    this.config.onEvent(event);
  }

  /**
   * Get experiment results
   */
  getResults(experimentId: string): ExperimentResults | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    const variantResults = experiment.variants.map(variant => {
      const impressions = Array.from(this.assignments.values()).filter(
        a => a.experimentId === experimentId && a.variantId === variant.id
      ).length;

      const variantEvents = this.events.filter(
        e => e.experimentId === experimentId && e.variantId === variant.id
      );

      const conversions = variantEvents.filter(e => e.eventName === 'conversion').length;

      const conversionRate = impressions > 0 ? conversions / impressions : 0;

      const totalValue = variantEvents.reduce((sum, e) => sum + (e.value || 0), 0);

      const result: VariantResults = {
        variantId: variant.id,
        impressions,
        conversions,
        conversionRate,
        revenue: totalValue,
      };
      if (conversions > 0) result.averageValue = totalValue / conversions;
      return result;
    });

    // Calculate winner (highest conversion rate with enough sample size)
    const minSampleSize = 100;
    const eligibleVariants = variantResults.filter(v => v.impressions >= minSampleSize);

    let winner: string | undefined;
    let confidence: number | undefined;

    if (eligibleVariants.length >= 2) {
      const sorted = [...eligibleVariants].sort(
        (a, b) => b.conversionRate - a.conversionRate
      );

      winner = sorted[0]!.variantId;

      // Simple confidence calculation (would use proper stats in production)
      const bestRate = sorted[0]!.conversionRate;
      const secondRate = sorted[1]!.conversionRate;
      const difference = bestRate - secondRate;
      confidence = Math.min(0.99, difference * 10); // Simplified
    }

    const totalImpressions = variantResults.reduce((sum, v) => sum + v.impressions, 0);

    const results: ExperimentResults = {
      experimentId,
      variants: variantResults,
      sampleSize: totalImpressions,
    };
    if (winner !== undefined) results.winner = winner;
    if (confidence !== undefined) results.confidence = confidence;
    return results;
  }

  /**
   * Clear all experiment data
   */
  clear(): void {
    this.assignments.clear();
    this.events = [];
    this.storage.remove('philjs_ab_assignments');
  }

  /**
   * Get all active experiments
   */
  getActiveExperiments(): Experiment[] {
    return Array.from(this.experiments.values()).filter(exp =>
      this.isExperimentActive(exp)
    );
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private assignVariant(experiment: Experiment, user: User): Variant | null {
    // Handle empty variants
    if (!experiment.variants || experiment.variants.length === 0) {
      return null;
    }

    // Calculate total weight
    const totalWeight = experiment.variants.reduce(
      (sum, v) => sum + (v.weight ?? 1),
      0
    );

    // Deterministic assignment based on user ID (consistent assignments)
    const hash = this.hashString(`${user.id}:${experiment.id}`);
    const threshold = (hash % 10000) / 10000; // 0-1

    let cumulative = 0;
    for (const variant of experiment.variants) {
      const weight = (variant.weight ?? 1) / totalWeight;
      cumulative += weight;

      if (threshold <= cumulative) {
        return variant;
      }
    }

    return experiment.variants[0]!;
  }

  private matchesTargeting(experiment: Experiment, user: User): boolean {
    if (!experiment.targeting) return true;

    const { segments, custom, countries, devices } = experiment.targeting;

    // Check segments
    if (segments && segments.length > 0) {
      if (!user.segments || !segments.some(s => user.segments!.includes(s))) {
        return false;
      }
    }

    // Check custom targeting
    if (custom && !custom(user)) {
      return false;
    }

    // Check countries
    if (countries && countries.length > 0 && user.country) {
      if (!countries.includes(user.country)) {
        return false;
      }
    }

    // Check devices
    if (devices && devices.length > 0 && user.device) {
      if (!devices.includes(user.device)) {
        return false;
      }
    }

    return true;
  }

  private isExperimentActive(experiment: Experiment): boolean {
    if (experiment.winner) return false; // Concluded

    const now = Date.now();

    if (experiment.schedule?.start) {
      if (now < experiment.schedule.start.getTime()) {
        return false; // Not started
      }
    }

    if (experiment.schedule?.end) {
      if (now > experiment.schedule.end.getTime()) {
        return false; // Ended
      }
    }

    return true;
  }

  private getAssignmentKey(experimentId: string, userId: string): string {
    return `${experimentId}:${userId}`;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private loadAssignments(): void {
    const stored = this.storage.get('philjs_ab_assignments');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.assignments = new Map(Object.entries(data));
      } catch (e) {
        // Ignore parse errors
      }
    }
  }

  private saveAssignments(): void {
    const data = Object.fromEntries(this.assignments.entries());
    this.storage.set('philjs_ab_assignments', JSON.stringify(data));
  }
}

// ============================================================================
// Global Instance
// ============================================================================

let globalEngine: ABTestEngine | null = null;

export function initABTesting(config: ABTestConfig = {}): ABTestEngine {
  globalEngine = new ABTestEngine(config);
  return globalEngine;
}

export function getABTestEngine(): ABTestEngine {
  if (!globalEngine) {
    globalEngine = new ABTestEngine();
  }
  return globalEngine;
}

// ============================================================================
// React-Style Hooks
// ============================================================================

/**
 * Use A/B test variant (reactive)
 */
export function useExperiment(experimentId: string, user: User): Signal<Variant | null> {
  const variant = signal<Variant | null>(null);

  const engine = getABTestEngine();
  variant.set(engine.getVariant(experimentId, user));

  return variant;
}

/**
 * Simple A/B test component helper
 */
export function ABTest(props: {
  experimentId: string;
  user: User;
  variants: Record<string, () => any>;
  fallback?: () => any;
}): any {
  const engine = getABTestEngine();
  const variant = engine.getVariant(props.experimentId, props.user);

  if (!variant) {
    return props.fallback ? props.fallback() : null;
  }

  const renderFn = props.variants[variant.id];
  return renderFn ? renderFn() : null;
}

/**
 * Feature flag (simple A/B test)
 */
export function useFeatureFlag(
  flagName: string,
  user: User,
  defaultValue = false
): Signal<boolean> {
  const enabled = signal(defaultValue);

  const engine = getABTestEngine();

  // Create a simple experiment with two variants: on/off
  if (!engine['experiments'].has(flagName)) {
    engine.register({
      id: flagName,
      name: flagName,
      variants: [
        { id: 'off', name: 'Off' },
        { id: 'on', name: 'On' },
      ],
    });
  }

  const variant = engine.getVariant(flagName, user);
  enabled.set(variant?.id === 'on');

  return enabled;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Create a multivariate test (more than 2 variants)
 */
export function createMultivariateTest(
  id: string,
  name: string,
  variants: string[]
): Experiment {
  return {
    id,
    name,
    variants: variants.map(v => ({ id: v, name: v })),
  };
}

/**
 * Calculate statistical significance (Chi-squared test)
 */
export function calculateSignificance(
  controlConversions: number,
  controlImpressions: number,
  variantConversions: number,
  variantImpressions: number
): number {
  const controlRate = controlConversions / controlImpressions;
  const variantRate = variantConversions / variantImpressions;

  const pooledRate =
    (controlConversions + variantConversions) /
    (controlImpressions + variantImpressions);

  const se = Math.sqrt(
    pooledRate * (1 - pooledRate) * (1 / controlImpressions + 1 / variantImpressions)
  );

  const z = Math.abs(controlRate - variantRate) / se;

  // Convert z-score to confidence (simplified)
  // z > 1.96 = 95% confidence, z > 2.58 = 99% confidence
  if (z > 2.58) return 0.99;
  if (z > 1.96) return 0.95;
  if (z > 1.65) return 0.90;
  return z / 2.58; // Approximate
}
