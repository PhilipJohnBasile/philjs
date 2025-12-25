(()=>{var e={};e.id=698,e.ids=[698],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},2035:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>n.a,__next_app__:()=>h,originalPathname:()=>u,pages:()=>a,routeModule:()=>p,tree:()=>d}),s(7766),s(2108),s(4001),s(1305);var r=s(3545),i=s(5947),o=s(9761),n=s.n(o),c=s(4798),l={};for(let e in c)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>c[e]);s.d(t,l);let d=["",{children:["docs",{children:["tutorials",{children:["migration-from-react",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,7766)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\tutorials\\migration-from-react\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,1305,23)),"next/dist/client/components/not-found-error"]}],a=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\tutorials\\migration-from-react\\page.tsx"],u="/docs/tutorials/migration-from-react/page",h={require:s,loadChunk:()=>Promise.resolve()},p=new r.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/docs/tutorials/migration-from-react/page",pathname:"/docs/tutorials/migration-from-react",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},7656:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,5505,23)),Promise.resolve().then(s.bind(s,2015)),Promise.resolve().then(s.bind(s,306))},4444:(e,t,s)=>{Promise.resolve().then(s.bind(s,5173))},5173:(e,t,s)=>{"use strict";s.d(t,{Sidebar:()=>a,docsNavigation:()=>d});var r=s(6741),i=s(8972),o=s(47),n=s(7678),c=s(3178),l=s(5280);let d=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function a({sections:e}){let t=(0,o.usePathname)(),[s,d]=(0,l.useState)(()=>{let s=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(s?[s.title]:[e[0]?.title])}),a=e=>{d(t=>{let s=new Set(t);return s.has(e)?s.delete(e):s.add(e),s})};return r.jsx("nav",{className:"w-64 flex-shrink-0",children:r.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:r.jsx("ul",{className:"space-y-6",children:e.map(e=>{let o=s.has(e.title),l=e.links.some(e=>t===e.href);return(0,r.jsxs)("li",{children:[(0,r.jsxs)("button",{onClick:()=>a(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,r.jsx(c.Z,{className:(0,n.Z)("w-4 h-4 transition-transform",o&&"rotate-90")})]}),(o||l)&&r.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let s=t===e.href;return r.jsx("li",{children:r.jsx(i.default,{href:e.href,className:(0,n.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",s?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8951:(e,t,s)=>{"use strict";s.d(t,{default:()=>i.a});var r=s(7654),i=s.n(r)},7654:(e,t,s)=>{"use strict";let{createProxy:r}=s(1471);e.exports=r("C:\\Users\\Phili\\Git\\philjs\\node_modules\\.pnpm\\next@14.2.35_@opentelemetry+api@1.9.0_@playwright+test@1.55.1_react-dom@18.3.1_react@18.3.1__react@18.3.1\\node_modules\\next\\dist\\client\\link.js")},2108:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>c});var r=s(9015),i=s(1471);let o=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),n=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function c({children:e}){return r.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,r.jsxs)("div",{className:"flex gap-12",children:[r.jsx(n,{sections:o}),r.jsx("main",{className:"flex-1 min-w-0",children:r.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}},7766:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>l,metadata:()=>c});var r=s(9015),i=s(3288),o=s(7309),n=s(8951);let c={title:"Migration from React",description:"Step-by-step guide to migrating your React applications to PhilJS with comparison examples and migration strategies."};function l(){return(0,r.jsxs)("div",{className:"mdx-content",children:[r.jsx("h1",{children:"Migration from React"}),r.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"Step-by-step guide to migrating your React applications to PhilJS with comparison examples and migration strategies."}),r.jsx("h2",{id:"why-migrate",children:"Why Migrate to PhilJS?"}),(0,r.jsxs)("ul",{children:[(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Performance:"})," Fine-grained reactivity means no virtual DOM diffing"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Bundle Size:"})," Smaller bundles without runtime overhead"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Developer Experience:"})," Simpler mental model, less boilerplate"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Type Safety:"})," Better TypeScript integration with signal types"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Flexibility:"})," Choose between CSR, SSR, or Islands architecture"]})]}),r.jsx("h2",{id:"comparison",children:"Key Differences"}),r.jsx("h3",{children:"State Management"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 not-prose mb-6",children:[(0,r.jsxs)("div",{children:[r.jsx("p",{className:"font-semibold mb-2",children:"React"}),r.jsx(i.dn,{code:`function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}`,language:"typescript"})]}),(0,r.jsxs)("div",{children:[r.jsx("p",{className:"font-semibold mb-2",children:"PhilJS"}),r.jsx(i.dn,{code:`function Counter() {
  const [count, setCount] = createSignal(0);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count()}
    </button>
  );
}`,language:"typescript"})]})]}),r.jsx("h3",{children:"Effects"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 not-prose mb-6",children:[(0,r.jsxs)("div",{children:[r.jsx("p",{className:"font-semibold mb-2",children:"React"}),r.jsx(i.dn,{code:`useEffect(() => {
  console.log('Count:', count);
}, [count]);

useEffect(() => {
  // Runs once on mount
  fetchData();
}, []);`,language:"typescript"})]}),(0,r.jsxs)("div",{children:[r.jsx("p",{className:"font-semibold mb-2",children:"PhilJS"}),r.jsx(i.dn,{code:`createEffect(() => {
  console.log('Count:', count());
});

onMount(() => {
  // Runs once on mount
  fetchData();
});`,language:"typescript"})]})]}),r.jsx(o.U,{type:"info",title:"Auto-tracking",children:"PhilJS effects automatically track dependencies. No dependency array needed!"}),r.jsx("h3",{children:"Computed Values"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 not-prose mb-6",children:[(0,r.jsxs)("div",{children:[r.jsx("p",{className:"font-semibold mb-2",children:"React"}),r.jsx(i.dn,{code:`const doubled = useMemo(
  () => count * 2,
  [count]
);`,language:"typescript"})]}),(0,r.jsxs)("div",{children:[r.jsx("p",{className:"font-semibold mb-2",children:"PhilJS"}),r.jsx(i.dn,{code:`const doubled = createMemo(
  () => count() * 2
);`,language:"typescript"})]})]}),r.jsx("h3",{children:"Conditional Rendering"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 not-prose mb-6",children:[(0,r.jsxs)("div",{children:[r.jsx("p",{className:"font-semibold mb-2",children:"React"}),r.jsx(i.dn,{code:`{isLoggedIn ? (
  <Dashboard />
) : (
  <LoginForm />
)}

{messages.length > 0 && (
  <MessageList messages={messages} />
)}`,language:"typescript"})]}),(0,r.jsxs)("div",{children:[r.jsx("p",{className:"font-semibold mb-2",children:"PhilJS"}),r.jsx(i.dn,{code:`<Show
  when={isLoggedIn()}
  fallback={<LoginForm />}
>
  <Dashboard />
</Show>

<Show when={messages().length > 0}>
  <MessageList messages={messages()} />
</Show>`,language:"typescript"})]})]}),r.jsx("h3",{children:"Lists"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 not-prose mb-6",children:[(0,r.jsxs)("div",{children:[r.jsx("p",{className:"font-semibold mb-2",children:"React"}),r.jsx(i.dn,{code:`{items.map(item => (
  <Item
    key={item.id}
    item={item}
  />
))}`,language:"typescript"})]}),(0,r.jsxs)("div",{children:[r.jsx("p",{className:"font-semibold mb-2",children:"PhilJS"}),r.jsx(i.dn,{code:`<For each={items()}>
  {(item) => (
    <Item item={item} />
  )}
</For>`,language:"typescript"})]})]}),r.jsx("h2",{id:"migration-strategy",children:"Migration Strategy"}),r.jsx("h3",{children:"1. Incremental Migration"}),r.jsx("p",{children:"You can gradually migrate your React app by running PhilJS alongside React:"}),r.jsx(i.dn,{code:`// Install PhilJS
npm install philjs-core philjs-router

// In your existing React app
import { render } from 'philjs-core';
import { PhilJSComponent } from './PhilJSComponent';

function App() {
  return (
    <div>
      {/* Existing React code */}
      <ReactComponent />

      {/* New PhilJS component */}
      <div ref={el => {
        if (el) render(PhilJSComponent, el);
      }} />
    </div>
  );
}`,language:"typescript"}),r.jsx("h3",{children:"2. Component-by-Component"}),r.jsx("p",{children:"Start with leaf components (no children) and work your way up:"}),(0,r.jsxs)("ol",{children:[r.jsx("li",{children:"Identify components with no dependencies on React-specific features"}),r.jsx("li",{children:"Convert simple presentational components first"}),r.jsx("li",{children:"Move to components with state and effects"}),r.jsx("li",{children:"Convert context providers and consumers"}),r.jsx("li",{children:"Finally, convert routing and layout components"})]}),r.jsx("h2",{id:"hooks-mapping",children:"Hooks Migration Guide"}),(0,r.jsxs)("table",{children:[r.jsx("thead",{children:(0,r.jsxs)("tr",{children:[r.jsx("th",{children:"React Hook"}),r.jsx("th",{children:"PhilJS Equivalent"}),r.jsx("th",{children:"Notes"})]})}),(0,r.jsxs)("tbody",{children:[(0,r.jsxs)("tr",{children:[r.jsx("td",{children:r.jsx("code",{children:"useState"})}),r.jsx("td",{children:r.jsx("code",{children:"createSignal"})}),r.jsx("td",{children:"Signals return getters/setters"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:r.jsx("code",{children:"useEffect"})}),r.jsx("td",{children:r.jsx("code",{children:"createEffect"})}),r.jsx("td",{children:"Auto-tracks dependencies"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:r.jsx("code",{children:"useMemo"})}),r.jsx("td",{children:r.jsx("code",{children:"createMemo"})}),r.jsx("td",{children:"Auto-tracks dependencies"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:r.jsx("code",{children:"useCallback"})}),r.jsx("td",{children:"Not needed"}),r.jsx("td",{children:"Functions are stable by default"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:r.jsx("code",{children:"useRef"})}),r.jsx("td",{children:r.jsx("code",{children:"let variable"})}),r.jsx("td",{children:"Regular variables work fine"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:r.jsx("code",{children:"useContext"})}),r.jsx("td",{children:r.jsx("code",{children:"useContext"})}),(0,r.jsxs)("td",{children:["Similar API, use with ",r.jsx("code",{children:"provide_context"})]})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:r.jsx("code",{children:"useReducer"})}),r.jsx("td",{children:r.jsx("code",{children:"createStore"})}),r.jsx("td",{children:"More powerful with nested reactivity"})]})]})]}),r.jsx("h2",{id:"patterns",children:"Common Patterns"}),r.jsx("h3",{children:"Custom Hooks"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 not-prose mb-6",children:[(0,r.jsxs)("div",{children:[r.jsx("p",{className:"font-semibold mb-2",children:"React"}),r.jsx(i.dn,{code:`function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);

  const increment = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  return { count, increment };
}

// Usage
const { count, increment } = useCounter();`,language:"typescript"})]}),(0,r.jsxs)("div",{children:[r.jsx("p",{className:"font-semibold mb-2",children:"PhilJS"}),r.jsx(i.dn,{code:`function createCounter(initial = 0) {
  const [count, setCount] = createSignal(initial);

  const increment = () => {
    setCount(c => c + 1);
  };

  return { count, increment };
}

// Usage
const { count, increment } = createCounter();`,language:"typescript"})]})]}),r.jsx("h3",{children:"Context"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 not-prose mb-6",children:[(0,r.jsxs)("div",{children:[r.jsx("p",{className:"font-semibold mb-2",children:"React"}),r.jsx(i.dn,{code:`const ThemeContext = createContext();

function App() {
  const [theme, setTheme] = useState('light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Child />
    </ThemeContext.Provider>
  );
}

function Child() {
  const { theme } = useContext(ThemeContext);
  return <div>{theme}</div>;
}`,language:"typescript"})]}),(0,r.jsxs)("div",{children:[r.jsx("p",{className:"font-semibold mb-2",children:"PhilJS"}),r.jsx(i.dn,{code:`const ThemeContext = createContext();

function App() {
  const [theme, setTheme] = createSignal('light');

  provide_context(ThemeContext, { theme, setTheme });

  return <Child />;
}

function Child() {
  const { theme } = useContext(ThemeContext);
  return <div>{theme()}</div>;
}`,language:"typescript"})]})]}),r.jsx("h3",{children:"Data Fetching"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 not-prose mb-6",children:[(0,r.jsxs)("div",{children:[r.jsx("p",{className:"font-semibold mb-2",children:"React"}),r.jsx(i.dn,{code:`function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(\`/api/users/\${userId}\`)
      .then(res => res.json())
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <Spinner />;
  if (error) return <Error error={error} />;
  return <div>{user.name}</div>;
}`,language:"typescript"})]}),(0,r.jsxs)("div",{children:[r.jsx("p",{className:"font-semibold mb-2",children:"PhilJS"}),r.jsx(i.dn,{code:`function UserProfile(props) {
  const [user] = createResource(
    () => props.userId,
    (id) => fetch(\`/api/users/\${id}\`)
      .then(res => res.json())
  );

  return (
    <Show
      when={!user.loading}
      fallback={<Spinner />}
    >
      <Show
        when={!user.error}
        fallback={<Error error={user.error} />}
      >
        <div>{user()?.name}</div>
      </Show>
    </Show>
  );
}`,language:"typescript"})]})]}),r.jsx("h2",{id:"tooling",children:"Tooling Migration"}),r.jsx("h3",{children:"Package.json Updates"}),r.jsx(i.dn,{code:`{
  "dependencies": {
    // Remove React
    // "react": "^18.2.0",
    // "react-dom": "^18.2.0",

    // Add PhilJS
    "philjs-core": "^1.0.0",
    "philjs-router": "^1.0.0"
  },
  "devDependencies": {
    // Update JSX config
    "vite": "^5.0.0",
    "philjs-compiler": "^1.0.0"
  }
}`,language:"json",filename:"package.json"}),r.jsx("h3",{children:"Vite Configuration"}),r.jsx(i.dn,{code:`import { defineConfig } from 'vite';
import philjs from 'philjs-compiler/vite';

export default defineConfig({
  plugins: [philjs()],
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'philjs-core',
  },
});`,language:"typescript",filename:"vite.config.ts"}),r.jsx("h3",{children:"TypeScript Configuration"}),r.jsx(i.dn,{code:`{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "philjs-core",
    // ... other options
  }
}`,language:"json",filename:"tsconfig.json"}),r.jsx("h2",{id:"common-issues",children:"Common Migration Issues"}),r.jsx("h3",{children:"Issue: Reading Signal Values"}),r.jsx(o.U,{type:"warning",title:"Common Mistake",children:"Remember to call signals as functions to read their values!"}),r.jsx(i.dn,{code:`const [count, setCount] = createSignal(0);

// Wrong
console.log(count); // Logs the signal function

// Correct
console.log(count()); // Logs the value`,language:"typescript"}),r.jsx("h3",{children:"Issue: Dependency Tracking"}),r.jsx(i.dn,{code:`const [count, setCount] = createSignal(0);

// Wrong - reads outside effect, won't track
const value = count();
createEffect(() => {
  console.log(value); // Won't re-run when count changes
});

// Correct - reads inside effect
createEffect(() => {
  console.log(count()); // Re-runs when count changes
});`,language:"typescript"}),r.jsx("h3",{children:"Issue: Conditional Signal Reads"}),r.jsx(i.dn,{code:`// Avoid conditional signal reads in effects
createEffect(() => {
  if (someCondition) {
    console.log(count()); // May break reactivity
  }
});

// Better: Use Show or createMemo
createEffect(() => {
  const value = count(); // Always read signals
  if (someCondition) {
    console.log(value);
  }
});`,language:"typescript"}),r.jsx("h2",{id:"example-migration",children:"Complete Example: Todo App"}),r.jsx("p",{children:"Here's a complete before/after of a todo app migration:"}),(0,r.jsxs)("details",{children:[r.jsx("summary",{className:"cursor-pointer font-semibold text-primary-600 dark:text-primary-400 mb-4",children:"Click to see full React version"}),r.jsx(i.dn,{code:`import { useState, useCallback } from 'react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filteredTodos = useMemo(() => {
    switch (filter) {
      case 'active':
        return todos.filter(t => !t.completed);
      case 'completed':
        return todos.filter(t => t.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

  const addTodo = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setTodos(prev => [...prev, {
      id: crypto.randomUUID(),
      text: input,
      completed: false,
    }]);
    setInput('');
  }, [input]);

  const toggleTodo = useCallback((id: string) => {
    setTodos(prev => prev.map(todo =>
      todo.id === id
        ? { ...todo, completed: !todo.completed }
        : todo
    ));
  }, []);

  return (
    <div>
      <form onSubmit={addTodo}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      <div>
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('active')}>Active</button>
        <button onClick={() => setFilter('completed')}>Completed</button>
      </div>

      <ul>
        {filteredTodos.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span>{todo.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}`,language:"typescript"})]}),(0,r.jsxs)("details",{children:[r.jsx("summary",{className:"cursor-pointer font-semibold text-primary-600 dark:text-primary-400 mb-4 mt-4",children:"Click to see PhilJS version"}),r.jsx(i.dn,{code:`import { createSignal, createMemo, For } from 'philjs-core';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

function TodoApp() {
  const [todos, setTodos] = createSignal<Todo[]>([]);
  const [input, setInput] = createSignal('');
  const [filter, setFilter] = createSignal<'all' | 'active' | 'completed'>('all');

  const filteredTodos = createMemo(() => {
    switch (filter()) {
      case 'active':
        return todos().filter(t => !t.completed);
      case 'completed':
        return todos().filter(t => t.completed);
      default:
        return todos();
    }
  });

  const addTodo = (e: Event) => {
    e.preventDefault();
    const text = input().trim();
    if (!text) return;

    setTodos(prev => [...prev, {
      id: crypto.randomUUID(),
      text,
      completed: false,
    }]);
    setInput('');
  };

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(todo =>
      todo.id === id
        ? { ...todo, completed: !todo.completed }
        : todo
    ));
  };

  return (
    <div>
      <form onSubmit={addTodo}>
        <input
          value={input()}
          onInput={e => setInput(e.currentTarget.value)}
        />
        <button type="submit">Add</button>
      </form>

      <div>
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('active')}>Active</button>
        <button onClick={() => setFilter('completed')}>Completed</button>
      </div>

      <ul>
        <For each={filteredTodos()}>
          {(todo) => (
            <li>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
              />
              <span>{todo.text}</span>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}`,language:"typescript"})]}),r.jsx("h2",{id:"resources",children:"Additional Resources"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,r.jsxs)(n.default,{href:"/docs/core-concepts/signals",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Signals Deep Dive"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Understand PhilJS's reactivity system"})]}),(0,r.jsxs)(n.default,{href:"/docs/api/core",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"API Reference"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Complete API documentation"})]})]})]})}},3288:(e,t,s)=>{"use strict";s.d(t,{dn:()=>i,oI:()=>o});var r=s(1471);let i=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#CodeBlock`);(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#InlineCode`);let o=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#Terminal`)}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[732,6314,9858],()=>s(2035));module.exports=r})();