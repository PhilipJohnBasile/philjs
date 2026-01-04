# @philjs/neural - Neural Rendering Engine

**AI-powered rendering optimization using neural networks.**

@philjs/neural brings machine learning directly into your rendering pipeline with predictive frame rendering, adaptive quality scaling, smart component prioritization, neural layout optimization, and memory-efficient DOM diffing. This is a unique capability that no other JavaScript framework offers.

## Installation

```bash
npm install @philjs/neural
# or
pnpm add @philjs/neural
# or
bun add @philjs/neural
```

## Why @philjs/neural?

Traditional rendering optimization relies on manual profiling and static heuristics. @philjs/neural takes a different approach:

- **Predictive Rendering**: Neural networks predict which components will render next
- **Adaptive Quality**: Automatically adjusts visual quality based on device performance
- **Smart Prioritization**: ML-driven component prioritization based on visibility and interaction patterns
- **Layout Optimization**: Neural suggestions for CSS containment, will-change, and layout improvements
- **Zero Configuration**: Works out of the box with sensible defaults

## Feature Overview

| Feature | Description |
|---------|-------------|
| **Predictive Rendering** | Predict component renders before they happen |
| **Adaptive Quality** | Auto-adjust shadows, animations, blur based on FPS |
| **Component Prioritization** | ML-based render priority assignment |
| **Layout Optimization** | Neural suggestions for layout performance |
| **Render Path Prediction** | Anticipate rendering paths |
| **Memory-Efficient Diffing** | ML-optimized DOM reconciliation |
| **GPU Acceleration** | Optional WebGL-based inference |
| **Offline Inference** | No server required for predictions |

## Quick Start

```typescript
import {
  initNeuralRenderer,
  useNeuralRendering,
  useAdaptiveQuality
} from '@philjs/neural';

// Initialize the neural renderer globally
const renderer = initNeuralRenderer({
  predictiveRendering: true,
  targetFPS: 60,
  adaptiveQuality: true,
  modelSize: 'small'
});

// Use in a component
function MyComponent() {
  const { quality, recordRender, recordInteraction } = useNeuralRendering('my-component');

  // Adapt rendering based on quality settings
  const showShadows = quality.enableShadows;
  const showAnimations = quality.enableAnimations;

  return (
    <div
      onClick={recordInteraction}
      style={{
        boxShadow: showShadows ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
        transition: showAnimations ? 'all 0.3s' : 'none'
      }}
    >
      Content
    </div>
  );
}
```

## Neural Renderer

The `NeuralRenderer` class is the core of the package. It coordinates all neural rendering optimizations.

### Creating a Renderer

```typescript
import { NeuralRenderer } from '@philjs/neural';

const renderer = new NeuralRenderer({
  predictiveRendering: true,   // Enable render prediction
  targetFPS: 60,               // Target frame rate
  adaptiveQuality: true,       // Enable quality adaptation
  modelSize: 'small',          // Neural model size: 'tiny' | 'small' | 'medium'
  offlineMode: true,           // Run inference locally
  useGPU: false,               // GPU acceleration (WebGL)
  memoryBudget: 50             // Memory budget in MB
});

// Start the renderer
renderer.start();

// Stop when done
renderer.stop();

// Clean up resources
renderer.destroy();
```

### Configuration Options

```typescript
interface NeuralRendererConfig {
  /** Enable predictive rendering (default: true) */
  predictiveRendering?: boolean;

  /** Target frame rate (default: 60) */
  targetFPS?: number;

  /** Enable adaptive quality scaling (default: true) */
  adaptiveQuality?: boolean;

  /** Neural model size (default: 'small')
   *  - 'tiny': Minimal overhead, basic predictions
   *  - 'small': Balanced performance and accuracy
   *  - 'medium': Higher accuracy, more compute
   */
  modelSize?: 'tiny' | 'small' | 'medium';

  /** Run inference without server (default: true) */
  offlineMode?: boolean;

  /** Use WebGL for GPU acceleration (default: false) */
  useGPU?: boolean;

  /** Memory budget in MB (default: 50) */
  memoryBudget?: number;
}
```

### Recording Renders

Track component renders to train the prediction model:

```typescript
// Record a render event
renderer.recordRender(
  'component-id',      // Unique component identifier
  5.2,                 // Render time in milliseconds
  'state',             // Trigger type: 'state' | 'props' | 'context' | 'effect'
  'parent-id'          // Optional parent component ID
);
```

### Predicting Renders

Get predictions for which components will render next:

```typescript
const predictions = renderer.predictNextRenders([
  'header',
  'sidebar',
  'main-content',
  'footer'
]);

predictions.forEach(p => {
  console.log(`${p.componentId}:`);
  console.log(`  Probability: ${(p.probability * 100).toFixed(1)}%`);
  console.log(`  Est. render time: ${p.estimatedRenderTime.toFixed(1)}ms`);
  console.log(`  Priority: ${p.priority}`);
  console.log(`  Should prerender: ${p.shouldPrerender}`);
});
```

### Adaptive Quality

Get quality settings based on current performance:

```typescript
const settings = renderer.getQualitySettings();

// settings contains:
// {
//   enableShadows: boolean,      // Should render shadows
//   enableAnimations: boolean,   // Should run animations
//   imageQuality: 'low' | 'medium' | 'high',
//   renderResolution: number,    // 0.3 to 1.0
//   enableBlur: boolean          // Should use blur effects
// }

// Get raw quality level (0.3 to 1.0)
const level = renderer.getQualityLevel();
```

### Component Observation

Track component visibility for prioritization:

```typescript
// Start observing a component's visibility
renderer.observeComponent(element, 'component-id');

// Stop observing
renderer.unobserveComponent(element);

// Record user interaction
renderer.recordInteraction('component-id');

// Get component priorities
const priorities = renderer.getComponentPriorities([
  'header',
  'sidebar',
  'main-content'
]);

priorities.forEach(p => {
  console.log(`${p.id}: priority=${p.priority.toFixed(2)}`);
  console.log(`  visibility=${p.visibility.toFixed(2)}`);
  console.log(`  interaction=${p.interactionLikelihood.toFixed(2)}`);
  console.log(`  cost=${p.renderCost.toFixed(2)}`);
});
```

### Layout Optimization

Get neural suggestions for layout improvements:

```typescript
// Record layout measurements
renderer.recordLayout('element-id', {
  x: 100,
  y: 200,
  width: 300,
  height: 150
});

// Get optimization suggestions
const elements = new Map([
  ['card-1', { x: 0, y: 0, width: 400, height: 300 }],
  ['card-2', { x: 0, y: 320, width: 400, height: 300 }],
  ['sidebar', { x: 420, y: 0, width: 200, height: 620 }]
]);

const suggestions = renderer.getLayoutSuggestions(elements);

suggestions.forEach(s => {
  console.log(`${s.elementId}:`);
  console.log(`  Performance gain: ${s.performanceGain.toFixed(1)}%`);
  console.log(`  Reason: ${s.reason}`);
  if (s.suggestedLayout.willChange) {
    console.log(`  Add: will-change: ${s.suggestedLayout.willChange}`);
  }
  if (s.suggestedLayout.containment) {
    console.log(`  Add: contain: ${s.suggestedLayout.containment}`);
  }
});
```

### Frame Analysis

Get a snapshot of current frame performance:

```typescript
const analysis = renderer.analyzeFrame();

console.log(`Frame time: ${analysis.frameTime.toFixed(1)}ms`);
console.log(`Jank score: ${(analysis.jankScore * 100).toFixed(1)}%`);
console.log(`Quality level: ${(analysis.qualityLevel * 100).toFixed(1)}%`);
console.log(`Memory usage: ${analysis.memoryUsage.toFixed(1)}MB`);
console.log(`Components rendered: ${analysis.componentsRendered}`);
```

## Hooks

### useNeuralRendering

The primary hook for integrating neural rendering into components:

```typescript
import { useNeuralRendering } from '@philjs/neural';

function OptimizedComponent() {
  const {
    quality,           // Current quality settings
    priority,          // Component's render priority
    recordRender,      // Function to record render time
    recordInteraction  // Function to record user interaction
  } = useNeuralRendering('my-component');

  // Use quality settings to adapt rendering
  return (
    <div
      onClick={recordInteraction}
      style={{
        boxShadow: quality.enableShadows ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
        backdropFilter: quality.enableBlur ? 'blur(10px)' : 'none',
        transition: quality.enableAnimations ? 'transform 0.2s' : 'none'
      }}
    >
      {/* Adjust image quality */}
      <img
        src={`/image.jpg?quality=${quality.imageQuality}`}
        style={{
          imageRendering: quality.renderResolution < 0.5 ? 'pixelated' : 'auto'
        }}
      />
    </div>
  );
}
```

### useAdaptiveQuality

Access quality settings without component-specific tracking:

```typescript
import { useAdaptiveQuality } from '@philjs/neural';

function QualityAwareComponent() {
  const { level, settings } = useAdaptiveQuality();

  // level: 0.0 to 1.0 (raw quality level)
  // settings: { enableShadows, enableAnimations, imageQuality, renderResolution, enableBlur }

  return (
    <div>
      {settings.enableAnimations && <AnimatedBackground />}
      {settings.enableShadows && <ShadowOverlay />}
      {settings.enableBlur && <BlurredBackdrop />}

      <p>Quality: {(level * 100).toFixed(0)}%</p>
    </div>
  );
}
```

### usePredictiveRendering

Get render predictions for a set of components:

```typescript
import { usePredictiveRendering } from '@philjs/neural';

function SmartLoader() {
  const predictions = usePredictiveRendering([
    'heavy-component-a',
    'heavy-component-b',
    'heavy-component-c'
  ]);

  // Prerender components with high probability
  const toPrerender = predictions
    .filter(p => p.shouldPrerender)
    .map(p => p.componentId);

  return (
    <>
      {toPrerender.map(id => (
        <div key={id} style={{ display: 'none' }}>
          <PrerenderedComponent id={id} />
        </div>
      ))}
    </>
  );
}
```

### useLayoutOptimization

Get layout optimization suggestions:

```typescript
import { useLayoutOptimization } from '@philjs/neural';

function OptimizedLayout() {
  const elements = new Map([
    ['header', { x: 0, y: 0, width: 1200, height: 80 }],
    ['main', { x: 0, y: 80, width: 900, height: 800 }],
    ['sidebar', { x: 900, y: 80, width: 300, height: 800 }]
  ]);

  const suggestions = useLayoutOptimization(elements);

  // Apply suggestions to improve performance
  const getStyles = (elementId: string) => {
    const suggestion = suggestions.find(s => s.elementId === elementId);
    if (!suggestion) return {};

    return {
      willChange: suggestion.suggestedLayout.willChange,
      contain: suggestion.suggestedLayout.containment
    };
  };

  return (
    <div>
      <header style={getStyles('header')}>Header</header>
      <main style={getStyles('main')}>Main Content</main>
      <aside style={getStyles('sidebar')}>Sidebar</aside>
    </div>
  );
}
```

## Global Renderer Management

### initNeuralRenderer

Initialize the global neural renderer:

```typescript
import { initNeuralRenderer } from '@philjs/neural';

// Call once at app startup
const renderer = initNeuralRenderer({
  predictiveRendering: true,
  targetFPS: 60,
  adaptiveQuality: true,
  modelSize: 'small'
});

// The renderer automatically starts
```

### getNeuralRenderer

Access the global renderer instance:

```typescript
import { getNeuralRenderer } from '@philjs/neural';

const renderer = getNeuralRenderer();

if (renderer) {
  const quality = renderer.getQualityLevel();
  console.log(`Current quality: ${(quality * 100).toFixed(0)}%`);
}
```

## Low-Level API

### Tensor Operations

The package includes a lightweight tensor library for neural network operations:

```typescript
import { Tensor, NeuralNetwork } from '@philjs/neural';

// Create tensors
const zeros = Tensor.zeros([2, 3]);      // 2x3 tensor of zeros
const random = Tensor.random([4, 4]);    // 4x4 tensor with random values

// Create from data
const data = new Tensor(
  new Float32Array([1, 2, 3, 4]),
  [2, 2]
);

// Operations
const sum = data.add(zeros);            // Element-wise addition
const product = data.multiply(random);  // Element-wise multiplication
const matmul = data.matmul(other);      // Matrix multiplication

// Activations
const relu = data.relu();               // ReLU activation
const sigmoid = data.sigmoid();         // Sigmoid activation
const softmax = data.softmax();         // Softmax activation
```

### Building Custom Networks

```typescript
import { NeuralNetwork } from '@philjs/neural';

// Create a custom neural network
const network = new NeuralNetwork();

// Add layers (input size, output size)
network.addLayer(10, 32);  // Input layer
network.addLayer(32, 16);  // Hidden layer
network.addLayer(16, 4);   // Output layer

// Forward pass
const input = new Tensor(new Float32Array([...features]), [1, 10]);
const output = network.forward(input);

// Output shape is [1, 4]
console.log(output.data);
```

### Render Predictor

Direct access to the render prediction engine:

```typescript
import { RenderPredictor } from '@philjs/neural';

const predictor = new RenderPredictor('medium'); // 'tiny' | 'small' | 'medium'

// Record render history
predictor.recordRender({
  timestamp: Date.now(),
  componentId: 'my-component',
  renderTime: 5.2,
  triggerType: 'state',
  parentId: 'parent-component'
});

// Get predictions
const predictions = predictor.predict(['comp-a', 'comp-b', 'comp-c']);
```

### Adaptive Quality Manager

Direct access to quality management:

```typescript
import { AdaptiveQualityManager } from '@philjs/neural';

const manager = new AdaptiveQualityManager(60); // Target FPS

// Record frame metrics
manager.recordFrame(16.7, 0.3);  // frameTime, memoryPressure

// Get current quality
const level = manager.getQualityLevel();      // 0.3 to 1.0
const settings = manager.getQualitySettings(); // Full settings object
```

### Component Prioritizer

Direct access to component prioritization:

```typescript
import { ComponentPrioritizer } from '@philjs/neural';

const prioritizer = new ComponentPrioritizer();

// Observe elements
prioritizer.observe(document.getElementById('my-element'), 'my-component');

// Record interactions
prioritizer.recordInteraction('my-component');

// Record render costs
prioritizer.recordRenderCost('my-component', 5.2);

// Get priorities
const priorities = prioritizer.getPriorities(['comp-a', 'comp-b']);

// Clean up
prioritizer.destroy();
```

### Neural Layout Optimizer

Direct access to layout optimization:

```typescript
import { NeuralLayoutOptimizer } from '@philjs/neural';

const optimizer = new NeuralLayoutOptimizer();

// Record layout history
optimizer.recordLayout('element-id', {
  x: 100,
  y: 200,
  width: 300,
  height: 150
});

// Get suggestions
const elements = new Map([
  ['elem-1', { x: 0, y: 0, width: 200, height: 100 }],
  ['elem-2', { x: 0, y: 120, width: 200, height: 100 }]
]);

const suggestions = optimizer.getSuggestions(elements);
```

## Types Reference

### NeuralRendererConfig

```typescript
interface NeuralRendererConfig {
  predictiveRendering?: boolean;
  targetFPS?: number;
  adaptiveQuality?: boolean;
  modelSize?: 'tiny' | 'small' | 'medium';
  offlineMode?: boolean;
  useGPU?: boolean;
  memoryBudget?: number;
}
```

### RenderPrediction

```typescript
interface RenderPrediction {
  componentId: string;
  probability: number;           // 0.0 to 1.0
  estimatedRenderTime: number;   // Milliseconds
  priority: 'critical' | 'high' | 'medium' | 'low';
  shouldPrerender: boolean;
}
```

### FrameAnalysis

```typescript
interface FrameAnalysis {
  frameTime: number;              // Milliseconds
  jankScore: number;              // 0.0 to 1.0 (higher = more jank)
  componentsRendered: number;
  predictedNextFrame: RenderPrediction[];
  qualityLevel: number;           // 0.0 to 1.0
  memoryUsage: number;            // MB
}
```

### NeuralLayoutSuggestion

```typescript
interface NeuralLayoutSuggestion {
  elementId: string;
  currentLayout: LayoutMetrics;
  suggestedLayout: LayoutMetrics;
  performanceGain: number;        // Percentage
  reason: string;
}
```

### LayoutMetrics

```typescript
interface LayoutMetrics {
  x: number;
  y: number;
  width: number;
  height: number;
  willChange?: string;
  containment?: string;
}
```

### ComponentPriority

```typescript
interface ComponentPriority {
  id: string;
  visibility: number;             // 0.0 to 1.0
  interactionLikelihood: number;  // 0.0 to 1.0
  renderCost: number;             // 0.0 to 1.0
  priority: number;               // Computed priority score
}
```

### QualitySettings

```typescript
interface QualitySettings {
  enableShadows: boolean;
  enableAnimations: boolean;
  imageQuality: 'low' | 'medium' | 'high';
  renderResolution: number;       // 0.3 to 1.0
  enableBlur: boolean;
}
```

## API Reference

| Export | Type | Description |
|--------|------|-------------|
| `NeuralRenderer` | Class | Main renderer class with all optimization features |
| `initNeuralRenderer` | Function | Initialize global renderer instance |
| `getNeuralRenderer` | Function | Get global renderer instance |
| `useNeuralRendering` | Hook | Per-component neural rendering integration |
| `useAdaptiveQuality` | Hook | Access adaptive quality settings |
| `usePredictiveRendering` | Hook | Get render predictions |
| `useLayoutOptimization` | Hook | Get layout optimization suggestions |
| `RenderPredictor` | Class | Neural network-based render prediction |
| `AdaptiveQualityManager` | Class | FPS-aware quality management |
| `ComponentPrioritizer` | Class | Visibility and interaction-based prioritization |
| `NeuralLayoutOptimizer` | Class | Layout optimization suggestions |
| `Tensor` | Class | Lightweight tensor operations |
| `NeuralNetwork` | Class | Simple feedforward neural network |

## Best Practices

1. **Initialize Early**: Call `initNeuralRenderer()` at app startup before rendering
2. **Use Unique IDs**: Ensure component IDs are unique and consistent across renders
3. **Record Renders**: Use `recordRender()` to help the model learn your app's patterns
4. **Track Interactions**: Call `recordInteraction()` on user events for better prioritization
5. **Respect Quality Settings**: Honor `quality.enableAnimations`, `quality.enableShadows`, etc.
6. **Progressive Enhancement**: Gracefully degrade when quality is low
7. **Measure Impact**: Use `analyzeFrame()` to monitor performance improvements

## Performance Tips

```typescript
// Disable expensive features when quality is low
function MyComponent() {
  const { quality } = useNeuralRendering('my-component');

  return (
    <div>
      {/* Only render expensive blur when quality allows */}
      {quality.enableBlur && <BlurredBackground />}

      {/* Use simpler shadows at lower quality */}
      <Card shadow={quality.enableShadows ? 'large' : 'none'}>

        {/* Reduce image quality dynamically */}
        <Image
          src="/photo.jpg"
          quality={quality.imageQuality === 'high' ? 90 :
                   quality.imageQuality === 'medium' ? 60 : 30}
        />

        {/* Skip animations when needed */}
        <Button
          animated={quality.enableAnimations}
          onClick={handleClick}
        >
          Submit
        </Button>
      </Card>
    </div>
  );
}
```

## Troubleshooting

### Quality Never Increases

The adaptive quality manager needs enough frame samples before increasing quality:

```typescript
// Ensure renderer is running and recording frames
const renderer = initNeuralRenderer({ targetFPS: 60 });
renderer.start();

// Quality will gradually increase if FPS is stable above target
```

### Predictions Are Inaccurate

The prediction model needs training data:

```typescript
// Record renders consistently
function MyComponent() {
  const { recordRender } = useNeuralRendering('my-component');

  useEffect(() => {
    const start = performance.now();
    // Component render logic...
    recordRender(performance.now() - start);
  });
}
```

### Memory Usage Is High

Adjust the memory budget and model size:

```typescript
const renderer = initNeuralRenderer({
  modelSize: 'tiny',      // Use smaller model
  memoryBudget: 25        // Reduce memory budget
});
```
