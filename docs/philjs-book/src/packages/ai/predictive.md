# Predictive Prefetching AI

PhilJS includes a client-side AI model designed to eliminate loading states entirely by predicting where the user will go next.

Unlike simple "hover" prefetching (which wastes bandwidth), **Predictive Prefetching** uses a lightweight on-device model (`@philjs/ai/predictive`) to learn user behavior patterns.

## How It Works

1.  **Data Collection**: The runtime anonymously tracks navigation paths (e.g., "Home -> Products -> T-Shirt -> Checkout").
2.  **Pattern Recognition**: Uses a Markov Chain or lightweight Neural Network (based on device capability) running in a Web Worker.
3.  **Prediction**: When a user lands on "Products", the model predicts "T-Shirt" has an 80% probability.
4.  **Action**: PhilJS pre-loads the code and data for "T-Shirt" *before* the user even moves their mouse.

## Usage

Enable it in your router configuration:

```typescript
import { Router } from '@philjs/router';
import { usePredictivePrefetch } from '@philjs/ai/predictive';

export const router = new Router({
  routes,
  prefetch: 'predictive', // Default is 'visible'
});

// Or use the hook for manual control
function App() {
  const { confidence, nextRoute } = usePredictivePrefetch();
  
  return (
    <div>
      {confidence > 0.8 && <div className="toast">Preloaded {nextRoute}!</div>}
    </div>
  );
}
```

## Privacy First

*   **100% Client-Side**: No user behavior data is ever sent to a server. The model learns and predicts locally in the browser's IndexedDB.
*   **Session Only**: You can configure the model to discard data after the session ends.

## Configuration

```typescript
// philjs.config.ts
export default {
  ai: {
    predictive: {
      model: 'markov', // 'markov' (fast) or 'neural' (smart)
      threshold: 0.6,  // Only prefetch if 60% confident
      maxBandwidth: 'low-data', // Don't prefetch on cellular data
    }
  }
}
```

## Impact

*   **LCP (Largest Contentful Paint)**: Effectively 0s for subsequent route navigations.
*   **Conversion**: 0ms latency has been shown to increase conversion rates by 1-5%.
