# Built-in A/B Testing

PhilJS includes built-in A/B testing capabilities that allow you to run experiments directly in your application without external dependencies. Test different UI variations, features, and user experiences with built-in statistical analysis.

## Overview

PhilJS A/B Testing features:

- **Zero external dependencies** - Everything built-in
- **Variant assignment** with traffic allocation
- **Statistical significance** calculation
- **User targeting** and segmentation
- **Event tracking** for metrics
- **Persistent assignments** across sessions
- **Feature flags** support
- **Multivariate testing**
- **Real-time results**

## Quick Start

```typescript
import { initABTesting, useExperiment } from '@philjs/core';

// Initialize A/B testing
initABTesting({
  enabled: true,
  storage: 'localStorage',
});

// Use in component
function HomePage() {
  const variant = useExperiment('homepage-hero', {
    id: 'homepage-hero',
    name: 'Homepage Hero Test',
    variants: [
      { id: 'control', name: 'Original Hero' },
      { id: 'variant-a', name: 'New Hero with Video' },
      { id: 'variant-b', name: 'Minimal Hero' },
    ],
  });

  return (
    <div>
      {variant?.id === 'control' && <OriginalHero />}
      {variant?.id === 'variant-a' && <VideoHero />}
      {variant?.id === 'variant-b' && <MinimalHero />}
    </div>
  );
}
```

## Configuration

### Initialize A/B Testing

```typescript
import { initABTesting, getABTestEngine } from '@philjs/core';

initABTesting({
  enabled: true,
  storage: 'localStorage', // or 'sessionStorage', 'memory', 'cookie'
  onAssignment: (assignment) => {
    console.log('User assigned:', assignment);
    // Send to analytics
  },
  onEvent: (event) => {
    console.log('Event tracked:', event);
    // Send to analytics
  },
  forceVariants: {
    // For QA/testing
    'homepage-hero': 'variant-a',
  },
});

// Get the engine instance
const engine = getABTestEngine();
```

## Creating Experiments

### Basic Experiment

```typescript
const experiment = {
  id: 'button-color-test',
  name: 'Button Color Test',
  variants: [
    { id: 'control', name: 'Blue Button' },
    { id: 'green', name: 'Green Button' },
    { id: 'red', name: 'Red Button' },
  ],
};
```

### With Traffic Allocation

```typescript
const experiment = {
  id: 'new-feature-test',
  name: 'New Feature Rollout',
  variants: [
    { id: 'control', name: 'Without Feature' },
    { id: 'with-feature', name: 'With Feature' },
  ],
  traffic: 0.2, // Only 20% of users
};
```

### With Weighted Variants

```typescript
const experiment = {
  id: 'pricing-test',
  name: 'Pricing Page Variations',
  variants: [
    { id: 'control', name: 'Original', weight: 0.5 }, // 50%
    { id: 'variant-a', name: 'Discounted', weight: 0.3 }, // 30%
    { id: 'variant-b', name: 'Premium', weight: 0.2 }, // 20%
  ],
};
```

### With User Targeting

```typescript
const experiment = {
  id: 'premium-feature',
  name: 'Premium Feature Test',
  variants: [
    { id: 'control', name: 'Standard' },
    { id: 'premium', name: 'With Premium Features' },
  ],
  targeting: {
    segments: ['premium-users', 'beta-testers'],
    countries: ['US', 'CA', 'UK'],
    devices: ['desktop'],
    custom: (user) => user.accountAge > 30, // Days
  },
};
```

### With Schedule

```typescript
const experiment = {
  id: 'holiday-theme',
  name: 'Holiday Theme Test',
  variants: [
    { id: 'control', name: 'Regular Theme' },
    { id: 'holiday', name: 'Holiday Theme' },
  ],
  schedule: {
    start: new Date('2025-12-01'),
    end: new Date('2025-12-31'),
  },
};
```

## Using Experiments

### useExperiment Hook

```typescript
import { useExperiment } from '@philjs/core';

function ProductPage({ user }) {
  const variant = useExperiment('product-layout', {
    id: 'product-layout',
    name: 'Product Layout Test',
    variants: [
      { id: 'control', name: 'Grid Layout' },
      { id: 'list', name: 'List Layout' },
    ],
  }, user);

  if (!variant) {
    // Not in experiment
    return <DefaultLayout />;
  }

  return (
    <div>
      {variant.id === 'control' && <GridLayout />}
      {variant.id === 'list' && <ListLayout />}
    </div>
  );
}
```

### ABTest Component

```typescript
import { ABTest } from '@philjs/core';

function HomePage({ user }) {
  return (
    <ABTest
      experiment={{
        id: 'hero-test',
        name: 'Hero Section Test',
        variants: [
          { id: 'control', name: 'Original' },
          { id: 'variant', name: 'New Hero' },
        ],
      }}
      user={user}
      variants={{
        control: <OriginalHero />,
        variant: <NewHero />,
      }}
      fallback={<DefaultHero />}
    />
  );
}
```

### Manual Assignment

```typescript
import { ABTestEngine } from '@philjs/core';

const engine = new ABTestEngine();

engine.register({
  id: 'checkout-flow',
  name: 'Checkout Flow Test',
  variants: [
    { id: 'control', name: 'Original' },
    { id: 'simplified', name: 'Simplified' },
  ],
});

const variant = engine.getVariant('checkout-flow', user);
```

## Tracking Events

### Track Conversion

```typescript
import { useExperiment, getABTestEngine } from '@philjs/core';

function CheckoutPage({ user }) {
  const variant = useExperiment('checkout-test', experiment, user);
  const engine = getABTestEngine();

  const handlePurchase = () => {
    // Track conversion event
    engine.trackEvent('checkout-test', variant.id, 'purchase', {
      value: 99.99,
      userId: user.id,
    });

    // Process purchase...
  };

  return (
    <div>
      {variant?.id === 'control' && <OriginalCheckout />}
      {variant?.id === 'simplified' && <SimplifiedCheckout />}
      <button onClick={handlePurchase}>Complete Purchase</button>
    </div>
  );
}
```

### Track Custom Events

```typescript
const engine = getABTestEngine();

// Track button clicks
engine.trackEvent('hero-test', variant.id, 'cta-click', {
  userId: user.id,
});

// Track time spent
engine.trackEvent('product-test', variant.id, 'time-on-page', {
  value: 45, // seconds
  userId: user.id,
});

// Track form submissions
engine.trackEvent('signup-test', variant.id, 'form-submit', {
  userId: user.id,
});
```

## Analyzing Results

### Get Experiment Results

```typescript
import { getABTestEngine } from '@philjs/core';

const engine = getABTestEngine();
const results = engine.getResults('button-color-test');

console.log('Results:', results);
// {
//   experimentId: 'button-color-test',
//   variants: [
//     {
//       variantId: 'control',
//       impressions: 1000,
//       conversions: 150,
//       conversionRate: 0.15,
//       averageValue: 49.99,
//       revenue: 7498.50
//     },
//     {
//       variantId: 'green',
//       impressions: 1000,
//       conversions: 180,
//       conversionRate: 0.18,
//       averageValue: 52.50,
//       revenue: 9450.00
//     }
//   ],
//   winner: 'green',
//   confidence: 0.95,
//   sampleSize: 2000
// }
```

### Calculate Statistical Significance

```typescript
import { calculateSignificance } from '@philjs/core';

const significance = calculateSignificance(
  { conversions: 150, impressions: 1000 }, // Control
  { conversions: 180, impressions: 1000 }  // Variant
);

console.log('Confidence:', significance.confidence); // 0.95
console.log('Is significant:', significance.isSignificant); // true
console.log('P-value:', significance.pValue); // 0.05
```

## Feature Flags

### Basic Feature Flag

```typescript
import { useFeatureFlag } from '@philjs/core';

function App({ user }) {
  const hasNewDashboard = useFeatureFlag('new-dashboard', user);

  return (
    <div>
      {hasNewDashboard ? <NewDashboard /> : <OldDashboard />}
    </div>
  );
}
```

### With Gradual Rollout

```typescript
const newFeatureEnabled = useFeatureFlag(
  'new-feature',
  user,
  {
    traffic: 0.25, // 25% rollout
    targeting: {
      segments: ['beta-users'],
    },
  }
);
```

## Multivariate Testing

### Create Multivariate Test

```typescript
import { createMultivariateTest } from '@philjs/core';

const mvTest = createMultivariateTest({
  id: 'landing-page-test',
  name: 'Landing Page Multivariate Test',
  factors: {
    headline: [
      { id: 'headline-a', name: 'Original Headline' },
      { id: 'headline-b', name: 'Benefit-focused' },
      { id: 'headline-c', name: 'Question-based' },
    ],
    cta: [
      { id: 'cta-a', name: 'Get Started' },
      { id: 'cta-b', name: 'Try Free' },
    ],
    image: [
      { id: 'image-a', name: 'Product Shot' },
      { id: 'image-b', name: 'Lifestyle' },
    ],
  },
});

function LandingPage({ user }) {
  const combination = mvTest.getVariant(user);

  return (
    <div>
      <h1>{getHeadline(combination.headline)}</h1>
      <img src={getImage(combination.image)} />
      <button>{getCTA(combination.cta)}</button>
    </div>
  );
}
```

## Best Practices

### 1. Define Clear Hypotheses

```typescript
// Good - specific hypothesis
const experiment = {
  id: 'checkout-simplification',
  name: 'Hypothesis: Removing optional fields increases conversion by 10%',
  variants: [
    { id: 'control', name: 'All fields' },
    { id: 'simplified', name: 'Required fields only' },
  ],
};

// Bad - vague test
const experiment = {
  id: 'checkout-test',
  name: 'Try different checkout',
  variants: [
    { id: 'a', name: 'Version A' },
    { id: 'b', name: 'Version B' },
  ],
};
```

### 2. Run Tests Long Enough

```typescript
// Calculate required sample size
const requiredSampleSize = calculateRequiredSampleSize({
  baselineConversion: 0.10,
  minimumDetectableEffect: 0.15, // 15% lift
  confidence: 0.95,
  power: 0.80,
});

// Monitor sample size
const results = engine.getResults('experiment-id');
if (results.sampleSize < requiredSampleSize) {
  console.log('Not enough data yet');
}
```

### 3. Avoid Testing Too Many Variants

```typescript
// Good - focused test
const experiment = {
  variants: [
    { id: 'control', name: 'Current' },
    { id: 'variant', name: 'New Design' },
  ],
};

// Avoid - too many variants
const experiment = {
  variants: [
    { id: 'control' },
    { id: 'v1' },
    { id: 'v2' },
    { id: 'v3' },
    { id: 'v4' },
    { id: 'v5' }, // Needs huge traffic
  ],
};
```

### 4. Consistent User Experience

```typescript
// Good - persistent assignment
const variant = useExperiment('test-id', experiment, user);
// User always sees same variant

// Bad - random on each render
const variant = experiment.variants[Math.floor(Math.random() * experiment.variants.length)];
```

### 5. Track Multiple Metrics

```typescript
const engine = getABTestEngine();

// Primary metric
engine.trackEvent('test-id', variant.id, 'purchase', {
  value: 99.99,
  userId: user.id,
});

// Secondary metrics
engine.trackEvent('test-id', variant.id, 'add-to-cart', { userId: user.id });
engine.trackEvent('test-id', variant.id, 'time-to-purchase', { value: 120, userId: user.id });
engine.trackEvent('test-id', variant.id, 'bounce-rate', { userId: user.id });
```

## Examples

### Pricing Page Test

```typescript
function PricingPage({ user }) {
  const variant = useExperiment('pricing-test', {
    id: 'pricing-test',
    name: 'Pricing Page Layout',
    variants: [
      { id: 'control', name: 'Horizontal Layout' },
      { id: 'vertical', name: 'Vertical Layout' },
      { id: 'comparison', name: 'Comparison Table' },
    ],
  }, user);

  const engine = getABTestEngine();

  const handleSelectPlan = (plan) => {
    engine.trackEvent('pricing-test', variant.id, 'plan-selected', {
      value: plan.price,
      userId: user.id,
    });
  };

  return (
    <div>
      {variant?.id === 'control' && <HorizontalPricing onSelect={handleSelectPlan} />}
      {variant?.id === 'vertical' && <VerticalPricing onSelect={handleSelectPlan} />}
      {variant?.id === 'comparison' && <ComparisonPricing onSelect={handleSelectPlan} />}
    </div>
  );
}
```

### Onboarding Flow Test

```typescript
function Onboarding({ user }) {
  const variant = useExperiment('onboarding-test', {
    id: 'onboarding-test',
    name: 'Onboarding Flow Test',
    variants: [
      { id: 'control', name: '5 Steps' },
      { id: 'simplified', name: '3 Steps' },
      { id: 'progressive', name: 'Progressive Disclosure' },
    ],
    traffic: 0.5, // 50% of users
  }, user);

  const engine = getABTestEngine();

  const handleComplete = () => {
    engine.trackEvent('onboarding-test', variant.id, 'completed', {
      userId: user.id,
    });
  };

  const handleSkip = () => {
    engine.trackEvent('onboarding-test', variant.id, 'skipped', {
      userId: user.id,
    });
  };

  return (
    <div>
      {variant?.id === 'control' && <FiveStepOnboarding onComplete={handleComplete} onSkip={handleSkip} />}
      {variant?.id === 'simplified' && <ThreeStepOnboarding onComplete={handleComplete} onSkip={handleSkip} />}
      {variant?.id === 'progressive' && <ProgressiveOnboarding onComplete={handleComplete} onSkip={handleSkip} />}
    </div>
  );
}
```

### Email Signup Test

```typescript
function EmailSignup({ user }) {
  const variant = useExperiment('email-signup-test', {
    id: 'email-signup-test',
    name: 'Email Signup CTA',
    variants: [
      { id: 'control', name: 'Subscribe' },
      { id: 'benefit', name: 'Get Updates' },
      { id: 'social-proof', name: 'Join 10,000+ subscribers' },
    ],
  }, user);

  const engine = getABTestEngine();
  const [email, setEmail] = signal('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Track submission
    engine.trackEvent('email-signup-test', variant.id, 'submit', {
      userId: user.id,
    });

    const result = await submitEmail(email());

    if (result.success) {
      engine.trackEvent('email-signup-test', variant.id, 'success', {
        userId: user.id,
      });
    }
  };

  const ctaText = {
    control: 'Subscribe',
    benefit: 'Get Updates',
    'social-proof': 'Join 10,000+ subscribers',
  }[variant?.id || 'control'];

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email()}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
      />
      <button type="submit">{ctaText}</button>
    </form>
  );
}
```

### Dashboard Widget Test

```typescript
function Dashboard({ user }) {
  const showNewWidget = useFeatureFlag('new-analytics-widget', user, {
    traffic: 0.3, // 30% rollout
    targeting: {
      segments: ['power-users'],
      custom: (u) => u.plan === 'premium',
    },
  });

  const engine = getABTestEngine();

  useEffect(() => {
    if (showNewWidget) {
      engine.trackEvent('new-widget', 'variant', 'impression', {
        userId: user.id,
      });
    }
  }, []);

  const handleWidgetClick = () => {
    engine.trackEvent('new-widget', 'variant', 'click', {
      userId: user.id,
    });
  };

  return (
    <div className="dashboard">
      {showNewWidget ? (
        <NewAnalyticsWidget onClick={handleWidgetClick} />
      ) : (
        <OldAnalyticsWidget />
      )}
    </div>
  );
}
```

## Analytics Integration

### Google Analytics

```typescript
initABTesting({
  onAssignment: (assignment) => {
    // Send to Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'experiment_impression', {
        experiment_id: assignment.experimentId,
        variant_id: assignment.variantId,
      });
    }
  },
  onEvent: (event) => {
    if (typeof gtag !== 'undefined') {
      gtag('event', event.eventName, {
        experiment_id: event.experimentId,
        variant_id: event.variantId,
        value: event.value,
      });
    }
  },
});
```

### Custom Analytics

```typescript
initABTesting({
  onAssignment: (assignment) => {
    fetch('/api/analytics/assignment', {
      method: 'POST',
      body: JSON.stringify(assignment),
    });
  },
  onEvent: (event) => {
    fetch('/api/analytics/event', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  },
});
```

## Troubleshooting

### Users Not Being Assigned

**Problem**: Users aren't getting assigned to variants

**Solutions**:
1. Check if experiment is registered
2. Verify traffic allocation
3. Check targeting rules
4. Ensure experiment is within schedule

```typescript
const engine = getABTestEngine();
const variant = engine.getVariant('experiment-id', user);

if (!variant) {
  console.log('Not assigned. Check:');
  console.log('- Is experiment registered?');
  console.log('- Traffic allocation:', experiment.traffic);
  console.log('- Targeting rules match?');
  console.log('- Within schedule?');
}
```

### Inconsistent Variant Assignment

**Problem**: Users see different variants on each page load

**Solutions**:
1. Ensure consistent user ID
2. Check storage configuration
3. Verify assignment persistence

```typescript
// Use consistent user ID
const user = {
  id: userId, // Must be same across sessions
  // other properties...
};
```

### No Results Data

**Problem**: Experiment results are empty

**Solutions**:
1. Verify events are being tracked
2. Check event names match
3. Ensure engine is initialized

```typescript
const engine = getABTestEngine();

// Check if events are being tracked
console.log('Events:', engine.getEvents('experiment-id'));

// Verify results
console.log('Results:', engine.getResults('experiment-id'));
```

## API Reference

For complete API documentation, see [Core API Reference: A/B Testing](../api-reference/core.md#ab-testing)

### Key Functions

- `initABTesting()` - Initialize A/B testing engine
- `getABTestEngine()` - Get engine instance
- `useExperiment()` - Assign users to variants (hook)
- `ABTest` - Component for A/B testing
- `useFeatureFlag()` - Feature flag management
- `createMultivariateTest()` - Create multivariate test
- `calculateSignificance()` - Statistical analysis
- `ABTestEngine` - Main engine class

### ABTestEngine Methods

- `register(experiment)` - Register experiment
- `getVariant(experimentId, user)` - Get variant for user
- `trackEvent(experimentId, variantId, eventName, data)` - Track event
- `getResults(experimentId)` - Get experiment results
- `getEvents(experimentId)` - Get tracked events
- `endExperiment(experimentId, winnerId)` - End experiment

## Related Topics

- [Analytics Integration](./ai-integration.md)
- [Feature Flags](./advanced-patterns.md)
- [User Segmentation](./auth.md)
- [Performance Tracking](../best-practices/performance.md)


