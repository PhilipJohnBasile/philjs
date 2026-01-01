# Automatic Accessibility

PhilJS provides automatic accessibility features that improve your application's accessibility with minimal developer effort. The framework automatically generates ARIA labels, validates heading hierarchy, manages keyboard navigation, and checks color contrast.

## Overview

PhilJS accessibility features include:

- **Automatic ARIA labels** for common elements
- **Heading hierarchy validation** to ensure proper document structure
- **Color contrast checking** against WCAG standards
- **Keyboard navigation** utilities
- **Focus management** for modals and dialogs
- **Screen reader announcements**
- **Accessibility auditing** and reporting

## Quick Start

```typescript
import { configureA11y } from '@philjs/core';

// Enable all accessibility features
configureA11y({
  autoAria: true,
  headingHierarchy: true,
  keyboardNav: true,
  colorContrast: true,
  focusManagement: true,
  devWarnings: true,
  minContrastRatio: 4.5, // WCAG AA
});
```

## Configuration

### Global Configuration

```typescript
import { configureA11y, getA11yConfig } from '@philjs/core';

configureA11y({
  autoAria: true, // Auto-generate ARIA labels
  headingHierarchy: true, // Validate heading structure
  keyboardNav: true, // Enable keyboard navigation
  colorContrast: true, // Check color contrast
  focusManagement: true, // Manage focus
  devWarnings: true, // Show warnings in development
  minContrastRatio: 4.5, // WCAG AA (or 7 for AAA)
});

// Get current configuration
const config = getA11yConfig();
```

## Automatic ARIA Labels

### Enhanced Elements

PhilJS automatically enhances elements with appropriate ARIA attributes:

```typescript
import { enhanceWithAria } from '@philjs/core';

// Button
const button = enhanceWithAria('button', { children: 'Submit' });
// Result: { role: 'button', 'aria-label': 'Submit', ...props }

// Link
const link = enhanceWithAria('a', { href: '/profile' });
// Result: { role: 'link', 'aria-label': 'Link to /profile', ...props }

// Input
const input = enhanceWithAria('input', { type: 'email', placeholder: 'Email' });
// Result: { 'aria-label': 'Input field email', 'aria-required': 'false', ...props }

// Image
const img = enhanceWithAria('img', { src: 'photo.jpg' });
// Result: { role: 'img', 'aria-label': 'Image', ...props }
```

### Component Usage

Elements are automatically enhanced during rendering:

```typescript
function MyComponent() {
  return (
    <div>
      {/* Automatically gets ARIA attributes */}
      <button>Click Me</button>

      {/* Skip auto-enhancement with explicit ARIA */}
      <button aria-label="Custom label">Action</button>
    </div>
  );
}
```

## Heading Hierarchy

### Validation

PhilJS validates that headings follow proper hierarchy:

```typescript
import { validateHeadingHierarchy, getHeadingWarnings } from '@philjs/core';

function MyPage() {
  return (
    <div>
      <h1>Page Title</h1>
      <h2>Section 1</h2>
      <h3>Subsection 1.1</h3>
      {/* ⚠️ Warning: Skips from h3 to h5 */}
      <h5>Subsubsection</h5>
    </div>
  );
}

// Get warnings
const warnings = getHeadingWarnings();
// [{
//   type: 'heading',
//   severity: 'warning',
//   message: 'Heading skips from h3 to h5',
//   element: 'h5',
//   suggestion: 'Use h4 instead of h5 to maintain hierarchy'
// }]
```

### Reset Tracker

Reset the heading tracker for testing or multi-page apps:

```typescript
import { resetHeadingTracker } from '@philjs/core';

// Reset between page navigations
resetHeadingTracker();
```

## Color Contrast

### Contrast Ratio Calculation

Calculate contrast ratio between two colors:

```typescript
import { getContrastRatio } from '@philjs/core';

const ratio = getContrastRatio('#000000', '#ffffff');
// Returns: 21 (maximum contrast)

const ratio2 = getContrastRatio('#666666', '#999999');
// Returns: ~2.8 (insufficient for WCAG AA)
```

### Validation

Validate color combinations against WCAG standards:

```typescript
import { validateColorContrast } from '@philjs/core';

const result = validateColorContrast('#000000', '#ffffff');
// {
//   passes: true,
//   ratio: 21
// }

const result2 = validateColorContrast('#777777', '#888888');
// {
//   passes: false,
//   ratio: 1.2,
//   warning: {
//     type: 'contrast',
//     severity: 'error',
//     message: 'Insufficient color contrast: 1.2:1 (minimum 4.5:1)',
//     suggestion: 'Increase contrast between #777777 and #888888'
//   }
// }

// For large text (lower requirement)
const largeTextResult = validateColorContrast('#777777', '#888888', true);
// Minimum ratio: 3:1
```

## Keyboard Navigation

### KeyboardNavigator Class

Manage keyboard navigation programmatically:

```typescript
import { KeyboardNavigator } from '@philjs/core';

const navigator = new KeyboardNavigator();

// Get all focusable elements
const elements = navigator.getFocusableElements();

// Focus first element
navigator.focusFirst();

// Focus last element
navigator.focusLast();

// Focus next element
navigator.focusNext();

// Focus previous element
navigator.focusPrevious();

// Within a specific container
const modal = document.querySelector('.modal');
navigator.focusFirst(modal);
```

### Focus Trapping

Trap focus within a container (useful for modals):

```typescript
import { KeyboardNavigator } from '@philjs/core';

function Modal({ isOpen, children }) {
  let cleanup: (() => void) | null = null;

  effect(() => {
    if (isOpen && modalRef) {
      const navigator = new KeyboardNavigator();
      cleanup = navigator.trapFocus(modalRef);
    } else {
      cleanup?.();
    }
  });

  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      {children}
    </div>
  );
}
```

## Focus Management

### Create Focus Manager

```typescript
import { createFocusManager } from '@philjs/core';

const focusManager = createFocusManager();

// Focus first focusable element
focusManager.focusFirst();

// Focus last focusable element
focusManager.focusLast();

// Focus next in sequence
focusManager.focusNext();

// Focus previous in sequence
focusManager.focusPrevious();

// Trap focus in container
const releaseTrap = focusManager.trapFocus(container);

// Get currently focused element (reactive)
const currentFocus = focusManager.getCurrentFocus();
console.log(currentFocus());
```

## Screen Reader Support

### Announcements

Announce messages to screen readers:

```typescript
import { announceToScreenReader } from '@philjs/core';

// Polite announcement (waits for current speech to finish)
announceToScreenReader('Form submitted successfully', 'polite');

// Assertive announcement (interrupts current speech)
announceToScreenReader('Error: Please fix form errors', 'assertive');
```

### Loading States

Create accessible loading states:

```typescript
import { createLoadingState } from '@philjs/core';

function DataComponent() {
  const loading = signal(true);

  return (
    <div>
      {loading() && createLoadingState('Loading data...')}
      {/* Renders: <div role="status" aria-live="polite" aria-busy="true">Loading data...</div> */}

      {!loading() && <DataDisplay />}
    </div>
  );
}
```

## Skip Links

Add skip navigation links:

```typescript
import { addSkipLink } from '@philjs/core';

function App() {
  useEffect(() => {
    addSkipLink('Skip to main content', '#main-content');
    addSkipLink('Skip to navigation', '#nav');
  }, []);

  return (
    <div>
      <nav id="nav">...</nav>
      <main id="main-content">...</main>
    </div>
  );
}
```

## Accessibility Auditing

### Run Audit

Perform a full accessibility audit:

```typescript
import { auditAccessibility } from '@philjs/core';

const report = auditAccessibility(document.body);

console.log('Accessibility Score:', report.score); // 0-100
console.log('Passed checks:', report.passed);
console.log('Failed checks:', report.failed);
console.log('Warnings:', report.warnings);

// Example warning:
// {
//   type: 'heading',
//   severity: 'warning',
//   message: 'Heading skips from h1 to h3',
//   element: 'h3',
//   suggestion: 'Use h2 instead'
// }
```

### Monitoring

Start continuous accessibility monitoring:

```typescript
import { startA11yMonitoring } from '@philjs/core';

const stopMonitoring = startA11yMonitoring((report) => {
  if (report.score < 80) {
    console.warn('Accessibility score dropped:', report.score);
  }

  report.warnings.forEach(warning => {
    if (warning.severity === 'error') {
      console.error(`A11y Error: ${warning.message}`);
    }
  });
});

// Stop monitoring when done
stopMonitoring();
```

## Best Practices

### 1. Semantic HTML

Use semantic HTML elements for better accessibility:

```typescript
// Good - semantic HTML
function Navigation() {
  return (
    <nav>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
      </ul>
    </nav>
  );
}

// Avoid - generic divs
function Navigation() {
  return (
    <div className="nav">
      <div className="nav-item">
        <span onClick={() => navigate('/')}>Home</span>
      </div>
    </div>
  );
}
```

### 2. Proper Heading Hierarchy

```typescript
// Good - proper hierarchy
<h1>Main Title</h1>
<h2>Section</h2>
<h3>Subsection</h3>
<h3>Another Subsection</h3>
<h2>Another Section</h2>

// Bad - skips levels
<h1>Main Title</h1>
<h3>Subsection</h3> {/* Skips h2 */}
<h5>Subsubsection</h5> {/* Skips h4 */}
```

### 3. Color Contrast

```typescript
import { validateColorContrast } from '@philjs/core';

const theme = {
  // Good - high contrast
  primary: { bg: '#0066cc', text: '#ffffff' }, // 7.1:1

  // Bad - low contrast
  secondary: { bg: '#e0e0e0', text: '#cccccc' }, // 1.4:1
};

// Validate during development
const result = validateColorContrast(theme.secondary.text, theme.secondary.bg);
if (!result.passes && process.env.NODE_ENV === 'development') {
  console.warn(result.warning?.message);
}
```

### 4. Keyboard Accessibility

```typescript
// Good - keyboard accessible
<button onClick={handleClick}>
  Submit
</button>

<a href="/page" onClick={handleClick}>
  Go to page
</a>

// Bad - not keyboard accessible
<div onClick={handleClick}>
  Click me
</div>

// Fix for div - add role and tabindex
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyPress={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Click me
</div>
```

### 5. Focus Management

```typescript
function Modal({ isOpen, onClose }) {
  const modalRef = useRef<HTMLElement>(null);

  effect(() => {
    if (isOpen && modalRef.current) {
      const focusManager = createFocusManager();

      // Focus first element in modal
      focusManager.focusFirst(modalRef.current);

      // Trap focus
      const release = focusManager.trapFocus(modalRef.current);

      return () => {
        release();
        // Return focus to trigger element
      };
    }
  });

  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      {children}
    </div>
  );
}
```

### 6. Meaningful Labels

```typescript
// Good - descriptive labels
<button aria-label="Close navigation menu">×</button>
<input aria-label="Search products" type="search" />

// Bad - generic or missing labels
<button>×</button>
<input type="search" />

// Good - form labels
<label htmlFor="email">Email address</label>
<input id="email" type="email" />

// Alternative - aria-label
<input type="email" aria-label="Email address" />
```

## Examples

### Accessible Form

```typescript
function ContactForm() {
  const form = useForm({
    name: { initialValue: '', validators: [v.required()] },
    email: { initialValue: '', validators: [v.required(), v.email()] },
    message: { initialValue: '', validators: [v.required()] },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.validate()) {
      announceToScreenReader('Form has errors. Please review and correct.', 'assertive');
      return;
    }

    const result = await submitForm(form.values());

    if (result.success) {
      announceToScreenReader('Form submitted successfully', 'polite');
    } else {
      announceToScreenReader('Form submission failed. Please try again.', 'assertive');
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Contact form">
      <div>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          {...form.field('name')}
          aria-invalid={!!form.errors().name}
          aria-describedby={form.errors().name ? 'name-error' : undefined}
        />
        {form.errors().name && (
          <span id="name-error" role="alert">
            {form.errors().name}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          {...form.field('email')}
          aria-invalid={!!form.errors().email}
          aria-describedby={form.errors().email ? 'email-error' : undefined}
        />
        {form.errors().email && (
          <span id="email-error" role="alert">
            {form.errors().email}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          {...form.field('message')}
          aria-invalid={!!form.errors().message}
          aria-describedby={form.errors().message ? 'message-error' : undefined}
        />
        {form.errors().message && (
          <span id="message-error" role="alert">
            {form.errors().message}
          </span>
        )}
      </div>

      <button type="submit">Send Message</button>
    </form>
  );
}
```

### Accessible Modal

```typescript
function AccessibleModal({ isOpen, title, children, onClose }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  effect(() => {
    if (isOpen) {
      // Save previous focus
      previousFocus.current = document.activeElement as HTMLElement;

      // Trap focus in modal
      if (modalRef.current) {
        const navigator = new KeyboardNavigator();
        const releaseTrap = navigator.trapFocus(modalRef.current);

        // Focus first element
        navigator.focusFirst(modalRef.current);

        // Handle escape key
        const handleEscape = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            onClose();
          }
        };

        document.addEventListener('keydown', handleEscape);

        return () => {
          releaseTrap();
          document.removeEventListener('keydown', handleEscape);

          // Restore previous focus
          previousFocus.current?.focus();
        };
      }
    }
  });

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
}
```

### Accessible Data Table

```typescript
function DataTable({ data, columns }) {
  return (
    <table role="table" aria-label="User data">
      <thead>
        <tr role="row">
          {columns.map(col => (
            <th key={col.key} role="columnheader" scope="col">
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={row.id} role="row">
            {columns.map(col => (
              <td key={col.key} role="cell">
                {row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Troubleshooting

### ARIA Attributes Not Applied

**Problem**: Elements don't have ARIA attributes

**Solutions**:
1. Ensure `autoAria` is enabled in configuration
2. Check if elements already have explicit ARIA attributes (auto-enhancement is skipped)
3. Verify elements are being rendered through PhilJS JSX

```typescript
import { getA11yConfig } from '@philjs/core';

const config = getA11yConfig();
console.log('Auto ARIA enabled:', config.autoAria);
```

### Heading Warnings Not Showing

**Problem**: Heading hierarchy warnings aren't appearing

**Solutions**:
1. Enable `headingHierarchy` in configuration
2. Enable `devWarnings` for development mode
3. Call `getHeadingWarnings()` to retrieve warnings

```typescript
configureA11y({
  headingHierarchy: true,
  devWarnings: true,
});

const warnings = getHeadingWarnings();
console.log(warnings);
```

### Focus Trap Not Working

**Problem**: Focus escapes the trapped container

**Solutions**:
1. Ensure container has focusable elements
2. Verify event listeners are properly attached
3. Check that cleanup function is called on unmount

```typescript
const navigator = new KeyboardNavigator();
const release = navigator.trapFocus(container);

// Make sure to call release when done
onCleanup(() => release());
```

## API Reference

For complete API documentation, see [Core API Reference: Accessibility](../api-reference/core.md#accessibility)

### Key Functions

- `configureA11y()` - Configure accessibility settings
- `getA11yConfig()` - Get current configuration
- `enhanceWithAria()` - Auto-generate ARIA labels
- `validateHeadingHierarchy()` - Validate heading structure
- `getHeadingWarnings()` - Get heading warnings
- `resetHeadingTracker()` - Reset heading tracker
- `getContrastRatio()` - Calculate color contrast
- `validateColorContrast()` - Validate color contrast
- `auditAccessibility()` - Run full accessibility audit
- `startA11yMonitoring()` - Start continuous monitoring
- `addSkipLink()` - Add skip navigation link
- `announceToScreenReader()` - Announce to screen readers
- `createLoadingState()` - Create accessible loading state
- `createFocusManager()` - Manage keyboard focus
- `KeyboardNavigator` - Class for keyboard navigation

## Related Topics

- [Forms & Validation](../forms/validation.md)
- [Best Practices: Accessibility](../best-practices/accessibility.md)
- [Component Patterns](../best-practices/component-patterns.md)
- [Error Handling](../best-practices/error-handling.md)


