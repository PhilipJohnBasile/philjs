# @philjs/ab-testing

Native A/B testing and feature flags framework with experiment configuration, variant assignment, statistical analysis, and event tracking.

## Installation

```bash
npm install @philjs/ab-testing
```

## Features

- **Experiment Configuration** - Define experiments with multiple variants
- **Variant Assignment** - Deterministic hash-based assignment
- **User Targeting** - Audience rules and segmentation
- **Feature Flags** - Toggle features with rollout percentages
- **Event Tracking** - Track conversions and custom events
- **Statistical Analysis** - Z-test, t-test, confidence intervals
- **Persistence** - LocalStorage-based assignment persistence

## Quick Start

```typescript
import { ABTestingManager, useABTesting, useExperiment } from '@philjs/ab-testing';

// Initialize
const abManager = new ABTestingManager('user-123', {
  trackingEndpoint: '/api/analytics',
  autoTrack: true,
});

// Register experiments
abManager.registerExperiments([
  {
    id: 'checkout-redesign',
    name: 'Checkout Redesign Test',
    status: 'running',
    allocation: 50, // 50% of users
    variants: [
      { id: 'control', name: 'Original', weight: 50, isControl: true },
      { id: 'variant-a', name: 'New Design', weight: 50, config: { layout: 'modern' } },
    ],
  },
]);

// Get assigned variant
const variant = abManager.getVariant('checkout-redesign');
if (variant?.id === 'variant-a') {
  showNewCheckout();
}

// Track conversion
abManager.trackConversion('checkout-redesign', 99.99);
```

## ABTestingManager

### Configuration

```typescript
import { ABTestingManager } from '@philjs/ab-testing';

const manager = new ABTestingManager(
  'user-123',          // User ID
  {
    storageKey: 'philjs_ab',           // LocalStorage key
    trackingEndpoint: '/api/events',   // Event tracking endpoint
    autoTrack: true,                   // Auto-track exposure events
    debug: false,                      // Debug logging
  },
  {
    userId: 'user-123',
    attributes: {                      // User attributes for targeting
      plan: 'premium',
      country: 'US',
    },
    traits: {
      signupDate: '2024-01-01',
    },
  }
);
```

### Registering Experiments

```typescript
manager.registerExperiments([
  {
    id: 'pricing-test',
    name: 'New Pricing Page',
    description: 'Testing new pricing layout',
    status: 'running',
    allocation: 100,                   // % of users in experiment
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-03-01'),
    primaryMetric: 'conversion_rate',
    secondaryMetrics: ['revenue', 'time_on_page'],
    targetAudience: [                  // Optional targeting rules
      { attribute: 'plan', operator: 'equals', value: 'free' },
      { attribute: 'country', operator: 'in', value: ['US', 'CA', 'UK'] },
    ],
    variants: [
      {
        id: 'control',
        name: 'Current Pricing',
        weight: 50,
        isControl: true,
      },
      {
        id: 'variant-a',
        name: 'Simplified Pricing',
        weight: 25,
        config: { layout: 'simple', showAnnual: true },
      },
      {
        id: 'variant-b',
        name: 'Feature Comparison',
        weight: 25,
        config: { layout: 'comparison', highlightPopular: true },
      },
    ],
  },
]);
```

### Getting Variant Assignment

```typescript
// Get assigned variant
const variant = manager.getVariant('pricing-test');

if (variant) {
  console.log('Assigned to:', variant.name);
  console.log('Config:', variant.config);
  console.log('Is control:', variant.isControl);
}

// Check specific variant
if (manager.isInVariant('pricing-test', 'variant-a')) {
  showSimplifiedPricing();
}
```

### Tracking Events

```typescript
// Track conversion
manager.trackConversion('pricing-test', 49.99, {
  plan: 'pro',
  billingCycle: 'annual',
});

// Track custom event
manager.trackEvent('pricing-test', 'clicked_cta', 1, {
  ctaText: 'Start Free Trial',
  position: 'hero',
});

// Flush events to server
await manager.flush();
```

### Analyzing Results

```typescript
const analysis = manager.analyzeExperiment(
  'pricing-test',
  { conversions: 150, total: 1000 },    // Control data
  { conversions: 180, total: 1000 }     // Variant data
);

console.log({
  lift: analysis.lift,                   // % improvement
  pValue: analysis.pValue,               // Statistical significance
  significant: analysis.significant,     // p < 0.05
});
```

### Sample Size Calculator

```typescript
const sampleSize = manager.calculateRequiredSampleSize(
  0.05,    // Baseline conversion rate (5%)
  0.10,    // Minimum detectable effect (10% relative lift)
  0.80,    // Power (80%)
  0.05     // Significance level (5%)
);

console.log(`Need ${sampleSize} users per variant`);
```

## Feature Flags

### Registering Flags

```typescript
manager.registerFlags([
  {
    id: 'dark-mode',
    name: 'Dark Mode',
    description: 'Enable dark mode UI',
    enabled: true,
    rolloutPercentage: 50,     // 50% of users
  },
  {
    id: 'new-dashboard',
    name: 'New Dashboard',
    enabled: true,
    rolloutPercentage: 100,
    targetAudience: [
      { attribute: 'plan', operator: 'in', value: ['pro', 'enterprise'] },
    ],
    variants: {
      layout: 'grid',
      showAnalytics: true,
    },
  },
  {
    id: 'beta-features',
    name: 'Beta Features',
    enabled: false,            // Disabled for everyone
  },
]);
```

### Checking Flags

```typescript
// Check if feature is enabled
if (manager.isFeatureEnabled('dark-mode')) {
  enableDarkMode();
}

// Get feature variant config
const dashboardConfig = manager.getFeatureVariant<{
  layout: string;
  showAnalytics: boolean;
}>('new-dashboard');

if (dashboardConfig) {
  renderDashboard(dashboardConfig.layout, dashboardConfig.showAnalytics);
}
```

## FeatureFlagManager

### Standalone Usage

```typescript
import { FeatureFlagManager } from '@philjs/ab-testing';

const flagManager = new FeatureFlagManager('user-123', {
  userId: 'user-123',
  attributes: { plan: 'premium' },
});

flagManager.registerFlags([
  { id: 'feature-x', name: 'Feature X', enabled: true, rolloutPercentage: 25 },
]);

// Check flag
const isEnabled = flagManager.isEnabled('feature-x');

// Get all flags
const allFlags = flagManager.getAllFlags();
```

### Overrides (for testing)

```typescript
// Override flag locally
flagManager.override('feature-x', true);

// Clear override
flagManager.clearOverride('feature-x');

// Clear all overrides
flagManager.clearAllOverrides();
```

## AssignmentEngine

### Standalone Assignment

```typescript
import { AssignmentEngine } from '@philjs/ab-testing';

const engine = new AssignmentEngine('my_assignments');

const experiment = {
  id: 'test-1',
  name: 'Test',
  status: 'running' as const,
  allocation: 100,
  variants: [
    { id: 'a', name: 'A', weight: 50 },
    { id: 'b', name: 'B', weight: 50 },
  ],
};

// Assign user
const variant = engine.assign(experiment, 'user-456');

// Get existing assignment
const existing = engine.getAssignment('test-1');

// Clear assignment (for re-bucketing)
engine.clearAssignment('test-1');

// Clear all assignments
engine.clearAll();
```

## EventTracker

### Tracking Events

```typescript
import { EventTracker } from '@philjs/ab-testing';

const tracker = new EventTracker('/api/analytics/events');

// Track exposure
tracker.track({
  experimentId: 'pricing-test',
  variantId: 'variant-a',
  eventName: 'exposure',
  userId: 'user-123',
});

// Track conversion
tracker.trackConversion(
  'pricing-test',
  'variant-a',
  'user-123',
  99.99,
  { plan: 'pro' }
);

// Track custom event
tracker.trackEvent(
  'pricing-test',
  'variant-a',
  'add_to_cart',
  'user-123',
  1,
  { productId: 'prod-123' }
);

// Get queued events
const events = tracker.getEvents();

// Manual flush
await tracker.flush();

// Stop tracker (flushes remaining events)
tracker.stop();
```

## StatisticalAnalyzer

### Z-Test (Conversion Rates)

```typescript
import { StatisticalAnalyzer } from '@philjs/ab-testing';

const analyzer = new StatisticalAnalyzer();

// Compare conversion rates
const result = analyzer.zTest(
  { conversions: 50, total: 1000 },   // Control: 5%
  { conversions: 65, total: 1000 }    // Variant: 6.5%
);

console.log({
  zScore: result.zScore,
  pValue: result.pValue,
  significant: result.significant,     // true if p < 0.05
});
```

### T-Test (Continuous Metrics)

```typescript
// Compare average values
const tResult = analyzer.tTest(
  { values: [10, 12, 11, 9, 13, 11, 10, 12] },   // Control
  { values: [14, 15, 13, 16, 14, 15, 17, 14] }   // Variant
);

console.log({
  tScore: tResult.tScore,
  pValue: tResult.pValue,
  significant: tResult.significant,
});
```

### Lift and Confidence Interval

```typescript
// Calculate lift
const lift = analyzer.calculateLift(0.05, 0.065);
console.log(`Lift: ${lift}%`);  // 30%

// Confidence interval
const ci = analyzer.confidenceInterval(
  0.065,    // Proportion
  1000,     // Sample size
  0.95      // Confidence level
);
console.log(`95% CI: [${ci.lower}, ${ci.upper}]`);
```

### Sample Size Calculator

```typescript
const requiredSampleSize = analyzer.calculateSampleSize(
  0.05,    // Baseline rate (5%)
  0.20,    // MDE (20% relative lift)
  0.80,    // Power (80%)
  0.05     // Significance (5%)
);
// ~3,900 per variant
```

## React-style Hooks

### useABTesting

```typescript
import { useABTesting } from '@philjs/ab-testing';

function App() {
  const {
    getVariant,
    isInVariant,
    trackConversion,
    trackEvent,
    registerExperiments,
  } = useABTesting('user-123', {
    trackingEndpoint: '/api/events',
  });

  // Register experiments once
  useEffect(() => {
    registerExperiments([/* experiments */]);
  }, []);

  return /* ... */;
}
```

### useExperiment

```typescript
import { useExperiment } from '@philjs/ab-testing';

function PricingPage() {
  const {
    variant,
    isControl,
    config,
    trackConversion,
  } = useExperiment('pricing-test');

  const handlePurchase = (amount: number) => {
    trackConversion(amount);
  };

  if (isControl) {
    return <OriginalPricing onPurchase={handlePurchase} />;
  }

  return (
    <NewPricing
      layout={config.layout}
      onPurchase={handlePurchase}
    />
  );
}
```

### useFeatureFlag

```typescript
import { useFeatureFlag } from '@philjs/ab-testing';

function Dashboard() {
  const { enabled, variant } = useFeatureFlag('new-dashboard');

  if (!enabled) {
    return <OldDashboard />;
  }

  return <NewDashboard config={variant} />;
}
```

## Audience Rules

### Operators

```typescript
type AudienceRule = {
  attribute: string;
  operator:
    | 'equals'        // value === rule.value
    | 'not_equals'    // value !== rule.value
    | 'contains'      // String(value).includes(rule.value)
    | 'not_contains'  // !String(value).includes(rule.value)
    | 'gt'            // value > rule.value
    | 'lt'            // value < rule.value
    | 'gte'           // value >= rule.value
    | 'lte'           // value <= rule.value
    | 'in'            // rule.value.includes(value)
    | 'not_in';       // !rule.value.includes(value)
  value: any;
};
```

### Example Rules

```typescript
const targetAudience: AudienceRule[] = [
  // Premium users only
  { attribute: 'plan', operator: 'in', value: ['pro', 'enterprise'] },

  // Specific countries
  { attribute: 'country', operator: 'in', value: ['US', 'CA', 'UK'] },

  // Recent signups
  { attribute: 'daysSinceSignup', operator: 'lte', value: 30 },

  // Not internal users
  { attribute: 'email', operator: 'not_contains', value: '@company.com' },
];
```

## Types Reference

```typescript
// Experiment definition
interface Experiment {
  id: string;
  name: string;
  description?: string;
  variants: Variant[];
  allocation: number;          // 0-100
  startDate?: Date;
  endDate?: Date;
  status: 'draft' | 'running' | 'paused' | 'completed';
  targetAudience?: AudienceRule[];
  primaryMetric?: string;
  secondaryMetrics?: string[];
}

// Variant definition
interface Variant {
  id: string;
  name: string;
  weight: number;              // % weight for assignment
  isControl?: boolean;
  config?: Record<string, any>;
}

// Feature flag
interface FeatureFlag {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  rolloutPercentage?: number;
  targetAudience?: AudienceRule[];
  variants?: Record<string, any>;
}

// Assignment record
interface Assignment {
  experimentId: string;
  variantId: string;
  timestamp: number;
  userId: string;
}

// Experiment event
interface ExperimentEvent {
  experimentId: string;
  variantId: string;
  eventName: string;
  value?: number;
  timestamp: number;
  userId: string;
  metadata?: Record<string, any>;
}

// User context
interface UserContext {
  userId: string;
  attributes?: Record<string, any>;
  traits?: Record<string, any>;
}
```

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `ABTestingManager` | Main A/B testing manager |
| `AssignmentEngine` | Variant assignment logic |
| `FeatureFlagManager` | Feature flag management |
| `EventTracker` | Event tracking and batching |
| `StatisticalAnalyzer` | Statistical analysis tools |

### Hooks

| Hook | Description |
|------|-------------|
| `useABTesting(userId, config?, context?)` | A/B testing controls |
| `useExperiment(experimentId)` | Experiment variant access |
| `useFeatureFlag(flagId)` | Feature flag state |

## Example: Complete A/B Testing Setup

```typescript
import {
  ABTestingManager,
  useExperiment,
  useFeatureFlag,
} from '@philjs/ab-testing';

// Initialize globally
const abManager = new ABTestingManager(
  getUserId(),
  {
    trackingEndpoint: '/api/analytics',
    autoTrack: true,
  },
  {
    userId: getUserId(),
    attributes: {
      plan: getCurrentPlan(),
      country: getCountry(),
    },
  }
);

// Register all experiments and flags
abManager.registerExperiments([
  {
    id: 'onboarding-flow',
    name: 'New Onboarding',
    status: 'running',
    allocation: 100,
    variants: [
      { id: 'control', name: 'Original', weight: 50, isControl: true },
      { id: 'simplified', name: 'Simplified', weight: 50, config: { steps: 3 } },
    ],
  },
]);

abManager.registerFlags([
  { id: 'dark-mode', name: 'Dark Mode', enabled: true, rolloutPercentage: 100 },
  { id: 'ai-assistant', name: 'AI Assistant', enabled: true, rolloutPercentage: 10 },
]);

// Component usage
function OnboardingFlow() {
  const { variant, config, trackConversion } = useExperiment('onboarding-flow');
  const { enabled: darkMode } = useFeatureFlag('dark-mode');
  const { enabled: aiAssistant } = useFeatureFlag('ai-assistant');

  const handleComplete = () => {
    trackConversion(1);
  };

  return (
    <div className={darkMode ? 'dark' : 'light'}>
      {variant?.id === 'simplified' ? (
        <SimplifiedOnboarding
          steps={config.steps}
          showAI={aiAssistant}
          onComplete={handleComplete}
        />
      ) : (
        <OriginalOnboarding
          showAI={aiAssistant}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
```
