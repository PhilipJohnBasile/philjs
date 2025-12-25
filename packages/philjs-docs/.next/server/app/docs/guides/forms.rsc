2:I[8850,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","803","static/chunks/app/docs/guides/forms/page-746eec7c83c55b8b.js"],"CodeBlock"]
5:I[7696,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","803","static/chunks/app/docs/guides/forms/page-746eec7c83c55b8b.js"],"Callout"]
8:I[6542,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","803","static/chunks/app/docs/guides/forms/page-746eec7c83c55b8b.js"],""]
9:I[6419,[],""]
a:I[8445,[],""]
b:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"Sidebar"]
c:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"docsNavigation"]
d:I[1229,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"ThemeProvider"]
e:I[8529,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"Header"]
3:T59f,import { createSignal } from 'philjs-core';

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
}4:T65b,import { createForm, required, email, minLength } from 'philjs-forms';

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
}6:T5d5,import { FileUpload } from 'philjs-ui';
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
}7:T9d4,import { createSignal, For } from 'philjs-core';

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
                <td>${(item.quantity * item.price).toFixed(2)}</td>
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
            <td>${total().toFixed(2)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      <button type="button" onClick={addItem}>
        Add Line Item
      </button>
    </form>
  );
}0:["cd22Ei08xvul0IDkb5kRy",[[["",{"children":["docs",{"children":["guides",{"children":["forms",{"children":["__PAGE__",{}]}]}]}]},"$undefined","$undefined",true],["",{"children":["docs",{"children":["guides",{"children":["forms",{"children":["__PAGE__",{},[["$L1",["$","div",null,{"className":"mdx-content","children":[["$","h1",null,{"children":"Forms Guide"}],["$","p",null,{"className":"lead text-xl text-surface-600 dark:text-surface-400","children":"PhilJS provides powerful form handling with reactive validation, server actions, and progressive enhancement out of the box."}],["$","h2",null,{"id":"basic-forms","children":"Basic Form Handling"}],["$","p",null,{"children":"Create reactive forms using signals to track form state. PhilJS forms integrate naturally with the reactivity system:"}],["$","$L2",null,{"code":"$3","language":"tsx","filename":"ContactForm.tsx"}],["$","h2",null,{"id":"philjs-forms","children":"Using philjs-forms"}],["$","p",null,{"children":["For more complex forms, the ",["$","code",null,{"children":"philjs-forms"}]," package provides a declarative API with built-in validation:"]}],["$","$L2",null,{"code":"$4","language":"tsx","filename":"SignupForm.tsx"}],["$","h2",null,{"id":"validation","children":"Validation"}],["$","p",null,{"children":"PhilJS forms support both synchronous and asynchronous validation with built-in validators and custom validation functions:"}],["$","h3",null,{"id":"built-in-validators","children":"Built-in Validators"}],["$","$L2",null,{"code":"import {\n  required,\n  email,\n  minLength,\n  maxLength,\n  pattern,\n  min,\n  max,\n  url,\n  matches,\n} from 'philjs-forms';\n\nconst validators = {\n  // Required field\n  name: [required('Name is required')],\n\n  // Email validation\n  email: [required(), email('Invalid email format')],\n\n  // Length constraints\n  username: [minLength(3), maxLength(20)],\n\n  // Regex pattern\n  phone: [pattern(/^\\d{10}$/, 'Enter 10-digit phone number')],\n\n  // Numeric range\n  age: [min(18, 'Must be 18+'), max(120)],\n\n  // URL validation\n  website: [url('Enter a valid URL')],\n\n  // Field matching (e.g., password confirmation)\n  confirmPassword: [matches('password', 'Passwords must match')],\n};","language":"typescript","filename":"validators.ts"}],["$","h3",null,{"id":"custom-validation","children":"Custom Validation"}],["$","$L2",null,{"code":"import { createValidator } from 'philjs-forms';\n\n// Synchronous custom validator\nconst noSpaces = createValidator(\n  (value: string) => !value.includes(' '),\n  'No spaces allowed'\n);\n\n// Async validator (e.g., checking username availability)\nconst usernameAvailable = createValidator(\n  async (value: string) => {\n    const res = await fetch(`/api/check-username?u=${value}`);\n    const { available } = await res.json();\n    return available;\n  },\n  'Username is already taken'\n);\n\n// Validator with dynamic message\nconst strongPassword = createValidator(\n  (value: string) => {\n    const hasUpper = /[A-Z]/.test(value);\n    const hasLower = /[a-z]/.test(value);\n    const hasNumber = /\\d/.test(value);\n    const hasSpecial = /[!@#$%^&*]/.test(value);\n    return hasUpper && hasLower && hasNumber && hasSpecial;\n  },\n  'Password must include uppercase, lowercase, number, and special character'\n);","language":"typescript","filename":"custom-validators.ts"}],["$","h2",null,{"id":"server-actions","children":"Server Actions"}],["$","p",null,{"children":"For SSR apps, use server actions to handle form submissions securely on the server:"}],["$","$L2",null,{"code":"// actions/contact.ts\n'use server';\n\nimport { z } from 'zod';\nimport { createAction } from 'philjs-forms/server';\n\nconst contactSchema = z.object({\n  name: z.string().min(1, 'Name required'),\n  email: z.string().email('Invalid email'),\n  message: z.string().min(10, 'Message too short'),\n});\n\nexport const submitContact = createAction(contactSchema, async (data) => {\n  // This runs on the server\n  await db.contacts.create({\n    data: {\n      ...data,\n      createdAt: new Date(),\n    },\n  });\n\n  // Send notification email\n  await sendEmail({\n    to: 'admin@example.com',\n    subject: 'New Contact Form',\n    body: `From: ${data.name} <${data.email}>\\n\\n${data.message}`,\n  });\n\n  return { success: true };\n});","language":"typescript","filename":"actions/contact.ts"}],["$","$L2",null,{"code":"// ContactForm.tsx\nimport { submitContact } from './actions/contact';\nimport { useAction } from 'philjs-forms';\n\nfunction ContactForm() {\n  const action = useAction(submitContact);\n\n  return (\n    <form action={action.submit}>\n      <input name=\"name\" required />\n      <input name=\"email\" type=\"email\" required />\n      <textarea name=\"message\" required />\n\n      <Show when={action.error}>\n        <div class=\"error\">{action.error.message}</div>\n      </Show>\n\n      <Show when={action.result?.success}>\n        <div class=\"success\">Message sent!</div>\n      </Show>\n\n      <button type=\"submit\" disabled={action.pending}>\n        {action.pending ? 'Sending...' : 'Send'}\n      </button>\n    </form>\n  );\n}","language":"tsx","filename":"ContactForm.tsx"}],["$","$L5",null,{"type":"info","title":"Progressive Enhancement","children":"Server actions work without JavaScript enabled. The form submits normally and the page reloads with the result. When JS is available, submissions are handled via fetch for a smoother experience."}],["$","h2",null,{"id":"file-uploads","children":"File Uploads"}],["$","p",null,{"children":["Handle file uploads with the ",["$","code",null,{"children":"FileUpload"}]," component from philjs-ui:"]}],["$","$L2",null,{"code":"$6","language":"tsx","filename":"AvatarUpload.tsx"}],["$","h2",null,{"id":"form-arrays","children":"Dynamic Form Arrays"}],["$","p",null,{"children":"Create dynamic forms with add/remove functionality for array fields:"}],["$","$L2",null,{"code":"$7","language":"tsx","filename":"InvoiceForm.tsx"}],["$","h2",null,{"id":"accessibility","children":"Form Accessibility"}],["$","$L5",null,{"type":"warning","title":"Accessibility","children":"Always include proper labels, error announcements, and keyboard navigation in your forms for accessibility compliance."}],["$","$L2",null,{"code":"function AccessibleInput({\n  name,\n  label,\n  error,\n  required,\n  ...props\n}: InputProps) {\n  const inputId = `input-${name}`;\n  const errorId = `error-${name}`;\n\n  return (\n    <div class=\"form-group\">\n      <label htmlFor={inputId}>\n        {label}\n        {required && <span aria-label=\"required\">*</span>}\n      </label>\n\n      <input\n        id={inputId}\n        name={name}\n        required={required}\n        aria-required={required}\n        aria-invalid={!!error}\n        aria-describedby={error ? errorId : undefined}\n        {...props}\n      />\n\n      <Show when={error}>\n        <span id={errorId} class=\"error\" role=\"alert\">\n          {error}\n        </span>\n      </Show>\n    </div>\n  );\n}","language":"tsx","filename":"AccessibleInput.tsx"}],["$","h2",null,{"id":"next-steps","children":"Next Steps"}],["$","div",null,{"className":"grid md:grid-cols-2 gap-4 mt-6 not-prose","children":[["$","$L8",null,{"href":"/docs/guides/state-management","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"State Management"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Advanced patterns for managing application state"}]]}],["$","$L8",null,{"href":"/docs/api/philjs-forms","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"Forms API Reference"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Complete API documentation for philjs-forms"}]]}]]}]]}],null],null],null]},[null,["$","$L9",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","guides","children","forms","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$La",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[null,["$","$L9",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","guides","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$La",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[[null,["$","div",null,{"className":"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8","children":["$","div",null,{"className":"flex gap-12","children":[["$","$Lb",null,{"sections":"$c"}],["$","main",null,{"className":"flex-1 min-w-0","children":["$","article",null,{"className":"prose prose-surface dark:prose-invert max-w-none","children":["$","$L9",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$La",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]}]}]]}]}]],null],null]},[[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/00bb994365e07be9.css","precedence":"next","crossOrigin":"$undefined"}]],["$","html",null,{"lang":"en","suppressHydrationWarning":true,"children":["$","body",null,{"className":"__variable_f367f3 __variable_3c557b font-sans antialiased","children":["$","$Ld",null,{"children":["$","div",null,{"className":"min-h-screen bg-white dark:bg-surface-950","children":[["$","$Le",null,{}],["$","$L9",null,{"parallelRouterKey":"children","segmentPath":["children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$La",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":"404"}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],"notFoundStyles":[]}]]}]}]}]}]],null],null],["$Lf",null]]]]
f:[["$","meta","0",{"name":"viewport","content":"width=device-width, initial-scale=1"}],["$","meta","1",{"charSet":"utf-8"}],["$","title","2",{"children":"Forms Guide | PhilJS"}],["$","meta","3",{"name":"description","content":"Build forms with validation, server actions, and progressive enhancement in PhilJS."}],["$","meta","4",{"name":"author","content":"PhilJS Team"}],["$","link","5",{"rel":"manifest","href":"/site.webmanifest","crossOrigin":"use-credentials"}],["$","meta","6",{"name":"keywords","content":"philjs,javascript,typescript,rust,framework,signals,reactivity,wasm"}],["$","meta","7",{"property":"og:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","8",{"property":"og:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","9",{"property":"og:url","content":"https://philjs.dev/"}],["$","meta","10",{"property":"og:site_name","content":"PhilJS"}],["$","meta","11",{"property":"og:locale","content":"en_US"}],["$","meta","12",{"property":"og:image","content":"https://philjs.dev/og-image.png"}],["$","meta","13",{"property":"og:image:width","content":"1200"}],["$","meta","14",{"property":"og:image:height","content":"630"}],["$","meta","15",{"property":"og:image:alt","content":"PhilJS Framework"}],["$","meta","16",{"property":"og:type","content":"website"}],["$","meta","17",{"name":"twitter:card","content":"summary_large_image"}],["$","meta","18",{"name":"twitter:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","19",{"name":"twitter:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","20",{"name":"twitter:image","content":"https://philjs.dev/og-image.png"}],["$","link","21",{"rel":"shortcut icon","href":"/favicon-16x16.png"}],["$","link","22",{"rel":"icon","href":"/favicon.ico"}],["$","link","23",{"rel":"apple-touch-icon","href":"/apple-touch-icon.png"}]]
1:null
