# Spring Physics Deep Dive

The spring physics engine in `@philjs/motion` provides realistic, physics-based animations that feel natural and responsive. Unlike traditional duration-based animations, springs simulate real-world physics, creating motion that responds dynamically to changes.

## Why Springs?

Traditional CSS or duration-based animations have a fundamental limitation: they are **time-based**. If you interrupt an animation halfway through, it either snaps to a new position or awkwardly restarts. Springs solve this by modeling actual physics, where:

- Motion is driven by **force**, not time
- Animations can be interrupted naturally at any point
- Velocity is preserved when targets change
- The same spring configuration feels consistent regardless of distance

```typescript
import { Spring, SpringPresets } from '@philjs/motion';

// Spring animation can be interrupted anytime
const spring = new Spring(0, SpringPresets.bouncy);

// Start animation to 100
spring.set(100);

// After 50ms, change target to 200
// The spring naturally redirects without jarring transitions
setTimeout(() => spring.set(200), 50);
```

## Spring Physics Model

`@philjs/motion` uses a damped harmonic oscillator model. The motion is governed by three forces:

1. **Spring Force**: Pulls the value toward the target (proportional to distance)
2. **Damping Force**: Slows the motion (proportional to velocity)
3. **Inertia**: Resists changes in velocity (proportional to mass)

```
acceleration = (springForce + dampingForce) / mass

where:
  springForce = -tension * (currentValue - targetValue)
  dampingForce = -friction * velocity
```

## Spring Configuration

### Tension (Stiffness)

Tension controls how strongly the spring pulls toward its target. Higher tension means faster, snappier animations.

```typescript
// Low tension - slow, lazy motion
const lazy = new Spring(0, { tension: 50, friction: 10 });

// Medium tension - balanced motion
const balanced = new Spring(0, { tension: 170, friction: 26 });

// High tension - quick, responsive motion
const responsive = new Spring(0, { tension: 400, friction: 30 });
```

**Tension Guidelines:**
| Tension | Feel | Use Case |
|---------|------|----------|
| 50-100 | Slow, heavy | Background parallax, slow reveals |
| 100-200 | Balanced | General UI animations |
| 200-400 | Quick, responsive | Hover effects, micro-interactions |
| 400+ | Snappy | Toggles, quick transitions |

### Friction (Damping)

Friction controls how quickly the oscillation dies out. Lower friction creates more bounce; higher friction creates smoother, non-oscillating motion.

```typescript
// Very low friction - lots of bounce
const bouncy = new Spring(0, { tension: 180, friction: 8 });

// Balanced friction - slight overshoot
const natural = new Spring(0, { tension: 170, friction: 26 });

// High friction - no overshoot (critically damped)
const smooth = new Spring(0, { tension: 170, friction: 40 });

// Very high friction - sluggish (overdamped)
const sluggish = new Spring(0, { tension: 170, friction: 80 });
```

**Friction Guidelines:**
| Friction | Behavior | Use Case |
|----------|----------|----------|
| 5-15 | Very bouncy | Playful UI, games |
| 15-25 | Slight overshoot | Natural motion |
| 25-35 | Critically damped | Professional UI |
| 35+ | Overdamped | Heavy, deliberate motion |

### Mass

Mass affects how the spring responds to forces. Higher mass means more inertia - slower to start and stop.

```typescript
// Light mass - quick response
const light = new Spring(0, { tension: 170, friction: 26, mass: 0.5 });

// Standard mass
const standard = new Spring(0, { tension: 170, friction: 26, mass: 1 });

// Heavy mass - sluggish response
const heavy = new Spring(0, { tension: 170, friction: 26, mass: 3 });
```

### Velocity

Initial velocity can be set to create more natural transitions, especially when chaining animations or responding to gestures.

```typescript
const spring = new Spring(0, {
  tension: 170,
  friction: 26,
  velocity: 500, // Initial velocity in units/second
});
```

### Precision

Precision determines when the animation is considered "complete". Lower precision means longer animations but smoother final settling.

```typescript
// Standard precision - good for most cases
const standard = new Spring(0, { precision: 0.01 });

// High precision - smoother settling
const smooth = new Spring(0, { precision: 0.001 });

// Low precision - faster completion
const quick = new Spring(0, { precision: 0.1 });
```

### Clamping

When enabled, clamping prevents the spring from overshooting its target. Useful when overshoot would cause visual issues.

```typescript
// With clamping - no overshoot
const clamped = new Spring(0, {
  tension: 600,
  friction: 10,
  clamp: true, // Will not overshoot target
});

// Progress bar that shouldn't exceed 100%
const progress = new Spring(0, { clamp: true });
progress.set(100); // Will never show > 100
```

## Spring Presets

`@philjs/motion` includes carefully tuned presets for common use cases:

```typescript
import { SpringPresets } from '@philjs/motion';

const presets = {
  // Balanced, general-purpose
  default: { tension: 170, friction: 26 },

  // Soft, slow transitions
  gentle: { tension: 120, friction: 14 },

  // Playful with significant bounce
  wobbly: { tension: 180, friction: 12 },

  // Quick, responsive with minimal bounce
  stiff: { tension: 210, friction: 20 },

  // Heavy, deliberate motion
  slow: { tension: 280, friction: 60 },

  // Very slow, thick feeling
  molasses: { tension: 280, friction: 120 },

  // High energy, maximum bounce
  bouncy: { tension: 600, friction: 10 },

  // Quick snap with some overshoot
  snappy: { tension: 400, friction: 30 },
};
```

### Choosing the Right Preset

```typescript
import { Spring, SpringPresets } from '@philjs/motion';

// Hover effects - quick and responsive
const hoverSpring = new Spring(1, SpringPresets.snappy);

// Modal entrance - smooth and professional
const modalSpring = new Spring(0, SpringPresets.gentle);

// Toggle switches - quick snap
const toggleSpring = new Spring(0, SpringPresets.stiff);

// Playful animations - bouncy
const funSpring = new Spring(0, SpringPresets.bouncy);

// Loading indicators - continuous, smooth
const loadingSpring = new Spring(0, SpringPresets.slow);
```

## Advanced Spring Techniques

### Chaining Animations

```typescript
const spring = new Spring(0);

async function animateSequence() {
  await spring.set(100);
  await spring.set(50);
  await spring.set(200);
  await spring.set(0);
}

// Each step waits for the previous to complete
animateSequence();
```

### Interruptible Animations

```typescript
const spring = new Spring(0, SpringPresets.snappy);

function onMouseEnter() {
  // Start animating to expanded state
  spring.set(100);
}

function onMouseLeave() {
  // Interrupt current animation and return
  // Spring preserves velocity for natural feel
  spring.set(0);
}
```

### Dynamic Configuration

```typescript
const spring = new Spring(0, SpringPresets.default);

// Change configuration during animation
function makeBouncier() {
  spring.configure({ tension: 600, friction: 10 });
}

function makeSmoother() {
  spring.configure({ tension: 120, friction: 40 });
}
```

### Reading Spring State

```typescript
const spring = new Spring(0);

spring.onUpdate((state) => {
  console.log({
    currentValue: spring.get(),
    velocity: state.velocity,
    progress: state.progress,
    isAnimating: state.isAnimating,
  });
});

spring.set(100);
```

### Velocity-Based Decisions

```typescript
const spring = new Spring(0);

spring.onUpdate((state) => {
  // High velocity - add motion blur effect
  if (Math.abs(state.velocity) > 500) {
    element.classList.add('motion-blur');
  } else {
    element.classList.remove('motion-blur');
  }

  // Apply position
  element.style.transform = `translateX(${spring.get()}px)`;
});
```

## Performance Considerations

### GPU Acceleration

Springs work best with GPU-accelerated properties:

```typescript
// Good - GPU accelerated
spring.onUpdate(() => {
  element.style.transform = `translateX(${spring.get()}px)`;
  element.style.opacity = String(spring.get() / 100);
});

// Avoid - triggers layout
spring.onUpdate(() => {
  element.style.left = `${spring.get()}px`; // Triggers layout!
  element.style.width = `${spring.get()}px`; // Triggers layout!
});
```

### Will-Change Hints

```typescript
// Prepare browser for animation
element.style.willChange = 'transform, opacity';

const spring = new Spring(0, SpringPresets.snappy);

spring.onUpdate(() => {
  element.style.transform = `translateX(${spring.get()}px)`;
});

// After animation completes
spring.set(100).then(() => {
  element.style.willChange = 'auto';
});
```

### Cleanup

Always dispose of springs when components unmount:

```typescript
const spring = new Spring(0);

// When done
spring.dispose();
```

## Mathematical Background

The spring simulation follows these equations:

```
F_spring = -k * x       (Hooke's Law)
F_damping = -c * v      (Damping force)
F_total = F_spring + F_damping

a = F_total / m         (Newton's Second Law)

v_new = v + a * dt
x_new = x + v * dt
```

Where:
- `k` = tension (spring constant)
- `c` = friction (damping coefficient)
- `m` = mass
- `x` = displacement from target
- `v` = velocity
- `a` = acceleration
- `dt` = time step (1/60 second)

The system is critically damped when `c = 2 * sqrt(k * m)`.

## Comparison with CSS Animations

| Feature | CSS Transitions | @philjs/motion Springs |
|---------|-----------------|------------------------|
| Interruptible | Awkward | Natural |
| Velocity preservation | No | Yes |
| Dynamic targets | Restart required | Seamless |
| Physics-based | No | Yes |
| Customization | Cubic bezier | Full physics params |
| JavaScript integration | Limited | Full access |

## Next Steps

- [Multi-Dimensional Springs (SpringVector)](./overview.md#multi-dimensional-springs)
- [Animated Transforms](./overview.md#animated-transforms)
- [FLIP Layout Animations](./flip-animations.md)
- [Gesture-Driven Animations](./gestures.md)
