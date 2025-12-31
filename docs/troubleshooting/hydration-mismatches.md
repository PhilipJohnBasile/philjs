# Hydration Mismatches

Complete guide to diagnosing and fixing hydration mismatch errors in PhilJS SSR applications.

## What is Hydration?

Hydration is the process where PhilJS attaches event listeners and makes server-rendered HTML interactive on the client. For hydration to work correctly, the client-rendered output must match the server-rendered HTML exactly.

## Understanding Hydration Mismatches

### What are Hydration Mismatches?

A hydration mismatch occurs when the HTML rendered on the server doesn't match what the client expects to render. This breaks the hydration process and can lead to:

- Incorrect UI rendering
- Lost event handlers
- State inconsistencies
- Unexpected component behavior

### Common Error Messages

```
Warning: Hydration failed because the initial UI does not match
what was rendered on the server.

Error: Text content does not match server-rendered HTML
Expected: "..." but got: "..."

Warning: Expected server HTML to contain a matching <div> in <div>
```

## Common Causes and Solutions

### 1. Browser-Only APIs

**Problem:** Using browser-specific APIs that don't exist on the server.

```tsx
// Problem: window doesn't exist on server
function WindowWidth() {
  return <div>Width: {window.innerWidth}px</div>;
}
```

**Solution:** Check environment before using browser APIs.

```tsx
// Solution: Check for browser environment
function WindowWidth() {
  const [width, setWidth] = signal(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );

  effect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  });

  return <div>Width: {width()}px</div>;
}
```

**Better Solution:** Use client-only mounting.

```tsx
// Best: Only render on client
function WindowWidth() {
  const [mounted, setMounted] = signal(false);
  const [width, setWidth] = signal(0);

  effect(() => {
    setMounted(true);
    setWidth(window.innerWidth);

    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  });

  if (!mounted()) {
    return <div>Loading...</div>;
  }

  return <div>Width: {width()}px</div>;
}
```

### 2. Random Values

**Problem:** Using random or time-based values that differ between server and client.

```tsx
// Problem: Different random value on server vs client
function RandomNumber() {
  const random = Math.random();
  return <div>Random: {random}</div>;
}

// Problem: Different timestamp
function Timestamp() {
  return <div>Time: {Date.now()}</div>;
}
```

**Solution:** Generate random values in effects or use stable values.

```tsx
// Solution: Generate in effect (client-only)
function RandomNumber() {
  const [random, setRandom] = signal<number | null>(null);

  effect(() => {
    setRandom(Math.random());
  });

  if (random() === null) {
    return <div>Loading...</div>;
  }

  return <div>Random: {random()}</div>;
}

// Solution: Pass timestamp from server
function Timestamp({ serverTime }: { serverTime: number }) {
  return <div>Time: {serverTime}</div>;
}
```

### 3. localStorage/sessionStorage

**Problem:** Accessing storage APIs that don't exist on server.

```tsx
// Problem: localStorage not available on server
function UserPreferences() {
  const theme = localStorage.getItem('theme') || 'light';
  return <div class={theme}>Content</div>;
}
```

**Solution:** Read storage in effects.

```tsx
// Solution: Load from storage on client
function UserPreferences() {
  const [theme, setTheme] = signal('light');

  effect(() => {
    if (typeof window === 'undefined') return;

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
  });

  return <div class={theme()}>Content</div>;
}
```

**Better Solution:** Use SSR-compatible storage.

```tsx
// Best: Server-compatible approach
interface PreferencesProps {
  initialTheme?: string;
}

function UserPreferences({ initialTheme = 'light' }: PreferencesProps) {
  const [theme, setTheme] = signal(initialTheme);

  effect(() => {
    if (typeof window === 'undefined') return;

    // Sync with localStorage after hydration
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && savedTheme !== theme()) {
      setTheme(savedTheme);
    }

    // Save changes to localStorage
    return effect(() => {
      localStorage.setItem('theme', theme());
    });
  });

  return <div class={theme()}>Content</div>;
}

// On server, read from cookie
// On client, read from localStorage
```

### 4. Conditional Rendering Based on Client State

**Problem:** Different rendering logic on server vs client.

```tsx
// Problem: isMobile() returns different values
function ResponsiveNav() {
  const mobile = isMobile(); // Different on server

  return mobile ? <MobileNav /> : <DesktopNav />;
}
```

**Solution:** Use CSS-based responsive design or defer rendering.

```tsx
// Solution 1: CSS-based (preferred)
function ResponsiveNav() {
  return (
    <nav>
      <div className="mobile-only">
        <MobileNav />
      </div>
      <div className="desktop-only">
        <DesktopNav />
      </div>
    </nav>
  );
}

// CSS
// .mobile-only { display: block; }
// .desktop-only { display: none; }
// @media (min-width: 768px) {
//   .mobile-only { display: none; }
//   .desktop-only { display: block; }
// }

// Solution 2: Client-side detection
function ResponsiveNav() {
  const [mounted, setMounted] = signal(false);
  const [mobile, setMobile] = signal(false);

  effect(() => {
    setMounted(true);
    setMobile(window.innerWidth < 768);
  });

  if (!mounted()) {
    // Render both on server, hide with CSS
    return (
      <nav>
        <div className="mobile-nav"><MobileNav /></div>
        <div className="desktop-nav"><DesktopNav /></div>
      </nav>
    );
  }

  return mobile() ? <MobileNav /> : <DesktopNav />;
}
```

### 5. Third-Party Scripts

**Problem:** Third-party scripts modifying the DOM.

```tsx
// Problem: Analytics script modifies DOM
function Page() {
  return (
    <div>
      <h1>Welcome</h1>
      <script src="https://analytics.example.com/script.js" />
    </div>
  );
}
```

**Solution:** Load scripts after hydration.

```tsx
// Solution: Load in effect
function Page() {
  effect(() => {
    const script = document.createElement('script');
    script.src = 'https://analytics.example.com/script.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  });

  return (
    <div>
      <h1>Welcome</h1>
    </div>
  );
}
```

### 6. Date/Time Formatting

**Problem:** Different timezone or locale on server vs client.

```tsx
// Problem: Server and client in different timezones
function CurrentTime() {
  const now = new Date().toLocaleString();
  return <div>Current time: {now}</div>;
}
```

**Solution:** Pass server time and format on client, or use UTC.

```tsx
// Solution: Use consistent time
function CurrentTime({ serverTime }: { serverTime: string }) {
  const [displayTime, setDisplayTime] = signal(serverTime);

  effect(() => {
    // Update with client-formatted time after hydration
    const now = new Date().toLocaleString();
    setDisplayTime(now);

    // Optionally update every second
    const interval = setInterval(() => {
      setDisplayTime(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(interval);
  });

  return <div>Current time: {displayTime()}</div>;
}

// On server
const serverTime = new Date().toLocaleString();
<CurrentTime serverTime={serverTime} />
```

### 7. User-Agent Detection

**Problem:** Different user agent detection results.

```tsx
// Problem: navigator not available on server
function BrowserInfo() {
  const browser = navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other';
  return <div>Browser: {browser}</div>;
}
```

**Solution:** Pass user agent from server or use client-only rendering.

```tsx
// Solution: Pass from server
function BrowserInfo({ userAgent }: { userAgent: string }) {
  const browser = userAgent.includes('Chrome') ? 'Chrome' : 'Other';
  return <div>Browser: {browser}</div>;
}

// On server (with request object)
const userAgent = request.headers.get('user-agent') || '';
<BrowserInfo userAgent={userAgent} />

// Or client-only
function BrowserInfo() {
  const [browser, setBrowser] = signal('Unknown');

  effect(() => {
    const ua = navigator.userAgent;
    setBrowser(ua.includes('Chrome') ? 'Chrome' : 'Other');
  });

  return <div>Browser: {browser()}</div>;
}
```

## Debugging Hydration Mismatches

### 1. Enable Hydration Warnings

```tsx
// Enable detailed hydration warnings
import { hydrate } from '@philjs/core';

hydrate(<App />, document.getElementById('app')!, {
  debug: true,
  onHydrationMismatch: (details) => {
    console.error('Hydration mismatch:', details);
  }
});
```

### 2. Compare Server and Client HTML

```tsx
// Log HTML before and after hydration
if (import.meta.env.DEV) {
  const beforeHydration = document.getElementById('app')?.innerHTML;
  console.log('Before hydration:', beforeHydration);

  hydrate(<App />, document.getElementById('app')!);

  requestAnimationFrame(() => {
    const afterHydration = document.getElementById('app')?.innerHTML;
    console.log('After hydration:', afterHydration);

    if (beforeHydration !== afterHydration) {
      console.error('HTML changed during hydration!');
    }
  });
}
```

### 3. Use Hydration Markers

```tsx
// Add markers to identify where mismatch occurs
function DebugWrapper({ children, name }: { children: any; name: string }) {
  if (import.meta.env.DEV) {
    return (
      <div data-debug={name}>
        {children}
      </div>
    );
  }
  return children;
}

function App() {
  return (
    <DebugWrapper name="app">
      <DebugWrapper name="header">
        <Header />
      </DebugWrapper>
      <DebugWrapper name="content">
        <Content />
      </DebugWrapper>
    </DebugWrapper>
  );
}
```

### 4. Suppress Hydration Warnings (Last Resort)

Sometimes you intentionally want different content on client vs server. Use suppression sparingly.

```tsx
// Suppress hydration warning for specific element
function TimeBasedContent() {
  const [content, setContent] = signal('Loading...');

  effect(() => {
    setContent(new Date().toISOString());
  });

  return (
    <div suppressHydrationWarning>
      {content()}
    </div>
  );
}
```

## Best Practices for SSR Hydration

### 1. Use the Same Data

```tsx
// Serialize data on server, reuse on client
// On server
const initialData = await fetchData();

const html = renderToString(
  <App initialData={initialData} />
);

const page = `
  <html>
    <body>
      <div id="app">${html}</div>
      <script>
        window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};
      </script>
      <script src="/client.js"></script>
    </body>
  </html>
`;

// On client
const initialData = window.__INITIAL_DATA__;
hydrate(
  <App initialData={initialData} />,
  document.getElementById('app')!
);
```

### 2. Defer Client-Only Content

```tsx
// Mark client-only components
function ClientOnly({ children }: { children: any }) {
  const [mounted, setMounted] = signal(false);

  effect(() => {
    setMounted(true);
  });

  return mounted() ? children : null;
}

// Usage
function Page() {
  return (
    <div>
      <h1>Welcome</h1>
      <ClientOnly>
        <BrowserSpecificFeature />
      </ClientOnly>
    </div>
  );
}
```

### 3. Use Stable IDs

```tsx
// Problem: Random IDs differ between server and client
function Form() {
  const id = `input-${Math.random()}`;
  return <input id={id} />;
}

// Solution: Use stable IDs
let idCounter = 0;

function Form() {
  const [id] = signal(`input-${idCounter++}`);
  return <input id={id()} />;
}
```

### 4. Test SSR Rendering

```tsx
// Test that component renders same on server and client
import { describe, it, expect } from 'vitest';
import { renderToString } from '@philjs/core';

describe('MyComponent SSR', () => {
  it('renders consistently', () => {
    const serverHtml = renderToString(<MyComponent />);

    // Simulate client render
    const div = document.createElement('div');
    div.innerHTML = serverHtml;

    // Would hydrate here in real scenario
    // For test, just verify HTML is valid
    expect(div.innerHTML).toContain('expected content');
  });
});
```

## Hydration Checklist

When experiencing hydration mismatches:

- [ ] Check for browser-only APIs (window, document, navigator)
- [ ] Look for random values or timestamps
- [ ] Verify localStorage/sessionStorage usage
- [ ] Check for conditional rendering based on client state
- [ ] Review third-party scripts and their side effects
- [ ] Verify date/time formatting consistency
- [ ] Check user-agent or device detection
- [ ] Ensure data passed to client matches server
- [ ] Look for CSS-in-JS that differs between renders
- [ ] Review any component initialization that happens in effects
- [ ] Check for state that initializes differently
- [ ] Verify all IDs are stable between renders

## Advanced Patterns

### Lazy Hydration

Only hydrate components when they become visible:

```tsx
function LazyHydrate({ children }: { children: any }) {
  const [hydrated, setHydrated] = signal(false);
  const ref = signal<HTMLElement | null>(null);

  effect(() => {
    const element = ref();
    if (!element) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setHydrated(true);
        observer.disconnect();
      }
    });

    observer.observe(element);

    return () => observer.disconnect();
  });

  return (
    <div ref={ref}>
      {hydrated() ? children : <div dangerouslySetInnerHTML={{ __html: '' }} />}
    </div>
  );
}
```

### Progressive Hydration

Hydrate critical components first:

```tsx
function App() {
  return (
    <>
      {/* Hydrate immediately */}
      <Header priority="high" />

      {/* Hydrate when idle */}
      <Sidebar priority="low" />

      {/* Hydrate when visible */}
      <Footer priority="lazy" />
    </>
  );
}
```

## Summary

**Key Takeaways:**

- Server and client must render identical HTML for hydration to work
- Use effects for client-only code (browser APIs, storage, etc.)
- Pass server-computed values to client via props or serialization
- Use CSS for responsive design instead of JS when possible
- Test SSR rendering to catch mismatches early
- Use suppressHydrationWarning only when necessary
- Consider progressive/lazy hydration for performance

**Common Patterns:**

```tsx
// Client-only rendering
const [mounted, setMounted] = signal(false);
effect(() => setMounted(true));
if (!mounted()) return <Placeholder />;

// Server data serialization
window.__INITIAL_DATA__ = serverData;

// Stable initialization
const [value] = signal(initialValue);
```

**Next:**
- [SSR Issues](./ssr-issues.md) - More SSR troubleshooting
- [Common Issues](./common-issues.md) - General problems
- [Debugging Guide](./debugging.md) - Debugging techniques
