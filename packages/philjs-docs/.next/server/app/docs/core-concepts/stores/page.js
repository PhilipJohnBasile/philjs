(()=>{var e={};e.id=342,e.ids=[342],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},8199:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>a.a,__next_app__:()=>u,originalPathname:()=>p,pages:()=>l,routeModule:()=>h,tree:()=>c}),s(2924),s(2108),s(4001),s(1305);var r=s(3545),o=s(5947),i=s(9761),a=s.n(i),n=s(4798),d={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(d[e]=()=>n[e]);s.d(t,d);let c=["",{children:["docs",{children:["core-concepts",{children:["stores",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,2924)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\core-concepts\\stores\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,1305,23)),"next/dist/client/components/not-found-error"]}],l=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\core-concepts\\stores\\page.tsx"],p="/docs/core-concepts/stores/page",u={require:s,loadChunk:()=>Promise.resolve()},h=new r.AppPageRouteModule({definition:{kind:o.x.APP_PAGE,page:"/docs/core-concepts/stores/page",pathname:"/docs/core-concepts/stores",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},7656:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,5505,23)),Promise.resolve().then(s.bind(s,2015)),Promise.resolve().then(s.bind(s,306))},4444:(e,t,s)=>{Promise.resolve().then(s.bind(s,5173))},5173:(e,t,s)=>{"use strict";s.d(t,{Sidebar:()=>l,docsNavigation:()=>c});var r=s(6741),o=s(8972),i=s(47),a=s(7678),n=s(3178),d=s(5280);let c=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function l({sections:e}){let t=(0,i.usePathname)(),[s,c]=(0,d.useState)(()=>{let s=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(s?[s.title]:[e[0]?.title])}),l=e=>{c(t=>{let s=new Set(t);return s.has(e)?s.delete(e):s.add(e),s})};return r.jsx("nav",{className:"w-64 flex-shrink-0",children:r.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:r.jsx("ul",{className:"space-y-6",children:e.map(e=>{let i=s.has(e.title),d=e.links.some(e=>t===e.href);return(0,r.jsxs)("li",{children:[(0,r.jsxs)("button",{onClick:()=>l(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,r.jsx(n.Z,{className:(0,a.Z)("w-4 h-4 transition-transform",i&&"rotate-90")})]}),(i||d)&&r.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let s=t===e.href;return r.jsx("li",{children:r.jsx(o.default,{href:e.href,className:(0,a.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",s?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8951:(e,t,s)=>{"use strict";s.d(t,{default:()=>o.a});var r=s(7654),o=s.n(r)},7654:(e,t,s)=>{"use strict";let{createProxy:r}=s(1471);e.exports=r("C:\\Users\\Phili\\Git\\philjs\\node_modules\\.pnpm\\next@14.2.35_@opentelemetry+api@1.9.0_@playwright+test@1.55.1_react-dom@18.3.1_react@18.3.1__react@18.3.1\\node_modules\\next\\dist\\client\\link.js")},2924:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>d,metadata:()=>n});var r=s(9015),o=s(3288),i=s(7309),a=s(8951);let n={title:"Stores - Core Concepts",description:"Learn how to manage complex nested state with PhilJS stores and fine-grained reactivity."};function d(){return(0,r.jsxs)("div",{className:"mdx-content",children:[r.jsx("h1",{children:"Stores"}),r.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"Stores provide fine-grained reactive state management for complex nested data structures."}),r.jsx("h2",{id:"why-stores",children:"Why Use Stores?"}),r.jsx("p",{children:"While signals work great for primitive values, stores excel at managing complex objects with nested reactivity:"}),(0,r.jsxs)("ul",{children:[r.jsx("li",{children:"Fine-grained updates to nested properties"}),r.jsx("li",{children:"Immutable update patterns"}),r.jsx("li",{children:"Path-based access and updates"}),r.jsx("li",{children:"Array and object manipulation helpers"})]}),r.jsx("h2",{id:"create-store",children:"createStore"}),r.jsx(o.dn,{code:`import { createStore } from 'philjs-core';

const [state, setState] = createStore({
  user: {
    name: 'Alice',
    age: 30,
    preferences: {
      theme: 'dark',
      notifications: true,
    },
  },
  todos: [
    { id: 1, text: 'Learn PhilJS', completed: false },
    { id: 2, text: 'Build app', completed: false },
  ],
});

// Read values
console.log(state.user.name); // 'Alice'
console.log(state.todos[0].text); // 'Learn PhilJS'`,language:"typescript"}),r.jsx(i.U,{type:"info",title:"Proxies",children:"Stores use JavaScript Proxies to track property access and enable fine-grained reactivity."}),r.jsx("h2",{id:"updating-stores",children:"Updating Stores"}),r.jsx("h3",{children:"Simple Updates"}),r.jsx(o.dn,{code:`// Update top-level property
setState('user', { name: 'Bob', age: 25, preferences: {...} });

// Update nested property
setState('user', 'name', 'Bob');
setState('user', 'age', 31);

// Update deeply nested
setState('user', 'preferences', 'theme', 'light');`,language:"typescript"}),r.jsx("h3",{children:"Function Updates"}),r.jsx(o.dn,{code:`// Update based on previous value
setState('user', 'age', age => age + 1);

// Update with path
setState('user', 'preferences', prefs => ({
  ...prefs,
  notifications: false,
}));`,language:"typescript"}),r.jsx("h3",{children:"Multiple Updates"}),r.jsx(o.dn,{code:`// Update multiple properties at once
setState({
  user: {
    ...state.user,
    name: 'Charlie',
    age: 35,
  },
});

// Or using the produce pattern
import { produce } from 'philjs-core';

setState(produce(draft => {
  draft.user.name = 'Charlie';
  draft.user.age = 35;
  draft.todos.push({ id: 3, text: 'New todo', completed: false });
}));`,language:"typescript"}),r.jsx("h2",{id:"array-updates",children:"Array Updates"}),r.jsx(o.dn,{code:`const [state, setState] = createStore({
  todos: [
    { id: 1, text: 'First', completed: false },
    { id: 2, text: 'Second', completed: true },
  ],
});

// Add item
setState('todos', todos => [...todos, newTodo]);

// Remove item
setState('todos', todos => todos.filter(t => t.id !== 1));

// Update specific item
setState('todos', 0, 'completed', true);

// Update item by condition
setState(
  'todos',
  todo => todo.id === 2,
  'text',
  'Updated text'
);

// Batch array operations
setState('todos', produce(todos => {
  todos.push(newTodo);
  todos[0].completed = true;
  todos.sort((a, b) => a.id - b.id);
}));`,language:"typescript"}),r.jsx("h2",{id:"reconcile",children:"Reconcile for Immutable Updates"}),r.jsx(o.dn,{code:`import { reconcile } from 'philjs-core';

// Replace entire state while maintaining reactivity
const newData = await fetchData();
setState(reconcile(newData));

// Reconcile nested object
setState('user', reconcile({
  name: 'New Name',
  age: 40,
  preferences: { theme: 'dark', notifications: true },
}));`,language:"typescript"}),(0,r.jsxs)(i.U,{type:"info",title:"Reconcile vs Replace",children:[r.jsx("code",{children:"reconcile"})," intelligently merges new data, only updating changed values. This preserves references and minimizes reactive updates."]}),r.jsx("h2",{id:"store-patterns",children:"Common Patterns"}),r.jsx("h3",{children:"Global Store"}),r.jsx(o.dn,{code:`// store.ts
import { createStore } from 'philjs-core';

interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

export const [appState, setAppState] = createStore<AppState>({
  user: null,
  theme: 'light',
  notifications: [],
});

// Actions
export const actions = {
  setUser(user: User | null) {
    setAppState('user', user);
  },

  toggleTheme() {
    setAppState('theme', theme =>
      theme === 'light' ? 'dark' : 'light'
    );
  },

  addNotification(notification: Notification) {
    setAppState('notifications', notifications => [
      ...notifications,
      notification,
    ]);
  },

  clearNotifications() {
    setAppState('notifications', []);
  },
};

// Usage
import { appState, actions } from './store';

function App() {
  return (
    <div className={appState.theme}>
      <Show when={appState.user}>
        {user => <div>Welcome, {user.name}!</div>}
      </Show>
    </div>
  );
}`,language:"typescript"}),r.jsx("h3",{children:"Store Context"}),r.jsx(o.dn,{code:`import { createContext, useContext } from 'philjs-core';

interface TodoStore {
  todos: Todo[];
  addTodo: (text: string) => void;
  toggleTodo: (id: number) => void;
  removeTodo: (id: number) => void;
}

const TodoContext = createContext<TodoStore>();

export function TodoProvider(props: { children: JSX.Element }) {
  const [state, setState] = createStore({
    todos: [] as Todo[],
  });

  const store: TodoStore = {
    get todos() {
      return state.todos;
    },

    addTodo(text: string) {
      const newTodo = {
        id: Date.now(),
        text,
        completed: false,
      };
      setState('todos', todos => [...todos, newTodo]);
    },

    toggleTodo(id: number) {
      setState(
        'todos',
        todo => todo.id === id,
        'completed',
        completed => !completed
      );
    },

    removeTodo(id: number) {
      setState('todos', todos => todos.filter(t => t.id !== id));
    },
  };

  return (
    <TodoContext.Provider value={store}>
      {props.children}
    </TodoContext.Provider>
  );
}

export function useTodos() {
  const context = useContext(TodoContext);
  if (!context) throw new Error('TodoContext not found');
  return context;
}

// Usage
function TodoList() {
  const todos = useTodos();

  return (
    <For each={todos.todos}>
      {todo => (
        <TodoItem
          todo={todo}
          onToggle={() => todos.toggleTodo(todo.id)}
          onRemove={() => todos.removeTodo(todo.id)}
        />
      )}
    </For>
  );
}`,language:"typescript"}),r.jsx("h3",{children:"Form State"}),r.jsx(o.dn,{code:`function RegistrationForm() {
  const [form, setForm] = createStore({
    values: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    errors: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    touched: {
      name: false,
      email: false,
      password: false,
      confirmPassword: false,
    },
  });

  const handleChange = (field: string, value: string) => {
    setForm('values', field, value);
    setForm('touched', field, true);
    validate(field, value);
  };

  const validate = (field: string, value: string) => {
    let error = '';

    switch (field) {
      case 'name':
        error = value.length < 2 ? 'Name too short' : '';
        break;
      case 'email':
        error = !value.includes('@') ? 'Invalid email' : '';
        break;
      case 'password':
        error = value.length < 8 ? 'Password too short' : '';
        break;
      case 'confirmPassword':
        error = value !== form.values.password ? 'Passwords must match' : '';
        break;
    }

    setForm('errors', field, error);
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (Object.values(form.errors).some(err => err)) {
      return;
    }
    submitForm(form.values);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={form.values.name}
        onInput={e => handleChange('name', e.currentTarget.value)}
      />
      <Show when={form.touched.name && form.errors.name}>
        <span className="error">{form.errors.name}</span>
      </Show>
      {/* Other fields... */}
    </form>
  );
}`,language:"typescript"}),r.jsx("h2",{id:"selectors",children:"Memoized Selectors"}),r.jsx(o.dn,{code:`const [state, setState] = createStore({
  todos: [] as Todo[],
  filter: 'all' as 'all' | 'active' | 'completed',
});

// Create memoized selectors
const filteredTodos = createMemo(() => {
  const todos = state.todos;
  const filter = state.filter;

  switch (filter) {
    case 'active':
      return todos.filter(t => !t.completed);
    case 'completed':
      return todos.filter(t => t.completed);
    default:
      return todos;
  }
});

const activeTodoCount = createMemo(() =>
  state.todos.filter(t => !t.completed).length
);

const completedTodoCount = createMemo(() =>
  state.todos.filter(t => t.completed).length
);`,language:"typescript"}),r.jsx("h2",{id:"performance",children:"Performance Tips"}),(0,r.jsxs)("ul",{children:[(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Use specific paths:"})," Update only what changed"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Batch updates:"})," Use ",r.jsx("code",{children:"produce"})," for multiple changes"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Memoize selectors:"})," Don't recompute derived state unnecessarily"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Use reconcile for API data:"})," Efficient immutable updates"]})]}),r.jsx(o.dn,{code:`// Bad: Triggers multiple updates
setState('user', 'name', 'Alice');
setState('user', 'age', 30);
setState('user', 'email', 'alice@example.com');

// Good: Single update
setState(produce(draft => {
  draft.user.name = 'Alice';
  draft.user.age = 30;
  draft.user.email = 'alice@example.com';
}));`,language:"typescript"}),r.jsx("h2",{id:"typescript",children:"TypeScript Support"}),r.jsx(o.dn,{code:`interface User {
  id: number;
  name: string;
  profile: {
    bio: string;
    avatar: string;
  };
}

interface AppState {
  users: User[];
  currentUserId: number | null;
}

const [state, setState] = createStore<AppState>({
  users: [],
  currentUserId: null,
});

// Fully typed updates
setState('users', 0, 'profile', 'bio', 'New bio');

// TypeScript catches errors
setState('users', 0, 'invalid', 'value'); // Error!`,language:"typescript"}),r.jsx("h2",{id:"best-practices",children:"Best Practices"}),(0,r.jsxs)("ol",{children:[(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Use stores for complex state:"})," Simple values work fine with signals"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Keep stores normalized:"})," Avoid deep nesting when possible"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Create action creators:"})," Encapsulate update logic"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Use context for component stores:"})," Avoid global state when not needed"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Memoize expensive selectors:"})," Cache computed values"]})]}),r.jsx("h2",{id:"next-steps",children:"Next Steps"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,r.jsxs)(a.default,{href:"/docs/core-concepts/ssr",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Server-Side Rendering"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Learn about SSR and hydration"})]}),(0,r.jsxs)(a.default,{href:"/docs/guides/state",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"State Management Guide"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Advanced state management patterns"})]})]})]})}},2108:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>n});var r=s(9015),o=s(1471);let i=(0,o.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),a=(0,o.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function n({children:e}){return r.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,r.jsxs)("div",{className:"flex gap-12",children:[r.jsx(a,{sections:i}),r.jsx("main",{className:"flex-1 min-w-0",children:r.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}},3288:(e,t,s)=>{"use strict";s.d(t,{dn:()=>o,oI:()=>i});var r=s(1471);let o=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#CodeBlock`);(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#InlineCode`);let i=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#Terminal`)}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[732,6314,9858],()=>s(8199));module.exports=r})();