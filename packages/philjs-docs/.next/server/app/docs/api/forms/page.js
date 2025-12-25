(()=>{var e={};e.id=7883,e.ids=[7883],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},283:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>a.a,__next_app__:()=>p,originalPathname:()=>m,pages:()=>c,routeModule:()=>u,tree:()=>d}),r(3696),r(2108),r(4001),r(1305);var i=r(3545),s=r(5947),o=r(9761),a=r.n(o),n=r(4798),l={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>n[e]);r.d(t,l);let d=["",{children:["docs",{children:["api",{children:["forms",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,3696)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\api\\forms\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(r.bind(r,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(r.bind(r,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,1305,23)),"next/dist/client/components/not-found-error"]}],c=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\api\\forms\\page.tsx"],m="/docs/api/forms/page",p={require:r,loadChunk:()=>Promise.resolve()},u=new i.AppPageRouteModule({definition:{kind:s.x.APP_PAGE,page:"/docs/api/forms/page",pathname:"/docs/api/forms",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},5356:(e,t,r)=>{Promise.resolve().then(r.bind(r,2015))},4444:(e,t,r)=>{Promise.resolve().then(r.bind(r,5173))},5173:(e,t,r)=>{"use strict";r.d(t,{Sidebar:()=>c,docsNavigation:()=>d});var i=r(6741),s=r(8972),o=r(47),a=r(7678),n=r(3178),l=r(5280);let d=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function c({sections:e}){let t=(0,o.usePathname)(),[r,d]=(0,l.useState)(()=>{let r=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(r?[r.title]:[e[0]?.title])}),c=e=>{d(t=>{let r=new Set(t);return r.has(e)?r.delete(e):r.add(e),r})};return i.jsx("nav",{className:"w-64 flex-shrink-0",children:i.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:i.jsx("ul",{className:"space-y-6",children:e.map(e=>{let o=r.has(e.title),l=e.links.some(e=>t===e.href);return(0,i.jsxs)("li",{children:[(0,i.jsxs)("button",{onClick:()=>c(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,i.jsx(n.Z,{className:(0,a.Z)("w-4 h-4 transition-transform",o&&"rotate-90")})]}),(o||l)&&i.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let r=t===e.href;return i.jsx("li",{children:i.jsx(s.default,{href:e.href,className:(0,a.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",r?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},3696:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>a,metadata:()=>o});var i=r(9015),s=r(7309);let o={title:"philjs-forms API Reference",description:"Complete API documentation for philjs-forms - form handling, validation, and server actions."};function a(){return i.jsx(s.q,{title:"philjs-forms",description:"Form handling primitives with validation, error handling, and server actions support.",sourceLink:"https://github.com/philjs/philjs/tree/main/packages/philjs-forms",methods:[{name:"createForm",signature:"function createForm<T>(options: FormOptions<T>): FormReturn<T>",description:"Creates a form controller with validation, submission handling, and field management.",parameters:[{name:"options",type:"FormOptions<T>",description:"Configuration object for the form"}],returns:{type:"FormReturn<T>",description:"Form controller with fields, handlers, and state"},example:`const form = createForm({
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
</form>`,since:"1.0.0"},{name:"useForm",signature:"function useForm<T>(options: FormOptions<T>): FormReturn<T>",description:"Hook version of createForm for use within components.",parameters:[{name:"options",type:"FormOptions<T>",description:"Configuration object for the form"}],returns:{type:"FormReturn<T>",description:"Form controller with fields, handlers, and state"},example:`function LoginForm() {
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
}`,since:"1.0.0"},{name:"createFormField",signature:"function createFormField<T>(name: string, options?: FieldOptions<T>): FormField<T>",description:"Creates an individual form field with its own validation and state.",parameters:[{name:"name",type:"string",description:"Field name for form data"},{name:"options",type:"FieldOptions<T>",description:"Field configuration",optional:!0}],returns:{type:"FormField<T>",description:"Field controller with value, error, and handlers"},example:`const emailField = createFormField('email', {
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
)}`,since:"1.0.0"},{name:"useServerAction",signature:"function useServerAction<T, R>(action: (data: T) => Promise<R>): ServerActionReturn<T, R>",description:"Wraps a server action with pending state and error handling.",parameters:[{name:"action",type:"(data: T) => Promise<R>",description:"Server action function"}],returns:{type:"ServerActionReturn<T, R>",description:"Action wrapper with execute, pending, and error state"},example:`// server/actions.ts
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
}`,since:"1.0.0"},{name:"createValidator",signature:"function createValidator<T>(schema: ValidationSchema<T>): Validator<T>",description:"Creates a reusable validator from a schema definition.",parameters:[{name:"schema",type:"ValidationSchema<T>",description:"Validation schema object"}],returns:{type:"Validator<T>",description:"Validator function"},example:`const userValidator = createValidator({
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
});`,since:"1.0.0"},{name:"FormProvider",signature:"function FormProvider<T>(props: { form: FormReturn<T>; children: JSX.Element }): JSX.Element",description:"Provides form context to child components for nested form fields.",parameters:[{name:"form",type:"FormReturn<T>",description:"Form controller instance"},{name:"children",type:"JSX.Element",description:"Child components"}],example:`function CheckoutForm() {
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
}`,since:"1.0.0"}],types:[{name:"FormOptions",kind:"interface",description:"Configuration options for createForm and useForm.",properties:[{name:"initialValues",type:"T",description:"Initial form values"},{name:"validate",type:"(values: T) => Record<string, string>",description:"Validation function",optional:!0},{name:"onSubmit",type:"(values: T) => void | Promise<void>",description:"Submit handler"},{name:"validateOnChange",type:"boolean",description:"Validate on every change",optional:!0,default:"false"},{name:"validateOnBlur",type:"boolean",description:"Validate on field blur",optional:!0,default:"true"}]},{name:"FormReturn",kind:"interface",description:"Return value of createForm with all form controls.",properties:[{name:"values",type:"Accessor<T>",description:"Current form values"},{name:"errors",type:"Record<keyof T, string>",description:"Current validation errors"},{name:"touched",type:"Record<keyof T, boolean>",description:"Fields that have been touched"},{name:"submitting",type:"Accessor<boolean>",description:"Whether form is submitting"},{name:"field",type:"(name: keyof T) => FieldProps",description:"Get props for a field"},{name:"handleSubmit",type:"(e: Event) => void",description:"Form submit handler"},{name:"reset",type:"() => void",description:"Reset form to initial values"},{name:"setFieldValue",type:"(name: keyof T, value: any) => void",description:"Set a field value programmatically"}]},{name:"ValidationSchema",kind:"type",description:"Schema definition for createValidator.",example:`type ValidationSchema<T> = {
  [K in keyof T]?: {
    required?: string | boolean;
    minLength?: [number, string];
    maxLength?: [number, string];
    min?: [number, string];
    max?: [number, string];
    pattern?: [RegExp, string];
    custom?: (value: T[K], values: T) => string | undefined;
  };
};`}]})}},2108:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>n});var i=r(9015),s=r(1471);let o=(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),a=(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function n({children:e}){return i.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,i.jsxs)("div",{className:"flex gap-12",children:[i.jsx(a,{sections:o}),i.jsx("main",{className:"flex-1 min-w-0",children:i.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),i=t.X(0,[732,6314,9858],()=>r(283));module.exports=i})();