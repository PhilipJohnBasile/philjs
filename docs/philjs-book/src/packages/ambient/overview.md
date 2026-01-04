# @philjs/ambient - Complete Reference

The `@philjs/ambient` package provides environment-adaptive UI capabilities that automatically respond to ambient conditions such as light levels, device motion, user attention, audio environment, and time of day. This industry-first framework-native ambient computing solution enables context-aware UI that adapts to the user's physical environment.

## Installation

```bash
npm install @philjs/ambient
# or
pnpm add @philjs/ambient
# or
bun add @philjs/ambient
```

## Features

| Feature | Description |
|---------|-------------|
| Light Sensor Adaptation | Auto dark/light theme based on ambient illuminance |
| Motion Detection | Detect user activity (stationary, walking, running, driving) |
| Proximity Sensing | Detect when device is near face/objects |
| Audio Environment | Monitor noise levels and detect speech |
| Attention Tracking | Track user idle time and page visibility |
| Time-Based Adaptation | Night mode and blue light reduction |
| Device Posture | Detect orientation, angle, and foldable postures |
| Custom Adaptations | Define your own context-based UI rules |
| CSS Custom Properties | Reactive CSS variables for styling |

## Quick Start

```typescript
import { AdaptiveUI, AmbientCSS } from '@philjs/ambient';

// Inject ambient CSS variables
const style = document.createElement('style');
style.textContent = AmbientCSS;
document.head.appendChild(style);

// Create and start adaptive UI
const adaptive = new AdaptiveUI({
  light: {
    darkThreshold: 50,
    brightThreshold: 500,
    autoTheme: true,
    contrastBoost: true
  },
  attention: {
    dimAfterMs: 60000,
    dimLevel: 0.7,
    pauseAnimations: true
  }
});

await adaptive.start();

// Get current ambient context
const context = adaptive.getContext();
console.log('Light level:', context.light.level);
console.log('User activity:', context.motion.activity);
console.log('Time period:', context.time.period);
```

## AmbientContextManager

The `AmbientContextManager` class provides direct access to all ambient sensors and aggregates their data into a unified context object.

### Basic Usage

```typescript
import { AmbientContextManager } from '@philjs/ambient';

const manager = new AmbientContextManager();
await manager.start();

// Subscribe to context changes
const unsubscribe = manager.onUpdate((context) => {
  console.log('Light:', context.light.level);
  console.log('Motion:', context.motion.activity);
  console.log('Audio:', context.audio.category);
  console.log('Attention:', context.attention.isActive);
  console.log('Time:', context.time.period);
  console.log('Device:', context.device.posture);
});

// Get current context snapshot
const currentContext = manager.getContext();

// Clean up when done
manager.stop();
unsubscribe();
```

### Context Properties

The `AmbientContext` object contains data from all sensors:

```typescript
interface AmbientContext {
  light: LightConditions;      // Ambient light data
  motion: MotionState;         // Device motion and activity
  proximity: ProximityState;   // Proximity sensor data
  audio: AudioEnvironment;     // Audio environment analysis
  attention: AttentionState;   // User attention tracking
  time: TimeContext;           // Time-based context
  device: DevicePosture;       // Device orientation and posture
}
```

## AdaptiveUI

The `AdaptiveUI` class automatically adapts the UI based on ambient conditions using configurable rules.

### Configuration

```typescript
import { AdaptiveUI } from '@philjs/ambient';

const adaptive = new AdaptiveUI({
  // Light adaptation rules
  light: {
    darkThreshold: 50,        // Illuminance below this triggers dark mode
    brightThreshold: 500,     // Illuminance above this triggers bright mode
    autoTheme: true,          // Automatically switch themes
    contrastBoost: true       // Boost contrast in very bright conditions
  },

  // Motion adaptation rules
  motion: {
    reduceMotion: true,       // Reduce animations when user is moving
    simplifyUI: false,        // Simplify UI for moving users
    largerTargets: true       // Enlarge touch targets when not stationary
  },

  // Attention adaptation rules
  attention: {
    dimAfterMs: 60000,        // Dim screen after 60 seconds idle
    dimLevel: 0.7,            // Dim to 70% opacity
    pauseAnimations: true     // Pause animations when idle
  },

  // Time-based adaptation rules
  time: {
    nightModeStart: 22,       // Night mode starts at 10 PM
    nightModeEnd: 6,          // Night mode ends at 6 AM
    reduceBlueLight: true     // Apply blue light filter at night
  }
});

await adaptive.start();
```

### Element Registration

Register specific elements for custom adaptations:

```typescript
const myElement = document.getElementById('my-element');

// Register element for adaptation
adaptive.register(myElement);

// Later, unregister to restore original styles
adaptive.unregister(myElement);
```

### Custom Adaptations

Define custom rules based on ambient context:

```typescript
const adaptive = new AdaptiveUI({
  custom: [
    {
      // Apply when audio environment is noisy
      condition: (ctx) => ctx.audio.category === 'noisy',
      apply: (element) => {
        element.style.fontSize = '1.2em';
        element.setAttribute('data-loud-environment', 'true');
      },
      revert: (element) => {
        element.style.fontSize = '';
        element.removeAttribute('data-loud-environment');
      }
    },
    {
      // Apply when user is walking
      condition: (ctx) => ctx.motion.activity === 'walking',
      apply: (element) => {
        element.classList.add('motion-simplified');
      },
      revert: (element) => {
        element.classList.remove('motion-simplified');
      }
    },
    {
      // Apply during work hours
      condition: (ctx) => ctx.time.isWorkHours,
      apply: (element) => {
        element.setAttribute('data-focus-mode', 'true');
      },
      revert: (element) => {
        element.removeAttribute('data-focus-mode');
      }
    }
  ]
});
```

### Stopping Adaptation

```typescript
// Stop all adaptations and restore original styles
adaptive.stop();
```

## Hooks

The package provides hooks for reactive integration with your components.

### useAmbientContext

Access the full ambient context with loading state:

```typescript
import { useAmbientContext } from '@philjs/ambient';

function App() {
  const { context, isReady } = useAmbientContext();

  if (!isReady) {
    return <div>Loading sensors...</div>;
  }

  return (
    <div data-theme={context.light.level === 'dark' ? 'dark' : 'light'}>
      <p>Light: {context.light.level}</p>
      <p>Activity: {context.motion.activity}</p>
      <p>Period: {context.time.period}</p>
    </div>
  );
}
```

### useAdaptiveUI

Use the adaptive UI engine with custom rules:

```typescript
import { useAdaptiveUI } from '@philjs/ambient';

function AdaptiveComponent() {
  const { isActive, register, unregister, getContext } = useAdaptiveUI({
    light: { autoTheme: true, contrastBoost: true },
    attention: { dimAfterMs: 30000, dimLevel: 0.8, pauseAnimations: true }
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      register(containerRef.current);
      return () => unregister(containerRef.current);
    }
  }, []);

  return (
    <div ref={containerRef}>
      <p>Adaptive UI is {isActive ? 'active' : 'loading'}</p>
      {isActive && <p>Light: {getContext()?.light.level}</p>}
    </div>
  );
}
```

### useLightConditions

Access only light sensor data:

```typescript
import { useLightConditions } from '@philjs/ambient';

function ThemeSwitcher() {
  const light = useLightConditions();

  if (!light) return null;

  return (
    <div>
      <p>Illuminance: {light.illuminance} lux</p>
      <p>Level: {light.level}</p>
      <p>Natural light: {light.isNatural ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### useMotionState

Access device motion and activity detection:

```typescript
import { useMotionState } from '@philjs/ambient';

function MotionAwareUI() {
  const motion = useMotionState();

  if (!motion) return null;

  const buttonSize = motion.isMoving ? 'large' : 'normal';

  return (
    <div>
      <p>Activity: {motion.activity}</p>
      <p>Moving: {motion.isMoving ? 'Yes' : 'No'}</p>
      <p>Acceleration: x={motion.acceleration.x.toFixed(2)}</p>
      <button class={`btn-${buttonSize}`}>
        Tap Me
      </button>
    </div>
  );
}
```

### useAttentionState

Track user attention and idle time:

```typescript
import { useAttentionState } from '@philjs/ambient';

function AttentionAwareContent() {
  const attention = useAttentionState();

  if (!attention) return null;

  const isIdle = attention.idleTime > 30000; // 30 seconds

  return (
    <div style={{ opacity: isIdle ? 0.7 : 1 }}>
      <p>Active: {attention.isActive ? 'Yes' : 'No'}</p>
      <p>Idle for: {Math.floor(attention.idleTime / 1000)}s</p>
      {isIdle && <p>You seem to be away...</p>}
    </div>
  );
}
```

### useAudioEnvironment

Access audio environment analysis:

```typescript
import { useAudioEnvironment } from '@philjs/ambient';

function AudioAwareUI() {
  const audio = useAudioEnvironment();

  if (!audio) return null;

  return (
    <div>
      <p>Noise level: {audio.noiseLevel.toFixed(0)}%</p>
      <p>Category: {audio.category}</p>
      <p>Speech detected: {audio.isSpeechDetected ? 'Yes' : 'No'}</p>
      {audio.category === 'noisy' && (
        <p style={{ fontSize: '1.2em' }}>
          Enlarged text for noisy environment
        </p>
      )}
    </div>
  );
}
```

## CSS Custom Properties

The `AmbientCSS` export provides a set of CSS custom properties that are automatically updated based on ambient conditions.

### Injecting Styles

```typescript
import { AmbientCSS } from '@philjs/ambient';

// Inject into document
const style = document.createElement('style');
style.textContent = AmbientCSS;
document.head.appendChild(style);
```

### Available Properties

```css
:root {
  /* Brightness adjustment based on ambient light */
  --ambient-brightness: 1;

  /* Contrast adjustment for bright conditions */
  --ambient-contrast: 1;

  /* Motion preference: 'normal' or 'reduce' */
  --ambient-motion: normal;

  /* Touch target scale for moving users */
  --ambient-target-scale: 1;

  /* Screen dimming for idle users */
  --ambient-dim: 1;

  /* Animation play state: 'running' or 'paused' */
  --ambient-animation: running;

  /* Blue light filter for night mode */
  --ambient-blue-filter: none;
}
```

### Using in Your Styles

```css
/* Automatic brightness and contrast adjustment */
body {
  filter: brightness(var(--ambient-brightness))
          contrast(var(--ambient-contrast))
          var(--ambient-blue-filter);
  opacity: var(--ambient-dim);
  transition: filter 0.5s ease, opacity 0.5s ease;
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  :root {
    --ambient-motion: reduce;
  }
}

/* Disable animations when motion is reduced */
[data-ambient-motion="reduce"] *,
:root[style*="--ambient-motion: reduce"] * {
  animation-duration: 0.001ms !important;
  transition-duration: 0.001ms !important;
}

/* Scale touch targets for moving users */
button, a, [role="button"] {
  transform: scale(var(--ambient-target-scale));
  transition: transform 0.2s ease;
}

/* Pause animations when user is idle */
* {
  animation-play-state: var(--ambient-animation);
}
```

## Types Reference

### AmbientContext

The complete ambient context containing all sensor data:

```typescript
interface AmbientContext {
  light: LightConditions;
  motion: MotionState;
  proximity: ProximityState;
  audio: AudioEnvironment;
  attention: AttentionState;
  time: TimeContext;
  device: DevicePosture;
}
```

### LightConditions

Light sensor data and classifications:

```typescript
interface LightConditions {
  illuminance: number;                                    // Lux value
  level: 'dark' | 'dim' | 'normal' | 'bright' | 'very-bright';
  isNatural: boolean;                                     // True if > 1000 lux
  timestamp: number;                                      // Reading timestamp
}
```

Light level thresholds:
- `dark`: < 10 lux
- `dim`: 10-50 lux
- `normal`: 50-500 lux
- `bright`: 500-10000 lux
- `very-bright`: > 10000 lux

### MotionState

Device motion and activity detection:

```typescript
interface MotionState {
  isMoving: boolean;
  acceleration: { x: number; y: number; z: number };
  rotation: { alpha: number; beta: number; gamma: number };
  activity: 'stationary' | 'walking' | 'running' | 'driving' | 'unknown';
}
```

### ProximityState

Proximity sensor data:

```typescript
interface ProximityState {
  isNear: boolean;
  distance: number | null;    // Distance in cm, if available
  timestamp: number;
}
```

### AudioEnvironment

Audio environment analysis:

```typescript
interface AudioEnvironment {
  noiseLevel: number;         // 0-100 percentage
  category: 'quiet' | 'moderate' | 'noisy' | 'very-noisy';
  isSpeechDetected: boolean;
}
```

### AttentionState

User attention and idle tracking:

```typescript
interface AttentionState {
  isActive: boolean;          // False when tab is hidden
  idleTime: number;           // Milliseconds since last interaction
  lastInteraction: number;    // Timestamp of last user activity
}
```

### TimeContext

Time-based context:

```typescript
interface TimeContext {
  hour: number;               // 0-23
  period: 'morning' | 'afternoon' | 'evening' | 'night';
  isWorkHours: boolean;       // True if 9 AM - 5 PM
}
```

Time periods:
- `morning`: 5 AM - 12 PM
- `afternoon`: 12 PM - 5 PM
- `evening`: 5 PM - 9 PM
- `night`: 9 PM - 5 AM

### DevicePosture

Device orientation and posture:

```typescript
interface DevicePosture {
  orientation: 'portrait' | 'landscape';
  angle: number;              // Beta rotation angle
  isFolded?: boolean;         // For foldable devices
  posture?: 'flat' | 'tent' | 'laptop' | 'held';
}
```

Posture detection based on beta angle:
- `flat`: |beta| < 15 degrees
- `held`: 45-135 degrees
- `tent`: > 100 degrees
- `laptop`: Other angles

### AdaptationRules

Configuration for adaptive UI:

```typescript
interface AdaptationRules {
  light?: LightAdaptation;
  motion?: MotionAdaptation;
  attention?: AttentionAdaptation;
  time?: TimeAdaptation;
  custom?: CustomAdaptation[];
}

interface LightAdaptation {
  darkThreshold: number;      // Default: 50
  brightThreshold: number;    // Default: 500
  autoTheme: boolean;         // Default: true
  contrastBoost: boolean;     // Default: true
}

interface MotionAdaptation {
  reduceMotion: boolean;      // Default: true
  simplifyUI: boolean;        // Default: false
  largerTargets: boolean;     // Default: true
}

interface AttentionAdaptation {
  dimAfterMs: number;         // Default: 60000
  dimLevel: number;           // Default: 0.7
  pauseAnimations: boolean;   // Default: true
}

interface TimeAdaptation {
  nightModeStart: number;     // Default: 22 (10 PM)
  nightModeEnd: number;       // Default: 6 (6 AM)
  reduceBlueLight: boolean;   // Default: true
}

interface CustomAdaptation {
  condition: (context: AmbientContext) => boolean;
  apply: (element: HTMLElement) => void;
  revert: (element: HTMLElement) => void;
}
```

### AmbientCallback

Callback type for context updates:

```typescript
type AmbientCallback = (context: AmbientContext) => void;
```

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `AmbientContextManager` | Manages all ambient sensors and aggregates context |
| `AdaptiveUI` | Automatically adapts UI based on ambient context |

### AmbientContextManager Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `start()` | `Promise<void>` | Initialize all sensors |
| `stop()` | `void` | Stop all sensors and clean up |
| `getContext()` | `AmbientContext` | Get current context snapshot |
| `onUpdate(callback)` | `() => void` | Subscribe to context changes, returns unsubscribe function |

### AdaptiveUI Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `start()` | `Promise<void>` | Start adaptive UI engine |
| `stop()` | `void` | Stop adaptations and restore original styles |
| `getContext()` | `AmbientContext` | Get current ambient context |
| `register(element)` | `void` | Register element for custom adaptations |
| `unregister(element)` | `void` | Unregister element and restore styles |

### Hooks

| Hook | Return Type | Description |
|------|-------------|-------------|
| `useAmbientContext()` | `{ context: AmbientContext \| null, isReady: boolean }` | Full ambient context with loading state |
| `useAdaptiveUI(rules?)` | `{ isActive: boolean, register: Function, unregister: Function, getContext: Function }` | Adaptive UI with custom rules |
| `useLightConditions()` | `LightConditions \| null` | Light sensor data only |
| `useMotionState()` | `MotionState \| null` | Motion/acceleration data only |
| `useAttentionState()` | `AttentionState \| null` | User attention/idle state |
| `useAudioEnvironment()` | `AudioEnvironment \| null` | Audio environment data |

### Constants

| Export | Type | Description |
|--------|------|-------------|
| `AmbientCSS` | `string` | CSS custom properties for ambient adaptation |

## Browser Support

Some ambient features require sensor APIs with limited browser support. The package provides fallbacks where possible.

| Feature | Chrome | Firefox | Safari | Edge | Notes |
|---------|--------|---------|--------|------|-------|
| Ambient Light Sensor | Flag | No | No | Flag | Falls back to prefers-color-scheme |
| Device Motion | Yes | Yes | Yes | Yes | Requires user gesture on iOS |
| Device Orientation | Yes | Yes | Yes | Yes | Full support |
| Proximity Sensor | No | No | No | No | Limited to specific devices |
| Audio Analysis | Yes | Yes | Yes | Yes | Requires microphone permission |
| Visibility API | Yes | Yes | Yes | Yes | Full support |

### Enabling Ambient Light Sensor

In Chrome, enable the flag:
```
chrome://flags/#enable-generic-sensor-extra-classes
```

### Fallback Behavior

- **Light sensor**: Falls back to `prefers-color-scheme` media query
- **Motion sensor**: Returns stationary state if unavailable
- **Proximity sensor**: Returns null distance if unavailable
- **Audio sensor**: Requires explicit microphone permission

## Examples

### Full Adaptive Application

```typescript
import {
  AdaptiveUI,
  AmbientCSS,
  useAmbientContext,
  type AdaptationRules
} from '@philjs/ambient';

// Configuration
const rules: AdaptationRules = {
  light: {
    darkThreshold: 50,
    brightThreshold: 500,
    autoTheme: true,
    contrastBoost: true
  },
  motion: {
    reduceMotion: true,
    simplifyUI: true,
    largerTargets: true
  },
  attention: {
    dimAfterMs: 60000,
    dimLevel: 0.7,
    pauseAnimations: true
  },
  time: {
    nightModeStart: 22,
    nightModeEnd: 6,
    reduceBlueLight: true
  },
  custom: [
    {
      condition: (ctx) => ctx.audio.category === 'noisy',
      apply: (el) => el.classList.add('high-contrast'),
      revert: (el) => el.classList.remove('high-contrast')
    }
  ]
};

// Initialize
const style = document.createElement('style');
style.textContent = AmbientCSS;
document.head.appendChild(style);

const adaptive = new AdaptiveUI(rules);
await adaptive.start();

// React component using the context
function App() {
  const { context, isReady } = useAmbientContext();

  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <div class={`app theme-${context.light.level}`}>
      <Header />
      <main>
        {context.motion.isMoving && (
          <SimplifiedContent />
        )}
        {!context.motion.isMoving && (
          <FullContent />
        )}
      </main>
      <Footer />
    </div>
  );
}
```

### Context-Aware Video Player

```typescript
import { useAmbientContext } from '@philjs/ambient';

function VideoPlayer({ src }) {
  const { context, isReady } = useAmbientContext();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isReady || !videoRef.current) return;

    // Pause when user is not paying attention
    if (context.attention.idleTime > 30000) {
      videoRef.current.pause();
    }

    // Adjust volume based on environment noise
    if (context.audio.category === 'noisy') {
      videoRef.current.volume = 1.0;
    } else if (context.audio.category === 'quiet') {
      videoRef.current.volume = 0.5;
    }

    // Enable captions in noisy environments
    const track = videoRef.current.textTracks[0];
    if (track) {
      track.mode = context.audio.category === 'noisy' ? 'showing' : 'hidden';
    }
  }, [context, isReady]);

  return (
    <video ref={videoRef} src={src}>
      <track kind="captions" src="captions.vtt" />
    </video>
  );
}
```

### Adaptive Form

```typescript
import { useMotionState, useAttentionState } from '@philjs/ambient';

function AdaptiveForm() {
  const motion = useMotionState();
  const attention = useAttentionState();

  // Larger inputs when user is moving
  const inputSize = motion?.isMoving ? 'large' : 'normal';

  // Show help text when user seems stuck
  const showHelp = attention && attention.idleTime > 10000;

  return (
    <form class={`form form--${inputSize}`}>
      <div class="form-field">
        <label>Email</label>
        <input type="email" name="email" />
        {showHelp && (
          <p class="help-text">
            Enter your email address to continue
          </p>
        )}
      </div>

      <div class="form-field">
        <label>Password</label>
        <input type="password" name="password" />
      </div>

      <button type="submit" class={`btn btn--${inputSize}`}>
        Submit
      </button>
    </form>
  );
}
```

## License

MIT
