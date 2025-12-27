# philjs-forms

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-%3E%3D6-blue)](https://www.typescriptlang.org)
[![ESM Only](https://img.shields.io/badge/module-ESM%20only-yellow)](https://nodejs.org/api/esm.html)

Advanced form handling for PhilJS with Remix-style primitives, progressive enhancement, and optimistic UI.

## Requirements

- **Node.js 24** or higher
- **TypeScript 6** or higher
- **ESM only** - CommonJS is not supported

## Features

- ✅ **Form Management** - Reactive form state with signals
- ✅ **Validation** - Built-in validators + Zod integration
- ✅ **useFormAction** - Remix-style form actions with progressive enhancement
- ✅ **useFetcher** - Non-navigational form submissions
- ✅ **Optimistic UI** - Instant updates with automatic rollback
- ✅ **Progressive Enhancement** - Works without JavaScript
- ✅ **Field Components** - Pre-built accessible form fields
- ✅ **TypeScript** - Full type safety

## Installation

```bash
pnpm add philjs-forms

# Optional: for Zod validation
pnpm add zod
```

## Quick Start

### Basic Form

```typescript
import { useForm, validators, TextField } from 'philjs-forms';

function ContactForm() {
  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      message: ''
    },
    onSubmit: async (values) => {
      console.log('Submitted:', values);
      await fetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify(values)
      });
    }
  });

  return (
    <form onsubmit={form.handleSubmit}>
      <TextField
        {...form.getFieldProps('name')}
        placeholder="Your name"
      />

      <TextField
        {...form.getFieldProps('email')}
        type="email"
        placeholder="Your email"
      />

      <textarea
        name="message"
        value={form.values().message}
        oninput={(e) => form.setFieldValue('message', e.target.value)}
        onblur={() => form.setFieldTouched('message')}
      />

      <button type="submit" disabled={form.isSubmitting()()}>
        {form.isSubmitting()() ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}
```

### With Validation

```typescript
import { useForm, validators } from 'philjs-forms';

class ContactForm extends Form {
  async validateField(name) {
    const value = this.values()[name];

    if (name === 'email') {
      const rules = [
        validators.required(),
        validators.email()
      ];
      return await validateValue(value, rules);
    }

    if (name === 'name') {
      const rules = [
        validators.required(),
        validators.minLength(2)
      ];
      return await validateValue(value, rules);
    }

    return null;
  }
}

function MyForm() {
  const form = new ContactForm({
    initialValues: { name: '', email: '' },
    validateOn: 'blur'
  });

  return (
    <form onsubmit={form.handleSubmit.bind(form)}>
      <Field name="name" label="Name" required>
        <TextField {...form.getFieldProps('name')} />
      </Field>

      <Field name="email" label="Email" required>
        <TextField {...form.getFieldProps('email')} type="email" />
      </Field>

      <button type="submit">Submit</button>
    </form>
  );
}
```

### With Zod Validation

```typescript
import { useForm, createZodValidator } from 'philjs-forms';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be 18 or older'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

class SignupForm extends Form {
  private validator = createZodValidator(schema);

  async validateField(name) {
    const value = this.values()[name];
    return await this.validator.validateField(name, value);
  }

  async validate() {
    const values = this.values();
    const errors = await this.validator.validate(values);
    this.setErrors(errors);
    return errors;
  }
}

function SignupPage() {
  const form = new SignupForm({
    initialValues: {
      name: '',
      email: '',
      age: 0,
      password: '',
      confirmPassword: ''
    },
    validateOn: 'blur',
    onSubmit: async (values) => {
      await createAccount(values);
    }
  });

  return (
    <form onsubmit={form.handleSubmit.bind(form)}>
      <TextField {...form.getFieldProps('name')} placeholder="Name" />
      <TextField {...form.getFieldProps('email')} type="email" placeholder="Email" />
      <NumberField {...form.getFieldProps('age')} placeholder="Age" />
      <TextField {...form.getFieldProps('password')} type="password" placeholder="Password" />
      <TextField {...form.getFieldProps('confirmPassword')} type="password" placeholder="Confirm" />
      <button type="submit">Sign Up</button>
    </form>
  );
}
```

## API Reference

### Form Class

```typescript
class Form<T extends FormValues> {
  // Reactive signals
  values: Signal<T>;
  errors: Signal<FormErrors<T>>;
  touched: Signal<TouchedFields<T>>;
  isValid: ComputedSignal<boolean>;
  isDirty: ComputedSignal<boolean>;
  isSubmitting: Signal<boolean>;
  isValidating: Signal<boolean>;
  submitCount: Signal<number>;

  // Methods
  setFieldValue<K extends keyof T>(name: K, value: T[K]): void;
  setValues(values: Partial<T>): void;
  setFieldError<K extends keyof T>(name: K, error: string | null): void;
  setErrors(errors: FormErrors<T>): void;
  setFieldTouched<K extends keyof T>(name: K, touched?: boolean): void;
  reset(): void;
  resetWith(values: Partial<T>): void;
  validate(): Promise<FormErrors<T>>;
  validateField<K extends keyof T>(name: K): Promise<string | null>;
  handleSubmit(e?: Event): Promise<void>;
  getFieldProps<K extends keyof T>(name: K): FieldProps;
}
```

### Built-in Validators

```typescript
validators.required(message?: string)
validators.email(message?: string)
validators.minLength(min: number, message?: string)
validators.maxLength(max: number, message?: string)
validators.min(min: number, message?: string)
validators.max(max: number, message?: string)
validators.pattern(regex: RegExp, message?: string)
validators.url(message?: string)
validators.matches(field: string, message?: string)
validators.oneOf(options: any[], message?: string)
validators.custom(fn: Function, message: string)
```

### Field Components

All field components support:
- `name`: Field name
- `value`: Computed signal with current value
- `error`: Error message
- `touched`: Whether field has been touched
- `onChange`: Change handler
- `onBlur`: Blur handler
- `disabled`: Disabled state
- `class`: Custom CSS class
- `errorClass`: CSS class for error state

#### TextField

```typescript
<TextField
  name="username"
  value={value}
  error={error}
  touched={touched}
  type="text" // or "email", "password", "tel", "url", "search"
  placeholder="Enter username"
  onChange={handleChange}
  onBlur={handleBlur}
/>
```

#### TextAreaField

```typescript
<TextAreaField
  name="message"
  value={value}
  rows={5}
  cols={50}
  placeholder="Your message"
  onChange={handleChange}
/>
```

#### SelectField

```typescript
<SelectField
  name="country"
  value={value}
  options={[
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' }
  ]}
  placeholder="Select country"
  onChange={handleChange}
/>
```

#### CheckboxField

```typescript
<CheckboxField
  name="agree"
  value={value}
  label="I agree to terms"
  onChange={handleChange}
/>
```

#### RadioField

```typescript
<RadioField
  name="plan"
  value={value}
  options={[
    { value: 'free', label: 'Free Plan' },
    { value: 'pro', label: 'Pro Plan' }
  ]}
  onChange={handleChange}
/>
```

#### NumberField

```typescript
<NumberField
  name="age"
  value={value}
  min={0}
  max={120}
  step={1}
  onChange={handleChange}
/>
```

#### FileField

```typescript
<FileField
  name="avatar"
  value={value}
  accept="image/*"
  multiple={false}
  onChange={handleChange}
/>
```

## Advanced Usage

### Custom Validation

```typescript
class MyForm extends Form {
  async validateField(name) {
    const value = this.values()[name];

    if (name === 'username') {
      // Check if username is available
      const available = await checkUsername(value);
      if (!available) {
        return 'Username is taken';
      }
    }

    return null;
  }
}
```

### Debounced Validation

```typescript
import { debounceValidation } from 'philjs-forms';

class MyForm extends Form {
  validateField = debounceValidation(async (name) => {
    // Validation logic
  }, 500);
}
```

### Conditional Validation

```typescript
class MyForm extends Form {
  async validateField(name) {
    const values = this.values();

    if (name === 'zipCode' && values.country === 'US') {
      return await validateValue(
        values.zipCode,
        validators.pattern(patterns.zipCode, 'Invalid ZIP code')
      );
    }

    return null;
  }
}
```

### Multiple Validators

```typescript
import { validateValue } from 'philjs-forms';

const rules = [
  validators.required('Password is required'),
  validators.minLength(8, 'Must be at least 8 characters'),
  validators.pattern(patterns.password, 'Must include uppercase, lowercase, number, and symbol')
];

const error = await validateValue(password, rules);
```

### Form State Tracking

```typescript
const form = useForm({ initialValues: { name: '' } });

effect(() => {
  const state = form.state();
  console.log('Form state:', {
    isValid: state.isValid,
    isDirty: state.isDirty,
    submitCount: state.submitCount
  });
});
```

### Dynamic Fields

```typescript
function DynamicForm() {
  const form = useForm({
    initialValues: {
      items: ['']
    }
  });

  const addItem = () => {
    const items = form.values().items;
    form.setFieldValue('items', [...items, '']);
  };

  return (
    <form onsubmit={form.handleSubmit}>
      {form.values().items.map((item, index) => (
        <TextField
          name={`item-${index}`}
          value={() => form.values().items[index]}
          onChange={(value) => {
            const items = [...form.values().items];
            items[index] = value;
            form.setFieldValue('items', items);
          }}
        />
      ))}
      <button type="button" onclick={addItem}>Add Item</button>
    </form>
  );
}
```

## Complete Example

```typescript
import {
  useForm,
  validators,
  validateValue,
  TextField,
  SelectField,
  CheckboxField,
  Field
} from 'philjs-forms';

class RegistrationForm extends Form {
  async validateField(name) {
    const value = this.values()[name];
    const values = this.values();

    switch (name) {
      case 'email':
        return await validateValue(value, [
          validators.required(),
          validators.email()
        ]);

      case 'password':
        return await validateValue(value, [
          validators.required(),
          validators.minLength(8),
          validators.pattern(
            patterns.password,
            'Password must include uppercase, lowercase, number, and symbol'
          )
        ]);

      case 'confirmPassword':
        return await validateValue(value, [
          validators.required(),
          validators.matches('password', 'Passwords must match')
        ], values);

      case 'age':
        return await validateValue(value, [
          validators.required(),
          validators.min(18, 'Must be 18 or older')
        ]);

      default:
        return null;
    }
  }
}

function RegisterPage() {
  const form = new RegistrationForm({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
      age: 0,
      plan: 'free',
      agree: false
    },
    validateOn: 'blur',
    onSubmit: async (values) => {
      await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
    }
  });

  return (
    <div class="register-page">
      <h1>Register</h1>

      <form onsubmit={form.handleSubmit.bind(form)}>
        <Field name="email" label="Email" required>
          <TextField
            {...form.getFieldProps('email')}
            type="email"
            placeholder="you@example.com"
          />
        </Field>

        <Field name="password" label="Password" required hint="Min 8 characters">
          <TextField
            {...form.getFieldProps('password')}
            type="password"
          />
        </Field>

        <Field name="confirmPassword" label="Confirm Password" required>
          <TextField
            {...form.getFieldProps('confirmPassword')}
            type="password"
          />
        </Field>

        <Field name="age" label="Age" required>
          <NumberField
            {...form.getFieldProps('age')}
            min={0}
            max={120}
          />
        </Field>

        <Field name="plan" label="Plan">
          <SelectField
            {...form.getFieldProps('plan')}
            options={[
              { value: 'free', label: 'Free' },
              { value: 'pro', label: 'Pro ($9/mo)' },
              { value: 'enterprise', label: 'Enterprise' }
            ]}
          />
        </Field>

        <CheckboxField
          {...form.getFieldProps('agree')}
          label="I agree to the terms and conditions"
        />

        <div class="form-actions">
          <button
            type="submit"
            disabled={!form.isValid()() || form.isSubmitting()()}
          >
            {form.isSubmitting()() ? 'Registering...' : 'Register'}
          </button>
        </div>

        {!form.isValid()() && form.submitCount()() > 0 && (
          <div class="form-error">
            Please fix the errors above
          </div>
        )}
      </form>
    </div>
  );
}
```

## TypeScript

Full TypeScript support included:

```typescript
import type {
  FormValues,
  FormErrors,
  FormState,
  ValidationRule,
  FieldConfig
} from 'philjs-forms';

interface MyFormValues {
  email: string;
  password: string;
  age: number;
}

const form = useForm<MyFormValues>({
  initialValues: {
    email: '',
    password: '',
    age: 0
  }
});
```

## License

MIT
