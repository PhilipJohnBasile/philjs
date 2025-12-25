(()=>{var e={};e.id=7962,e.ids=[7962],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},135:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>a.a,__next_app__:()=>m,originalPathname:()=>h,pages:()=>d,routeModule:()=>u,tree:()=>l}),s(8439),s(2108),s(4001),s(1305);var i=s(3545),r=s(5947),n=s(9761),a=s.n(n),c=s(4798),o={};for(let e in c)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(o[e]=()=>c[e]);s.d(t,o);let l=["",{children:["docs",{children:["comparison",{children:["react",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,8439)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\comparison\\react\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,1305,23)),"next/dist/client/components/not-found-error"]}],d=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\comparison\\react\\page.tsx"],h="/docs/comparison/react/page",m={require:s,loadChunk:()=>Promise.resolve()},u=new i.AppPageRouteModule({definition:{kind:r.x.APP_PAGE,page:"/docs/comparison/react/page",pathname:"/docs/comparison/react",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:l}})},7656:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,5505,23)),Promise.resolve().then(s.bind(s,2015)),Promise.resolve().then(s.bind(s,306))},4444:(e,t,s)=>{Promise.resolve().then(s.bind(s,5173))},5173:(e,t,s)=>{"use strict";s.d(t,{Sidebar:()=>d,docsNavigation:()=>l});var i=s(6741),r=s(8972),n=s(47),a=s(7678),c=s(3178),o=s(5280);let l=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function d({sections:e}){let t=(0,n.usePathname)(),[s,l]=(0,o.useState)(()=>{let s=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(s?[s.title]:[e[0]?.title])}),d=e=>{l(t=>{let s=new Set(t);return s.has(e)?s.delete(e):s.add(e),s})};return i.jsx("nav",{className:"w-64 flex-shrink-0",children:i.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:i.jsx("ul",{className:"space-y-6",children:e.map(e=>{let n=s.has(e.title),o=e.links.some(e=>t===e.href);return(0,i.jsxs)("li",{children:[(0,i.jsxs)("button",{onClick:()=>d(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,i.jsx(c.Z,{className:(0,a.Z)("w-4 h-4 transition-transform",n&&"rotate-90")})]}),(n||o)&&i.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let s=t===e.href;return i.jsx("li",{children:i.jsx(r.default,{href:e.href,className:(0,a.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",s?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8951:(e,t,s)=>{"use strict";s.d(t,{default:()=>r.a});var i=s(7654),r=s.n(i)},7654:(e,t,s)=>{"use strict";let{createProxy:i}=s(1471);e.exports=i("C:\\Users\\Phili\\Git\\philjs\\node_modules\\.pnpm\\next@14.2.35_@opentelemetry+api@1.9.0_@playwright+test@1.55.1_react-dom@18.3.1_react@18.3.1__react@18.3.1\\node_modules\\next\\dist\\client\\link.js")},8439:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>o,metadata:()=>c});var i=s(9015),r=s(3288),n=s(7309),a=s(8951);let c={title:"PhilJS vs React",description:"Compare PhilJS with React - understand the differences in reactivity, performance, and developer experience."};function o(){return(0,i.jsxs)("div",{className:"mdx-content",children:[i.jsx("h1",{children:"PhilJS vs React"}),i.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"PhilJS and React share similar JSX syntax but differ fundamentally in their reactivity model. This guide helps React developers understand PhilJS."}),i.jsx("h2",{id:"reactivity",children:"Reactivity Model"}),(0,i.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 my-6",children:[(0,i.jsxs)("div",{children:[i.jsx("h4",{className:"font-semibold mb-2",children:"React (Virtual DOM)"}),i.jsx(r.dn,{code:`function Counter() {
  const [count, setCount] = useState(0);

  // Entire component re-renders when count changes
  console.log('Component rendered');

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
    </div>
  );
}`,language:"typescript",showLineNumbers:!1})]}),(0,i.jsxs)("div",{children:[i.jsx("h4",{className:"font-semibold mb-2",children:"PhilJS (Fine-grained)"}),i.jsx(r.dn,{code:`function Counter() {
  const [count, setCount] = createSignal(0);

  // Only runs once - component doesn't re-render
  console.log('Component setup');

  return (
    <div>
      {/* Only this text node updates */}
      <p>Count: {count()}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
    </div>
  );
}`,language:"typescript",showLineNumbers:!1})]})]}),i.jsx(n.U,{type:"info",title:"Key Difference",children:"In React, state changes trigger component re-renders and Virtual DOM diffing. In PhilJS, state changes directly update only the affected DOM nodes."}),i.jsx("h2",{id:"state",children:"State Management"}),i.jsx("h3",{children:"useState vs createSignal"}),(0,i.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 my-6",children:[(0,i.jsxs)("div",{children:[i.jsx("h4",{className:"font-semibold mb-2",children:"React"}),i.jsx(r.dn,{code:`const [user, setUser] = useState({
  name: 'Alice',
  age: 30
});

// Must spread to update
setUser({ ...user, age: 31 });

// Or use callback
setUser(prev => ({ ...prev, age: 31 }));`,language:"typescript",showLineNumbers:!1})]}),(0,i.jsxs)("div",{children:[i.jsx("h4",{className:"font-semibold mb-2",children:"PhilJS"}),i.jsx(r.dn,{code:`const [user, setUser] = createSignal({
  name: 'Alice',
  age: 30
});

// Same pattern works
setUser({ ...user(), age: 31 });

// Or use callback
setUser(prev => ({ ...prev, age: 31 }));`,language:"typescript",showLineNumbers:!1})]})]}),i.jsx("h3",{children:"useReducer vs createStore"}),(0,i.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 my-6",children:[(0,i.jsxs)("div",{children:[i.jsx("h4",{className:"font-semibold mb-2",children:"React"}),i.jsx(r.dn,{code:`const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_NAME':
      return { ...state, name: action.payload };
    case 'INCREMENT_AGE':
      return { ...state, age: state.age + 1 };
    default:
      return state;
  }
};

const [state, dispatch] = useReducer(reducer, {
  name: 'Alice',
  age: 30
});

dispatch({ type: 'SET_NAME', payload: 'Bob' });`,language:"typescript",showLineNumbers:!1})]}),(0,i.jsxs)("div",{children:[i.jsx("h4",{className:"font-semibold mb-2",children:"PhilJS"}),i.jsx(r.dn,{code:`const [state, setState] = createStore({
  name: 'Alice',
  age: 30
});

// Direct path-based updates
setState('name', 'Bob');
setState('age', age => age + 1);

// Nested updates
setState('user', 'profile', 'bio', 'Updated');

// Array operations
setState('items', 0, 'done', true);`,language:"typescript",showLineNumbers:!1})]})]}),i.jsx("h2",{id:"effects",children:"Side Effects"}),(0,i.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 my-6",children:[(0,i.jsxs)("div",{children:[i.jsx("h4",{className:"font-semibold mb-2",children:"React useEffect"}),i.jsx(r.dn,{code:`useEffect(() => {
  console.log('Count:', count);

  return () => {
    console.log('Cleanup');
  };
}, [count]); // Manual dependency array`,language:"typescript",showLineNumbers:!1})]}),(0,i.jsxs)("div",{children:[i.jsx("h4",{className:"font-semibold mb-2",children:"PhilJS createEffect"}),i.jsx(r.dn,{code:`createEffect(() => {
  console.log('Count:', count());
  // Dependencies tracked automatically!

  onCleanup(() => {
    console.log('Cleanup');
  });
});`,language:"typescript",showLineNumbers:!1})]})]}),i.jsx(n.U,{type:"success",title:"No Dependency Arrays",children:"PhilJS automatically tracks which signals are read inside effects. No more missing dependencies or stale closures!"}),i.jsx("h2",{id:"memoization",children:"Memoization"}),(0,i.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 my-6",children:[(0,i.jsxs)("div",{children:[i.jsx("h4",{className:"font-semibold mb-2",children:"React useMemo"}),i.jsx(r.dn,{code:`const fullName = useMemo(() => {
  return \`\${firstName} \${lastName}\`;
}, [firstName, lastName]);

const expensiveValue = useMemo(() => {
  return computeExpensive(data);
}, [data]);`,language:"typescript",showLineNumbers:!1})]}),(0,i.jsxs)("div",{children:[i.jsx("h4",{className:"font-semibold mb-2",children:"PhilJS createMemo"}),i.jsx(r.dn,{code:`const fullName = createMemo(() => {
  return \`\${firstName()} \${lastName()}\`;
}); // Auto-tracked

const expensiveValue = createMemo(() => {
  return computeExpensive(data());
}); // Cached until data changes`,language:"typescript",showLineNumbers:!1})]})]}),i.jsx("h2",{id:"conditional-rendering",children:"Conditional Rendering"}),(0,i.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 my-6",children:[(0,i.jsxs)("div",{children:[i.jsx("h4",{className:"font-semibold mb-2",children:"React"}),i.jsx(r.dn,{code:`{isLoggedIn ? (
  <Dashboard />
) : (
  <Login />
)}

{items.length > 0 && (
  <ItemList items={items} />
)}`,language:"tsx",showLineNumbers:!1})]}),(0,i.jsxs)("div",{children:[i.jsx("h4",{className:"font-semibold mb-2",children:"PhilJS"}),i.jsx(r.dn,{code:`<Show
  when={isLoggedIn()}
  fallback={<Login />}
>
  <Dashboard />
</Show>

<Show when={items().length > 0}>
  <ItemList items={items()} />
</Show>`,language:"tsx",showLineNumbers:!1})]})]}),i.jsx("h2",{id:"list-rendering",children:"List Rendering"}),(0,i.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 my-6",children:[(0,i.jsxs)("div",{children:[i.jsx("h4",{className:"font-semibold mb-2",children:"React"}),i.jsx(r.dn,{code:`{items.map(item => (
  <li key={item.id}>
    {item.name}
  </li>
))}

// With index
{items.map((item, index) => (
  <li key={item.id}>
    {index}: {item.name}
  </li>
))}`,language:"tsx",showLineNumbers:!1})]}),(0,i.jsxs)("div",{children:[i.jsx("h4",{className:"font-semibold mb-2",children:"PhilJS"}),i.jsx(r.dn,{code:`<For each={items()}>
  {(item) => (
    <li>{item.name}</li>
  )}
</For>

// With index signal
<For each={items()}>
  {(item, index) => (
    <li>{index()}: {item.name}</li>
  )}
</For>`,language:"tsx",showLineNumbers:!1})]})]}),(0,i.jsxs)(n.U,{type:"info",title:"For vs map",children:["PhilJS's ",i.jsx("code",{children:"<For>"})," component only re-renders items that change, while React's map re-runs for every item on any list change."]}),i.jsx("h2",{id:"context",children:"Context API"}),(0,i.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 my-6",children:[(0,i.jsxs)("div",{children:[i.jsx("h4",{className:"font-semibold mb-2",children:"React"}),i.jsx(r.dn,{code:`const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Child />
    </ThemeContext.Provider>
  );
}

function Child() {
  const theme = useContext(ThemeContext);
  return <div className={theme}>...</div>;
}`,language:"tsx",showLineNumbers:!1})]}),(0,i.jsxs)("div",{children:[i.jsx("h4",{className:"font-semibold mb-2",children:"PhilJS"}),i.jsx(r.dn,{code:`const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Child />
    </ThemeContext.Provider>
  );
}

function Child() {
  const theme = useContext(ThemeContext);
  return <div class={theme}>...</div>;
}`,language:"tsx",showLineNumbers:!1})]})]}),i.jsx("h2",{id:"refs",children:"Refs"}),(0,i.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 my-6",children:[(0,i.jsxs)("div",{children:[i.jsx("h4",{className:"font-semibold mb-2",children:"React"}),i.jsx(r.dn,{code:`function Input() {
  const inputRef = useRef<HTMLInputElement>(null);

  const focus = () => {
    inputRef.current?.focus();
  };

  return (
    <>
      <input ref={inputRef} />
      <button onClick={focus}>Focus</button>
    </>
  );
}`,language:"tsx",showLineNumbers:!1})]}),(0,i.jsxs)("div",{children:[i.jsx("h4",{className:"font-semibold mb-2",children:"PhilJS"}),i.jsx(r.dn,{code:`function Input() {
  let inputRef: HTMLInputElement;

  const focus = () => {
    inputRef?.focus();
  };

  return (
    <>
      <input ref={inputRef!} />
      <button onClick={focus}>Focus</button>
    </>
  );
}`,language:"tsx",showLineNumbers:!1})]})]}),i.jsx("h2",{id:"performance",children:"Performance Comparison"}),(0,i.jsxs)("table",{className:"w-full my-6",children:[i.jsx("thead",{children:(0,i.jsxs)("tr",{children:[i.jsx("th",{className:"text-left",children:"Aspect"}),i.jsx("th",{className:"text-left",children:"React"}),i.jsx("th",{className:"text-left",children:"PhilJS"})]})}),(0,i.jsxs)("tbody",{children:[(0,i.jsxs)("tr",{children:[i.jsx("td",{children:"Update Mechanism"}),i.jsx("td",{children:"Virtual DOM Diffing"}),i.jsx("td",{children:"Direct DOM Updates"})]}),(0,i.jsxs)("tr",{children:[i.jsx("td",{children:"Re-render Scope"}),i.jsx("td",{children:"Entire Component Tree"}),i.jsx("td",{children:"Specific DOM Nodes"})]}),(0,i.jsxs)("tr",{children:[i.jsx("td",{children:"Bundle Size"}),i.jsx("td",{children:"~45KB (min+gzip)"}),i.jsx("td",{children:"~8KB (min+gzip)"})]}),(0,i.jsxs)("tr",{children:[i.jsx("td",{children:"Memory Usage"}),i.jsx("td",{children:"Higher (VDOM)"}),i.jsx("td",{children:"Lower (No VDOM)"})]}),(0,i.jsxs)("tr",{children:[i.jsx("td",{children:"Dependency Tracking"}),i.jsx("td",{children:"Manual"}),i.jsx("td",{children:"Automatic"})]})]})]}),i.jsx("h2",{id:"migration-tips",children:"Migration Tips"}),(0,i.jsxs)("ol",{children:[(0,i.jsxs)("li",{children:[i.jsx("strong",{children:"Replace useState with createSignal:"})," Remember to call the getter function"]}),(0,i.jsxs)("li",{children:[i.jsx("strong",{children:"Remove dependency arrays:"})," Effects track dependencies automatically"]}),(0,i.jsxs)("li",{children:[i.jsx("strong",{children:"Use Show/For:"})," Replace ternaries and map with components"]}),(0,i.jsxs)("li",{children:[i.jsx("strong",{children:"Think in signals:"})," State updates don't trigger re-renders"]}),(0,i.jsxs)("li",{children:[i.jsx("strong",{children:"Check the migration guide:"})," ",i.jsx(a.default,{href:"/docs/tutorials/migration-from-react",children:"Full migration tutorial"})]})]}),i.jsx("h2",{id:"next-steps",children:"Next Steps"}),(0,i.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,i.jsxs)(a.default,{href:"/docs/tutorials/migration-from-react",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[i.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Migration Guide"}),i.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Step-by-step React to PhilJS migration"})]}),(0,i.jsxs)(a.default,{href:"/docs/core-concepts/signals",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[i.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Learn Signals"}),i.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Deep dive into PhilJS reactivity"})]})]})]})}},2108:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>c});var i=s(9015),r=s(1471);let n=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),a=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function c({children:e}){return i.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,i.jsxs)("div",{className:"flex gap-12",children:[i.jsx(a,{sections:n}),i.jsx("main",{className:"flex-1 min-w-0",children:i.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}},3288:(e,t,s)=>{"use strict";s.d(t,{dn:()=>r,oI:()=>n});var i=s(1471);let r=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#CodeBlock`);(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#InlineCode`);let n=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#Terminal`)}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),i=t.X(0,[732,6314,9858],()=>s(135));module.exports=i})();