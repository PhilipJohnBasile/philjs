# Form Basics

PhilJS makes form handling simple with built-in form primitives, automatic serialization, and seamless server integration.

## Basic Forms

### Uncontrolled Form

```tsx
export default function ContactForm() {
  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message')
    };

    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" required />
      <input name="email" type="email" required />
      <textarea name="message" required />
      <button type="submit">Send</button>
    </form>
  );
}
```

### Controlled Form

```tsx
import { signal } from '@philjs/core';

export default function LoginForm() {
  const email = signal('');
  const password = signal('');

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();

    const result = await login({
      email: email(),
      password: password()
    });

    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email()}
        onInput={(e) => email.set((e.target as HTMLInputElement).value)}
        required
      />
      <input
        type="password"
        value={password()}
        onInput={(e) => password.set((e.target as HTMLInputElement).value)}
        required
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

## Form State

### Form Data Signal

```tsx
import { signal } from '@philjs/core';

export default function UserForm() {
  const formData = signal({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const updateField = (field: string, value: string) => {
    formData.set({
      ...formData(),
      [field]: value
    });
  };

  return (
    <form>
      <input
        value={formData().firstName}
        onInput={(e) => updateField('firstName', e.target.value)}
      />
      <input
        value={formData().lastName}
        onInput={(e) => updateField('lastName', e.target.value)}
      />
    </form>
  );
}
```

## Form Submission

### Server Action

```tsx
import { createMutation } from '@philjs/core';

export default function CreatePost() {
  const createPost = createMutation(async (data: FormData) => {
    const response = await fetch('/api/posts', {
      method: 'POST',
      body: data
    });

    return response.json();
  });

  return (
    <form action={createPost}>
      <input name="title" required />
      <textarea name="content" required />
      <button type="submit">Create Post</button>
    </form>
  );
}
```

## Input Types

### Text Inputs

```tsx
<input type="text" name="username" />
<input type="email" name="email" />
<input type="password" name="password" />
<input type="tel" name="phone" />
<input type="url" name="website" />
```

### Number Inputs

```tsx
<input type="number" name="age" min={0} max={120} step={1} />
<input type="range" name="volume" min={0} max={100} />
```

### Date/Time Inputs

```tsx
<input type="date" name="birthday" />
<input type="time" name="appointment" />
<input type="datetime-local" name="event" />
```

### Selection Inputs

```tsx
<select name="country">
  <option value="us">United States</option>
  <option value="uk">United Kingdom</option>
</select>

<input type="checkbox" name="terms" />
<input type="radio" name="gender" value="male" />
<input type="radio" name="gender" value="female" />
```

## Best Practices

### ✅ Do: Use Proper Input Types

```tsx
// ✅ Good - semantic types
<input type="email" name="email" />
<input type="tel" name="phone" />

// ❌ Bad - generic text
<input type="text" name="email" />
```

### ✅ Do: Provide Validation

```tsx
<input
  type="email"
  name="email"
  required
  pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
/>
```

## Next Steps

- [Validation](./validation.md) - Validate forms
- [Actions](./actions.md) - Form actions
- [File Uploads](./file-uploads.md) - Upload files

---

💡 **Tip**: Use uncontrolled forms for simple cases, controlled for complex validation.

⚠️ **Warning**: Always validate on the server, even if you validate on the client.

ℹ️ **Note**: PhilJS automatically serializes FormData for server actions.

