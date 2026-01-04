# Failure Prediction

The `@philjs/runtime` package includes a predictive failure detection system that analyzes error patterns to anticipate failures before they occur. This enables proactive healing strategies and helps prevent cascading failures.

## Overview

The prediction system uses heuristic-based pattern analysis to:
- Calculate failure probability for each component
- Identify factors contributing to potential failures
- Suggest preemptive actions
- Emit warnings when failure risk is high

```typescript
interface FailurePrediction {
  /** Probability of failure (0-1) */
  probability: number;
  /** Predicted time to failure (ms) - optional */
  timeToFailure?: number;
  /** Suggested preemptive action */
  suggestedAction: HealingStrategy;
  /** Confidence score (0-1) */
  confidence: number;
  /** Factors contributing to the prediction */
  factors: string[];
}
```

## Enabling Prediction

Prediction is enabled by default. Configure it in the runtime initialization:

```typescript
import { initSelfHealing } from '@philjs/runtime/self-healing';

const runtime = initSelfHealing({
  enablePrediction: true,  // Enable prediction system (default: true)
  logEvents: true,         // Log prediction warnings (default: true)
});
```

## The predictFailure Method

The `predictFailure` method analyzes error history and patterns for a specific component:

### Method Signature

```typescript
predictFailure(componentId: string): FailurePrediction
```

### Basic Usage

```typescript
import { getSelfHealingRuntime } from '@philjs/runtime/self-healing';

const runtime = getSelfHealingRuntime();

function checkHealth(componentId: string) {
  const prediction = runtime?.predictFailure(componentId);

  if (prediction) {
    console.log('Failure Prediction:', {
      probability: `${(prediction.probability * 100).toFixed(1)}%`,
      confidence: `${(prediction.confidence * 100).toFixed(1)}%`,
      suggestedAction: prediction.suggestedAction,
      factors: prediction.factors,
    });
  }
}

// Check health of a specific component
checkHealth('payment-service');
```

### Using with the Hook

```typescript
import { useSelfHealing } from '@philjs/runtime/self-healing';

function CriticalComponent() {
  const { predict, handleError } = useSelfHealing('critical-component');

  // Check prediction periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const prediction = predict();

      if (prediction.probability > 0.5) {
        console.warn('High failure risk detected');
        takePreemptiveAction(prediction);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [predict]);

  return <ComponentContent />;
}
```

## Pattern Analysis

The prediction system analyzes several factors to calculate failure probability.

### Factor 1: Error Frequency

High error frequency increases failure probability:

```typescript
// Analyze errors in the last 60 seconds
const recentErrors = history.filter(e => Date.now() - e.timestamp < 60000);
const errorFrequency = recentErrors.length / 60; // errors per second

if (errorFrequency > 0.1) {
  probability += 0.3;
  factors.push('High error frequency');
}
```

### Factor 2: Increasing Error Rate

If error rate is increasing over time, failure is more likely:

```typescript
// Compare recent patterns to previous patterns
if (patterns.length >= 2) {
  const recent = patterns[patterns.length - 1];
  const previous = patterns[patterns.length - 2];

  if (recent > previous) {
    probability += 0.2;
    factors.push('Increasing error rate');
  }
}
```

### Factor 3: Repeated Same Error Type

Recurring identical errors indicate a systemic issue:

```typescript
// Check if all errors are the same type
const errorTypes = new Set(history.map(e => e.error.name));

if (errorTypes.size === 1 && history.length > 3) {
  probability += 0.2;
  factors.push('Repeated same error type');
}
```

### Factor 4: Circuit Breaker State

Components approaching the circuit breaker threshold are at high risk:

```typescript
// Check circuit breaker failure count
const circuitState = this.circuitBreakers.get(componentId);

if (circuitState && circuitState.failures > 2) {
  probability += 0.3;
  factors.push('Circuit breaker nearing threshold');
}
```

### Probability Calculation

The final probability is the sum of all factors, capped at 1.0:

```typescript
probability = Math.min(probability, 1);
```

## Suggested Actions

Based on the calculated probability, the system suggests appropriate preemptive actions:

| Probability Range | Suggested Action | Rationale |
|-------------------|------------------|-----------|
| 0.0 - 0.3 | `retry` | Low risk, simple retry should suffice |
| 0.3 - 0.5 | `degrade` | Moderate risk, reduce functionality |
| 0.5 - 0.7 | `fallback` | High risk, prepare fallback |
| 0.7 - 1.0 | `circuit-break` | Critical risk, prevent cascade |

```typescript
// Internal action selection
let suggestedAction: HealingStrategy = 'retry';

if (probability > 0.7) {
  suggestedAction = 'circuit-break';
} else if (probability > 0.5) {
  suggestedAction = 'fallback';
} else if (probability > 0.3) {
  suggestedAction = 'degrade';
}
```

## Confidence Score

The confidence score indicates how reliable the prediction is, based on the amount of historical data:

```typescript
// Confidence grows with more data (up to 100% with 10+ errors)
confidence = Math.min(history.length / 10, 1);
```

| Error History | Confidence |
|---------------|------------|
| 0-2 errors | 0% (insufficient data) |
| 3 errors | 30% |
| 5 errors | 50% |
| 10+ errors | 100% |

### Insufficient Data

When there's not enough history (fewer than 3 errors), the prediction returns baseline values:

```typescript
if (history.length < 3) {
  return {
    probability: 0,
    suggestedAction: 'retry',
    confidence: 0,
    factors: [],
  };
}
```

## Prediction Warnings

When probability exceeds 0.5 and prediction is enabled, the runtime automatically emits a warning event:

```typescript
if (probability > 0.5 && this.config.enablePrediction) {
  this.emit({
    type: 'prediction-warning',
    timestamp: Date.now(),
    componentId,
    prediction
  });
}
```

### Handling Prediction Warnings

```typescript
runtime.onEvent((event) => {
  if (event.type === 'prediction-warning' && event.prediction) {
    const { prediction, componentId } = event;

    console.warn(`Prediction warning for ${componentId}:`, {
      probability: prediction.probability,
      factors: prediction.factors,
    });

    // Send to monitoring
    alertSystem.notify({
      severity: prediction.probability > 0.7 ? 'critical' : 'warning',
      title: `High failure risk: ${componentId}`,
      details: prediction.factors.join(', '),
    });
  }
});
```

## Implementing Preemptive Actions

### Based on Probability Thresholds

```typescript
function monitorComponent(componentId: string) {
  const runtime = getSelfHealingRuntime();

  const prediction = runtime?.predictFailure(componentId);
  if (!prediction) return;

  // Only act if confidence is sufficient
  if (prediction.confidence < 0.3) {
    console.log('Insufficient data for reliable prediction');
    return;
  }

  switch (prediction.suggestedAction) {
    case 'circuit-break':
      // Proactively switch to backup service
      activateBackupService(componentId);
      notifyOps('Preemptive circuit break activated');
      break;

    case 'fallback':
      // Preload and prepare fallback component
      preloadFallback(componentId);
      break;

    case 'degrade':
      // Reduce functionality before failure
      enableDegradedMode(componentId);
      break;

    case 'retry':
      // Low risk, continue normal operation
      break;
  }
}
```

### Automated Health Monitoring

```typescript
function startHealthMonitor(componentIds: string[], intervalMs = 10000) {
  const runtime = getSelfHealingRuntime();
  if (!runtime) return;

  const interval = setInterval(() => {
    const healthReport = componentIds.map(id => {
      const prediction = runtime.predictFailure(id);
      return {
        componentId: id,
        ...prediction,
      };
    });

    // Find components at risk
    const atRisk = healthReport.filter(r => r.probability > 0.5);

    if (atRisk.length > 0) {
      console.warn('Components at risk:', atRisk);

      // Take action for each at-risk component
      atRisk.forEach(({ componentId, suggestedAction }) => {
        takePreemptiveAction(componentId, suggestedAction);
      });
    }

    // Log health report
    logHealthReport(healthReport);

  }, intervalMs);

  return () => clearInterval(interval);
}

// Usage
const stopMonitor = startHealthMonitor([
  'api-client',
  'database-pool',
  'auth-service',
  'payment-gateway',
]);

// Cleanup
window.addEventListener('beforeunload', stopMonitor);
```

### Dashboard Integration

```typescript
function HealthDashboard() {
  const [predictions, setPredictions] = useState<Map<string, FailurePrediction>>(new Map());
  const runtime = getSelfHealingRuntime();

  useEffect(() => {
    const componentIds = ['api', 'auth', 'payments', 'storage'];

    const interval = setInterval(() => {
      const newPredictions = new Map<string, FailurePrediction>();

      componentIds.forEach(id => {
        const prediction = runtime?.predictFailure(id);
        if (prediction) {
          newPredictions.set(id, prediction);
        }
      });

      setPredictions(newPredictions);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="health-dashboard">
      <h2>System Health</h2>
      {Array.from(predictions.entries()).map(([id, pred]) => (
        <HealthCard
          key={id}
          componentId={id}
          probability={pred.probability}
          confidence={pred.confidence}
          factors={pred.factors}
          suggestedAction={pred.suggestedAction}
        />
      ))}
    </div>
  );
}

function HealthCard({
  componentId,
  probability,
  confidence,
  factors,
  suggestedAction
}: {
  componentId: string;
  probability: number;
  confidence: number;
  factors: string[];
  suggestedAction: HealingStrategy;
}) {
  const riskLevel = probability > 0.7 ? 'critical' :
                    probability > 0.5 ? 'high' :
                    probability > 0.3 ? 'medium' : 'low';

  return (
    <div className={`health-card health-card--${riskLevel}`}>
      <h3>{componentId}</h3>
      <div className="risk-meter">
        <div
          className="risk-fill"
          style={{ width: `${probability * 100}%` }}
        />
      </div>
      <p>Risk: {(probability * 100).toFixed(0)}%</p>
      <p>Confidence: {(confidence * 100).toFixed(0)}%</p>
      {factors.length > 0 && (
        <ul className="factors">
          {factors.map((f, i) => <li key={i}>{f}</li>)}
        </ul>
      )}
      <p className="suggested-action">
        Suggested: <code>{suggestedAction}</code>
      </p>
    </div>
  );
}
```

## Observability Integration

### Metrics and Alerts

```typescript
import { initSelfHealing } from '@philjs/runtime/self-healing';

const runtime = initSelfHealing();

// Send predictions to metrics system
runtime.onEvent((event) => {
  if (event.type === 'prediction-warning' && event.prediction) {
    // DataDog/New Relic/Prometheus metrics
    metrics.gauge('failure_prediction.probability', event.prediction.probability, {
      component: event.componentId,
    });

    metrics.increment('failure_prediction.warning_count', {
      component: event.componentId,
      severity: event.prediction.probability > 0.7 ? 'critical' : 'high',
    });

    // Track contributing factors
    event.prediction.factors.forEach(factor => {
      metrics.increment('failure_prediction.factors', {
        component: event.componentId,
        factor: factor.replace(/\s+/g, '_').toLowerCase(),
      });
    });
  }
});
```

### OpenTelemetry Tracing

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('self-healing');

runtime.onEvent((event) => {
  if (event.type === 'prediction-warning' && event.prediction) {
    const span = tracer.startSpan('failure_prediction_warning');

    span.setAttributes({
      'component.id': event.componentId!,
      'prediction.probability': event.prediction.probability,
      'prediction.confidence': event.prediction.confidence,
      'prediction.suggested_action': event.prediction.suggestedAction,
      'prediction.factors': event.prediction.factors.join(', '),
    });

    span.addEvent('prediction_warning_emitted', {
      timestamp: event.timestamp,
    });

    span.end();
  }
});
```

### Logging

```typescript
runtime.onEvent((event) => {
  if (event.type === 'prediction-warning' && event.prediction) {
    const logLevel = event.prediction.probability > 0.7 ? 'error' : 'warn';

    logger[logLevel]('Failure prediction warning', {
      componentId: event.componentId,
      probability: event.prediction.probability,
      confidence: event.prediction.confidence,
      suggestedAction: event.prediction.suggestedAction,
      factors: event.prediction.factors,
      timestamp: new Date(event.timestamp).toISOString(),
    });
  }
});
```

## Prediction Patterns

### Pattern 1: Periodic Health Checks

```typescript
function useHealthCheck(componentId: string, intervalMs = 30000) {
  const { predict } = useSelfHealing(componentId);
  const [health, setHealth] = useState<FailurePrediction | null>(null);

  useEffect(() => {
    // Initial check
    setHealth(predict());

    // Periodic checks
    const interval = setInterval(() => {
      setHealth(predict());
    }, intervalMs);

    return () => clearInterval(interval);
  }, [predict, intervalMs]);

  return health;
}

// Usage
function ServiceStatus({ serviceId }: { serviceId: string }) {
  const health = useHealthCheck(serviceId);

  if (!health) return <LoadingSpinner />;

  return (
    <StatusIndicator
      status={health.probability < 0.3 ? 'healthy' :
              health.probability < 0.7 ? 'degraded' : 'critical'}
      message={health.factors.join(', ')}
    />
  );
}
```

### Pattern 2: Pre-Operation Risk Assessment

```typescript
async function executeWithRiskCheck<T>(
  componentId: string,
  operation: () => Promise<T>
): Promise<T> {
  const runtime = getSelfHealingRuntime();
  const prediction = runtime?.predictFailure(componentId);

  // Abort if risk is too high
  if (prediction && prediction.probability > 0.8 && prediction.confidence > 0.5) {
    throw new Error(
      `Operation aborted: High failure risk (${(prediction.probability * 100).toFixed(0)}%) ` +
      `for ${componentId}. Factors: ${prediction.factors.join(', ')}`
    );
  }

  // Log warning but proceed
  if (prediction && prediction.probability > 0.5) {
    console.warn(`Proceeding with elevated risk for ${componentId}`, prediction);
  }

  return operation();
}

// Usage
const data = await executeWithRiskCheck('database', async () => {
  return db.query('SELECT * FROM users');
});
```

### Pattern 3: Adaptive Retries

```typescript
async function fetchWithAdaptiveRetry(
  componentId: string,
  fetchFn: () => Promise<Response>
): Promise<Response> {
  const runtime = getSelfHealingRuntime();
  const prediction = runtime?.predictFailure(componentId);

  // Adjust retry behavior based on prediction
  let maxRetries = 3;
  let timeout = 5000;

  if (prediction && prediction.confidence > 0.3) {
    if (prediction.probability > 0.5) {
      // High risk: fewer retries, shorter timeout
      maxRetries = 1;
      timeout = 2000;
    } else if (prediction.probability > 0.3) {
      // Moderate risk: normal retries, shorter timeout
      timeout = 3000;
    }
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetchFn();
      clearTimeout(timeoutId);

      return response;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await sleep(100 * Math.pow(2, attempt));
    }
  }

  throw new Error('Unreachable');
}
```

### Pattern 4: Proactive Degradation

```typescript
function useProactiveDegradation(componentId: string) {
  const [degraded, setDegraded] = useState(false);
  const { predict } = useSelfHealing(componentId);

  useEffect(() => {
    const interval = setInterval(() => {
      const prediction = predict();

      // Automatically degrade if risk is high
      if (prediction.probability > 0.6 && prediction.confidence > 0.4) {
        setDegraded(true);
        console.log(`Proactively degrading ${componentId}`, prediction.factors);
      }

      // Recover if risk decreases
      if (prediction.probability < 0.3 && degraded) {
        setDegraded(false);
        console.log(`Restoring full functionality for ${componentId}`);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [predict, degraded, componentId]);

  return degraded;
}

// Usage
function FeatureRichComponent() {
  const degraded = useProactiveDegradation('feature-rich');

  if (degraded) {
    return <SimplifiedComponent />;
  }

  return <FullFeaturedComponent />;
}
```

## Limitations

1. **Heuristic-Based**: Current implementation uses simple heuristics, not true ML
2. **Requires History**: Predictions need at least 3 historical errors
3. **Component-Scoped**: Predictions are per-component, not system-wide
4. **No Persistence**: Error history is lost on page reload
5. **No Cross-Session Learning**: Patterns don't persist across sessions

## Future Enhancements

The prediction system is designed to support future ML-based improvements:

- Time-series analysis for seasonal patterns
- Cross-component correlation analysis
- Anomaly detection algorithms
- Persistent learning across sessions
- User behavior correlation

## Best Practices

### 1. Set Appropriate Check Intervals

```typescript
// Too frequent: Performance overhead
const interval = setInterval(() => predict(), 100); // Bad

// Appropriate: Balance responsiveness with overhead
const interval = setInterval(() => predict(), 10000); // Good
```

### 2. Consider Confidence in Decisions

```typescript
const prediction = predict();

// Don't act on low-confidence predictions
if (prediction.confidence < 0.3) {
  return; // Insufficient data
}

// Weight actions by confidence
const actionThreshold = 0.5 - (prediction.confidence * 0.2);
if (prediction.probability > actionThreshold) {
  takeAction();
}
```

### 3. Log Prediction Accuracy

```typescript
const predictions = new Map<string, FailurePrediction>();

runtime.onEvent((event) => {
  if (event.type === 'prediction-warning' && event.componentId) {
    predictions.set(event.componentId, event.prediction!);
  }

  if (event.type === 'error-detected' && event.componentId) {
    const prediction = predictions.get(event.componentId);
    if (prediction) {
      // Log whether prediction was accurate
      analytics.track('prediction_accuracy', {
        componentId: event.componentId,
        predictedProbability: prediction.probability,
        wasAccurate: prediction.probability > 0.5,
      });
    }
  }
});
```

### 4. Combine with Circuit Breakers

```typescript
function hybridProtection(componentId: string) {
  const runtime = getSelfHealingRuntime();
  const prediction = runtime?.predictFailure(componentId);
  const stats = runtime?.getStats();
  const circuitState = stats?.circuitBreakerStates.get(componentId);

  // Combine prediction with circuit breaker state
  if (circuitState?.state === 'open') {
    return 'blocked'; // Circuit is open
  }

  if (prediction && prediction.probability > 0.7 && prediction.confidence > 0.5) {
    return 'at-risk'; // High predicted failure
  }

  if (circuitState && circuitState.failures > 2) {
    return 'degraded'; // Approaching threshold
  }

  return 'healthy';
}
```

## Next Steps

- [Self-Healing Features](./self-healing.md) - Healing strategies and error handling
- [Checkpoints and Recovery](./checkpoints.md) - State snapshots and restoration
- [Overview](./overview.md) - Complete package overview
