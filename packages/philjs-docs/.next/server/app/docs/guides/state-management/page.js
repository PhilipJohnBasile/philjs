(()=>{var e={};e.id=453,e.ids=[453],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},334:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>a.a,__next_app__:()=>h,originalPathname:()=>u,pages:()=>d,routeModule:()=>p,tree:()=>l}),s(5738),s(2108),s(4001),s(1305);var r=s(3545),i=s(5947),o=s(9761),a=s.n(o),n=s(4798),c={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(c[e]=()=>n[e]);s.d(t,c);let l=["",{children:["docs",{children:["guides",{children:["state-management",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,5738)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\guides\\state-management\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,1305,23)),"next/dist/client/components/not-found-error"]}],d=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\guides\\state-management\\page.tsx"],u="/docs/guides/state-management/page",h={require:s,loadChunk:()=>Promise.resolve()},p=new r.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/docs/guides/state-management/page",pathname:"/docs/guides/state-management",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:l}})},7656:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,5505,23)),Promise.resolve().then(s.bind(s,2015)),Promise.resolve().then(s.bind(s,306))},4444:(e,t,s)=>{Promise.resolve().then(s.bind(s,5173))},5173:(e,t,s)=>{"use strict";s.d(t,{Sidebar:()=>d,docsNavigation:()=>l});var r=s(6741),i=s(8972),o=s(47),a=s(7678),n=s(3178),c=s(5280);let l=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function d({sections:e}){let t=(0,o.usePathname)(),[s,l]=(0,c.useState)(()=>{let s=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(s?[s.title]:[e[0]?.title])}),d=e=>{l(t=>{let s=new Set(t);return s.has(e)?s.delete(e):s.add(e),s})};return r.jsx("nav",{className:"w-64 flex-shrink-0",children:r.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:r.jsx("ul",{className:"space-y-6",children:e.map(e=>{let o=s.has(e.title),c=e.links.some(e=>t===e.href);return(0,r.jsxs)("li",{children:[(0,r.jsxs)("button",{onClick:()=>d(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,r.jsx(n.Z,{className:(0,a.Z)("w-4 h-4 transition-transform",o&&"rotate-90")})]}),(o||c)&&r.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let s=t===e.href;return r.jsx("li",{children:r.jsx(i.default,{href:e.href,className:(0,a.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",s?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8951:(e,t,s)=>{"use strict";s.d(t,{default:()=>i.a});var r=s(7654),i=s.n(r)},7654:(e,t,s)=>{"use strict";let{createProxy:r}=s(1471);e.exports=r("C:\\Users\\Phili\\Git\\philjs\\node_modules\\.pnpm\\next@14.2.35_@opentelemetry+api@1.9.0_@playwright+test@1.55.1_react-dom@18.3.1_react@18.3.1__react@18.3.1\\node_modules\\next\\dist\\client\\link.js")},5738:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>c,metadata:()=>n});var r=s(9015),i=s(3288),o=s(7309),a=s(8951);let n={title:"State Management Guide",description:"Advanced state management patterns in PhilJS with signals, stores, and context."};function c(){return(0,r.jsxs)("div",{className:"mdx-content",children:[r.jsx("h1",{children:"State Management"}),r.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"PhilJS provides fine-grained reactivity with signals, stores, and context for managing state at every level of your application."}),r.jsx("h2",{id:"signals",children:"Signals: The Foundation"}),r.jsx("p",{children:"Signals are reactive primitives that hold a value and notify subscribers when it changes. They're the building blocks of all state in PhilJS:"}),r.jsx(i.dn,{code:`import { createSignal, createEffect } from 'philjs-core';

// Create a signal with initial value
const [count, setCount] = createSignal(0);

// Read the current value
console.log(count()); // 0

// Update the value
setCount(1);
setCount(prev => prev + 1);

// Effects automatically track and re-run when dependencies change
createEffect(() => {
  console.log('Count is now:', count());
});`,language:"typescript",filename:"signals-basics.ts"}),r.jsx("h3",{id:"derived-state",children:"Derived State with Memos"}),(0,r.jsxs)("p",{children:["Use ",r.jsx("code",{children:"createMemo"})," for derived values that cache their result:"]}),r.jsx(i.dn,{code:`import { createSignal, createMemo } from 'philjs-core';

const [items, setItems] = createSignal<Item[]>([]);
const [filter, setFilter] = createSignal<'all' | 'active' | 'completed'>('all');

// Computed value - only recalculates when items or filter changes
const filteredItems = createMemo(() => {
  const f = filter();
  return items().filter(item => {
    if (f === 'active') return !item.completed;
    if (f === 'completed') return item.completed;
    return true;
  });
});

// Statistics derived from items
const stats = createMemo(() => ({
  total: items().length,
  active: items().filter(i => !i.completed).length,
  completed: items().filter(i => i.completed).length,
}));`,language:"typescript",filename:"derived-state.ts"}),r.jsx("h2",{id:"stores",children:"Stores: Nested Reactive State"}),(0,r.jsxs)("p",{children:["For complex nested state, use ",r.jsx("code",{children:"createStore"})," which provides fine-grained reactivity at any depth:"]}),r.jsx(i.dn,{code:`import { createStore } from 'philjs-core';

interface AppState {
  user: {
    name: string;
    preferences: {
      theme: 'light' | 'dark';
      notifications: boolean;
    };
  };
  todos: Array<{
    id: number;
    text: string;
    completed: boolean;
  }>;
}

const [state, setState] = createStore<AppState>({
  user: {
    name: 'John',
    preferences: {
      theme: 'light',
      notifications: true,
    },
  },
  todos: [],
});

// Read nested values
console.log(state.user.preferences.theme);

// Update nested values - only components using this path re-render
setState('user', 'preferences', 'theme', 'dark');

// Update array items
setState('todos', todo => todo.id === 1, 'completed', true);

// Add to arrays
setState('todos', todos => [...todos, { id: 2, text: 'New', completed: false }]);

// Batch multiple updates
setState(state => ({
  ...state,
  user: {
    ...state.user,
    name: 'Jane',
  },
}));`,language:"typescript",filename:"stores.ts"}),r.jsx("h3",{id:"store-utilities",children:"Store Utilities"}),r.jsx(i.dn,{code:`import { createStore, produce, reconcile } from 'philjs-core';

const [state, setState] = createStore({ items: [] });

// Use produce for immutable updates with mutable syntax
setState(produce(draft => {
  draft.items.push({ id: 1, name: 'New Item' });
  draft.items[0].name = 'Updated';
}));

// Use reconcile to diff and update efficiently
const newData = await fetchItems();
setState('items', reconcile(newData));`,language:"typescript",filename:"store-utilities.ts"}),r.jsx("h2",{id:"context",children:"Context: Dependency Injection"}),r.jsx("p",{children:"Use context to pass state down the component tree without prop drilling:"}),r.jsx(i.dn,{code:`import { createContext, useContext, createSignal } from 'philjs-core';

// Define context type
interface AuthContext {
  user: () => User | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

// Create context with optional default
const AuthContext = createContext<AuthContext>();

// Provider component
function AuthProvider(props: { children: any }) {
  const [user, setUser] = createSignal<User | null>(null);

  const login = async (credentials: Credentials) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    const userData = await res.json();
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const isAuthenticated = () => user() !== null;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {props.children}
    </AuthContext.Provider>
  );
}

// Consumer hook
function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Usage in components
function UserProfile() {
  const { user, logout } = useAuth();

  return (
    <Show when={user()}>
      {(u) => (
        <div>
          <span>Welcome, {u.name}</span>
          <button onClick={logout}>Logout</button>
        </div>
      )}
    </Show>
  );
}`,language:"tsx",filename:"AuthContext.tsx"}),r.jsx("h2",{id:"global-state",children:"Global State Patterns"}),r.jsx("h3",{id:"singleton-store",children:"Singleton Store"}),r.jsx("p",{children:"For truly global state, create a singleton store outside components:"}),r.jsx(i.dn,{code:`// stores/appStore.ts
import { createStore, createRoot } from 'philjs-core';

interface AppStore {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: Notification[];
}

// Create store in a reactive root so it persists
const { state, actions } = createRoot(() => {
  const [state, setState] = createStore<AppStore>({
    theme: 'light',
    sidebarOpen: true,
    notifications: [],
  });

  const actions = {
    toggleTheme: () => {
      setState('theme', t => t === 'light' ? 'dark' : 'light');
    },
    toggleSidebar: () => {
      setState('sidebarOpen', open => !open);
    },
    addNotification: (notification: Notification) => {
      setState('notifications', n => [...n, notification]);
    },
    dismissNotification: (id: string) => {
      setState('notifications', n => n.filter(x => x.id !== id));
    },
  };

  return { state, actions };
});

export { state as appState, actions as appActions };

// Usage in any component
import { appState, appActions } from './stores/appStore';

function Sidebar() {
  return (
    <aside class={appState.sidebarOpen ? 'open' : 'closed'}>
      {/* ... */}
    </aside>
  );
}

function ThemeToggle() {
  return (
    <button onClick={appActions.toggleTheme}>
      {appState.theme === 'light' ? 'Dark' : 'Light'} Mode
    </button>
  );
}`,language:"typescript",filename:"appStore.ts"}),r.jsx("h3",{id:"entity-store",children:"Entity Store Pattern"}),r.jsx(i.dn,{code:`// stores/entityStore.ts
import { createStore } from 'philjs-core';

interface Entity {
  id: string;
  [key: string]: any;
}

function createEntityStore<T extends Entity>() {
  const [store, setStore] = createStore<{
    byId: Record<string, T>;
    ids: string[];
    loading: boolean;
    error: string | null;
  }>({
    byId: {},
    ids: [],
    loading: false,
    error: null,
  });

  return {
    // Selectors
    getById: (id: string) => store.byId[id],
    getAll: () => store.ids.map(id => store.byId[id]),
    isLoading: () => store.loading,
    getError: () => store.error,

    // Actions
    setMany: (entities: T[]) => {
      const byId: Record<string, T> = {};
      const ids: string[] = [];
      entities.forEach(e => {
        byId[e.id] = e;
        ids.push(e.id);
      });
      setStore({ byId, ids, loading: false, error: null });
    },

    upsert: (entity: T) => {
      setStore('byId', entity.id, entity);
      if (!store.ids.includes(entity.id)) {
        setStore('ids', ids => [...ids, entity.id]);
      }
    },

    remove: (id: string) => {
      setStore('ids', ids => ids.filter(i => i !== id));
      setStore('byId', id, undefined as any);
    },

    setLoading: (loading: boolean) => setStore('loading', loading),
    setError: (error: string | null) => setStore('error', error),
  };
}

// Usage
const usersStore = createEntityStore<User>();

// Fetch and populate
async function fetchUsers() {
  usersStore.setLoading(true);
  try {
    const users = await api.getUsers();
    usersStore.setMany(users);
  } catch (e) {
    usersStore.setError(e.message);
  }
}`,language:"typescript",filename:"entityStore.ts"}),r.jsx("h2",{id:"async-state",children:"Async State with Resources"}),(0,r.jsxs)("p",{children:["Use ",r.jsx("code",{children:"createResource"})," for async data fetching with built-in loading and error states:"]}),r.jsx(i.dn,{code:`import { createResource, createSignal, Suspense, ErrorBoundary } from 'philjs-core';

// Fetch function
const fetchUser = async (id: string): Promise<User> => {
  const res = await fetch(\`/api/users/\${id}\`);
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
};

function UserProfile() {
  const [userId, setUserId] = createSignal('1');

  // Resource automatically refetches when userId changes
  const [user, { refetch, mutate }] = createResource(userId, fetchUser);

  return (
    <div>
      <select onChange={(e) => setUserId(e.target.value)}>
        <option value="1">User 1</option>
        <option value="2">User 2</option>
      </select>

      <Suspense fallback={<div>Loading...</div>}>
        <ErrorBoundary fallback={(err) => <div>Error: {err.message}</div>}>
          <Show when={user()}>
            {(u) => (
              <div>
                <h2>{u.name}</h2>
                <p>{u.email}</p>
                <button onClick={refetch}>Refresh</button>
              </div>
            )}
          </Show>
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}`,language:"tsx",filename:"UserProfile.tsx"}),r.jsx("h3",{id:"optimistic-updates",children:"Optimistic Updates"}),r.jsx(i.dn,{code:`import { createResource } from 'philjs-core';

function TodoItem({ todo }: { todo: Todo }) {
  const [, { mutate }] = createResource(() => todo);

  const toggleComplete = async () => {
    // Optimistically update the UI
    const previous = todo;
    mutate({ ...todo, completed: !todo.completed });

    try {
      await api.updateTodo(todo.id, { completed: !todo.completed });
    } catch (e) {
      // Rollback on error
      mutate(previous);
      toast.error('Failed to update todo');
    }
  };

  return (
    <label>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={toggleComplete}
      />
      {todo.text}
    </label>
  );
}`,language:"tsx",filename:"OptimisticUpdate.tsx"}),r.jsx("h2",{id:"state-machines",children:"State Machines"}),r.jsx("p",{children:"For complex UI logic, use state machines to make state transitions explicit:"}),r.jsx(i.dn,{code:`import { createSignal, createMemo } from 'philjs-core';

type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function createFetchMachine<T>(fetcher: () => Promise<T>) {
  const [state, setState] = createSignal<FetchState<T>>({ status: 'idle' });

  const execute = async () => {
    setState({ status: 'loading' });
    try {
      const data = await fetcher();
      setState({ status: 'success', data });
    } catch (error) {
      setState({ status: 'error', error: error as Error });
    }
  };

  const reset = () => setState({ status: 'idle' });

  // Derived states
  const isIdle = createMemo(() => state().status === 'idle');
  const isLoading = createMemo(() => state().status === 'loading');
  const isSuccess = createMemo(() => state().status === 'success');
  const isError = createMemo(() => state().status === 'error');
  const data = createMemo(() =>
    state().status === 'success' ? state().data : undefined
  );
  const error = createMemo(() =>
    state().status === 'error' ? state().error : undefined
  );

  return {
    state,
    execute,
    reset,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    data,
    error,
  };
}

// Usage
function DataComponent() {
  const machine = createFetchMachine(() => fetch('/api/data').then(r => r.json()));

  return (
    <div>
      <Switch>
        <Match when={machine.isIdle()}>
          <button onClick={machine.execute}>Load Data</button>
        </Match>
        <Match when={machine.isLoading()}>
          <Spinner />
        </Match>
        <Match when={machine.isError()}>
          <div>
            Error: {machine.error()?.message}
            <button onClick={machine.execute}>Retry</button>
          </div>
        </Match>
        <Match when={machine.isSuccess()}>
          <DataDisplay data={machine.data()} />
        </Match>
      </Switch>
    </div>
  );
}`,language:"tsx",filename:"StateMachine.tsx"}),r.jsx(o.U,{type:"info",title:"Best Practices",children:(0,r.jsxs)("ul",{className:"list-disc list-inside space-y-1",children:[r.jsx("li",{children:"Keep signals as the source of truth, derive everything else"}),r.jsx("li",{children:"Use stores for complex nested state"}),r.jsx("li",{children:"Use context for dependency injection, not global state"}),r.jsx("li",{children:"Prefer composition over complex single stores"}),r.jsx("li",{children:"Consider state machines for complex UI flows"})]})}),r.jsx("h2",{id:"next-steps",children:"Next Steps"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,r.jsxs)(a.default,{href:"/docs/core-concepts/signals",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Signals Deep Dive"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Detailed documentation on the signals API"})]}),(0,r.jsxs)(a.default,{href:"/docs/core-concepts/stores",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Stores Deep Dive"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Advanced patterns with nested reactive stores"})]})]})]})}},2108:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>n});var r=s(9015),i=s(1471);let o=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),a=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function n({children:e}){return r.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,r.jsxs)("div",{className:"flex gap-12",children:[r.jsx(a,{sections:o}),r.jsx("main",{className:"flex-1 min-w-0",children:r.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}},3288:(e,t,s)=>{"use strict";s.d(t,{dn:()=>i,oI:()=>o});var r=s(1471);let i=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#CodeBlock`);(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#InlineCode`);let o=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#Terminal`)}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[732,6314,9858],()=>s(334));module.exports=r})();