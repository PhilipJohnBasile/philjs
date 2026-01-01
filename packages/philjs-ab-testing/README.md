# @philjs/ab-testing

Native A/B testing and feature flag framework for PhilJS with built-in statistical analysis.

![Node 24+](https://img.shields.io/badge/Node-24%2B-brightgreen)
![TypeScript 6](https://img.shields.io/badge/TypeScript-6-blue)

## Features

- Experiment configuration and variant assignment
- Statistical analysis (z-test, t-test, confidence intervals)
- Feature flags with rollout percentages
- User segmentation and audience targeting
- Event tracking with automatic batching
- Multi-armed bandit support
- Persistent assignments across sessions

## Installation

```bash
npm install @philjs/ab-testing
```

## Usage

### Basic A/B Test

```typescript
import { ABTestingManager, useExperiment } from '@philjs/ab-testing';

// Initialize the manager
const ab = new ABTestingManager('user-123', {
  trackingEndpoint: '/api/analytics',
  autoTrack: true
});

// Register experiments
ab.registerExperiments([{
  id: 'checkout-redesign',
  name: 'Checkout Page Redesign',
  status: 'running',
  allocation: 50,
  variants: [
    { id: 'control', name: 'Current Design', weight: 50, isControl: true },
    { id: 'variant-a', name: 'New Design', weight: 50 }
  ]
}]);

// Get variant for user
const variant = ab.getVariant('checkout-redesign');
if (variant?.id === 'variant-a') {
  // Show new design
}

// Track conversion
ab.trackConversion('checkout-redesign', 99.99);
```

### Using Hooks

```typescript
import { useABTesting, useExperiment, useFeatureFlag } from '@philjs/ab-testing';

// Initialize once
const { registerExperiments, getVariant } = useABTesting('user-123');

// Use in components
function CheckoutButton() {
  const { variant, isControl, trackConversion } = useExperiment('button-color');

  const handleClick = () => {
    trackConversion();
    // proceed with checkout
  };

  return (
    <button
      style={{ background: variant?.config?.color || 'blue' }}
      onClick={handleClick}
    >
      Checkout
    </button>
  );
}
```

### Feature Flags

```typescript
import { FeatureFlagManager } from '@philjs/ab-testing';

const flags = new FeatureFlagManager('user-123');

flags.registerFlags([{
  id: 'dark-mode',
  name: 'Dark Mode',
  enabled: true,
  rolloutPercentage: 25,
  targetAudience: [
    { attribute: 'plan', operator: 'equals', value: 'premium' }
  ]
}]);

if (flags.isEnabled('dark-mode')) {
  enableDarkMode();
}

// Feature variants
const config = flags.getVariant<{ theme: string }>('dark-mode');
```

### Statistical Analysis

```typescript
import { StatisticalAnalyzer } from '@philjs/ab-testing';

const analyzer = new StatisticalAnalyzer();

// Z-test for conversion rates
const result = analyzer.zTest(
  { conversions: 150, total: 1000 },  // control
  { conversions: 180, total: 1000 }   // variant
);

console.log('Z-score:', result.zScore);
console.log('P-value:', result.pValue);
console.log('Significant:', result.significant);

// Calculate required sample size
const sampleSize = analyzer.calculateSampleSize(
  0.10,   // baseline conversion rate (10%)
  0.15,   // minimum detectable effect (15% lift)
  0.80,   // power
  0.05    // significance level
);
console.log('Required sample size per variant:', sampleSize);
```

### Audience Targeting

```typescript
ab.registerExperiments([{
  id: 'premium-feature',
  name: 'Premium Feature Test',
  status: 'running',
  allocation: 100,
  targetAudience: [
    { attribute: 'plan', operator: 'in', value: ['pro', 'enterprise'] },
    { attribute: 'signupDate', operator: 'lt', value: '2024-01-01' }
  ],
  variants: [
    { id: 'control', name: 'Control', weight: 50, isControl: true },
    { id: 'treatment', name: 'Treatment', weight: 50 }
  ]
}]);

// User context for targeting
ab.setUserContext({
  userId: 'user-123',
  attributes: {
    plan: 'pro',
    signupDate: '2023-06-15'
  }
});
```

## API Reference

### ABTestingManager

| Method | Description |
|--------|-------------|
| `registerExperiments(experiments)` | Register experiment configurations |
| `registerFlags(flags)` | Register feature flags |
| `getVariant(experimentId)` | Get assigned variant for user |
| `isInVariant(experimentId, variantId)` | Check if user is in specific variant |
| `isFeatureEnabled(flagId)` | Check if feature flag is enabled |
| `trackConversion(experimentId, value?)` | Track conversion event |
| `trackEvent(experimentId, eventName, value?)` | Track custom event |
| `analyzeExperiment(id, control, variant)` | Analyze experiment results |
| `calculateRequiredSampleSize(baseline, mde)` | Calculate required sample size |

### Hooks

| Hook | Description |
|------|-------------|
| `useABTesting(userId, config?)` | Initialize A/B testing |
| `useExperiment(experimentId)` | Get experiment variant and tracking |
| `useFeatureFlag(flagId)` | Get feature flag state |

### Types

```typescript
interface Experiment {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  allocation: number;  // 0-100
  variants: Variant[];
  targetAudience?: AudienceRule[];
  primaryMetric?: string;
}

interface Variant {
  id: string;
  name: string;
  weight: number;
  isControl?: boolean;
  config?: Record<string, any>;
}

interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  rolloutPercentage?: number;
  targetAudience?: AudienceRule[];
}
```

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: .
- Source files: packages/philjs-ab-testing/src/index.ts

### Public API
- Direct exports: ABTestingConfig, ABTestingManager, Assignment, AssignmentEngine, AudienceRule, EventTracker, Experiment, ExperimentEvent, ExperimentResults, FeatureFlag, FeatureFlagManager, MetricResults, StatisticalAnalyzer, UserContext, Variant, VariantResults, useABTesting, useExperiment, useFeatureFlag
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT
