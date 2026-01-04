# @philjs/eye-tracking

Industry-first framework-native eye tracking for building gaze-based interfaces with webcam-based tracking, dwell click activation, attention heatmaps, reading pattern analysis, and accessibility features for motor impairments.

## Installation

```bash
npm install @philjs/eye-tracking
```

## Features

- **Webcam-Based Tracking** - WebGazer.js-style eye tracking using standard webcams
- **Calibration System** - Multi-point calibration with accuracy and precision metrics
- **Gaze-Aware Components** - Elements that respond to user gaze (enter, leave, dwell)
- **Dwell Click Activation** - Click buttons by looking at them for a configurable duration
- **Attention Heatmaps** - Visualize where users look with real-time heatmap overlays
- **Reading Pattern Analysis** - Detect reading direction, speed, regressions, and skipped areas
- **Gaze Cursor** - Visual feedback showing current gaze position
- **Fixation Detection** - Identify when users focus on specific points
- **Saccade Tracking** - Track rapid eye movements between fixations
- **React Hooks** - Easy integration with `useEyeTracking`, `useGazePoint`, and more
- **Accessibility** - Motor impairment support through gaze-based interaction

## Quick Start

```typescript
import { EyeTracker, DwellClick } from '@philjs/eye-tracking';

// Initialize eye tracker
const tracker = new EyeTracker({
  calibrationPoints: 9,
  smoothing: true,
  dwellThreshold: 500,
});

// Initialize and calibrate
await tracker.initialize();
const calibration = await tracker.calibrate();
console.log('Accuracy:', calibration.accuracy);

// Start tracking
tracker.start();

// Listen for gaze points
tracker.onGaze((point) => {
  console.log(`Looking at: ${point.x}, ${point.y}`);
  console.log(`Confidence: ${point.confidence}`);
});

// Enable dwell click (look at buttons to click)
const dwellClick = new DwellClick(tracker, 1000);

// Clean up
tracker.stop();
tracker.dispose();
```

## Eye Tracker Core

### Initialization

The `EyeTracker` class is the foundation for all eye tracking functionality. It handles camera access, gaze estimation, and event dispatching.

```typescript
import { EyeTracker } from '@philjs/eye-tracking';

const tracker = new EyeTracker({
  calibrationPoints: 9,       // Number of calibration points (default: 9)
  smoothing: true,            // Enable gaze smoothing (default: true)
  smoothingFactor: 0.3,       // Smoothing intensity 0-1 (default: 0.3)
  fixationThreshold: 30,      // Pixels for fixation detection (default: 30)
  fixationDuration: 100,      // Minimum fixation duration in ms (default: 100)
  dwellThreshold: 500,        // Dwell activation time in ms (default: 500)
  showGazeCursor: false,      // Show gaze cursor (default: false)
  recordData: false,          // Record gaze data (default: false)
});

// Initialize (requests camera permissions)
await tracker.initialize();

// Check if ready
console.log('Initialized:', tracker.isActive());
console.log('Calibrated:', tracker.isReady());
```

### Calibration

Calibration improves tracking accuracy by collecting reference data as users look at known screen positions.

```typescript
// Run calibration (shows fullscreen UI)
const result = await tracker.calibrate();

console.log('Accuracy:', result.accuracy);     // 0-1, higher is better
console.log('Precision:', result.precision);   // 0-1, higher is better

// Examine individual calibration points
for (const point of result.points) {
  console.log(`Target: (${point.target.x}, ${point.target.y})`);
  console.log(`Measured: (${point.measured.x}, ${point.measured.y})`);
  console.log(`Error: ${point.error}px`);
}
```

### Gaze Events

Subscribe to real-time gaze position updates and fixation events.

```typescript
// Track gaze position
const unsubscribeGaze = tracker.onGaze((point) => {
  console.log(`Position: (${point.x}, ${point.y})`);
  console.log(`Time: ${point.timestamp}`);
  console.log(`Confidence: ${point.confidence}`);
});

// Track fixations (sustained gaze at one location)
const unsubscribeFixation = tracker.onFixation((fixation) => {
  console.log(`Fixation at: (${fixation.x}, ${fixation.y})`);
  console.log(`Duration: ${fixation.duration}ms`);
  console.log(`Dispersal: ${fixation.dispersal}px`);
});

// Start tracking
tracker.start();

// Stop tracking
tracker.stop();

// Unsubscribe from events
unsubscribeGaze();
unsubscribeFixation();

// Clean up (stops camera, removes elements)
tracker.dispose();
```

## Gaze-Aware Elements

Create elements that respond to user gaze with enter, leave, and dwell events.

```typescript
import { EyeTracker, GazeAwareElement } from '@philjs/eye-tracking';

const tracker = new EyeTracker();
await tracker.initialize();
await tracker.calibrate();
tracker.start();

// Make an element gaze-aware
const button = document.querySelector('#my-button');
const gazeAware = new GazeAwareElement(button, tracker, 500); // 500ms dwell

// Listen for gaze events
gazeAware.on('enter', (event) => {
  console.log('User is looking at element');
  button.classList.add('gaze-hover');
});

gazeAware.on('leave', (event) => {
  console.log('User looked away');
  button.classList.remove('gaze-hover');
});

gazeAware.on('dwell', (event) => {
  console.log(`Dwelled for ${event.dwellTime}ms`);
  button.click(); // Activate on dwell
});

// Clean up
gazeAware.dispose();
```

### Gaze Event Details

```typescript
interface GazeEvent {
  type: 'enter' | 'leave' | 'dwell' | 'fixation';
  target: Element;           // The DOM element
  gazePoint: GazePoint;      // Current gaze position
  dwellTime?: number;        // Duration of dwell (for 'dwell' events)
  fixation?: Fixation;       // Fixation data (for 'fixation' events)
}
```

## Dwell Click

Enable hands-free clicking by looking at interactive elements for a specified duration.

```typescript
import { EyeTracker, DwellClick } from '@philjs/eye-tracking';

const tracker = new EyeTracker();
await tracker.initialize();
await tracker.calibrate();
tracker.start();

// Enable dwell click with 1 second threshold
const dwellClick = new DwellClick(tracker, 1000);

// Dwell click automatically works on:
// - <button> elements
// - <a> links
// - [role="button"] elements
// - [data-dwell-click] custom elements

// Shows a circular progress indicator while dwelling

// Change threshold at runtime
dwellClick.setThreshold(1500); // 1.5 seconds

// Clean up
dwellClick.dispose();
```

### Custom Dwell Targets

```html
<!-- Add data-dwell-click to any element -->
<div data-dwell-click onclick="handleClick()">
  Look here to activate
</div>

<span role="button" tabindex="0" onclick="doSomething()">
  Accessible button with dwell support
</span>
```

## Attention Heatmap

Visualize user attention patterns with real-time or recorded heatmaps.

```typescript
import { EyeTracker, AttentionHeatmap } from '@philjs/eye-tracking';

const tracker = new EyeTracker();
await tracker.initialize();
await tracker.calibrate();
tracker.start();

// Create and display heatmap
const heatmap = new AttentionHeatmap(tracker, {
  resolution: 10,        // Grid cell size in pixels (default: 10)
  radius: 25,            // Heat spread radius (default: 25)
  maxOpacity: 0.6,       // Maximum overlay opacity (default: 0.6)
  gradient: {            // Color stops by intensity
    0.4: 'blue',
    0.6: 'cyan',
    0.7: 'lime',
    0.8: 'yellow',
    1.0: 'red'
  }
});

// Start collecting and displaying
heatmap.start();

// Get areas with high attention
const hotspots = heatmap.getHotspots(0.7); // threshold 0-1
for (const spot of hotspots) {
  console.log(`Hotspot at (${spot.x}, ${spot.y}), intensity: ${spot.intensity}`);
}

// Export raw data for analysis
const data = heatmap.exportData(); // 2D array of intensities

// Clear accumulated data
heatmap.clear();

// Stop and remove overlay
heatmap.stop();
```

### Heatmap Visualization

The heatmap renders as a fixed overlay on top of your page content, using color gradients to show attention intensity:

- **Blue**: Low attention
- **Cyan/Green**: Medium attention
- **Yellow**: High attention
- **Red**: Peak attention (hotspots)

## Reading Pattern Analyzer

Analyze reading behavior including direction, speed, regressions, and comprehension patterns.

```typescript
import { EyeTracker, ReadingAnalyzer } from '@philjs/eye-tracking';

const tracker = new EyeTracker();
await tracker.initialize();
await tracker.calibrate();
tracker.start();

const analyzer = new ReadingAnalyzer(tracker);
analyzer.start();

// After user reads content...

// Detect reading direction
const direction = analyzer.getReadingDirection();
console.log('Direction:', direction); // 'ltr', 'rtl', or 'unknown'

// Measure reading metrics
const avgFixation = analyzer.getAverageFixationDuration();
console.log(`Average fixation: ${avgFixation}ms`);

const wpm = analyzer.getReadingSpeed();
console.log(`Estimated reading speed: ${wpm} words/minute`);

// Detect re-reading (regressions)
const regressionRate = analyzer.getRegressionRate();
console.log(`Regression rate: ${(regressionRate * 100).toFixed(1)}%`);

// Find skipped content
const skipped = analyzer.getSkippedAreas();
for (const area of skipped) {
  console.log(`Skipped area at (${area.x}, ${area.y}), ${area.width}x${area.height}`);
}

// Reset for new reading session
analyzer.reset();

// Stop analysis
analyzer.stop();
```

### Reading Metrics Explained

| Metric | Description | Typical Values |
|--------|-------------|----------------|
| Fixation Duration | Time spent on each focus point | 200-300ms for normal reading |
| Reading Speed | Estimated words per minute | 200-400 WPM for adults |
| Regression Rate | Percentage of backward eye movements | 10-15% is normal |
| Skipped Areas | Content gaps with no fixations | Indicates scanning or confusion |

## Gaze Cursor

Display a visual indicator showing where the user is currently looking.

```typescript
import { EyeTracker, GazeCursor } from '@philjs/eye-tracking';

const tracker = new EyeTracker();
await tracker.initialize();
await tracker.calibrate();
tracker.start();

const cursor = new GazeCursor(tracker);

// Show cursor
cursor.show();

// Customize appearance
cursor.setStyle({
  width: '30px',
  height: '30px',
  backgroundColor: 'rgba(59, 130, 246, 0.5)',
  borderColor: 'rgb(59, 130, 246)',
  borderRadius: '50%',
});

// Hide cursor
cursor.hide();

// Clean up
cursor.dispose();
```

### Default Cursor Appearance

The default gaze cursor is a semi-transparent red circle (20x20px) that smoothly follows the user's gaze position. Opacity reflects tracking confidence.

## React Hooks

### useEyeTracking

Main hook for initializing and managing eye tracking.

```typescript
import { useEyeTracking } from '@philjs/eye-tracking';

function EyeTrackingApp() {
  const {
    tracker,          // EyeTracker instance
    isInitialized,    // Camera ready
    isCalibrated,     // Calibration complete
    calibrate,        // Trigger calibration
    start,            // Start tracking
    stop,             // Stop tracking
  } = useEyeTracking({
    calibrationPoints: 9,
    smoothing: true,
  });

  async function handleSetup() {
    const result = await calibrate();
    if (result && result.accuracy > 0.8) {
      start();
    }
  }

  return (
    <div>
      <p>Initialized: {isInitialized ? 'Yes' : 'No'}</p>
      <p>Calibrated: {isCalibrated ? 'Yes' : 'No'}</p>
      <button onClick={handleSetup}>Calibrate & Start</button>
      <button onClick={stop}>Stop Tracking</button>
    </div>
  );
}
```

### useGazePoint

Subscribe to real-time gaze position updates.

```typescript
import { useEyeTracking, useGazePoint } from '@philjs/eye-tracking';

function GazeDisplay() {
  const { tracker, isCalibrated, start } = useEyeTracking();
  const gazePoint = useGazePoint(tracker);

  useEffect(() => {
    if (isCalibrated) start();
  }, [isCalibrated]);

  if (!gazePoint) return <p>Waiting for gaze data...</p>;

  return (
    <div>
      <p>X: {Math.round(gazePoint.x)}</p>
      <p>Y: {Math.round(gazePoint.y)}</p>
      <p>Confidence: {(gazePoint.confidence * 100).toFixed(0)}%</p>
    </div>
  );
}
```

### useGazeAware

Make elements respond to gaze with enter, leave, and dwell detection.

```typescript
import { useRef } from '@philjs/core';
import { useEyeTracking, useGazeAware } from '@philjs/eye-tracking';

function GazeButton() {
  const { tracker } = useEyeTracking();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { isGazing, dwellTime } = useGazeAware(buttonRef, tracker, {
    dwellThreshold: 500,
  });

  return (
    <button
      ref={buttonRef}
      style={{
        backgroundColor: isGazing ? '#3b82f6' : '#6b7280',
        transform: isGazing ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      {isGazing ? `Looking (${dwellTime}ms)` : 'Look at me!'}
    </button>
  );
}
```

### useDwellClick

Enable dwell-to-click functionality for accessibility.

```typescript
import { useEyeTracking, useDwellClick } from '@philjs/eye-tracking';

function AccessibleApp() {
  const { tracker, isCalibrated, calibrate, start } = useEyeTracking();

  const { setThreshold } = useDwellClick(tracker, 1000);

  async function enable() {
    await calibrate();
    start();
  }

  return (
    <div>
      <button onClick={enable}>Enable Gaze Control</button>
      <button onClick={() => setThreshold(500)}>Fast Dwell (500ms)</button>
      <button onClick={() => setThreshold(1500)}>Slow Dwell (1.5s)</button>

      {/* These buttons can be clicked by looking at them */}
      <button onClick={() => alert('Action 1!')}>Action 1</button>
      <button onClick={() => alert('Action 2!')}>Action 2</button>
    </div>
  );
}
```

### useAttentionHeatmap

Collect and analyze attention data.

```typescript
import { useEyeTracking, useAttentionHeatmap } from '@philjs/eye-tracking';

function HeatmapAnalytics() {
  const { tracker } = useEyeTracking();

  const { clear, getHotspots, exportData } = useAttentionHeatmap(tracker, {
    resolution: 10,
    radius: 25,
    maxOpacity: 0.6,
  });

  function analyzeAttention() {
    const hotspots = getHotspots(0.7);
    console.log('High attention areas:', hotspots.length);

    const data = exportData();
    // Send to analytics backend
  }

  return (
    <div>
      <button onClick={analyzeAttention}>Analyze</button>
      <button onClick={clear}>Clear Heatmap</button>
    </div>
  );
}
```

### useReadingAnalysis

Track and analyze reading patterns.

```typescript
import { useEyeTracking, useReadingAnalysis } from '@philjs/eye-tracking';

function ReadingMetrics() {
  const { tracker } = useEyeTracking();

  const {
    getReadingDirection,
    getAverageFixationDuration,
    getReadingSpeed,
    getRegressionRate,
    getSkippedAreas,
    reset,
  } = useReadingAnalysis(tracker);

  function showMetrics() {
    console.log('Direction:', getReadingDirection());
    console.log('Avg Fixation:', getAverageFixationDuration(), 'ms');
    console.log('Reading Speed:', getReadingSpeed(), 'WPM');
    console.log('Regression Rate:', getRegressionRate());
    console.log('Skipped Areas:', getSkippedAreas());
  }

  return (
    <div>
      <article>
        {/* Reading content here */}
        <p>Lorem ipsum dolor sit amet...</p>
      </article>
      <button onClick={showMetrics}>Show Metrics</button>
      <button onClick={reset}>Reset Analysis</button>
    </div>
  );
}
```

## Types Reference

```typescript
// Gaze point data
interface GazePoint {
  x: number;           // Screen X coordinate
  y: number;           // Screen Y coordinate
  timestamp: number;   // Unix timestamp
  confidence: number;  // 0-1 tracking confidence
}

// Fixation (sustained gaze)
interface Fixation {
  x: number;           // Center X
  y: number;           // Center Y
  startTime: number;   // Start timestamp
  duration: number;    // Duration in ms
  dispersal: number;   // Maximum deviation in pixels
}

// Saccade (rapid eye movement)
interface Saccade {
  startPoint: GazePoint;   // Starting position
  endPoint: GazePoint;     // Ending position
  duration: number;        // Duration in ms
  velocity: number;        // Pixels per ms
  amplitude: number;       // Distance in pixels
}

// Gaze event
interface GazeEvent {
  type: 'enter' | 'leave' | 'dwell' | 'fixation';
  target: Element;
  gazePoint: GazePoint;
  dwellTime?: number;      // For 'dwell' events
  fixation?: Fixation;     // For 'fixation' events
}

// Eye tracker configuration
interface EyeTrackingConfig {
  calibrationPoints?: number;    // Number of calibration points (default: 9)
  smoothing?: boolean;           // Enable gaze smoothing (default: true)
  smoothingFactor?: number;      // Smoothing intensity 0-1 (default: 0.3)
  fixationThreshold?: number;    // Pixels for fixation detection (default: 30)
  fixationDuration?: number;     // Min fixation duration in ms (default: 100)
  dwellThreshold?: number;       // Dwell activation time in ms (default: 500)
  showGazeCursor?: boolean;      // Show gaze cursor (default: false)
  recordData?: boolean;          // Record gaze data (default: false)
}

// Heatmap configuration
interface HeatmapConfig {
  resolution?: number;           // Grid cell size in pixels (default: 10)
  radius?: number;               // Heat spread radius (default: 25)
  maxOpacity?: number;           // Maximum overlay opacity (default: 0.6)
  gradient?: {                   // Color stops by intensity
    [key: number]: string;
  };
}

// Calibration result
interface CalibrationResult {
  accuracy: number;              // 0-1, higher is better
  precision: number;             // 0-1, higher is better
  points: Array<{
    target: { x: number; y: number };
    measured: { x: number; y: number };
    error: number;               // Distance in pixels
  }>;
}

// Callback types
type GazeCallback = (point: GazePoint) => void;
type GazeEventCallback = (event: GazeEvent) => void;
```

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `EyeTracker` | Core eye tracking with calibration, gaze, and fixation events |
| `GazeAwareElement` | Make DOM elements respond to gaze (enter, leave, dwell) |
| `DwellClick` | Enable click-by-looking on interactive elements |
| `AttentionHeatmap` | Visualize attention patterns with color-coded overlay |
| `ReadingAnalyzer` | Analyze reading patterns, speed, and comprehension |
| `GazeCursor` | Visual indicator for current gaze position |

### Hooks

| Hook | Description |
|------|-------------|
| `useEyeTracking(config?)` | Initialize and manage eye tracking |
| `useGazePoint(tracker)` | Subscribe to real-time gaze position |
| `useGazeAware(ref, tracker, options?)` | Make element respond to gaze |
| `useDwellClick(tracker, threshold?)` | Enable dwell-to-click |
| `useAttentionHeatmap(tracker, config?)` | Collect attention data |
| `useReadingAnalysis(tracker)` | Analyze reading patterns |

### EyeTracker Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `initialize()` | `Promise<void>` | Request camera and set up tracking |
| `calibrate()` | `Promise<CalibrationResult>` | Run calibration UI |
| `start()` | `void` | Start gaze tracking |
| `stop()` | `void` | Stop gaze tracking |
| `onGaze(callback)` | `() => void` | Subscribe to gaze events |
| `onFixation(callback)` | `() => void` | Subscribe to fixation events |
| `isActive()` | `boolean` | Check if tracking is running |
| `isReady()` | `boolean` | Check if calibrated |
| `dispose()` | `void` | Clean up resources |

## Browser Requirements

- **Camera Access**: Requires `getUserMedia` permission
- **Modern Browser**: Chrome 90+, Firefox 85+, Safari 14+, Edge 90+
- **HTTPS**: Camera access requires secure context (HTTPS or localhost)

```typescript
// Check for support
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  // Eye tracking supported
} else {
  // Fallback or error message
}
```

## Accessibility Use Cases

The @philjs/eye-tracking package enables powerful accessibility features for users with motor impairments:

### Hands-Free Navigation

```typescript
import { EyeTracker, DwellClick, VoiceNavigation } from '@philjs/eye-tracking';

// Combine eye tracking with voice for complete hands-free control
const tracker = new EyeTracker({ dwellThreshold: 1000 });
await tracker.initialize();
await tracker.calibrate();
tracker.start();

// Enable dwell click
const dwellClick = new DwellClick(tracker, 1000);

// Add visual feedback for gaze targets
document.querySelectorAll('button, a, [role="button"]').forEach(el => {
  const gazeAware = new GazeAwareElement(el, tracker);

  gazeAware.on('enter', () => {
    el.classList.add('gaze-highlight');
  });

  gazeAware.on('leave', () => {
    el.classList.remove('gaze-highlight');
  });
});
```

### Gaze-Based Scrolling

```typescript
import { EyeTracker } from '@philjs/eye-tracking';

const tracker = new EyeTracker();
await tracker.initialize();
await tracker.calibrate();
tracker.start();

// Scroll when looking at top or bottom of screen
tracker.onGaze((point) => {
  const threshold = 100; // pixels from edge

  if (point.y < threshold) {
    window.scrollBy(0, -5); // Scroll up
  } else if (point.y > window.innerHeight - threshold) {
    window.scrollBy(0, 5);  // Scroll down
  }
});
```

## Performance Considerations

- **Camera Resolution**: 640x480 is sufficient for accurate tracking
- **Frame Rate**: Tracking runs at display refresh rate (~60 FPS)
- **Smoothing**: Enable smoothing to reduce jitter (slight latency tradeoff)
- **Calibration**: 9-point calibration provides good accuracy/speed balance

```typescript
// Optimized configuration for low-end devices
const tracker = new EyeTracker({
  calibrationPoints: 5,     // Faster calibration
  smoothingFactor: 0.4,     // More smoothing
  fixationThreshold: 40,    // Less sensitive
});
```
