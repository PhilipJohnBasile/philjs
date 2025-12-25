2:I[8850,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","698","static/chunks/app/docs/tutorials/migration-from-react/page-bd2e48cd4afbba8e.js"],"CodeBlock"]
3:I[7696,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","698","static/chunks/app/docs/tutorials/migration-from-react/page-bd2e48cd4afbba8e.js"],"Callout"]
6:I[6542,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","698","static/chunks/app/docs/tutorials/migration-from-react/page-bd2e48cd4afbba8e.js"],""]
7:I[6419,[],""]
8:I[8445,[],""]
9:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"Sidebar"]
a:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"docsNavigation"]
b:I[1229,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"ThemeProvider"]
c:I[8529,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"Header"]
4:T70d,import { useState, useCallback } from 'react';

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
}5:T733,import { createSignal, createMemo, For } from 'philjs-core';

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
}0:["cd22Ei08xvul0IDkb5kRy",[[["",{"children":["docs",{"children":["tutorials",{"children":["migration-from-react",{"children":["__PAGE__",{}]}]}]}]},"$undefined","$undefined",true],["",{"children":["docs",{"children":["tutorials",{"children":["migration-from-react",{"children":["__PAGE__",{},[["$L1",["$","div",null,{"className":"mdx-content","children":[["$","h1",null,{"children":"Migration from React"}],["$","p",null,{"className":"lead text-xl text-surface-600 dark:text-surface-400","children":"Step-by-step guide to migrating your React applications to PhilJS with comparison examples and migration strategies."}],["$","h2",null,{"id":"why-migrate","children":"Why Migrate to PhilJS?"}],["$","ul",null,{"children":[["$","li",null,{"children":[["$","strong",null,{"children":"Performance:"}]," Fine-grained reactivity means no virtual DOM diffing"]}],["$","li",null,{"children":[["$","strong",null,{"children":"Bundle Size:"}]," Smaller bundles without runtime overhead"]}],["$","li",null,{"children":[["$","strong",null,{"children":"Developer Experience:"}]," Simpler mental model, less boilerplate"]}],["$","li",null,{"children":[["$","strong",null,{"children":"Type Safety:"}]," Better TypeScript integration with signal types"]}],["$","li",null,{"children":[["$","strong",null,{"children":"Flexibility:"}]," Choose between CSR, SSR, or Islands architecture"]}]]}],["$","h2",null,{"id":"comparison","children":"Key Differences"}],["$","h3",null,{"children":"State Management"}],["$","div",null,{"className":"grid md:grid-cols-2 gap-4 not-prose mb-6","children":[["$","div",null,{"children":[["$","p",null,{"className":"font-semibold mb-2","children":"React"}],["$","$L2",null,{"code":"function Counter() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <button onClick={() => setCount(count + 1)}>\n      Count: {count}\n    </button>\n  );\n}","language":"typescript"}]]}],["$","div",null,{"children":[["$","p",null,{"className":"font-semibold mb-2","children":"PhilJS"}],["$","$L2",null,{"code":"function Counter() {\n  const [count, setCount] = createSignal(0);\n\n  return (\n    <button onClick={() => setCount(c => c + 1)}>\n      Count: {count()}\n    </button>\n  );\n}","language":"typescript"}]]}]]}],["$","h3",null,{"children":"Effects"}],["$","div",null,{"className":"grid md:grid-cols-2 gap-4 not-prose mb-6","children":[["$","div",null,{"children":[["$","p",null,{"className":"font-semibold mb-2","children":"React"}],["$","$L2",null,{"code":"useEffect(() => {\n  console.log('Count:', count);\n}, [count]);\n\nuseEffect(() => {\n  // Runs once on mount\n  fetchData();\n}, []);","language":"typescript"}]]}],["$","div",null,{"children":[["$","p",null,{"className":"font-semibold mb-2","children":"PhilJS"}],["$","$L2",null,{"code":"createEffect(() => {\n  console.log('Count:', count());\n});\n\nonMount(() => {\n  // Runs once on mount\n  fetchData();\n});","language":"typescript"}]]}]]}],["$","$L3",null,{"type":"info","title":"Auto-tracking","children":"PhilJS effects automatically track dependencies. No dependency array needed!"}],["$","h3",null,{"children":"Computed Values"}],["$","div",null,{"className":"grid md:grid-cols-2 gap-4 not-prose mb-6","children":[["$","div",null,{"children":[["$","p",null,{"className":"font-semibold mb-2","children":"React"}],["$","$L2",null,{"code":"const doubled = useMemo(\n  () => count * 2,\n  [count]\n);","language":"typescript"}]]}],["$","div",null,{"children":[["$","p",null,{"className":"font-semibold mb-2","children":"PhilJS"}],["$","$L2",null,{"code":"const doubled = createMemo(\n  () => count() * 2\n);","language":"typescript"}]]}]]}],["$","h3",null,{"children":"Conditional Rendering"}],["$","div",null,{"className":"grid md:grid-cols-2 gap-4 not-prose mb-6","children":[["$","div",null,{"children":[["$","p",null,{"className":"font-semibold mb-2","children":"React"}],["$","$L2",null,{"code":"{isLoggedIn ? (\n  <Dashboard />\n) : (\n  <LoginForm />\n)}\n\n{messages.length > 0 && (\n  <MessageList messages={messages} />\n)}","language":"typescript"}]]}],["$","div",null,{"children":[["$","p",null,{"className":"font-semibold mb-2","children":"PhilJS"}],["$","$L2",null,{"code":"<Show\n  when={isLoggedIn()}\n  fallback={<LoginForm />}\n>\n  <Dashboard />\n</Show>\n\n<Show when={messages().length > 0}>\n  <MessageList messages={messages()} />\n</Show>","language":"typescript"}]]}]]}],["$","h3",null,{"children":"Lists"}],["$","div",null,{"className":"grid md:grid-cols-2 gap-4 not-prose mb-6","children":[["$","div",null,{"children":[["$","p",null,{"className":"font-semibold mb-2","children":"React"}],["$","$L2",null,{"code":"{items.map(item => (\n  <Item\n    key={item.id}\n    item={item}\n  />\n))}","language":"typescript"}]]}],["$","div",null,{"children":[["$","p",null,{"className":"font-semibold mb-2","children":"PhilJS"}],["$","$L2",null,{"code":"<For each={items()}>\n  {(item) => (\n    <Item item={item} />\n  )}\n</For>","language":"typescript"}]]}]]}],["$","h2",null,{"id":"migration-strategy","children":"Migration Strategy"}],["$","h3",null,{"children":"1. Incremental Migration"}],["$","p",null,{"children":"You can gradually migrate your React app by running PhilJS alongside React:"}],["$","$L2",null,{"code":"// Install PhilJS\nnpm install philjs-core philjs-router\n\n// In your existing React app\nimport { render } from 'philjs-core';\nimport { PhilJSComponent } from './PhilJSComponent';\n\nfunction App() {\n  return (\n    <div>\n      {/* Existing React code */}\n      <ReactComponent />\n\n      {/* New PhilJS component */}\n      <div ref={el => {\n        if (el) render(PhilJSComponent, el);\n      }} />\n    </div>\n  );\n}","language":"typescript"}],["$","h3",null,{"children":"2. Component-by-Component"}],["$","p",null,{"children":"Start with leaf components (no children) and work your way up:"}],["$","ol",null,{"children":[["$","li",null,{"children":"Identify components with no dependencies on React-specific features"}],["$","li",null,{"children":"Convert simple presentational components first"}],["$","li",null,{"children":"Move to components with state and effects"}],["$","li",null,{"children":"Convert context providers and consumers"}],["$","li",null,{"children":"Finally, convert routing and layout components"}]]}],["$","h2",null,{"id":"hooks-mapping","children":"Hooks Migration Guide"}],["$","table",null,{"children":[["$","thead",null,{"children":["$","tr",null,{"children":[["$","th",null,{"children":"React Hook"}],["$","th",null,{"children":"PhilJS Equivalent"}],["$","th",null,{"children":"Notes"}]]}]}],["$","tbody",null,{"children":[["$","tr",null,{"children":[["$","td",null,{"children":["$","code",null,{"children":"useState"}]}],["$","td",null,{"children":["$","code",null,{"children":"createSignal"}]}],["$","td",null,{"children":"Signals return getters/setters"}]]}],["$","tr",null,{"children":[["$","td",null,{"children":["$","code",null,{"children":"useEffect"}]}],["$","td",null,{"children":["$","code",null,{"children":"createEffect"}]}],["$","td",null,{"children":"Auto-tracks dependencies"}]]}],["$","tr",null,{"children":[["$","td",null,{"children":["$","code",null,{"children":"useMemo"}]}],["$","td",null,{"children":["$","code",null,{"children":"createMemo"}]}],["$","td",null,{"children":"Auto-tracks dependencies"}]]}],["$","tr",null,{"children":[["$","td",null,{"children":["$","code",null,{"children":"useCallback"}]}],["$","td",null,{"children":"Not needed"}],["$","td",null,{"children":"Functions are stable by default"}]]}],["$","tr",null,{"children":[["$","td",null,{"children":["$","code",null,{"children":"useRef"}]}],["$","td",null,{"children":["$","code",null,{"children":"let variable"}]}],["$","td",null,{"children":"Regular variables work fine"}]]}],["$","tr",null,{"children":[["$","td",null,{"children":["$","code",null,{"children":"useContext"}]}],["$","td",null,{"children":["$","code",null,{"children":"useContext"}]}],["$","td",null,{"children":["Similar API, use with ",["$","code",null,{"children":"provide_context"}]]}]]}],["$","tr",null,{"children":[["$","td",null,{"children":["$","code",null,{"children":"useReducer"}]}],["$","td",null,{"children":["$","code",null,{"children":"createStore"}]}],["$","td",null,{"children":"More powerful with nested reactivity"}]]}]]}]]}],["$","h2",null,{"id":"patterns","children":"Common Patterns"}],["$","h3",null,{"children":"Custom Hooks"}],["$","div",null,{"className":"grid md:grid-cols-2 gap-4 not-prose mb-6","children":[["$","div",null,{"children":[["$","p",null,{"className":"font-semibold mb-2","children":"React"}],["$","$L2",null,{"code":"function useCounter(initial = 0) {\n  const [count, setCount] = useState(initial);\n\n  const increment = useCallback(() => {\n    setCount(c => c + 1);\n  }, []);\n\n  return { count, increment };\n}\n\n// Usage\nconst { count, increment } = useCounter();","language":"typescript"}]]}],["$","div",null,{"children":[["$","p",null,{"className":"font-semibold mb-2","children":"PhilJS"}],["$","$L2",null,{"code":"function createCounter(initial = 0) {\n  const [count, setCount] = createSignal(initial);\n\n  const increment = () => {\n    setCount(c => c + 1);\n  };\n\n  return { count, increment };\n}\n\n// Usage\nconst { count, increment } = createCounter();","language":"typescript"}]]}]]}],["$","h3",null,{"children":"Context"}],["$","div",null,{"className":"grid md:grid-cols-2 gap-4 not-prose mb-6","children":[["$","div",null,{"children":[["$","p",null,{"className":"font-semibold mb-2","children":"React"}],["$","$L2",null,{"code":"const ThemeContext = createContext();\n\nfunction App() {\n  const [theme, setTheme] = useState('light');\n\n  return (\n    <ThemeContext.Provider value={{ theme, setTheme }}>\n      <Child />\n    </ThemeContext.Provider>\n  );\n}\n\nfunction Child() {\n  const { theme } = useContext(ThemeContext);\n  return <div>{theme}</div>;\n}","language":"typescript"}]]}],["$","div",null,{"children":[["$","p",null,{"className":"font-semibold mb-2","children":"PhilJS"}],["$","$L2",null,{"code":"const ThemeContext = createContext();\n\nfunction App() {\n  const [theme, setTheme] = createSignal('light');\n\n  provide_context(ThemeContext, { theme, setTheme });\n\n  return <Child />;\n}\n\nfunction Child() {\n  const { theme } = useContext(ThemeContext);\n  return <div>{theme()}</div>;\n}","language":"typescript"}]]}]]}],["$","h3",null,{"children":"Data Fetching"}],["$","div",null,{"className":"grid md:grid-cols-2 gap-4 not-prose mb-6","children":[["$","div",null,{"children":[["$","p",null,{"className":"font-semibold mb-2","children":"React"}],["$","$L2",null,{"code":"function UserProfile({ userId }) {\n  const [user, setUser] = useState(null);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState(null);\n\n  useEffect(() => {\n    setLoading(true);\n    fetch(`/api/users/${userId}`)\n      .then(res => res.json())\n      .then(setUser)\n      .catch(setError)\n      .finally(() => setLoading(false));\n  }, [userId]);\n\n  if (loading) return <Spinner />;\n  if (error) return <Error error={error} />;\n  return <div>{user.name}</div>;\n}","language":"typescript"}]]}],["$","div",null,{"children":[["$","p",null,{"className":"font-semibold mb-2","children":"PhilJS"}],["$","$L2",null,{"code":"function UserProfile(props) {\n  const [user] = createResource(\n    () => props.userId,\n    (id) => fetch(`/api/users/${id}`)\n      .then(res => res.json())\n  );\n\n  return (\n    <Show\n      when={!user.loading}\n      fallback={<Spinner />}\n    >\n      <Show\n        when={!user.error}\n        fallback={<Error error={user.error} />}\n      >\n        <div>{user()?.name}</div>\n      </Show>\n    </Show>\n  );\n}","language":"typescript"}]]}]]}],["$","h2",null,{"id":"tooling","children":"Tooling Migration"}],["$","h3",null,{"children":"Package.json Updates"}],["$","$L2",null,{"code":"{\n  \"dependencies\": {\n    // Remove React\n    // \"react\": \"^18.2.0\",\n    // \"react-dom\": \"^18.2.0\",\n\n    // Add PhilJS\n    \"philjs-core\": \"^1.0.0\",\n    \"philjs-router\": \"^1.0.0\"\n  },\n  \"devDependencies\": {\n    // Update JSX config\n    \"vite\": \"^5.0.0\",\n    \"philjs-compiler\": \"^1.0.0\"\n  }\n}","language":"json","filename":"package.json"}],["$","h3",null,{"children":"Vite Configuration"}],["$","$L2",null,{"code":"import { defineConfig } from 'vite';\nimport philjs from 'philjs-compiler/vite';\n\nexport default defineConfig({\n  plugins: [philjs()],\n  esbuild: {\n    jsx: 'automatic',\n    jsxImportSource: 'philjs-core',\n  },\n});","language":"typescript","filename":"vite.config.ts"}],["$","h3",null,{"children":"TypeScript Configuration"}],["$","$L2",null,{"code":"{\n  \"compilerOptions\": {\n    \"jsx\": \"react-jsx\",\n    \"jsxImportSource\": \"philjs-core\",\n    // ... other options\n  }\n}","language":"json","filename":"tsconfig.json"}],["$","h2",null,{"id":"common-issues","children":"Common Migration Issues"}],["$","h3",null,{"children":"Issue: Reading Signal Values"}],["$","$L3",null,{"type":"warning","title":"Common Mistake","children":"Remember to call signals as functions to read their values!"}],["$","$L2",null,{"code":"const [count, setCount] = createSignal(0);\n\n// Wrong\nconsole.log(count); // Logs the signal function\n\n// Correct\nconsole.log(count()); // Logs the value","language":"typescript"}],["$","h3",null,{"children":"Issue: Dependency Tracking"}],["$","$L2",null,{"code":"const [count, setCount] = createSignal(0);\n\n// Wrong - reads outside effect, won't track\nconst value = count();\ncreateEffect(() => {\n  console.log(value); // Won't re-run when count changes\n});\n\n// Correct - reads inside effect\ncreateEffect(() => {\n  console.log(count()); // Re-runs when count changes\n});","language":"typescript"}],["$","h3",null,{"children":"Issue: Conditional Signal Reads"}],["$","$L2",null,{"code":"// Avoid conditional signal reads in effects\ncreateEffect(() => {\n  if (someCondition) {\n    console.log(count()); // May break reactivity\n  }\n});\n\n// Better: Use Show or createMemo\ncreateEffect(() => {\n  const value = count(); // Always read signals\n  if (someCondition) {\n    console.log(value);\n  }\n});","language":"typescript"}],["$","h2",null,{"id":"example-migration","children":"Complete Example: Todo App"}],["$","p",null,{"children":"Here's a complete before/after of a todo app migration:"}],["$","details",null,{"children":[["$","summary",null,{"className":"cursor-pointer font-semibold text-primary-600 dark:text-primary-400 mb-4","children":"Click to see full React version"}],["$","$L2",null,{"code":"$4","language":"typescript"}]]}],["$","details",null,{"children":[["$","summary",null,{"className":"cursor-pointer font-semibold text-primary-600 dark:text-primary-400 mb-4 mt-4","children":"Click to see PhilJS version"}],["$","$L2",null,{"code":"$5","language":"typescript"}]]}],["$","h2",null,{"id":"resources","children":"Additional Resources"}],["$","div",null,{"className":"grid md:grid-cols-2 gap-4 mt-6 not-prose","children":[["$","$L6",null,{"href":"/docs/core-concepts/signals","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"Signals Deep Dive"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Understand PhilJS's reactivity system"}]]}],["$","$L6",null,{"href":"/docs/api/core","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"API Reference"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Complete API documentation"}]]}]]}]]}],null],null],null]},[null,["$","$L7",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","tutorials","children","migration-from-react","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[null,["$","$L7",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","tutorials","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[[null,["$","div",null,{"className":"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8","children":["$","div",null,{"className":"flex gap-12","children":[["$","$L9",null,{"sections":"$a"}],["$","main",null,{"className":"flex-1 min-w-0","children":["$","article",null,{"className":"prose prose-surface dark:prose-invert max-w-none","children":["$","$L7",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]}]}]]}]}]],null],null]},[[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/00bb994365e07be9.css","precedence":"next","crossOrigin":"$undefined"}]],["$","html",null,{"lang":"en","suppressHydrationWarning":true,"children":["$","body",null,{"className":"__variable_f367f3 __variable_3c557b font-sans antialiased","children":["$","$Lb",null,{"children":["$","div",null,{"className":"min-h-screen bg-white dark:bg-surface-950","children":[["$","$Lc",null,{}],["$","$L7",null,{"parallelRouterKey":"children","segmentPath":["children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":"404"}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],"notFoundStyles":[]}]]}]}]}]}]],null],null],["$Ld",null]]]]
d:[["$","meta","0",{"name":"viewport","content":"width=device-width, initial-scale=1"}],["$","meta","1",{"charSet":"utf-8"}],["$","title","2",{"children":"Migration from React | PhilJS"}],["$","meta","3",{"name":"description","content":"Step-by-step guide to migrating your React applications to PhilJS with comparison examples and migration strategies."}],["$","meta","4",{"name":"author","content":"PhilJS Team"}],["$","link","5",{"rel":"manifest","href":"/site.webmanifest","crossOrigin":"use-credentials"}],["$","meta","6",{"name":"keywords","content":"philjs,javascript,typescript,rust,framework,signals,reactivity,wasm"}],["$","meta","7",{"property":"og:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","8",{"property":"og:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","9",{"property":"og:url","content":"https://philjs.dev/"}],["$","meta","10",{"property":"og:site_name","content":"PhilJS"}],["$","meta","11",{"property":"og:locale","content":"en_US"}],["$","meta","12",{"property":"og:image","content":"https://philjs.dev/og-image.png"}],["$","meta","13",{"property":"og:image:width","content":"1200"}],["$","meta","14",{"property":"og:image:height","content":"630"}],["$","meta","15",{"property":"og:image:alt","content":"PhilJS Framework"}],["$","meta","16",{"property":"og:type","content":"website"}],["$","meta","17",{"name":"twitter:card","content":"summary_large_image"}],["$","meta","18",{"name":"twitter:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","19",{"name":"twitter:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","20",{"name":"twitter:image","content":"https://philjs.dev/og-image.png"}],["$","link","21",{"rel":"shortcut icon","href":"/favicon-16x16.png"}],["$","link","22",{"rel":"icon","href":"/favicon.ico"}],["$","link","23",{"rel":"apple-touch-icon","href":"/apple-touch-icon.png"}]]
1:null
