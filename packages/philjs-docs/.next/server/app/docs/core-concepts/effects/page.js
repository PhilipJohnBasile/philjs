(()=>{var e={};e.id=2493,e.ids=[2493],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},212:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>n.a,__next_app__:()=>h,originalPathname:()=>u,pages:()=>d,routeModule:()=>p,tree:()=>l}),s(9556),s(2108),s(4001),s(1305);var r=s(3545),o=s(5947),i=s(9761),n=s.n(i),a=s(4798),c={};for(let e in a)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(c[e]=()=>a[e]);s.d(t,c);let l=["",{children:["docs",{children:["core-concepts",{children:["effects",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,9556)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\core-concepts\\effects\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,1305,23)),"next/dist/client/components/not-found-error"]}],d=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\core-concepts\\effects\\page.tsx"],u="/docs/core-concepts/effects/page",h={require:s,loadChunk:()=>Promise.resolve()},p=new r.AppPageRouteModule({definition:{kind:o.x.APP_PAGE,page:"/docs/core-concepts/effects/page",pathname:"/docs/core-concepts/effects",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:l}})},7656:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,5505,23)),Promise.resolve().then(s.bind(s,2015)),Promise.resolve().then(s.bind(s,306))},4444:(e,t,s)=>{Promise.resolve().then(s.bind(s,5173))},5173:(e,t,s)=>{"use strict";s.d(t,{Sidebar:()=>d,docsNavigation:()=>l});var r=s(6741),o=s(8972),i=s(47),n=s(7678),a=s(3178),c=s(5280);let l=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function d({sections:e}){let t=(0,i.usePathname)(),[s,l]=(0,c.useState)(()=>{let s=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(s?[s.title]:[e[0]?.title])}),d=e=>{l(t=>{let s=new Set(t);return s.has(e)?s.delete(e):s.add(e),s})};return r.jsx("nav",{className:"w-64 flex-shrink-0",children:r.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:r.jsx("ul",{className:"space-y-6",children:e.map(e=>{let i=s.has(e.title),c=e.links.some(e=>t===e.href);return(0,r.jsxs)("li",{children:[(0,r.jsxs)("button",{onClick:()=>d(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,r.jsx(a.Z,{className:(0,n.Z)("w-4 h-4 transition-transform",i&&"rotate-90")})]}),(i||c)&&r.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let s=t===e.href;return r.jsx("li",{children:r.jsx(o.default,{href:e.href,className:(0,n.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",s?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8951:(e,t,s)=>{"use strict";s.d(t,{default:()=>o.a});var r=s(7654),o=s.n(r)},7654:(e,t,s)=>{"use strict";let{createProxy:r}=s(1471);e.exports=r("C:\\Users\\Phili\\Git\\philjs\\node_modules\\.pnpm\\next@14.2.35_@opentelemetry+api@1.9.0_@playwright+test@1.55.1_react-dom@18.3.1_react@18.3.1__react@18.3.1\\node_modules\\next\\dist\\client\\link.js")},9556:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>c,metadata:()=>a});var r=s(9015),o=s(3288),i=s(7309),n=s(8951);let a={title:"Effects - Core Concepts",description:"Master side effects, lifecycle management, and reactive computations in PhilJS."};function c(){return(0,r.jsxs)("div",{className:"mdx-content",children:[r.jsx("h1",{children:"Effects & Lifecycle"}),r.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"Effects let you perform side effects like data fetching, DOM manipulation, and subscriptions in response to reactive changes."}),r.jsx("h2",{id:"create-effect",children:"createEffect"}),r.jsx("p",{children:"Effects run immediately and automatically re-run when their dependencies change:"}),r.jsx(o.dn,{code:`import { createSignal, createEffect } from 'philjs-core';

const [count, setCount] = createSignal(0);

createEffect(() => {
  console.log('Count is:', count());
});

// Logs: "Count is: 0"

setCount(1);
// Logs: "Count is: 1"`,language:"typescript"}),r.jsx(i.U,{type:"info",title:"Automatic Tracking",children:"Effects automatically track all signals read inside them. No dependency array needed!"}),r.jsx("h2",{id:"lifecycle-hooks",children:"Lifecycle Hooks"}),r.jsx("h3",{children:"onMount"}),r.jsx("p",{children:"Runs once when the component is first created:"}),r.jsx(o.dn,{code:`import { onMount } from 'philjs-core';

function DataComponent() {
  const [data, setData] = createSignal(null);

  onMount(async () => {
    console.log('Component mounted');
    const result = await fetchData();
    setData(result);
  });

  return <div>{data() || 'Loading...'}</div>;
}`,language:"typescript"}),r.jsx("h3",{children:"onCleanup"}),r.jsx("p",{children:"Register cleanup functions for subscriptions, timers, and event listeners:"}),r.jsx(o.dn,{code:`import { onMount, onCleanup } from 'philjs-core';

function Timer() {
  const [seconds, setSeconds] = createSignal(0);

  onMount(() => {
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    onCleanup(() => {
      console.log('Cleaning up timer');
      clearInterval(interval);
    });
  });

  return <div>Elapsed: {seconds()}s</div>;
}

// Cleanup also works in effects
createEffect(() => {
  const subscription = observable.subscribe(value => {
    console.log(value);
  });

  onCleanup(() => subscription.unsubscribe());
});`,language:"typescript"}),r.jsx("h2",{id:"create-memo",children:"createMemo"}),r.jsx("p",{children:"Memos are cached computed values that only recalculate when dependencies change:"}),r.jsx(o.dn,{code:`import { createSignal, createMemo } from 'philjs-core';

const [firstName, setFirstName] = createSignal('John');
const [lastName, setLastName] = createSignal('Doe');

const fullName = createMemo(() => {
  console.log('Computing full name');
  return \`\${firstName()} \${lastName()}\`;
});

// First access - computes
console.log(fullName()); // Logs: "Computing full name", "John Doe"

// Second access - uses cache
console.log(fullName()); // Just "John Doe"

// Update dependency - recomputes
setFirstName('Jane');
console.log(fullName()); // Logs: "Computing full name", "Jane Doe"`,language:"typescript"}),r.jsx("h3",{children:"When to Use Memos"}),(0,r.jsxs)("ul",{children:[r.jsx("li",{children:"Expensive computations that should be cached"}),r.jsx("li",{children:"Derived state from multiple signals"}),r.jsx("li",{children:"Filtering or transforming lists"}),r.jsx("li",{children:"Complex calculations in JSX"})]}),r.jsx(o.dn,{code:`const [todos, setTodos] = createSignal<Todo[]>([]);
const [filter, setFilter] = createSignal<'all' | 'active' | 'completed'>('all');

// Good: Expensive filtering is memoized
const filteredTodos = createMemo(() => {
  const allTodos = todos();
  const currentFilter = filter();

  return currentFilter === 'all'
    ? allTodos
    : allTodos.filter(t =>
        currentFilter === 'active' ? !t.completed : t.completed
      );
});

// Bad: Recomputes on every render
return (
  <For each={todos().filter(t => !t.completed)}>
    {/* ... */}
  </For>
);`,language:"typescript"}),r.jsx("h2",{id:"effect-patterns",children:"Effect Patterns"}),r.jsx("h3",{children:"Data Fetching"}),r.jsx(o.dn,{code:`function UserProfile(props: { userId: string }) {
  const [user, setUser] = createSignal<User | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<Error | null>(null);

  createEffect(() => {
    const id = props.userId; // Track userId changes

    setLoading(true);
    setError(null);

    fetch(\`/api/users/\${id}\`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  });

  return (
    <Show when={!loading()} fallback={<Spinner />}>
      <Show when={!error()} fallback={<Error error={error()!} />}>
        <div>{user()?.name}</div>
      </Show>
    </Show>
  );
}`,language:"typescript"}),r.jsx("h3",{children:"Local Storage Sync"}),r.jsx(o.dn,{code:`function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = createSignal<T>(initial);

  // Load from localStorage on mount
  onMount(() => {
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setValue(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored value:', e);
      }
    }
  });

  // Save to localStorage on changes
  createEffect(() => {
    localStorage.setItem(key, JSON.stringify(value()));
  });

  return [value, setValue] as const;
}

// Usage
const [theme, setTheme] = useLocalStorage('theme', 'light');`,language:"typescript"}),r.jsx("h3",{children:"Event Listeners"}),r.jsx(o.dn,{code:`function useWindowSize() {
  const [width, setWidth] = createSignal(window.innerWidth);
  const [height, setHeight] = createSignal(window.innerHeight);

  onMount(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    onCleanup(() => {
      window.removeEventListener('resize', handleResize);
    });
  });

  return { width, height };
}

// Usage
function ResponsiveComponent() {
  const { width, height } = useWindowSize();

  return <div>Window size: {width()} x {height()}</div>;
}`,language:"typescript"}),r.jsx("h2",{id:"createResource",children:"createResource"}),r.jsx("p",{children:"Resources simplify async data fetching with built-in loading and error states:"}),r.jsx(o.dn,{code:`import { createResource } from 'philjs-core';

const [userId, setUserId] = createSignal(1);

const [user] = createResource(
  userId, // Source signal - refetches when this changes
  async (id) => {
    const res = await fetch(\`/api/users/\${id}\`);
    return res.json();
  }
);

return (
  <div>
    <Show when={!user.loading} fallback={<p>Loading...</p>}>
      <Show when={!user.error} fallback={<p>Error: {user.error.message}</p>}>
        <h1>{user()?.name}</h1>
      </Show>
    </Show>
  </div>
);`,language:"typescript"}),r.jsx("h3",{children:"Resource Methods"}),r.jsx(o.dn,{code:`const [data, { refetch, mutate }] = createResource(fetcher);

// Refetch the data
refetch();

// Optimistically update
mutate(newValue);

// Check state
data.loading; // boolean
data.error; // Error | null
data.state; // 'pending' | 'ready' | 'refreshing' | 'errored'`,language:"typescript"}),r.jsx("h2",{id:"batch",children:"Batch Updates"}),r.jsx(o.dn,{code:`import { batch } from 'philjs-core';

const [firstName, setFirstName] = createSignal('John');
const [lastName, setLastName] = createSignal('Doe');

createEffect(() => {
  console.log(\`\${firstName()} \${lastName()}\`);
});

// Without batch: effect runs twice
setFirstName('Jane');
setLastName('Smith');
// Logs: "Jane Doe"
// Logs: "Jane Smith"

// With batch: effect runs once
batch(() => {
  setFirstName('Alice');
  setLastName('Johnson');
});
// Logs: "Alice Johnson"`,language:"typescript"}),r.jsx("h2",{id:"untrack",children:"Untracked Reads"}),r.jsx(o.dn,{code:`import { untrack } from 'philjs-core';

const [count, setCount] = createSignal(0);
const [multiplier, setMultiplier] = createSignal(2);

// Effect only tracks count, not multiplier
createEffect(() => {
  const currentCount = count();
  const currentMultiplier = untrack(multiplier);
  console.log(currentCount * currentMultiplier);
});

setCount(5); // Logs: 10
setMultiplier(3); // Doesn't log (not tracked)`,language:"typescript"}),r.jsx("h2",{id:"on",children:"on() - Explicit Dependencies"}),r.jsx(o.dn,{code:`import { on } from 'philjs-core';

const [a, setA] = createSignal(0);
const [b, setB] = createSignal(0);

// Only track 'a', even though we read 'b'
createEffect(
  on(a, (value) => {
    console.log('a changed to:', value);
    console.log('b is:', b()); // Read but don't track
  })
);

setA(1); // Logs
setB(2); // Doesn't log`,language:"typescript"}),r.jsx("h2",{id:"createDeferred",children:"createDeferred"}),r.jsx("p",{children:"Defer updates to reduce unnecessary work during rapid changes:"}),r.jsx(o.dn,{code:`import { createDeferred } from 'philjs-core';

const [input, setInput] = createSignal('');
const deferredInput = createDeferred(input, { timeoutMs: 500 });

// deferredInput only updates after 500ms of no changes
createEffect(() => {
  // Expensive operation
  searchAPI(deferredInput());
});

// Rapid typing only triggers one search
setInput('h');
setInput('he');
setInput('hel');
setInput('hello'); // Search runs 500ms after this`,language:"typescript"}),r.jsx("h2",{id:"best-practices",children:"Best Practices"}),(0,r.jsxs)("ol",{children:[(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Use memos for computations:"})," Don't repeat expensive calculations"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Clean up effects:"})," Always use ",r.jsx("code",{children:"onCleanup"})," for resources"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Batch related updates:"})," Prevent unnecessary effect runs"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Use resources for async:"})," Simpler than manual effect + state"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Avoid conditional reads:"})," Read signals at the top level of effects"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Be careful with dependencies:"})," Understand what triggers re-runs"]})]}),r.jsx("h2",{id:"common-pitfalls",children:"Common Pitfalls"}),r.jsx("h3",{children:"Reading Signals Outside Effects"}),r.jsx(o.dn,{code:`// Bad: Read outside effect
const value = count();
createEffect(() => {
  console.log(value); // Won't update!
});

// Good: Read inside effect
createEffect(() => {
  console.log(count()); // Updates correctly
});`,language:"typescript"}),r.jsx("h3",{children:"Infinite Loops"}),r.jsx(o.dn,{code:`// Bad: Creates infinite loop
const [count, setCount] = createSignal(0);
createEffect(() => {
  setCount(count() + 1); // Triggers effect again!
});

// Good: Guard condition or use different approach
createEffect(() => {
  if (count() < 10) {
    setCount(count() + 1);
  }
});`,language:"typescript"}),r.jsx("h2",{id:"next-steps",children:"Next Steps"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,r.jsxs)(n.default,{href:"/docs/core-concepts/stores",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Stores"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Learn about nested reactive state"})]}),(0,r.jsxs)(n.default,{href:"/docs/api/core",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"API Reference"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Complete philjs-core API docs"})]})]})]})}},2108:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>a});var r=s(9015),o=s(1471);let i=(0,o.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),n=(0,o.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function a({children:e}){return r.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,r.jsxs)("div",{className:"flex gap-12",children:[r.jsx(n,{sections:i}),r.jsx("main",{className:"flex-1 min-w-0",children:r.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}},3288:(e,t,s)=>{"use strict";s.d(t,{dn:()=>o,oI:()=>i});var r=s(1471);let o=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#CodeBlock`);(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#InlineCode`);let i=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#Terminal`)}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[732,6314,9858],()=>s(212));module.exports=r})();