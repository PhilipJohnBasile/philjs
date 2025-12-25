(()=>{var e={};e.id=9440,e.ids=[9440],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},8035:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>n.a,__next_app__:()=>p,originalPathname:()=>u,pages:()=>d,routeModule:()=>h,tree:()=>l}),s(3741),s(2108),s(4001),s(1305);var r=s(3545),o=s(5947),i=s(9761),n=s.n(i),a=s(4798),c={};for(let e in a)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(c[e]=()=>a[e]);s.d(t,c);let l=["",{children:["docs",{children:["getting-started",{children:["quickstart-typescript",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,3741)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\getting-started\\quickstart-typescript\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,1305,23)),"next/dist/client/components/not-found-error"]}],d=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\getting-started\\quickstart-typescript\\page.tsx"],u="/docs/getting-started/quickstart-typescript/page",p={require:s,loadChunk:()=>Promise.resolve()},h=new r.AppPageRouteModule({definition:{kind:o.x.APP_PAGE,page:"/docs/getting-started/quickstart-typescript/page",pathname:"/docs/getting-started/quickstart-typescript",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:l}})},4357:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,5505,23)),Promise.resolve().then(s.bind(s,2015)),Promise.resolve().then(s.bind(s,306))},4444:(e,t,s)=>{Promise.resolve().then(s.bind(s,5173))},5173:(e,t,s)=>{"use strict";s.d(t,{Sidebar:()=>d,docsNavigation:()=>l});var r=s(6741),o=s(8972),i=s(47),n=s(7678),a=s(3178),c=s(5280);let l=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function d({sections:e}){let t=(0,i.usePathname)(),[s,l]=(0,c.useState)(()=>{let s=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(s?[s.title]:[e[0]?.title])}),d=e=>{l(t=>{let s=new Set(t);return s.has(e)?s.delete(e):s.add(e),s})};return r.jsx("nav",{className:"w-64 flex-shrink-0",children:r.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:r.jsx("ul",{className:"space-y-6",children:e.map(e=>{let i=s.has(e.title),c=e.links.some(e=>t===e.href);return(0,r.jsxs)("li",{children:[(0,r.jsxs)("button",{onClick:()=>d(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,r.jsx(a.Z,{className:(0,n.Z)("w-4 h-4 transition-transform",i&&"rotate-90")})]}),(i||c)&&r.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let s=t===e.href;return r.jsx("li",{children:r.jsx(o.default,{href:e.href,className:(0,n.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",s?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8951:(e,t,s)=>{"use strict";s.d(t,{default:()=>o.a});var r=s(7654),o=s.n(r)},7654:(e,t,s)=>{"use strict";let{createProxy:r}=s(1471);e.exports=r("C:\\Users\\Phili\\Git\\philjs\\node_modules\\.pnpm\\next@14.2.35_@opentelemetry+api@1.9.0_@playwright+test@1.55.1_react-dom@18.3.1_react@18.3.1__react@18.3.1\\node_modules\\next\\dist\\client\\link.js")},3741:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>c,metadata:()=>a});var r=s(9015),o=s(3288),i=s(7309),n=s(8951);let a={title:"Quick Start (TypeScript)",description:"Build your first PhilJS application with TypeScript. Learn signals, components, and reactivity."};function c(){return(0,r.jsxs)("div",{className:"mdx-content",children:[r.jsx("h1",{children:"Quick Start (TypeScript)"}),r.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"Build your first PhilJS application in under 5 minutes. We'll create a simple counter app to learn the fundamentals."}),r.jsx("h2",{id:"create-project",children:"Create a New Project"}),r.jsx(o.oI,{commands:["npm create philjs@latest my-counter-app","cd my-counter-app","npm install","npm run dev"]}),(0,r.jsxs)("p",{children:["Open ",r.jsx("a",{href:"http://localhost:5173",target:"_blank",rel:"noopener noreferrer",children:"http://localhost:5173"})," in your browser to see your app running."]}),r.jsx("h2",{id:"project-structure",children:"Understanding the Project"}),r.jsx("p",{children:"Your new project has this structure:"}),r.jsx(o.dn,{code:`my-counter-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/
│   │   └── Counter.tsx     # Example component
│   └── main.tsx            # Entry point
├── public/
├── package.json
├── tsconfig.json
└── vite.config.ts`,language:"plaintext",showLineNumbers:!1}),r.jsx("h2",{id:"first-signal",children:"Your First Signal"}),r.jsx("p",{children:"Signals are the foundation of PhilJS reactivity. Let's create a simple counter:"}),r.jsx(o.dn,{code:`import { signal } from 'philjs-core';

function Counter() {
  // Create a reactive signal with initial value 0
  const count = signal(0);

  return (
    <div className="counter">
      <h1>Count: {count}</h1>
      <button onClick={() => count.set(c => c + 1)}>
        Increment
      </button>
    </div>
  );
}`,language:"typescript",filename:"src/components/Counter.tsx"}),(0,r.jsxs)(i.U,{type:"info",title:"How Signals Work",children:["When you read ",r.jsx("code",{children:"count"})," in JSX, PhilJS automatically tracks it as a dependency. When ",r.jsx("code",{children:"count.set()"})," is called, only the parts of the UI that depend on it will update."]}),r.jsx("h2",{id:"computed-values",children:"Computed Values with Memos"}),(0,r.jsxs)("p",{children:["Use ",r.jsx("code",{children:"memo"})," to create derived values that automatically update:"]}),r.jsx(o.dn,{code:`import { signal, memo } from 'philjs-core';

function Counter() {
  const count = signal(0);

  // Computed value - automatically updates when count changes
  const doubled = memo(() => count() * 2);
  const isEven = memo(() => count() % 2 === 0);

  return (
    <div>
      <p>Count: {count}</p>
      <p>Doubled: {doubled}</p>
      <p>Is Even: {isEven() ? 'Yes' : 'No'}</p>
      <button onClick={() => count.set(c => c + 1)}>+1</button>
    </div>
  );
}`,language:"typescript",filename:"src/components/Counter.tsx"}),r.jsx("h2",{id:"effects",children:"Side Effects"}),(0,r.jsxs)("p",{children:["Use ",r.jsx("code",{children:"effect"})," to run code when signals change:"]}),r.jsx(o.dn,{code:`import { signal, effect } from 'philjs-core';

function Counter() {
  const count = signal(0);

  // Run when count changes
  effect(() => {
    console.log('Count changed to:', count());

    // Optional cleanup function
    return () => console.log('Cleaning up...');
  });

  // Save to localStorage whenever count changes
  effect(() => {
    localStorage.setItem('count', String(count()));
  });

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => count.set(c => c + 1)}>+1</button>
    </div>
  );
}`,language:"typescript",filename:"src/components/Counter.tsx"}),r.jsx("h2",{id:"todo-list",children:"Building a Todo List"}),r.jsx("p",{children:"Let's build something more complete - a todo list with add, toggle, and delete:"}),r.jsx(o.dn,{code:`import { signal, memo } from 'philjs-core';

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

function TodoList() {
  const todos = signal<Todo[]>([]);
  const newTodo = signal('');

  const remaining = memo(() =>
    todos().filter(t => !t.done).length
  );

  const addTodo = () => {
    const text = newTodo().trim();
    if (text) {
      todos.set(t => [...t, {
        id: Date.now(),
        text,
        done: false,
      }]);
      newTodo.set('');
    }
  };

  const toggleTodo = (id: number) => {
    todos.set(t => t.map(todo =>
      todo.id === id
        ? { ...todo, done: !todo.done }
        : todo
    ));
  };

  const deleteTodo = (id: number) => {
    todos.set(t => t.filter(todo => todo.id !== id));
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Todo List</h1>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTodo()}
          onInput={(e) => newTodo.set(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTodo()}
          placeholder="What needs to be done?"
          className="flex-1 px-3 py-2 border rounded"
        />
        <button
          onClick={addTodo}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Add
        </button>
      </div>

      <ul className="space-y-2">
        {todos().map(todo => (
          <li
            key={todo.id}
            className="flex items-center gap-2 p-2 bg-gray-50 rounded"
          >
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
            />
            <span
              className={todo.done ? 'line-through text-gray-400' : ''}
            >
              {todo.text}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm text-gray-500">
        {remaining()} items remaining
      </p>
    </div>
  );
}`,language:"typescript",filename:"src/components/TodoList.tsx"}),r.jsx("h2",{id:"async-data",children:"Async Data with Resources"}),(0,r.jsxs)("p",{children:["Use ",r.jsx("code",{children:"resource"})," to fetch and manage async data:"]}),r.jsx(o.dn,{code:`import { signal, resource } from 'philjs-core';

interface User {
  id: number;
  name: string;
  email: string;
}

function UserProfile() {
  const userId = signal(1);

  const user = resource<User>(async () => {
    const res = await fetch(
      \`https://api.example.com/users/\${userId()}\`
    );
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  });

  return (
    <div>
      <select
        value={userId()}
        onChange={(e) => {
          userId.set(Number(e.target.value));
          user.refresh();
        }}
      >
        <option value={1}>User 1</option>
        <option value={2}>User 2</option>
        <option value={3}>User 3</option>
      </select>

      {user.loading() ? (
        <p>Loading...</p>
      ) : user.error() ? (
        <p className="text-red-500">
          Error: {user.error()?.message}
        </p>
      ) : (
        <div>
          <h2>{user().name}</h2>
          <p>{user().email}</p>
        </div>
      )}
    </div>
  );
}`,language:"typescript",filename:"src/components/UserProfile.tsx"}),r.jsx("h2",{id:"next-steps",children:"Next Steps"}),r.jsx("p",{children:"Now that you understand the basics, explore these topics:"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,r.jsxs)(n.default,{href:"/docs/core-concepts/signals",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Signals Deep Dive"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Learn advanced signal patterns and best practices"})]}),(0,r.jsxs)(n.default,{href:"/docs/guides/routing",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Routing"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Set up file-based routing for your app"})]}),(0,r.jsxs)(n.default,{href:"/docs/core-concepts/components",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Components"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Build reusable, composable UI components"})]}),(0,r.jsxs)(n.default,{href:"/docs/guides/ssr",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Server-Side Rendering"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Render your app on the server for better performance"})]})]})]})}},2108:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>a});var r=s(9015),o=s(1471);let i=(0,o.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),n=(0,o.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function a({children:e}){return r.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,r.jsxs)("div",{className:"flex gap-12",children:[r.jsx(n,{sections:i}),r.jsx("main",{className:"flex-1 min-w-0",children:r.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}},3288:(e,t,s)=>{"use strict";s.d(t,{dn:()=>o,oI:()=>i});var r=s(1471);let o=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#CodeBlock`);(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#InlineCode`);let i=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#Terminal`)}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[732,6314,9858],()=>s(8035));module.exports=r})();