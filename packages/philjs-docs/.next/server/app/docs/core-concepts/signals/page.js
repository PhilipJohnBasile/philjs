(()=>{var e={};e.id=1280,e.ids=[1280],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},3405:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>n.a,__next_app__:()=>p,originalPathname:()=>u,pages:()=>d,routeModule:()=>h,tree:()=>l}),s(9579),s(2108),s(4001),s(1305);var r=s(3545),i=s(5947),a=s(9761),n=s.n(a),o=s(4798),c={};for(let e in o)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(c[e]=()=>o[e]);s.d(t,c);let l=["",{children:["docs",{children:["core-concepts",{children:["signals",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,9579)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\core-concepts\\signals\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,1305,23)),"next/dist/client/components/not-found-error"]}],d=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\core-concepts\\signals\\page.tsx"],u="/docs/core-concepts/signals/page",p={require:s,loadChunk:()=>Promise.resolve()},h=new r.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/docs/core-concepts/signals/page",pathname:"/docs/core-concepts/signals",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:l}})},7656:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,5505,23)),Promise.resolve().then(s.bind(s,2015)),Promise.resolve().then(s.bind(s,306))},4444:(e,t,s)=>{Promise.resolve().then(s.bind(s,5173))},5173:(e,t,s)=>{"use strict";s.d(t,{Sidebar:()=>d,docsNavigation:()=>l});var r=s(6741),i=s(8972),a=s(47),n=s(7678),o=s(3178),c=s(5280);let l=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function d({sections:e}){let t=(0,a.usePathname)(),[s,l]=(0,c.useState)(()=>{let s=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(s?[s.title]:[e[0]?.title])}),d=e=>{l(t=>{let s=new Set(t);return s.has(e)?s.delete(e):s.add(e),s})};return r.jsx("nav",{className:"w-64 flex-shrink-0",children:r.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:r.jsx("ul",{className:"space-y-6",children:e.map(e=>{let a=s.has(e.title),c=e.links.some(e=>t===e.href);return(0,r.jsxs)("li",{children:[(0,r.jsxs)("button",{onClick:()=>d(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,r.jsx(o.Z,{className:(0,n.Z)("w-4 h-4 transition-transform",a&&"rotate-90")})]}),(a||c)&&r.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let s=t===e.href;return r.jsx("li",{children:r.jsx(i.default,{href:e.href,className:(0,n.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",s?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8951:(e,t,s)=>{"use strict";s.d(t,{default:()=>i.a});var r=s(7654),i=s.n(r)},7654:(e,t,s)=>{"use strict";let{createProxy:r}=s(1471);e.exports=r("C:\\Users\\Phili\\Git\\philjs\\node_modules\\.pnpm\\next@14.2.35_@opentelemetry+api@1.9.0_@playwright+test@1.55.1_react-dom@18.3.1_react@18.3.1__react@18.3.1\\node_modules\\next\\dist\\client\\link.js")},9579:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>c,metadata:()=>o});var r=s(9015),i=s(3288),a=s(7309),n=s(8951);let o={title:"Signals - Core Concepts",description:"Learn about PhilJS's reactive signals system - the foundation of fine-grained reactivity."};function c(){return(0,r.jsxs)("div",{className:"mdx-content",children:[r.jsx("h1",{children:"Signals"}),r.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"Signals are the foundation of PhilJS's fine-grained reactivity system. They're simple, powerful primitives for managing state."}),r.jsx("h2",{id:"what-are-signals",children:"What Are Signals?"}),r.jsx("p",{children:"A signal is a reactive primitive that holds a value and notifies subscribers when that value changes. Unlike React's useState, signals don't cause component re-renders. Instead, they update only the specific DOM nodes that depend on them."}),r.jsx(i.dn,{code:`import { createSignal } from 'philjs-core';

const [count, setCount] = createSignal(0);

// Read the value
console.log(count()); // 0

// Update the value
setCount(1);
console.log(count()); // 1

// Update based on previous value
setCount(prev => prev + 1);
console.log(count()); // 2`,language:"typescript"}),(0,r.jsxs)(a.U,{type:"info",title:"Getter Functions",children:["Signals return a getter function. Always call ",r.jsx("code",{children:"count()"})," to read the value, not just ",r.jsx("code",{children:"count"}),"."]}),r.jsx("h2",{id:"creating-signals",children:"Creating Signals"}),r.jsx(i.dn,{code:`// Simple value
const [name, setName] = createSignal('Alice');

// Object
const [user, setUser] = createSignal({
  id: 1,
  name: 'Alice',
  email: 'alice@example.com'
});

// Array
const [items, setItems] = createSignal<string[]>([]);

// With type annotation
const [count, setCount] = createSignal<number>(0);

// Optional initial value (undefined by default)
const [value, setValue] = createSignal<string>();
console.log(value()); // undefined`,language:"typescript"}),r.jsx("h2",{id:"updating-signals",children:"Updating Signals"}),r.jsx("h3",{children:"Direct Updates"}),r.jsx(i.dn,{code:`const [count, setCount] = createSignal(0);

// Set a new value
setCount(10);

// Update based on previous value
setCount(prev => prev + 1);`,language:"typescript"}),r.jsx("h3",{children:"Object Updates"}),r.jsx(i.dn,{code:`const [user, setUser] = createSignal({
  name: 'Alice',
  age: 30
});

// Replace entire object
setUser({ name: 'Bob', age: 25 });

// Update specific properties (spread pattern)
setUser(prev => ({ ...prev, age: 31 }));

// Multiple updates
setUser(prev => ({
  ...prev,
  age: prev.age + 1,
  lastUpdated: Date.now()
}));`,language:"typescript"}),r.jsx("h3",{children:"Array Updates"}),r.jsx(i.dn,{code:`const [items, setItems] = createSignal<string[]>([]);

// Add item
setItems(prev => [...prev, 'new item']);

// Remove item
setItems(prev => prev.filter(item => item !== 'removed'));

// Update item
setItems(prev => prev.map(item =>
  item === 'old' ? 'new' : item
));

// Clear array
setItems([]);`,language:"typescript"}),r.jsx("h2",{id:"reading-signals",children:"Reading Signals"}),(0,r.jsxs)(a.U,{type:"warning",title:"Common Mistake",children:["Always call the getter function to read signal values. Reading ",r.jsx("code",{children:"count"})," instead of ",r.jsx("code",{children:"count()"})," won't track the dependency in effects!"]}),r.jsx(i.dn,{code:`const [count, setCount] = createSignal(0);

// Correct: Read value
const value = count();

// Wrong: This just references the getter function
const wrong = count; // typeof wrong === 'function'

// In JSX
function Counter() {
  const [count, setCount] = createSignal(0);

  return (
    <div>
      {/* Correct: */}
      <p>Count: {count()}</p>

      {/* Wrong - will display [Function] */}
      <p>Count: {count}</p>
    </div>
  );
}`,language:"typescript"}),r.jsx("h2",{id:"reactivity",children:"How Reactivity Works"}),r.jsx("p",{children:"Signals automatically track where they're being read and update only those locations:"}),r.jsx(i.dn,{code:`import { createSignal, createEffect } from 'philjs-core';

const [count, setCount] = createSignal(0);

// This effect automatically subscribes to count
createEffect(() => {
  console.log('Count changed:', count());
});

// Logs: "Count changed: 0"

setCount(1);
// Logs: "Count changed: 1"

setCount(2);
// Logs: "Count changed: 2"`,language:"typescript"}),r.jsx("h2",{id:"derived-signals",children:"Derived Values with Memos"}),r.jsx("p",{children:"Create computed signals that automatically update when dependencies change:"}),r.jsx(i.dn,{code:`import { createSignal, createMemo } from 'philjs-core';

const [firstName, setFirstName] = createSignal('John');
const [lastName, setLastName] = createSignal('Doe');

// Memo automatically tracks dependencies
const fullName = createMemo(() => {
  return \`\${firstName()} \${lastName()}\`;
});

console.log(fullName()); // "John Doe"

setFirstName('Jane');
console.log(fullName()); // "Jane Doe"`,language:"typescript"}),r.jsx(a.U,{type:"info",title:"Memos are Cached",children:"Memos only recalculate when their dependencies change. Multiple reads return the cached value."}),r.jsx("h2",{id:"batch-updates",children:"Batch Updates"}),r.jsx("p",{children:"Batch multiple signal updates to prevent unnecessary re-computations:"}),r.jsx(i.dn,{code:`import { createSignal, batch, createEffect } from 'philjs-core';

const [firstName, setFirstName] = createSignal('John');
const [lastName, setLastName] = createSignal('Doe');

createEffect(() => {
  console.log(\`Name: \${firstName()} \${lastName()}\`);
});

// Without batching: effect runs twice
setFirstName('Jane');
setLastName('Smith');
// Logs:
// "Name: Jane Doe"
// "Name: Jane Smith"

// With batching: effect runs once
batch(() => {
  setFirstName('Alice');
  setLastName('Johnson');
});
// Logs only:
// "Name: Alice Johnson"`,language:"typescript"}),r.jsx("h2",{id:"untracked",children:"Untracked Reads"}),r.jsx("p",{children:"Sometimes you need to read a signal without creating a dependency:"}),r.jsx(i.dn,{code:`import { createSignal, createEffect, untrack } from 'philjs-core';

const [count, setCount] = createSignal(0);
const [name, setName] = createSignal('Alice');

createEffect(() => {
  console.log('Count:', count());

  // Read name without subscribing to it
  const currentName = untrack(name);
  console.log('Name (untracked):', currentName);
});

setCount(1);
// Logs:
// "Count: 1"
// "Name (untracked): Alice"

setName('Bob');
// Nothing logged - effect doesn't subscribe to name`,language:"typescript"}),r.jsx("h2",{id:"signal-options",children:"Signal Options"}),r.jsx(i.dn,{code:`import { createSignal } from 'philjs-core';

// Custom equality function
const [value, setValue] = createSignal(
  { x: 0, y: 0 },
  {
    equals: (a, b) => a.x === b.x && a.y === b.y
  }
);

// This won't trigger updates (same values)
setValue({ x: 0, y: 0 });

// This will trigger updates (different values)
setValue({ x: 1, y: 1 });`,language:"typescript"}),r.jsx("h2",{id:"advanced-patterns",children:"Advanced Patterns"}),r.jsx("h3",{children:"Signal Factories"}),r.jsx(i.dn,{code:`function createToggle(initial = false) {
  const [value, setValue] = createSignal(initial);

  return {
    value,
    toggle: () => setValue(v => !v),
    setTrue: () => setValue(true),
    setFalse: () => setValue(false),
  };
}

// Usage
const darkMode = createToggle(false);

darkMode.toggle();
console.log(darkMode.value()); // true

darkMode.setFalse();
console.log(darkMode.value()); // false`,language:"typescript"}),r.jsx("h3",{children:"Signal Arrays"}),r.jsx(i.dn,{code:`function createSignalArray<T>(initial: T[] = []) {
  const [items, setItems] = createSignal<T[]>(initial);

  return {
    items,
    push: (item: T) => setItems(prev => [...prev, item]),
    pop: () => setItems(prev => prev.slice(0, -1)),
    remove: (index: number) =>
      setItems(prev => prev.filter((_, i) => i !== index)),
    update: (index: number, value: T) =>
      setItems(prev => prev.map((item, i) => i === index ? value : item)),
    clear: () => setItems([]),
  };
}

// Usage
const todos = createSignalArray<string>();
todos.push('Learn PhilJS');
todos.push('Build app');
console.log(todos.items()); // ['Learn PhilJS', 'Build app']`,language:"typescript"}),r.jsx("h2",{id:"performance",children:"Performance Considerations"}),(0,r.jsxs)("ul",{children:[(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Fine-grained updates:"})," Only affected DOM nodes update, not entire components"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"No virtual DOM:"})," Direct DOM updates eliminate diffing overhead"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Automatic tracking:"})," No manual dependency arrays to maintain"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Lazy evaluation:"})," Memos only compute when accessed"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Structural sharing:"})," Updates don't require deep cloning"]})]}),r.jsx("h2",{id:"best-practices",children:"Best Practices"}),(0,r.jsxs)("ol",{children:[(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Keep signals simple:"})," Store primitive values when possible"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Use memos for derived state:"})," Don't duplicate state"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Batch related updates:"})," Use ",r.jsx("code",{children:"batch()"})," for multiple changes"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Avoid conditionally reading signals:"})," Always read at the top level of effects"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Use stores for complex state:"})," See ",r.jsx(n.default,{href:"/docs/core-concepts/stores",children:"Stores"})," for nested reactivity"]})]}),r.jsx("h2",{id:"next-steps",children:"Next Steps"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,r.jsxs)(n.default,{href:"/docs/core-concepts/components",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Components"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Learn how to build reusable components"})]}),(0,r.jsxs)(n.default,{href:"/docs/core-concepts/effects",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Effects"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Handle side effects and lifecycle"})]})]})]})}},2108:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>o});var r=s(9015),i=s(1471);let a=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),n=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function o({children:e}){return r.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,r.jsxs)("div",{className:"flex gap-12",children:[r.jsx(n,{sections:a}),r.jsx("main",{className:"flex-1 min-w-0",children:r.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}},3288:(e,t,s)=>{"use strict";s.d(t,{dn:()=>i,oI:()=>a});var r=s(1471);let i=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#CodeBlock`);(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#InlineCode`);let a=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#Terminal`)}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[732,6314,9858],()=>s(3405));module.exports=r})();