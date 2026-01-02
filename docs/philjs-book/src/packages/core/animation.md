# Animation and motion

`@philjs/core/animation` provides spring-driven values, easing functions, and a FLIP animator.

## Animated values

```tsx
import { createAnimatedValue, easings } from '@philjs/core/animation';

const progress = createAnimatedValue(0, {
  duration: 400,
  easing: easings.easeInOut
});

progress.set(1);

console.log(progress.value);
```

## Spring config

```ts
progress.set(1, {
  easing: { stiffness: 0.15, damping: 0.8, mass: 1 }
});
```

## Reacting to updates

```tsx
progress.subscribe((value) => {
  console.log('Progress', value);
});
```

## FLIP animations

```tsx
import { FLIPAnimator } from '@philjs/core/animation';

const flip = new FLIPAnimator();

// Before layout change
flip.recordPositions('[data-flip]');

// After DOM update
flip.animateChanges({ duration: 300 });
```

## Tips

- Use signals for layout state and drive `createAnimatedValue` updates.
- Prefer `easings` for simple tweens and spring config for natural motion.
