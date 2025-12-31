# Forms Overview

Master form handling in PhilJS with controlled inputs, validation, and submission patterns.

## What You'll Learn

- Form fundamentals
- Controlled vs uncontrolled inputs
- Form state management
- Validation strategies
- Submission handling
- Best practices

## Form Basics

### Simple Form

```typescript
import { signal } from '@philjs/core';

function ContactForm() {
  const name = signal('');
  const email = signal('');
  const message = signal('');

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    console.log({
      name: name(),
      email: email(),
      message: message()
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Name:</label>
        <input
          type="text"
          value={name()}
          onInput={(e) => name.set(e.target.value)}
        />
      </div>

      <div>
        <label>Email:</label>
        <input
          type="email"
          value={email()}
          onInput={(e) => email.set(e.target.value)}
        />
      </div>

      <div>
        <label>Message:</label>
        <textarea
          value={message()}
          onInput={(e) => message.set(e.target.value)}
        />
      </div>

      <button type="submit">Send</button>
    </form>
  );
}
```

## Controlled Inputs

### Input Types

```typescript
function AllInputTypes() {
  const text = signal('');
  const email = signal('');
  const password = signal('');
  const number = signal(0);
  const date = signal('');
  const checked = signal(false);
  const selected = signal('option1');
  const multiSelect = signal<string[]>([]);

  return (
    <form>
      {/* Text */}
      <input
        type="text"
        value={text()}
        onInput={(e) => text.set(e.target.value)}
      />

      {/* Email */}
      <input
        type="email"
        value={email()}
        onInput={(e) => email.set(e.target.value)}
      />

      {/* Password */}
      <input
        type="password"
        value={password()}
        onInput={(e) => password.set(e.target.value)}
      />

      {/* Number */}
      <input
        type="number"
        value={number()}
        onInput={(e) => number.set(parseInt(e.target.value))}
      />

      {/* Date */}
      <input
        type="date"
        value={date()}
        onInput={(e) => date.set(e.target.value)}
      />

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={checked()}
        onChange={(e) => checked.set(e.target.checked)}
      />

      {/* Select */}
      <select
        value={selected()}
        onChange={(e) => selected.set(e.target.value)}
      >
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
        <option value="option3">Option 3</option>
      </select>

      {/* Textarea */}
      <textarea
        value={text()}
        onInput={(e) => text.set(e.target.value)}
      />
    </form>
  );
}
```

## Form Object Pattern

### Single State Object

```typescript
interface FormData {
  name: string;
  email: string;
  age: number;
  subscribe: boolean;
}

function RegistrationForm() {
  const formData = signal<FormData>({
    name: '',
    email: '',
    age: 0,
    subscribe: false
  });

  const updateField = (field: keyof FormData, value: any) => {
    formData.set({ ...formData(), [field]: value });
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    console.log(formData());
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData().name}
        onInput={(e) => updateField('name', e.target.value)}
      />

      <input
        type="email"
        value={formData().email}
        onInput={(e) => updateField('email', e.target.value)}
      />

      <input
        type="number"
        value={formData().age}
        onInput={(e) => updateField('age', parseInt(e.target.value))}
      />

      <input
        type="checkbox"
        checked={formData().subscribe}
        onChange={(e) => updateField('subscribe', e.target.checked)}
      />

      <button type="submit">Register</button>
    </form>
  );
}
```

## Validation

### Basic Validation

```typescript
function LoginForm() {
  const email = signal('');
  const password = signal('');
  const errors = signal<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!email()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email())) {
      newErrors.email = 'Email is invalid';
    }

    if (!password()) {
      newErrors.password = 'Password is required';
    } else if (password().length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    errors.set(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    if (validate()) {
      console.log('Form is valid!', { email: email(), password: password() });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="email"
          value={email()}
          onInput={(e) => email.set(e.target.value)}
          placeholder="Email"
        />
        {errors().email && (
          <span className="error">{errors().email}</span>
        )}
      </div>

      <div>
        <input
          type="password"
          value={password()}
          onInput={(e) => password.set(e.target.value)}
          placeholder="Password"
        />
        {errors().password && (
          <span className="error">{errors().password}</span>
        )}
      </div>

      <button type="submit">Login</button>
    </form>
  );
}
```

### Real-Time Validation

```typescript
function SignupForm() {
  const email = signal('');
  const emailError = signal('');

  const validateEmail = (value: string) => {
    if (!value) {
      emailError.set('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(value)) {
      emailError.set('Email is invalid');
    } else {
      emailError.set('');
    }
  };

  return (
    <form>
      <input
        type="email"
        value={email()}
        onInput={(e) => {
          const value = e.target.value;
          email.set(value);
          validateEmail(value);
        }}
        onBlur={() => validateEmail(email())}
      />
      {emailError() && <span className="error">{emailError()}</span>}
    </form>
  );
}
```

## Submission

### Async Submission

```typescript
function ContactForm() {
  const name = signal('');
  const email = signal('');
  const submitting = signal(false);
  const submitted = signal(false);
  const error = signal('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    submitting.set(true);
    error.set('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name(),
          email: email()
        })
      });

      if (!res.ok) throw new Error('Submission failed');

      submitted.set(true);

      // Clear form
      name.set('');
      email.set('');
    } catch (err) {
      error.set('Failed to submit form. Please try again.');
    } finally {
      submitting.set(false);
    }
  };

  if (submitted()) {
    return <div className="success">Thank you for your message!</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name()}
        onInput={(e) => name.set(e.target.value)}
        placeholder="Name"
        disabled={submitting()}
      />

      <input
        type="email"
        value={email()}
        onInput={(e) => email.set(e.target.value)}
        placeholder="Email"
        disabled={submitting()}
      />

      {error() && <div className="error">{error()}</div>}

      <button type="submit" disabled={submitting()}>
        {submitting() ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}
```

## Form Hooks

### Custom Form Hook

```typescript
function useForm<T extends Record<string, any>>(initialValues: T) {
  const values = signal<T>(initialValues);
  const errors = signal<Partial<Record<keyof T, string>>>({});
  const touched = signal<Partial<Record<keyof T, boolean>>>({});
  const submitting = signal(false);

  const setFieldValue = (field: keyof T, value: any) => {
    values.set({ ...values(), [field]: value });
  };

  const setFieldTouched = (field: keyof T) => {
    touched.set({ ...touched(), [field]: true });
  };

  const setFieldError = (field: keyof T, error: string) => {
    errors.set({ ...errors(), [field]: error });
  };

  const reset = () => {
    values.set(initialValues);
    errors.set({});
    touched.set({});
  };

  return {
    values,
    errors,
    touched,
    submitting,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    reset
  };
}

// Usage
function MyForm() {
  const form = useForm({
    name: '',
    email: ''
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    form.submitting.set(true);

    try {
      await submitForm(form.values());
      form.reset();
    } finally {
      form.submitting.set(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={form.values().name}
        onInput={(e) => form.setFieldValue('name', e.target.value)}
      />
    </form>
  );
}
```

## Field Arrays

### Dynamic Field Lists

```typescript
function EmailListForm() {
  const emails = signal<string[]>(['']);

  const addEmail = () => {
    emails.set([...emails(), '']);
  };

  const removeEmail = (index: number) => {
    emails.set(emails().filter((_, i) => i !== index));
  };

  const updateEmail = (index: number, value: string) => {
    const updated = [...emails()];
    updated[index] = value;
    emails.set(updated);
  };

  return (
    <form>
      {emails().map((email, index) => (
        <div key={index}>
          <input
            type="email"
            value={email}
            onInput={(e) => updateEmail(index, e.target.value)}
            placeholder="Email"
          />
          {emails().length > 1 && (
            <button type="button" onClick={() => removeEmail(index)}>
              Remove
            </button>
          )}
        </div>
      ))}

      <button type="button" onClick={addEmail}>
        Add Email
      </button>
    </form>
  );
}
```

## Form Patterns

### Search Form

```typescript
function SearchForm() {
  const query = signal('');
  const results = signal([]);

  const handleSearch = async (e: Event) => {
    e.preventDefault();

    const res = await fetch(`/api/search?q=${query()}`);
    const data = await res.json();

    results.set(data);
  };

  return (
    <div>
      <form onSubmit={handleSearch}>
        <input
          type="search"
          value={query()}
          onInput={(e) => query.set(e.target.value)}
          placeholder="Search..."
        />
        <button type="submit">Search</button>
      </form>

      <div className="results">
        {results().map(result => (
          <div key={result.id}>{result.title}</div>
        ))}
      </div>
    </div>
  );
}
```

### Filter Form

```typescript
function ProductFilters() {
  const category = signal('all');
  const minPrice = signal(0);
  const maxPrice = signal(1000);
  const inStock = signal(false);

  const handleApplyFilters = () => {
    const filters = {
      category: category(),
      minPrice: minPrice(),
      maxPrice: maxPrice(),
      inStock: inStock()
    };

    // Apply filters
    fetchProducts(filters);
  };

  return (
    <form>
      <select
        value={category()}
        onChange={(e) => category.set(e.target.value)}
      >
        <option value="all">All Categories</option>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
      </select>

      <input
        type="range"
        min="0"
        max="1000"
        value={minPrice()}
        onInput={(e) => minPrice.set(parseInt(e.target.value))}
      />

      <input
        type="checkbox"
        checked={inStock()}
        onChange={(e) => inStock.set(e.target.checked)}
      />
      <label>In Stock Only</label>

      <button type="button" onClick={handleApplyFilters}>
        Apply Filters
      </button>
    </form>
  );
}
```

## Best Practices

### Use Appropriate Input Types

```typescript
// ✅ Use specific types
<input type="email" />
<input type="tel" />
<input type="url" />
<input type="date" />

// ❌ Generic text for everything
<input type="text" />
```

### Provide Clear Labels

```typescript
// ✅ Accessible labels
<label htmlFor="email">Email:</label>
<input id="email" type="email" />

// ❌ No label
<input type="email" placeholder="Email" />
```

### Show Validation Errors

```typescript
// ✅ Show errors below field
{error() && <span className="error">{error()}</span>}

// ❌ Silent validation
```

### Disable During Submission

```typescript
// ✅ Prevent double submission
<button disabled={submitting()}>
  {submitting() ? 'Submitting...' : 'Submit'}
</button>

// ❌ Allow multiple submissions
<button>Submit</button>
```

### Reset After Success

```typescript
// ✅ Clear form after submission
if (success) {
  name.set('');
  email.set('');
}

// ❌ Leave stale data
```

## Summary

You've learned:

✅ Form basics in PhilJS
✅ Controlled input patterns
✅ Form state management
✅ Basic and real-time validation
✅ Async form submission
✅ Custom form hooks
✅ Dynamic field arrays
✅ Common form patterns
✅ Best practices

Forms are fundamental to most applications!

---

**Next:** [Controlled vs Uncontrolled →](./controlled-uncontrolled.md) Choose the right pattern for your forms
