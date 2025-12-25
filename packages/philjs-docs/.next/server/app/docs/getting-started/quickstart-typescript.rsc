2:I[8850,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","9440","static/chunks/app/docs/getting-started/quickstart-typescript/page-bcde424b13ce2ecd.js"],"Terminal"]
3:I[8850,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","9440","static/chunks/app/docs/getting-started/quickstart-typescript/page-bcde424b13ce2ecd.js"],"CodeBlock"]
4:I[7696,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","9440","static/chunks/app/docs/getting-started/quickstart-typescript/page-bcde424b13ce2ecd.js"],"Callout"]
6:I[6542,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","9440","static/chunks/app/docs/getting-started/quickstart-typescript/page-bcde424b13ce2ecd.js"],""]
7:I[6419,[],""]
8:I[8445,[],""]
9:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"Sidebar"]
a:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"docsNavigation"]
b:I[1229,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"ThemeProvider"]
c:I[8529,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"Header"]
5:T895,import { signal, memo } from 'philjs-core';

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
}0:["cd22Ei08xvul0IDkb5kRy",[[["",{"children":["docs",{"children":["getting-started",{"children":["quickstart-typescript",{"children":["__PAGE__",{}]}]}]}]},"$undefined","$undefined",true],["",{"children":["docs",{"children":["getting-started",{"children":["quickstart-typescript",{"children":["__PAGE__",{},[["$L1",["$","div",null,{"className":"mdx-content","children":[["$","h1",null,{"children":"Quick Start (TypeScript)"}],["$","p",null,{"className":"lead text-xl text-surface-600 dark:text-surface-400","children":"Build your first PhilJS application in under 5 minutes. We'll create a simple counter app to learn the fundamentals."}],["$","h2",null,{"id":"create-project","children":"Create a New Project"}],["$","$L2",null,{"commands":["npm create philjs@latest my-counter-app","cd my-counter-app","npm install","npm run dev"]}],["$","p",null,{"children":["Open ",["$","a",null,{"href":"http://localhost:5173","target":"_blank","rel":"noopener noreferrer","children":"http://localhost:5173"}]," in your browser to see your app running."]}],["$","h2",null,{"id":"project-structure","children":"Understanding the Project"}],["$","p",null,{"children":"Your new project has this structure:"}],["$","$L3",null,{"code":"my-counter-app/\n├── src/\n│   ├── app/\n│   │   ├── layout.tsx      # Root layout\n│   │   └── page.tsx        # Home page\n│   ├── components/\n│   │   └── Counter.tsx     # Example component\n│   └── main.tsx            # Entry point\n├── public/\n├── package.json\n├── tsconfig.json\n└── vite.config.ts","language":"plaintext","showLineNumbers":false}],["$","h2",null,{"id":"first-signal","children":"Your First Signal"}],["$","p",null,{"children":"Signals are the foundation of PhilJS reactivity. Let's create a simple counter:"}],["$","$L3",null,{"code":"import { signal } from 'philjs-core';\n\nfunction Counter() {\n  // Create a reactive signal with initial value 0\n  const count = signal(0);\n\n  return (\n    <div className=\"counter\">\n      <h1>Count: {count}</h1>\n      <button onClick={() => count.set(c => c + 1)}>\n        Increment\n      </button>\n    </div>\n  );\n}","language":"typescript","filename":"src/components/Counter.tsx"}],["$","$L4",null,{"type":"info","title":"How Signals Work","children":["When you read ",["$","code",null,{"children":"count"}]," in JSX, PhilJS automatically tracks it as a dependency. When ",["$","code",null,{"children":"count.set()"}]," is called, only the parts of the UI that depend on it will update."]}],["$","h2",null,{"id":"computed-values","children":"Computed Values with Memos"}],["$","p",null,{"children":["Use ",["$","code",null,{"children":"memo"}]," to create derived values that automatically update:"]}],["$","$L3",null,{"code":"import { signal, memo } from 'philjs-core';\n\nfunction Counter() {\n  const count = signal(0);\n\n  // Computed value - automatically updates when count changes\n  const doubled = memo(() => count() * 2);\n  const isEven = memo(() => count() % 2 === 0);\n\n  return (\n    <div>\n      <p>Count: {count}</p>\n      <p>Doubled: {doubled}</p>\n      <p>Is Even: {isEven() ? 'Yes' : 'No'}</p>\n      <button onClick={() => count.set(c => c + 1)}>+1</button>\n    </div>\n  );\n}","language":"typescript","filename":"src/components/Counter.tsx"}],["$","h2",null,{"id":"effects","children":"Side Effects"}],["$","p",null,{"children":["Use ",["$","code",null,{"children":"effect"}]," to run code when signals change:"]}],["$","$L3",null,{"code":"import { signal, effect } from 'philjs-core';\n\nfunction Counter() {\n  const count = signal(0);\n\n  // Run when count changes\n  effect(() => {\n    console.log('Count changed to:', count());\n\n    // Optional cleanup function\n    return () => console.log('Cleaning up...');\n  });\n\n  // Save to localStorage whenever count changes\n  effect(() => {\n    localStorage.setItem('count', String(count()));\n  });\n\n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button onClick={() => count.set(c => c + 1)}>+1</button>\n    </div>\n  );\n}","language":"typescript","filename":"src/components/Counter.tsx"}],["$","h2",null,{"id":"todo-list","children":"Building a Todo List"}],["$","p",null,{"children":"Let's build something more complete - a todo list with add, toggle, and delete:"}],["$","$L3",null,{"code":"$5","language":"typescript","filename":"src/components/TodoList.tsx"}],["$","h2",null,{"id":"async-data","children":"Async Data with Resources"}],["$","p",null,{"children":["Use ",["$","code",null,{"children":"resource"}]," to fetch and manage async data:"]}],["$","$L3",null,{"code":"import { signal, resource } from 'philjs-core';\n\ninterface User {\n  id: number;\n  name: string;\n  email: string;\n}\n\nfunction UserProfile() {\n  const userId = signal(1);\n\n  const user = resource<User>(async () => {\n    const res = await fetch(\n      `https://api.example.com/users/${userId()}`\n    );\n    if (!res.ok) throw new Error('Failed to fetch');\n    return res.json();\n  });\n\n  return (\n    <div>\n      <select\n        value={userId()}\n        onChange={(e) => {\n          userId.set(Number(e.target.value));\n          user.refresh();\n        }}\n      >\n        <option value={1}>User 1</option>\n        <option value={2}>User 2</option>\n        <option value={3}>User 3</option>\n      </select>\n\n      {user.loading() ? (\n        <p>Loading...</p>\n      ) : user.error() ? (\n        <p className=\"text-red-500\">\n          Error: {user.error()?.message}\n        </p>\n      ) : (\n        <div>\n          <h2>{user().name}</h2>\n          <p>{user().email}</p>\n        </div>\n      )}\n    </div>\n  );\n}","language":"typescript","filename":"src/components/UserProfile.tsx"}],["$","h2",null,{"id":"next-steps","children":"Next Steps"}],["$","p",null,{"children":"Now that you understand the basics, explore these topics:"}],["$","div",null,{"className":"grid md:grid-cols-2 gap-4 mt-6 not-prose","children":[["$","$L6",null,{"href":"/docs/core-concepts/signals","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"Signals Deep Dive"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Learn advanced signal patterns and best practices"}]]}],["$","$L6",null,{"href":"/docs/guides/routing","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"Routing"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Set up file-based routing for your app"}]]}],["$","$L6",null,{"href":"/docs/core-concepts/components","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"Components"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Build reusable, composable UI components"}]]}],["$","$L6",null,{"href":"/docs/guides/ssr","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"Server-Side Rendering"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Render your app on the server for better performance"}]]}]]}]]}],null],null],null]},[null,["$","$L7",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","getting-started","children","quickstart-typescript","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[null,["$","$L7",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","getting-started","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[[null,["$","div",null,{"className":"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8","children":["$","div",null,{"className":"flex gap-12","children":[["$","$L9",null,{"sections":"$a"}],["$","main",null,{"className":"flex-1 min-w-0","children":["$","article",null,{"className":"prose prose-surface dark:prose-invert max-w-none","children":["$","$L7",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]}]}]]}]}]],null],null]},[[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/00bb994365e07be9.css","precedence":"next","crossOrigin":"$undefined"}]],["$","html",null,{"lang":"en","suppressHydrationWarning":true,"children":["$","body",null,{"className":"__variable_f367f3 __variable_3c557b font-sans antialiased","children":["$","$Lb",null,{"children":["$","div",null,{"className":"min-h-screen bg-white dark:bg-surface-950","children":[["$","$Lc",null,{}],["$","$L7",null,{"parallelRouterKey":"children","segmentPath":["children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":"404"}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],"notFoundStyles":[]}]]}]}]}]}]],null],null],["$Ld",null]]]]
d:[["$","meta","0",{"name":"viewport","content":"width=device-width, initial-scale=1"}],["$","meta","1",{"charSet":"utf-8"}],["$","title","2",{"children":"Quick Start (TypeScript) | PhilJS"}],["$","meta","3",{"name":"description","content":"Build your first PhilJS application with TypeScript. Learn signals, components, and reactivity."}],["$","meta","4",{"name":"author","content":"PhilJS Team"}],["$","link","5",{"rel":"manifest","href":"/site.webmanifest","crossOrigin":"use-credentials"}],["$","meta","6",{"name":"keywords","content":"philjs,javascript,typescript,rust,framework,signals,reactivity,wasm"}],["$","meta","7",{"property":"og:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","8",{"property":"og:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","9",{"property":"og:url","content":"https://philjs.dev/"}],["$","meta","10",{"property":"og:site_name","content":"PhilJS"}],["$","meta","11",{"property":"og:locale","content":"en_US"}],["$","meta","12",{"property":"og:image","content":"https://philjs.dev/og-image.png"}],["$","meta","13",{"property":"og:image:width","content":"1200"}],["$","meta","14",{"property":"og:image:height","content":"630"}],["$","meta","15",{"property":"og:image:alt","content":"PhilJS Framework"}],["$","meta","16",{"property":"og:type","content":"website"}],["$","meta","17",{"name":"twitter:card","content":"summary_large_image"}],["$","meta","18",{"name":"twitter:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","19",{"name":"twitter:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","20",{"name":"twitter:image","content":"https://philjs.dev/og-image.png"}],["$","link","21",{"rel":"shortcut icon","href":"/favicon-16x16.png"}],["$","link","22",{"rel":"icon","href":"/favicon.ico"}],["$","link","23",{"rel":"apple-touch-icon","href":"/apple-touch-icon.png"}]]
1:null
