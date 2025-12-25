import { Metadata } from 'next';
import { CodeBlock } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Forms Guide',
  description: 'Build forms with validation, server actions, and progressive enhancement in PhilJS.',
};

export default function FormsGuidePage() {
  return (
    <div className="mdx-content">
      <h1>Forms Guide</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        PhilJS provides powerful form handling with reactive validation, server actions,
        and progressive enhancement out of the box.
      </p>

      <h2 id="basic-forms">Basic Form Handling</h2>

      <p>
        Create reactive forms using signals to track form state. PhilJS forms integrate
        naturally with the reactivity system:
      </p>

      <CodeBlock
        code={`import { createSignal } from 'philjs-core';

function ContactForm() {
  const [name, setName] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [message, setMessage] = createSignal('');
  const [submitting, setSubmitting] = createSignal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name(),
          email: email(),
          message: message(),
        }),
      });
      // Reset form
      setName('');
      setEmail('');
      setMessage('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name()}
        onInput={(e) => setName(e.target.value)}
        placeholder="Your name"
        required
      />
      <input
        type="email"
        value={email()}
        onInput={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
      />
      <textarea
        value={message()}
        onInput={(e) => setMessage(e.target.value)}
        placeholder="Your message"
        required
      />
      <button type="submit" disabled={submitting()}>
        {submitting() ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}`}
        language="tsx"
        filename="ContactForm.tsx"
      />

      <h2 id="philjs-forms">Using philjs-forms</h2>

      <p>
        For more complex forms, the <code>philjs-forms</code> package provides a declarative
        API with built-in validation:
      </p>

      <CodeBlock
        code={`import { createForm, required, email, minLength } from 'philjs-forms';

function SignupForm() {
  const form = createForm({
    fields: {
      username: {
        initial: '',
        validate: [
          required('Username is required'),
          minLength(3, 'Username must be at least 3 characters'),
        ],
      },
      email: {
        initial: '',
        validate: [
          required('Email is required'),
          email('Please enter a valid email'),
        ],
      },
      password: {
        initial: '',
        validate: [
          required('Password is required'),
          minLength(8, 'Password must be at least 8 characters'),
        ],
      },
    },
    onSubmit: async (values) => {
      await createUser(values);
    },
  });

  return (
    <form use:form>
      <div>
        <label>Username</label>
        <input type="text" name="username" />
        <Show when={form.errors.username}>
          <span class="error">{form.errors.username}</span>
        </Show>
      </div>

      <div>
        <label>Email</label>
        <input type="email" name="email" />
        <Show when={form.errors.email}>
          <span class="error">{form.errors.email}</span>
        </Show>
      </div>

      <div>
        <label>Password</label>
        <input type="password" name="password" />
        <Show when={form.errors.password}>
          <span class="error">{form.errors.password}</span>
        </Show>
      </div>

      <button type="submit" disabled={form.submitting || !form.valid}>
        {form.submitting ? 'Creating account...' : 'Sign Up'}
      </button>
    </form>
  );
}`}
        language="tsx"
        filename="SignupForm.tsx"
      />

      <h2 id="validation">Validation</h2>

      <p>
        PhilJS forms support both synchronous and asynchronous validation with built-in
        validators and custom validation functions:
      </p>

      <h3 id="built-in-validators">Built-in Validators</h3>

      <CodeBlock
        code={`import {
  required,
  email,
  minLength,
  maxLength,
  pattern,
  min,
  max,
  url,
  matches,
} from 'philjs-forms';

const validators = {
  // Required field
  name: [required('Name is required')],

  // Email validation
  email: [required(), email('Invalid email format')],

  // Length constraints
  username: [minLength(3), maxLength(20)],

  // Regex pattern
  phone: [pattern(/^\\d{10}$/, 'Enter 10-digit phone number')],

  // Numeric range
  age: [min(18, 'Must be 18+'), max(120)],

  // URL validation
  website: [url('Enter a valid URL')],

  // Field matching (e.g., password confirmation)
  confirmPassword: [matches('password', 'Passwords must match')],
};`}
        language="typescript"
        filename="validators.ts"
      />

      <h3 id="custom-validation">Custom Validation</h3>

      <CodeBlock
        code={`import { createValidator } from 'philjs-forms';

// Synchronous custom validator
const noSpaces = createValidator(
  (value: string) => !value.includes(' '),
  'No spaces allowed'
);

// Async validator (e.g., checking username availability)
const usernameAvailable = createValidator(
  async (value: string) => {
    const res = await fetch(\`/api/check-username?u=\${value}\`);
    const { available } = await res.json();
    return available;
  },
  'Username is already taken'
);

// Validator with dynamic message
const strongPassword = createValidator(
  (value: string) => {
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasNumber = /\\d/.test(value);
    const hasSpecial = /[!@#$%^&*]/.test(value);
    return hasUpper && hasLower && hasNumber && hasSpecial;
  },
  'Password must include uppercase, lowercase, number, and special character'
);`}
        language="typescript"
        filename="custom-validators.ts"
      />

      <h2 id="server-actions">Server Actions</h2>

      <p>
        For SSR apps, use server actions to handle form submissions securely on the server:
      </p>

      <CodeBlock
        code={`// actions/contact.ts
'use server';

import { z } from 'zod';
import { createAction } from 'philjs-forms/server';

const contactSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
  message: z.string().min(10, 'Message too short'),
});

export const submitContact = createAction(contactSchema, async (data) => {
  // This runs on the server
  await db.contacts.create({
    data: {
      ...data,
      createdAt: new Date(),
    },
  });

  // Send notification email
  await sendEmail({
    to: 'admin@example.com',
    subject: 'New Contact Form',
    body: \`From: \${data.name} <\${data.email}>\\n\\n\${data.message}\`,
  });

  return { success: true };
});`}
        language="typescript"
        filename="actions/contact.ts"
      />

      <CodeBlock
        code={`// ContactForm.tsx
import { submitContact } from './actions/contact';
import { useAction } from 'philjs-forms';

function ContactForm() {
  const action = useAction(submitContact);

  return (
    <form action={action.submit}>
      <input name="name" required />
      <input name="email" type="email" required />
      <textarea name="message" required />

      <Show when={action.error}>
        <div class="error">{action.error.message}</div>
      </Show>

      <Show when={action.result?.success}>
        <div class="success">Message sent!</div>
      </Show>

      <button type="submit" disabled={action.pending}>
        {action.pending ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}`}
        language="tsx"
        filename="ContactForm.tsx"
      />

      <Callout type="info" title="Progressive Enhancement">
        Server actions work without JavaScript enabled. The form submits normally and
        the page reloads with the result. When JS is available, submissions are handled
        via fetch for a smoother experience.
      </Callout>

      <h2 id="file-uploads">File Uploads</h2>

      <p>
        Handle file uploads with the <code>FileUpload</code> component from philjs-ui:
      </p>

      <CodeBlock
        code={`import { FileUpload } from 'philjs-ui';
import { createSignal } from 'philjs-core';

function AvatarUpload() {
  const [file, setFile] = createSignal<File | null>(null);
  const [preview, setPreview] = createSignal<string>('');
  const [uploading, setUploading] = createSignal(false);

  const handleSelect = (files: File[]) => {
    const selected = files[0];
    setFile(selected);

    // Create preview URL
    const url = URL.createObjectURL(selected);
    setPreview(url);
  };

  const handleUpload = async () => {
    const f = file();
    if (!f) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', f);

    try {
      const res = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData,
      });
      const { url } = await res.json();
      // Update user profile with new avatar URL
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <FileUpload
        accept="image/*"
        maxSize={5 * 1024 * 1024} // 5MB
        onSelect={handleSelect}
      >
        <Show
          when={preview()}
          fallback={<span>Drop image or click to select</span>}
        >
          <img src={preview()} alt="Preview" class="avatar-preview" />
        </Show>
      </FileUpload>

      <Show when={file()}>
        <button onClick={handleUpload} disabled={uploading()}>
          {uploading() ? 'Uploading...' : 'Upload Avatar'}
        </button>
      </Show>
    </div>
  );
}`}
        language="tsx"
        filename="AvatarUpload.tsx"
      />

      <h2 id="form-arrays">Dynamic Form Arrays</h2>

      <p>
        Create dynamic forms with add/remove functionality for array fields:
      </p>

      <CodeBlock
        code={`import { createSignal, For } from 'philjs-core';

interface LineItem {
  id: number;
  description: string;
  quantity: number;
  price: number;
}

function InvoiceForm() {
  let nextId = 1;
  const [items, setItems] = createSignal<LineItem[]>([
    { id: nextId++, description: '', quantity: 1, price: 0 },
  ]);

  const addItem = () => {
    setItems([...items(), {
      id: nextId++,
      description: '',
      quantity: 1,
      price: 0
    }]);
  };

  const removeItem = (id: number) => {
    setItems(items().filter(item => item.id !== id));
  };

  const updateItem = (id: number, field: keyof LineItem, value: any) => {
    setItems(items().map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const total = () => items().reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  return (
    <form>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <For each={items()}>
            {(item) => (
              <tr>
                <td>
                  <input
                    value={item.description}
                    onInput={(e) => updateItem(item.id, 'description', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={item.quantity}
                    onInput={(e) => updateItem(item.id, 'quantity', +e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    value={item.price}
                    onInput={(e) => updateItem(item.id, 'price', +e.target.value)}
                  />
                </td>
                <td>\${(item.quantity * item.price).toFixed(2)}</td>
                <td>
                  <button type="button" onClick={() => removeItem(item.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            )}
          </For>
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>Total</td>
            <td>\${total().toFixed(2)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      <button type="button" onClick={addItem}>
        Add Line Item
      </button>
    </form>
  );
}`}
        language="tsx"
        filename="InvoiceForm.tsx"
      />

      <h2 id="accessibility">Form Accessibility</h2>

      <Callout type="warning" title="Accessibility">
        Always include proper labels, error announcements, and keyboard navigation
        in your forms for accessibility compliance.
      </Callout>

      <CodeBlock
        code={`function AccessibleInput({
  name,
  label,
  error,
  required,
  ...props
}: InputProps) {
  const inputId = \`input-\${name}\`;
  const errorId = \`error-\${name}\`;

  return (
    <div class="form-group">
      <label htmlFor={inputId}>
        {label}
        {required && <span aria-label="required">*</span>}
      </label>

      <input
        id={inputId}
        name={name}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />

      <Show when={error}>
        <span id={errorId} class="error" role="alert">
          {error}
        </span>
      </Show>
    </div>
  );
}`}
        language="tsx"
        filename="AccessibleInput.tsx"
      />

      <h2 id="next-steps">Next Steps</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/guides/state-management"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">State Management</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Advanced patterns for managing application state
          </p>
        </Link>

        <Link
          href="/docs/api/philjs-forms"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Forms API Reference</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Complete API documentation for philjs-forms
          </p>
        </Link>
      </div>
    </div>
  );
}
