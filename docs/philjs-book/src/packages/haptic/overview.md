# @philjs/haptic

Rich haptic feedback system for mobile, web, and XR with pre-built patterns and custom haptic composition.

## Installation

```bash
npm install @philjs/haptic
```

## Features

- **Vibration API** - Browser haptic feedback
- **Pre-built Patterns** - 40+ haptic patterns for common UX
- **Pattern Composer** - Build custom haptic patterns
- **Gamepad Haptics** - Controller rumble support
- **XR Haptics** - VR/AR controller vibration
- **Accessibility** - Respects reduced motion preferences
- **Battery-Aware** - Configurable duration limits

## Quick Start

```typescript
import { HapticEngine, useHaptic } from '@philjs/haptic';

// Create engine
const haptics = new HapticEngine();

// Play pre-built pattern
haptics.play('tap');
haptics.play('success');
haptics.play('notification');

// Impact feedback with intensity
haptics.impact('light');
haptics.impact('medium');
haptics.impact('heavy');

// Custom pattern
haptics.vibrate([100, 50, 100]); // vibrate, pause, vibrate
```

## HapticEngine

### Configuration

```typescript
const haptics = new HapticEngine({
  enabled: true,
  respectReducedMotion: true, // Honor user preference
  maxDuration: 5000,          // Max pattern duration in ms
  defaultIntensity: 'medium',
});
```

### Check Support

```typescript
if (HapticEngine.isSupported()) {
  haptics.play('tap');
} else {
  console.log('Haptics not supported');
}
```

### Impact Feedback

```typescript
// Different intensities
haptics.impact('light');   // 15ms
haptics.impact('medium');  // 30ms
haptics.impact('heavy');   // 50ms
haptics.impact('rigid');   // Sharp 5-5-5ms
haptics.impact('soft');    // Bouncy 20-10-20ms
```

### Notification Feedback

```typescript
haptics.notification('success');     // Positive confirmation
haptics.notification('warning');     // Warning alert
haptics.notification('error');       // Error feedback
haptics.notification('notification'); // Standard notification
haptics.notification('selection');   // Selection change
```

### Selection Feedback

```typescript
// Quick selection tick
haptics.selection();
```

### Stop Vibration

```typescript
haptics.stop();
```

## Pre-built Patterns

### Basic Patterns

```typescript
haptics.play('tap');         // Single light tap
haptics.play('doubleTap');   // Double tap
haptics.play('tripleTap');   // Triple tap
```

### Impact Patterns

```typescript
haptics.play('lightImpact');  // Light impact
haptics.play('mediumImpact'); // Medium impact
haptics.play('heavyImpact');  // Heavy impact
haptics.play('rigidImpact');  // Sharp rigid
haptics.play('softImpact');   // Soft bouncy
```

### Selection Patterns

```typescript
haptics.play('selection');       // Selection tick
haptics.play('selectionChange'); // Selection changed
```

### Notification Patterns

```typescript
haptics.play('notification'); // Standard notification
haptics.play('success');      // Success confirmation
haptics.play('warning');      // Warning alert
haptics.play('error');        // Error feedback
```

### UI Patterns

```typescript
haptics.play('buttonPress');    // Button press
haptics.play('buttonRelease');  // Button release
haptics.play('toggle');         // Toggle switch
haptics.play('slider');         // Slider tick
haptics.play('sliderEnd');      // Slider reached end
```

### Gesture Patterns

```typescript
haptics.play('swipe');      // Swipe gesture
haptics.play('longPress');  // Long press build-up
haptics.play('dragStart');  // Drag started
haptics.play('dragEnd');    // Drag ended
haptics.play('drop');       // Item dropped
```

### Gaming Patterns

```typescript
haptics.play('explosion');  // Explosion effect
haptics.play('collision');  // Collision impact
haptics.play('powerUp');    // Power-up collected
haptics.play('levelUp');    // Level up fanfare
haptics.play('damage');     // Damage taken
haptics.play('heal');       // Healing effect
```

### Communication Patterns

```typescript
haptics.play('messageReceived'); // Message received
haptics.play('messageSent');     // Message sent
haptics.play('typing');          // Keyboard key
```

### Navigation Patterns

```typescript
haptics.play('pageChange');     // Page navigation
haptics.play('pullToRefresh');  // Pull to refresh threshold
haptics.play('scrollEnd');      // Scroll reached end
```

## Custom Patterns

### Register Custom Pattern

```typescript
haptics.registerPattern({
  name: 'heartbeat',
  pattern: [100, 100, 100, 300, 100, 100, 100],
  description: 'Heartbeat rhythm',
});

haptics.play('heartbeat');
```

### Create Pattern from Vibrations

```typescript
const pattern = haptics.createPattern('customPulse', [
  { duration: 50, pause: 30 },
  { duration: 100, pause: 30 },
  { duration: 50 },
]);

haptics.registerPattern(pattern);
haptics.play('customPulse');
```

### Direct Vibration

```typescript
// Single vibration
haptics.vibrate(100); // 100ms

// Pattern array: [vibrate, pause, vibrate, pause, ...]
haptics.vibrate([100, 50, 200, 50, 100]);
```

## HapticComposer

### Building Patterns

```typescript
import { HapticComposer } from '@philjs/haptic';

const composer = new HapticComposer();

// Chain methods to build pattern
const pattern = composer
  .tap()
  .pause(50)
  .pulse(30)
  .pause(50)
  .tap()
  .build();

// Play the pattern
composer.play();
```

### Composer Methods

```typescript
composer
  .vibrate(100)      // Vibrate for duration
  .pause(50)         // Pause for duration
  .tap()             // Quick 10ms tap
  .pulse(30)         // Pulse for duration (default 30ms)
  .beat(3, 20, 50)   // 3 beats, 20ms each, 50ms gaps
  .crescendo(5, 50)  // Building intensity (5 steps to 50ms max)
  .decrescendo(5, 50) // Fading intensity
  .wave(3)           // Wave pattern (count)
  .build();

// Get pattern array
const patternArray = composer.toArray();

// Play directly
composer.play();

// Reset and start fresh
composer.reset();
```

### Example Patterns

```typescript
// Alert pattern
const alert = new HapticComposer()
  .beat(2, 50, 100)
  .pause(200)
  .beat(2, 50, 100)
  .build();

// Celebration pattern
const celebration = new HapticComposer()
  .crescendo(5, 60)
  .pause(100)
  .wave(2)
  .pulse(80)
  .build();

// Countdown pattern
const countdown = new HapticComposer()
  .tap().pause(1000)
  .tap().pause(1000)
  .tap().pause(1000)
  .vibrate(200)
  .build();
```

## Gamepad Haptics

### Basic Usage

```typescript
import { GamepadHaptics } from '@philjs/haptic';

const gamepad = new GamepadHaptics(0); // Gamepad index

// Quick pulse
await gamepad.pulse(100, 0.5); // duration, intensity

// Strong rumble
await gamepad.rumble(200);

// Custom effect
await gamepad.playEffect({
  duration: 200,
  startDelay: 0,
  strongMagnitude: 1.0,  // Low-frequency motor
  weakMagnitude: 0.3,    // High-frequency motor
});

// Stop
await gamepad.stop();
```

### Check Support

```typescript
if (GamepadHaptics.isSupported()) {
  const gamepad = new GamepadHaptics();
  await gamepad.pulse(100, 0.5);
}
```

### Multiple Gamepads

```typescript
const gamepad = new GamepadHaptics(0);
gamepad.setGamepadIndex(1); // Switch to second gamepad
```

## XR Haptics

### Basic Usage

```typescript
import { XRHaptics } from '@philjs/haptic';

const xrHaptics = new XRHaptics();

// Set XR session
xrHaptics.setSession(xrSession);

// Pulse left controller
await xrHaptics.pulseLeft(100, 1.0);

// Pulse right controller
await xrHaptics.pulseRight(100, 1.0);

// Pulse both controllers
await xrHaptics.pulseBoth(100, 1.0);
```

### Haptic Patterns

```typescript
// Play pattern on controller
await xrHaptics.pattern('left', [
  { duration: 50, intensity: 0.5 },
  { duration: 100, intensity: 1.0 },
  { duration: 50, intensity: 0.5 },
]);
```

### Check Haptics Available

```typescript
const hasLeft = xrHaptics.hasHaptics('left');
const hasRight = xrHaptics.hasHaptics('right');
```

## React-style Hooks

### useHaptic

```typescript
import { useHaptic } from '@philjs/haptic';

function MyComponent() {
  const {
    vibrate,
    play,
    impact,
    notification,
    selection,
    stop,
    supported,
    enabled,
    setEnabled,
  } = useHaptic();

  return (
    <button
      onClick={() => {
        impact('medium');
        // do something
      }}
    >
      Click me
    </button>
  );
}
```

### useHapticPattern

```typescript
import { useHapticPattern } from '@philjs/haptic';

function PatternBuilder() {
  const { patterns, register, create, compose } = useHapticPattern();

  const handleCreatePattern = () => {
    const pattern = create('myPattern', [
      { duration: 50, pause: 30 },
      { duration: 100 },
    ]);
    register(pattern);
  };

  const handleCompose = () => {
    const composer = compose();
    composer.beat(3, 30, 50).play();
  };

  return (
    <div>
      <button onClick={handleCreatePattern}>Create Pattern</button>
      <button onClick={handleCompose}>Play Composed</button>
    </div>
  );
}
```

### useGamepadHaptics

```typescript
import { useGamepadHaptics } from '@philjs/haptic';

function GameController() {
  const {
    pulse,
    rumble,
    playEffect,
    stop,
    supported,
    setGamepadIndex,
  } = useGamepadHaptics(0);

  return (
    <button onClick={() => rumble(200)}>
      Rumble
    </button>
  );
}
```

### useXRHaptics

```typescript
import { useXRHaptics } from '@philjs/haptic';

function XRControls() {
  const {
    pulse,
    pulseLeft,
    pulseRight,
    pulseBoth,
    pattern,
    setSession,
    supported,
  } = useXRHaptics();

  return (
    <button onClick={() => pulseBoth(100, 0.8)}>
      Vibrate Controllers
    </button>
  );
}
```

## Accessibility

### Reduced Motion

```typescript
const haptics = new HapticEngine({
  respectReducedMotion: true, // Default: true
});

// Automatically disabled when prefers-reduced-motion is set
```

### Manual Control

```typescript
// Check if enabled
if (haptics.isEnabled()) {
  haptics.play('tap');
}

// Disable programmatically
haptics.setEnabled(false);
```

## Types Reference

```typescript
// Intensity levels
type HapticIntensity = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';

// Notification types
type HapticType = 'impact' | 'selection' | 'notification' | 'warning' | 'error' | 'success';

// Pattern definition
interface HapticPattern {
  name: string;
  pattern: number[];
  description?: string;
}

// Configuration
interface HapticConfig {
  enabled?: boolean;
  respectReducedMotion?: boolean;
  maxDuration?: number;
  defaultIntensity?: HapticIntensity;
}

// Gamepad effect
interface GamepadHapticEffect {
  duration: number;
  startDelay?: number;
  strongMagnitude?: number;
  weakMagnitude?: number;
}

// XR haptic pulse
interface XRHapticPulse {
  duration: number;
  intensity: number;
}
```

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `HapticEngine` | Main haptic feedback engine |
| `HapticComposer` | Fluent pattern builder |
| `GamepadHaptics` | Gamepad rumble control |
| `XRHaptics` | VR/AR controller haptics |

### Hooks

| Hook | Description |
|------|-------------|
| `useHaptic(config?)` | Haptic feedback control |
| `useHapticPattern()` | Pattern management |
| `useGamepadHaptics(index?)` | Gamepad haptics |
| `useXRHaptics()` | XR controller haptics |

### Constants

| Constant | Description |
|----------|-------------|
| `HAPTIC_PATTERNS` | Object containing all built-in patterns |

## Example: Button with Haptics

```typescript
import { useHaptic } from '@philjs/haptic';

function HapticButton({ onClick, children }) {
  const { impact, selection } = useHaptic();

  const handlePress = () => {
    impact('light');
  };

  const handleRelease = () => {
    selection();
    onClick?.();
  };

  return (
    <button
      onMouseDown={handlePress}
      onMouseUp={handleRelease}
      onTouchStart={handlePress}
      onTouchEnd={handleRelease}
    >
      {children}
    </button>
  );
}
```
