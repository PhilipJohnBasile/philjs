# Accessibility Best Practices

Build inclusive PhilJS applications that everyone can use.

## Semantic HTML

### Use Correct Elements

```tsx
// ✅ Semantic HTML
function Article() {
  return (
    <article>
      <header>
        <h1>Article Title</h1>
        <time datetime="2024-01-15">January 15, 2024</time>
      </header>

      <section>
        <p>Article content...</p>
      </section>

      <footer>
        <address>By John Doe</address>
      </footer>
    </article>
  );
}

// ❌ Non-semantic divs
function BadArticle() {
  return (
    <div>
      <div>
        <div>Article Title</div>
        <div>January 15, 2024</div>
      </div>

      <div>
        <div>Article content...</div>
      </div>
    </div>
  );
}
```

### Navigation

```tsx
// ✅ Proper navigation structure
function Navigation() {
  return (
    <nav aria-label="Main navigation">
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </nav>
  );
}

// ✅ Multiple navigations
function Page() {
  return (
    <div>
      <nav aria-label="Main navigation">
        {/* Primary navigation */}
      </nav>

      <nav aria-label="Breadcrumb">
        {/* Breadcrumb navigation */}
      </nav>

      <main>
        {/* Content */}
      </main>

      <nav aria-label="Footer navigation">
        {/* Footer navigation */}
      </nav>
    </div>
  );
}
```

## ARIA Attributes

### ARIA Labels

```tsx
// ✅ Accessible buttons
function IconButton({ icon, onClick, label }: IconButtonProps) {
  return (
    <button onClick={onClick} aria-label={label}>
      {icon}
    </button>
  );
}

<IconButton
  icon={<TrashIcon />}
  onClick={deleteItem}
  label="Delete item"
/>

// ✅ Labeling form inputs
function FormField() {
  return (
    <div>
      <label htmlFor="email">Email Address</label>
      <input
        id="email"
        type="email"
        aria-describedby="email-hint"
        aria-required="true"
      />
      <div id="email-hint">We'll never share your email.</div>
    </div>
  );
}
```

### ARIA Roles

```tsx
// ✅ Custom interactive elements
function TabPanel({ children, id, isActive }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      id={id}
      aria-hidden={!isActive}
      tabIndex={isActive ? 0 : -1}
    >
      {children}
    </div>
  );
}

// ✅ Alert messages
function Alert({ message, type }: AlertProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={`alert alert-${type}`}
    >
      {message}
    </div>
  );
}
```

### ARIA States

```tsx
function Accordion({ title, children }: AccordionProps) {
  const isOpen = signal(false);

  return (
    <div>
      <button
        onClick={() => isOpen.set(!isOpen())}
        aria-expanded={isOpen()}
        aria-controls="accordion-content"
      >
        {title}
      </button>

      <div
        id="accordion-content"
        hidden={!isOpen()}
      >
        {children}
      </div>
    </div>
  );
}
```

## Keyboard Navigation

### Focus Management

```tsx
function Modal({ isOpen, onClose, children }: ModalProps) {
  let firstFocusableElement: HTMLElement | null = null;
  let lastFocusableElement: HTMLElement | null = null;

  effect(() => {
    if (!isOpen()) return;

    const modal = document.getElementById('modal');
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    firstFocusableElement = focusableElements[0] as HTMLElement;
    lastFocusableElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    // Focus first element
    firstFocusableElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }

      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstFocusableElement) {
          e.preventDefault();
          lastFocusableElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastFocusableElement) {
          e.preventDefault();
          firstFocusableElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  });

  if (!isOpen()) return null;

  return (
    <div
      id="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <h2 id="modal-title">Modal Title</h2>
      {children}
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

### Keyboard Shortcuts

```tsx
function useKeyboardShortcut(key: string, callback: () => void, ctrlKey = false) {
  effect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === key && (!ctrlKey || e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  });
}

function Editor() {
  const content = signal('');

  useKeyboardShortcut('s', () => save(), true); // Ctrl/Cmd + S
  useKeyboardShortcut('Escape', () => cancel());

  return (
    <div>
      <div aria-label="Keyboard shortcuts">
        <p><kbd>Ctrl+S</kbd> to save</p>
        <p><kbd>Esc</kbd> to cancel</p>
      </div>

      <textarea
        value={content()}
        onInput={(e) => content.set(e.currentTarget.value)}
        aria-label="Editor content"
      />
    </div>
  );
}
```

### Tab Index

```tsx
// ✅ Correct tabindex usage
function Card({ title, children }: CardProps) {
  return (
    <div tabIndex={0} className="card">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

// ❌ Avoid positive tabindex
<div tabIndex={1}>First</div>  // Don't do this
<div tabIndex={2}>Second</div> // Don't do this

// ✅ Use natural tab order or tabindex={0}
<div tabIndex={0}>Natural order</div>
```

## Screen Reader Support

### Descriptive Labels

```tsx
// ✅ Clear labels for screen readers
function SearchForm() {
  const query = signal('');

  return (
    <form role="search">
      <label htmlFor="search-input" className="sr-only">
        Search products
      </label>

      <input
        id="search-input"
        type="search"
        value={query()}
        onInput={(e) => query.set(e.currentTarget.value)}
        placeholder="Search..."
        aria-label="Search products"
      />

      <button type="submit" aria-label="Submit search">
        <SearchIcon aria-hidden="true" />
      </button>
    </form>
  );
}
```

### Live Regions

```tsx
function SearchResults() {
  const results = signal<Product[]>([]);
  const loading = signal(false);

  return (
    <div>
      {/* Announce status to screen readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {loading() && 'Loading results...'}
        {!loading() && `Found ${results().length} results`}
      </div>

      {/* Visual results */}
      <div aria-label="Search results">
        {results().map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
```

### Hiding Decorative Content

```tsx
// ✅ Hide decorative icons from screen readers
function Button({ label, icon }: ButtonProps) {
  return (
    <button>
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ✅ Hide purely visual elements
function Card() {
  return (
    <div>
      <div className="decorative-border" aria-hidden="true" />
      <h3>Card Title</h3>
      <p>Card content</p>
    </div>
  );
}
```

## Color and Contrast

### Color Contrast

```css
/* ✅ WCAG AA: At least 4.5:1 for normal text */
.text {
  color: #333;
  background: #fff;
  /* Contrast ratio: 12.6:1 ✓ */
}

/* ✅ WCAG AAA: At least 7:1 for normal text */
.text-high-contrast {
  color: #000;
  background: #fff;
  /* Contrast ratio: 21:1 ✓ */
}

/* ❌ Insufficient contrast */
.text-low-contrast {
  color: #999;
  background: #fff;
  /* Contrast ratio: 2.8:1 ✗ */
}
```

### Don't Rely on Color Alone

```tsx
// ❌ Color only
function Status({ status }: { status: 'success' | 'error' }) {
  return (
    <span className={status === 'success' ? 'green' : 'red'}>
      {status}
    </span>
  );
}

// ✅ Color + icon + text
function AccessibleStatus({ status }: { status: 'success' | 'error' }) {
  return (
    <span className={`status-${status}`}>
      {status === 'success' ? (
        <>
          <CheckIcon aria-hidden="true" />
          <span>Success</span>
        </>
      ) : (
        <>
          <ErrorIcon aria-hidden="true" />
          <span>Error</span>
        </>
      )}
    </span>
  );
}
```

## Forms

### Accessible Forms

```tsx
function ContactForm() {
  const name = signal('');
  const email = signal('');
  const message = signal('');
  const errors = signal<Record<string, string>>({});

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!name()) newErrors.name = 'Name is required';
    if (!email()) newErrors.email = 'Email is required';
    if (!message()) newErrors.message = 'Message is required';

    errors.set(newErrors);

    if (Object.keys(newErrors).length === 0) {
      await submitForm({ name: name(), email: email(), message: message() });
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Name field */}
      <div>
        <label htmlFor="name">
          Name <span aria-label="required">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name()}
          onInput={(e) => name.set(e.currentTarget.value)}
          aria-required="true"
          aria-invalid={!!errors().name}
          aria-describedby={errors().name ? 'name-error' : undefined}
        />
        {errors().name && (
          <div id="name-error" role="alert">
            {errors().name}
          </div>
        )}
      </div>

      {/* Email field */}
      <div>
        <label htmlFor="email">
          Email <span aria-label="required">*</span>
        </label>
        <input
          id="email"
          type="email"
          value={email()}
          onInput={(e) => email.set(e.currentTarget.value)}
          aria-required="true"
          aria-invalid={!!errors().email}
          aria-describedby={errors().email ? 'email-error' : undefined}
        />
        {errors().email && (
          <div id="email-error" role="alert">
            {errors().email}
          </div>
        )}
      </div>

      {/* Message field */}
      <div>
        <label htmlFor="message">
          Message <span aria-label="required">*</span>
        </label>
        <textarea
          id="message"
          value={message()}
          onInput={(e) => message.set(e.currentTarget.value)}
          aria-required="true"
          aria-invalid={!!errors().message}
          aria-describedby={errors().message ? 'message-error' : undefined}
        />
        {errors().message && (
          <div id="message-error" role="alert">
            {errors().message}
          </div>
        )}
      </div>

      <button type="submit">Send Message</button>
    </form>
  );
}
```

## Images

### Alt Text

```tsx
// ✅ Descriptive alt text
<img
  src="/product.jpg"
  alt="Red leather backpack with adjustable straps"
/>

// ✅ Empty alt for decorative images
<img
  src="/decorative-pattern.svg"
  alt=""
  role="presentation"
/>

// ✅ Complex images
<figure>
  <img
    src="/chart.png"
    alt="Bar chart showing sales increase from $10k to $50k over 6 months"
  />
  <figcaption>
    Detailed description: Sales started at $10,000 in January,
    increased steadily to $50,000 by June...
  </figcaption>
</figure>
```

## Responsive Design

### Font Sizing

```css
/* ✅ Use relative units */
body {
  font-size: 16px; /* Base */
}

h1 {
  font-size: 2rem; /* 32px, scales with user preferences */
}

p {
  font-size: 1rem; /* 16px */
}

/* ❌ Avoid fixed px for body text */
p {
  font-size: 14px; /* Doesn't scale */
}
```

### Touch Targets

```css
/* ✅ Minimum 44x44px touch targets */
.button {
  min-width: 44px;
  min-height: 44px;
  padding: 12px 24px;
}

/* ✅ Adequate spacing between targets */
.button-group button {
  margin: 8px;
}
```

## Focus Indicators

### Visible Focus States

```css
/* ❌ Never remove focus outlines */
*:focus {
  outline: none; /* DON'T DO THIS */
}

/* ✅ Custom focus styles */
button:focus {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* ✅ Focus-visible for mouse vs keyboard */
button:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}
```

## Testing Accessibility

### Manual Testing

```tsx
// Keyboard testing checklist:
// □ Can you navigate with Tab?
// □ Can you activate with Enter/Space?
// □ Can you escape modals with Esc?
// □ Is focus visible?
// □ Is focus trapped in modals?
// □ Is tab order logical?

// Screen reader testing:
// □ Test with NVDA (Windows)
// □ Test with JAWS (Windows)
// □ Test with VoiceOver (Mac/iOS)
// □ Test with TalkBack (Android)
```

### Automated Testing

```tsx
import { render } from '@testing-library/philjs';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Button accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <Button label="Click me" onClick={() => {}} />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## Summary

**Accessibility Best Practices:**

✅ Use semantic HTML elements
✅ Add ARIA labels and roles where needed
✅ Ensure keyboard navigation works
✅ Manage focus properly
✅ Provide sufficient color contrast
✅ Don't rely on color alone
✅ Make forms accessible with labels and error messages
✅ Add meaningful alt text to images
✅ Use relative font sizes
✅ Maintain visible focus indicators
✅ Test with keyboard and screen readers
✅ Run automated accessibility tests
✅ Follow WCAG 2.1 Level AA guidelines

**Next:** [Production →](./production.md)

