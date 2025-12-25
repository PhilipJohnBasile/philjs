2:I[8850,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","342","static/chunks/app/docs/core-concepts/stores/page-b2071cc091dc1630.js"],"CodeBlock"]
3:I[7696,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","342","static/chunks/app/docs/core-concepts/stores/page-b2071cc091dc1630.js"],"Callout"]
6:I[6542,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","342","static/chunks/app/docs/core-concepts/stores/page-b2071cc091dc1630.js"],""]
7:I[6419,[],""]
8:I[8445,[],""]
9:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"Sidebar"]
a:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"docsNavigation"]
b:I[1229,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"ThemeProvider"]
c:I[8529,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"Header"]
4:T5da,import { createContext, useContext } from 'philjs-core';

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
}5:T665,function RegistrationForm() {
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
}0:["cd22Ei08xvul0IDkb5kRy",[[["",{"children":["docs",{"children":["core-concepts",{"children":["stores",{"children":["__PAGE__",{}]}]}]}]},"$undefined","$undefined",true],["",{"children":["docs",{"children":["core-concepts",{"children":["stores",{"children":["__PAGE__",{},[["$L1",["$","div",null,{"className":"mdx-content","children":[["$","h1",null,{"children":"Stores"}],["$","p",null,{"className":"lead text-xl text-surface-600 dark:text-surface-400","children":"Stores provide fine-grained reactive state management for complex nested data structures."}],["$","h2",null,{"id":"why-stores","children":"Why Use Stores?"}],["$","p",null,{"children":"While signals work great for primitive values, stores excel at managing complex objects with nested reactivity:"}],["$","ul",null,{"children":[["$","li",null,{"children":"Fine-grained updates to nested properties"}],["$","li",null,{"children":"Immutable update patterns"}],["$","li",null,{"children":"Path-based access and updates"}],["$","li",null,{"children":"Array and object manipulation helpers"}]]}],["$","h2",null,{"id":"create-store","children":"createStore"}],["$","$L2",null,{"code":"import { createStore } from 'philjs-core';\n\nconst [state, setState] = createStore({\n  user: {\n    name: 'Alice',\n    age: 30,\n    preferences: {\n      theme: 'dark',\n      notifications: true,\n    },\n  },\n  todos: [\n    { id: 1, text: 'Learn PhilJS', completed: false },\n    { id: 2, text: 'Build app', completed: false },\n  ],\n});\n\n// Read values\nconsole.log(state.user.name); // 'Alice'\nconsole.log(state.todos[0].text); // 'Learn PhilJS'","language":"typescript"}],["$","$L3",null,{"type":"info","title":"Proxies","children":"Stores use JavaScript Proxies to track property access and enable fine-grained reactivity."}],["$","h2",null,{"id":"updating-stores","children":"Updating Stores"}],["$","h3",null,{"children":"Simple Updates"}],["$","$L2",null,{"code":"// Update top-level property\nsetState('user', { name: 'Bob', age: 25, preferences: {...} });\n\n// Update nested property\nsetState('user', 'name', 'Bob');\nsetState('user', 'age', 31);\n\n// Update deeply nested\nsetState('user', 'preferences', 'theme', 'light');","language":"typescript"}],["$","h3",null,{"children":"Function Updates"}],["$","$L2",null,{"code":"// Update based on previous value\nsetState('user', 'age', age => age + 1);\n\n// Update with path\nsetState('user', 'preferences', prefs => ({\n  ...prefs,\n  notifications: false,\n}));","language":"typescript"}],["$","h3",null,{"children":"Multiple Updates"}],["$","$L2",null,{"code":"// Update multiple properties at once\nsetState({\n  user: {\n    ...state.user,\n    name: 'Charlie',\n    age: 35,\n  },\n});\n\n// Or using the produce pattern\nimport { produce } from 'philjs-core';\n\nsetState(produce(draft => {\n  draft.user.name = 'Charlie';\n  draft.user.age = 35;\n  draft.todos.push({ id: 3, text: 'New todo', completed: false });\n}));","language":"typescript"}],["$","h2",null,{"id":"array-updates","children":"Array Updates"}],["$","$L2",null,{"code":"const [state, setState] = createStore({\n  todos: [\n    { id: 1, text: 'First', completed: false },\n    { id: 2, text: 'Second', completed: true },\n  ],\n});\n\n// Add item\nsetState('todos', todos => [...todos, newTodo]);\n\n// Remove item\nsetState('todos', todos => todos.filter(t => t.id !== 1));\n\n// Update specific item\nsetState('todos', 0, 'completed', true);\n\n// Update item by condition\nsetState(\n  'todos',\n  todo => todo.id === 2,\n  'text',\n  'Updated text'\n);\n\n// Batch array operations\nsetState('todos', produce(todos => {\n  todos.push(newTodo);\n  todos[0].completed = true;\n  todos.sort((a, b) => a.id - b.id);\n}));","language":"typescript"}],["$","h2",null,{"id":"reconcile","children":"Reconcile for Immutable Updates"}],["$","$L2",null,{"code":"import { reconcile } from 'philjs-core';\n\n// Replace entire state while maintaining reactivity\nconst newData = await fetchData();\nsetState(reconcile(newData));\n\n// Reconcile nested object\nsetState('user', reconcile({\n  name: 'New Name',\n  age: 40,\n  preferences: { theme: 'dark', notifications: true },\n}));","language":"typescript"}],["$","$L3",null,{"type":"info","title":"Reconcile vs Replace","children":[["$","code",null,{"children":"reconcile"}]," intelligently merges new data, only updating changed values. This preserves references and minimizes reactive updates."]}],["$","h2",null,{"id":"store-patterns","children":"Common Patterns"}],["$","h3",null,{"children":"Global Store"}],["$","$L2",null,{"code":"// store.ts\nimport { createStore } from 'philjs-core';\n\ninterface AppState {\n  user: User | null;\n  theme: 'light' | 'dark';\n  notifications: Notification[];\n}\n\nexport const [appState, setAppState] = createStore<AppState>({\n  user: null,\n  theme: 'light',\n  notifications: [],\n});\n\n// Actions\nexport const actions = {\n  setUser(user: User | null) {\n    setAppState('user', user);\n  },\n\n  toggleTheme() {\n    setAppState('theme', theme =>\n      theme === 'light' ? 'dark' : 'light'\n    );\n  },\n\n  addNotification(notification: Notification) {\n    setAppState('notifications', notifications => [\n      ...notifications,\n      notification,\n    ]);\n  },\n\n  clearNotifications() {\n    setAppState('notifications', []);\n  },\n};\n\n// Usage\nimport { appState, actions } from './store';\n\nfunction App() {\n  return (\n    <div className={appState.theme}>\n      <Show when={appState.user}>\n        {user => <div>Welcome, {user.name}!</div>}\n      </Show>\n    </div>\n  );\n}","language":"typescript"}],["$","h3",null,{"children":"Store Context"}],["$","$L2",null,{"code":"$4","language":"typescript"}],["$","h3",null,{"children":"Form State"}],["$","$L2",null,{"code":"$5","language":"typescript"}],["$","h2",null,{"id":"selectors","children":"Memoized Selectors"}],["$","$L2",null,{"code":"const [state, setState] = createStore({\n  todos: [] as Todo[],\n  filter: 'all' as 'all' | 'active' | 'completed',\n});\n\n// Create memoized selectors\nconst filteredTodos = createMemo(() => {\n  const todos = state.todos;\n  const filter = state.filter;\n\n  switch (filter) {\n    case 'active':\n      return todos.filter(t => !t.completed);\n    case 'completed':\n      return todos.filter(t => t.completed);\n    default:\n      return todos;\n  }\n});\n\nconst activeTodoCount = createMemo(() =>\n  state.todos.filter(t => !t.completed).length\n);\n\nconst completedTodoCount = createMemo(() =>\n  state.todos.filter(t => t.completed).length\n);","language":"typescript"}],["$","h2",null,{"id":"performance","children":"Performance Tips"}],["$","ul",null,{"children":[["$","li",null,{"children":[["$","strong",null,{"children":"Use specific paths:"}]," Update only what changed"]}],["$","li",null,{"children":[["$","strong",null,{"children":"Batch updates:"}]," Use ",["$","code",null,{"children":"produce"}]," for multiple changes"]}],["$","li",null,{"children":[["$","strong",null,{"children":"Memoize selectors:"}]," Don't recompute derived state unnecessarily"]}],["$","li",null,{"children":[["$","strong",null,{"children":"Use reconcile for API data:"}]," Efficient immutable updates"]}]]}],["$","$L2",null,{"code":"// Bad: Triggers multiple updates\nsetState('user', 'name', 'Alice');\nsetState('user', 'age', 30);\nsetState('user', 'email', 'alice@example.com');\n\n// Good: Single update\nsetState(produce(draft => {\n  draft.user.name = 'Alice';\n  draft.user.age = 30;\n  draft.user.email = 'alice@example.com';\n}));","language":"typescript"}],["$","h2",null,{"id":"typescript","children":"TypeScript Support"}],["$","$L2",null,{"code":"interface User {\n  id: number;\n  name: string;\n  profile: {\n    bio: string;\n    avatar: string;\n  };\n}\n\ninterface AppState {\n  users: User[];\n  currentUserId: number | null;\n}\n\nconst [state, setState] = createStore<AppState>({\n  users: [],\n  currentUserId: null,\n});\n\n// Fully typed updates\nsetState('users', 0, 'profile', 'bio', 'New bio');\n\n// TypeScript catches errors\nsetState('users', 0, 'invalid', 'value'); // Error!","language":"typescript"}],["$","h2",null,{"id":"best-practices","children":"Best Practices"}],["$","ol",null,{"children":[["$","li",null,{"children":[["$","strong",null,{"children":"Use stores for complex state:"}]," Simple values work fine with signals"]}],["$","li",null,{"children":[["$","strong",null,{"children":"Keep stores normalized:"}]," Avoid deep nesting when possible"]}],["$","li",null,{"children":[["$","strong",null,{"children":"Create action creators:"}]," Encapsulate update logic"]}],["$","li",null,{"children":[["$","strong",null,{"children":"Use context for component stores:"}]," Avoid global state when not needed"]}],["$","li",null,{"children":[["$","strong",null,{"children":"Memoize expensive selectors:"}]," Cache computed values"]}]]}],["$","h2",null,{"id":"next-steps","children":"Next Steps"}],["$","div",null,{"className":"grid md:grid-cols-2 gap-4 mt-6 not-prose","children":[["$","$L6",null,{"href":"/docs/core-concepts/ssr","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"Server-Side Rendering"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Learn about SSR and hydration"}]]}],["$","$L6",null,{"href":"/docs/guides/state","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"State Management Guide"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Advanced state management patterns"}]]}]]}]]}],null],null],null]},[null,["$","$L7",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","core-concepts","children","stores","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[null,["$","$L7",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","core-concepts","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[[null,["$","div",null,{"className":"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8","children":["$","div",null,{"className":"flex gap-12","children":[["$","$L9",null,{"sections":"$a"}],["$","main",null,{"className":"flex-1 min-w-0","children":["$","article",null,{"className":"prose prose-surface dark:prose-invert max-w-none","children":["$","$L7",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]}]}]]}]}]],null],null]},[[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/00bb994365e07be9.css","precedence":"next","crossOrigin":"$undefined"}]],["$","html",null,{"lang":"en","suppressHydrationWarning":true,"children":["$","body",null,{"className":"__variable_f367f3 __variable_3c557b font-sans antialiased","children":["$","$Lb",null,{"children":["$","div",null,{"className":"min-h-screen bg-white dark:bg-surface-950","children":[["$","$Lc",null,{}],["$","$L7",null,{"parallelRouterKey":"children","segmentPath":["children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":"404"}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],"notFoundStyles":[]}]]}]}]}]}]],null],null],["$Ld",null]]]]
d:[["$","meta","0",{"name":"viewport","content":"width=device-width, initial-scale=1"}],["$","meta","1",{"charSet":"utf-8"}],["$","title","2",{"children":"Stores - Core Concepts | PhilJS"}],["$","meta","3",{"name":"description","content":"Learn how to manage complex nested state with PhilJS stores and fine-grained reactivity."}],["$","meta","4",{"name":"author","content":"PhilJS Team"}],["$","link","5",{"rel":"manifest","href":"/site.webmanifest","crossOrigin":"use-credentials"}],["$","meta","6",{"name":"keywords","content":"philjs,javascript,typescript,rust,framework,signals,reactivity,wasm"}],["$","meta","7",{"property":"og:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","8",{"property":"og:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","9",{"property":"og:url","content":"https://philjs.dev/"}],["$","meta","10",{"property":"og:site_name","content":"PhilJS"}],["$","meta","11",{"property":"og:locale","content":"en_US"}],["$","meta","12",{"property":"og:image","content":"https://philjs.dev/og-image.png"}],["$","meta","13",{"property":"og:image:width","content":"1200"}],["$","meta","14",{"property":"og:image:height","content":"630"}],["$","meta","15",{"property":"og:image:alt","content":"PhilJS Framework"}],["$","meta","16",{"property":"og:type","content":"website"}],["$","meta","17",{"name":"twitter:card","content":"summary_large_image"}],["$","meta","18",{"name":"twitter:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","19",{"name":"twitter:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","20",{"name":"twitter:image","content":"https://philjs.dev/og-image.png"}],["$","link","21",{"rel":"shortcut icon","href":"/favicon-16x16.png"}],["$","link","22",{"rel":"icon","href":"/favicon.ico"}],["$","link","23",{"rel":"apple-touch-icon","href":"/apple-touch-icon.png"}]]
1:null
