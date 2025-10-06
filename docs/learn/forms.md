# Forms and Inputs

Forms are essential to web applications. Learn how to handle form inputs, validation, submission, and complex form patterns in PhilJS.

## What You'll Learn

- Controlled vs uncontrolled inputs
- Form state management with signals
- Validation patterns
- Form submission handling
- Complex forms
- Best practices

## Controlled Inputs

Controlled inputs have their value managed by signals:

```typescript
function LoginForm() {
  const email = signal('');
  const password = signal('');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    console.log('Login:', { email: email(), password: password() });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email()}
        onInput={(e) => email.set(e.target.value)}
        placeholder="Email"
      />

      <input
        type="password"
        value={password()}
        onInput={(e) => password.set(e.target.value)}
        placeholder="Password"
      />

      <button type="submit">Login</button>
    </form>
  );
}
```

**Key points:**
- Value comes from signal: `value={email()}`
- Updates go to signal: `onInput={(e) => email.set(e.target.value)}`
- Signal is the single source of truth

## Input Types

### Text Input

```typescript
const name = signal('');

<input
  type="text"
  value={name()}
  onInput={(e) => name.set(e.target.value)}
  placeholder="Enter your name"
/>
```

### Email Input

```typescript
const email = signal('');

<input
  type="email"
  value={email()}
  onInput={(e) => email.set(e.target.value)}
  placeholder="email@example.com"
/>
```

### Password Input

```typescript
const password = signal('');

<input
  type="password"
  value={password()}
  onInput={(e) => password.set(e.target.value)}
  placeholder="Password"
/>
```

### Number Input

```typescript
const age = signal(0);

<input
  type="number"
  value={age()}
  onInput={(e) => age.set(Number(e.target.value))}
  min="0"
  max="120"
/>
```

### Checkbox

```typescript
const agreed = signal(false);

<input
  type="checkbox"
  checked={agreed()}
  onChange={(e) => agreed.set(e.target.checked)}
/>
```

### Radio Buttons

```typescript
const size = signal('medium');

<div>
  <label>
    <input
      type="radio"
      value="small"
      checked={size() === 'small'}
      onChange={() => size.set('small')}
    />
    Small
  </label>

  <label>
    <input
      type="radio"
      value="medium"
      checked={size() === 'medium'}
      onChange={() => size.set('medium')}
    />
    Medium
  </label>

  <label>
    <input
      type="radio"
      value="large"
      checked={size() === 'large'}
      onChange={() => size.set('large')}
    />
    Large
  </label>
</div>
```

### Select Dropdown

```typescript
const country = signal('US');

<select
  value={country()}
  onChange={(e) => country.set(e.target.value)}
>
  <option value="US">United States</option>
  <option value="UK">United Kingdom</option>
  <option value="CA">Canada</option>
  <option value="AU">Australia</option>
</select>
```

### Multi-Select

```typescript
const selectedFruits = signal<string[]>([]);

<select
  multiple
  value={selectedFruits()}
  onChange={(e) => {
    const options = e.target.options;
    const selected = Array.from(options)
      .filter(option => option.selected)
      .map(option => option.value);
    selectedFruits.set(selected);
  }}
>
  <option value="apple">Apple</option>
  <option value="banana">Banana</option>
  <option value="orange">Orange</option>
</select>
```

### Textarea

```typescript
const message = signal('');

<textarea
  value={message()}
  onInput={(e) => message.set(e.target.value)}
  placeholder="Enter your message"
  rows={5}
/>
```

### File Input

```typescript
const file = signal<File | null>(null);

<input
  type="file"
  onChange={(e) => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      file.set(input.files[0]);
    }
  }}
/>

{file() && <p>Selected: {file()!.name}</p>}
```

### Date Input

```typescript
const birthDate = signal('');

<input
  type="date"
  value={birthDate()}
  onInput={(e) => birthDate.set(e.target.value)}
/>
```

### Range Input

```typescript
const volume = signal(50);

<div>
  <input
    type="range"
    min="0"
    max="100"
    value={volume()}
    onInput={(e) => volume.set(Number(e.target.value))}
  />
  <span>Volume: {volume()}%</span>
</div>
```

## Form Validation

### Basic Validation

```typescript
function SignupForm() {
  const email = signal('');
  const password = signal('');
  const errors = signal<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!email().includes('@')) {
      newErrors.email = 'Invalid email address';
    }

    if (password().length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    errors.set(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    if (validate()) {
      console.log('Form is valid!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="email"
          value={email()}
          onInput={(e) => email.set(e.target.value)}
        />
        {errors().email && <span className="error">{errors().email}</span>}
      </div>

      <div>
        <input
          type="password"
          value={password()}
          onInput={(e) => password.set(e.target.value)}
        />
        {errors().password && <span className="error">{errors().password}</span>}
      </div>

      <button type="submit">Sign Up</button>
    </form>
  );
}
```

### Real-time Validation

```typescript
function RealTimeValidation() {
  const email = signal('');

  const emailError = memo(() => {
    if (!email()) return '';
    if (!email().includes('@')) return 'Invalid email';
    if (!email().includes('.')) return 'Email must include domain';
    return '';
  });

  const isValid = memo(() => !emailError());

  return (
    <div>
      <input
        type="email"
        value={email()}
        onInput={(e) => email.set(e.target.value)}
        style={{
          borderColor: email() && !isValid() ? 'red' : 'green'
        }}
      />
      {emailError() && <span className="error">{emailError()}</span>}
    </div>
  );
}
```

### Field-level Validation

```typescript
interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function RegistrationForm() {
  const formData = signal<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const usernameError = memo(() => {
    const username = formData().username;
    if (!username) return '';
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores';
    return '';
  });

  const emailError = memo(() => {
    const email = formData().email;
    if (!email) return '';
    if (!email.includes('@')) return 'Invalid email';
    return '';
  });

  const passwordError = memo(() => {
    const password = formData().password;
    if (!password) return '';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain a number';
    return '';
  });

  const confirmPasswordError = memo(() => {
    if (!formData().confirmPassword) return '';
    if (formData().password !== formData().confirmPassword) {
      return 'Passwords do not match';
    }
    return '';
  });

  const isFormValid = memo(() =>
    !usernameError() &&
    !emailError() &&
    !passwordError() &&
    !confirmPasswordError() &&
    formData().username &&
    formData().email &&
    formData().password &&
    formData().confirmPassword
  );

  const updateField = (field: keyof FormData, value: string) => {
    formData.set({ ...formData(), [field]: value });
  };

  return (
    <form>
      <div>
        <input
          value={formData().username}
          onInput={(e) => updateField('username', e.target.value)}
          placeholder="Username"
        />
        {usernameError() && <span className="error">{usernameError()}</span>}
      </div>

      <div>
        <input
          type="email"
          value={formData().email}
          onInput={(e) => updateField('email', e.target.value)}
          placeholder="Email"
        />
        {emailError() && <span className="error">{emailError()}</span>}
      </div>

      <div>
        <input
          type="password"
          value={formData().password}
          onInput={(e) => updateField('password', e.target.value)}
          placeholder="Password"
        />
        {passwordError() && <span className="error">{passwordError()}</span>}
      </div>

      <div>
        <input
          type="password"
          value={formData().confirmPassword}
          onInput={(e) => updateField('confirmPassword', e.target.value)}
          placeholder="Confirm Password"
        />
        {confirmPasswordError() && <span className="error">{confirmPasswordError()}</span>}
      </div>

      <button type="submit" disabled={!isFormValid()}>
        Register
      </button>
    </form>
  );
}
```

## Form Submission

### Basic Submission

```typescript
function ContactForm() {
  const name = signal('');
  const email = signal('');
  const message = signal('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name(),
        email: email(),
        message: message()
      })
    });

    if (response.ok) {
      alert('Message sent!');
      // Reset form
      name.set('');
      email.set('');
      message.set('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
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

### Submission with Loading State

```typescript
function SubmitForm() {
  const formData = signal({ email: '', password: '' });
  const loading = signal(false);
  const error = signal<string | null>(null);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    loading.set(true);
    error.set(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify(formData())
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      // Success handling
      console.log('Logged in');
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      loading.set(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={formData().email}
        onInput={(e) => formData.set({ ...formData(), email: e.target.value })}
        disabled={loading()}
      />
      <input
        type="password"
        value={formData().password}
        onInput={(e) => formData.set({ ...formData(), password: e.target.value })}
        disabled={loading()}
      />

      {error() && <div className="error">{error()}</div>}

      <button type="submit" disabled={loading()}>
        {loading() ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

## Complex Forms

### Multi-step Form

```typescript
function MultiStepForm() {
  const step = signal(1);
  const formData = signal({
    // Step 1
    firstName: '',
    lastName: '',
    email: '',
    // Step 2
    address: '',
    city: '',
    zipCode: '',
    // Step 3
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  const updateField = (field: string, value: string) => {
    formData.set({ ...formData(), [field]: value });
  };

  const nextStep = () => step.set(s => s + 1);
  const prevStep = () => step.set(s => s - 1);

  const renderStep = () => {
    switch (step()) {
      case 1:
        return (
          <div>
            <h2>Personal Information</h2>
            <input
              value={formData().firstName}
              onInput={(e) => updateField('firstName', e.target.value)}
              placeholder="First Name"
            />
            <input
              value={formData().lastName}
              onInput={(e) => updateField('lastName', e.target.value)}
              placeholder="Last Name"
            />
            <input
              type="email"
              value={formData().email}
              onInput={(e) => updateField('email', e.target.value)}
              placeholder="Email"
            />
            <button onClick={nextStep}>Next</button>
          </div>
        );

      case 2:
        return (
          <div>
            <h2>Address</h2>
            <input
              value={formData().address}
              onInput={(e) => updateField('address', e.target.value)}
              placeholder="Street Address"
            />
            <input
              value={formData().city}
              onInput={(e) => updateField('city', e.target.value)}
              placeholder="City"
            />
            <input
              value={formData().zipCode}
              onInput={(e) => updateField('zipCode', e.target.value)}
              placeholder="ZIP Code"
            />
            <button onClick={prevStep}>Back</button>
            <button onClick={nextStep}>Next</button>
          </div>
        );

      case 3:
        return (
          <div>
            <h2>Payment</h2>
            <input
              value={formData().cardNumber}
              onInput={(e) => updateField('cardNumber', e.target.value)}
              placeholder="Card Number"
            />
            <input
              value={formData().expiry}
              onInput={(e) => updateField('expiry', e.target.value)}
              placeholder="MM/YY"
            />
            <input
              value={formData().cvv}
              onInput={(e) => updateField('cvv', e.target.value)}
              placeholder="CVV"
            />
            <button onClick={prevStep}>Back</button>
            <button onClick={handleSubmit}>Submit</button>
          </div>
        );
    }
  };

  const handleSubmit = () => {
    console.log('Submitting:', formData());
  };

  return (
    <div>
      <div className="progress">
        Step {step()} of 3
      </div>
      {renderStep()}
    </div>
  );
}
```

### Dynamic Form Fields

```typescript
interface Contact {
  id: number;
  name: string;
  email: string;
}

function DynamicContactForm() {
  const contacts = signal<Contact[]>([
    { id: 1, name: '', email: '' }
  ]);

  const addContact = () => {
    contacts.set([
      ...contacts(),
      { id: Date.now(), name: '', email: '' }
    ]);
  };

  const removeContact = (id: number) => {
    contacts.set(contacts().filter(c => c.id !== id));
  };

  const updateContact = (id: number, field: 'name' | 'email', value: string) => {
    contacts.set(
      contacts().map(c =>
        c.id === id ? { ...c, [field]: value } : c
      )
    );
  };

  return (
    <div>
      {contacts().map((contact, index) => (
        <div key={contact.id}>
          <h3>Contact {index + 1}</h3>
          <input
            value={contact.name}
            onInput={(e) => updateContact(contact.id, 'name', e.target.value)}
            placeholder="Name"
          />
          <input
            type="email"
            value={contact.email}
            onInput={(e) => updateContact(contact.id, 'email', e.target.value)}
            placeholder="Email"
          />
          {contacts().length > 1 && (
            <button onClick={() => removeContact(contact.id)}>Remove</button>
          )}
        </div>
      ))}

      <button onClick={addContact}>Add Contact</button>
    </div>
  );
}
```

## Form Patterns

### Autosave

```typescript
function AutosaveForm() {
  const content = signal('');
  const saving = signal(false);
  const lastSaved = signal<Date | null>(null);

  // Autosave after 1 second of no typing
  effect(() => {
    const text = content();
    if (!text) return;

    const timer = setTimeout(async () => {
      saving.set(true);

      await fetch('/api/save', {
        method: 'POST',
        body: JSON.stringify({ content: text })
      });

      saving.set(false);
      lastSaved.set(new Date());
    }, 1000);

    return () => clearTimeout(timer);
  });

  return (
    <div>
      <textarea
        value={content()}
        onInput={(e) => content.set(e.target.value)}
        placeholder="Start typing..."
      />

      <div>
        {saving() && <span>Saving...</span>}
        {lastSaved() && <span>Last saved: {lastSaved()!.toLocaleTimeString()}</span>}
      </div>
    </div>
  );
}
```

### Form Reset

```typescript
const initialFormData = {
  name: '',
  email: '',
  message: ''
};

function ResettableForm() {
  const formData = signal(initialFormData);

  const handleReset = () => {
    formData.set(initialFormData);
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    console.log('Submitted:', formData());
    handleReset();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData().name}
        onInput={(e) => formData.set({ ...formData(), name: e.target.value })}
      />
      {/* Other fields... */}

      <button type="submit">Submit</button>
      <button type="button" onClick={handleReset}>Reset</button>
    </form>
  );
}
```

## Best Practices

### Use TypeScript for Form Data

```typescript
interface SignupFormData {
  email: string;
  password: string;
  agreeToTerms: boolean;
}

const formData = signal<SignupFormData>({
  email: '',
  password: '',
  agreeToTerms: false
});
```

### Validate on Submit, Show Errors on Blur

```typescript
const touched = signal<Record<string, boolean>>({});
const errors = signal<Record<string, string>>({});

const handleBlur = (field: string) => {
  touched.set({ ...touched(), [field]: true });
  // Validate this field
};

const showError = (field: string) => {
  return touched()[field] && errors()[field];
};
```

### Disable Submit While Loading

```typescript
<button type="submit" disabled={loading() || !isFormValid()}>
  {loading() ? 'Submitting...' : 'Submit'}
</button>
```

### Clear Errors on Input

```typescript
const handleInput = (field: string, value: string) => {
  formData.set({ ...formData(), [field]: value });
  // Clear error for this field
  errors.set({ ...errors(), [field]: '' });
};
```

## Summary

You've learned:

✅ Controlled inputs with signals
✅ All input types: text, checkbox, radio, select, etc.
✅ Form validation patterns
✅ Form submission with loading states
✅ Complex forms: multi-step, dynamic fields
✅ Common patterns: autosave, reset
✅ Best practices for type-safe, user-friendly forms

Forms are essential to building interactive applications!

---

**Next:** [Styling and CSS →](./styling.md) Learn how to style your PhilJS applications
