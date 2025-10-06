# Form Validation

Validate form inputs with client-side and server-side validation strategies.

## What You'll Learn

- Client-side validation
- Server-side validation
- Schema validation with Zod
- Real-time vs on-submit
- Custom validators
- Error display patterns
- Best practices

## Client-Side Validation

### Basic Validation

```typescript
import { signal } from 'philjs-core';

function LoginForm() {
  const email = signal('');
  const password = signal('');
  const errors = signal<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!email()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email())) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation
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
      // Submit form
      console.log('Valid!', { email: email(), password: password() });
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
  const username = signal('');
  const usernameError = signal('');
  const usernameTouched = signal(false);

  const validateUsername = (value: string) => {
    if (!value) {
      usernameError.set('Username is required');
    } else if (value.length < 3) {
      usernameError.set('Username must be at least 3 characters');
    } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      usernameError.set('Username can only contain letters, numbers, and underscores');
    } else {
      usernameError.set('');
    }
  };

  return (
    <div>
      <input
        type="text"
        value={username()}
        onInput={(e) => {
          const value = e.target.value;
          username.set(value);

          // Only validate if field has been touched
          if (usernameTouched()) {
            validateUsername(value);
          }
        }}
        onBlur={() => {
          usernameTouched.set(true);
          validateUsername(username());
        }}
        placeholder="Username"
      />

      {usernameTouched() && usernameError() && (
        <span className="error">{usernameError()}</span>
      )}
    </div>
  );
}
```

## Zod Schema Validation

### Install Zod

```bash
npm install zod
```

### Basic Schema

```typescript
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

type LoginData = z.infer<typeof LoginSchema>;

function LoginForm() {
  const email = signal('');
  const password = signal('');
  const errors = signal<Record<string, string>>({});

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    const result = LoginSchema.safeParse({
      email: email(),
      password: password()
    });

    if (!result.success) {
      // Extract errors
      const fieldErrors: Record<string, string> = {};

      result.error.issues.forEach(issue => {
        const path = issue.path.join('.');
        fieldErrors[path] = issue.message;
      });

      errors.set(fieldErrors);
    } else {
      // Valid data
      console.log('Valid!', result.data);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email()}
        onInput={(e) => email.set(e.target.value)}
      />
      {errors().email && <span className="error">{errors().email}</span>}

      <input
        type="password"
        value={password()}
        onInput={(e) => password.set(e.target.value)}
      />
      {errors().password && <span className="error">{errors().password}</span>}

      <button type="submit">Login</button>
    </form>
  );
}
```

### Complex Schema

```typescript
const SignupSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),

  email: z.string()
    .email('Invalid email format'),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),

  confirmPassword: z.string(),

  age: z.number()
    .min(18, 'Must be at least 18 years old')
    .max(120, 'Invalid age'),

  agreeToTerms: z.boolean()
    .refine(val => val === true, 'You must agree to the terms')
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});
```

### Real-Time Zod Validation

```typescript
function useZodForm<T extends z.ZodType>(schema: T) {
  const values = signal<z.infer<T>>({} as z.infer<T>);
  const errors = signal<Record<string, string>>({});

  const validateField = (field: string, value: any) => {
    try {
      // Validate single field
      const fieldSchema = schema.shape[field];
      fieldSchema.parse(value);

      // Clear error if valid
      const newErrors = { ...errors() };
      delete newErrors[field];
      errors.set(newErrors);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.set({
          ...errors(),
          [field]: error.issues[0].message
        });
      }
    }
  };

  const validateAll = (): boolean => {
    const result = schema.safeParse(values());

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path.join('.')] = issue.message;
      });
      errors.set(fieldErrors);
      return false;
    }

    errors.set({});
    return true;
  };

  return { values, errors, validateField, validateAll };
}
```

## Async Validation

### Check Username Availability

```typescript
function UsernameField() {
  const username = signal('');
  const checking = signal(false);
  const error = signal('');

  const checkAvailability = async (value: string) => {
    if (!value) return;

    checking.set(true);
    error.set('');

    try {
      const res = await fetch(`/api/check-username?username=${value}`);
      const data = await res.json();

      if (!data.available) {
        error.set('Username is already taken');
      }
    } catch (err) {
      error.set('Failed to check availability');
    } finally {
      checking.set(false);
    }
  };

  // Debounced validation
  let debounceTimer: any;

  const handleInput = (value: string) => {
    username.set(value);

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      checkAvailability(value);
    }, 500);
  };

  return (
    <div>
      <input
        type="text"
        value={username()}
        onInput={(e) => handleInput(e.target.value)}
        placeholder="Username"
      />

      {checking() && <span className="checking">Checking...</span>}
      {error() && <span className="error">{error()}</span>}
      {!checking() && !error() && username() && (
        <span className="success">✓ Available</span>
      )}
    </div>
  );
}
```

## Server-Side Validation

### Validate on Server

```typescript
// src/pages/api/signup.ts
import { z } from 'zod';

const SignupSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate
    const result = SignupSchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: result.error.issues
        }),
        { status: 400 }
      );
    }

    // Create user
    const user = await createUser(result.data);

    return new Response(JSON.stringify(user), { status: 201 });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      { status: 500 }
    );
  }
}
```

### Client-Side Handling

```typescript
function SignupForm() {
  const formData = signal({ username: '', email: '', password: '' });
  const errors = signal<Record<string, string>>({});
  const serverErrors = signal<string[]>([]);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData())
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          // Map server validation errors to fields
          const fieldErrors: Record<string, string> = {};

          data.details.forEach((issue: any) => {
            const field = issue.path.join('.');
            fieldErrors[field] = issue.message;
          });

          errors.set(fieldErrors);
        } else {
          serverErrors.set([data.error]);
        }
      } else {
        // Success
        console.log('User created:', data);
      }
    } catch (error) {
      serverErrors.set(['Network error. Please try again.']);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {serverErrors().map((err, i) => (
        <div key={i} className="error-banner">{err}</div>
      ))}

      {/* Form fields with error display */}
    </form>
  );
}
```

## Custom Validators

### Reusable Validators

```typescript
const validators = {
  required: (value: any) => {
    return value ? '' : 'This field is required';
  },

  email: (value: string) => {
    if (!value) return '';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ? ''
      : 'Invalid email format';
  },

  minLength: (min: number) => (value: string) => {
    if (!value) return '';
    return value.length >= min
      ? ''
      : `Must be at least ${min} characters`;
  },

  maxLength: (max: number) => (value: string) => {
    if (!value) return '';
    return value.length <= max
      ? ''
      : `Must be at most ${max} characters`;
  },

  pattern: (regex: RegExp, message: string) => (value: string) => {
    if (!value) return '';
    return regex.test(value) ? '' : message;
  },

  match: (other: () => string, fieldName: string) => (value: string) => {
    return value === other()
      ? ''
      : `Must match ${fieldName}`;
  }
};

// Usage
function PasswordField() {
  const password = signal('');
  const error = signal('');

  const validate = () => {
    const errors = [
      validators.required(password()),
      validators.minLength(8)(password()),
      validators.pattern(
        /[A-Z]/,
        'Must contain uppercase letter'
      )(password())
    ].filter(Boolean);

    error.set(errors[0] || '');
  };

  return (
    <div>
      <input
        type="password"
        value={password()}
        onInput={(e) => password.set(e.target.value)}
        onBlur={validate}
      />
      {error() && <span className="error">{error()}</span>}
    </div>
  );
}
```

## Error Display Patterns

### Inline Errors

```typescript
<div className="field">
  <label>Email</label>
  <input
    type="email"
    value={email()}
    onInput={(e) => email.set(e.target.value)}
    className={errors().email ? 'invalid' : ''}
  />
  {errors().email && (
    <span className="error-message">{errors().email}</span>
  )}
</div>
```

### Error Summary

```typescript
function ErrorSummary({ errors }: { errors: Record<string, string> }) {
  const errorList = Object.entries(errors);

  if (errorList.length === 0) return null;

  return (
    <div className="error-summary">
      <h3>Please fix the following errors:</h3>
      <ul>
        {errorList.map(([field, message]) => (
          <li key={field}>{message}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Toast Notifications

```typescript
function Form() {
  const errors = signal<string[]>([]);

  const showErrors = (validationErrors: Record<string, string>) => {
    const messages = Object.values(validationErrors);
    errors.set(messages);

    // Auto-dismiss after 5 seconds
    setTimeout(() => errors.set([]), 5000);
  };

  return (
    <div>
      {errors().map((error, i) => (
        <div key={i} className="toast error">{error}</div>
      ))}

      <form>{/* ... */}</form>
    </div>
  );
}
```

## Best Practices

### Validate on Blur, Not on Change

```typescript
// ✅ Validate when user leaves field
<input
  onBlur={() => validate()}
  onInput={(e) => value.set(e.target.value)}
/>

// ❌ Validate on every keystroke (annoying)
<input
  onInput={(e) => {
    value.set(e.target.value);
    validate(); // Too aggressive
  }}
/>
```

### Show Errors After Touch

```typescript
// ✅ Only show error after user has interacted
{touched() && error() && <span>{error()}</span>}

// ❌ Show error immediately
{error() && <span>{error()}</span>}
```

### Validate Before Submit

```typescript
// ✅ Always validate before submitting
const handleSubmit = (e: Event) => {
  e.preventDefault();

  if (validate()) {
    submitForm();
  }
};

// ❌ Submit without validation
const handleSubmit = (e: Event) => {
  e.preventDefault();
  submitForm(); // May have invalid data
};
```

### Provide Helpful Error Messages

```typescript
// ✅ Specific, actionable messages
'Password must contain at least one uppercase letter'

// ❌ Vague messages
'Invalid password'
```

### Use Both Client and Server Validation

```typescript
// ✅ Validate on both sides
// Client: Immediate feedback
// Server: Security (client can be bypassed)

// ❌ Only client-side (insecure)
// ❌ Only server-side (poor UX)
```

## Summary

You've learned:

✅ Client-side validation patterns
✅ Real-time vs on-submit validation
✅ Schema validation with Zod
✅ Async validation (username availability)
✅ Server-side validation
✅ Custom validators
✅ Error display patterns
✅ Best practices

Validation ensures data quality and improves UX!

---

**Next:** [Submission →](./submission.md) Handle form submission and async operations
