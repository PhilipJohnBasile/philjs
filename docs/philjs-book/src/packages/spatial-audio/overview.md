# @philjs/spatial-audio

3D spatial audio with HRTF, room acoustics, ambisonics, audio paths, and VR/AR integration.

## Installation

```bash
npm install @philjs/spatial-audio
```

## Features

- **3D Positioning** - Place audio sources in 3D space
- **HRTF** - Head-Related Transfer Function for realistic spatialization
- **Room Acoustics** - Reverb, reflections, and room simulation
- **Ambisonics** - Higher-order ambisonic encoding/decoding
- **Audio Paths** - Animate audio sources along paths
- **Audio Scenes** - Manage multiple sources and listeners
- **VR/AR Sync** - Synchronize with XR head tracking

## Quick Start

```typescript
import { SpatialAudioContext, SpatialAudioSource } from '@philjs/spatial-audio';

// Create spatial audio context
const context = new SpatialAudioContext({
  hrtfEnabled: true,
  roomAcoustics: true,
});

await context.initialize();

// Create audio source at position
const source = context.createSource('/sounds/ambient.mp3', {
  position: { x: 5, y: 0, z: -3 },
  volume: 0.8,
  loop: true,
});

// Play
await source.play();

// Move source
source.setPosition({ x: -5, y: 2, z: 0 });

// Update listener position (player/camera)
context.listener.setPosition({ x: 0, y: 1.6, z: 0 });
context.listener.setOrientation({
  forward: { x: 0, y: 0, z: -1 },
  up: { x: 0, y: 1, z: 0 },
});
```

## SpatialAudioContext

### Configuration

```typescript
import { SpatialAudioContext } from '@philjs/spatial-audio';

const context = new SpatialAudioContext({
  // HRTF settings
  hrtfEnabled: true,
  hrtfPath: '/hrtf/default',      // HRTF dataset path

  // Room acoustics
  roomAcoustics: true,
  roomSize: { width: 10, height: 3, depth: 8 },
  roomMaterials: {
    walls: 'concrete',
    floor: 'wood',
    ceiling: 'acoustic_tile',
  },

  // Performance
  maxSources: 32,
  updateRate: 60,                  // Hz

  // Distance model
  distanceModel: 'inverse',        // 'linear' | 'inverse' | 'exponential'
  refDistance: 1,
  maxDistance: 100,
  rolloffFactor: 1,
});

await context.initialize();
```

### Listener Control

```typescript
// Set listener position
context.listener.setPosition({ x: 0, y: 1.6, z: 0 });

// Set orientation (forward and up vectors)
context.listener.setOrientation({
  forward: { x: 0, y: 0, z: -1 },
  up: { x: 0, y: 1, z: 0 },
});

// Or set with rotation (Euler angles in radians)
context.listener.setRotation({
  pitch: 0,
  yaw: Math.PI / 4,  // 45 degrees
  roll: 0,
});

// Set velocity for Doppler effect
context.listener.setVelocity({ x: 0, y: 0, z: -2 });

// Get current position
const pos = context.listener.getPosition();
```

### Master Controls

```typescript
// Master volume
context.setMasterVolume(0.8);

// Mute/unmute all
context.setMuted(true);
context.setMuted(false);

// Pause/resume all sources
context.pauseAll();
context.resumeAll();

// Stop all sources
context.stopAll();

// Suspend/resume audio context
await context.suspend();
await context.resume();
```

## SpatialAudioSource

### Creating Sources

```typescript
// From URL
const source = context.createSource('/sounds/footsteps.mp3', {
  position: { x: 5, y: 0, z: -3 },
  volume: 1.0,
  loop: false,
});

// From AudioBuffer
const buffer = await context.loadBuffer('/sounds/explosion.wav');
const source = context.createSource(buffer, {
  position: { x: 0, y: 0, z: 10 },
});

// From MediaStream
const micSource = context.createSource(micStream, {
  position: { x: 2, y: 1.5, z: 0 },
});

// From oscillator
const toneSource = context.createToneSource({
  type: 'sine',
  frequency: 440,
  position: { x: -3, y: 1, z: 2 },
});
```

### Source Properties

```typescript
// Position
source.setPosition({ x: 5, y: 2, z: -3 });
source.position = { x: 5, y: 2, z: -3 };

// Volume (0-1)
source.setVolume(0.8);

// Playback rate
source.setPlaybackRate(1.5);  // 1.5x speed

// Loop
source.setLoop(true);

// Panning model
source.setPanningModel('HRTF');  // 'HRTF' | 'equalpower'

// Distance model
source.setDistanceModel('inverse');
source.setRefDistance(1);
source.setMaxDistance(50);
source.setRolloffFactor(1);

// Cone (directional audio)
source.setCone({
  innerAngle: 60,     // Full volume cone (degrees)
  outerAngle: 120,    // Transition cone (degrees)
  outerGain: 0.2,     // Volume outside cone
});

// Velocity for Doppler
source.setVelocity({ x: 10, y: 0, z: 0 });
```

### Playback Control

```typescript
// Play
await source.play();

// Play from time
await source.play(5.0);  // Start at 5 seconds

// Pause
source.pause();

// Resume
source.resume();

// Stop
source.stop();

// Seek
source.seek(10.5);  // Jump to 10.5 seconds

// Get current time
const time = source.getCurrentTime();

// Get duration
const duration = source.getDuration();

// Check state
const isPlaying = source.isPlaying();
const isPaused = source.isPaused();
```

### Events

```typescript
source.on('play', () => console.log('Started playing'));
source.on('pause', () => console.log('Paused'));
source.on('stop', () => console.log('Stopped'));
source.on('ended', () => console.log('Finished'));
source.on('loop', () => console.log('Looped'));
source.on('error', (error) => console.error('Error:', error));
```

## RoomAcousticsProcessor

### Room Configuration

```typescript
import { RoomAcousticsProcessor } from '@philjs/spatial-audio';

const room = new RoomAcousticsProcessor(context, {
  // Room dimensions (meters)
  dimensions: { width: 10, height: 3, depth: 8 },

  // Material absorption coefficients
  materials: {
    left: 'brick',
    right: 'brick',
    front: 'glass',
    back: 'drywall',
    floor: 'wood',
    ceiling: 'acoustic_tile',
  },

  // Reverb settings
  reverb: {
    enabled: true,
    decay: 1.5,       // seconds
    preDelay: 0.01,   // seconds
    wetLevel: 0.3,    // mix (0-1)
    dryLevel: 0.7,
  },

  // Early reflections
  reflections: {
    enabled: true,
    order: 2,         // Number of reflection bounces
  },
});

// Apply to source
source.setRoomAcoustics(room);
```

### Room Presets

```typescript
import { RoomPresets } from '@philjs/spatial-audio';

// Use preset
room.applyPreset(RoomPresets.concertHall);

// Available presets
const presets = {
  smallRoom: { dimensions: {...}, reverb: {...} },
  concertHall: { dimensions: {...}, reverb: {...} },
  cathedral: { dimensions: {...}, reverb: {...} },
  outdoors: { dimensions: {...}, reverb: {...} },
  studio: { dimensions: {...}, reverb: {...} },
  bathroom: { dimensions: {...}, reverb: {...} },
  cave: { dimensions: {...}, reverb: {...} },
};

// Custom preset
room.savePreset('myRoom', room.getSettings());
room.applyPreset(room.getPreset('myRoom'));
```

### Dynamic Room Changes

```typescript
// Update room size
room.setDimensions({ width: 15, height: 4, depth: 12 });

// Update material
room.setMaterial('front', 'curtain');

// Update reverb
room.setReverbDecay(2.0);
room.setReverbWetLevel(0.4);

// Enable/disable
room.setEnabled(false);
room.setEnabled(true);
```

## AmbisonicsDecoder

### Basic Usage

```typescript
import { AmbisonicsDecoder } from '@philjs/spatial-audio';

const decoder = new AmbisonicsDecoder(context, {
  order: 1,                    // Ambisonics order (1-3)
  outputMode: 'binaural',      // 'binaural' | 'speakers'
  speakerLayout: 'stereo',     // For speaker output
});

// Decode ambisonic audio
const ambiSource = context.createSource('/audio/ambisonic.wav', {
  isAmbisonic: true,
  ambisonicOrder: 1,
});

decoder.connect(ambiSource);
await ambiSource.play();

// Rotate sound field
decoder.setRotation({ yaw: Math.PI / 2, pitch: 0, roll: 0 });
```

### Speaker Layouts

```typescript
// Stereo
decoder.setSpeakerLayout('stereo');

// Quadraphonic
decoder.setSpeakerLayout('quad');

// 5.1 Surround
decoder.setSpeakerLayout('5.1');

// 7.1 Surround
decoder.setSpeakerLayout('7.1');

// Custom speaker positions
decoder.setCustomSpeakers([
  { azimuth: -30, elevation: 0 },   // Front left
  { azimuth: 30, elevation: 0 },    // Front right
  { azimuth: -110, elevation: 0 },  // Rear left
  { azimuth: 110, elevation: 0 },   // Rear right
  { azimuth: 0, elevation: 0 },     // Center
  { azimuth: 0, elevation: -90 },   // LFE
]);
```

## AudioScene

### Scene Management

```typescript
import { AudioScene } from '@philjs/spatial-audio';

const scene = new AudioScene(context, {
  name: 'forest',
  autoPlay: false,
});

// Add sources to scene
scene.addSource('birds', '/sounds/birds.mp3', {
  position: { x: 5, y: 3, z: -2 },
  loop: true,
  volume: 0.6,
});

scene.addSource('stream', '/sounds/water.mp3', {
  position: { x: -3, y: 0, z: 4 },
  loop: true,
  volume: 0.8,
});

scene.addSource('wind', '/sounds/wind.mp3', {
  position: { x: 0, y: 5, z: 0 },
  loop: true,
  volume: 0.4,
});

// Play entire scene
await scene.play();

// Pause scene
scene.pause();

// Stop scene
scene.stop();

// Get source from scene
const birds = scene.getSource('birds');
birds.setVolume(0.8);
```

### Scene Transitions

```typescript
// Fade out current scene
await scene.fadeOut(2000);  // 2 seconds

// Fade in new scene
await newScene.fadeIn(2000);

// Cross-fade between scenes
await AudioScene.crossFade(currentScene, newScene, 3000);

// Snapshot current state
const snapshot = scene.createSnapshot();

// Restore snapshot
scene.restoreSnapshot(snapshot);
```

## AudioPath

### Path Animation

```typescript
import { AudioPath } from '@philjs/spatial-audio';

// Create path with waypoints
const path = new AudioPath([
  { x: 0, y: 1, z: 5 },
  { x: 5, y: 2, z: 3 },
  { x: 8, y: 1, z: -2 },
  { x: 3, y: 1, z: -5 },
  { x: 0, y: 1, z: 5 },  // Loop back
], {
  duration: 10000,       // 10 seconds
  easing: 'linear',      // 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
  loop: true,
});

// Attach source to path
path.attach(source);

// Start animation
path.start();

// Pause/resume
path.pause();
path.resume();

// Stop
path.stop();

// Seek to position (0-1)
path.seek(0.5);  // Middle of path

// Get current position
const pos = path.getPosition();
```

### Bezier Paths

```typescript
// Create smooth bezier path
const bezierPath = AudioPath.createBezier([
  { point: { x: 0, y: 0, z: 0 }, control: { x: 2, y: 1, z: 0 } },
  { point: { x: 5, y: 0, z: 3 }, control: { x: 3, y: 1, z: 3 } },
  { point: { x: 10, y: 0, z: 0 }, control: { x: 8, y: 1, z: 0 } },
], {
  duration: 5000,
  smoothness: 0.5,
});
```

### Circular Paths

```typescript
// Circular orbit around listener
const orbitPath = AudioPath.createCircular({
  center: { x: 0, y: 1, z: 0 },
  radius: 5,
  axis: 'y',           // Rotate around Y axis
  startAngle: 0,
  endAngle: Math.PI * 2,
  duration: 8000,
  loop: true,
});

orbitPath.attach(source);
orbitPath.start();
```

### Path Events

```typescript
path.on('start', () => console.log('Path started'));
path.on('pause', () => console.log('Path paused'));
path.on('resume', () => console.log('Path resumed'));
path.on('complete', () => console.log('Path completed'));
path.on('loop', () => console.log('Path looped'));

path.on('waypoint', (index) => {
  console.log(`Reached waypoint ${index}`);
});
```

## VR/AR Integration

### XR Head Tracking

```typescript
import { useVRAudio } from '@philjs/spatial-audio';

function VRAudioScene() {
  const {
    context,
    listener,
    syncWithXR,
    createSource,
  } = useVRAudio();

  useEffect(() => {
    // Sync listener with XR head pose
    const xrSession = navigator.xr.requestSession('immersive-vr');

    xrSession.requestAnimationFrame(function onFrame(time, frame) {
      const pose = frame.getViewerPose(referenceSpace);
      if (pose) {
        const { position, orientation } = pose.transform;
        syncWithXR(position, orientation);
      }
      xrSession.requestAnimationFrame(onFrame);
    });
  }, []);

  return null;
}
```

### Controller-Attached Audio

```typescript
// Attach audio to VR controller
const controllerSource = context.createSource('/sounds/laser.mp3');

function updateControllerAudio(controller) {
  const pose = controller.getPose();
  controllerSource.setPosition(pose.position);
  controllerSource.setOrientation(pose.orientation);
}
```

## React-style Hooks

### useSpatialAudio

```typescript
import { useSpatialAudio } from '@philjs/spatial-audio';

function SpatialAudioApp() {
  const {
    context,
    isReady,
    createSource,
    listener,
    setMasterVolume,
  } = useSpatialAudio({
    hrtfEnabled: true,
    roomAcoustics: true,
  });

  const handlePlaySound = async () => {
    const source = createSource('/sounds/effect.mp3', {
      position: { x: 5, y: 0, z: -3 },
    });
    await source.play();
  };

  return (
    <div>
      <button onClick={handlePlaySound} disabled={!isReady}>
        Play Sound
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.1}
        onChange={(e) => setMasterVolume(Number(e.target.value))}
      />
    </div>
  );
}
```

### useAudioSource

```typescript
import { useAudioSource } from '@philjs/spatial-audio';

function AudioSourceControl({ url, position }) {
  const {
    source,
    isPlaying,
    isPaused,
    currentTime,
    duration,
    play,
    pause,
    stop,
    setPosition,
    setVolume,
  } = useAudioSource(url, {
    position,
    loop: true,
  });

  return (
    <div>
      <p>Time: {currentTime.toFixed(1)}s / {duration.toFixed(1)}s</p>

      {!isPlaying ? (
        <button onClick={play}>Play</button>
      ) : (
        <button onClick={pause}>Pause</button>
      )}
      <button onClick={stop}>Stop</button>

      <input
        type="range"
        min={0}
        max={1}
        step={0.1}
        onChange={(e) => setVolume(Number(e.target.value))}
      />
    </div>
  );
}
```

### useAudioListener

```typescript
import { useAudioListener } from '@philjs/spatial-audio';

function ListenerControl() {
  const {
    position,
    orientation,
    setPosition,
    setOrientation,
    setRotation,
  } = useAudioListener();

  // Update from game camera
  useEffect(() => {
    const updateFromCamera = () => {
      setPosition(camera.position);
      setRotation({
        pitch: camera.rotation.x,
        yaw: camera.rotation.y,
        roll: camera.rotation.z,
      });
    };

    const id = requestAnimationFrame(function update() {
      updateFromCamera();
      requestAnimationFrame(update);
    });

    return () => cancelAnimationFrame(id);
  }, []);

  return null;
}
```

### useAudioPath

```typescript
import { useAudioPath } from '@philjs/spatial-audio';

function MovingSound({ source }) {
  const {
    isPlaying,
    progress,
    position,
    start,
    stop,
    pause,
    seek,
  } = useAudioPath(source, [
    { x: 0, y: 0, z: 5 },
    { x: 5, y: 0, z: 0 },
    { x: 0, y: 0, z: -5 },
    { x: -5, y: 0, z: 0 },
  ], {
    duration: 10000,
    loop: true,
  });

  return (
    <div>
      <p>Position: ({position.x.toFixed(1)}, {position.y.toFixed(1)}, {position.z.toFixed(1)})</p>
      <p>Progress: {(progress * 100).toFixed(0)}%</p>

      <button onClick={isPlaying ? pause : start}>
        {isPlaying ? 'Pause' : 'Start'}
      </button>

      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={progress}
        onChange={(e) => seek(Number(e.target.value))}
      />
    </div>
  );
}
```

### useAudioScene

```typescript
import { useAudioScene } from '@philjs/spatial-audio';

function ForestScene() {
  const {
    scene,
    isPlaying,
    sources,
    play,
    pause,
    stop,
    fadeIn,
    fadeOut,
    setSourceVolume,
  } = useAudioScene({
    name: 'forest',
    sources: [
      { id: 'birds', url: '/sounds/birds.mp3', position: { x: 5, y: 3, z: 0 }, loop: true },
      { id: 'stream', url: '/sounds/stream.mp3', position: { x: -3, y: 0, z: 4 }, loop: true },
      { id: 'wind', url: '/sounds/wind.mp3', position: { x: 0, y: 5, z: 0 }, loop: true },
    ],
  });

  return (
    <div>
      <h2>Forest Ambience</h2>

      <button onClick={isPlaying ? () => fadeOut(2000) : () => fadeIn(2000)}>
        {isPlaying ? 'Fade Out' : 'Fade In'}
      </button>

      {sources.map(source => (
        <div key={source.id}>
          <label>{source.id}</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            onChange={(e) => setSourceVolume(source.id, Number(e.target.value))}
          />
        </div>
      ))}
    </div>
  );
}
```

## Types Reference

```typescript
// 3D Vector
interface Vector3 {
  x: number;
  y: number;
  z: number;
}

// Orientation
interface Orientation {
  forward: Vector3;
  up: Vector3;
}

// Rotation (Euler angles in radians)
interface Rotation {
  pitch: number;
  yaw: number;
  roll: number;
}

// Source options
interface SourceOptions {
  position?: Vector3;
  volume?: number;
  loop?: boolean;
  playbackRate?: number;
  panningModel?: 'HRTF' | 'equalpower';
  distanceModel?: 'linear' | 'inverse' | 'exponential';
  refDistance?: number;
  maxDistance?: number;
  rolloffFactor?: number;
  cone?: ConeOptions;
}

// Cone (directional audio)
interface ConeOptions {
  innerAngle: number;   // degrees
  outerAngle: number;   // degrees
  outerGain: number;    // 0-1
}

// Room configuration
interface RoomConfig {
  dimensions: { width: number; height: number; depth: number };
  materials: RoomMaterials;
  reverb?: ReverbConfig;
  reflections?: ReflectionConfig;
}

// Audio path waypoint
interface PathWaypoint {
  x: number;
  y: number;
  z: number;
  duration?: number;   // Time to reach this point
  easing?: EasingType;
}
```

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `SpatialAudioContext` | Main spatial audio context |
| `SpatialAudioSource` | 3D positioned audio source |
| `RoomAcousticsProcessor` | Room reverb and reflections |
| `AmbisonicsDecoder` | Ambisonic audio decoding |
| `AudioScene` | Multi-source scene management |
| `AudioPath` | Path-based audio animation |

### Hooks

| Hook | Description |
|------|-------------|
| `useSpatialAudio(config)` | Context management |
| `useAudioSource(url, options)` | Source controls |
| `useAudioListener()` | Listener position/orientation |
| `useAudioPath(source, waypoints, options)` | Path animation |
| `useAudioScene(config)` | Scene management |
| `useVRAudio()` | VR/AR integration |
