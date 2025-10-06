# Refs and DOM Access

Refs give you direct access to DOM elements. Learn when to use refs and how to manipulate the DOM directly.

## What You'll Learn

- What refs are and when to use them
- Creating and using refs
- Forwarding refs
- Common ref patterns
- Best practices

## What are Refs?

Refs provide a way to access DOM nodes or elements created in JSX:

```typescript
function FocusInput() {
  const inputRef = signal<HTMLInputElement | null>(null);

  const focusInput = () => {
    const input = inputRef();
    if (input) {
      input.focus();
    }
  };

  return (
    <div>
      <input ref={(el) => inputRef.set(el)} />
      <button onClick={focusInput}>Focus Input</button>
    </div>
  );
}
```

## When to Use Refs

✅ **Use refs for:**
- Managing focus, text selection
- Triggering animations
- Integrating third-party libraries
- Measuring element size/position
- Playing/pausing media elements
- Scrolling to elements

❌ **Don't use refs for:**
- Anything that can be done declaratively
- Reading/writing values that should be in signals
- Event handling (use onClick, etc.)

## Creating Refs

### Basic Ref

```typescript
function Component() {
  const elementRef = signal<HTMLDivElement | null>(null);

  return (
    <div ref={(el) => elementRef.set(el)}>
      Content
    </div>
  );
}
```

### With TypeScript Types

```typescript
// Input element
const inputRef = signal<HTMLInputElement | null>(null);
<input ref={(el) => inputRef.set(el)} />

// Div element
const divRef = signal<HTMLDivElement | null>(null);
<div ref={(el) => divRef.set(el)} />

// Button element
const buttonRef = signal<HTMLButtonElement | null>(null);
<button ref={(el) => buttonRef.set(el)} />

// Canvas element
const canvasRef = signal<HTMLCanvasElement | null>(null);
<canvas ref={(el) => canvasRef.set(el)} />

// Video element
const videoRef = signal<HTMLVideoElement | null>(null);
<video ref={(el) => videoRef.set(el)} />
```

## Common Patterns

### Focus Management

```typescript
function AutoFocusInput() {
  const inputRef = signal<HTMLInputElement | null>(null);

  effect(() => {
    const input = inputRef();
    if (input) {
      input.focus();
    }
  });

  return <input ref={(el) => inputRef.set(el)} placeholder="Auto-focused" />;
}

// Focus on button click
function FocusOnClick() {
  const inputRef = signal<HTMLInputElement | null>(null);

  const handleFocus = () => {
    inputRef()?.focus();
  };

  return (
    <div>
      <input ref={(el) => inputRef.set(el)} />
      <button onClick={handleFocus}>Focus Input</button>
    </div>
  );
}
```

### Text Selection

```typescript
function SelectAllText() {
  const inputRef = signal<HTMLInputElement | null>(null);

  const selectAll = () => {
    inputRef()?.select();
  };

  return (
    <div>
      <input
        ref={(el) => inputRef.set(el)}
        defaultValue="Select this text"
      />
      <button onClick={selectAll}>Select All</button>
    </div>
  );
}
```

### Scroll into View

```typescript
function ScrollToElement() {
  const elementRef = signal<HTMLDivElement | null>(null);

  const scrollToElement = () => {
    elementRef()?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      <button onClick={scrollToElement}>Scroll to Target</button>

      <div style={{ height: '100vh' }}>Spacer</div>

      <div
        ref={(el) => elementRef.set(el)}
        style={{ background: 'yellow', padding: '2rem' }}
      >
        Target Element
      </div>
    </div>
  );
}
```

### Measuring Elements

```typescript
function MeasureElement() {
  const divRef = signal<HTMLDivElement | null>(null);
  const size = signal({ width: 0, height: 0 });

  const measure = () => {
    const div = divRef();
    if (div) {
      const rect = div.getBoundingClientRect();
      size.set({ width: rect.width, height: rect.height });
    }
  };

  effect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  });

  return (
    <div>
      <div ref={(el) => divRef.set(el)} style={{ padding: '2rem', background: '#f0f0f0' }}>
        Resize the window
      </div>
      <p>Width: {size().width}px, Height: {size().height}px</p>
    </div>
  );
}
```

### Canvas Drawing

```typescript
function Canvas() {
  const canvasRef = signal<HTMLCanvasElement | null>(null);

  effect(() => {
    const canvas = canvasRef();
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw a circle
    ctx.beginPath();
    ctx.arc(100, 100, 50, 0, Math.PI * 2);
    ctx.fillStyle = '#667eea';
    ctx.fill();
  });

  return <canvas ref={(el) => canvasRef.set(el)} width={200} height={200} />;
}
```

### Video Control

```typescript
function VideoPlayer({ src }: { src: string }) {
  const videoRef = signal<HTMLVideoElement | null>(null);
  const isPlaying = signal(false);

  const togglePlay = () => {
    const video = videoRef();
    if (!video) return;

    if (video.paused) {
      video.play();
      isPlaying.set(true);
    } else {
      video.pause();
      isPlaying.set(false);
    }
  };

  return (
    <div>
      <video ref={(el) => videoRef.set(el)} src={src} />
      <button onClick={togglePlay}>
        {isPlaying() ? 'Pause' : 'Play'}
      </button>
    </div>
  );
}
```

### Third-Party Libraries

```typescript
// Integrating a charting library
function Chart({ data }: { data: number[] }) {
  const chartRef = signal<HTMLDivElement | null>(null);

  effect(() => {
    const container = chartRef();
    if (!container) return;

    // Initialize chart library
    const chart = new SomeChartLibrary(container, {
      data: data,
      type: 'line'
    });

    // Cleanup
    return () => chart.destroy();
  });

  return <div ref={(el) => chartRef.set(el)} />;
}
```

## Multiple Refs

```typescript
function MultipleInputs() {
  const input1 = signal<HTMLInputElement | null>(null);
  const input2 = signal<HTMLInputElement | null>(null);
  const input3 = signal<HTMLInputElement | null>(null);

  const focusNext = (current: number) => {
    if (current === 1) input2()?.focus();
    if (current === 2) input3()?.focus();
  };

  return (
    <div>
      <input
        ref={(el) => input1.set(el)}
        onKeyPress={(e) => e.key === 'Enter' && focusNext(1)}
      />
      <input
        ref={(el) => input2.set(el)}
        onKeyPress={(e) => e.key === 'Enter' && focusNext(2)}
      />
      <input ref={(el) => input3.set(el)} />
    </div>
  );
}
```

## Refs in Lists

```typescript
function TodoList({ todos }: { todos: Todo[] }) {
  const inputRefs = signal<Map<number, HTMLInputElement>>(new Map());

  const focusTodo = (id: number) => {
    const input = inputRefs().get(id);
    input?.focus();
  };

  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>
          <input
            ref={(el) => {
              if (el) {
                const refs = new Map(inputRefs());
                refs.set(todo.id, el);
                inputRefs.set(refs);
              }
            }}
            value={todo.text}
          />
          <button onClick={() => focusTodo(todo.id)}>Focus</button>
        </li>
      ))}
    </ul>
  );
}
```

## Ref Callbacks

The ref prop accepts a function that's called when the element mounts:

```typescript
function Component() {
  return (
    <div
      ref={(el) => {
        if (el) {
          console.log('Element mounted:', el);
          // Do something with the element
        } else {
          console.log('Element unmounted');
        }
      }}
    >
      Content
    </div>
  );
}
```

## Forwarding Refs

Pass refs through components:

```typescript
interface InputProps {
  placeholder?: string;
  inputRef?: (el: HTMLInputElement | null) => void;
}

function CustomInput({ placeholder, inputRef }: InputProps) {
  return (
    <div className="custom-input">
      <input ref={inputRef} placeholder={placeholder} />
    </div>
  );
}

// Usage:
function Parent() {
  const inputRef = signal<HTMLInputElement | null>(null);

  const focusInput = () => {
    inputRef()?.focus();
  };

  return (
    <div>
      <CustomInput
        placeholder="Type here"
        inputRef={(el) => inputRef.set(el)}
      />
      <button onClick={focusInput}>Focus</button>
    </div>
  );
}
```

## Observer Pattern

Use IntersectionObserver with refs:

```typescript
function LazyImage({ src, alt }: { src: string; alt: string }) {
  const imgRef = signal<HTMLImageElement | null>(null);
  const isVisible = signal(false);

  effect(() => {
    const img = imgRef();
    if (!img) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          isVisible.set(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(img);

    return () => observer.disconnect();
  });

  return (
    <img
      ref={(el) => imgRef.set(el)}
      src={isVisible() ? src : 'placeholder.jpg'}
      alt={alt}
    />
  );
}
```

## Best Practices

### Check for Null

```typescript
// ✅ Always check if ref is null
const element = elementRef();
if (element) {
  element.focus();
}

// Or use optional chaining
elementRef()?.focus();

// ❌ Don't assume element exists
elementRef().focus(); // May crash!
```

### Use Effects for Initialization

```typescript
// ✅ Good - effect runs after element is mounted
function Component() {
  const canvasRef = signal<HTMLCanvasElement | null>(null);

  effect(() => {
    const canvas = canvasRef();
    if (canvas) {
      // Initialize canvas
    }
  });

  return <canvas ref={(el) => canvasRef.set(el)} />;
}
```

### Clean Up Side Effects

```typescript
// ✅ Good - cleanup function
effect(() => {
  const element = elementRef();
  if (!element) return;

  const handler = () => console.log('clicked');
  element.addEventListener('click', handler);

  return () => {
    element.removeEventListener('click', handler);
  };
});
```

### Prefer Declarative Approaches

```typescript
// ❌ Imperative with ref
const textRef = signal<HTMLSpanElement | null>(null);

effect(() => {
  const span = textRef();
  if (span) {
    span.textContent = count().toString();
  }
});

<span ref={(el) => textRef.set(el)} />

// ✅ Declarative without ref
<span>{count()}</span>
```

### Don't Overuse Refs

```typescript
// ❌ Using ref for state
const valueRef = signal<HTMLInputElement | null>(null);

const getValue = () => valueRef()?.value;

// ✅ Use signals for state
const value = signal('');

<input
  value={value()}
  onInput={(e) => value.set(e.target.value)}
/>
```

## Common Mistakes

### Calling Ref During Render

```typescript
// ❌ Wrong - ref not available during render
function Component() {
  const divRef = signal<HTMLDivElement | null>(null);

  // Element not mounted yet!
  divRef()?.focus();

  return <div ref={(el) => divRef.set(el)} />;
}

// ✅ Correct - use effect
function Component() {
  const divRef = signal<HTMLDivElement | null>(null);

  effect(() => {
    divRef()?.focus();
  });

  return <div ref={(el) => divRef.set(el)} />;
}
```

### Storing Non-DOM Values

```typescript
// ❌ Don't use refs for regular state
const countRef = signal(0);

// ✅ Use signals for state
const count = signal(0);
```

## Summary

You've learned:

✅ What refs are and when to use them
✅ Creating refs with signals
✅ Common patterns: focus, scroll, measure, canvas
✅ Forwarding refs through components
✅ Integration with third-party libraries
✅ Observers (Intersection, Resize, Mutation)
✅ Best practices and common mistakes

Use refs sparingly - prefer declarative approaches when possible!

---

**Next:** [Error Boundaries →](./error-boundaries.md) Handle errors gracefully in your components
