/**
 * Feature Flags for PhilJS Enterprise
 */
export class FeatureFlagManager {
    flags = new Map();
    cache = new Map();
    cacheTTL;
    constructor(flags, cacheTTL = 60000) {
        flags.forEach(f => this.flags.set(f.id, f));
        this.cacheTTL = cacheTTL;
    }
    isEnabled(flagId, context) {
        const result = this.evaluate(flagId, context);
        return result === true || (typeof result === 'string');
    }
    evaluate(flagId, context) {
        const cacheKey = `${flagId}:${JSON.stringify(context || {})}`;
        const cached = this.cache.get(cacheKey);
        if (cached && cached.expires > Date.now()) {
            return cached.value;
        }
        const flag = this.flags.get(flagId);
        if (!flag)
            return false;
        if (!flag.enabled)
            return false;
        let result = true;
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
    getVariant(flagId, context) {
        const result = this.evaluate(flagId, context);
        if (typeof result !== 'string')
            return null;
        const flag = this.flags.get(flagId);
        return flag?.variants?.find(v => v.id === result) || null;
    }
    setFlag(flag) {
        this.flags.set(flag.id, flag);
        this.invalidateCache(flag.id);
    }
    getFlag(flagId) {
        return this.flags.get(flagId);
    }
    getAllFlags() {
        return Array.from(this.flags.values());
    }
    invalidateCache(flagId) {
        if (flagId) {
            for (const key of this.cache.keys()) {
                if (key.startsWith(`${flagId}:`)) {
                    this.cache.delete(key);
                }
            }
        }
        else {
            this.cache.clear();
        }
    }
    evaluateRule(rule, context) {
        return rule.conditions.every(c => this.evaluateCondition(c, context));
    }
    evaluateCondition(condition, context) {
        const value = this.getAttributeValue(condition.attribute, context);
        switch (condition.operator) {
            case 'eq': return value === condition.value;
            case 'ne': return value !== condition.value;
            case 'in': return Array.isArray(condition.value) && condition.value.includes(value);
            case 'notIn': return Array.isArray(condition.value) && !condition.value.includes(value);
            case 'gt': return typeof value === 'number' && value > condition.value;
            case 'lt': return typeof value === 'number' && value < condition.value;
            case 'contains': return String(value).includes(String(condition.value));
            case 'regex': return new RegExp(String(condition.value)).test(String(value));
            default: return false;
        }
    }
    getAttributeValue(attribute, context) {
        if (attribute === 'userId')
            return context.userId;
        if (attribute === 'tenantId')
            return context.tenantId;
        if (attribute === 'environment')
            return context.environment;
        return context.attributes?.[attribute];
    }
    selectVariant(variants, userId, flagId) {
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
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
}
export function createFeatureFlagManager(flags) {
    return new FeatureFlagManager(flags);
}
//# sourceMappingURL=feature-flags.js.map