# Form Libraries

Integrate PhilJS with form validation libraries and build reusable form utilities.

## What You'll Learn

- Zod integration
- Custom form utilities
- Reusable validation
- Type-safe forms
- Form state management
- Field-level control
- Best practices

## Zod Integration

### Basic Zod Schema

```typescript
import { z } from 'zod';
import { signal } from '@philjs/core';

const UserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  age: z.number().min(18, 'Must be at least 18 years old')
});

type UserFormData = z.infer<typeof UserSchema>;

function ZodForm() {
  const formData = signal<UserFormData>({
    username: '',
    email: '',
    password: '',
    age: 0
  });

  const errors = signal<Partial<Record<keyof UserFormData, string>>>({});

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    const result = UserSchema.safeParse(formData());

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof UserFormData, string>> = {};

      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof UserFormData;
        fieldErrors[field] = issue.message;
      });

      errors.set(fieldErrors);
    } else {
      // Form is valid
      console.log('Valid data:', result.data);
      errors.set({});
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData().username}
        onInput={(e) => formData.set({ ...formData(), username: e.target.value })}
      />
      {errors().username && <span className="error">{errors().username}</span>}

      {/* Other fields */}

      <button type="submit">Submit</button>
    </form>
  );
}
```

### Real-Time Zod Validation

```typescript
function useZodValidation<T extends z.ZodType>(schema: T) {
  const errors = signal<Record<string, string>>({});

  const validateField = async (field: string, value: any) => {
    try {
      // Validate single field if schema has shape
      if ('shape' in schema && schema.shape) {
        const fieldSchema = schema.shape[field];
        if (fieldSchema) {
          await fieldSchema.parseAsync(value);
          // Clear error if valid
          const newErrors = { ...errors() };
          delete newErrors[field];
          errors.set(newErrors);
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.set({
          ...errors(),
          [field]: error.issues[0].message
        });
      }
    }
  };

  const validateAll = async (data: z.infer<T>): Promise<boolean> => {
    try {
      await schema.parseAsync(data);
      errors.set({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          const field = issue.path.join('.');
          fieldErrors[field] = issue.message;
        });
        errors.set(fieldErrors);
      }
      return false;
    }
  };

  return { errors, validateField, validateAll };
}

// Usage
function ValidatedForm() {
  const formData = signal<UserFormData>({
    username: '',
    email: '',
    password: '',
    age: 0
  });

  const { errors, validateField, validateAll } = useZodValidation(UserSchema);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (await validateAll(formData())) {
      console.log('Form is valid!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData().username}
        onInput={(e) => {
          formData.set({ ...formData(), username: e.target.value });
        }}
        onBlur={() => validateField('username', formData().username)}
      />
      {errors().username && <span className="error">{errors().username}</span>}

      {/* Other fields */}
    </form>
  );
}
```

## Custom Form Utilities

### useForm Hook

```typescript
interface UseFormConfig<T> {
  initialValues: T;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit: (values: T) => void | Promise<void>;
}

function useForm<T extends Record<string, any>>(config: UseFormConfig<T>) {
  const values = signal<T>(config.initialValues);
  const errors = signal<Partial<Record<keyof T, string>>>({});
  const touched = signal<Partial<Record<keyof T, boolean>>>({});
  const submitting = signal(false);
  const submitCount = signal(0);

  const setFieldValue = <K extends keyof T>(field: K, value: T[K]) => {
    values.set({ ...values(), [field]: value });
  };

  const setFieldTouched = (field: keyof T, isTouched = true) => {
    touched.set({ ...touched(), [field]: isTouched });
  };

  const setFieldError = (field: keyof T, error: string) => {
    errors.set({ ...errors(), [field]: error });
  };

  const validateField = (field: keyof T) => {
    if (config.validate) {
      const fieldErrors = config.validate(values());
      if (fieldErrors[field]) {
        setFieldError(field, fieldErrors[field]!);
      } else {
        const newErrors = { ...errors() };
        delete newErrors[field];
        errors.set(newErrors);
      }
    }
  };

  const validateForm = (): boolean => {
    if (config.validate) {
      const validationErrors = config.validate(values());
      errors.set(validationErrors);
      return Object.keys(validationErrors).length === 0;
    }
    return true;
  };

  const handleSubmit = async (e?: Event) => {
    if (e) e.preventDefault();

    submitCount.set(submitCount() + 1);

    if (!validateForm()) return;

    submitting.set(true);

    try {
      await config.onSubmit(values());
    } finally {
      submitting.set(false);
    }
  };

  const reset = () => {
    values.set(config.initialValues);
    errors.set({});
    touched.set({});
    submitCount.set(0);
  };

  const getFieldProps = <K extends keyof T>(field: K) => ({
    value: values()[field],
    onInput: (e: Event) => {
      const input = e.target as HTMLInputElement;
      setFieldValue(field, input.value as T[K]);

      // Validate if already touched
      if (touched()[field]) {
        validateField(field);
      }
    },
    onBlur: () => {
      setFieldTouched(field);
      validateField(field);
    }
  });

  const getFieldError = (field: keyof T) => {
    return touched()[field] ? errors()[field] : undefined;
  };

  return {
    values,
    errors,
    touched,
    submitting,
    submitCount,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    handleSubmit,
    reset,
    getFieldProps,
    getFieldError
  };
}

// Usage
function MyForm() {
  const form = useForm({
    initialValues: {
      email: '',
      password: ''
    },
    validate: (values) => {
      const errors: any = {};

      if (!values.email) {
        errors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(values.email)) {
        errors.email = 'Invalid email';
      }

      if (!values.password) {
        errors.password = 'Password is required';
      } else if (values.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }

      return errors;
    },
    onSubmit: async (values) => {
      console.log('Submitting:', values);
      await login(values);
    }
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <div>
        <input type="email" {...form.getFieldProps('email')} />
        {form.getFieldError('email') && (
          <span className="error">{form.getFieldError('email')}</span>
        )}
      </div>

      <div>
        <input type="password" {...form.getFieldProps('password')} />
        {form.getFieldError('password') && (
          <span className="error">{form.getFieldError('password')}</span>
        )}
      </div>

      <button type="submit" disabled={form.submitting()}>
        {form.submitting() ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### useFieldArray Hook

```typescript
function useFieldArray<T>(initialValues: T[] = []) {
  const fields = signal<T[]>(initialValues);

  const append = (value: T) => {
    fields.set([...fields(), value]);
  };

  const remove = (index: number) => {
    fields.set(fields().filter((_, i) => i !== index));
  };

  const update = (index: number, value: T) => {
    const updated = [...fields()];
    updated[index] = value;
    fields.set(updated);
  };

  const move = (from: number, to: number) => {
    const updated = [...fields()];
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);
    fields.set(updated);
  };

  const clear = () => {
    fields.set([]);
  };

  return {
    fields,
    append,
    remove,
    update,
    move,
    clear
  };
}

// Usage
interface Email {
  address: string;
  isPrimary: boolean;
}

function EmailListForm() {
  const { fields, append, remove, update } = useFieldArray<Email>([
    { address: '', isPrimary: true }
  ]);

  return (
    <div>
      {fields().map((email, index) => (
        <div key={index}>
          <input
            type="email"
            value={email.address}
            onInput={(e) =>
              update(index, {
                ...email,
                address: e.target.value
              })
            }
          />

          <label>
            <input
              type="checkbox"
              checked={email.isPrimary}
              onChange={(e) =>
                update(index, {
                  ...email,
                  isPrimary: e.target.checked
                })
              }
            />
            Primary
          </label>

          <button onClick={() => remove(index)}>Remove</button>
        </div>
      ))}

      <button onClick={() => append({ address: '', isPrimary: false })}>
        Add Email
      </button>
    </div>
  );
}
```

## Form Context

### Shared Form State

```typescript
import { createContext } from '@philjs/core';

interface FormContextValue<T> {
  values: () => T;
  errors: () => Partial<Record<keyof T, string>>;
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setFieldError: (field: keyof T, error: string) => void;
}

function createFormContext<T>() {
  return createContext<FormContextValue<T>>();
}

// Create and provide context
const FormContext = createFormContext<{
  email: string;
  password: string;
}>();

function FormProvider({ children }: { children: any }) {
  const values = signal({ email: '', password: '' });
  const errors = signal<Partial<Record<string, string>>>({});

  const setFieldValue = (field: string, value: any) => {
    values.set({ ...values(), [field]: value });
  };

  const setFieldError = (field: string, error: string) => {
    errors.set({ ...errors(), [field]: error });
  };

  return (
    <FormContext.Provider value={{ values, errors, setFieldValue, setFieldError }}>
      {children}
    </FormContext.Provider>
  );
}

// Field component using context
function Field({ name, type = 'text' }: { name: string; type?: string }) {
  const form = FormContext.use();

  return (
    <div>
      <input
        type={type}
        value={form.values()[name]}
        onInput={(e) => form.setFieldValue(name, e.target.value)}
      />
      {form.errors()[name] && (
        <span className="error">{form.errors()[name]}</span>
      )}
    </div>
  );
}

// Usage
function MyForm() {
  return (
    <FormProvider>
      <form>
        <Field name="email" type="email" />
        <Field name="password" type="password" />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}
```

## Type-Safe Forms

### Generic Form Components

```typescript
interface FieldProps<T, K extends keyof T> {
  name: K;
  label: string;
  type?: string;
  value: T[K];
  error?: string;
  onChange: (value: T[K]) => void;
}

function Field<T, K extends keyof T>({
  name,
  label,
  type = 'text',
  value,
  error,
  onChange
}: FieldProps<T, K>) {
  return (
    <div className="field">
      <label htmlFor={String(name)}>{label}</label>
      <input
        id={String(name)}
        type={type}
        value={String(value)}
        onInput={(e) => onChange((e.target as HTMLInputElement).value as T[K])}
      />
      {error && <span className="error">{error}</span>}
    </div>
  );
}

// Usage with full type safety
interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

function TypeSafeForm() {
  const formData = signal<LoginForm>({
    email: '',
    password: '',
    rememberMe: false
  });

  const errors = signal<Partial<Record<keyof LoginForm, string>>>({});

  const updateField = <K extends keyof LoginForm>(
    field: K,
    value: LoginForm[K]
  ) => {
    formData.set({ ...formData(), [field]: value });
  };

  return (
    <form>
      <Field<LoginForm, 'email'>
        name="email"
        label="Email"
        type="email"
        value={formData().email}
        error={errors().email}
        onChange={(value) => updateField('email', value)}
      />

      <Field<LoginForm, 'password'>
        name="password"
        label="Password"
        type="password"
        value={formData().password}
        error={errors().password}
        onChange={(value) => updateField('password', value)}
      />

      <button type="submit">Login</button>
    </form>
  );
}
```

## Validation Utilities

### Reusable Validators

```typescript
type Validator<T> = (value: T) => string | undefined;

const validators = {
  required: <T>(message = 'This field is required'): Validator<T> => {
    return (value) => (value ? undefined : message);
  },

  minLength: (min: number, message?: string): Validator<string> => {
    return (value) =>
      value.length >= min
        ? undefined
        : message || `Must be at least ${min} characters`;
  },

  maxLength: (max: number, message?: string): Validator<string> => {
    return (value) =>
      value.length <= max
        ? undefined
        : message || `Must be at most ${max} characters`;
  },

  email: (message = 'Invalid email address'): Validator<string> => {
    return (value) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : message;
  },

  pattern: (regex: RegExp, message: string): Validator<string> => {
    return (value) => (regex.test(value) ? undefined : message);
  },

  min: (min: number, message?: string): Validator<number> => {
    return (value) =>
      value >= min ? undefined : message || `Must be at least ${min}`;
  },

  max: (max: number, message?: string): Validator<number> => {
    return (value) =>
      value <= max ? undefined : message || `Must be at most ${max}`;
  },

  oneOf: <T>(options: T[], message?: string): Validator<T> => {
    return (value) =>
      options.includes(value)
        ? undefined
        : message || `Must be one of: ${options.join(', ')}`;
  },

  custom: <T>(fn: (value: T) => boolean, message: string): Validator<T> => {
    return (value) => (fn(value) ? undefined : message);
  }
};

// Compose validators
function composeValidators<T>(...validators: Validator<T>[]): Validator<T> {
  return (value: T) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return undefined;
  };
}

// Usage
const emailValidator = composeValidators(
  validators.required('Email is required'),
  validators.email()
);

const passwordValidator = composeValidators(
  validators.required('Password is required'),
  validators.minLength(8),
  validators.pattern(/[A-Z]/, 'Must contain uppercase letter'),
  validators.pattern(/[0-9]/, 'Must contain a number')
);

function ValidatedLoginForm() {
  const email = signal('');
  const password = signal('');
  const errors = signal({ email: '', password: '' });

  const validate = () => {
    const emailError = emailValidator(email()) || '';
    const passwordError = passwordValidator(password()) || '';

    errors.set({ email: emailError, password: passwordError });

    return !emailError && !passwordError;
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (validate()) {
      console.log('Form is valid!');
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

## Best Practices

### Use Schema Validation

```typescript
// ✅ Type-safe schema validation
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

type FormData = z.infer<typeof schema>;

// ❌ Manual validation without types
```

### Create Reusable Utilities

```typescript
// ✅ Build once, use everywhere
const form = useForm({ ... });

// ❌ Duplicate validation logic
```

### Validate on Blur, Not Input

```typescript
// ✅ Better UX - validate when user leaves field
<input
  onBlur={() => validateField('email')}
  onInput={(e) => setValue(e.target.value)}
/>

// ❌ Annoying - validate on every keystroke
<input onInput={(e) => {
  setValue(e.target.value);
  validate();
}} />
```

### Type Everything

```typescript
// ✅ Full type safety
interface FormData {
  email: string;
  age: number;
}

const formData = signal<FormData>({ email: '', age: 0 });

// ❌ Lose type safety
const formData = signal({ email: '', age: 0 });
```

### Compose Validators

```typescript
// ✅ Reusable, composable validators
const validator = composeValidators(
  validators.required(),
  validators.email()
);

// ❌ One-off validation logic
```

## Summary

You've learned:

✅ Zod integration for type-safe validation
✅ Custom form utilities (useForm, useFieldArray)
✅ Form context for shared state
✅ Type-safe form components
✅ Reusable validation utilities
✅ Validator composition
✅ Best practices for form libraries

Build robust, reusable form systems with PhilJS!

---

**Next:** [Accessibility →](./accessibility.md) Make forms accessible to all users

