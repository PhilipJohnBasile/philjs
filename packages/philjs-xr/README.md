# @philjs/xr

WebXR Components for building immersive VR/AR/MR experiences with PhilJS. Features hand tracking, spatial UI, gesture recognition, and 3D reactive primitives.

## Installation

```bash
npm install @philjs/xr
```

## Requirements

- Node.js >= 24
- Browser with WebXR support (Chrome, Edge, Firefox, or compatible VR/AR headset browser)
- TypeScript 6.x (for development)

## Basic Usage

```typescript
import {
  initXR,
  useXR,
  useXRControllers,
  useXRHands,
  useGesture,
  Vec3,
  Quat
} from '@philjs/xr';

// Initialize XR with configuration
const manager = initXR({
  mode: 'immersive-vr',
  referenceSpace: 'local-floor',
  handTracking: true,
  frameRate: 72
});

// Start an XR session
const { startSession, endSession, session } = useXR();

async function enterVR() {
  const xrSession = await startSession();
  if (xrSession) {
    console.log('VR session started!');
  }
}

// Access controllers
const controllers = useXRControllers();
const leftController = useXRController(0);

// Access hand tracking
const hands = useXRHands();
const leftHand = useXRHand('left');

// Register gesture callbacks
useGesture('pinch', (event) => {
  console.log(`Pinch detected on ${event.hand} hand with confidence ${event.confidence}`);
});
```

## Spatial UI Components

```typescript
import {
  createXRPanel,
  createXRButton,
  createXRSlider,
  createXRText,
  createXRModel,
  Vec3
} from '@philjs/xr';

// Create a floating panel
const panel = createXRPanel({
  position: Vec3.create(0, 1.5, -2),
  width: 1,
  height: 0.5,
  backgroundColor: '#ffffff',
  billboard: true
});

// Create an interactive button
const button = createXRButton({
  position: Vec3.create(0, 1.6, -2),
  label: 'Click Me',
  onClick: () => console.log('Button clicked!'),
  hapticFeedback: true
});

// Create a slider control
const slider = createXRSlider({
  position: Vec3.create(0, 1.4, -2),
  min: 0,
  max: 100,
  value: 50,
  onChange: (value) => console.log('Slider value:', value)
});
```

## API Reference

### Initialization

- **`initXR(config?: XRConfig): XRSessionManager`** - Initialize the XR system
- **`getXRManager(): XRSessionManager | null`** - Get the global XR manager instance

### Hooks

- **`useXR()`** - Access XR session controls (isSupported, startSession, endSession, session, referenceSpace)
- **`useXRControllers()`** - Get all connected controllers
- **`useXRController(index: number)`** - Get a specific controller by index
- **`useXRHands()`** - Get all tracked hands
- **`useXRHand(handedness: 'left' | 'right')`** - Get a specific hand
- **`useGesture(gesture: GestureType, callback)`** - Register a gesture callback
- **`useXRFrame(callback)`** - Register a per-frame callback
- **`useHitTest()`** - Perform AR hit testing
- **`useAnchors()`** - Create and manage AR anchors

### Classes

- **`XRSessionManager`** - Core XR session management
- **`GestureRecognizer`** - Hand gesture detection

### Spatial UI Factories

- **`createXRPanel(props: XRPanelProps)`** - Create a floating UI panel
- **`createXRButton(props: XRButtonProps)`** - Create an interactive button
- **`createXRSlider(props: XRSliderProps)`** - Create a slider control
- **`createXRText(props: XRTextProps)`** - Create 3D text
- **`createXRModel(props: XRModelProps)`** - Load and display 3D models

### Math Utilities

- **`Vec3`** - 3D vector operations (create, add, sub, scale, normalize, dot, cross, distance, lerp)
- **`Quat`** - Quaternion operations (identity, fromEuler, multiply, slerp)

### Types

- `XRConfig` - Configuration options for XR sessions
- `XRSessionMode` - 'inline' | 'immersive-vr' | 'immersive-ar'
- `XRReferenceSpaceType` - 'viewer' | 'local' | 'local-floor' | 'bounded-floor' | 'unbounded'
- `XRControllerState` - Controller position, rotation, buttons, and haptics
- `XRHandState` - Hand tracking data with joint positions
- `XRHandJoint` - All 25 hand joint names
- `GestureType` - 'pinch' | 'grab' | 'point' | 'thumbs-up' | 'peace' | 'fist' | 'open-palm'
- `Vector3` - { x, y, z }
- `Quaternion` - { x, y, z, w }
- `SpatialUIProps` - Common props for spatial UI components

## Supported Gestures

The gesture recognizer supports the following hand gestures:

- **pinch** - Thumb and index finger touching
- **grab** - Closed fist gripping gesture
- **point** - Index finger extended
- **thumbs-up** - Thumb extended upward
- **peace** - Index and middle fingers extended
- **fist** - Fully closed hand
- **open-palm** - All fingers extended

## License

MIT
