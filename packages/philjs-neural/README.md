# @philjs/neural

Neural Rendering Engine for PhilJS - AI-powered rendering optimization using neural networks for predictive frame rendering, adaptive quality scaling, smart component prioritization, and neural layout optimization.

## Installation

```bash
npm install @philjs/neural
```

## Requirements

- Node.js >= 24
- TypeScript 5.9+ (for development)
- Modern browser with `requestAnimationFrame` and `IntersectionObserver` support

## Basic Usage

```typescript
import {
  initNeuralRenderer,
  useNeuralRendering,
  useAdaptiveQuality,
  usePredictiveRendering
} from '@philjs/neural';

// Initialize the neural renderer
const renderer = initNeuralRenderer({
  predictiveRendering: true,
  targetFPS: 60,
  adaptiveQuality: true,
  modelSize: 'small',
  memoryBudget: 50 // MB
});

// Start the renderer
renderer.start();

// Use in components
function MyComponent() {
  const { quality, priority, recordRender, recordInteraction } = useNeuralRendering('my-component');

  // Adjust rendering based on quality settings
  const showShadows = quality.enableShadows;
  const showAnimations = quality.enableAnimations;

  // Record interactions for priority learning
  const handleClick = () => {
    recordInteraction();
    // ... handle click
  };
}
```

## Adaptive Quality

```typescript
import { useAdaptiveQuality } from '@philjs/neural';

function QualityAwareComponent() {
  const { level, settings } = useAdaptiveQuality();

  // level: 0.0 - 1.0 (current quality level)
  // settings: detailed quality configuration

  return (
    <div style={{
      boxShadow: settings.enableShadows ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
      filter: settings.enableBlur ? 'blur(0)' : 'none'
    }}>
      {settings.enableAnimations && <AnimatedContent />}
      <img
        src={`/image-${settings.imageQuality}.jpg`}
        style={{ transform: `scale(${settings.renderResolution})` }}
      />
    </div>
  );
}
```

## Predictive Rendering

```typescript
import { usePredictiveRendering, getNeuralRenderer } from '@philjs/neural';

// Get predictions for which components will render next
const predictions = usePredictiveRendering(['header', 'sidebar', 'content', 'footer']);

predictions.forEach(pred => {
  console.log(`Component: ${pred.componentId}`);
  console.log(`  Probability: ${pred.probability}`);
  console.log(`  Estimated render time: ${pred.estimatedRenderTime}ms`);
  console.log(`  Priority: ${pred.priority}`);
  console.log(`  Should prerender: ${pred.shouldPrerender}`);
});

// Record actual renders to improve predictions
const renderer = getNeuralRenderer();
renderer?.recordRender('my-component', 5.2, 'state');
```

## Layout Optimization

```typescript
import { useLayoutOptimization, getNeuralRenderer } from '@philjs/neural';

// Record element layouts
const renderer = getNeuralRenderer();
renderer?.recordLayout('element-1', { x: 0, y: 0, width: 200, height: 100 });
renderer?.recordLayout('element-2', { x: 0, y: 100, width: 200, height: 150 });

// Get optimization suggestions
const elements = new Map([
  ['element-1', { x: 0, y: 0, width: 200, height: 100 }],
  ['element-2', { x: 0, y: 100, width: 200, height: 150 }]
]);

const suggestions = useLayoutOptimization(elements);

suggestions.forEach(suggestion => {
  console.log(`Element: ${suggestion.elementId}`);
  console.log(`  Suggested changes:`, suggestion.suggestedLayout);
  console.log(`  Performance gain: ${suggestion.performanceGain}%`);
  console.log(`  Reason: ${suggestion.reason}`);
});
```

## Component Prioritization

```typescript
import { getNeuralRenderer } from '@philjs/neural';

const renderer = getNeuralRenderer();

// Observe components for visibility tracking
const element = document.getElementById('my-component');
renderer?.observeComponent(element, 'my-component');

// Record user interactions
renderer?.recordInteraction('my-component');

// Get priority rankings
const priorities = renderer?.getComponentPriorities(['comp-a', 'comp-b', 'comp-c']);
// Returns: [{ id, visibility, interactionLikelihood, renderCost, priority }]
```

## API Reference

### Initialization

- **`initNeuralRenderer(config?: NeuralRendererConfig): NeuralRenderer`** - Initialize the neural renderer
- **`getNeuralRenderer(): NeuralRenderer | null`** - Get the global renderer instance

### Hooks

- **`useNeuralRendering(componentId: string)`** - Get quality settings and recording functions for a component
- **`useAdaptiveQuality()`** - Get current quality level and settings
- **`usePredictiveRendering(componentIds: string[])`** - Get render predictions
- **`useLayoutOptimization(elements: Map<string, LayoutMetrics>)`** - Get layout optimization suggestions

### Classes

#### `NeuralRenderer`

Main neural rendering engine.

**Methods:**
- `start()` - Start the render loop
- `stop()` - Stop the render loop
- `recordRender(componentId, renderTime, triggerType, parentId?)` - Record a component render
- `predictNextRenders(componentIds)` - Predict which components will render
- `getQualitySettings()` - Get current quality settings
- `getQualityLevel()` - Get quality level (0-1)
- `observeComponent(element, componentId)` - Start observing a component
- `unobserveComponent(element)` - Stop observing
- `recordInteraction(componentId)` - Record user interaction
- `getComponentPriorities(componentIds)` - Get priority rankings
- `recordLayout(elementId, metrics)` - Record layout metrics
- `getLayoutSuggestions(elements)` - Get optimization suggestions
- `analyzeFrame()` - Get current frame analysis
- `destroy()` - Clean up resources

#### `RenderPredictor`

Neural network-based render prediction.

#### `AdaptiveQualityManager`

Manages quality scaling based on performance.

#### `ComponentPrioritizer`

Tracks component visibility and interactions.

#### `NeuralLayoutOptimizer`

Provides layout optimization suggestions.

#### `Tensor` / `NeuralNetwork`

Low-level neural network primitives.

### Configuration

```typescript
interface NeuralRendererConfig {
  predictiveRendering?: boolean;  // Enable predictions (default: true)
  targetFPS?: number;             // Target frame rate (default: 60)
  adaptiveQuality?: boolean;      // Enable quality scaling (default: true)
  modelSize?: 'tiny' | 'small' | 'medium';  // Neural model size (default: 'small')
  offlineMode?: boolean;          // Enable offline inference (default: true)
  useGPU?: boolean;               // GPU acceleration (default: false)
  memoryBudget?: number;          // Memory limit in MB (default: 50)
}
```

### Types

- `RenderPrediction` - Prediction result with probability, time estimate, and priority
- `FrameAnalysis` - Frame metrics including jank score and memory usage
- `NeuralLayoutSuggestion` - Layout optimization recommendation
- `LayoutMetrics` - Element position and size with optional CSS hints
- `ComponentPriority` - Component ranking with visibility and interaction scores

## Quality Settings

The adaptive quality manager provides these settings:

```typescript
{
  enableShadows: boolean;      // Enable box shadows
  enableAnimations: boolean;   // Enable CSS animations
  imageQuality: 'low' | 'medium' | 'high';
  renderResolution: number;    // 0.3 - 1.0
  enableBlur: boolean;         // Enable blur effects
}
```

## License

MIT
