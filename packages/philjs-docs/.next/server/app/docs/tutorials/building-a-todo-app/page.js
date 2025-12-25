(()=>{var e={};e.id=3788,e.ids=[3788],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},7193:(e,t,o)=>{"use strict";o.r(t),o.d(t,{GlobalError:()=>d.a,__next_app__:()=>u,originalPathname:()=>p,pages:()=>c,routeModule:()=>h,tree:()=>n}),o(2553),o(2108),o(4001),o(1305);var r=o(3545),s=o(5947),i=o(9761),d=o.n(i),a=o(4798),l={};for(let e in a)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>a[e]);o.d(t,l);let n=["",{children:["docs",{children:["tutorials",{children:["building-a-todo-app",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(o.bind(o,2553)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\tutorials\\building-a-todo-app\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(o.bind(o,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(o.bind(o,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(o.t.bind(o,1305,23)),"next/dist/client/components/not-found-error"]}],c=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\tutorials\\building-a-todo-app\\page.tsx"],p="/docs/tutorials/building-a-todo-app/page",u={require:o,loadChunk:()=>Promise.resolve()},h=new r.AppPageRouteModule({definition:{kind:s.x.APP_PAGE,page:"/docs/tutorials/building-a-todo-app/page",pathname:"/docs/tutorials/building-a-todo-app",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:n}})},4357:(e,t,o)=>{Promise.resolve().then(o.t.bind(o,5505,23)),Promise.resolve().then(o.bind(o,2015)),Promise.resolve().then(o.bind(o,306))},4444:(e,t,o)=>{Promise.resolve().then(o.bind(o,5173))},5173:(e,t,o)=>{"use strict";o.d(t,{Sidebar:()=>c,docsNavigation:()=>n});var r=o(6741),s=o(8972),i=o(47),d=o(7678),a=o(3178),l=o(5280);let n=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function c({sections:e}){let t=(0,i.usePathname)(),[o,n]=(0,l.useState)(()=>{let o=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(o?[o.title]:[e[0]?.title])}),c=e=>{n(t=>{let o=new Set(t);return o.has(e)?o.delete(e):o.add(e),o})};return r.jsx("nav",{className:"w-64 flex-shrink-0",children:r.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:r.jsx("ul",{className:"space-y-6",children:e.map(e=>{let i=o.has(e.title),l=e.links.some(e=>t===e.href);return(0,r.jsxs)("li",{children:[(0,r.jsxs)("button",{onClick:()=>c(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,r.jsx(a.Z,{className:(0,d.Z)("w-4 h-4 transition-transform",i&&"rotate-90")})]}),(i||l)&&r.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let o=t===e.href;return r.jsx("li",{children:r.jsx(s.default,{href:e.href,className:(0,d.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",o?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8951:(e,t,o)=>{"use strict";o.d(t,{default:()=>s.a});var r=o(7654),s=o.n(r)},7654:(e,t,o)=>{"use strict";let{createProxy:r}=o(1471);e.exports=r("C:\\Users\\Phili\\Git\\philjs\\node_modules\\.pnpm\\next@14.2.35_@opentelemetry+api@1.9.0_@playwright+test@1.55.1_react-dom@18.3.1_react@18.3.1__react@18.3.1\\node_modules\\next\\dist\\client\\link.js")},2108:(e,t,o)=>{"use strict";o.r(t),o.d(t,{default:()=>a});var r=o(9015),s=o(1471);let i=(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),d=(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function a({children:e}){return r.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,r.jsxs)("div",{className:"flex gap-12",children:[r.jsx(d,{sections:i}),r.jsx("main",{className:"flex-1 min-w-0",children:r.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}},2553:(e,t,o)=>{"use strict";o.r(t),o.d(t,{default:()=>l,metadata:()=>a});var r=o(9015),s=o(3288),i=o(7309),d=o(8951);let a={title:"Building a Todo App",description:"Learn PhilJS fundamentals by building a complete todo application with signals, effects, and local storage persistence."};function l(){return(0,r.jsxs)("div",{className:"mdx-content",children:[r.jsx("h1",{children:"Building a Todo App"}),r.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"Learn PhilJS fundamentals by building a complete todo application with signals, effects, and local storage persistence."}),r.jsx("h2",{id:"what-well-build",children:"What We'll Build"}),r.jsx("p",{children:"In this tutorial, we'll create a fully functional todo app that demonstrates:"}),(0,r.jsxs)("ul",{children:[r.jsx("li",{children:"Reactive state management with signals"}),r.jsx("li",{children:"Component composition and props"}),r.jsx("li",{children:"User input handling with forms"}),r.jsx("li",{children:"Side effects for local storage persistence"}),r.jsx("li",{children:"Conditional rendering and lists"}),r.jsx("li",{children:"Event handling and computed values"})]}),r.jsx("h2",{id:"setup",children:"Project Setup"}),r.jsx("p",{children:"First, create a new PhilJS project:"}),r.jsx(s.oI,{commands:["npm create philjs@latest todo-app","cd todo-app","npm install","npm run dev"]}),r.jsx("p",{children:"This creates a new project with TypeScript, Vite, and all the dependencies you need."}),r.jsx("h2",{id:"data-structure",children:"Defining the Data Structure"}),(0,r.jsxs)("p",{children:["Let's start by defining our todo item type. Create a new file ",r.jsx("code",{children:"src/types.ts"}),":"]}),r.jsx(s.dn,{code:`export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export type TodoFilter = 'all' | 'active' | 'completed';`,language:"typescript",filename:"src/types.ts"}),r.jsx("h2",{id:"state-management",children:"Setting Up State"}),(0,r.jsxs)("p",{children:["Now let's create the main component with our reactive state. Update ",r.jsx("code",{children:"src/App.tsx"}),":"]}),r.jsx(s.dn,{code:`import { createSignal, createMemo, createEffect, For, Show } from 'philjs-core';
import type { Todo, TodoFilter } from './types';

function App() {
  const [todos, setTodos] = createSignal<Todo[]>([]);
  const [filter, setFilter] = createSignal<TodoFilter>('all');
  const [inputValue, setInputValue] = createSignal('');

  // Computed values
  const filteredTodos = createMemo(() => {
    const currentFilter = filter();
    const allTodos = todos();

    switch (currentFilter) {
      case 'active':
        return allTodos.filter(todo => !todo.completed);
      case 'completed':
        return allTodos.filter(todo => todo.completed);
      default:
        return allTodos;
    }
  });

  const activeCount = createMemo(() =>
    todos().filter(todo => !todo.completed).length
  );

  const completedCount = createMemo(() =>
    todos().filter(todo => todo.completed).length
  );

  return (
    <div className="container">
      <h1>PhilJS Todo App</h1>
      {/* We'll add the UI components next */}
    </div>
  );
}

export default App;`,language:"typescript",filename:"src/App.tsx"}),(0,r.jsxs)(i.U,{type:"info",title:"Signals vs Memos",children:[r.jsx("code",{children:"createSignal"})," creates writable reactive state, while ",r.jsx("code",{children:"createMemo"})," creates derived computed values that automatically update when their dependencies change."]}),r.jsx("h2",{id:"add-todo",children:"Adding Todos"}),r.jsx("p",{children:"Let's implement the functionality to add new todos:"}),r.jsx(s.dn,{code:`  // Add this function inside the App component
  const addTodo = (e: Event) => {
    e.preventDefault();
    const text = inputValue().trim();

    if (!text) return;

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: Date.now(),
    };

    setTodos(prev => [...prev, newTodo]);
    setInputValue('');
  };

  // Add the form to the JSX
  return (
    <div className="container">
      <h1>PhilJS Todo App</h1>

      <form onSubmit={addTodo} className="todo-form">
        <input
          type="text"
          value={inputValue()}
          onInput={(e) => setInputValue(e.currentTarget.value)}
          placeholder="What needs to be done?"
          className="todo-input"
        />
        <button type="submit" className="add-button">
          Add Todo
        </button>
      </form>
    </div>
  );`,language:"typescript",filename:"src/App.tsx"}),r.jsx("h2",{id:"display-todos",children:"Displaying Todos"}),(0,r.jsxs)("p",{children:["Now let's render the list of todos using the ",r.jsx("code",{children:"For"})," component for efficient list rendering:"]}),r.jsx(s.dn,{code:`  const toggleTodo = (id: string) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id
          ? { ...todo, completed: !todo.completed }
          : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  return (
    <div className="container">
      <h1>PhilJS Todo App</h1>

      <form onSubmit={addTodo} className="todo-form">
        <input
          type="text"
          value={inputValue()}
          onInput={(e) => setInputValue(e.currentTarget.value)}
          placeholder="What needs to be done?"
          className="todo-input"
        />
        <button type="submit" className="add-button">
          Add Todo
        </button>
      </form>

      <Show when={todos().length > 0}>
        <ul className="todo-list">
          <For each={filteredTodos()}>
            {(todo) => (
              <li className={\`todo-item \${todo.completed ? 'completed' : ''}\`}>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                  className="todo-checkbox"
                />
                <span className="todo-text">{todo.text}</span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="delete-button"
                >
                  Delete
                </button>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  );`,language:"typescript",filename:"src/App.tsx"}),(0,r.jsxs)(i.U,{type:"info",title:"Why Use For?",children:["The ",r.jsx("code",{children:"For"})," component is optimized for rendering lists in PhilJS. It only re-renders items that have actually changed, unlike ",r.jsx("code",{children:"map()"})," which re-renders the entire list."]}),r.jsx("h2",{id:"filters",children:"Adding Filters"}),r.jsx("p",{children:"Let's add filter buttons to show all, active, or completed todos:"}),r.jsx(s.dn,{code:`  return (
    <div className="container">
      <h1>PhilJS Todo App</h1>

      <form onSubmit={addTodo} className="todo-form">
        {/* ... form code ... */}
      </form>

      <Show when={todos().length > 0}>
        <div className="filters">
          <button
            className={\`filter-btn \${filter() === 'all' ? 'active' : ''}\`}
            onClick={() => setFilter('all')}
          >
            All ({todos().length})
          </button>
          <button
            className={\`filter-btn \${filter() === 'active' ? 'active' : ''}\`}
            onClick={() => setFilter('active')}
          >
            Active ({activeCount()})
          </button>
          <button
            className={\`filter-btn \${filter() === 'completed' ? 'active' : ''}\`}
            onClick={() => setFilter('completed')}
          >
            Completed ({completedCount()})
          </button>
        </div>

        <ul className="todo-list">
          {/* ... todo list code ... */}
        </ul>
      </Show>
    </div>
  );`,language:"typescript",filename:"src/App.tsx"}),r.jsx("h2",{id:"persistence",children:"Local Storage Persistence"}),r.jsx("p",{children:"Now let's add persistence with local storage using effects:"}),r.jsx(s.dn,{code:`function App() {
  const [todos, setTodos] = createSignal<Todo[]>([]);
  const [filter, setFilter] = createSignal<TodoFilter>('all');
  const [inputValue, setInputValue] = createSignal('');

  // Load todos from local storage on mount
  createEffect(() => {
    const stored = localStorage.getItem('philjs-todos');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTodos(parsed);
      } catch (error) {
        console.error('Failed to parse stored todos:', error);
      }
    }
  });

  // Save todos to local storage whenever they change
  createEffect(() => {
    const current = todos();
    localStorage.setItem('philjs-todos', JSON.stringify(current));
  });

  // ... rest of the component
}`,language:"typescript",filename:"src/App.tsx"}),(0,r.jsxs)(i.U,{type:"warning",title:"Effect Timing",children:["The first effect runs only once on mount (no dependencies tracked), while the second effect runs whenever ",r.jsx("code",{children:"todos()"})," changes because we read it inside the effect."]}),r.jsx("h2",{id:"styling",children:"Adding Styles"}),(0,r.jsxs)("p",{children:["Create ",r.jsx("code",{children:"src/App.css"})," to style your todo app:"]}),r.jsx(s.dn,{code:`.container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  font-family: system-ui, -apple-system, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
}

.todo-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.todo-input {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.todo-input:focus {
  border-color: #4a90e2;
}

.add-button {
  padding: 0.75rem 1.5rem;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.add-button:hover {
  background: #357abd;
}

.filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.filter-btn {
  padding: 0.5rem 1rem;
  background: #f5f5f5;
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn.active {
  background: #e3f2fd;
  border-color: #4a90e2;
  color: #4a90e2;
  font-weight: 600;
}

.todo-list {
  list-style: none;
  padding: 0;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  transition: all 0.2s;
}

.todo-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: #999;
}

.todo-checkbox {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
}

.todo-text {
  flex: 1;
  font-size: 1rem;
}

.delete-button {
  padding: 0.5rem 1rem;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.delete-button:hover {
  background: #da190b;
}`,language:"css",filename:"src/App.css"}),r.jsx("p",{children:"Don't forget to import the styles in your component:"}),r.jsx(s.dn,{code:`import { createSignal, createMemo, createEffect, For, Show } from 'philjs-core';
import type { Todo, TodoFilter } from './types';
import './App.css';`,language:"typescript",filename:"src/App.tsx"}),r.jsx("h2",{id:"complete-code",children:"Complete Code"}),(0,r.jsxs)("p",{children:["Here's the complete ",r.jsx("code",{children:"App.tsx"})," with all features:"]}),r.jsx(s.dn,{code:`import { createSignal, createMemo, createEffect, For, Show } from 'philjs-core';
import type { Todo, TodoFilter } from './types';
import './App.css';

function App() {
  const [todos, setTodos] = createSignal<Todo[]>([]);
  const [filter, setFilter] = createSignal<TodoFilter>('all');
  const [inputValue, setInputValue] = createSignal('');

  // Load from local storage
  createEffect(() => {
    const stored = localStorage.getItem('philjs-todos');
    if (stored) {
      try {
        setTodos(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse stored todos:', error);
      }
    }
  });

  // Save to local storage
  createEffect(() => {
    localStorage.setItem('philjs-todos', JSON.stringify(todos()));
  });

  // Computed values
  const filteredTodos = createMemo(() => {
    const currentFilter = filter();
    const allTodos = todos();

    switch (currentFilter) {
      case 'active':
        return allTodos.filter(todo => !todo.completed);
      case 'completed':
        return allTodos.filter(todo => todo.completed);
      default:
        return allTodos;
    }
  });

  const activeCount = createMemo(() =>
    todos().filter(todo => !todo.completed).length
  );

  const completedCount = createMemo(() =>
    todos().filter(todo => todo.completed).length
  );

  // Actions
  const addTodo = (e: Event) => {
    e.preventDefault();
    const text = inputValue().trim();

    if (!text) return;

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: Date.now(),
    };

    setTodos(prev => [...prev, newTodo]);
    setInputValue('');
  };

  const toggleTodo = (id: string) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id
          ? { ...todo, completed: !todo.completed }
          : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const clearCompleted = () => {
    setTodos(prev => prev.filter(todo => !todo.completed));
  };

  return (
    <div className="container">
      <h1>PhilJS Todo App</h1>

      <form onSubmit={addTodo} className="todo-form">
        <input
          type="text"
          value={inputValue()}
          onInput={(e) => setInputValue(e.currentTarget.value)}
          placeholder="What needs to be done?"
          className="todo-input"
        />
        <button type="submit" className="add-button">
          Add Todo
        </button>
      </form>

      <Show when={todos().length > 0}>
        <div className="filters">
          <button
            className={\`filter-btn \${filter() === 'all' ? 'active' : ''}\`}
            onClick={() => setFilter('all')}
          >
            All ({todos().length})
          </button>
          <button
            className={\`filter-btn \${filter() === 'active' ? 'active' : ''}\`}
            onClick={() => setFilter('active')}
          >
            Active ({activeCount()})
          </button>
          <button
            className={\`filter-btn \${filter() === 'completed' ? 'active' : ''}\`}
            onClick={() => setFilter('completed')}
          >
            Completed ({completedCount()})
          </button>
        </div>

        <ul className="todo-list">
          <For each={filteredTodos()}>
            {(todo) => (
              <li className={\`todo-item \${todo.completed ? 'completed' : ''}\`}>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                  className="todo-checkbox"
                />
                <span className="todo-text">{todo.text}</span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="delete-button"
                >
                  Delete
                </button>
              </li>
            )}
          </For>
        </ul>

        <Show when={completedCount() > 0}>
          <button onClick={clearCompleted} className="clear-completed">
            Clear Completed ({completedCount()})
          </button>
        </Show>
      </Show>
    </div>
  );
}

export default App;`,language:"typescript",filename:"src/App.tsx"}),r.jsx("h2",{id:"enhancements",children:"Next Steps"}),r.jsx("p",{children:"Congratulations! You've built a complete todo app with PhilJS. Here are some ideas to enhance it further:"}),(0,r.jsxs)("ul",{children:[r.jsx("li",{children:"Add todo editing functionality"}),r.jsx("li",{children:"Implement drag-and-drop reordering"}),r.jsx("li",{children:"Add due dates and priorities"}),r.jsx("li",{children:"Create categories or tags"}),r.jsx("li",{children:"Add animations and transitions"}),r.jsx("li",{children:"Implement keyboard shortcuts"}),r.jsx("li",{children:"Add a dark mode toggle"}),r.jsx("li",{children:"Sync with a backend API"})]}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,r.jsxs)(d.default,{href:"/docs/tutorials/building-a-dashboard",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Building a Dashboard"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Learn data fetching and visualization"})]}),(0,r.jsxs)(d.default,{href:"/docs/core-concepts/signals",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Deep Dive: Signals"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Learn more about PhilJS's reactivity system"})]})]})]})}},3288:(e,t,o)=>{"use strict";o.d(t,{dn:()=>s,oI:()=>i});var r=o(1471);let s=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#CodeBlock`);(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#InlineCode`);let i=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#Terminal`)}};var t=require("../../../../webpack-runtime.js");t.C(e);var o=e=>t(t.s=e),r=t.X(0,[732,6314,9858],()=>o(7193));module.exports=r})();