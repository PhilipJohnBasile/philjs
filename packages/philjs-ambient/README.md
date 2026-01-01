# @philjs/ambient

Environment-adaptive UI framework that responds to ambient conditions like light, motion, and attention.

![Node 24+](https://img.shields.io/badge/Node-24%2B-brightgreen)
![TypeScript 6](https://img.shields.io/badge/TypeScript-6-blue)

## Features

- Light sensor adaptation (auto dark/light theme)
- Motion-based interactions
- Proximity detection
- Audio environment awareness
- Attention-based dimming
- Context-aware UI morphing
- Time-based adaptations
- Device posture detection

## Installation

```bash
npm install @philjs/ambient
```

## Usage

### Adaptive UI

```typescript
import { AdaptiveUI } from '@philjs/ambient';

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
  },
  time: {
    nightModeStart: 22,
    nightModeEnd: 6,
    reduceBlueLight: true
  }
});

await adaptive.start();

// Get current context
const context = adaptive.getContext();
console.log('Light level:', context.light.level);
console.log('User activity:', context.motion.activity);
```

### Ambient Context Manager

```typescript
import { AmbientContextManager } from '@philjs/ambient';

const manager = new AmbientContextManager();
await manager.start();

// Subscribe to context changes
manager.onUpdate((context) => {
  if (context.light.level === 'dark') {
    document.body.classList.add('dark-theme');
  }

  if (context.motion.isMoving) {
    // Simplify UI for moving user
  }

  if (context.attention.idleTime > 30000) {
    // User is idle - dim screen
  }
});
```

### React Hooks

```typescript
import {
  useAmbientContext,
  useAdaptiveUI,
  useLightConditions,
  useMotionState,
  useAttentionState
} from '@philjs/ambient';

function App() {
  const { context, isReady } = useAmbientContext();

  if (!isReady) return <Loading />;

  return (
    <div className={context.light.level === 'dark' ? 'dark' : 'light'}>
      <Content />
    </div>
  );
}

function ResponsiveButton() {
  const motion = useMotionState();

  // Larger touch targets when user is moving
  const size = motion?.isMoving ? 'large' : 'normal';

  return <Button size={size}>Click Me</Button>;
}
```

### Custom Adaptations

```typescript
const adaptive = new AdaptiveUI({
  custom: [
    {
      condition: (ctx) => ctx.audio.category === 'noisy',
      apply: (element) => {
        element.style.fontSize = '1.2em';
        element.setAttribute('data-loud', 'true');
      },
      revert: (element) => {
        element.style.fontSize = '';
        element.removeAttribute('data-loud');
      }
    }
  ]
});
```

### CSS Custom Properties

The library sets CSS custom properties you can use in your styles:

```css
/* These are automatically updated based on ambient conditions */
:root {
  --ambient-brightness: 1;
  --ambient-contrast: 1;
  --ambient-motion: normal;
  --ambient-target-scale: 1;
  --ambient-dim: 1;
  --ambient-animation: running;
  --ambient-blue-filter: none;
}

body {
  filter: brightness(var(--ambient-brightness))
          contrast(var(--ambient-contrast));
  opacity: var(--ambient-dim);
}

button {
  transform: scale(var(--ambient-target-scale));
}

* {
  animation-play-state: var(--ambient-animation);
}
```

### Include Base Styles

```typescript
import { AmbientCSS } from '@philjs/ambient';

// Inject the base styles
const style = document.createElement('style');
style.textContent = AmbientCSS;
document.head.appendChild(style);
```

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `AmbientContextManager` | Manages all ambient sensors |
| `AdaptiveUI` | Automatically adapts UI based on context |

### Hooks

| Hook | Description |
|------|-------------|
| `useAmbientContext()` | Full ambient context with all sensors |
| `useAdaptiveUI(rules?)` | Adaptive UI with custom rules |
| `useLightConditions()` | Light sensor data only |
| `useMotionState()` | Motion/acceleration data only |
| `useAttentionState()` | User attention/idle state |
| `useAudioEnvironment()` | Audio environment data |

### Context Types

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

interface LightConditions {
  illuminance: number;
  level: 'dark' | 'dim' | 'normal' | 'bright' | 'very-bright';
  isNatural: boolean;
}

interface MotionState {
  isMoving: boolean;
  acceleration: { x: number; y: number; z: number };
  activity: 'stationary' | 'walking' | 'running' | 'driving' | 'unknown';
}

interface AttentionState {
  isActive: boolean;
  idleTime: number;
  lastInteraction: number;
}

interface DevicePosture {
  orientation: 'portrait' | 'landscape';
  angle: number;
  posture?: 'flat' | 'tent' | 'laptop' | 'held';
}
```

### Adaptation Rules

```typescript
interface AdaptationRules {
  light?: {
    darkThreshold: number;
    brightThreshold: number;
    autoTheme: boolean;
    contrastBoost: boolean;
  };
  motion?: {
    reduceMotion: boolean;
    simplifyUI: boolean;
    largerTargets: boolean;
  };
  attention?: {
    dimAfterMs: number;
    dimLevel: number;
    pauseAnimations: boolean;
  };
  time?: {
    nightModeStart: number;
    nightModeEnd: number;
    reduceBlueLight: boolean;
  };
  custom?: CustomAdaptation[];
}
```

## Browser Support

Some features require sensor APIs with limited browser support:

| Feature | Chrome | Firefox | Safari |
|---------|--------|---------|--------|
| Ambient Light | Flag | No | No |
| Device Motion | Yes | Yes | Yes |
| Proximity | No | No | No |
| Audio Environment | Yes | Yes | Yes |

Fallbacks are provided where native APIs are unavailable.

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: .
- Source files: packages/philjs-ambient/src/index.ts

### Public API
- Direct exports: AdaptationRules, AdaptiveUI, AmbientCSS, AmbientCallback, AmbientContext, AmbientContextManager, AttentionAdaptation, AttentionState, AudioEnvironment, CustomAdaptation, DevicePosture, LightAdaptation, LightConditions, MotionAdaptation, MotionState, ProximityState, TimeAdaptation, TimeContext, useAdaptiveUI, useAmbientContext, useAttentionState, useAudioEnvironment, useLightConditions, useMotionState
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT
