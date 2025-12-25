import { Metadata } from 'next';
import { APIReference } from '@/components/APIReference';

export const metadata: Metadata = {
  title: 'philjs-forms API Reference',
  description: 'Complete API documentation for philjs-forms - form handling, validation, and server actions.',
};

export default function FormsAPIPage() {
  return (
    <APIReference
      title="philjs-forms"
      description="Form handling primitives with validation, error handling, and server actions support."
      sourceLink="https://github.com/philjs/philjs/tree/main/packages/philjs-forms"
      methods={[
        {
          name: 'createForm',
          signature: 'function createForm<T>(options: FormOptions<T>): FormReturn<T>',
          description: 'Creates a form controller with validation, submission handling, and field management.',
          parameters: [
            {
              name: 'options',
              type: 'FormOptions<T>',
              description: 'Configuration object for the form',
            },
          ],
          returns: {
            type: 'FormReturn<T>',
            description: 'Form controller with fields, handlers, and state',
          },
          example: `const form = createForm({
  initialValues: {
    email: '',
    password: '',
  },
  validate: (values) => {
    const errors: Record<string, string> = {};
    if (!values.email) errors.email = 'Required';
    if (!values.email.includes('@')) errors.email = 'Invalid email';
    if (values.password.length < 8) errors.password = 'Too short';
    return errors;
  },
  onSubmit: async (values) => {
    await signIn(values);
  },
});

// In your component
<form onSubmit={form.handleSubmit}>
  <input {...form.field('email')} />
  {form.errors.email && <span>{form.errors.email}</span>}

  <input type="password" {...form.field('password')} />
  {form.errors.password && <span>{form.errors.password}</span>}

  <button type="submit" disabled={form.submitting}>
    Submit
  </button>
</form>`,
          since: '1.0.0',
        },
        {
          name: 'useForm',
          signature: 'function useForm<T>(options: FormOptions<T>): FormReturn<T>',
          description: 'Hook version of createForm for use within components.',
          parameters: [
            {
              name: 'options',
              type: 'FormOptions<T>',
              description: 'Configuration object for the form',
            },
          ],
          returns: {
            type: 'FormReturn<T>',
            description: 'Form controller with fields, handlers, and state',
          },
          example: `function LoginForm() {
  const form = useForm({
    initialValues: { email: '', password: '' },
    onSubmit: async (values) => {
      await login(values);
    },
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <input {...form.field('email')} />
      <input type="password" {...form.field('password')} />
      <button type="submit">Login</button>
    </form>
  );
}`,
          since: '1.0.0',
        },
        {
          name: 'createFormField',
          signature: 'function createFormField<T>(name: string, options?: FieldOptions<T>): FormField<T>',
          description: 'Creates an individual form field with its own validation and state.',
          parameters: [
            {
              name: 'name',
              type: 'string',
              description: 'Field name for form data',
            },
            {
              name: 'options',
              type: 'FieldOptions<T>',
              description: 'Field configuration',
              optional: true,
            },
          ],
          returns: {
            type: 'FormField<T>',
            description: 'Field controller with value, error, and handlers',
          },
          example: `const emailField = createFormField('email', {
  validate: (value) => {
    if (!value) return 'Email is required';
    if (!value.includes('@')) return 'Invalid email';
  },
  transform: (value) => value.toLowerCase().trim(),
});

<input
  value={emailField.value()}
  onInput={(e) => emailField.setValue(e.target.value)}
  onBlur={emailField.handleBlur}
/>
{emailField.touched() && emailField.error() && (
  <span>{emailField.error()}</span>
)}`,
          since: '1.0.0',
        },
        {
          name: 'useServerAction',
          signature: 'function useServerAction<T, R>(action: (data: T) => Promise<R>): ServerActionReturn<T, R>',
          description: 'Wraps a server action with pending state and error handling.',
          parameters: [
            {
              name: 'action',
              type: '(data: T) => Promise<R>',
              description: 'Server action function',
            },
          ],
          returns: {
            type: 'ServerActionReturn<T, R>',
            description: 'Action wrapper with execute, pending, and error state',
          },
          example: `// server/actions.ts
'use server';
export async function createUser(data: UserData) {
  return db.users.create({ data });
}

// Component
import { createUser } from './server/actions';

function CreateUserForm() {
  const { execute, pending, error, data } = useServerAction(createUser);

  return (
    <form action={execute}>
      <input name="name" />
      <input name="email" type="email" />
      {pending() && <Spinner />}
      {error() && <Alert>{error().message}</Alert>}
      <button type="submit">Create</button>
    </form>
  );
}`,
          since: '1.0.0',
        },
        {
          name: 'createValidator',
          signature: 'function createValidator<T>(schema: ValidationSchema<T>): Validator<T>',
          description: 'Creates a reusable validator from a schema definition.',
          parameters: [
            {
              name: 'schema',
              type: 'ValidationSchema<T>',
              description: 'Validation schema object',
            },
          ],
          returns: {
            type: 'Validator<T>',
            description: 'Validator function',
          },
          example: `const userValidator = createValidator({
  email: {
    required: 'Email is required',
    pattern: [/^[^@]+@[^@]+$/, 'Invalid email format'],
  },
  password: {
    required: 'Password is required',
    minLength: [8, 'Password must be at least 8 characters'],
    custom: (value) => {
      if (!/[A-Z]/.test(value)) {
        return 'Must contain uppercase letter';
      }
    },
  },
  age: {
    min: [18, 'Must be 18 or older'],
    max: [120, 'Invalid age'],
  },
});

const form = createForm({
  validate: userValidator,
  // ...
});`,
          since: '1.0.0',
        },
        {
          name: 'FormProvider',
          signature: 'function FormProvider<T>(props: { form: FormReturn<T>; children: JSX.Element }): JSX.Element',
          description: 'Provides form context to child components for nested form fields.',
          parameters: [
            {
              name: 'form',
              type: 'FormReturn<T>',
              description: 'Form controller instance',
            },
            {
              name: 'children',
              type: 'JSX.Element',
              description: 'Child components',
            },
          ],
          example: `function CheckoutForm() {
  const form = createForm({ /* ... */ });

  return (
    <FormProvider form={form}>
      <form onSubmit={form.handleSubmit}>
        <ShippingFields />
        <PaymentFields />
        <button type="submit">Complete Order</button>
      </form>
    </FormProvider>
  );
}

function ShippingFields() {
  const form = useFormContext();
  return (
    <>
      <input {...form.field('address')} />
      <input {...form.field('city')} />
    </>
  );
}`,
          since: '1.0.0',
        },
      ]}
      types={[
        {
          name: 'FormOptions',
          kind: 'interface',
          description: 'Configuration options for createForm and useForm.',
          properties: [
            {
              name: 'initialValues',
              type: 'T',
              description: 'Initial form values',
            },
            {
              name: 'validate',
              type: '(values: T) => Record<string, string>',
              description: 'Validation function',
              optional: true,
            },
            {
              name: 'onSubmit',
              type: '(values: T) => void | Promise<void>',
              description: 'Submit handler',
            },
            {
              name: 'validateOnChange',
              type: 'boolean',
              description: 'Validate on every change',
              optional: true,
              default: 'false',
            },
            {
              name: 'validateOnBlur',
              type: 'boolean',
              description: 'Validate on field blur',
              optional: true,
              default: 'true',
            },
          ],
        },
        {
          name: 'FormReturn',
          kind: 'interface',
          description: 'Return value of createForm with all form controls.',
          properties: [
            {
              name: 'values',
              type: 'Accessor<T>',
              description: 'Current form values',
            },
            {
              name: 'errors',
              type: 'Record<keyof T, string>',
              description: 'Current validation errors',
            },
            {
              name: 'touched',
              type: 'Record<keyof T, boolean>',
              description: 'Fields that have been touched',
            },
            {
              name: 'submitting',
              type: 'Accessor<boolean>',
              description: 'Whether form is submitting',
            },
            {
              name: 'field',
              type: '(name: keyof T) => FieldProps',
              description: 'Get props for a field',
            },
            {
              name: 'handleSubmit',
              type: '(e: Event) => void',
              description: 'Form submit handler',
            },
            {
              name: 'reset',
              type: '() => void',
              description: 'Reset form to initial values',
            },
            {
              name: 'setFieldValue',
              type: '(name: keyof T, value: any) => void',
              description: 'Set a field value programmatically',
            },
          ],
        },
        {
          name: 'ValidationSchema',
          kind: 'type',
          description: 'Schema definition for createValidator.',
          example: `type ValidationSchema<T> = {
  [K in keyof T]?: {
    required?: string | boolean;
    minLength?: [number, string];
    maxLength?: [number, string];
    min?: [number, string];
    max?: [number, string];
    pattern?: [RegExp, string];
    custom?: (value: T[K], values: T) => string | undefined;
  };
};`,
        },
      ]}
    />
  );
}
