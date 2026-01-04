# Scroll-Linked Animations

Scroll-linked animations create engaging experiences by connecting element visibility and position to scroll progress. `@philjs/motion` provides a high-performance scroll animation system that's smooth, efficient, and easy to use.

## Core Concepts

Scroll animations work by:

1. **Tracking element visibility** within the viewport
2. **Calculating progress** (0 to 1) based on scroll position
3. **Triggering callbacks** with progress and scroll information
4. **Using requestAnimationFrame** for smooth, jank-free updates

## ScrollAnimation Class

### Basic Setup

```typescript
import { ScrollAnimation } from '@philjs/motion';

const element = document.getElementById('animated-section');

const scroll = new ScrollAnimation(element, {
  startOffset: 0,   // Progress starts when element enters viewport
  endOffset: 1,     // Progress ends when element exits viewport
});

scroll.onProgress((progress, info) => {
  console.log(`Progress: ${progress * 100}%`);
  console.log(`Scroll position: ${info.y}`);
  console.log(`Direction: ${info.direction}`);
});
```

### Understanding Progress

Progress is a value from 0 to 1 representing how much of the element is visible:

- `0`: Element is fully below/outside viewport
- `0.5`: Element is half visible
- `1`: Element is fully above/outside viewport (passed through)

```typescript
scroll.onProgress((progress) => {
  // Element entering viewport: progress goes from 0 to 1
  // Element leaving viewport: progress continues at 1 until fully out
});
```

### Start and End Offsets

Customize when the animation starts and ends:

```typescript
// Default: animate through entire visibility range
const fullRange = new ScrollAnimation(element, {
  startOffset: 0,
  endOffset: 1,
});

// Start animation when element is 25% visible
const delayedStart = new ScrollAnimation(element, {
  startOffset: 0.25,
  endOffset: 1,
});

// Complete animation when element is 75% visible
const earlyEnd = new ScrollAnimation(element, {
  startOffset: 0,
  endOffset: 0.75,
});

// Only animate in the middle portion
const middleRange = new ScrollAnimation(element, {
  startOffset: 0.25,
  endOffset: 0.75,
});
```

## ScrollInfo Object

The callback receives detailed scroll information:

```typescript
interface ScrollInfo {
  x: number;          // Horizontal scroll position
  y: number;          // Vertical scroll position
  progress: number;   // 0-1 progress through visibility range
  velocity: number;   // Scroll velocity in px/second
  direction: 'up' | 'down' | 'left' | 'right' | null;
}
```

### Using Scroll Info

```typescript
scroll.onProgress((progress, info) => {
  // Fade in based on progress
  element.style.opacity = String(progress);

  // Add classes based on direction
  if (info.direction === 'down') {
    element.classList.add('scrolling-down');
    element.classList.remove('scrolling-up');
  } else if (info.direction === 'up') {
    element.classList.add('scrolling-up');
    element.classList.remove('scrolling-down');
  }

  // Motion blur effect based on velocity
  if (Math.abs(info.velocity) > 1000) {
    element.classList.add('fast-scroll');
  } else {
    element.classList.remove('fast-scroll');
  }
});
```

## Common Animation Patterns

### Fade In on Scroll

```typescript
import { ScrollAnimation } from '@philjs/motion';

function fadeInOnScroll(element: HTMLElement) {
  // Start hidden
  element.style.opacity = '0';

  const scroll = new ScrollAnimation(element, {
    startOffset: 0.1,  // Start when 10% visible
    endOffset: 0.5,    // Fully visible at 50%
  });

  scroll.onProgress((progress) => {
    element.style.opacity = String(progress);
  });

  return scroll;
}
```

### Slide Up Animation

```typescript
function slideUpOnScroll(element: HTMLElement) {
  element.style.opacity = '0';
  element.style.transform = 'translateY(50px)';
  element.style.transition = 'none'; // Disable CSS transitions

  const scroll = new ScrollAnimation(element, {
    startOffset: 0.1,
    endOffset: 0.4,
  });

  scroll.onProgress((progress) => {
    element.style.opacity = String(progress);
    element.style.transform = `translateY(${50 * (1 - progress)}px)`;
  });

  return scroll;
}
```

### Parallax Effect

```typescript
function parallax(element: HTMLElement, speed: number = 0.5) {
  const scroll = new ScrollAnimation(element);

  scroll.onProgress((progress, info) => {
    // Move slower (or faster) than scroll
    const offset = progress * speed * 100;
    element.style.transform = `translateY(${-offset}px)`;
  });

  return scroll;
}

// Slower than scroll (background)
parallax(document.getElementById('background')!, 0.3);

// Faster than scroll (foreground)
parallax(document.getElementById('foreground')!, 1.5);
```

### Horizontal Scroll Transform

```typescript
function horizontalScrollSection(container: HTMLElement) {
  const content = container.querySelector('.horizontal-content') as HTMLElement;
  const sections = content.children.length;

  const scroll = new ScrollAnimation(container);

  scroll.onProgress((progress) => {
    // Translate content horizontally based on vertical scroll
    const translateX = progress * (sections - 1) * -100;
    content.style.transform = `translateX(${translateX}vw)`;
  });

  return scroll;
}
```

### Sticky Progress Bar

```typescript
function stickyProgressBar(article: HTMLElement, progressBar: HTMLElement) {
  const scroll = new ScrollAnimation(article);

  scroll.onProgress((progress) => {
    progressBar.style.width = `${progress * 100}%`;
  });

  return scroll;
}
```

### Scroll-Triggered Animation

```typescript
function scrollTrigger(
  element: HTMLElement,
  onEnter: () => void,
  onLeave: () => void
) {
  let hasEntered = false;

  const scroll = new ScrollAnimation(element, {
    startOffset: 0.2, // Trigger when 20% visible
  });

  scroll.onProgress((progress) => {
    if (progress > 0 && !hasEntered) {
      hasEntered = true;
      onEnter();
    } else if (progress === 0 && hasEntered) {
      hasEntered = false;
      onLeave();
    }
  });

  return scroll;
}

// Usage
scrollTrigger(
  element,
  () => element.classList.add('visible'),
  () => element.classList.remove('visible')
);
```

### Counting Animation

```typescript
function countOnScroll(element: HTMLElement, target: number) {
  let hasTriggered = false;

  const scroll = new ScrollAnimation(element, {
    startOffset: 0.3,
  });

  scroll.onProgress((progress) => {
    if (progress > 0 && !hasTriggered) {
      hasTriggered = true;
      animateCount(element, 0, target, 1500);
    }
  });

  return scroll;
}

function animateCount(element: HTMLElement, from: number, to: number, duration: number) {
  const start = performance.now();

  function update(time: number) {
    const elapsed = time - start;
    const progress = Math.min(elapsed / duration, 1);
    const current = from + (to - from) * easeOutQuart(progress);

    element.textContent = Math.round(current).toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}
```

## Advanced Techniques

### Multiple Elements with Stagger

```typescript
function staggeredScrollReveal(elements: HTMLElement[]) {
  const scrolls: ScrollAnimation[] = [];

  elements.forEach((element, index) => {
    // Offset trigger point for each element
    const delayOffset = 0.05 * index;

    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';

    const scroll = new ScrollAnimation(element, {
      startOffset: 0.1 + delayOffset,
      endOffset: 0.4 + delayOffset,
    });

    scroll.onProgress((progress) => {
      element.style.opacity = String(progress);
      element.style.transform = `translateY(${30 * (1 - progress)}px)`;
    });

    scrolls.push(scroll);
  });

  return {
    dispose: () => scrolls.forEach(s => s.dispose()),
  };
}
```

### Scroll Snapping with Animation

```typescript
function scrollSnapSection(sections: HTMLElement[]) {
  sections.forEach((section, index) => {
    const scroll = new ScrollAnimation(section);

    scroll.onProgress((progress, info) => {
      // Check if this section is centered
      const isCentered = progress > 0.4 && progress < 0.6;

      if (isCentered) {
        section.classList.add('active');
        section.style.transform = 'scale(1)';
        section.style.opacity = '1';
      } else {
        section.classList.remove('active');
        const scale = 0.9 + (0.1 * Math.min(progress, 1 - progress) * 2);
        section.style.transform = `scale(${scale})`;
        section.style.opacity = String(0.5 + Math.min(progress, 1 - progress));
      }
    });
  });
}
```

### Reveal on Scroll Up/Down

```typescript
function directionalReveal(element: HTMLElement) {
  const scroll = new ScrollAnimation(element);

  scroll.onProgress((progress, info) => {
    if (info.direction === 'down' && progress > 0.2) {
      // Scrolling down and visible - slide in from bottom
      element.style.transform = 'translateY(0)';
      element.style.opacity = '1';
    } else if (info.direction === 'up' && progress < 0.8) {
      // Scrolling up and leaving - slide out to top
      element.style.transform = 'translateY(-20px)';
      element.style.opacity = '0';
    }
  });

  return scroll;
}
```

### Text Reveal Animation

```typescript
function textRevealOnScroll(element: HTMLElement) {
  // Split text into words
  const text = element.textContent!;
  const words = text.split(' ');

  element.innerHTML = words
    .map(word => `<span class="word"><span class="inner">${word}</span></span>`)
    .join(' ');

  const wordElements = element.querySelectorAll('.word .inner');

  const scroll = new ScrollAnimation(element, {
    startOffset: 0.1,
    endOffset: 0.6,
  });

  scroll.onProgress((progress) => {
    wordElements.forEach((word, index) => {
      const wordProgress = (progress * wordElements.length) - index;
      const clampedProgress = Math.max(0, Math.min(1, wordProgress));

      (word as HTMLElement).style.transform = `translateY(${(1 - clampedProgress) * 100}%)`;
      (word as HTMLElement).style.opacity = String(clampedProgress);
    });
  });

  return scroll;
}
```

## Custom Scroll Containers

By default, ScrollAnimation tracks the window scroll. You can specify a custom container:

```typescript
const container = document.getElementById('scroll-container');
const element = document.getElementById('animated');

const scroll = new ScrollAnimation(element, {
  container: container, // Track this element's scroll instead of window
});
```

### Modal with Internal Scroll

```typescript
function animateModalContent(modal: HTMLElement) {
  const sections = modal.querySelectorAll('.modal-section');

  sections.forEach(section => {
    const scroll = new ScrollAnimation(section as HTMLElement, {
      container: modal, // Track modal's scroll
      startOffset: 0.1,
    });

    scroll.onProgress((progress) => {
      (section as HTMLElement).style.opacity = String(progress);
    });
  });
}
```

## React Hook: useScrollAnimation

```typescript
import { useScrollAnimation } from '@philjs/motion';
import { useRef } from 'preact/hooks';

function AnimatedSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { progress, scrollInfo } = useScrollAnimation(ref, {
    startOffset: 0.1,
    endOffset: 0.5,
  });

  return (
    <div
      ref={ref}
      style={{
        opacity: progress,
        transform: `translateY(${(1 - progress) * 50}px)`,
      }}
    >
      <p>Scroll progress: {Math.round(progress * 100)}%</p>
      <p>Scroll direction: {scrollInfo?.direction || 'none'}</p>
    </div>
  );
}
```

### Multiple Animated Sections

```typescript
function AnimatedPage() {
  return (
    <>
      <Hero />
      <AnimatedSection delay={0} />
      <AnimatedSection delay={0.1} />
      <AnimatedSection delay={0.2} />
      <Footer />
    </>
  );
}

function AnimatedSection({ delay }: { delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { progress } = useScrollAnimation(ref, {
    startOffset: 0.1 + delay,
    endOffset: 0.4 + delay,
  });

  return (
    <section
      ref={ref}
      style={{
        opacity: progress,
        transform: `translateY(${(1 - progress) * 30}px)`,
      }}
    >
      Content here
    </section>
  );
}
```

## Performance Optimization

### Use will-change Sparingly

```typescript
function optimizedScrollAnimation(element: HTMLElement) {
  const scroll = new ScrollAnimation(element);

  // Add will-change when animation is active
  let isActive = false;

  scroll.onProgress((progress) => {
    if (progress > 0 && progress < 1) {
      if (!isActive) {
        isActive = true;
        element.style.willChange = 'transform, opacity';
      }
    } else {
      if (isActive) {
        isActive = false;
        element.style.willChange = 'auto';
      }
    }

    element.style.opacity = String(progress);
    element.style.transform = `translateY(${(1 - progress) * 50}px)`;
  });

  return scroll;
}
```

### Throttle Heavy Operations

```typescript
function heavyScrollAnimation(element: HTMLElement) {
  const scroll = new ScrollAnimation(element);

  let lastProgress = -1;

  scroll.onProgress((progress) => {
    // Only update if progress changed significantly
    if (Math.abs(progress - lastProgress) > 0.01) {
      lastProgress = progress;

      // Do expensive DOM operations
      updateComplexUI(progress);
    }
  });

  return scroll;
}
```

### Passive Event Listeners

ScrollAnimation uses passive event listeners for optimal scroll performance. The browser can start scrolling immediately without waiting for JavaScript.

### GPU-Accelerated Properties

Prefer transform and opacity for scroll animations:

```typescript
// Good - GPU accelerated
element.style.transform = `translateY(${offset}px)`;
element.style.opacity = String(progress);

// Avoid - triggers layout
element.style.top = `${offset}px`;
element.style.marginTop = `${offset}px`;
```

## Cleanup

Always dispose of scroll animations when components unmount:

```typescript
const scroll = new ScrollAnimation(element);

// When done
scroll.dispose();
```

## Next Steps

- [Spring Physics Deep Dive](./spring-physics.md)
- [Gesture-Driven Animations](./gestures.md)
- [FLIP Layout Animations](./flip-animations.md)
- [Animation Sequences](./sequences.md)
