# @philjs/xr

WebXR components for building VR, AR, and MR experiences with hand tracking, spatial UI, and XR-optimized rendering.

## Installation

```bash
npm install @philjs/xr
```

## Features

- **VR/AR/MR Support** - Immersive headset experiences
- **Hand Tracking** - Full skeletal hand tracking with gestures
- **Spatial UI** - 3D panels, buttons, sliders, text
- **Hit Testing** - AR surface detection and placement
- **Anchors** - Persistent AR world anchors
- **Haptic Feedback** - Controller vibration
- **Cross-Platform** - Quest, Vision Pro, HoloLens, WebXR browsers

## Quick Start

```typescript
import { initXR, useXR, useXRHand } from '@philjs/xr';

// Initialize XR
const manager = initXR({
  mode: 'immersive-vr',
  handTracking: true,
});

// Start session
const session = await manager.startSession();

// Get hand state
const leftHand = manager.getHand('left');
console.log('Pinch strength:', leftHand?.pinchStrength);
```

## XR Session Manager

### Configuration

```typescript
import { XRSessionManager } from '@philjs/xr';

const manager = new XRSessionManager({
  mode: 'immersive-vr',           // 'inline' | 'immersive-vr' | 'immersive-ar'
  referenceSpace: 'local-floor',  // 'viewer' | 'local' | 'local-floor' | 'bounded-floor' | 'unbounded'
  requiredFeatures: [],
  optionalFeatures: ['hand-tracking', 'hit-test'],
  handTracking: true,
  hitTest: false,
  anchors: false,
  frameRate: 72,
});
```

### Checking Support

```typescript
// Check if XR is supported
const vrSupported = await manager.isSupported('immersive-vr');
const arSupported = await manager.isSupported('immersive-ar');
```

### Starting a Session

```typescript
const session = await manager.startSession();

if (session) {
  console.log('XR session started');

  // Set frame callback
  manager.setFrameCallback((time, frame) => {
    // Render your scene
    render(time, frame);
  });
}
```

### Ending a Session

```typescript
await manager.endSession();
```

## Controllers

### Getting Controller State

```typescript
const controllers = manager.getControllers();

controllers.forEach((state, index) => {
  console.log(`Controller ${index}:`, {
    connected: state.connected,
    handedness: state.handedness,
    position: state.position,
    rotation: state.rotation,
    buttons: state.buttons,
    axes: state.axes,
  });
});
```

### Controller State

```typescript
interface XRControllerState {
  connected: boolean;
  handedness: 'left' | 'right' | 'none';
  position: Vector3;
  rotation: Quaternion;
  buttons: XRButtonState[];
  axes: number[];
  hapticActuators: GamepadHapticActuator[];
}

interface XRButtonState {
  pressed: boolean;
  touched: boolean;
  value: number;  // 0-1 for triggers
}
```

### Haptic Feedback

```typescript
// Trigger vibration on controller
manager.triggerHaptic(
  0,      // Controller index
  0.5,    // Intensity (0-1)
  100     // Duration in ms
);
```

## Hand Tracking

### Getting Hand State

```typescript
const leftHand = manager.getHand('left');
const rightHand = manager.getHand('right');

if (leftHand) {
  console.log('Left hand:', {
    pinchStrength: leftHand.pinchStrength,
    gripStrength: leftHand.gripStrength,
    joints: leftHand.joints,
  });
}
```

### Joint Names

```typescript
type XRHandJoint =
  | 'wrist'
  | 'thumb-metacarpal' | 'thumb-phalanx-proximal' | 'thumb-phalanx-distal' | 'thumb-tip'
  | 'index-finger-metacarpal' | 'index-finger-phalanx-proximal' | 'index-finger-phalanx-intermediate' | 'index-finger-phalanx-distal' | 'index-finger-tip'
  | 'middle-finger-metacarpal' | 'middle-finger-phalanx-proximal' | 'middle-finger-phalanx-intermediate' | 'middle-finger-phalanx-distal' | 'middle-finger-tip'
  | 'ring-finger-metacarpal' | 'ring-finger-phalanx-proximal' | 'ring-finger-phalanx-intermediate' | 'ring-finger-phalanx-distal' | 'ring-finger-tip'
  | 'pinky-finger-metacarpal' | 'pinky-finger-phalanx-proximal' | 'pinky-finger-phalanx-intermediate' | 'pinky-finger-phalanx-distal' | 'pinky-finger-tip';
```

### Joint State

```typescript
interface XRJointState {
  position: Vector3;
  rotation: Quaternion;
  radius: number;
}

// Access specific joint
const indexTip = leftHand.joints.get('index-finger-tip');
console.log('Index tip position:', indexTip?.position);
```

## Gesture Recognition

### Built-in Gestures

```typescript
import { GestureRecognizer, useGesture } from '@philjs/xr';

const recognizer = new GestureRecognizer();

// Listen for gestures
recognizer.onGesture('pinch', (event) => {
  console.log('Pinch detected:', {
    hand: event.hand,
    confidence: event.confidence,
    position: event.position,
  });
});

// Recognize in frame callback
manager.setFrameCallback((time, frame) => {
  const leftHand = manager.getHand('left');
  if (leftHand) {
    recognizer.recognize(leftHand);
  }
});
```

### Gesture Types

```typescript
type GestureType =
  | 'pinch'      // Thumb and index touching
  | 'grab'       // Closed fist
  | 'point'      // Index extended
  | 'thumbs-up'  // Thumb up, fingers closed
  | 'peace'      // Index and middle extended
  | 'fist'       // All fingers closed
  | 'open-palm'; // All fingers extended
```

### Gesture Hook

```typescript
import { useGesture } from '@philjs/xr';

useGesture('pinch', (event) => {
  // Handle pinch gesture
  selectObject(event.position);
});
```

## AR Hit Testing

### Enabling Hit Test

```typescript
const manager = new XRSessionManager({
  mode: 'immersive-ar',
  hitTest: true,
});

await manager.startSession();
```

### Performing Hit Tests

```typescript
manager.setFrameCallback(async (time, frame) => {
  const results = await manager.performHitTest(frame);

  for (const hit of results) {
    console.log('Hit:', {
      position: hit.position,
      rotation: hit.rotation,
      plane: hit.plane, // { orientation: 'horizontal' | 'vertical', polygon: Vector3[] }
    });
  }
});
```

### Placing Objects

```typescript
async function placeObject(frame: XRFrame) {
  const hits = await manager.performHitTest(frame);

  if (hits.length > 0) {
    const hit = hits[0];

    // Create anchor at hit location
    const anchor = await manager.createAnchor(hit.position, hit.rotation);

    if (anchor) {
      spawnObject(anchor.position, anchor.rotation);
    }
  }
}
```

## Anchors (AR)

### Creating Anchors

```typescript
import { useAnchors } from '@philjs/xr';

const { create, getAll } = useAnchors();

// Create anchor at position
const anchor = await create(
  { x: 0, y: 0, z: -1 },  // Position
  { x: 0, y: 0, z: 0, w: 1 } // Rotation
);

console.log('Created anchor:', anchor?.id);
```

### Managing Anchors

```typescript
// Get all anchors
const anchors = getAll();

anchors.forEach((anchor, id) => {
  console.log(`Anchor ${id}:`, {
    position: anchor.position,
    rotation: anchor.rotation,
    isTracking: anchor.isTracking,
  });
});
```

## Spatial UI Components

### XR Panel

```typescript
import { createXRPanel } from '@philjs/xr';

const panel = createXRPanel({
  position: { x: 0, y: 1.5, z: -1 },
  width: 0.5,
  height: 0.3,
  backgroundColor: '#ffffff',
  borderRadius: 0.02,
  billboard: true, // Face the user
});
```

### XR Button

```typescript
import { createXRButton } from '@philjs/xr';

const button = createXRButton({
  position: { x: 0, y: 1.5, z: -1 },
  label: 'Click Me',
  onClick: () => console.log('Button clicked!'),
  onHover: () => console.log('Button hovered'),
  hapticFeedback: true,
});
```

### XR Slider

```typescript
import { createXRSlider } from '@philjs/xr';

const slider = createXRSlider({
  position: { x: 0, y: 1.3, z: -1 },
  min: 0,
  max: 100,
  value: 50,
  onChange: (value) => console.log('Value:', value),
  orientation: 'horizontal',
});
```

### XR Text

```typescript
import { createXRText } from '@philjs/xr';

const text = createXRText({
  position: { x: 0, y: 1.7, z: -1 },
  text: 'Hello VR!',
  fontSize: 0.05,
  color: '#000000',
  align: 'center',
  billboard: true,
});
```

### XR Model

```typescript
import { createXRModel } from '@philjs/xr';

const model = createXRModel({
  position: { x: 0, y: 0, z: -2 },
  src: '/models/robot.glb',
  scale: { x: 0.5, y: 0.5, z: 0.5 },
  animations: ['idle', 'walk', 'wave'],
  currentAnimation: 'idle',
  onLoad: () => console.log('Model loaded'),
});
```

## Vector Math Utilities

### Vec3

```typescript
import { Vec3 } from '@philjs/xr';

const a = Vec3.create(1, 2, 3);
const b = Vec3.create(4, 5, 6);

const sum = Vec3.add(a, b);
const diff = Vec3.sub(a, b);
const scaled = Vec3.scale(a, 2);
const length = Vec3.length(a);
const normalized = Vec3.normalize(a);
const dot = Vec3.dot(a, b);
const cross = Vec3.cross(a, b);
const distance = Vec3.distance(a, b);
const lerped = Vec3.lerp(a, b, 0.5);
```

### Quat (Quaternion)

```typescript
import { Quat } from '@philjs/xr';

const identity = Quat.identity();
const fromEuler = Quat.fromEuler(Math.PI / 4, 0, 0);
const multiplied = Quat.multiply(q1, q2);
const interpolated = Quat.slerp(q1, q2, 0.5);
```

## React-style Hooks

### useXR

```typescript
import { useXR } from '@philjs/xr';

function VRApp() {
  const {
    isSupported,
    startSession,
    endSession,
    session,
    referenceSpace,
  } = useXR();

  return (
    <button onClick={startSession}>
      Enter VR
    </button>
  );
}
```

### useXRControllers

```typescript
import { useXRControllers, useXRController } from '@philjs/xr';

// Get all controllers
const controllers = useXRControllers();

// Get specific controller
const leftController = useXRController(0);
```

### useXRHands

```typescript
import { useXRHands, useXRHand } from '@philjs/xr';

// Get all hands
const hands = useXRHands();

// Get specific hand
const leftHand = useXRHand('left');
const rightHand = useXRHand('right');
```

### useXRFrame

```typescript
import { useXRFrame } from '@philjs/xr';

useXRFrame((time, frame) => {
  // Called every XR frame
  updateScene(time);
  renderScene(frame);
});
```

### useHitTest

```typescript
import { useHitTest } from '@philjs/xr';

const performHitTest = useHitTest();

useXRFrame(async (time, frame) => {
  const hits = await performHitTest(frame);
  // Use hit results
});
```

## Types Reference

```typescript
// Session modes
type XRSessionMode = 'inline' | 'immersive-vr' | 'immersive-ar';

// Reference space types
type XRReferenceSpaceType = 'viewer' | 'local' | 'local-floor' | 'bounded-floor' | 'unbounded';

// Configuration
interface XRConfig {
  mode?: XRSessionMode;
  referenceSpace?: XRReferenceSpaceType;
  requiredFeatures?: string[];
  optionalFeatures?: string[];
  handTracking?: boolean;
  hitTest?: boolean;
  anchors?: boolean;
  frameRate?: number;
}

// Vector types
interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

// Hit test result
interface XRHitTestResultData {
  position: Vector3;
  rotation: Quaternion;
  plane?: {
    orientation: 'horizontal' | 'vertical';
    polygon: Vector3[];
  };
}

// Anchor
interface XRAnchor {
  id: string;
  position: Vector3;
  rotation: Quaternion;
  isTracking: boolean;
}
```

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `XRSessionManager` | Main XR session management |
| `GestureRecognizer` | Hand gesture detection |

### Factory Functions

| Function | Description |
|----------|-------------|
| `initXR(config)` | Initialize XR manager |
| `createXRPanel(props)` | Create spatial panel |
| `createXRButton(props)` | Create spatial button |
| `createXRSlider(props)` | Create spatial slider |
| `createXRText(props)` | Create spatial text |
| `createXRModel(props)` | Create 3D model |

### Hooks

| Hook | Description |
|------|-------------|
| `useXR()` | XR session control |
| `useXRControllers()` | All controller states |
| `useXRController(index)` | Single controller state |
| `useXRHands()` | All hand states |
| `useXRHand(handedness)` | Single hand state |
| `useGesture(type, callback)` | Gesture detection |
| `useXRFrame(callback)` | XR render loop |
| `useHitTest()` | AR hit testing |
| `useAnchors()` | AR anchor management |
