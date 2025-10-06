# Controlled vs Uncontrolled Components

Understand the difference between controlled and uncontrolled form inputs and when to use each.

## What You'll Learn

- Controlled components
- Uncontrolled components
- Pros and cons of each
- When to use which
- Hybrid approaches
- Best practices

## Controlled Components

### What are Controlled Components?

Controlled components have their value managed by PhilJS state:

```typescript
import { signal } from 'philjs-core';

function ControlledInput() {
  const value = signal('');

  return (
    <input
      type="text"
      value={value()} // React state controls value
      onInput={(e) => value.set(e.target.value)} // Update state on change
    />
  );
}
```

**Characteristics:**
- Value stored in signal
- PhilJS is the "single source of truth"
- Changes flow through state
- Full control over value

### Complete Controlled Form

```typescript
interface FormData {
  username: string;
  email: string;
  password: string;
  agreeToTerms: boolean;
}

function ControlledForm() {
  const formData = signal<FormData>({
    username: '',
    email: '',
    password: '',
    agreeToTerms: false
  });

  const updateField = <K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    formData.set({ ...formData(), [field]: value });
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    console.log('Form data:', formData());
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData().username}
        onInput={(e) => updateField('username', e.target.value)}
        placeholder="Username"
      />

      <input
        type="email"
        value={formData().email}
        onInput={(e) => updateField('email', e.target.value)}
        placeholder="Email"
      />

      <input
        type="password"
        value={formData().password}
        onInput={(e) => updateField('password', e.target.value)}
        placeholder="Password"
      />

      <label>
        <input
          type="checkbox"
          checked={formData().agreeToTerms}
          onChange={(e) => updateField('agreeToTerms', e.target.checked)}
        />
        I agree to the terms
      </label>

      <button type="submit">Submit</button>
    </form>
  );
}
```

### Benefits of Controlled Components

```typescript
function ControlledWithValidation() {
  const email = signal('');
  const emailError = signal('');

  const handleEmailChange = (value: string) => {
    // Transform value
    const lowercase = value.toLowerCase();
    email.set(lowercase);

    // Validate on change
    if (value && !value.includes('@')) {
      emailError.set('Email must contain @');
    } else {
      emailError.set('');
    }
  };

  return (
    <div>
      <input
        type="email"
        value={email()}
        onInput={(e) => handleEmailChange(e.target.value)}
      />
      {emailError() && <span className="error">{emailError()}</span>}

      {/* Can use value anywhere */}
      <p>Preview: {email()}</p>
    </div>
  );
}
```

## Uncontrolled Components

### What are Uncontrolled Components?

Uncontrolled components manage their own state internally:

```typescript
function UncontrolledInput() {
  let inputRef: HTMLInputElement | undefined;

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    // Access value when needed
    if (inputRef) {
      console.log('Value:', inputRef.value);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        ref={inputRef}
        defaultValue="Initial value"
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

**Characteristics:**
- Value stored in DOM
- DOM is the "single source of truth"
- PhilJS reads value when needed
- Less code for simple forms

### Complete Uncontrolled Form

```typescript
function UncontrolledForm() {
  let usernameRef: HTMLInputElement | undefined;
  let emailRef: HTMLInputElement | undefined;
  let passwordRef: HTMLInputElement | undefined;
  let termsRef: HTMLInputElement | undefined;

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    const formData = {
      username: usernameRef?.value,
      email: emailRef?.value,
      password: passwordRef?.value,
      agreeToTerms: termsRef?.checked
    };

    console.log('Form data:', formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        ref={usernameRef}
        name="username"
        placeholder="Username"
      />

      <input
        type="email"
        ref={emailRef}
        name="email"
        placeholder="Email"
      />

      <input
        type="password"
        ref={passwordRef}
        name="password"
        placeholder="Password"
      />

      <label>
        <input
          type="checkbox"
          ref={termsRef}
          name="terms"
        />
        I agree to the terms
      </label>

      <button type="submit">Submit</button>
    </form>
  );
}
```

### FormData API

```typescript
function UncontrolledWithFormData() {
  const handleSubmit = (e: Event) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    // Get all values
    const data = {
      username: formData.get('username'),
      email: formData.get('email'),
      password: formData.get('password'),
      newsletter: formData.get('newsletter') === 'on'
    };

    console.log('Form data:', data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="username" />
      <input type="email" name="email" />
      <input type="password" name="password" />
      <input type="checkbox" name="newsletter" />

      <button type="submit">Submit</button>
    </form>
  );
}
```

## Comparison

### Feature Comparison

| Feature | Controlled | Uncontrolled |
|---------|-----------|--------------|
| Value storage | State (signal) | DOM |
| Real-time validation | ✅ Easy | ❌ Harder |
| Value transformation | ✅ Easy | ❌ Harder |
| Conditional rendering | ✅ Easy | ❌ Harder |
| Performance | Slower (re-renders) | Faster |
| Code complexity | More code | Less code |
| Testing | Easy to test | Harder to test |
| Initial values | `value` prop | `defaultValue` prop |

### Code Comparison

```typescript
// Controlled - More code, more control
function Controlled() {
  const value = signal('');

  return (
    <input
      value={value()}
      onInput={(e) => value.set(e.target.value)}
    />
  );
}

// Uncontrolled - Less code, less control
function Uncontrolled() {
  let ref: HTMLInputElement | undefined;

  return <input ref={ref} />;
}
```

## When to Use Each

### Use Controlled When:

```typescript
// ✅ Real-time validation
function ControlledEmail() {
  const email = signal('');
  const isValid = memo(() => email().includes('@'));

  return (
    <div>
      <input
        type="email"
        value={email()}
        onInput={(e) => email.set(e.target.value)}
      />
      {!isValid() && <span>Invalid email</span>}
    </div>
  );
}

// ✅ Value transformation
function ControlledPhone() {
  const phone = signal('');

  const formatPhone = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  return (
    <input
      type="tel"
      value={phone()}
      onInput={(e) => phone.set(formatPhone(e.target.value))}
    />
  );
}

// ✅ Conditional fields
function ControlledConditional() {
  const hasAddress = signal(false);
  const address = signal('');

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={hasAddress()}
          onChange={(e) => hasAddress.set(e.target.checked)}
        />
        I have an address
      </label>

      {hasAddress() && (
        <input
          type="text"
          value={address()}
          onInput={(e) => address.set(e.target.value)}
          placeholder="Enter address"
        />
      )}
    </div>
  );
}
```

### Use Uncontrolled When:

```typescript
// ✅ Simple forms without validation
function SimpleContactForm() {
  let nameRef: HTMLInputElement | undefined;
  let emailRef: HTMLInputElement | undefined;

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    sendEmail({
      name: nameRef?.value,
      email: emailRef?.value
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" ref={nameRef} name="name" />
      <input type="email" ref={emailRef} name="email" />
      <button type="submit">Send</button>
    </form>
  );
}

// ✅ File inputs (always uncontrolled)
function FileUpload() {
  let fileRef: HTMLInputElement | undefined;

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    const file = fileRef?.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" ref={fileRef} />
      <button type="submit">Upload</button>
    </form>
  );
}

// ✅ Integration with third-party libraries
function DatePicker() {
  let dateRef: HTMLInputElement | undefined;

  effect(() => {
    if (dateRef) {
      // Initialize third-party date picker
      new Pikaday({ field: dateRef });
    }
  });

  return <input type="text" ref={dateRef} />;
}
```

## Hybrid Approach

### Controlled with Default Values

```typescript
function HybridForm({ initialData }: { initialData?: FormData }) {
  const formData = signal<FormData>(
    initialData || {
      name: '',
      email: ''
    }
  );

  return (
    <form>
      <input
        type="text"
        value={formData().name}
        onInput={(e) => formData.set({ ...formData(), name: e.target.value })}
      />

      <input
        type="email"
        value={formData().email}
        onInput={(e) => formData.set({ ...formData(), email: e.target.value })}
      />
    </form>
  );
}
```

### Mixed Controlled/Uncontrolled

```typescript
function MixedForm() {
  // Controlled for fields that need validation
  const email = signal('');
  const emailError = signal('');

  // Uncontrolled for simple fields
  let nameRef: HTMLInputElement | undefined;
  let messageRef: HTMLTextAreaElement | undefined;

  const validateEmail = (value: string) => {
    if (!value.includes('@')) {
      emailError.set('Invalid email');
    } else {
      emailError.set('');
    }
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    const formData = {
      name: nameRef?.value,
      email: email(),
      message: messageRef?.value
    };

    if (!emailError()) {
      submitForm(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Uncontrolled - no validation needed */}
      <input type="text" ref={nameRef} placeholder="Name" />

      {/* Controlled - needs validation */}
      <input
        type="email"
        value={email()}
        onInput={(e) => {
          email.set(e.target.value);
          validateEmail(e.target.value);
        }}
        placeholder="Email"
      />
      {emailError() && <span className="error">{emailError()}</span>}

      {/* Uncontrolled - simple field */}
      <textarea ref={messageRef} placeholder="Message" />

      <button type="submit">Send</button>
    </form>
  );
}
```

## Best Practices

### Default to Controlled

```typescript
// ✅ Start with controlled for consistency
function Form() {
  const name = signal('');
  return <input value={name()} onInput={(e) => name.set(e.target.value)} />;
}

// Only use uncontrolled when you have a good reason
```

### Use defaultValue for Uncontrolled

```typescript
// ✅ Set initial value with defaultValue
<input type="text" ref={ref} defaultValue="Initial" />

// ❌ Don't use value (makes it controlled)
<input type="text" ref={ref} value="Initial" />
```

### Don't Mix value and defaultValue

```typescript
// ❌ Don't do this
<input
  type="text"
  value={value()}
  defaultValue="Initial"
/>

// ✅ Choose one
<input type="text" value={value()} />
// OR
<input type="text" defaultValue="Initial" ref={ref} />
```

### File Inputs are Always Uncontrolled

```typescript
// ✅ File inputs must use refs
function FileInput() {
  let fileRef: HTMLInputElement | undefined;

  return <input type="file" ref={fileRef} />;
}

// ❌ Can't control file input value
<input type="file" value={file()} /> // Won't work
```

## Summary

You've learned:

✅ Controlled components (state-managed)
✅ Uncontrolled components (DOM-managed)
✅ Pros and cons of each approach
✅ When to use controlled vs uncontrolled
✅ Hybrid approaches
✅ FormData API for uncontrolled forms
✅ Best practices

Choose controlled for complex forms, uncontrolled for simple ones!

---

**Next:** [Validation →](./validation.md) Validate form inputs client-side and server-side
