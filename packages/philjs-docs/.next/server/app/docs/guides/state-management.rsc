2:I[8850,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","453","static/chunks/app/docs/guides/state-management/page-0ed115bbb628d57f.js"],"CodeBlock"]
8:I[7696,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","453","static/chunks/app/docs/guides/state-management/page-0ed115bbb628d57f.js"],"Callout"]
9:I[6542,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","453","static/chunks/app/docs/guides/state-management/page-0ed115bbb628d57f.js"],""]
a:I[6419,[],""]
b:I[8445,[],""]
c:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"Sidebar"]
d:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"docsNavigation"]
e:I[1229,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"ThemeProvider"]
f:I[8529,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"Header"]
3:T5b1,import { createContext, useContext, createSignal } from 'philjs-core';

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
}4:T521,// stores/appStore.ts
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
}5:T64c,// stores/entityStore.ts
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
}6:T45c,import { createResource, createSignal, Suspense, ErrorBoundary } from 'philjs-core';

// Fetch function
const fetchUser = async (id: string): Promise<User> => {
  const res = await fetch(`/api/users/${id}`);
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
}7:T7a0,import { createSignal, createMemo } from 'philjs-core';

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
}0:["cd22Ei08xvul0IDkb5kRy",[[["",{"children":["docs",{"children":["guides",{"children":["state-management",{"children":["__PAGE__",{}]}]}]}]},"$undefined","$undefined",true],["",{"children":["docs",{"children":["guides",{"children":["state-management",{"children":["__PAGE__",{},[["$L1",["$","div",null,{"className":"mdx-content","children":[["$","h1",null,{"children":"State Management"}],["$","p",null,{"className":"lead text-xl text-surface-600 dark:text-surface-400","children":"PhilJS provides fine-grained reactivity with signals, stores, and context for managing state at every level of your application."}],["$","h2",null,{"id":"signals","children":"Signals: The Foundation"}],["$","p",null,{"children":"Signals are reactive primitives that hold a value and notify subscribers when it changes. They're the building blocks of all state in PhilJS:"}],["$","$L2",null,{"code":"import { createSignal, createEffect } from 'philjs-core';\n\n// Create a signal with initial value\nconst [count, setCount] = createSignal(0);\n\n// Read the current value\nconsole.log(count()); // 0\n\n// Update the value\nsetCount(1);\nsetCount(prev => prev + 1);\n\n// Effects automatically track and re-run when dependencies change\ncreateEffect(() => {\n  console.log('Count is now:', count());\n});","language":"typescript","filename":"signals-basics.ts"}],["$","h3",null,{"id":"derived-state","children":"Derived State with Memos"}],["$","p",null,{"children":["Use ",["$","code",null,{"children":"createMemo"}]," for derived values that cache their result:"]}],["$","$L2",null,{"code":"import { createSignal, createMemo } from 'philjs-core';\n\nconst [items, setItems] = createSignal<Item[]>([]);\nconst [filter, setFilter] = createSignal<'all' | 'active' | 'completed'>('all');\n\n// Computed value - only recalculates when items or filter changes\nconst filteredItems = createMemo(() => {\n  const f = filter();\n  return items().filter(item => {\n    if (f === 'active') return !item.completed;\n    if (f === 'completed') return item.completed;\n    return true;\n  });\n});\n\n// Statistics derived from items\nconst stats = createMemo(() => ({\n  total: items().length,\n  active: items().filter(i => !i.completed).length,\n  completed: items().filter(i => i.completed).length,\n}));","language":"typescript","filename":"derived-state.ts"}],["$","h2",null,{"id":"stores","children":"Stores: Nested Reactive State"}],["$","p",null,{"children":["For complex nested state, use ",["$","code",null,{"children":"createStore"}]," which provides fine-grained reactivity at any depth:"]}],["$","$L2",null,{"code":"import { createStore } from 'philjs-core';\n\ninterface AppState {\n  user: {\n    name: string;\n    preferences: {\n      theme: 'light' | 'dark';\n      notifications: boolean;\n    };\n  };\n  todos: Array<{\n    id: number;\n    text: string;\n    completed: boolean;\n  }>;\n}\n\nconst [state, setState] = createStore<AppState>({\n  user: {\n    name: 'John',\n    preferences: {\n      theme: 'light',\n      notifications: true,\n    },\n  },\n  todos: [],\n});\n\n// Read nested values\nconsole.log(state.user.preferences.theme);\n\n// Update nested values - only components using this path re-render\nsetState('user', 'preferences', 'theme', 'dark');\n\n// Update array items\nsetState('todos', todo => todo.id === 1, 'completed', true);\n\n// Add to arrays\nsetState('todos', todos => [...todos, { id: 2, text: 'New', completed: false }]);\n\n// Batch multiple updates\nsetState(state => ({\n  ...state,\n  user: {\n    ...state.user,\n    name: 'Jane',\n  },\n}));","language":"typescript","filename":"stores.ts"}],["$","h3",null,{"id":"store-utilities","children":"Store Utilities"}],["$","$L2",null,{"code":"import { createStore, produce, reconcile } from 'philjs-core';\n\nconst [state, setState] = createStore({ items: [] });\n\n// Use produce for immutable updates with mutable syntax\nsetState(produce(draft => {\n  draft.items.push({ id: 1, name: 'New Item' });\n  draft.items[0].name = 'Updated';\n}));\n\n// Use reconcile to diff and update efficiently\nconst newData = await fetchItems();\nsetState('items', reconcile(newData));","language":"typescript","filename":"store-utilities.ts"}],["$","h2",null,{"id":"context","children":"Context: Dependency Injection"}],["$","p",null,{"children":"Use context to pass state down the component tree without prop drilling:"}],["$","$L2",null,{"code":"$3","language":"tsx","filename":"AuthContext.tsx"}],["$","h2",null,{"id":"global-state","children":"Global State Patterns"}],["$","h3",null,{"id":"singleton-store","children":"Singleton Store"}],["$","p",null,{"children":"For truly global state, create a singleton store outside components:"}],["$","$L2",null,{"code":"$4","language":"typescript","filename":"appStore.ts"}],["$","h3",null,{"id":"entity-store","children":"Entity Store Pattern"}],["$","$L2",null,{"code":"$5","language":"typescript","filename":"entityStore.ts"}],["$","h2",null,{"id":"async-state","children":"Async State with Resources"}],["$","p",null,{"children":["Use ",["$","code",null,{"children":"createResource"}]," for async data fetching with built-in loading and error states:"]}],["$","$L2",null,{"code":"$6","language":"tsx","filename":"UserProfile.tsx"}],["$","h3",null,{"id":"optimistic-updates","children":"Optimistic Updates"}],["$","$L2",null,{"code":"import { createResource } from 'philjs-core';\n\nfunction TodoItem({ todo }: { todo: Todo }) {\n  const [, { mutate }] = createResource(() => todo);\n\n  const toggleComplete = async () => {\n    // Optimistically update the UI\n    const previous = todo;\n    mutate({ ...todo, completed: !todo.completed });\n\n    try {\n      await api.updateTodo(todo.id, { completed: !todo.completed });\n    } catch (e) {\n      // Rollback on error\n      mutate(previous);\n      toast.error('Failed to update todo');\n    }\n  };\n\n  return (\n    <label>\n      <input\n        type=\"checkbox\"\n        checked={todo.completed}\n        onChange={toggleComplete}\n      />\n      {todo.text}\n    </label>\n  );\n}","language":"tsx","filename":"OptimisticUpdate.tsx"}],["$","h2",null,{"id":"state-machines","children":"State Machines"}],["$","p",null,{"children":"For complex UI logic, use state machines to make state transitions explicit:"}],["$","$L2",null,{"code":"$7","language":"tsx","filename":"StateMachine.tsx"}],["$","$L8",null,{"type":"info","title":"Best Practices","children":["$","ul",null,{"className":"list-disc list-inside space-y-1","children":[["$","li",null,{"children":"Keep signals as the source of truth, derive everything else"}],["$","li",null,{"children":"Use stores for complex nested state"}],["$","li",null,{"children":"Use context for dependency injection, not global state"}],["$","li",null,{"children":"Prefer composition over complex single stores"}],["$","li",null,{"children":"Consider state machines for complex UI flows"}]]}]}],["$","h2",null,{"id":"next-steps","children":"Next Steps"}],["$","div",null,{"className":"grid md:grid-cols-2 gap-4 mt-6 not-prose","children":[["$","$L9",null,{"href":"/docs/core-concepts/signals","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"Signals Deep Dive"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Detailed documentation on the signals API"}]]}],["$","$L9",null,{"href":"/docs/core-concepts/stores","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"Stores Deep Dive"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Advanced patterns with nested reactive stores"}]]}]]}]]}],null],null],null]},[null,["$","$La",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","guides","children","state-management","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lb",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[null,["$","$La",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","guides","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lb",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[[null,["$","div",null,{"className":"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8","children":["$","div",null,{"className":"flex gap-12","children":[["$","$Lc",null,{"sections":"$d"}],["$","main",null,{"className":"flex-1 min-w-0","children":["$","article",null,{"className":"prose prose-surface dark:prose-invert max-w-none","children":["$","$La",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lb",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]}]}]]}]}]],null],null]},[[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/00bb994365e07be9.css","precedence":"next","crossOrigin":"$undefined"}]],["$","html",null,{"lang":"en","suppressHydrationWarning":true,"children":["$","body",null,{"className":"__variable_f367f3 __variable_3c557b font-sans antialiased","children":["$","$Le",null,{"children":["$","div",null,{"className":"min-h-screen bg-white dark:bg-surface-950","children":[["$","$Lf",null,{}],["$","$La",null,{"parallelRouterKey":"children","segmentPath":["children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lb",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":"404"}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],"notFoundStyles":[]}]]}]}]}]}]],null],null],["$L10",null]]]]
10:[["$","meta","0",{"name":"viewport","content":"width=device-width, initial-scale=1"}],["$","meta","1",{"charSet":"utf-8"}],["$","title","2",{"children":"State Management Guide | PhilJS"}],["$","meta","3",{"name":"description","content":"Advanced state management patterns in PhilJS with signals, stores, and context."}],["$","meta","4",{"name":"author","content":"PhilJS Team"}],["$","link","5",{"rel":"manifest","href":"/site.webmanifest","crossOrigin":"use-credentials"}],["$","meta","6",{"name":"keywords","content":"philjs,javascript,typescript,rust,framework,signals,reactivity,wasm"}],["$","meta","7",{"property":"og:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","8",{"property":"og:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","9",{"property":"og:url","content":"https://philjs.dev/"}],["$","meta","10",{"property":"og:site_name","content":"PhilJS"}],["$","meta","11",{"property":"og:locale","content":"en_US"}],["$","meta","12",{"property":"og:image","content":"https://philjs.dev/og-image.png"}],["$","meta","13",{"property":"og:image:width","content":"1200"}],["$","meta","14",{"property":"og:image:height","content":"630"}],["$","meta","15",{"property":"og:image:alt","content":"PhilJS Framework"}],["$","meta","16",{"property":"og:type","content":"website"}],["$","meta","17",{"name":"twitter:card","content":"summary_large_image"}],["$","meta","18",{"name":"twitter:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","19",{"name":"twitter:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","20",{"name":"twitter:image","content":"https://philjs.dev/og-image.png"}],["$","link","21",{"rel":"shortcut icon","href":"/favicon-16x16.png"}],["$","link","22",{"rel":"icon","href":"/favicon.ico"}],["$","link","23",{"rel":"apple-touch-icon","href":"/apple-touch-icon.png"}]]
1:null
