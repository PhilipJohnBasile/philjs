# @philjs/forms - Form Management

**Signals-first form management with validation, progressive enhancement, and optimistic updates.**

@philjs/forms provides everything you need for building forms in PhilJS applications: reactive state management, comprehensive validation, multi-step wizards, optimistic UI, and Remix-style form actions.

## Installation

```bash
npm install @philjs/forms
```

## Why @philjs/forms?

- **Signals-first**: Reactive form state with fine-grained updates
- **Type-safe**: Full TypeScript support with generics
- **Validation**: Built-in validators + Zod integration
- **Progressive**: Forms work without JavaScript
- **Optimistic UI**: Instant feedback with automatic rollback
- **Multi-step**: Wizard system with conditional steps
- **Remix-style**: useFormAction and useFetcher patterns

## Quick Start

```typescript
import { useForm, validators } from '@philjs/forms';

function ContactForm() {
  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      message: '',
    },
    validateOn: 'blur',
    onSubmit: async (values) => {
      await fetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify(values),
      });
    },
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <input
        {...form.getFieldProps('name')}
        placeholder="Name"
      />
      {form.errors().name && <span>{form.errors().name}</span>}

      <input
        {...form.getFieldProps('email')}
        type="email"
        placeholder="Email"
      />
      {form.errors().email && <span>{form.errors().email}</span>}

      <textarea
        {...form.getFieldProps('message')}
        placeholder="Message"
      />

      <button disabled={form.isSubmitting()()}>
        {form.isSubmitting()() ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}
```

## Core API

### Form Class

```typescript
import { Form, createForm } from '@philjs/forms';

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

const form = createForm<LoginForm>({
  initialValues: {
    email: '',
    password: '',
    rememberMe: false,
  },
  validateOn: 'blur',        // 'change' | 'blur' | 'submit'
  validateOnMount: false,
  onSubmit: async (values) => {
    const response = await login(values);
    return response;
  },
});

// Access reactive state
form.values;           // Signal<LoginForm>
form.errors;           // Signal<FormErrors<LoginForm>>
form.touched;          // Signal<TouchedFields<LoginForm>>

// Computed state
form.isValid();        // Memo<boolean>
form.isDirty();        // Memo<boolean>
form.isSubmitting();   // Signal<boolean>
form.isValidating();   // Signal<boolean>
form.submitCount();    // Signal<number>

// Complete state object
form.state;            // Memo<FormState<LoginForm>>

// Field operations
form.setFieldValue('email', 'user@example.com');
form.setValues({ email: 'user@example.com', password: 'secret' });
form.setFieldError('email', 'Email already exists');
form.setFieldTouched('email', true);

// Form operations
form.handleSubmit(event);
form.validate();
form.validateField('email');
form.reset();
form.resetWith({ email: 'new@example.com' });

// Get field props for binding
const emailProps = form.getFieldProps('email');
// { name, value, error, touched, onChange, onBlur }
```

### useForm Hook

```typescript
import { useForm } from '@philjs/forms';

function MyForm() {
  const {
    values,
    errors,
    touched,
    isValid,
    isDirty,
    isSubmitting,
    isValidating,
    submitCount,
    state,
    setFieldValue,
    setValues,
    setFieldError,
    setErrors,
    setFieldTouched,
    setTouched,
    reset,
    resetWith,
    validate,
    validateField,
    handleSubmit,
    getFieldProps,
  } = useForm({
    initialValues: { name: '', email: '' },
    validateOn: 'change',
    onSubmit: handleFormSubmit,
  });

  return (
    <form onSubmit={handleSubmit}>
      <input {...getFieldProps('name')} />
      <input {...getFieldProps('email')} type="email" />
      <button disabled={isSubmitting()()}>Submit</button>
    </form>
  );
}
```

## Validation

### Built-in Validators

```typescript
import { validators, validateValue } from '@philjs/forms';

// Required
validators.required('Name is required')

// Email
validators.email('Invalid email')

// Length
validators.minLength(8, 'Must be at least 8 characters')
validators.maxLength(100, 'Too long')

// Numbers
validators.min(18, 'Must be 18 or older')
validators.max(120, 'Invalid age')

// Pattern
validators.pattern(/^[A-Z]/, 'Must start with uppercase')

// URL
validators.url('Invalid URL')

// Field matching
validators.matches('password', 'Passwords must match')

// Enum values
validators.oneOf(['admin', 'user', 'guest'], 'Invalid role')

// Custom validation
validators.custom(
  (value) => value !== 'admin',
  'Admin is reserved'
)
```

### Using Validators

```typescript
import { validateValue, validators } from '@philjs/forms';

// Single rule
const error = await validateValue(
  email,
  validators.email()
);

// Multiple rules
const error = await validateValue(
  password,
  [
    validators.required(),
    validators.minLength(8),
    validators.pattern(
      /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Must contain uppercase, lowercase, and number'
    )
  ]
);
```

### Zod Integration

```typescript
import { createZodValidator, zodValidator } from '@philjs/forms';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  age: z.number().min(18),
});

// Create validator
const { validate, validateField } = createZodValidator(schema);

// Use in form
const form = createForm({
  initialValues: { email: '', password: '', age: 0 },
  validate: zodValidator(schema),
});
```

### Validation Patterns

```typescript
import { patterns } from '@philjs/forms';

patterns.email       // Email regex
patterns.phone       // Phone number
patterns.url         // HTTP(S) URL
patterns.alphanumeric
patterns.numeric
patterns.alpha
patterns.username    // 3-20 chars, alphanumeric with _ and -
patterns.password    // Strong password pattern
patterns.zipCode     // US ZIP code
patterns.creditCard  // Credit card number
patterns.hexColor    // Hex color code
patterns.ipv4        // IPv4 address
```

## Optimistic Updates

### useOptimistic

Update UI immediately while waiting for server response:

```typescript
import { useOptimistic } from '@philjs/forms';

function TodoList() {
  const {
    data,
    pending,
    addOptimistic,
    confirmUpdate,
    rollbackUpdate,
    clearPending,
    hasPending,
  } = useOptimistic(initialTodos, {
    timeout: 30000,  // Auto-rollback after 30s
    onTimeout: (update) => console.warn('Update timed out'),
    onRollback: (update) => console.log('Rolled back'),
  });

  const handleAddTodo = async (text: string) => {
    const tempId = `temp-${Date.now()}`;
    const newTodo = { id: tempId, text, done: false };

    // Immediately add to UI
    addOptimistic('add', tempId, newTodo);

    try {
      // Server request
      const savedTodo = await api.createTodo(newTodo);

      // Confirm with real data
      confirmUpdate(tempId, savedTodo);
    } catch (error) {
      // Rollback on failure
      rollbackUpdate(tempId);
    }
  };

  return (
    <ul>
      {data().map(todo => (
        <li key={todo.id} class={pending().has(todo.id) ? 'pending' : ''}>
          {todo.text}
        </li>
      ))}
    </ul>
  );
}
```

### useOptimisticValue

For single values:

```typescript
import { useOptimisticValue } from '@philjs/forms';

function LikeButton({ likes }: { likes: number }) {
  const {
    value,
    isPending,
    update,
    confirm,
    rollback,
    reset,
  } = useOptimisticValue(likes);

  const handleLike = async () => {
    update(value() + 1);

    try {
      const newCount = await api.like();
      confirm(newCount);
    } catch {
      rollback();
    }
  };

  return (
    <button onClick={handleLike} disabled={isPending()}>
      {value()} likes {isPending() && '(saving...)'}
    </button>
  );
}
```

## Form Actions (Remix-style)

### useFormAction

```typescript
import { useFormAction } from '@philjs/forms';

function LoginForm() {
  const { formProps, state, isIdle, submit, reset } = useFormAction({
    action: '/api/login',
    method: 'POST',
    onSubmit: (formData) => {
      console.log('Submitting:', Object.fromEntries(formData));
    },
    onSuccess: (data) => {
      console.log('Logged in:', data);
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
    onSettled: () => {
      console.log('Request complete');
    },
    resetOnSuccess: false,
    redirectTo: '/dashboard',
    transformData: (formData) => ({
      ...Object.fromEntries(formData),
      timestamp: Date.now(),
    }),
    validate: async (formData) => {
      const email = formData.get('email');
      if (!email) return { email: 'Required' };
      return null;
    },
  });

  return (
    <form {...formProps}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />

      <button disabled={state.isSubmitting()}>
        {state.isSubmitting() ? 'Logging in...' : 'Log in'}
      </button>

      {state.error() && <p class="error">{state.error().message}</p>}
      {state.isSuccess() && <p class="success">Welcome back!</p>}
    </form>
  );
}
```

### useFetcher

For non-navigational submissions:

```typescript
import { useFetcher } from '@philjs/forms';

function NewsletterSignup() {
  const fetcher = useFetcher();

  return (
    <fetcher.Form action="/api/newsletter" method="POST">
      <input name="email" type="email" required />
      <button disabled={fetcher.state() === 'submitting'}>
        {fetcher.state() === 'submitting' ? 'Subscribing...' : 'Subscribe'}
      </button>
      {fetcher.data() && <p>Thanks for subscribing!</p>}
      {fetcher.error() && <p>Error: {fetcher.error().message}</p>}
    </fetcher.Form>
  );
}

// Programmatic submission
function LikeButton({ postId }: { postId: string }) {
  const fetcher = useFetcher();

  const handleLike = () => {
    fetcher.submit(
      { postId },
      { action: '/api/like', method: 'POST' }
    );
  };

  return (
    <button onClick={handleLike} disabled={fetcher.state() !== 'idle'}>
      {fetcher.state() === 'submitting' ? 'Liking...' : 'Like'}
    </button>
  );
}

// Load data
function UserProfile({ userId }: { userId: string }) {
  const fetcher = useFetcher();

  effect(() => {
    fetcher.load(`/api/users/${userId}`);
  });

  return (
    <div>
      {fetcher.state() === 'loading' && <Spinner />}
      {fetcher.data() && <Profile data={fetcher.data()} />}
    </div>
  );
}
```

## Progressive Enhancement

Forms that work without JavaScript:

```typescript
import {
  useProgressiveForm,
  isProgressivelyEnhanced,
  NoScript,
  ClientOnly,
  addJavaScriptMarker,
  clientHasJavaScript,
} from '@philjs/forms';

function CheckoutForm() {
  const {
    formRef,
    isEnhanced,
    isSubmitting,
    save,
    restore,
    clearSaved,
  } = useProgressiveForm({
    disableWhileLoading: false,
    showLoadingIndicator: true,
    preventMultipleSubmit: true,
    focusFirstError: true,
    persistToLocalStorage: true,
    storageKey: 'checkout-form',
    restoreFromLocalStorage: true,
  });

  return (
    <form ref={formRef} action="/checkout" method="POST">
      {/* Form works with or without JavaScript */}
      <input name="email" type="email" required />
      <input name="card" required />

      <button type="submit">
        {isSubmitting() ? 'Processing...' : 'Pay now'}
      </button>

      {/* Only shown when JS is disabled */}
      <NoScript>
        <p>You will be redirected after submission.</p>
      </NoScript>

      {/* Only shown when JS is enabled */}
      <ClientOnly fallback={<p>Loading...</p>}>
        <RichPaymentForm />
      </ClientOnly>
    </form>
  );
}

// Server-side: detect if client has JavaScript
export async function handleSubmit(request: Request) {
  const formData = await request.formData();

  if (!clientHasJavaScript(formData)) {
    // Redirect for non-JS users
    return redirect('/thank-you');
  }

  // Return JSON for JS users
  return json({ success: true });
}
```

## Multi-Step Wizard

### Basic Wizard

```typescript
import { createWizard, useWizard } from '@philjs/forms';

const wizard = createWizard({
  steps: [
    {
      id: 'account',
      title: 'Account',
      description: 'Create your account',
      fields: ['email', 'password'],
      validate: () => emailField.isValid() && passwordField.isValid(),
    },
    {
      id: 'profile',
      title: 'Profile',
      description: 'Set up your profile',
      fields: ['name', 'avatar'],
      canSkip: true,
    },
    {
      id: 'preferences',
      title: 'Preferences',
      description: 'Customize settings',
      fields: ['theme', 'notifications'],
    },
  ],
  initialStep: 0,
  allowJumpToStep: false,
  validateOnStepChange: true,
  persistKey: 'signup-wizard',
  onStepChange: (from, to) => {
    analytics.track('wizard_step', { from, to });
  },
  onComplete: async (data) => {
    await api.createUser(data);
  },
});

// Use the wizard
wizard.nextStep();           // Go to next step
wizard.prevStep();           // Go to previous step
wizard.goToStep(2);          // Jump to step (if allowed)
wizard.skipStep();           // Skip current step (if canSkip)
wizard.reset();              // Reset to initial state
wizard.submit();             // Submit wizard
wizard.setData('email', 'user@example.com');
wizard.getData();            // Get all wizard data
wizard.validateCurrentStep();

// Read wizard state
wizard.state;               // Full state object
wizard.currentStepData;     // Current step config
wizard.progress;            // 0-100 percentage
wizard.isFirstStep;         // boolean
wizard.isLastStep;          // boolean
wizard.canGoNext;           // boolean
wizard.canGoPrev;           // boolean
wizard.activeSteps;         // Steps with conditions met
```

### Conditional Steps

```typescript
const wizard = createWizard({
  steps: [
    { id: 'type', title: 'Account Type', fields: ['accountType'] },
    {
      id: 'business',
      title: 'Business Info',
      fields: ['companyName', 'taxId'],
      // Only show if business account
      condition: (data) => data.accountType === 'business',
    },
    { id: 'payment', title: 'Payment', fields: ['card'] },
  ],
  onComplete: handleComplete,
});
```

### Wizard Templates

```typescript
import {
  createCheckoutWizard,
  createSignupWizard,
  createSurveyWizard,
} from '@philjs/forms';

// Checkout wizard
const checkout = createCheckoutWizard({
  hasShipping: true,
  hasBilling: true,
  onComplete: processOrder,
});

// Signup wizard
const signup = createSignupWizard({
  requireEmailVerification: true,
  hasProfileStep: true,
  onComplete: createAccount,
});

// Survey wizard
const survey = createSurveyWizard([
  { id: 'q1', title: 'How did you hear about us?', type: 'choice' },
  { id: 'q2', title: 'Rate your experience', type: 'rating' },
  { id: 'q3', title: 'Any feedback?', type: 'text', required: false },
], submitSurvey);
```

### Step Indicator

```typescript
import { getStepIndicatorData, calculateProgress } from '@philjs/forms';

function WizardProgress({ wizard }) {
  const steps = getStepIndicatorData({
    steps: wizard.steps,
    currentStep: wizard.state.currentStep,
    visitedSteps: wizard.state.visitedSteps,
    completedSteps: wizard.state.completedSteps,
  });

  const progress = calculateProgress(
    wizard.state.currentStep,
    wizard.steps.length,
    wizard.state.completedSteps
  );

  return (
    <div>
      <div class="progress-bar" style={{ width: `${progress.percentage}%` }} />
      <div class="steps">
        {steps.map(({ step, index, status, isClickable }) => (
          <button
            key={step.id}
            class={`step ${status}`}
            disabled={!isClickable}
            onClick={() => wizard.goToStep(index)}
          >
            {step.title}
          </button>
        ))}
      </div>
    </div>
  );
}
```

## TypeScript Types

```typescript
interface FormConfig<T extends FormValues> {
  initialValues?: Partial<T>;
  validateOn?: 'change' | 'blur' | 'submit';
  validateOnMount?: boolean;
  onSubmit?: (values: T) => void | Promise<void>;
}

interface FormState<T> {
  values: T;
  errors: FormErrors<T>;
  touched: TouchedFields<T>;
  isValid: boolean;
  isSubmitting: boolean;
  isValidating: boolean;
  isDirty: boolean;
  submitCount: number;
}

type FormErrors<T> = { [K in keyof T]?: string | null };
type TouchedFields<T> = { [K in keyof T]?: boolean };
type FieldError = string | null;

interface ValidationRule<T = any> {
  validate: (value: T, values?: FormValues) => boolean | Promise<boolean>;
  message: string;
}
```

## Best Practices

1. **Use `validateOn: 'blur'`** for better UX - validate when users leave fields
2. **Provide clear error messages** - specific validation errors help users
3. **Use optimistic updates** for instant feedback
4. **Persist long forms** - don't lose user data on refresh
5. **Progressive enhancement** - forms should work without JS
6. **Type your forms** - use generics for type safety

## Next Steps

- [Validation](./validation.md) - Advanced validation patterns
- [Wizards](./wizard.md) - Multi-step form deep dive
- [Progressive Enhancement](./progressive.md) - Forms that work everywhere
