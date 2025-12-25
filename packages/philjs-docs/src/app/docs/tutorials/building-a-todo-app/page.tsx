import { Metadata } from 'next';
import { CodeBlock, Terminal } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Building a Todo App',
  description: 'Learn PhilJS fundamentals by building a complete todo application with signals, effects, and local storage persistence.',
};

export default function BuildingTodoAppPage() {
  return (
    <div className="mdx-content">
      <h1>Building a Todo App</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        Learn PhilJS fundamentals by building a complete todo application with signals, effects, and local storage persistence.
      </p>

      <h2 id="what-well-build">What We'll Build</h2>

      <p>
        In this tutorial, we'll create a fully functional todo app that demonstrates:
      </p>

      <ul>
        <li>Reactive state management with signals</li>
        <li>Component composition and props</li>
        <li>User input handling with forms</li>
        <li>Side effects for local storage persistence</li>
        <li>Conditional rendering and lists</li>
        <li>Event handling and computed values</li>
      </ul>

      <h2 id="setup">Project Setup</h2>

      <p>First, create a new PhilJS project:</p>

      <Terminal commands={[
        'npm create philjs@latest todo-app',
        'cd todo-app',
        'npm install',
        'npm run dev',
      ]} />

      <p>
        This creates a new project with TypeScript, Vite, and all the dependencies you need.
      </p>

      <h2 id="data-structure">Defining the Data Structure</h2>

      <p>
        Let's start by defining our todo item type. Create a new file <code>src/types.ts</code>:
      </p>

      <CodeBlock
        code={`export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export type TodoFilter = 'all' | 'active' | 'completed';`}
        language="typescript"
        filename="src/types.ts"
      />

      <h2 id="state-management">Setting Up State</h2>

      <p>
        Now let's create the main component with our reactive state. Update <code>src/App.tsx</code>:
      </p>

      <CodeBlock
        code={`import { createSignal, createMemo, createEffect, For, Show } from 'philjs-core';
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

export default App;`}
        language="typescript"
        filename="src/App.tsx"
      />

      <Callout type="info" title="Signals vs Memos">
        <code>createSignal</code> creates writable reactive state, while <code>createMemo</code> creates
        derived computed values that automatically update when their dependencies change.
      </Callout>

      <h2 id="add-todo">Adding Todos</h2>

      <p>
        Let's implement the functionality to add new todos:
      </p>

      <CodeBlock
        code={`  // Add this function inside the App component
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
  );`}
        language="typescript"
        filename="src/App.tsx"
      />

      <h2 id="display-todos">Displaying Todos</h2>

      <p>
        Now let's render the list of todos using the <code>For</code> component for efficient list rendering:
      </p>

      <CodeBlock
        code={`  const toggleTodo = (id: string) => {
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
  );`}
        language="typescript"
        filename="src/App.tsx"
      />

      <Callout type="info" title="Why Use For?">
        The <code>For</code> component is optimized for rendering lists in PhilJS. It only re-renders
        items that have actually changed, unlike <code>map()</code> which re-renders the entire list.
      </Callout>

      <h2 id="filters">Adding Filters</h2>

      <p>
        Let's add filter buttons to show all, active, or completed todos:
      </p>

      <CodeBlock
        code={`  return (
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
  );`}
        language="typescript"
        filename="src/App.tsx"
      />

      <h2 id="persistence">Local Storage Persistence</h2>

      <p>
        Now let's add persistence with local storage using effects:
      </p>

      <CodeBlock
        code={`function App() {
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
}`}
        language="typescript"
        filename="src/App.tsx"
      />

      <Callout type="warning" title="Effect Timing">
        The first effect runs only once on mount (no dependencies tracked), while the second effect
        runs whenever <code>todos()</code> changes because we read it inside the effect.
      </Callout>

      <h2 id="styling">Adding Styles</h2>

      <p>
        Create <code>src/App.css</code> to style your todo app:
      </p>

      <CodeBlock
        code={`.container {
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
}`}
        language="css"
        filename="src/App.css"
      />

      <p>
        Don't forget to import the styles in your component:
      </p>

      <CodeBlock
        code={`import { createSignal, createMemo, createEffect, For, Show } from 'philjs-core';
import type { Todo, TodoFilter } from './types';
import './App.css';`}
        language="typescript"
        filename="src/App.tsx"
      />

      <h2 id="complete-code">Complete Code</h2>

      <p>
        Here's the complete <code>App.tsx</code> with all features:
      </p>

      <CodeBlock
        code={`import { createSignal, createMemo, createEffect, For, Show } from 'philjs-core';
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

export default App;`}
        language="typescript"
        filename="src/App.tsx"
      />

      <h2 id="enhancements">Next Steps</h2>

      <p>
        Congratulations! You've built a complete todo app with PhilJS. Here are some ideas to enhance it further:
      </p>

      <ul>
        <li>Add todo editing functionality</li>
        <li>Implement drag-and-drop reordering</li>
        <li>Add due dates and priorities</li>
        <li>Create categories or tags</li>
        <li>Add animations and transitions</li>
        <li>Implement keyboard shortcuts</li>
        <li>Add a dark mode toggle</li>
        <li>Sync with a backend API</li>
      </ul>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/tutorials/building-a-dashboard"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Building a Dashboard</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Learn data fetching and visualization
          </p>
        </Link>

        <Link
          href="/docs/core-concepts/signals"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Deep Dive: Signals</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Learn more about PhilJS's reactivity system
          </p>
        </Link>
      </div>
    </div>
  );
}
