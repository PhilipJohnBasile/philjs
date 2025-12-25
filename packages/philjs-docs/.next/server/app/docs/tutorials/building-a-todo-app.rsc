2:I[8850,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","3788","static/chunks/app/docs/tutorials/building-a-todo-app/page-7c347b75fb707bf2.js"],"Terminal"]
3:I[8850,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","3788","static/chunks/app/docs/tutorials/building-a-todo-app/page-7c347b75fb707bf2.js"],"CodeBlock"]
5:I[7696,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","3788","static/chunks/app/docs/tutorials/building-a-todo-app/page-7c347b75fb707bf2.js"],"Callout"]
a:I[6542,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","3788","static/chunks/app/docs/tutorials/building-a-todo-app/page-7c347b75fb707bf2.js"],""]
b:I[6419,[],""]
c:I[8445,[],""]
d:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"Sidebar"]
e:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"docsNavigation"]
f:I[1229,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"ThemeProvider"]
10:I[8529,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"Header"]
4:T416,import { createSignal, createMemo, createEffect, For, Show } from 'philjs-core';
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

export default App;6:T607,  const toggleTodo = (id: string) => {
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
              <li className={`todo-item ${todo.completed ? 'completed' : ''}`}>
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
  );7:T405,  return (
    <div className="container">
      <h1>PhilJS Todo App</h1>

      <form onSubmit={addTodo} className="todo-form">
        {/* ... form code ... */}
      </form>

      <Show when={todos().length > 0}>
        <div className="filters">
          <button
            className={`filter-btn ${filter() === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({todos().length})
          </button>
          <button
            className={`filter-btn ${filter() === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({activeCount()})
          </button>
          <button
            className={`filter-btn ${filter() === 'completed' ? 'active' : ''}`}
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
  );8:T717,.container {
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
}9:T1074,import { createSignal, createMemo, createEffect, For, Show } from 'philjs-core';
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
            className={`filter-btn ${filter() === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({todos().length})
          </button>
          <button
            className={`filter-btn ${filter() === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({activeCount()})
          </button>
          <button
            className={`filter-btn ${filter() === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({completedCount()})
          </button>
        </div>

        <ul className="todo-list">
          <For each={filteredTodos()}>
            {(todo) => (
              <li className={`todo-item ${todo.completed ? 'completed' : ''}`}>
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

export default App;0:["cd22Ei08xvul0IDkb5kRy",[[["",{"children":["docs",{"children":["tutorials",{"children":["building-a-todo-app",{"children":["__PAGE__",{}]}]}]}]},"$undefined","$undefined",true],["",{"children":["docs",{"children":["tutorials",{"children":["building-a-todo-app",{"children":["__PAGE__",{},[["$L1",["$","div",null,{"className":"mdx-content","children":[["$","h1",null,{"children":"Building a Todo App"}],["$","p",null,{"className":"lead text-xl text-surface-600 dark:text-surface-400","children":"Learn PhilJS fundamentals by building a complete todo application with signals, effects, and local storage persistence."}],["$","h2",null,{"id":"what-well-build","children":"What We'll Build"}],["$","p",null,{"children":"In this tutorial, we'll create a fully functional todo app that demonstrates:"}],["$","ul",null,{"children":[["$","li",null,{"children":"Reactive state management with signals"}],["$","li",null,{"children":"Component composition and props"}],["$","li",null,{"children":"User input handling with forms"}],["$","li",null,{"children":"Side effects for local storage persistence"}],["$","li",null,{"children":"Conditional rendering and lists"}],["$","li",null,{"children":"Event handling and computed values"}]]}],["$","h2",null,{"id":"setup","children":"Project Setup"}],["$","p",null,{"children":"First, create a new PhilJS project:"}],["$","$L2",null,{"commands":["npm create philjs@latest todo-app","cd todo-app","npm install","npm run dev"]}],["$","p",null,{"children":"This creates a new project with TypeScript, Vite, and all the dependencies you need."}],["$","h2",null,{"id":"data-structure","children":"Defining the Data Structure"}],["$","p",null,{"children":["Let's start by defining our todo item type. Create a new file ",["$","code",null,{"children":"src/types.ts"}],":"]}],["$","$L3",null,{"code":"export interface Todo {\n  id: string;\n  text: string;\n  completed: boolean;\n  createdAt: number;\n}\n\nexport type TodoFilter = 'all' | 'active' | 'completed';","language":"typescript","filename":"src/types.ts"}],["$","h2",null,{"id":"state-management","children":"Setting Up State"}],["$","p",null,{"children":["Now let's create the main component with our reactive state. Update ",["$","code",null,{"children":"src/App.tsx"}],":"]}],["$","$L3",null,{"code":"$4","language":"typescript","filename":"src/App.tsx"}],["$","$L5",null,{"type":"info","title":"Signals vs Memos","children":[["$","code",null,{"children":"createSignal"}]," creates writable reactive state, while ",["$","code",null,{"children":"createMemo"}]," creates derived computed values that automatically update when their dependencies change."]}],["$","h2",null,{"id":"add-todo","children":"Adding Todos"}],["$","p",null,{"children":"Let's implement the functionality to add new todos:"}],["$","$L3",null,{"code":"  // Add this function inside the App component\n  const addTodo = (e: Event) => {\n    e.preventDefault();\n    const text = inputValue().trim();\n\n    if (!text) return;\n\n    const newTodo: Todo = {\n      id: crypto.randomUUID(),\n      text,\n      completed: false,\n      createdAt: Date.now(),\n    };\n\n    setTodos(prev => [...prev, newTodo]);\n    setInputValue('');\n  };\n\n  // Add the form to the JSX\n  return (\n    <div className=\"container\">\n      <h1>PhilJS Todo App</h1>\n\n      <form onSubmit={addTodo} className=\"todo-form\">\n        <input\n          type=\"text\"\n          value={inputValue()}\n          onInput={(e) => setInputValue(e.currentTarget.value)}\n          placeholder=\"What needs to be done?\"\n          className=\"todo-input\"\n        />\n        <button type=\"submit\" className=\"add-button\">\n          Add Todo\n        </button>\n      </form>\n    </div>\n  );","language":"typescript","filename":"src/App.tsx"}],["$","h2",null,{"id":"display-todos","children":"Displaying Todos"}],["$","p",null,{"children":["Now let's render the list of todos using the ",["$","code",null,{"children":"For"}]," component for efficient list rendering:"]}],["$","$L3",null,{"code":"$6","language":"typescript","filename":"src/App.tsx"}],["$","$L5",null,{"type":"info","title":"Why Use For?","children":["The ",["$","code",null,{"children":"For"}]," component is optimized for rendering lists in PhilJS. It only re-renders items that have actually changed, unlike ",["$","code",null,{"children":"map()"}]," which re-renders the entire list."]}],["$","h2",null,{"id":"filters","children":"Adding Filters"}],["$","p",null,{"children":"Let's add filter buttons to show all, active, or completed todos:"}],["$","$L3",null,{"code":"$7","language":"typescript","filename":"src/App.tsx"}],["$","h2",null,{"id":"persistence","children":"Local Storage Persistence"}],["$","p",null,{"children":"Now let's add persistence with local storage using effects:"}],["$","$L3",null,{"code":"function App() {\n  const [todos, setTodos] = createSignal<Todo[]>([]);\n  const [filter, setFilter] = createSignal<TodoFilter>('all');\n  const [inputValue, setInputValue] = createSignal('');\n\n  // Load todos from local storage on mount\n  createEffect(() => {\n    const stored = localStorage.getItem('philjs-todos');\n    if (stored) {\n      try {\n        const parsed = JSON.parse(stored);\n        setTodos(parsed);\n      } catch (error) {\n        console.error('Failed to parse stored todos:', error);\n      }\n    }\n  });\n\n  // Save todos to local storage whenever they change\n  createEffect(() => {\n    const current = todos();\n    localStorage.setItem('philjs-todos', JSON.stringify(current));\n  });\n\n  // ... rest of the component\n}","language":"typescript","filename":"src/App.tsx"}],["$","$L5",null,{"type":"warning","title":"Effect Timing","children":["The first effect runs only once on mount (no dependencies tracked), while the second effect runs whenever ",["$","code",null,{"children":"todos()"}]," changes because we read it inside the effect."]}],["$","h2",null,{"id":"styling","children":"Adding Styles"}],["$","p",null,{"children":["Create ",["$","code",null,{"children":"src/App.css"}]," to style your todo app:"]}],["$","$L3",null,{"code":"$8","language":"css","filename":"src/App.css"}],["$","p",null,{"children":"Don't forget to import the styles in your component:"}],["$","$L3",null,{"code":"import { createSignal, createMemo, createEffect, For, Show } from 'philjs-core';\nimport type { Todo, TodoFilter } from './types';\nimport './App.css';","language":"typescript","filename":"src/App.tsx"}],["$","h2",null,{"id":"complete-code","children":"Complete Code"}],["$","p",null,{"children":["Here's the complete ",["$","code",null,{"children":"App.tsx"}]," with all features:"]}],["$","$L3",null,{"code":"$9","language":"typescript","filename":"src/App.tsx"}],["$","h2",null,{"id":"enhancements","children":"Next Steps"}],["$","p",null,{"children":"Congratulations! You've built a complete todo app with PhilJS. Here are some ideas to enhance it further:"}],["$","ul",null,{"children":[["$","li",null,{"children":"Add todo editing functionality"}],["$","li",null,{"children":"Implement drag-and-drop reordering"}],["$","li",null,{"children":"Add due dates and priorities"}],["$","li",null,{"children":"Create categories or tags"}],["$","li",null,{"children":"Add animations and transitions"}],["$","li",null,{"children":"Implement keyboard shortcuts"}],["$","li",null,{"children":"Add a dark mode toggle"}],["$","li",null,{"children":"Sync with a backend API"}]]}],["$","div",null,{"className":"grid md:grid-cols-2 gap-4 mt-6 not-prose","children":[["$","$La",null,{"href":"/docs/tutorials/building-a-dashboard","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"Building a Dashboard"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Learn data fetching and visualization"}]]}],["$","$La",null,{"href":"/docs/core-concepts/signals","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"Deep Dive: Signals"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Learn more about PhilJS's reactivity system"}]]}]]}]]}],null],null],null]},[null,["$","$Lb",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","tutorials","children","building-a-todo-app","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lc",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[null,["$","$Lb",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","tutorials","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lc",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[[null,["$","div",null,{"className":"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8","children":["$","div",null,{"className":"flex gap-12","children":[["$","$Ld",null,{"sections":"$e"}],["$","main",null,{"className":"flex-1 min-w-0","children":["$","article",null,{"className":"prose prose-surface dark:prose-invert max-w-none","children":["$","$Lb",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lc",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]}]}]]}]}]],null],null]},[[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/00bb994365e07be9.css","precedence":"next","crossOrigin":"$undefined"}]],["$","html",null,{"lang":"en","suppressHydrationWarning":true,"children":["$","body",null,{"className":"__variable_f367f3 __variable_3c557b font-sans antialiased","children":["$","$Lf",null,{"children":["$","div",null,{"className":"min-h-screen bg-white dark:bg-surface-950","children":[["$","$L10",null,{}],["$","$Lb",null,{"parallelRouterKey":"children","segmentPath":["children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lc",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":"404"}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],"notFoundStyles":[]}]]}]}]}]}]],null],null],["$L11",null]]]]
11:[["$","meta","0",{"name":"viewport","content":"width=device-width, initial-scale=1"}],["$","meta","1",{"charSet":"utf-8"}],["$","title","2",{"children":"Building a Todo App | PhilJS"}],["$","meta","3",{"name":"description","content":"Learn PhilJS fundamentals by building a complete todo application with signals, effects, and local storage persistence."}],["$","meta","4",{"name":"author","content":"PhilJS Team"}],["$","link","5",{"rel":"manifest","href":"/site.webmanifest","crossOrigin":"use-credentials"}],["$","meta","6",{"name":"keywords","content":"philjs,javascript,typescript,rust,framework,signals,reactivity,wasm"}],["$","meta","7",{"property":"og:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","8",{"property":"og:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","9",{"property":"og:url","content":"https://philjs.dev/"}],["$","meta","10",{"property":"og:site_name","content":"PhilJS"}],["$","meta","11",{"property":"og:locale","content":"en_US"}],["$","meta","12",{"property":"og:image","content":"https://philjs.dev/og-image.png"}],["$","meta","13",{"property":"og:image:width","content":"1200"}],["$","meta","14",{"property":"og:image:height","content":"630"}],["$","meta","15",{"property":"og:image:alt","content":"PhilJS Framework"}],["$","meta","16",{"property":"og:type","content":"website"}],["$","meta","17",{"name":"twitter:card","content":"summary_large_image"}],["$","meta","18",{"name":"twitter:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","19",{"name":"twitter:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","20",{"name":"twitter:image","content":"https://philjs.dev/og-image.png"}],["$","link","21",{"rel":"shortcut icon","href":"/favicon-16x16.png"}],["$","link","22",{"rel":"icon","href":"/favicon.ico"}],["$","link","23",{"rel":"apple-touch-icon","href":"/apple-touch-icon.png"}]]
1:null
