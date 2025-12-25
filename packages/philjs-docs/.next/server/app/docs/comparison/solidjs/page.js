(()=>{var e={};e.id=4936,e.ids=[4936],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},634:(e,s,t)=>{"use strict";t.r(s),t.d(s,{GlobalError:()=>n.a,__next_app__:()=>u,originalPathname:()=>h,pages:()=>c,routeModule:()=>p,tree:()=>d}),t(8205),t(2108),t(4001),t(1305);var r=t(3545),i=t(5947),o=t(9761),n=t.n(o),l=t(4798),a={};for(let e in l)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(a[e]=()=>l[e]);t.d(s,a);let d=["",{children:["docs",{children:["comparison",{children:["solidjs",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(t.bind(t,8205)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\comparison\\solidjs\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(t.bind(t,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(t.bind(t,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(t.t.bind(t,1305,23)),"next/dist/client/components/not-found-error"]}],c=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\comparison\\solidjs\\page.tsx"],h="/docs/comparison/solidjs/page",u={require:t,loadChunk:()=>Promise.resolve()},p=new r.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/docs/comparison/solidjs/page",pathname:"/docs/comparison/solidjs",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},7656:(e,s,t)=>{Promise.resolve().then(t.t.bind(t,5505,23)),Promise.resolve().then(t.bind(t,2015)),Promise.resolve().then(t.bind(t,306))},4444:(e,s,t)=>{Promise.resolve().then(t.bind(t,5173))},5173:(e,s,t)=>{"use strict";t.d(s,{Sidebar:()=>c,docsNavigation:()=>d});var r=t(6741),i=t(8972),o=t(47),n=t(7678),l=t(3178),a=t(5280);let d=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function c({sections:e}){let s=(0,o.usePathname)(),[t,d]=(0,a.useState)(()=>{let t=e.find(e=>e.links.some(e=>s?.startsWith(e.href)));return new Set(t?[t.title]:[e[0]?.title])}),c=e=>{d(s=>{let t=new Set(s);return t.has(e)?t.delete(e):t.add(e),t})};return r.jsx("nav",{className:"w-64 flex-shrink-0",children:r.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:r.jsx("ul",{className:"space-y-6",children:e.map(e=>{let o=t.has(e.title),a=e.links.some(e=>s===e.href);return(0,r.jsxs)("li",{children:[(0,r.jsxs)("button",{onClick:()=>c(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,r.jsx(l.Z,{className:(0,n.Z)("w-4 h-4 transition-transform",o&&"rotate-90")})]}),(o||a)&&r.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let t=s===e.href;return r.jsx("li",{children:r.jsx(i.default,{href:e.href,className:(0,n.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",t?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8951:(e,s,t)=>{"use strict";t.d(s,{default:()=>i.a});var r=t(7654),i=t.n(r)},7654:(e,s,t)=>{"use strict";let{createProxy:r}=t(1471);e.exports=r("C:\\Users\\Phili\\Git\\philjs\\node_modules\\.pnpm\\next@14.2.35_@opentelemetry+api@1.9.0_@playwright+test@1.55.1_react-dom@18.3.1_react@18.3.1__react@18.3.1\\node_modules\\next\\dist\\client\\link.js")},8205:(e,s,t)=>{"use strict";t.r(s),t.d(s,{default:()=>a,metadata:()=>l});var r=t(9015),i=t(3288),o=t(7309),n=t(8951);let l={title:"PhilJS vs SolidJS",description:"Compare PhilJS with SolidJS - similar reactivity models with key differences in TypeScript support and Rust integration."};function a(){return(0,r.jsxs)("div",{className:"mdx-content",children:[r.jsx("h1",{children:"PhilJS vs SolidJS"}),r.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"PhilJS and SolidJS share a similar fine-grained reactivity model inspired by the same principles. Both offer excellent performance, but PhilJS adds Rust/WASM support and enhanced TypeScript integration."}),r.jsx(o.U,{type:"info",title:"Shared Heritage",children:"PhilJS draws significant inspiration from SolidJS's excellent reactivity model. If you know SolidJS, you'll feel right at home with PhilJS."}),r.jsx("h2",{id:"similarities",children:"What's Similar"}),(0,r.jsxs)("ul",{children:[(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Fine-grained reactivity:"})," Both use signals for reactive state"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"No Virtual DOM:"})," Direct DOM updates for better performance"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Automatic tracking:"})," Dependencies tracked without manual arrays"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"JSX syntax:"})," Familiar component authoring"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Component as setup:"})," Components run once, not on every update"]})]}),r.jsx("h2",{id:"api-comparison",children:"API Comparison"}),r.jsx("h3",{children:"Signals"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 my-6",children:[(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-semibold mb-2",children:"SolidJS"}),r.jsx(i.dn,{code:`import { createSignal } from 'solid-js';

const [count, setCount] = createSignal(0);

// Read value
console.log(count());

// Set value
setCount(5);
setCount(c => c + 1);`,language:"typescript",showLineNumbers:!1})]}),(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-semibold mb-2",children:"PhilJS"}),r.jsx(i.dn,{code:`import { createSignal } from 'philjs-core';

const [count, setCount] = createSignal(0);

// Read value
console.log(count());

// Set value
setCount(5);
setCount(c => c + 1);`,language:"typescript",showLineNumbers:!1})]})]}),r.jsx("h3",{children:"Effects"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 my-6",children:[(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-semibold mb-2",children:"SolidJS"}),r.jsx(i.dn,{code:`import { createEffect, onCleanup } from 'solid-js';

createEffect(() => {
  const value = count();
  console.log('Count:', value);

  onCleanup(() => {
    console.log('Cleanup');
  });
});`,language:"typescript",showLineNumbers:!1})]}),(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-semibold mb-2",children:"PhilJS"}),r.jsx(i.dn,{code:`import { createEffect, onCleanup } from 'philjs-core';

createEffect(() => {
  const value = count();
  console.log('Count:', value);

  onCleanup(() => {
    console.log('Cleanup');
  });
});`,language:"typescript",showLineNumbers:!1})]})]}),r.jsx("h2",{id:"key-differences",children:"Key Differences"}),r.jsx("h3",{children:"Rust and WASM Support"}),r.jsx("p",{children:"PhilJS provides first-class Rust support with the same reactivity model:"}),r.jsx(i.dn,{code:`// PhilJS in Rust - same mental model!
use philjs::prelude::*;

#[component]
fn Counter() -> impl IntoView {
    let (count, set_count) = create_signal(0);

    view! {
        <button on:click=move |_| set_count.update(|n| *n + 1)>
            "Count: " {count}
        </button>
    }
}`,language:"rust"}),r.jsx(o.U,{type:"success",title:"Full-Stack Rust",children:"PhilJS is the only signals-based framework with full Rust support, enabling type-safe full-stack development with shared code."}),r.jsx("h3",{children:"TypeScript Integration"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 my-6",children:[(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-semibold mb-2",children:"SolidJS"}),r.jsx(i.dn,{code:`// SolidJS props typing
interface Props {
  name: string;
  age?: number;
}

const Component: Component<Props> = (props) => {
  // props.name - works
  // props.age - might be undefined
  return <div>{props.name}</div>;
};`,language:"typescript",showLineNumbers:!1})]}),(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-semibold mb-2",children:"PhilJS"}),r.jsx(i.dn,{code:`// PhilJS uses standard TypeScript patterns
interface Props {
  name: string;
  age?: number;
}

function Component({ name, age = 25 }: Props) {
  // Destructuring with defaults works
  return <div>{name} ({age})</div>;
}

// Or with accessors for reactivity
function Component(props: Props) {
  return <div>{props.name}</div>;
}`,language:"typescript",showLineNumbers:!1})]})]}),r.jsx("h3",{children:"Store API"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 my-6",children:[(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-semibold mb-2",children:"SolidJS"}),r.jsx(i.dn,{code:`import { createStore, produce } from 'solid-js/store';

const [state, setState] = createStore({
  user: { name: 'Alice' },
  items: [{ id: 1, done: false }]
});

// Path-based update
setState('user', 'name', 'Bob');

// With produce (immer-like)
setState(produce(s => {
  s.items[0].done = true;
}));`,language:"typescript",showLineNumbers:!1})]}),(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-semibold mb-2",children:"PhilJS"}),r.jsx(i.dn,{code:`import { createStore, reconcile } from 'philjs-core';

const [state, setState] = createStore({
  user: { name: 'Alice' },
  items: [{ id: 1, done: false }]
});

// Path-based update (same API)
setState('user', 'name', 'Bob');

// Enhanced array methods
setState('items', 0, 'done', true);

// Reconcile for server data
setState('items', reconcile(serverData));`,language:"typescript",showLineNumbers:!1})]})]}),r.jsx("h3",{children:"Server-Side Rendering"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 my-6",children:[(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-semibold mb-2",children:"SolidJS (SolidStart)"}),r.jsx(i.dn,{code:`// SolidStart server function
"use server";

export async function getTodos() {
  const db = await getDb();
  return db.query('SELECT * FROM todos');
}

// Usage in component
const [todos] = createResource(getTodos);`,language:"typescript",showLineNumbers:!1})]}),(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-semibold mb-2",children:"PhilJS"}),r.jsx(i.dn,{code:`// PhilJS server function
import { server$ } from 'philjs-ssr';

export const getTodos = server$(async () => {
  const db = await getDb();
  return db.query('SELECT * FROM todos');
});

// Identical usage
const [todos] = createResource(getTodos);

// Or in Rust with full type safety
#[server]
async fn get_todos() -> Result<Vec<Todo>> {
  db::todos::all().await
}`,language:"typescript",showLineNumbers:!1})]})]}),r.jsx("h3",{children:"Islands Architecture"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 my-6",children:[(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-semibold mb-2",children:"SolidJS"}),r.jsx(i.dn,{code:`// SolidStart islands mode
// Requires configuration

export default function Island() {
  "use client"; // Mark as island

  const [count, setCount] = createSignal(0);
  return <button onClick={() => setCount(c => c + 1)}>
    {count()}
  </button>;
}`,language:"typescript",showLineNumbers:!1})]}),(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-semibold mb-2",children:"PhilJS"}),r.jsx(i.dn,{code:`// PhilJS islands - explicit and composable
import { Island } from 'philjs-ssr';

function Counter() {
  const [count, setCount] = createSignal(0);
  return <button onClick={() => setCount(c => c + 1)}>
    {count()}
  </button>;
}

// Use anywhere
<Island client:visible>
  <Counter />
</Island>

<Island client:idle priority="low">
  <HeavyComponent />
</Island>`,language:"typescript",showLineNumbers:!1})]})]}),r.jsx("h2",{id:"ecosystem",children:"Ecosystem Comparison"}),(0,r.jsxs)("table",{className:"w-full my-6",children:[r.jsx("thead",{children:(0,r.jsxs)("tr",{children:[r.jsx("th",{className:"text-left",children:"Feature"}),r.jsx("th",{className:"text-left",children:"SolidJS"}),r.jsx("th",{className:"text-left",children:"PhilJS"})]})}),(0,r.jsxs)("tbody",{children:[(0,r.jsxs)("tr",{children:[r.jsx("td",{children:"Meta-framework"}),r.jsx("td",{children:"SolidStart"}),r.jsx("td",{children:"Built-in SSR"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:"Rust Support"}),r.jsx("td",{children:"No"}),r.jsx("td",{children:"First-class"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:"UI Components"}),r.jsx("td",{children:"Community libs"}),r.jsx("td",{children:"philjs-ui"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:"Forms"}),r.jsx("td",{children:"@modular-forms/solid"}),r.jsx("td",{children:"philjs-forms"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:"Router"}),r.jsx("td",{children:"@solidjs/router"}),r.jsx("td",{children:"philjs-router"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:"DevTools"}),r.jsx("td",{children:"solid-devtools"}),r.jsx("td",{children:"philjs-devtools"})]})]})]}),r.jsx("h2",{id:"when-to-choose",children:"When to Choose Which"}),r.jsx("h3",{children:"Choose SolidJS if:"}),(0,r.jsxs)("ul",{children:[r.jsx("li",{children:"You want a mature, battle-tested framework"}),r.jsx("li",{children:"You need extensive third-party library support"}),r.jsx("li",{children:"You prefer a pure JavaScript/TypeScript stack"})]}),r.jsx("h3",{children:"Choose PhilJS if:"}),(0,r.jsxs)("ul",{children:[r.jsx("li",{children:"You want Rust/WASM support for performance-critical code"}),r.jsx("li",{children:"You're building full-stack Rust applications"}),r.jsx("li",{children:"You want integrated tooling (forms, UI, routing)"}),r.jsx("li",{children:"You prefer enhanced TypeScript patterns"})]}),r.jsx("h2",{id:"next-steps",children:"Next Steps"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,r.jsxs)(n.default,{href:"/docs/getting-started/installation",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Get Started"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Try PhilJS in your next project"})]}),(0,r.jsxs)(n.default,{href:"/docs/rust-guide/quickstart",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Rust Guide"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Explore PhilJS's unique Rust support"})]})]})]})}},2108:(e,s,t)=>{"use strict";t.r(s),t.d(s,{default:()=>l});var r=t(9015),i=t(1471);let o=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),n=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function l({children:e}){return r.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,r.jsxs)("div",{className:"flex gap-12",children:[r.jsx(n,{sections:o}),r.jsx("main",{className:"flex-1 min-w-0",children:r.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}},3288:(e,s,t)=>{"use strict";t.d(s,{dn:()=>i,oI:()=>o});var r=t(1471);let i=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#CodeBlock`);(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#InlineCode`);let o=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#Terminal`)}};var s=require("../../../../webpack-runtime.js");s.C(e);var t=e=>s(s.s=e),r=s.X(0,[732,6314,9858],()=>t(634));module.exports=r})();