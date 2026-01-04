# @philjs/gesture

Camera-based hand gesture recognition using MediaPipe/TensorFlow.js for touchless UI control.

## Installation

```bash
npm install @philjs/gesture
```

## Features

- **Hand Tracking** - Real-time hand detection via camera
- **Gesture Recognition** - Built-in and custom gestures
- **Motion Detection** - Swipes, circles, pinches, rotations
- **Air Cursor** - Control UI with finger pointing
- **Gesture Sequences** - Multi-gesture combinations
- **Touchless UI** - Navigate apps without touching

## Quick Start

```typescript
import { GestureController } from '@philjs/gesture';

const controller = new GestureController();
await controller.initialize();

controller.onGesture('point', (event) => {
  console.log('Pointing detected:', event);
});

controller.onGesture('swipeLeft', (event) => {
  navigateBack();
});

controller.enableAirCursor();
controller.start();
```

## Hand Tracking

### Basic Hand Tracking

```typescript
import { HandTracker } from '@philjs/gesture';

const tracker = new HandTracker({
  maxHands: 2,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.5,
  smoothing: true,
  smoothingFactor: 0.5,
});

await tracker.initialize();

tracker.onHands((hands) => {
  hands.forEach(hand => {
    console.log(`${hand.handedness} hand:`, {
      confidence: hand.confidence,
      boundingBox: hand.boundingBox,
      landmarks: hand.landmarks,
    });
  });
});

tracker.start();
```

### Hand Landmarks

```typescript
type HandLandmarkName =
  | 'wrist'
  | 'thumb_cmc' | 'thumb_mcp' | 'thumb_ip' | 'thumb_tip'
  | 'index_mcp' | 'index_pip' | 'index_dip' | 'index_tip'
  | 'middle_mcp' | 'middle_pip' | 'middle_dip' | 'middle_tip'
  | 'ring_mcp' | 'ring_pip' | 'ring_dip' | 'ring_tip'
  | 'pinky_mcp' | 'pinky_pip' | 'pinky_dip' | 'pinky_tip';

// Access landmark positions
const indexTip = hand.landmarks.find(l => l.name === 'index_tip');
console.log('Index finger tip:', indexTip?.position);
```

### Hand State

```typescript
interface Hand {
  id: string;
  handedness: 'left' | 'right';
  landmarks: HandLandmark[];
  boundingBox: BoundingBox;
  confidence: number;
}

interface HandLandmark {
  index: number;
  name: HandLandmarkName;
  position: Point3D;  // x, y, z (normalized 0-1)
  visibility: number;
}
```

## Gesture Recognition

### Built-in Gestures

```typescript
import { GestureRecognizer } from '@philjs/gesture';

const recognizer = new GestureRecognizer();

// Point - Index finger extended
recognizer.onGesture('point', callback);

// Peace - Index and middle extended
recognizer.onGesture('peace', callback);

// Thumbs up
recognizer.onGesture('thumbsUp', callback);

// Open palm - All fingers extended
recognizer.onGesture('openPalm', callback);

// Fist - All fingers closed
recognizer.onGesture('fist', callback);

// OK - Thumb and index touching, others extended
recognizer.onGesture('ok', callback);

// Pinch - Thumb and index touching
recognizer.onGesture('pinch', callback);

// Swipe gestures
recognizer.onGesture('swipeLeft', callback);
recognizer.onGesture('swipeRight', callback);
recognizer.onGesture('swipeUp', callback);
recognizer.onGesture('swipeDown', callback);

// Grab and wave
recognizer.onGesture('grab', callback);
recognizer.onGesture('wave', callback);
```

### Recognizing Gestures

```typescript
tracker.onHands((hands) => {
  const recognized = recognizer.recognize(hands);

  recognized.forEach(gesture => {
    console.log('Gesture:', {
      name: gesture.name,
      confidence: gesture.confidence,
      hand: gesture.hand.handedness,
      timestamp: gesture.timestamp,
    });
  });
});
```

### Custom Gestures

```typescript
recognizer.registerGesture({
  name: 'rockOn',
  fingerStates: [
    { finger: 'thumb', extended: true },
    { finger: 'index', extended: true },
    { finger: 'middle', extended: false },
    { finger: 'ring', extended: false },
    { finger: 'pinky', extended: true },
  ],
});

recognizer.onGesture('rockOn', (event) => {
  console.log('Rock on! 🤘');
});
```

### Gesture Definition

```typescript
interface GestureDefinition {
  name: string;
  fingerStates: FingerState[];
  palmOrientation?: 'up' | 'down' | 'left' | 'right' | 'forward' | 'backward';
  motion?: MotionPattern;
  holdDuration?: number;  // ms to hold gesture
}

interface FingerState {
  finger: 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';
  extended: boolean;
  curled?: boolean;
  touching?: 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';
}
```

### Gesture Sequences

```typescript
// Register a sequence (e.g., double thumbs up)
recognizer.registerSequence({
  name: 'doubleThumbs',
  gestures: ['thumbsUp', 'fist', 'thumbsUp'],
  maxInterval: 1000, // Max ms between gestures
});

recognizer.onGesture('doubleThumbs', (event) => {
  console.log('Double thumbs up sequence detected!');
});
```

## Motion Analysis

### Detecting Motion

```typescript
import { MotionAnalyzer } from '@philjs/gesture';

const analyzer = new MotionAnalyzer();

tracker.onHands((hands) => {
  for (const hand of hands) {
    const wrist = hand.landmarks.find(l => l.name === 'wrist');
    if (wrist) {
      analyzer.addPosition(hand.id, wrist.position);

      // Check for swipe
      const swipe = analyzer.detectSwipe(hand.id);
      if (swipe) {
        console.log('Swipe:', swipe.direction);
      }

      // Check for circle
      const circle = analyzer.detectCircle(hand.id);
      if (circle) {
        console.log('Circle:', circle.direction);
      }
    }
  }
});
```

### Motion Patterns

```typescript
interface MotionPattern {
  type: 'swipe' | 'circle' | 'pinch' | 'spread' | 'rotate' | 'wave' | 'tap' | 'grab';
  direction?: 'up' | 'down' | 'left' | 'right' | 'clockwise' | 'counterclockwise';
  speed?: 'slow' | 'normal' | 'fast';
  minDistance?: number;
}
```

### Velocity Tracking

```typescript
const velocity = analyzer.getVelocity(hand.id);
console.log('Hand velocity:', velocity);
// { x: 0.02, y: -0.01, z: 0 }
```

## Air Cursor

### Enabling Air Cursor

```typescript
import { AirCursor } from '@philjs/gesture';

const cursor = new AirCursor();

tracker.onHands((hands) => {
  if (hands.length > 0) {
    cursor.update(hands[0]);
    cursor.show();
  } else {
    cursor.hide();
  }
});
```

### Air Cursor Features

- Index finger tip controls cursor position
- Pinch (thumb + index) triggers click
- Visual feedback for hover and click states
- Automatic DOM event dispatching

### Air Cursor Events

```typescript
cursor.onClick(() => {
  console.log('Air click!');
});

// Get current position
const pos = cursor.getPosition();
console.log('Cursor at:', pos.x, pos.y);
```

## GestureController (All-in-One)

### Full Setup

```typescript
import { GestureController } from '@philjs/gesture';

const controller = new GestureController({
  maxHands: 2,
  minDetectionConfidence: 0.7,
  smoothing: true,
});

await controller.initialize();

// Listen for gestures
controller.onGesture('point', handlePoint);
controller.onGesture('swipeLeft', handleSwipeLeft);
controller.onGesture('pinch', handlePinch);

// Register custom gestures
controller.registerGesture({
  name: 'callMe',
  fingerStates: [
    { finger: 'thumb', extended: true },
    { finger: 'index', extended: false },
    { finger: 'middle', extended: false },
    { finger: 'ring', extended: false },
    { finger: 'pinky', extended: true },
  ],
});

// Enable air cursor
controller.enableAirCursor();

// Start tracking
controller.start();

// Later: stop and cleanup
controller.stop();
controller.dispose();
```

## Gesture Presets

```typescript
import { GesturePresets } from '@philjs/gesture';

// Navigation gestures
GesturePresets.navigation;
// { back: 'swipeRight', forward: 'swipeLeft', scrollUp: 'swipeUp', scrollDown: 'swipeDown' }

// Media control gestures
GesturePresets.media;
// { playPause: 'fist', volumeUp: 'swipeUp', volumeDown: 'swipeDown', skip: 'swipeRight', previous: 'swipeLeft' }

// Presentation gestures
GesturePresets.presentation;
// { nextSlide: 'swipeLeft', prevSlide: 'swipeRight', pointer: 'point', highlight: 'peace' }

// Gaming gestures
GesturePresets.gaming;
// { punch: 'fist', grab: 'grab', shoot: 'point', block: 'openPalm' }
```

## React-style Hooks

### useGestureController

```typescript
import { useGestureController } from '@philjs/gesture';

function GestureApp() {
  const { controller, isInitialized, start, stop } = useGestureController({
    maxHands: 2,
    smoothing: true,
  });

  return (
    <div>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </div>
  );
}
```

### useGesture

```typescript
import { useGesture } from '@philjs/gesture';

function MyComponent() {
  const { controller } = useGestureController();

  useGesture(controller, 'point', (event) => {
    console.log('Pointing!', event);
  });

  useGesture(controller, 'swipeLeft', () => {
    navigateBack();
  });

  return <div>Gesture-enabled component</div>;
}
```

### useAirCursor

```typescript
import { useAirCursor } from '@philjs/gesture';

function CursorComponent() {
  const { controller } = useGestureController();

  useAirCursor(controller, true); // Enable air cursor

  return <div>Air cursor enabled</div>;
}
```

### useHandTracking

```typescript
import { useHandTracking } from '@philjs/gesture';

function HandsDisplay() {
  const { hands, isTracking, start, stop } = useHandTracking();

  return (
    <div>
      <p>Tracking: {isTracking ? 'Yes' : 'No'}</p>
      <p>Hands detected: {hands.length}</p>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </div>
  );
}
```

## Types Reference

```typescript
// Hand and landmarks
interface Hand {
  id: string;
  handedness: 'left' | 'right';
  landmarks: HandLandmark[];
  boundingBox: BoundingBox;
  confidence: number;
}

interface HandLandmark {
  index: number;
  name: HandLandmarkName;
  position: Point3D;
  visibility: number;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

// Recognized gesture
interface RecognizedGesture {
  name: string;
  confidence: number;
  hand: Hand;
  timestamp: number;
  duration?: number;
}

// Configuration
interface GestureConfig {
  modelPath?: string;
  maxHands?: number;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
  smoothing?: boolean;
  smoothingFactor?: number;
}
```

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `HandTracker` | Camera-based hand detection |
| `GestureRecognizer` | Gesture pattern matching |
| `MotionAnalyzer` | Motion and swipe detection |
| `AirCursor` | Virtual cursor control |
| `GestureController` | All-in-one controller |

### Hooks

| Hook | Description |
|------|-------------|
| `useGestureController(config)` | Full gesture controller |
| `useGesture(controller, name, callback)` | Single gesture listener |
| `useAirCursor(controller, enabled)` | Air cursor toggle |
| `useHandTracking(config)` | Raw hand tracking |

## Example: Touchless Slideshow

```typescript
import { GestureController } from '@philjs/gesture';

async function TouchlessSlideshow() {
  const controller = new GestureController();
  await controller.initialize();

  let currentSlide = 0;

  controller.onGesture('swipeLeft', () => {
    currentSlide = Math.min(currentSlide + 1, totalSlides - 1);
    showSlide(currentSlide);
  });

  controller.onGesture('swipeRight', () => {
    currentSlide = Math.max(currentSlide - 1, 0);
    showSlide(currentSlide);
  });

  controller.onGesture('point', (event) => {
    // Show laser pointer at finger position
    updatePointer(event.hand);
  });

  controller.onGesture('thumbsUp', () => {
    // Like the presentation
    likePresentation();
  });

  controller.start();
}
```
