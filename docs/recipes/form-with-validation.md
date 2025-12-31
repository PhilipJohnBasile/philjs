# Form with Validation

**Outcome**: Validate form fields and show errors before submission.

## Solution

```typescript
import { signal } from '@philjs/core';

function LoginForm() {
  const email = signal('');
  const password = signal('');
  const errors = signal<{email?: string; password?: string}>({});

  const validate = () => {
    const newErrors: typeof errors.value = {};

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

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!validate()) return;

    // Submit form
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email(), password: password() }),
    });

    if (response.ok) {
      // Handle success
      console.log('Logged in!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Email</label>
        <input
          type="email"
          value={email()}
          onInput={(e) => email.set(e.target.value)}
          aria-invalid={!!errors().email}
          aria-describedby="email-error"
        />
        {errors().email && (
          <span id="email-error" role="alert">{errors().email}</span>
        )}
      </div>

      <div>
        <label>Password</label>
        <input
          type="password"
          value={password()}
          onInput={(e) => password.set(e.target.value)}
          aria-invalid={!!errors().password}
          aria-describedby="password-error"
        />
        {errors().password && (
          <span id="password-error" role="alert">{errors().password}</span>
        )}
      </div>

      <button type="submit">Log In</button>
    </form>
  );
}
```

## How it Works

1. Signals store form field values and errors
2. `validate()` checks all fields and returns boolean
3. Submit handler prevents default, validates, then submits
4. Errors shown with ARIA attributes for accessibility

## Pitfalls

- **Validating on every keystroke**: Consider validating `onBlur` instead
- **No server-side validation**: Always validate on server too
- **Weak regex**: Email regex is simple; use a library for production

## Production Tips

- Use Zod or Yup for schema validation
- Add debounced async validation (check email availability)
- Show field-level validation on blur
- Use React Hook Form or similar for complex forms
