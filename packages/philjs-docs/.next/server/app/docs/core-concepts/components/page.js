(()=>{var e={};e.id=7486,e.ids=[7486],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},1542:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>i.a,__next_app__:()=>u,originalPathname:()=>p,pages:()=>d,routeModule:()=>h,tree:()=>l}),r(3086),r(2108),r(4001),r(1305);var s=r(3545),n=r(5947),o=r(9761),i=r.n(o),a=r(4798),c={};for(let e in a)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(c[e]=()=>a[e]);r.d(t,c);let l=["",{children:["docs",{children:["core-concepts",{children:["components",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,3086)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\core-concepts\\components\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(r.bind(r,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(r.bind(r,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,1305,23)),"next/dist/client/components/not-found-error"]}],d=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\core-concepts\\components\\page.tsx"],p="/docs/core-concepts/components/page",u={require:r,loadChunk:()=>Promise.resolve()},h=new s.AppPageRouteModule({definition:{kind:n.x.APP_PAGE,page:"/docs/core-concepts/components/page",pathname:"/docs/core-concepts/components",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:l}})},7656:(e,t,r)=>{Promise.resolve().then(r.t.bind(r,5505,23)),Promise.resolve().then(r.bind(r,2015)),Promise.resolve().then(r.bind(r,306))},4444:(e,t,r)=>{Promise.resolve().then(r.bind(r,5173))},5173:(e,t,r)=>{"use strict";r.d(t,{Sidebar:()=>d,docsNavigation:()=>l});var s=r(6741),n=r(8972),o=r(47),i=r(7678),a=r(3178),c=r(5280);let l=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function d({sections:e}){let t=(0,o.usePathname)(),[r,l]=(0,c.useState)(()=>{let r=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(r?[r.title]:[e[0]?.title])}),d=e=>{l(t=>{let r=new Set(t);return r.has(e)?r.delete(e):r.add(e),r})};return s.jsx("nav",{className:"w-64 flex-shrink-0",children:s.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:s.jsx("ul",{className:"space-y-6",children:e.map(e=>{let o=r.has(e.title),c=e.links.some(e=>t===e.href);return(0,s.jsxs)("li",{children:[(0,s.jsxs)("button",{onClick:()=>d(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,s.jsx(a.Z,{className:(0,i.Z)("w-4 h-4 transition-transform",o&&"rotate-90")})]}),(o||c)&&s.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let r=t===e.href;return s.jsx("li",{children:s.jsx(n.default,{href:e.href,className:(0,i.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",r?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8951:(e,t,r)=>{"use strict";r.d(t,{default:()=>n.a});var s=r(7654),n=r.n(s)},7654:(e,t,r)=>{"use strict";let{createProxy:s}=r(1471);e.exports=s("C:\\Users\\Phili\\Git\\philjs\\node_modules\\.pnpm\\next@14.2.35_@opentelemetry+api@1.9.0_@playwright+test@1.55.1_react-dom@18.3.1_react@18.3.1__react@18.3.1\\node_modules\\next\\dist\\client\\link.js")},3086:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>c,metadata:()=>a});var s=r(9015),n=r(3288),o=r(7309),i=r(8951);let a={title:"Components - Core Concepts",description:"Learn how to create reusable, composable components in PhilJS with props, children, and lifecycle management."};function c(){return(0,s.jsxs)("div",{className:"mdx-content",children:[s.jsx("h1",{children:"Components"}),s.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"Components are the building blocks of PhilJS applications. Learn how to create reusable, composable UI elements."}),s.jsx("h2",{id:"basic-components",children:"Basic Components"}),s.jsx("p",{children:"In PhilJS, components are just functions that return JSX:"}),s.jsx(n.dn,{code:`function Greeting() {
  return <h1>Hello, World!</h1>;
}

// Usage
function App() {
  return (
    <div>
      <Greeting />
    </div>
  );
}`,language:"typescript"}),s.jsx("h2",{id:"props",children:"Props"}),s.jsx("p",{children:"Pass data to components using props:"}),s.jsx(n.dn,{code:`interface GreetingProps {
  name: string;
  age?: number;
}

function Greeting(props: GreetingProps) {
  return (
    <div>
      <h1>Hello, {props.name}!</h1>
      {props.age && <p>You are {props.age} years old.</p>}
    </div>
  );
}

// Usage
<Greeting name="Alice" age={30} />`,language:"typescript"}),s.jsx(o.U,{type:"info",title:"Props are Reactive",children:"Props automatically update when their values change. You don't need to wrap them in signals."}),s.jsx("h3",{children:"Destructuring Props"}),s.jsx(n.dn,{code:`// Direct destructuring
function Greeting({ name, age }: GreetingProps) {
  return (
    <div>
      <h1>Hello, {name}!</h1>
      {age && <p>You are {age} years old.</p>}
    </div>
  );
}

// With defaults
function Button({ label = 'Click me', onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}`,language:"typescript"}),(0,s.jsxs)(o.U,{type:"warning",title:"Destructuring Breaks Reactivity",children:["Destructuring props early can break reactivity. If you need reactive props, destructure them inside your JSX or use ",s.jsx("code",{children:"props.value"})," directly."]}),s.jsx("h2",{id:"children",children:"Children"}),s.jsx(n.dn,{code:`import { JSX } from 'philjs-core';

interface CardProps {
  title: string;
  children: JSX.Element;
}

function Card(props: CardProps) {
  return (
    <div className="card">
      <h2>{props.title}</h2>
      <div className="card-content">
        {props.children}
      </div>
    </div>
  );
}

// Usage
<Card title="Welcome">
  <p>This is the card content</p>
  <button>Click me</button>
</Card>`,language:"typescript"}),s.jsx("h3",{children:"Render Props Pattern"}),s.jsx(n.dn,{code:`interface DataListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => JSX.Element;
}

function DataList<T>(props: DataListProps<T>) {
  return (
    <ul>
      <For each={props.data}>
        {(item, index) => (
          <li>{props.renderItem(item, index())}</li>
        )}
      </For>
    </ul>
  );
}

// Usage
<DataList
  data={users()}
  renderItem={(user, idx) => (
    <div>
      {idx + 1}. {user.name}
    </div>
  )}
/>`,language:"typescript"}),s.jsx("h2",{id:"component-state",children:"Component State"}),s.jsx(n.dn,{code:`function Counter() {
  const [count, setCount] = createSignal(0);

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
    </div>
  );
}

// Complex state
function TodoList() {
  const [todos, setTodos] = createSignal<Todo[]>([]);
  const [filter, setFilter] = createSignal<'all' | 'active'>('all');

  const filteredTodos = createMemo(() =>
    filter() === 'all'
      ? todos()
      : todos().filter(t => !t.completed)
  );

  return (
    <div>
      {/* ... */}
    </div>
  );
}`,language:"typescript"}),s.jsx("h2",{id:"lifecycle",children:"Lifecycle"}),s.jsx("h3",{children:"onMount"}),s.jsx(n.dn,{code:`import { onMount } from 'philjs-core';

function DataFetcher() {
  const [data, setData] = createSignal(null);

  onMount(async () => {
    const response = await fetch('/api/data');
    const json = await response.json();
    setData(json);
  });

  return <div>{data() ? JSON.stringify(data()) : 'Loading...'}</div>;
}`,language:"typescript"}),s.jsx("h3",{children:"onCleanup"}),s.jsx(n.dn,{code:`import { onMount, onCleanup } from 'philjs-core';

function Timer() {
  const [time, setTime] = createSignal(0);

  onMount(() => {
    const interval = setInterval(() => {
      setTime(t => t + 1);
    }, 1000);

    // Cleanup function
    onCleanup(() => {
      clearInterval(interval);
    });
  });

  return <div>Time: {time()}s</div>;
}`,language:"typescript"}),s.jsx("h2",{id:"refs",children:"Refs"}),s.jsx("p",{children:"Access DOM elements directly using refs:"}),s.jsx(n.dn,{code:`function FocusInput() {
  let inputRef: HTMLInputElement | undefined;

  const focus = () => {
    inputRef?.focus();
  };

  return (
    <div>
      <input ref={inputRef} type="text" />
      <button onClick={focus}>Focus Input</button>
    </div>
  );
}

// With callback ref
function ScrollToBottom() {
  const handleRef = (el: HTMLDivElement) => {
    el.scrollTop = el.scrollHeight;
  };

  return <div ref={handleRef}>{/* content */}</div>;
}`,language:"typescript"}),s.jsx("h2",{id:"conditional-rendering",children:"Conditional Rendering"}),s.jsx("h3",{children:"Show Component"}),s.jsx(n.dn,{code:`import { Show } from 'philjs-core';

function UserProfile() {
  const [user, setUser] = createSignal<User | null>(null);

  return (
    <Show
      when={user()}
      fallback={<p>Loading...</p>}
    >
      {(userData) => (
        <div>
          <h1>{userData.name}</h1>
          <p>{userData.email}</p>
        </div>
      )}
    </Show>
  );
}`,language:"typescript"}),s.jsx("h3",{children:"Switch/Match Component"}),s.jsx(n.dn,{code:`import { Switch, Match } from 'philjs-core';

function StatusIndicator() {
  const [status, setStatus] = createSignal<'loading' | 'success' | 'error'>('loading');

  return (
    <Switch fallback={<p>Unknown status</p>}>
      <Match when={status() === 'loading'}>
        <Spinner />
      </Match>
      <Match when={status() === 'success'}>
        <SuccessMessage />
      </Match>
      <Match when={status() === 'error'}>
        <ErrorMessage />
      </Match>
    </Switch>
  );
}`,language:"typescript"}),s.jsx("h2",{id:"lists",children:"Rendering Lists"}),s.jsx("h3",{children:"For Component"}),s.jsx(n.dn,{code:`import { For } from 'philjs-core';

function TodoList() {
  const [todos, setTodos] = createSignal<Todo[]>([]);

  return (
    <ul>
      <For each={todos()}>
        {(todo, index) => (
          <li>
            {index() + 1}. {todo.text}
          </li>
        )}
      </For>
    </ul>
  );
}`,language:"typescript"}),(0,s.jsxs)(o.U,{type:"info",title:"Why Use For?",children:["The ",s.jsx("code",{children:"For"})," component is optimized for keyed lists. It only re-renders items that change, unlike ",s.jsx("code",{children:"map()"})," which re-renders everything."]}),s.jsx("h3",{children:"Index Component"}),s.jsx(n.dn,{code:`import { Index } from 'philjs-core';

// Use Index when items are primitives and order matters
function ColorList() {
  const [colors, setColors] = createSignal(['red', 'green', 'blue']);

  return (
    <ul>
      <Index each={colors()}>
        {(color, index) => (
          <li style={{ color: color() }}>
            {index}: {color()}
          </li>
        )}
      </Index>
    </ul>
  );
}`,language:"typescript"}),s.jsx("h2",{id:"composition",children:"Component Composition"}),s.jsx("h3",{children:"Higher-Order Components"}),s.jsx(n.dn,{code:`function withLoading<P extends object>(
  Component: (props: P) => JSX.Element
) {
  return (props: P & { loading: boolean }) => {
    return (
      <Show
        when={!props.loading}
        fallback={<Spinner />}
      >
        <Component {...props} />
      </Show>
    );
  };
}

// Usage
const UserProfileWithLoading = withLoading(UserProfile);
<UserProfileWithLoading user={user()} loading={isLoading()} />`,language:"typescript"}),s.jsx("h3",{children:"Slots Pattern"}),s.jsx(n.dn,{code:`interface LayoutProps {
  header: JSX.Element;
  sidebar: JSX.Element;
  children: JSX.Element;
}

function Layout(props: LayoutProps) {
  return (
    <div className="layout">
      <header>{props.header}</header>
      <aside>{props.sidebar}</aside>
      <main>{props.children}</main>
    </div>
  );
}

// Usage
<Layout
  header={<Header />}
  sidebar={<Sidebar />}
>
  <MainContent />
</Layout>`,language:"typescript"}),s.jsx("h2",{id:"context",children:"Context"}),s.jsx(n.dn,{code:`import { createContext, useContext } from 'philjs-core';

interface ThemeContextType {
  theme: Accessor<'light' | 'dark'>;
  setTheme: Setter<'light' | 'dark'>;
}

const ThemeContext = createContext<ThemeContextType>();

function ThemeProvider(props: { children: JSX.Element }) {
  const [theme, setTheme] = createSignal<'light' | 'dark'>('light');

  const value = { theme, setTheme };

  return (
    <ThemeContext.Provider value={value}>
      {props.children}
    </ThemeContext.Provider>
  );
}

// Usage in child components
function ThemedButton() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('ThemeContext not found');

  return (
    <button className={context.theme()}>
      Current theme: {context.theme()}
    </button>
  );
}`,language:"typescript"}),s.jsx("h2",{id:"error-boundaries",children:"Error Boundaries"}),s.jsx(n.dn,{code:`import { ErrorBoundary } from 'philjs-core';

function App() {
  return (
    <ErrorBoundary
      fallback={(err, reset) => (
        <div>
          <h1>Something went wrong</h1>
          <pre>{err.message}</pre>
          <button onClick={reset}>Try again</button>
        </div>
      )}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}`,language:"typescript"}),s.jsx("h2",{id:"dynamic-imports",children:"Dynamic Imports"}),s.jsx(n.dn,{code:`import { lazy } from 'philjs-core';

// Lazy load a component
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}`,language:"typescript"}),s.jsx("h2",{id:"best-practices",children:"Best Practices"}),(0,s.jsxs)("ol",{children:[(0,s.jsxs)("li",{children:[s.jsx("strong",{children:"Keep components small:"})," Each component should do one thing well"]}),(0,s.jsxs)("li",{children:[s.jsx("strong",{children:"Use TypeScript:"})," Define prop interfaces for better DX"]}),(0,s.jsxs)("li",{children:[s.jsx("strong",{children:"Avoid prop drilling:"})," Use context for deeply nested state"]}),(0,s.jsxs)("li",{children:[s.jsx("strong",{children:"Memoize expensive computations:"})," Use ",s.jsx("code",{children:"createMemo"})]}),(0,s.jsxs)("li",{children:[s.jsx("strong",{children:"Clean up effects:"})," Always use ",s.jsx("code",{children:"onCleanup"})," for subscriptions"]}),(0,s.jsxs)("li",{children:[s.jsx("strong",{children:"Use semantic HTML:"})," Maintain accessibility"]})]}),s.jsx("h2",{id:"next-steps",children:"Next Steps"}),(0,s.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,s.jsxs)(i.default,{href:"/docs/core-concepts/effects",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[s.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Effects"}),s.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Learn about side effects and lifecycle"})]}),(0,s.jsxs)(i.default,{href:"/docs/core-concepts/stores",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[s.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Stores"}),s.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Manage complex nested state"})]})]})]})}},2108:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>a});var s=r(9015),n=r(1471);let o=(0,n.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),i=(0,n.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function a({children:e}){return s.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,s.jsxs)("div",{className:"flex gap-12",children:[s.jsx(i,{sections:o}),s.jsx("main",{className:"flex-1 min-w-0",children:s.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}},3288:(e,t,r)=>{"use strict";r.d(t,{dn:()=>n,oI:()=>o});var s=r(1471);let n=(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#CodeBlock`);(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#InlineCode`);let o=(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#Terminal`)}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[732,6314,9858],()=>r(1542));module.exports=s})();