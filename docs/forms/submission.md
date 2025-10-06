# Form Submission

Handle form submission with loading states, error handling, and success feedback.

## What You'll Learn

- Basic submission
- Async submission
- Loading states
- Error handling
- Success feedback
- Form reset
- Best practices

## Basic Submission

### Simple Form Post

```typescript
import { signal } from 'philjs-core';

function ContactForm() {
  const name = signal('');
  const email = signal('');
  const message = signal('');

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    const formData = {
      name: name(),
      email: email(),
      message: message()
    };

    console.log('Submitting:', formData);

    // Would send to server here
    // fetch('/api/contact', { method: 'POST', body: JSON.stringify(formData) })
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name()}
        onInput={(e) => name.set(e.target.value)}
        placeholder="Name"
      />

      <input
        type="email"
        value={email()}
        onInput={(e) => email.set(e.target.value)}
        placeholder="Email"
      />

      <textarea
        value={message()}
        onInput={(e) => message.set(e.target.value)}
        placeholder="Message"
      />

      <button type="submit">Send</button>
    </form>
  );
}
```

## Async Submission

### With Loading State

```typescript
function AsyncForm() {
  const email = signal('');
  const password = signal('');
  const submitting = signal(false);
  const error = signal('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    submitting.set(true);
    error.set('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email(),
          password: password()
        })
      });

      if (!res.ok) {
        throw new Error('Login failed');
      }

      const data = await res.json();
      console.log('Success:', data);

      // Redirect or show success
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      submitting.set(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email()}
        onInput={(e) => email.set(e.target.value)}
        disabled={submitting()}
      />

      <input
        type="password"
        value={password()}
        onInput={(e) => password.set(e.target.value)}
        disabled={submitting()}
      />

      {error() && <div className="error">{error()}</div>}

      <button type="submit" disabled={submitting()}>
        {submitting() ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### With Mutation

```typescript
import { createMutation } from 'philjs-core';

const loginMutation = createMutation({
  mutationFn: async (data: { email: string; password: string }) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error('Login failed');

    return res.json();
  },
  onSuccess: (data) => {
    console.log('Logged in:', data);
    // Redirect to dashboard
    router.push('/dashboard');
  },
  onError: (error) => {
    console.error('Login error:', error);
  }
});

function LoginForm() {
  const email = signal('');
  const password = signal('');
  const { mutate, loading, error } = loginMutation;

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    mutate({ email: email(), password: password() });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email()}
        onInput={(e) => email.set(e.target.value)}
      />

      <input
        type="password"
        value={password()}
        onInput={(e) => password.set(e.target.value)}
      />

      {error() && <div className="error">{error()!.message}</div>}

      <button type="submit" disabled={loading()}>
        {loading() ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

## Success Feedback

### Success Message

```typescript
function ContactForm() {
  const formData = signal({ name: '', email: '', message: '' });
  const submitting = signal(false);
  const submitted = signal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    submitting.set(true);

    try {
      await fetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify(formData())
      });

      submitted.set(true);

      // Reset after 3 seconds
      setTimeout(() => {
        submitted.set(false);
        formData.set({ name: '', email: '', message: '' });
      }, 3000);
    } finally {
      submitting.set(false);
    }
  };

  if (submitted()) {
    return (
      <div className="success-message">
        <h2>✓ Message sent!</h2>
        <p>We'll get back to you soon.</p>
      </div>
    );
  }

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

### Inline Success

```typescript
function NewsletterForm() {
  const email = signal('');
  const success = signal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    await subscribe(email());

    success.set(true);
    email.set('');

    setTimeout(() => success.set(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email()}
        onInput={(e) => email.set(e.target.value)}
        placeholder="Your email"
      />

      <button type="submit">Subscribe</button>

      {success() && (
        <div className="success-inline">
          ✓ Subscribed successfully!
        </div>
      )}
    </form>
  );
}
```

## Error Handling

### Field-Level Errors

```typescript
function SignupForm() {
  const formData = signal({ username: '', email: '', password: '' });
  const fieldErrors = signal<Record<string, string>>({});
  const generalError = signal('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        body: JSON.stringify(formData())
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors) {
          // Field-specific errors
          fieldErrors.set(data.fieldErrors);
        } else {
          // General error
          generalError.set(data.message);
        }
        return;
      }

      // Success
      console.log('Account created');
    } catch (err) {
      generalError.set('Network error. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {generalError() && (
        <div className="error-banner">{generalError()}</div>
      )}

      <div>
        <input
          type="text"
          value={formData().username}
          onInput={(e) => formData.set({ ...formData(), username: e.target.value })}
        />
        {fieldErrors().username && (
          <span className="error">{fieldErrors().username}</span>
        )}
      </div>

      {/* More fields */}
    </form>
  );
}
```

### Retry Logic

```typescript
function FormWithRetry() {
  const data = signal({});
  const submitting = signal(false);
  const error = signal('');
  const retryCount = signal(0);

  const submitWithRetry = async (maxRetries = 3) => {
    for (let i = 0; i <= maxRetries; i++) {
      try {
        submitting.set(true);
        error.set('');

        const res = await fetch('/api/submit', {
          method: 'POST',
          body: JSON.stringify(data())
        });

        if (!res.ok) throw new Error('Submission failed');

        // Success
        return await res.json();
      } catch (err) {
        retryCount.set(i + 1);

        if (i === maxRetries) {
          error.set('Failed after multiple attempts. Please try again later.');
          throw err;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      } finally {
        submitting.set(false);
      }
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    await submitWithRetry();
  };

  return (
    <form onSubmit={handleSubmit}>
      {error() && (
        <div className="error">
          {error()}
          {retryCount() > 0 && ` (Attempt ${retryCount()})`}
        </div>
      )}

      {/* Form fields */}

      <button type="submit" disabled={submitting()}>
        {submitting() ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

## Form Reset

### Reset After Success

```typescript
function CreatePostForm() {
  const title = signal('');
  const content = signal('');

  const reset = () => {
    title.set('');
    content.set('');
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    await createPost({ title: title(), content: content() });

    // Reset form
    reset();

    // Show success message
    toast.success('Post created!');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={title()}
        onInput={(e) => title.set(e.target.value)}
      />
      <textarea
        value={content()}
        onInput={(e) => content.set(e.target.value)}
      />

      <div className="actions">
        <button type="submit">Create</button>
        <button type="button" onClick={reset}>Clear</button>
      </div>
    </form>
  );
}
```

### Confirm Before Reset

```typescript
function EditForm() {
  const data = signal({ /* ... */ });
  const isDirty = signal(false);

  const reset = () => {
    if (isDirty()) {
      if (confirm('Discard unsaved changes?')) {
        data.set({ /* initial values */ });
        isDirty.set(false);
      }
    } else {
      data.set({ /* initial values */ });
    }
  };

  return (
    <form>
      {/* Fields that set isDirty(true) on change */}

      <button type="button" onClick={reset}>
        Reset
      </button>
    </form>
  );
}
```

## Progress Indicators

### Submit Button States

```typescript
function SubmitButton({ submitting, success }: {
  submitting: () => boolean;
  success: () => boolean;
}) {
  if (success()) {
    return (
      <button type="button" className="success" disabled>
        ✓ Submitted
      </button>
    );
  }

  if (submitting()) {
    return (
      <button type="button" disabled>
        <Spinner size="sm" />
        Submitting...
      </button>
    );
  }

  return (
    <button type="submit">
      Submit
    </button>
  );
}
```

### Progress Bar

```typescript
function UploadForm() {
  const file = signal<File | null>(null);
  const uploadProgress = signal(0);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    const fileData = file();
    if (!fileData) return;

    const formData = new FormData();
    formData.append('file', fileData);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        uploadProgress.set(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        console.log('Upload complete');
        uploadProgress.set(100);
      }
    });

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        onChange={(e) => file.set(e.target.files?.[0] || null)}
      />

      {uploadProgress() > 0 && (
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${uploadProgress()}%` }}
          />
          <span>{Math.round(uploadProgress())}%</span>
        </div>
      )}

      <button type="submit">Upload</button>
    </form>
  );
}
```

## Prevent Double Submission

### Disable Button

```typescript
function Form() {
  const submitting = signal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (submitting()) return; // Already submitting

    submitting.set(true);

    try {
      await submitForm();
    } finally {
      submitting.set(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Fields */}

      <button type="submit" disabled={submitting()}>
        {submitting() ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

### Debounce Submission

```typescript
function FormWithDebounce() {
  const submitting = signal(false);
  let submitTimer: any;

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    // Clear previous timer
    clearTimeout(submitTimer);

    // Debounce submission
    submitTimer = setTimeout(async () => {
      submitting.set(true);

      try {
        await submitForm();
      } finally {
        submitting.set(false);
      }
    }, 300);
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

## Best Practices

### Always Prevent Default

```typescript
// ✅ Prevent default form behavior
const handleSubmit = (e: Event) => {
  e.preventDefault();
  // Handle submission
};

// ❌ Forget preventDefault (page reloads)
const handleSubmit = () => {
  // Handle submission
};
```

### Show Loading States

```typescript
// ✅ Disable inputs during submission
<input disabled={submitting()} />
<button disabled={submitting()}>
  {submitting() ? 'Submitting...' : 'Submit'}
</button>

// ❌ No loading feedback
<button>Submit</button>
```

### Handle Errors Gracefully

```typescript
// ✅ Show user-friendly error messages
{error() && (
  <div className="error">
    {getUserFriendlyMessage(error()!)}
  </div>
)}

// ❌ Show raw error or fail silently
```

### Reset After Success

```typescript
// ✅ Clear form after successful submission
if (success) {
  formData.set(initialValues);
}

// ❌ Leave form with submitted data
```

### Validate Before Submit

```typescript
// ✅ Validate before submitting
const handleSubmit = (e: Event) => {
  e.preventDefault();

  if (!validate()) {
    return; // Don't submit if invalid
  }

  submitForm();
};

// ❌ Submit without validation
```

## Summary

You've learned:

✅ Basic and async form submission
✅ Loading states and indicators
✅ Error handling strategies
✅ Success feedback patterns
✅ Form reset and clearing
✅ Progress indicators
✅ Preventing double submission
✅ Best practices

Proper submission handling creates a polished UX!

---

**Next:** [Multi-Step Forms →](./multi-step.md) Build wizard-style forms with multiple steps
