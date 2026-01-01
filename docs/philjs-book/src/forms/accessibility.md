# Form Accessibility

Make forms accessible to all users with proper semantics, ARIA attributes, and keyboard navigation.

## What You'll Learn

- Accessible form basics
- Labels and descriptions
- ARIA attributes
- Keyboard navigation
- Screen reader support
- Error announcements
- Focus management
- Best practices

## Accessible Form Basics

### Proper Labels

```typescript
import { signal } from '@philjs/core';

function AccessibleForm() {
  const email = signal('');
  const password = signal('');

  return (
    <form>
      {/* ✅ Explicit label with htmlFor */}
      <div>
        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          type="email"
          value={email()}
          onInput={(e) => email.set(e.target.value)}
        />
      </div>

      {/* ✅ Wrapped label */}
      <label>
        Password
        <input
          type="password"
          value={password()}
          onInput={(e) => password.set(e.target.value)}
        />
      </label>

      <button type="submit">Login</button>
    </form>
  );
}
```

### Required Fields

```typescript
function RequiredFields() {
  const name = signal('');
  const email = signal('');
  const phone = signal('');

  return (
    <form>
      {/* ✅ Visual and programmatic indication */}
      <div>
        <label htmlFor="name">
          Name <span aria-label="required">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name()}
          onInput={(e) => name.set(e.target.value)}
          required
          aria-required="true"
        />
      </div>

      {/* ✅ Text indicator for screen readers */}
      <div>
        <label htmlFor="email">
          Email Address
          <span className="required-text">(required)</span>
        </label>
        <input
          id="email"
          type="email"
          value={email()}
          onInput={(e) => email.set(e.target.value)}
          required
          aria-required="true"
        />
      </div>

      {/* Optional field */}
      <div>
        <label htmlFor="phone">
          Phone Number
          <span className="optional-text">(optional)</span>
        </label>
        <input
          id="phone"
          type="tel"
          value={phone()}
          onInput={(e) => phone.set(e.target.value)}
        />
      </div>
    </form>
  );
}
```

## ARIA Attributes

### Error Messages

```typescript
function ErrorMessagesAccessible() {
  const email = signal('');
  const emailError = signal('');
  const touched = signal(false);

  const validateEmail = (value: string) => {
    if (!value) {
      emailError.set('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      emailError.set('Please enter a valid email address');
    } else {
      emailError.set('');
    }
  };

  return (
    <div>
      <label htmlFor="email">Email Address</label>
      <input
        id="email"
        type="email"
        value={email()}
        onInput={(e) => {
          email.set(e.target.value);
          if (touched()) validateEmail(e.target.value);
        }}
        onBlur={() => {
          touched.set(true);
          validateEmail(email());
        }}
        aria-describedby={emailError() ? 'email-error' : undefined}
        aria-invalid={emailError() ? 'true' : 'false'}
      />

      {emailError() && (
        <div
          id="email-error"
          className="error"
          role="alert"
          aria-live="polite"
        >
          {emailError()}
        </div>
      )}
    </div>
  );
}
```

### Field Descriptions

```typescript
function FieldWithDescription() {
  const password = signal('');

  return (
    <div>
      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        value={password()}
        onInput={(e) => password.set(e.target.value)}
        aria-describedby="password-requirements"
      />
      <div id="password-requirements" className="field-description">
        Password must be at least 8 characters and include a number and
        uppercase letter
      </div>
    </div>
  );
}
```

### Form Status

```typescript
function FormWithStatus() {
  const submitting = signal(false);
  const submitted = signal(false);
  const error = signal('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    submitting.set(true);
    error.set('');

    try {
      await submitForm();
      submitted.set(true);
    } catch (err) {
      error.set('Submission failed. Please try again.');
    } finally {
      submitting.set(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}

      {/* Status announcements */}
      {submitting() && (
        <div role="status" aria-live="polite">
          Submitting form...
        </div>
      )}

      {submitted() && (
        <div role="status" aria-live="polite">
          Form submitted successfully!
        </div>
      )}

      {error() && (
        <div role="alert" aria-live="assertive" className="error">
          {error()}
        </div>
      )}

      <button type="submit" disabled={submitting()} aria-busy={submitting()}>
        {submitting() ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

## Keyboard Navigation

### Custom Components

```typescript
function AccessibleCheckbox({ label, checked, onChange }: {
  label: string;
  checked: () => boolean;
  onChange: (checked: boolean) => void;
}) {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!checked());
    }
  };

  return (
    <div
      className="custom-checkbox"
      role="checkbox"
      aria-checked={checked()}
      tabIndex={0}
      onClick={() => onChange(!checked())}
      onKeyPress={handleKeyPress}
    >
      <span className="checkbox-box">
        {checked() && '✓'}
      </span>
      <span className="checkbox-label">{label}</span>
    </div>
  );
}

// Usage
function Form() {
  const agreed = signal(false);

  return (
    <form>
      <AccessibleCheckbox
        label="I agree to the terms and conditions"
        checked={agreed}
        onChange={agreed.set}
      />
    </form>
  );
}
```

### Radio Groups

```typescript
function AccessibleRadioGroup() {
  const selected = signal('option1');

  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' }
  ];

  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    let newIndex = index;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        newIndex = (index + 1) % options.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = (index - 1 + options.length) % options.length;
        break;
      default:
        return;
    }

    selected.set(options[newIndex].value);

    // Focus the new radio button
    const radioButton = document.getElementById(
      `radio-${options[newIndex].value}`
    );
    radioButton?.focus();
  };

  return (
    <fieldset>
      <legend>Choose an option</legend>
      <div role="radiogroup" aria-labelledby="group-label">
        {options.map((option, index) => (
          <label key={option.value}>
            <input
              id={`radio-${option.value}`}
              type="radio"
              name="options"
              value={option.value}
              checked={selected() === option.value}
              onChange={(e) => selected.set(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
```

### Skip to Error

```typescript
function FormWithErrorFocus() {
  const formData = signal({ name: '', email: '', password: '' });
  const errors = signal<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData().name) newErrors.name = 'Name is required';
    if (!formData().email) newErrors.email = 'Email is required';
    if (!formData().password) newErrors.password = 'Password is required';

    errors.set(newErrors);

    // Focus first error field
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      const element = document.getElementById(firstErrorField);
      element?.focus();
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (validate()) {
      console.log('Form is valid');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          value={formData().name}
          onInput={(e) =>
            formData.set({ ...formData(), name: e.target.value })
          }
          aria-invalid={errors().name ? 'true' : 'false'}
          aria-describedby={errors().name ? 'name-error' : undefined}
        />
        {errors().name && (
          <div id="name-error" role="alert">
            {errors().name}
          </div>
        )}
      </div>

      {/* Other fields */}

      <button type="submit">Submit</button>
    </form>
  );
}
```

## Focus Management

### Focus Trap in Modal Form

```typescript
function ModalForm({ isOpen, onClose }: {
  isOpen: () => boolean;
  onClose: () => void;
}) {
  let modalRef: HTMLDivElement | undefined;
  const email = signal('');

  const getFocusableElements = (): HTMLElement[] => {
    if (!modalRef) return [];

    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];

    return Array.from(
      modalRef.querySelectorAll(focusableSelectors.join(','))
    ) as HTMLElement[];
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (e.key === 'Tab') {
      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  effect(() => {
    if (isOpen() && modalRef) {
      // Focus first element when modal opens
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  });

  if (!isOpen()) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="modal-content"
        onKeyDown={handleKeyDown}
      >
        <h2 id="modal-title">Subscribe to Newsletter</h2>

        <form>
          <label htmlFor="modal-email">Email Address</label>
          <input
            id="modal-email"
            type="email"
            value={email()}
            onInput={(e) => email.set(e.target.value)}
          />

          <div className="modal-actions">
            <button type="submit">Subscribe</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### Restore Focus

```typescript
function FormWithFocusRestore() {
  const showAdvanced = signal(false);
  let previousFocusElement: HTMLElement | null = null;

  const toggleAdvanced = () => {
    if (!showAdvanced()) {
      // Save current focus
      previousFocusElement = document.activeElement as HTMLElement;
      showAdvanced.set(true);

      // Focus first field in advanced section
      setTimeout(() => {
        const firstField = document.getElementById('advanced-field-1');
        firstField?.focus();
      }, 0);
    } else {
      showAdvanced.set(false);

      // Restore focus
      setTimeout(() => {
        previousFocusElement?.focus();
      }, 0);
    }
  };

  return (
    <form>
      {/* Basic fields */}

      <button type="button" onClick={toggleAdvanced}>
        {showAdvanced() ? 'Hide' : 'Show'} Advanced Options
      </button>

      {showAdvanced() && (
        <div className="advanced-section">
          <h3>Advanced Options</h3>
          <label htmlFor="advanced-field-1">Option 1</label>
          <input id="advanced-field-1" type="text" />

          <label htmlFor="advanced-field-2">Option 2</label>
          <input id="advanced-field-2" type="text" />
        </div>
      )}
    </form>
  );
}
```

## Screen Reader Support

### Live Regions

```typescript
function SearchWithLiveResults() {
  const query = signal('');
  const results = signal<string[]>([]);
  const searching = signal(false);
  const announceText = signal('');

  const handleSearch = async (value: string) => {
    if (!value) {
      results.set([]);
      announceText.set('');
      return;
    }

    searching.set(true);
    announceText.set('Searching...');

    // Simulate search
    await new Promise((resolve) => setTimeout(resolve, 500));

    const mockResults = ['Result 1', 'Result 2', 'Result 3'];
    results.set(mockResults);
    searching.set(false);

    announceText.set(
      `${mockResults.length} result${mockResults.length !== 1 ? 's' : ''} found`
    );
  };

  return (
    <div>
      <label htmlFor="search">Search</label>
      <input
        id="search"
        type="search"
        value={query()}
        onInput={(e) => {
          const value = e.target.value;
          query.set(value);
          handleSearch(value);
        }}
        aria-describedby="search-status"
      />

      {/* Screen reader announcement */}
      <div
        id="search-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announceText()}
      </div>

      {/* Results */}
      {results().length > 0 && (
        <ul role="list" aria-label="Search results">
          {results().map((result, i) => (
            <li key={i}>{result}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// CSS for screen reader only text
/*
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
*/
```

### Fieldset and Legend

```typescript
function GroupedFields() {
  const address = signal({
    street: '',
    city: '',
    state: '',
    zip: ''
  });

  const paymentMethod = signal('credit-card');

  return (
    <form>
      {/* ✅ Group related fields */}
      <fieldset>
        <legend>Shipping Address</legend>

        <label htmlFor="street">Street Address</label>
        <input
          id="street"
          type="text"
          value={address().street}
          onInput={(e) =>
            address.set({ ...address(), street: e.target.value })
          }
        />

        <label htmlFor="city">City</label>
        <input
          id="city"
          type="text"
          value={address().city}
          onInput={(e) =>
            address.set({ ...address(), city: e.target.value })
          }
        />

        <label htmlFor="state">State</label>
        <input
          id="state"
          type="text"
          value={address().state}
          onInput={(e) =>
            address.set({ ...address(), state: e.target.value })
          }
        />

        <label htmlFor="zip">ZIP Code</label>
        <input
          id="zip"
          type="text"
          value={address().zip}
          onInput={(e) =>
            address.set({ ...address(), zip: e.target.value })
          }
        />
      </fieldset>

      {/* ✅ Group radio buttons */}
      <fieldset>
        <legend>Payment Method</legend>

        <label>
          <input
            type="radio"
            name="payment"
            value="credit-card"
            checked={paymentMethod() === 'credit-card'}
            onChange={(e) => paymentMethod.set(e.target.value)}
          />
          Credit Card
        </label>

        <label>
          <input
            type="radio"
            name="payment"
            value="paypal"
            checked={paymentMethod() === 'paypal'}
            onChange={(e) => paymentMethod.set(e.target.value)}
          />
          PayPal
        </label>
      </fieldset>
    </form>
  );
}
```

## Best Practices

### Always Use Labels

```typescript
// ✅ Proper label association
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// ❌ Placeholder as label
<input type="email" placeholder="Email" />
```

### Mark Required Fields

```typescript
// ✅ Visual and programmatic indication
<label htmlFor="name">
  Name <span aria-label="required">*</span>
</label>
<input id="name" required aria-required="true" />

// ❌ Only visual indication
<label>Name *</label>
<input />
```

### Announce Errors

```typescript
// ✅ Use aria-live for announcements
{error() && (
  <div role="alert" aria-live="assertive">
    {error()}
  </div>
)}

// ❌ Silent errors
{error() && <div>{error()}</div>}
```

### Associate Errors with Fields

```typescript
// ✅ Link error to input
<input
  id="email"
  aria-describedby="email-error"
  aria-invalid="true"
/>
<div id="email-error" role="alert">{error()}</div>

// ❌ Disconnected error message
<input id="email" />
<div>{error()}</div>
```

### Keyboard Accessible

```typescript
// ✅ Support keyboard navigation
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyPress={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  Click me
</div>

// ❌ Mouse-only interaction
<div onClick={handleClick}>Click me</div>
```

### Focus Visible

```typescript
// ✅ Visible focus indicator
/*
input:focus,
button:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}
*/

// ❌ Remove focus outline
/*
input:focus {
  outline: none; /* Don't do this! */
}
*/
```

### Test with Screen Reader

```typescript
// ✅ Test your forms with:
// - NVDA (Windows)
// - JAWS (Windows)
// - VoiceOver (macOS/iOS)
// - TalkBack (Android)

// ✅ Test keyboard navigation:
// - Tab through all fields
// - Submit with Enter
// - Escape closes modals
// - Arrow keys for radio groups
```

## Summary

You've learned:

✅ Proper label associations
✅ ARIA attributes for rich interactions
✅ Error announcements with live regions
✅ Keyboard navigation patterns
✅ Focus management and trap
✅ Screen reader support
✅ Fieldset and legend for grouping
✅ Best practices for accessibility

Accessible forms ensure everyone can use your application!

---

**Forms Section Complete!** You've mastered form handling in PhilJS. Next, explore styling options for your forms.

