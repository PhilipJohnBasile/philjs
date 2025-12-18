/**
 * Example: Form Testing with Validation
 *
 * This example shows how to test forms with validation,
 * including error messages and submission handling.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from 'philjs-testing';
import { userEvent } from 'philjs-testing';
import { signal } from 'philjs-core';

// Form component with validation
function LoginForm({ onSubmit }: { onSubmit?: (data: any) => void }) {
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
      onSubmit?.({
        email: email(),
        password: password(),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Login</h1>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email()}
          onInput={(e) => email.set((e.target as HTMLInputElement).value)}
        />
        {errors().email && (
          <span role="alert" className="error">
            {errors().email}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password()}
          onInput={(e) => password.set((e.target as HTMLInputElement).value)}
        />
        {errors().password && (
          <span role="alert" className="error">
            {errors().password}
          </span>
        )}
      </div>

      <button type="submit">Log In</button>
    </form>
  );
}

describe('LoginForm', () => {
  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(() => <LoginForm />);

    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(() => <LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(screen.getByText('Email is invalid')).toBeInTheDocument();
  });

  it('validates password length', async () => {
    const user = userEvent.setup();
    render(() => <LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'short');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(
      screen.getByText('Password must be at least 8 characters')
    ).toBeInTheDocument();
  });

  it('submits valid form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(() => <LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('clears errors when valid input provided', async () => {
    const user = userEvent.setup();
    render(() => <LoginForm />);

    // Submit to trigger errors
    await user.click(screen.getByRole('button', { name: /log in/i }));
    expect(screen.getByText('Email is required')).toBeInTheDocument();

    // Fix the error
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
  });
});
