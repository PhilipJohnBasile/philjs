# Accessibility (A11y)

PhilJS provides comprehensive accessibility utilities for building inclusive web applications that work for everyone.

## Quick Start

```tsx
import {
  configureA11y,
  enhanceWithAria,
  auditAccessibility,
  announceToScreenReader,
  createFocusManager,
  KeyboardNavigator
} from '@philjs/core';

// Configure global accessibility settings
configureA11y({
  enforceHeadingHierarchy: true,
  announceRouteChanges: true,
  trapFocusInModals: true,
  minimumContrastRatio: 4.5
});
```

## ARIA Enhancement

### Automatic ARIA Attributes

```tsx
import { enhanceWithAria } from '@philjs/core';

// Automatically add required ARIA attributes
function Dialog({ open, onClose, title, children }) {
  return enhanceWithAria(
    <div class="dialog" hidden={!open}>
      <h2>{title}</h2>
      {children}
      <button onClick={onClose}>Close</button>
    </div>,
    {
      role: 'dialog',
      modal: true,
      labelledBy: 'dialog-title',
      describedBy: 'dialog-description'
    }
  );
}
```

### Common ARIA Patterns

```tsx
// Accordion
function Accordion({ items }) {
  const expanded = signal<string | null>(null);

  return (
    <div class="accordion">
      {items.map(item => (
        <div key={item.id}>
          <button
            aria-expanded={expanded() === item.id}
            aria-controls={`panel-${item.id}`}
            onClick={() => expanded.set(
              expanded() === item.id ? null : item.id
            )}
          >
            {item.title}
          </button>
          <div
            id={`panel-${item.id}`}
            role="region"
            aria-labelledby={`header-${item.id}`}
            hidden={expanded() !== item.id}
          >
            {item.content}
          </div>
        </div>
      ))}
    </div>
  );
}

// Tabs
function Tabs({ tabs, activeTab, onTabChange }) {
  return (
    <div class="tabs">
      <div role="tablist" aria-label="Content tabs">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map(tab => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          tabIndex={0}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}

// Menu
function Menu({ items, onSelect }) {
  const activeIndex = signal(0);

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        activeIndex.set(i => Math.min(i + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        activeIndex.set(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect(items[activeIndex()]);
        break;
    }
  };

  return (
    <ul role="menu" onKeyDown={handleKeyDown}>
      {items.map((item, index) => (
        <li
          key={item.id}
          role="menuitem"
          tabIndex={index === activeIndex() ? 0 : -1}
          aria-selected={index === activeIndex()}
          onClick={() => onSelect(item)}
        >
          {item.label}
        </li>
      ))}
    </ul>
  );
}
```

## Screen Reader Announcements

### Live Regions

```tsx
import { announceToScreenReader } from '@philjs/core';

// Announce dynamic content changes
function LoadingButton({ loading, onClick, children }) {
  const handleClick = async () => {
    announceToScreenReader('Loading, please wait');
    await onClick();
    announceToScreenReader('Action completed');
  };

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? 'Loading...' : children}
    </button>
  );
}

// Announce form errors
function FormWithAnnouncements() {
  const form = useForm({
    onError: (errors) => {
      const errorCount = Object.keys(errors).length;
      announceToScreenReader(
        `Form has ${errorCount} error${errorCount > 1 ? 's' : ''}. ` +
        `First error: ${Object.values(errors)[0]}`
      );
    }
  });

  return <form>{/* ... */}</form>;
}
```

### Announcement Options

```tsx
// Polite announcement (waits for screen reader to finish)
announceToScreenReader('Item added to cart', { priority: 'polite' });

// Assertive announcement (interrupts current speech)
announceToScreenReader('Error: Connection lost', { priority: 'assertive' });

// With timeout (clears after delay)
announceToScreenReader('Saved', { timeout: 3000 });
```

## Heading Hierarchy

### Validation

```tsx
import {
  validateHeadingHierarchy,
  getHeadingWarnings,
  resetHeadingTracker
} from '@philjs/core';

// Validate heading structure
function PageWithHeadings() {
  return (
    <article>
      <h1>Main Title</h1>          {/* Level 1 */}
      <section>
        <h2>Section One</h2>       {/* Level 2 - OK */}
        <p>Content...</p>
        <h3>Subsection</h3>        {/* Level 3 - OK */}
      </section>
      <section>
        <h2>Section Two</h2>       {/* Level 2 - OK */}
        <h4>Oops!</h4>             {/* Level 4 - WARNING: Skipped h3 */}
      </section>
    </article>
  );
}

// Get warnings in development
if (import.meta.env.DEV) {
  const warnings = getHeadingWarnings();
  warnings.forEach(w => console.warn(`A11y: ${w.message}`));
}
```

### Automatic Heading Levels

```tsx
import { HeadingContext, useHeadingLevel } from '@philjs/core';

function Section({ title, children }) {
  const level = useHeadingLevel();
  const HeadingTag = `h${Math.min(level, 6)}`;

  return (
    <section>
      <HeadingTag>{title}</HeadingTag>
      <HeadingContext level={level + 1}>
        {children}
      </HeadingContext>
    </section>
  );
}

// Usage - headings automatically use correct level
function Page() {
  return (
    <Section title="Page Title">           {/* h1 */}
      <Section title="First Section">      {/* h2 */}
        <Section title="Subsection">       {/* h3 */}
          <p>Content</p>
        </Section>
      </Section>
      <Section title="Second Section">     {/* h2 */}
        <p>More content</p>
      </Section>
    </Section>
  );
}
```

## Color Contrast

### Validation

```tsx
import { getContrastRatio, validateColorContrast } from '@philjs/core';

// Check contrast ratio
const ratio = getContrastRatio('#333333', '#ffffff');
console.log(ratio); // 12.63

// Validate against WCAG standards
const result = validateColorContrast('#777777', '#ffffff', {
  level: 'AA',      // 'AA' or 'AAA'
  size: 'normal'    // 'normal' or 'large'
});

if (!result.passes) {
  console.warn(`Contrast ratio ${result.ratio} fails ${result.level}`);
  console.log(`Suggested colors:`, result.suggestions);
}
```

### Automatic Contrast Checking

```tsx
// In development, automatically warn about low contrast
configureA11y({
  checkColorContrast: true,
  minimumContrastRatio: 4.5, // WCAG AA for normal text
  onContrastError: (element, ratio, required) => {
    console.warn(
      `Low contrast (${ratio.toFixed(2)}) on element:`,
      element,
      `Required: ${required}`
    );
  }
});
```

## Focus Management

### Focus Manager

```tsx
import { createFocusManager } from '@philjs/core';

function Modal({ open, onClose, children }) {
  const focusManager = createFocusManager({
    trapFocus: true,
    restoreFocus: true,
    initialFocus: '[data-autofocus]'
  });

  effect(() => {
    if (open) {
      focusManager.activate();
    } else {
      focusManager.deactivate();
    }
  });

  return (
    <div
      ref={focusManager.containerRef}
      class="modal"
      role="dialog"
      aria-modal="true"
      hidden={!open}
    >
      <button data-autofocus onClick={onClose}>Close</button>
      {children}
    </div>
  );
}
```

### Skip Links

```tsx
import { addSkipLink } from '@philjs/core';

function Layout({ children }) {
  return (
    <>
      {addSkipLink({
        target: '#main-content',
        label: 'Skip to main content'
      })}
      {addSkipLink({
        target: '#navigation',
        label: 'Skip to navigation'
      })}

      <header>
        <nav id="navigation">{/* ... */}</nav>
      </header>

      <main id="main-content">
        {children}
      </main>
    </>
  );
}
```

## Keyboard Navigation

### KeyboardNavigator

```tsx
import { KeyboardNavigator } from '@philjs/core';

function ListBox({ items, onSelect }) {
  const activeIndex = signal(0);

  const navigator = new KeyboardNavigator({
    orientation: 'vertical',
    wrap: true,
    onNavigate: (direction) => {
      if (direction === 'next') {
        activeIndex.set(i => (i + 1) % items.length);
      } else {
        activeIndex.set(i => (i - 1 + items.length) % items.length);
      }
    },
    onSelect: () => {
      onSelect(items[activeIndex()]);
    }
  });

  return (
    <ul
      role="listbox"
      tabIndex={0}
      onKeyDown={navigator.handleKeyDown}
    >
      {items.map((item, index) => (
        <li
          key={item.id}
          role="option"
          aria-selected={index === activeIndex()}
          onClick={() => onSelect(item)}
        >
          {item.label}
        </li>
      ))}
    </ul>
  );
}
```

### Common Keyboard Patterns

```tsx
// Roving tabindex for toolbar
function Toolbar({ items }) {
  const activeIndex = signal(0);

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
        activeIndex.set(i => (i + 1) % items.length);
        break;
      case 'ArrowLeft':
        activeIndex.set(i => (i - 1 + items.length) % items.length);
        break;
      case 'Home':
        activeIndex.set(0);
        break;
      case 'End':
        activeIndex.set(items.length - 1);
        break;
    }
  };

  return (
    <div role="toolbar" aria-label="Formatting options" onKeyDown={handleKeyDown}>
      {items.map((item, index) => (
        <button
          key={item.id}
          tabIndex={index === activeIndex() ? 0 : -1}
          aria-pressed={item.active}
          onClick={item.onClick}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
```

## Loading States

```tsx
import { createLoadingState } from '@philjs/core';

function AsyncContent({ loading, children }) {
  const loadingState = createLoadingState({
    minimumDuration: 500, // Prevent flash
    announceStart: 'Loading content',
    announceEnd: 'Content loaded'
  });

  return (
    <div
      aria-busy={loading}
      aria-live="polite"
    >
      {loading ? (
        <div role="status">
          <span class="spinner" aria-hidden="true" />
          <span class="sr-only">Loading...</span>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
```

## Accessibility Audit

```tsx
import { auditAccessibility, startA11yMonitoring } from '@philjs/core';

// Run audit on component
const report = await auditAccessibility(document.body, {
  rules: ['color-contrast', 'heading-order', 'image-alt', 'link-name'],
  level: 'AA'
});

console.log('Issues found:', report.violations);
console.log('Passed checks:', report.passes);

// Continuous monitoring in development
if (import.meta.env.DEV) {
  startA11yMonitoring({
    onViolation: (violation) => {
      console.error(`A11y violation: ${violation.id}`, violation.nodes);
    },
    debounceMs: 1000
  });
}
```

### Audit Report

```tsx
interface A11yReport {
  violations: A11yViolation[];
  passes: A11yPass[];
  incomplete: A11yIncomplete[];
  timestamp: number;
  url: string;
}

interface A11yViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: A11yNode[];
}
```

## Configuration

```tsx
import { configureA11y, getA11yConfig } from '@philjs/core';

configureA11y({
  // Enforcement
  enforceHeadingHierarchy: true,
  requireAltText: true,
  requireLabelAssociation: true,

  // Focus management
  trapFocusInModals: true,
  restoreFocusOnClose: true,
  highlightFocusVisible: true,

  // Announcements
  announceRouteChanges: true,
  announceFormErrors: true,
  announceLoadingStates: true,

  // Color contrast
  checkColorContrast: true,
  minimumContrastRatio: 4.5,
  largeTextContrastRatio: 3,

  // Motion
  respectReducedMotion: true,
  defaultAnimationDuration: 200,

  // Development
  showWarningsInConsole: true,
  throwOnCriticalViolations: false
});

// Get current config
const config = getA11yConfig();
```

## Testing Accessibility

```tsx
import { test, expect } from '@philjs/testing';
import { auditAccessibility } from '@philjs/core';

test('page is accessible', async () => {
  render(() => <MyPage />);

  const report = await auditAccessibility(document.body);

  expect(report.violations).toHaveLength(0);
});

test('modal traps focus', async () => {
  render(() => <Modal open={true}><input /><button>Close</button></Modal>);

  const modal = screen.getByRole('dialog');
  const input = screen.getByRole('textbox');
  const button = screen.getByRole('button');

  // Tab should cycle within modal
  input.focus();
  await userEvent.tab();
  expect(button).toHaveFocus();

  await userEvent.tab();
  expect(input).toHaveFocus(); // Wrapped back
});
```

## Best Practices

1. **Use semantic HTML** - `<button>`, `<nav>`, `<main>`, etc.
2. **Provide text alternatives** - Alt text for images, labels for inputs
3. **Ensure keyboard access** - All interactive elements reachable
4. **Maintain focus order** - Logical tab sequence
5. **Use sufficient contrast** - 4.5:1 for normal text
6. **Don't rely on color alone** - Use icons, patterns, text
7. **Respect motion preferences** - Honor `prefers-reduced-motion`
8. **Test with assistive technology** - Screen readers, keyboard only

## Next Steps

- [Animation](./animation.md)
- [Internationalization](./i18n.md)
- [Testing](./testing.md)
