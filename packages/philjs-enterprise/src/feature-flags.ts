/**
 * Feature Flags for PhilJS Enterprise
 */

export interface FeatureFlag {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  rules?: FeatureRule[];
  variants?: FeatureVariant[];
  rolloutPercentage?: number;
  metadata?: Record<string, unknown>;
}

export interface FeatureRule {
  conditions: RuleCondition[];
  result: boolean | string;
}

export interface RuleCondition {
  attribute: string;
  operator: 'eq' | 'ne' | 'in' | 'notIn' | 'gt' | 'lt' | 'contains' | 'regex';
  value: unknown;
}

export interface FeatureVariant {
  id: string;
  name: string;
  weight: number;
  payload?: unknown;
}

export interface EvaluationContext {
  userId?: string;
  tenantId?: string;
  environment?: string;
  attributes?: Record<string, unknown>;
}

export class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();
  private cache: Map<string, { value: boolean | string; expires: number }> = new Map();
  private cacheTTL: number;

  constructor(flags: FeatureFlag[], cacheTTL: number = 60000) {
    flags.forEach(f => this.flags.set(f.id, f));
    this.cacheTTL = cacheTTL;
  }

  isEnabled(flagId: string, context?: EvaluationContext): boolean {
    const result = this.evaluate(flagId, context);
    return result === true || (typeof result === 'string');
  }

  evaluate(flagId: string, context?: EvaluationContext): boolean | string {
    const cacheKey = `${flagId}:${JSON.stringify(context || {})}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }

    const flag = this.flags.get(flagId);
    if (!flag) return false;
    if (!flag.enabled) return false;

    let result: boolean | string = true;

    // Evaluate rules
    if (flag.rules && flag.rules.length > 0 && context) {
      for (const rule of flag.rules) {
        if (this.evaluateRule(rule, context)) {
          result = rule.result;
          break;
        }
      }
    }

    // Rollout percentage
    if (typeof result === 'boolean' && result && flag.rolloutPercentage !== undefined) {
      const hash = this.hashString(`${flagId}:${context?.userId || 'anonymous'}`);
      result = (hash % 100) < flag.rolloutPercentage;
    }

    // Variant selection
    if (result && flag.variants && flag.variants.length > 0 && context?.userId) {
      const variant = this.selectVariant(flag.variants, context.userId, flagId);
      if (variant) {
        result = variant.id;
      }
    }

    this.cache.set(cacheKey, { value: result, expires: Date.now() + this.cacheTTL });
    return result;
  }

  getVariant(flagId: string, context?: EvaluationContext): FeatureVariant | null {
    const result = this.evaluate(flagId, context);
    if (typeof result !== 'string') return null;

    const flag = this.flags.get(flagId);
    return flag?.variants?.find(v => v.id === result) || null;
  }

  setFlag(flag: FeatureFlag): void {
    this.flags.set(flag.id, flag);
    this.invalidateCache(flag.id);
  }

  getFlag(flagId: string): FeatureFlag | undefined {
    return this.flags.get(flagId);
  }

  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  invalidateCache(flagId?: string): void {
    if (flagId) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${flagId}:`)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  private evaluateRule(rule: FeatureRule, context: EvaluationContext): boolean {
    return rule.conditions.every(c => this.evaluateCondition(c, context));
  }

  private evaluateCondition(condition: RuleCondition, context: EvaluationContext): boolean {
    const value = this.getAttributeValue(condition.attribute, context);

    switch (condition.operator) {
      case 'eq': return value === condition.value;
      case 'ne': return value !== condition.value;
      case 'in': return Array.isArray(condition.value) && condition.value.includes(value);
      case 'notIn': return Array.isArray(condition.value) && !condition.value.includes(value);
      case 'gt': return typeof value === 'number' && value > (condition.value as number);
      case 'lt': return typeof value === 'number' && value < (condition.value as number);
      case 'contains': return String(value).includes(String(condition.value));
      case 'regex': return new RegExp(String(condition.value)).test(String(value));
      default: return false;
    }
  }

  private getAttributeValue(attribute: string, context: EvaluationContext): unknown {
    if (attribute === 'userId') return context.userId;
    if (attribute === 'tenantId') return context.tenantId;
    if (attribute === 'environment') return context.environment;
    return context.attributes?.[attribute];
  }

  private selectVariant(variants: FeatureVariant[], userId: string, flagId: string): FeatureVariant | null {
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    const hash = this.hashString(`${flagId}:${userId}:variant`);
    const bucket = hash % totalWeight;

    let cumulative = 0;
    for (const variant of variants) {
      cumulative += variant.weight;
      if (bucket < cumulative) {
        return variant;
      }
    }
    return null;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

export function createFeatureFlagManager(flags: FeatureFlag[]): FeatureFlagManager {
  return new FeatureFlagManager(flags);
}
