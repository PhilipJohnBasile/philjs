import { signal, memo } from 'philjs-core';
import { CodeBlock } from '../components/CodeBlock';
import { theme, toggleTheme } from '../lib/theme';

// Define examples as a const outside the component for reusability
const EXAMPLES_DATA = {
  counter: {
    title: 'Counter (Fine-Grained Reactivity)',
    description: 'See how signals automatically track dependencies without useCallback or useMemo',
    code: `import { signal } from 'philjs-core';

function Counter() {
  const count = signal(0);

  // No useCallback needed!
  const increment = () => count.set(count() + 1);
  const decrement = () => count.set(count() - 1);

  return (
    <div>
      <h2>Count: {count()}</h2>
      <button onClick={increment}>+1</button>
      <button onClick={decrement}>-1</button>
    </div>
  );
}`,
    comparison: `// React equivalent (manual optimization)
import { useCallback, memo } from 'react';

const Counter = memo(() => {
  const [count, setCount] = useState(0);

  // Must memoize to prevent re-renders!
  const increment = useCallback(
    () => setCount(c => c + 1),
    [] // Dependency array
  );

  const decrement = useCallback(
    () => setCount(c => c - 1),
    []
  );

  return (
    <div>
      <h2>Count: {count}</h2>
      <button onClick={increment}>+1</button>
      <button onClick={decrement}>-1</button>
    </div>
  );
});`
  },
  todo: {
    title: 'Todo List (State Management)',
    description: 'Signals work for all state - no Redux, Zustand, or Context needed',
    code: `import { signal } from 'philjs-core';

function TodoList() {
  const todos = signal([{ id: 1, text: 'Learn PhilJS', done: false }]);
  const input = signal('');

  const addTodo = () => {
    if (!input()) return;
    todos.set([...todos(), { id: Date.now(), text: input(), done: false }]);
    input.set('');
  };

  return (
    <div>
      <input value={input()} onInput={(e) => input.set(e.target.value)} />
      <button onClick={addTodo}>Add</button>
      <ul>
        {todos().map(todo => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    </div>
  );
}`,
    comparison: `// React equivalent (needs state management library)
import { create } from 'zustand';

const useTodoStore = create((set) => ({
  todos: [{ id: 1, text: 'Learn React', done: false }],
  addTodo: (text) => set((state) => ({
    todos: [...state.todos, { id: Date.now(), text, done: false }]
  }))
}));

function TodoList() {
  const { todos, addTodo } = useTodoStore();
  const [input, setInput] = useState('');

  // Requires separate store, extra boilerplate
}`
  },
  fetch: {
    title: 'Data Fetching (Zero Hydration)',
    description: 'Server data with resumability - no hydration errors possible',
    code: `// Server loader (runs on server)
export async function loader({ params }) {
  const user = await db.users.findById(params.id);
  return { user };
}

// Component (auto-typed from loader!)
export default function UserPage({ loaderData }) {
  // No useState, useEffect, or hydration needed
  return <div>Hello, {loaderData.user.name}!</div>;
}`,
    comparison: `// React Server Components (complex setup)
async function UserPage({ params }) {
  const user = await db.users.findById(params.id);

  return (
    <ClientWrapper initialData={user}>
      {/* Need client components for interactivity */}
      {/* Hydration errors are common */}
    </ClientWrapper>
  );
}`
  },
  form: {
    title: 'Forms (Built-in Validation)',
    description: 'Type-safe forms with zero boilerplate',
    code: `import { useForm, v } from 'philjs-core';

function SignupForm() {
  const form = useForm({
    email: v.string().email(),
    password: v.string().min(8)
  });

  return (
    <form onSubmit={form.handleSubmit(data => console.log(data))}>
      <input {...form.field('email')} />
      {form.errors.email && <span>{form.errors.email}</span>}

      <input type="password" {...form.field('password')} />
      {form.errors.password && <span>{form.errors.password}</span>}

      <button type="submit">Sign Up</button>
    </form>
  );
}`,
    comparison: `// React (needs external library)
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

function SignupForm() {
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema)
  });

  // More boilerplate, external dependencies
}`
  },
  animation: {
    title: 'Animations (Declarative)',
    description: 'Smooth animations without React Spring or Framer Motion',
    code: `import { createAnimatedValue } from 'philjs-core';

function Slider() {
  const x = createAnimatedValue(0);

  return (
    <div
      style={{ transform: \`translateX(\${x()}px)\` }}
      onClick={() => x.animate(200, { duration: 300 })}
    >
      Click to slide
    </div>
  );
}`,
    comparison: `// React (needs external library)
import { useSpring, animated } from 'react-spring';

function Slider() {
  const [springs, api] = useSpring(() => ({ x: 0 }));

  return (
    <animated.div
      style={{ transform: springs.x.to(x => \`translateX(\${x}px)\`) }}
      onClick={() => api.start({ x: 200 })}
    >
      Click to slide
    </animated.div>
  );
}`
  }
};

export function ExamplesPage({ navigate }: { navigate: (path: string) => void }) {
  const activeExample = signal<'counter' | 'todo' | 'fetch' | 'form' | 'animation'>('counter');

  // Create memoized reactive content
  const currentTitle = memo(() => {
    const ex = activeExample();
    return ex === 'counter' ? EXAMPLES_DATA.counter.title :
           ex === 'todo' ? EXAMPLES_DATA.todo.title :
           ex === 'fetch' ? EXAMPLES_DATA.fetch.title :
           ex === 'form' ? EXAMPLES_DATA.form.title :
           EXAMPLES_DATA.animation.title;
  });

  const currentDescription = memo(() => {
    const ex = activeExample();
    return ex === 'counter' ? EXAMPLES_DATA.counter.description :
           ex === 'todo' ? EXAMPLES_DATA.todo.description :
           ex === 'fetch' ? EXAMPLES_DATA.fetch.description :
           ex === 'form' ? EXAMPLES_DATA.form.description :
           EXAMPLES_DATA.animation.description;
  });

  const currentCode = memo(() => {
    const ex = activeExample();
    return ex === 'counter' ? EXAMPLES_DATA.counter.code :
           ex === 'todo' ? EXAMPLES_DATA.todo.code :
           ex === 'fetch' ? EXAMPLES_DATA.fetch.code :
           ex === 'form' ? EXAMPLES_DATA.form.code :
           EXAMPLES_DATA.animation.code;
  });

  const currentComparison = memo(() => {
    const ex = activeExample();
    return ex === 'counter' ? EXAMPLES_DATA.counter.comparison :
           ex === 'todo' ? EXAMPLES_DATA.todo.comparison :
           ex === 'fetch' ? EXAMPLES_DATA.fetch.comparison :
           ex === 'form' ? EXAMPLES_DATA.form.comparison :
           EXAMPLES_DATA.animation.comparison;
  });

  return (
    <div>
      {/* Header */}
      <header style="
        position: sticky;
        top: 0;
        z-index: 50;
        background: var(--color-bg);
        border-bottom: 1px solid var(--color-border);
        backdrop-filter: blur(10px);
      ">
        <div class="container" style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
        ">
          <div
            onClick={() => navigate('/')}
            style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;"
          >
            <span style="font-size: 1.5rem;">⚡</span>
            <span style="font-weight: 700; font-size: 1.25rem;">PhilJS</span>
          </div>

          <nav style="display: flex; align-items: center; gap: 2rem;">
            <a onClick={() => navigate('/')} style="color: var(--color-text); font-weight: 500; cursor: pointer;">Home</a>
            <a onClick={() => navigate('/examples')} style="color: var(--color-brand); font-weight: 500; cursor: pointer;">Examples</a>
            <a onClick={() => navigate('/docs')} style="color: var(--color-text); font-weight: 500; cursor: pointer;">Docs</a>
            <button
              onClick={toggleTheme}
              style="
                padding: 0.5rem;
                background: var(--color-bg-alt);
                border: 1px solid var(--color-border);
                border-radius: 6px;
                cursor: pointer;
              "
              aria-label="Toggle theme"
            >
              {theme() === 'light' ? '🌙' : '☀️'}
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style="padding: 4rem 0 3rem; background: var(--color-bg-alt);">
        <div class="container" style="max-width: 1200px; margin: 0 auto;">
          <h1 style="
            font-size: clamp(2rem, 6vw, 3.5rem);
            font-weight: 700;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, var(--color-brand) 0%, var(--color-accent) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          ">
            Real-World Examples
          </h1>
          <p style="
            font-size: 1.25rem;
            color: var(--color-text-secondary);
            max-width: 700px;
          ">
            See how PhilJS simplifies common patterns compared to React
          </p>
        </div>
      </section>

      {/* Example Selector */}
      <section style="padding: 3rem 0;">
        <div class="container" style="max-width: 1200px; margin: 0 auto;">
          <div style="
            display: flex;
            gap: 1rem;
            margin-bottom: 3rem;
            flex-wrap: wrap;
          ">
            <button
              onClick={() => {
                console.log('Counter clicked!');
                activeExample.set('counter');
              }}
              style={`
                padding: 0.75rem 1.5rem;
                background: ${activeExample() === 'counter' ? 'var(--color-brand)' : 'var(--color-bg-alt)'};
                color: ${activeExample() === 'counter' ? 'white' : 'var(--color-text)'};
                border: 1px solid ${activeExample() === 'counter' ? 'var(--color-brand)' : 'var(--color-border)'};
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all var(--transition-base);
              `}
            >
              Counter
            </button>
            <button
              onClick={() => {
                console.log('Todo clicked!');
                console.log('Before set:', activeExample());
                console.log('Calling activeExample.set with:', 'todo');
                activeExample.set('todo');
                console.log('After set:', activeExample());
                console.log('Using peek:', activeExample.peek());
              }}
              style={`
                padding: 0.75rem 1.5rem;
                background: ${activeExample() === 'todo' ? 'var(--color-brand)' : 'var(--color-bg-alt)'};
                color: ${activeExample() === 'todo' ? 'white' : 'var(--color-text)'};
                border: 1px solid ${activeExample() === 'todo' ? 'var(--color-brand)' : 'var(--color-border)'};
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all var(--transition-base);
              `}
            >
              Todo List
            </button>
            <button
              onClick={() => activeExample.set('fetch')}
              style={`
                padding: 0.75rem 1.5rem;
                background: ${activeExample() === 'fetch' ? 'var(--color-brand)' : 'var(--color-bg-alt)'};
                color: ${activeExample() === 'fetch' ? 'white' : 'var(--color-text)'};
                border: 1px solid ${activeExample() === 'fetch' ? 'var(--color-brand)' : 'var(--color-border)'};
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all var(--transition-base);
              `}
            >
              Data Fetching
            </button>
            <button
              onClick={() => activeExample.set('form')}
              style={`
                padding: 0.75rem 1.5rem;
                background: ${activeExample() === 'form' ? 'var(--color-brand)' : 'var(--color-bg-alt)'};
                color: ${activeExample() === 'form' ? 'white' : 'var(--color-text)'};
                border: 1px solid ${activeExample() === 'form' ? 'var(--color-brand)' : 'var(--color-border)'};
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all var(--transition-base);
              `}
            >
              Forms
            </button>
            <button
              onClick={() => activeExample.set('animation')}
              style={`
                padding: 0.75rem 1.5rem;
                background: ${activeExample() === 'animation' ? 'var(--color-brand)' : 'var(--color-bg-alt)'};
                color: ${activeExample() === 'animation' ? 'white' : 'var(--color-text)'};
                border: 1px solid ${activeExample() === 'animation' ? 'var(--color-brand)' : 'var(--color-border)'};
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all var(--transition-base);
              `}
            >
              Animations
            </button>
          </div>

          {/* Example Content - using computed functions */}
          <div>
            <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem;">
              {currentTitle}
            </h2>
            <p style="font-size: 1.125rem; color: var(--color-text-secondary); margin-bottom: 2rem;">
              {currentDescription}
            </p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 3rem;">
              <div>
                <div style="padding: 0.75rem 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px 8px 0 0; font-weight: 600; color: #10b981;">
                  ✅ PhilJS (Simple)
                </div>
                <CodeBlock code={currentCode()} language="tsx" />
              </div>
              <div>
                <div style="padding: 0.75rem 1rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px 8px 0 0; font-weight: 600; color: #ef4444;">
                  ❌ React (Complex)
                </div>
                <CodeBlock code={currentComparison()} language="tsx" />
              </div>
            </div>

            {/* CTA */}
            <div style="
              padding: 2rem;
              background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1));
              border: 1px solid var(--color-border);
              border-radius: 12px;
              text-align: center;
            ">
              <h3 style="
                font-size: 1.5rem;
                font-weight: 600;
                margin-bottom: 1rem;
              ">
                Ready to try it yourself?
              </h3>
              <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                <button
                  onClick={() => navigate('/docs')}
                  style="
                    padding: 0.75rem 1.5rem;
                    background: var(--color-brand);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all var(--transition-base);
                  "
                  onMouseEnter={(e) => (e.target as HTMLElement).style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.transform = 'scale(1)'}
                >
                  Read the Docs →
                </button>
                <button
                  onClick={() => navigate('/')}
                  style="
                    padding: 0.75rem 1.5rem;
                    background: var(--color-bg);
                    color: var(--color-text);
                    border: 1px solid var(--color-border);
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all var(--transition-base);
                  "
                  onMouseEnter={(e) => (e.target as HTMLElement).style.borderColor = 'var(--color-brand)'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.borderColor = 'var(--color-border)'}
                >
                  ← Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style="
        background: var(--color-bg-alt);
        border-top: 1px solid var(--color-border);
        padding: 2rem 0;
        margin-top: 4rem;
      ">
        <div class="container" style="text-align: center; color: var(--color-text-secondary); font-size: 0.875rem;">
          <p>© 2025 PhilJS. MIT License.</p>
        </div>
      </footer>
    </div>
  );
}

export function ExamplesPageOLD({ navigate }: { navigate: (path: string) => void }) {
  const activeExample = signal<'counter' | 'todo' | 'fetch' | 'form' | 'animation'>('counter');

  const handleExampleChange = (example: 'counter' | 'todo' | 'fetch' | 'form' | 'animation') => {
    console.log('Switching to example:', example);
    activeExample.set(example);
  };

  return (
    <div style="display: none;">
      {/* Header */}
      <header style="
        position: sticky;
        top: 0;
        z-index: 50;
        background: var(--color-bg);
        border-bottom: 1px solid var(--color-border);
        backdrop-filter: blur(10px);
      ">
        <div class="container" style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
        ">
          <div
            onClick={() => navigate('/')}
            style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;"
          >
            <span style="font-size: 1.5rem;">⚡</span>
            <span style="font-weight: 700; font-size: 1.25rem;">PhilJS</span>
          </div>

          <nav style="display: flex; align-items: center; gap: 2rem;">
            <a onClick={() => navigate('/')} style="color: var(--color-text); font-weight: 500; cursor: pointer;">Home</a>
            <a onClick={() => navigate('/examples')} style="color: var(--color-brand); font-weight: 500; cursor: pointer;">Examples</a>
            <a onClick={() => navigate('/docs')} style="color: var(--color-text); font-weight: 500; cursor: pointer;">Docs</a>
            <button
              onClick={toggleTheme}
              style="
                padding: 0.5rem;
                background: var(--color-bg-alt);
                border: 1px solid var(--color-border);
                border-radius: 6px;
                cursor: pointer;
              "
              aria-label="Toggle theme"
            >
              {theme() === 'light' ? '🌙' : '☀️'}
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style="padding: 4rem 0 3rem; background: var(--color-bg-alt);">
        <div class="container" style="max-width: 1200px; margin: 0 auto;">
          <h1 style="
            font-size: clamp(2rem, 6vw, 3.5rem);
            font-weight: 700;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, var(--color-brand) 0%, var(--color-accent) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          ">
            Real-World Examples
          </h1>
          <p style="
            font-size: 1.25rem;
            color: var(--color-text-secondary);
            max-width: 700px;
          ">
            See how PhilJS simplifies common patterns compared to React
          </p>
        </div>
      </section>

      {/* Example Selector */}
      <section style="padding: 3rem 0;">
        <div class="container" style="max-width: 1200px; margin: 0 auto;">
          <div style="
            display: flex;
            gap: 1rem;
            margin-bottom: 3rem;
            flex-wrap: wrap;
          ">
            <button
              onClick={() => handleExampleChange('counter')}
              style={`
                padding: 0.75rem 1.5rem;
                background: ${activeExample() === 'counter' ? 'var(--color-brand)' : 'var(--color-bg-alt)'};
                color: ${activeExample() === 'counter' ? 'white' : 'var(--color-text)'};
                border: 1px solid ${activeExample() === 'counter' ? 'var(--color-brand)' : 'var(--color-border)'};
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all var(--transition-base);
              `}
            >
              Counter
            </button>
            <button
              onClick={() => handleExampleChange('todo')}
              style={`
                padding: 0.75rem 1.5rem;
                background: ${activeExample() === 'todo' ? 'var(--color-brand)' : 'var(--color-bg-alt)'};
                color: ${activeExample() === 'todo' ? 'white' : 'var(--color-text)'};
                border: 1px solid ${activeExample() === 'todo' ? 'var(--color-brand)' : 'var(--color-border)'};
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all var(--transition-base);
              `}
            >
              Todo List
            </button>
            <button
              onClick={() => handleExampleChange('fetch')}
              style={`
                padding: 0.75rem 1.5rem;
                background: ${activeExample() === 'fetch' ? 'var(--color-brand)' : 'var(--color-bg-alt)'};
                color: ${activeExample() === 'fetch' ? 'white' : 'var(--color-text)'};
                border: 1px solid ${activeExample() === 'fetch' ? 'var(--color-brand)' : 'var(--color-border)'};
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all var(--transition-base);
              `}
            >
              Data Fetching
            </button>
            <button
              onClick={() => handleExampleChange('form')}
              style={`
                padding: 0.75rem 1.5rem;
                background: ${activeExample() === 'form' ? 'var(--color-brand)' : 'var(--color-bg-alt)'};
                color: ${activeExample() === 'form' ? 'white' : 'var(--color-text)'};
                border: 1px solid ${activeExample() === 'form' ? 'var(--color-brand)' : 'var(--color-border)'};
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all var(--transition-base);
              `}
            >
              Forms
            </button>
            <button
              onClick={() => handleExampleChange('animation')}
              style={`
                padding: 0.75rem 1.5rem;
                background: ${activeExample() === 'animation' ? 'var(--color-brand)' : 'var(--color-bg-alt)'};
                color: ${activeExample() === 'animation' ? 'white' : 'var(--color-text)'};
                border: 1px solid ${activeExample() === 'animation' ? 'var(--color-brand)' : 'var(--color-border)'};
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all var(--transition-base);
              `}
            >
              Animations
            </button>
          </div>

          {/* Current Example - use conditional rendering for each */}
          <div>
            {activeExample() === 'counter' && (
              <>
                <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem;">
                  {EXAMPLES_DATA.counter.title}
                </h2>
                <p style="font-size: 1.125rem; color: var(--color-text-secondary); margin-bottom: 2rem;">
                  {EXAMPLES_DATA.counter.description}
                </p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 3rem;">
                  <div>
                    <div style="padding: 0.75rem 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px 8px 0 0; font-weight: 600; color: #10b981;">
                      ✅ PhilJS (Simple)
                    </div>
                    <CodeBlock code={EXAMPLES_DATA.counter.code} language="tsx" />
                  </div>
                  <div>
                    <div style="padding: 0.75rem 1rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px 8px 0 0; font-weight: 600; color: #ef4444;">
                      ❌ React (Complex)
                    </div>
                    <CodeBlock code={EXAMPLES_DATA.counter.comparison} language="tsx" />
                  </div>
                </div>
              </>
            )}

            {activeExample() === 'todo' && (
              <>
                <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem;">
                  {EXAMPLES_DATA.todo.title}
                </h2>
                <p style="font-size: 1.125rem; color: var(--color-text-secondary); margin-bottom: 2rem;">
                  {EXAMPLES_DATA.todo.description}
                </p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 3rem;">
                  <div>
                    <div style="padding: 0.75rem 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px 8px 0 0; font-weight: 600; color: #10b981;">
                      ✅ PhilJS (Simple)
                    </div>
                    <CodeBlock code={EXAMPLES_DATA.todo.code} language="tsx" />
                  </div>
                  <div>
                    <div style="padding: 0.75rem 1rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px 8px 0 0; font-weight: 600; color: #ef4444;">
                      ❌ React (Complex)
                    </div>
                    <CodeBlock code={EXAMPLES_DATA.todo.comparison} language="tsx" />
                  </div>
                </div>
              </>
            )}

            {activeExample() === 'fetch' && (
              <>
                <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem;">
                  {EXAMPLES_DATA.fetch.title}
                </h2>
                <p style="font-size: 1.125rem; color: var(--color-text-secondary); margin-bottom: 2rem;">
                  {EXAMPLES_DATA.fetch.description}
                </p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 3rem;">
                  <div>
                    <div style="padding: 0.75rem 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px 8px 0 0; font-weight: 600; color: #10b981;">
                      ✅ PhilJS (Simple)
                    </div>
                    <CodeBlock code={EXAMPLES_DATA.fetch.code} language="tsx" />
                  </div>
                  <div>
                    <div style="padding: 0.75rem 1rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px 8px 0 0; font-weight: 600; color: #ef4444;">
                      ❌ React (Complex)
                    </div>
                    <CodeBlock code={EXAMPLES_DATA.fetch.comparison} language="tsx" />
                  </div>
                </div>
              </>
            )}

            {activeExample() === 'form' && (
              <>
                <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem;">
                  {EXAMPLES_DATA.form.title}
                </h2>
                <p style="font-size: 1.125rem; color: var(--color-text-secondary); margin-bottom: 2rem;">
                  {EXAMPLES_DATA.form.description}
                </p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 3rem;">
                  <div>
                    <div style="padding: 0.75rem 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px 8px 0 0; font-weight: 600; color: #10b981;">
                      ✅ PhilJS (Simple)
                    </div>
                    <CodeBlock code={EXAMPLES_DATA.form.code} language="tsx" />
                  </div>
                  <div>
                    <div style="padding: 0.75rem 1rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px 8px 0 0; font-weight: 600; color: #ef4444;">
                      ❌ React (Complex)
                    </div>
                    <CodeBlock code={EXAMPLES_DATA.form.comparison} language="tsx" />
                  </div>
                </div>
              </>
            )}

            {activeExample() === 'animation' && (
              <>
                <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem;">
                  {EXAMPLES_DATA.animation.title}
                </h2>
                <p style="font-size: 1.125rem; color: var(--color-text-secondary); margin-bottom: 2rem;">
                  {EXAMPLES_DATA.animation.description}
                </p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 3rem;">
                  <div>
                    <div style="padding: 0.75rem 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px 8px 0 0; font-weight: 600; color: #10b981;">
                      ✅ PhilJS (Simple)
                    </div>
                    <CodeBlock code={EXAMPLES_DATA.animation.code} language="tsx" />
                  </div>
                  <div>
                    <div style="padding: 0.75rem 1rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px 8px 0 0; font-weight: 600; color: #ef4444;">
                      ❌ React (Complex)
                    </div>
                    <CodeBlock code={EXAMPLES_DATA.animation.comparison} language="tsx" />
                  </div>
                </div>
              </>
            )}

            {/* CTA */}
            <div style="
              padding: 2rem;
              background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1));
              border: 1px solid var(--color-border);
              border-radius: 12px;
              text-align: center;
            ">
              <h3 style="
                font-size: 1.5rem;
                font-weight: 600;
                margin-bottom: 1rem;
              ">
                Ready to try it yourself?
              </h3>
              <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                <button
                  onClick={() => navigate('/docs')}
                  style="
                    padding: 0.75rem 1.5rem;
                    background: var(--color-brand);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all var(--transition-base);
                  "
                  onMouseEnter={(e) => (e.target as HTMLElement).style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.transform = 'scale(1)'}
                >
                  Read the Docs →
                </button>
                <button
                  onClick={() => navigate('/')}
                  style="
                    padding: 0.75rem 1.5rem;
                    background: var(--color-bg);
                    color: var(--color-text);
                    border: 1px solid var(--color-border);
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all var(--transition-base);
                  "
                  onMouseEnter={(e) => (e.target as HTMLElement).style.borderColor = 'var(--color-brand)'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.borderColor = 'var(--color-border)'}
                >
                  ← Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style="
        background: var(--color-bg-alt);
        border-top: 1px solid var(--color-border);
        padding: 2rem 0;
        margin-top: 4rem;
      ">
        <div class="container" style="text-align: center; color: var(--color-text-secondary); font-size: 0.875rem;">
          <p>© 2025 PhilJS. MIT License.</p>
        </div>
      </footer>
    </div>
  );
}
