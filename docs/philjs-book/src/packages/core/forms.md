# Forms and Validation

PhilJS provides a powerful, type-safe form handling system with built-in validation, field-level reactivity, and seamless integration with the signals system.

## Basic Form Usage

```tsx
import { useForm, v as validators } from '@philjs/core';

function LoginForm() {
  const form = useForm({
    initialValues: {
      email: '',
      password: ''
    },
    validate: {
      email: validators.email('Please enter a valid email'),
      password: validators.minLength(8, 'Password must be at least 8 characters')
    },
    onSubmit: async (values) => {
      await login(values.email, values.password);
    }
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <div>
        <label>Email</label>
        <input
          type="email"
          value={form.values.email()}
          onInput={e => form.setValue('email', e.target.value)}
          onBlur={() => form.touchField('email')}
        />
        {form.errors.email() && (
          <span class="error">{form.errors.email()}</span>
        )}
      </div>

      <div>
        <label>Password</label>
        <input
          type="password"
          value={form.values.password()}
          onInput={e => form.setValue('password', e.target.value)}
          onBlur={() => form.touchField('password')}
        />
        {form.errors.password() && (
          <span class="error">{form.errors.password()}</span>
        )}
      </div>

      <button type="submit" disabled={form.submitting() || !form.isValid()}>
        {form.submitting() ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

## useForm API

### Options

```tsx
interface UseFormOptions<T> {
  initialValues: T;
  validate?: ValidationSchema<T>;
  validateOnChange?: boolean;  // Default: true
  validateOnBlur?: boolean;    // Default: true
  validateOnSubmit?: boolean;  // Default: true
  onSubmit: (values: T) => void | Promise<void>;
  onError?: (errors: FormErrors<T>) => void;
  transform?: (values: T) => T;  // Transform before validation
}
```

### Return Value

```tsx
interface FormApi<T> {
  // Values
  values: SignalRecord<T>;           // Reactive form values
  getValue: <K extends keyof T>(field: K) => T[K];
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setValues: (values: Partial<T>) => void;

  // Errors
  errors: SignalRecord<FormErrors<T>>;
  getError: (field: keyof T) => string | undefined;
  setError: (field: keyof T, error: string) => void;
  clearErrors: () => void;

  // Touched state
  touched: SignalRecord<TouchedFields<T>>;
  isTouched: (field: keyof T) => boolean;
  touchField: (field: keyof T) => void;
  touchAll: () => void;

  // Form state
  isDirty: () => boolean;
  isValid: () => boolean;
  submitting: () => boolean;
  submitted: () => boolean;

  // Actions
  handleSubmit: (e: Event) => Promise<void>;
  reset: (values?: Partial<T>) => void;
  validate: () => Promise<boolean>;
  validateField: (field: keyof T) => Promise<boolean>;
}
```

## Built-in Validators

PhilJS includes a comprehensive set of validators:

```tsx
import { v as validators } from '@philjs/core';

const schema = {
  // Required
  name: validators.required('Name is required'),

  // String validators
  email: validators.email('Invalid email format'),
  url: validators.url('Invalid URL'),
  uuid: validators.uuid('Invalid UUID'),

  // Length validators
  username: validators.minLength(3, 'Min 3 characters'),
  bio: validators.maxLength(500, 'Max 500 characters'),
  code: validators.length(6, 'Must be exactly 6 characters'),

  // Number validators
  age: validators.min(18, 'Must be at least 18'),
  quantity: validators.max(100, 'Max 100 items'),
  rating: validators.between(1, 5, 'Rating must be 1-5'),

  // Pattern matching
  phone: validators.pattern(
    /^\+?[\d\s-()]+$/,
    'Invalid phone number'
  ),

  // Custom validator
  username: validators.custom(
    async (value) => {
      const available = await checkUsernameAvailable(value);
      return available ? null : 'Username is taken';
    }
  )
};
```

### Combining Validators

```tsx
import { v as validators } from '@philjs/core';

const schema = {
  password: validators.compose([
    validators.required('Password is required'),
    validators.minLength(8, 'Min 8 characters'),
    validators.pattern(/[A-Z]/, 'Must contain uppercase'),
    validators.pattern(/[0-9]/, 'Must contain number'),
    validators.pattern(/[!@#$%^&*]/, 'Must contain special char')
  ]),

  confirmPassword: validators.match('password', 'Passwords must match')
};
```

## Field-Level Components

### Creating Reusable Fields

```tsx
import { createField } from '@philjs/core';

interface TextInputProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password';
  placeholder?: string;
}

const TextField = createField<TextInputProps>(({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  error,
  touched,
  onChange,
  onBlur
}) => (
  <div class="field">
    <label for={name}>{label}</label>
    <input
      id={name}
      name={name}
      type={type}
      placeholder={placeholder}
      value={value()}
      onInput={e => onChange(e.target.value)}
      onBlur={onBlur}
      class={touched() && error() ? 'input-error' : ''}
      aria-invalid={touched() && !!error()}
      aria-describedby={error() ? `${name}-error` : undefined}
    />
    {touched() && error() && (
      <span id={`${name}-error`} class="error" role="alert">
        {error()}
      </span>
    )}
  </div>
));
```

### Using Field Components

```tsx
function RegistrationForm() {
  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    validate: {
      email: validators.email(),
      password: validators.minLength(8),
      confirmPassword: validators.match('password')
    },
    onSubmit: handleRegister
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <TextField
        form={form}
        name="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
      />
      <TextField
        form={form}
        name="password"
        label="Password"
        type="password"
      />
      <TextField
        form={form}
        name="confirmPassword"
        label="Confirm Password"
        type="password"
      />
      <button type="submit">Register</button>
    </form>
  );
}
```

## Complex Form Patterns

### Nested Objects

```tsx
interface AddressForm {
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

const form = useForm<AddressForm>({
  initialValues: {
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: ''
    }
  },
  validate: {
    name: validators.required(),
    'address.street': validators.required(),
    'address.city': validators.required(),
    'address.state': validators.required(),
    'address.zip': validators.pattern(/^\d{5}(-\d{4})?$/)
  },
  onSubmit: handleSubmit
});

// Access nested values
form.getValue('address.street');
form.setValue('address.city', 'New York');
```

### Array Fields

```tsx
interface OrderForm {
  customerName: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

function OrderFormComponent() {
  const form = useForm<OrderForm>({
    initialValues: {
      customerName: '',
      items: [{ productId: '', quantity: 1 }]
    },
    onSubmit: submitOrder
  });

  const addItem = () => {
    const items = form.getValue('items');
    form.setValue('items', [...items, { productId: '', quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    const items = form.getValue('items');
    form.setValue('items', items.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={form.handleSubmit}>
      <input
        value={form.values.customerName()}
        onInput={e => form.setValue('customerName', e.target.value)}
      />

      {form.values.items().map((item, index) => (
        <div key={index} class="item-row">
          <select
            value={item.productId}
            onChange={e => {
              const items = [...form.getValue('items')];
              items[index].productId = e.target.value;
              form.setValue('items', items);
            }}
          >
            <option value="">Select product</option>
            {products.map(p => (
              <option value={p.id}>{p.name}</option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            value={item.quantity}
            onInput={e => {
              const items = [...form.getValue('items')];
              items[index].quantity = parseInt(e.target.value);
              form.setValue('items', items);
            }}
          />

          <button type="button" onClick={() => removeItem(index)}>
            Remove
          </button>
        </div>
      ))}

      <button type="button" onClick={addItem}>Add Item</button>
      <button type="submit">Submit Order</button>
    </form>
  );
}
```

### Multi-Step Forms

```tsx
function MultiStepForm() {
  const step = signal(1);

  const form = useForm({
    initialValues: {
      // Step 1
      email: '',
      password: '',
      // Step 2
      firstName: '',
      lastName: '',
      // Step 3
      plan: 'free',
      acceptTerms: false
    },
    onSubmit: handleSubmit
  });

  const stepValidation = {
    1: ['email', 'password'],
    2: ['firstName', 'lastName'],
    3: ['plan', 'acceptTerms']
  };

  const validateStep = async () => {
    const fields = stepValidation[step()];
    const results = await Promise.all(
      fields.map(field => form.validateField(field))
    );
    return results.every(Boolean);
  };

  const nextStep = async () => {
    if (await validateStep()) {
      step.set(s => s + 1);
    }
  };

  const prevStep = () => step.set(s => s - 1);

  return (
    <form onSubmit={form.handleSubmit}>
      <div class="steps">
        <span class={step() >= 1 ? 'active' : ''}>Account</span>
        <span class={step() >= 2 ? 'active' : ''}>Profile</span>
        <span class={step() >= 3 ? 'active' : ''}>Plan</span>
      </div>

      {step() === 1 && (
        <div class="step">
          <TextField form={form} name="email" label="Email" type="email" />
          <TextField form={form} name="password" label="Password" type="password" />
        </div>
      )}

      {step() === 2 && (
        <div class="step">
          <TextField form={form} name="firstName" label="First Name" />
          <TextField form={form} name="lastName" label="Last Name" />
        </div>
      )}

      {step() === 3 && (
        <div class="step">
          <select
            value={form.values.plan()}
            onChange={e => form.setValue('plan', e.target.value)}
          >
            <option value="free">Free</option>
            <option value="pro">Pro ($10/mo)</option>
            <option value="enterprise">Enterprise</option>
          </select>

          <label>
            <input
              type="checkbox"
              checked={form.values.acceptTerms()}
              onChange={e => form.setValue('acceptTerms', e.target.checked)}
            />
            I accept the terms and conditions
          </label>
        </div>
      )}

      <div class="actions">
        {step() > 1 && (
          <button type="button" onClick={prevStep}>Back</button>
        )}
        {step() < 3 ? (
          <button type="button" onClick={nextStep}>Next</button>
        ) : (
          <button type="submit" disabled={form.submitting()}>
            {form.submitting() ? 'Creating...' : 'Create Account'}
          </button>
        )}
      </div>
    </form>
  );
}
```

## Async Validation

```tsx
const form = useForm({
  initialValues: { username: '' },
  validate: {
    username: validators.compose([
      validators.required('Username is required'),
      validators.minLength(3, 'Min 3 characters'),
      validators.custom(async (value) => {
        // Debounced API call
        const available = await checkUsername(value);
        return available ? null : 'Username is already taken';
      })
    ])
  },
  onSubmit: handleSubmit
});

// Show loading state during async validation
function UsernameField() {
  const validating = signal(false);

  return (
    <div>
      <input
        value={form.values.username()}
        onInput={async e => {
          form.setValue('username', e.target.value);
          validating.set(true);
          await form.validateField('username');
          validating.set(false);
        }}
      />
      {validating() && <span>Checking availability...</span>}
      {!validating() && form.errors.username() && (
        <span class="error">{form.errors.username()}</span>
      )}
    </div>
  );
}
```

## Form Submission

### Handling Submit

```tsx
const form = useForm({
  initialValues: { email: '', message: '' },
  onSubmit: async (values) => {
    try {
      await sendMessage(values);
      toast.success('Message sent!');
      form.reset();
    } catch (error) {
      if (error.field) {
        form.setError(error.field, error.message);
      } else {
        toast.error(error.message);
      }
    }
  }
});
```

### Server-Side Validation Errors

```tsx
const form = useForm({
  initialValues: { email: '', password: '' },
  onSubmit: async (values) => {
    const response = await fetch('/api/register', {
      method: 'POST',
      body: JSON.stringify(values)
    });

    if (!response.ok) {
      const errors = await response.json();

      // Set field-specific errors from server
      Object.entries(errors.fields || {}).forEach(([field, message]) => {
        form.setError(field as keyof typeof values, message as string);
      });

      throw new Error(errors.message || 'Registration failed');
    }
  }
});
```

## Integration with Data Layer

```tsx
import { useForm, createMutation, invalidateQueries } from '@philjs/core';

function EditUserForm({ userId }: { userId: string }) {
  const user = useUser(userId);

  const updateUser = createMutation({
    mutator: (data: UserUpdate) => api.updateUser(userId, data),
    onSuccess: () => {
      invalidateQueries(['users', userId]);
      toast.success('User updated');
    }
  });

  const form = useForm({
    initialValues: {
      name: user.data()?.name || '',
      email: user.data()?.email || ''
    },
    onSubmit: async (values) => {
      await updateUser.mutate(values);
    }
  });

  // Update form when user data loads
  effect(() => {
    if (user.data()) {
      form.setValues({
        name: user.data()!.name,
        email: user.data()!.email
      });
    }
  });

  return (
    <form onSubmit={form.handleSubmit}>
      {/* ... */}
    </form>
  );
}
```

## Accessibility

### ARIA Integration

```tsx
function AccessibleField({ name, label, form }) {
  const id = `field-${name}`;
  const errorId = `${id}-error`;
  const descId = `${id}-desc`;

  return (
    <div class="field">
      <label for={id}>{label}</label>
      <input
        id={id}
        name={name}
        value={form.values[name]()}
        onInput={e => form.setValue(name, e.target.value)}
        onBlur={() => form.touchField(name)}
        aria-invalid={form.isTouched(name) && !!form.getError(name)}
        aria-describedby={`${descId} ${form.getError(name) ? errorId : ''}`}
        aria-required="true"
      />
      <span id={descId} class="hint">
        Enter your {label.toLowerCase()}
      </span>
      {form.isTouched(name) && form.getError(name) && (
        <span id={errorId} class="error" role="alert">
          {form.getError(name)}
        </span>
      )}
    </div>
  );
}
```

### Focus Management

```tsx
function FormWithFocusManagement() {
  const form = useForm({
    initialValues: { name: '', email: '' },
    onSubmit: handleSubmit,
    onError: (errors) => {
      // Focus first field with error
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        document.getElementById(`field-${firstErrorField}`)?.focus();
      }
    }
  });

  return <form>{/* ... */}</form>;
}
```

## TypeScript Types

```tsx
import type {
  FormApi,
  FormSchema,
  FieldSchema,
  ValidationRule,
  ValidationError,
  FormState,
  UseFormOptions,
  FieldProps
} from '@philjs/core';

// Type-safe form
interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const form: FormApi<ContactForm> = useForm<ContactForm>({
  initialValues: {
    name: '',
    email: '',
    subject: '',
    message: ''
  },
  onSubmit: async (values: ContactForm) => {
    await sendContact(values);
  }
});
```

## Best Practices

1. **Validate on blur** - Better UX than validate on change
2. **Show errors after touch** - Don't show errors before user interaction
3. **Provide clear error messages** - Be specific about what's wrong
4. **Use loading states** - Show feedback during submission
5. **Handle server errors** - Map server validation to form fields
6. **Focus first error** - Help users navigate to problems
7. **Preserve input on error** - Don't clear form on failed submit

## Next Steps

- [Error Handling](./error-handling.md)
- [Accessibility](./accessibility.md)
- [Animation](./animation.md)
