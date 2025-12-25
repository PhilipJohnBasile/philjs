(()=>{var e={};e.id=803,e.ids=[803],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},2476:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>o.a,__next_app__:()=>u,originalPathname:()=>m,pages:()=>c,routeModule:()=>p,tree:()=>d}),r(2664),r(2108),r(4001),r(1305);var s=r(3545),i=r(5947),a=r(9761),o=r.n(a),n=r(4798),l={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>n[e]);r.d(t,l);let d=["",{children:["docs",{children:["guides",{children:["forms",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,2664)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\guides\\forms\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(r.bind(r,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(r.bind(r,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,1305,23)),"next/dist/client/components/not-found-error"]}],c=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\guides\\forms\\page.tsx"],m="/docs/guides/forms/page",u={require:r,loadChunk:()=>Promise.resolve()},p=new s.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/docs/guides/forms/page",pathname:"/docs/guides/forms",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},7656:(e,t,r)=>{Promise.resolve().then(r.t.bind(r,5505,23)),Promise.resolve().then(r.bind(r,2015)),Promise.resolve().then(r.bind(r,306))},4444:(e,t,r)=>{Promise.resolve().then(r.bind(r,5173))},5173:(e,t,r)=>{"use strict";r.d(t,{Sidebar:()=>c,docsNavigation:()=>d});var s=r(6741),i=r(8972),a=r(47),o=r(7678),n=r(3178),l=r(5280);let d=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function c({sections:e}){let t=(0,a.usePathname)(),[r,d]=(0,l.useState)(()=>{let r=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(r?[r.title]:[e[0]?.title])}),c=e=>{d(t=>{let r=new Set(t);return r.has(e)?r.delete(e):r.add(e),r})};return s.jsx("nav",{className:"w-64 flex-shrink-0",children:s.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:s.jsx("ul",{className:"space-y-6",children:e.map(e=>{let a=r.has(e.title),l=e.links.some(e=>t===e.href);return(0,s.jsxs)("li",{children:[(0,s.jsxs)("button",{onClick:()=>c(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,s.jsx(n.Z,{className:(0,o.Z)("w-4 h-4 transition-transform",a&&"rotate-90")})]}),(a||l)&&s.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let r=t===e.href;return s.jsx("li",{children:s.jsx(i.default,{href:e.href,className:(0,o.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",r?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8951:(e,t,r)=>{"use strict";r.d(t,{default:()=>i.a});var s=r(7654),i=r.n(s)},7654:(e,t,r)=>{"use strict";let{createProxy:s}=r(1471);e.exports=s("C:\\Users\\Phili\\Git\\philjs\\node_modules\\.pnpm\\next@14.2.35_@opentelemetry+api@1.9.0_@playwright+test@1.55.1_react-dom@18.3.1_react@18.3.1__react@18.3.1\\node_modules\\next\\dist\\client\\link.js")},2664:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>l,metadata:()=>n});var s=r(9015),i=r(3288),a=r(7309),o=r(8951);let n={title:"Forms Guide",description:"Build forms with validation, server actions, and progressive enhancement in PhilJS."};function l(){return(0,s.jsxs)("div",{className:"mdx-content",children:[s.jsx("h1",{children:"Forms Guide"}),s.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"PhilJS provides powerful form handling with reactive validation, server actions, and progressive enhancement out of the box."}),s.jsx("h2",{id:"basic-forms",children:"Basic Form Handling"}),s.jsx("p",{children:"Create reactive forms using signals to track form state. PhilJS forms integrate naturally with the reactivity system:"}),s.jsx(i.dn,{code:`import { createSignal } from 'philjs-core';

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
}`,language:"tsx",filename:"ContactForm.tsx"}),s.jsx("h2",{id:"philjs-forms",children:"Using philjs-forms"}),(0,s.jsxs)("p",{children:["For more complex forms, the ",s.jsx("code",{children:"philjs-forms"})," package provides a declarative API with built-in validation:"]}),s.jsx(i.dn,{code:`import { createForm, required, email, minLength } from 'philjs-forms';

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
}`,language:"tsx",filename:"SignupForm.tsx"}),s.jsx("h2",{id:"validation",children:"Validation"}),s.jsx("p",{children:"PhilJS forms support both synchronous and asynchronous validation with built-in validators and custom validation functions:"}),s.jsx("h3",{id:"built-in-validators",children:"Built-in Validators"}),s.jsx(i.dn,{code:`import {
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
};`,language:"typescript",filename:"validators.ts"}),s.jsx("h3",{id:"custom-validation",children:"Custom Validation"}),s.jsx(i.dn,{code:`import { createValidator } from 'philjs-forms';

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
);`,language:"typescript",filename:"custom-validators.ts"}),s.jsx("h2",{id:"server-actions",children:"Server Actions"}),s.jsx("p",{children:"For SSR apps, use server actions to handle form submissions securely on the server:"}),s.jsx(i.dn,{code:`// actions/contact.ts
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
});`,language:"typescript",filename:"actions/contact.ts"}),s.jsx(i.dn,{code:`// ContactForm.tsx
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
}`,language:"tsx",filename:"ContactForm.tsx"}),s.jsx(a.U,{type:"info",title:"Progressive Enhancement",children:"Server actions work without JavaScript enabled. The form submits normally and the page reloads with the result. When JS is available, submissions are handled via fetch for a smoother experience."}),s.jsx("h2",{id:"file-uploads",children:"File Uploads"}),(0,s.jsxs)("p",{children:["Handle file uploads with the ",s.jsx("code",{children:"FileUpload"})," component from philjs-ui:"]}),s.jsx(i.dn,{code:`import { FileUpload } from 'philjs-ui';
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
}`,language:"tsx",filename:"AvatarUpload.tsx"}),s.jsx("h2",{id:"form-arrays",children:"Dynamic Form Arrays"}),s.jsx("p",{children:"Create dynamic forms with add/remove functionality for array fields:"}),s.jsx(i.dn,{code:`import { createSignal, For } from 'philjs-core';

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
}`,language:"tsx",filename:"InvoiceForm.tsx"}),s.jsx("h2",{id:"accessibility",children:"Form Accessibility"}),s.jsx(a.U,{type:"warning",title:"Accessibility",children:"Always include proper labels, error announcements, and keyboard navigation in your forms for accessibility compliance."}),s.jsx(i.dn,{code:`function AccessibleInput({
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
}`,language:"tsx",filename:"AccessibleInput.tsx"}),s.jsx("h2",{id:"next-steps",children:"Next Steps"}),(0,s.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,s.jsxs)(o.default,{href:"/docs/guides/state-management",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[s.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"State Management"}),s.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Advanced patterns for managing application state"})]}),(0,s.jsxs)(o.default,{href:"/docs/api/philjs-forms",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[s.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Forms API Reference"}),s.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Complete API documentation for philjs-forms"})]})]})]})}},2108:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>n});var s=r(9015),i=r(1471);let a=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),o=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function n({children:e}){return s.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,s.jsxs)("div",{className:"flex gap-12",children:[s.jsx(o,{sections:a}),s.jsx("main",{className:"flex-1 min-w-0",children:s.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}},3288:(e,t,r)=>{"use strict";r.d(t,{dn:()=>i,oI:()=>a});var s=r(1471);let i=(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#CodeBlock`);(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#InlineCode`);let a=(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#Terminal`)}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[732,6314,9858],()=>r(2476));module.exports=s})();