import { Metadata } from 'next';
import { CodeBlock } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'PhilJS vs React',
  description: 'Compare PhilJS with React - understand the differences in reactivity, performance, and developer experience.',
};

export default function ReactComparisonPage() {
  return (
    <div className="mdx-content">
      <h1>PhilJS vs React</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        PhilJS and React share similar JSX syntax but differ fundamentally in their
        reactivity model. This guide helps React developers understand PhilJS.
      </p>

      <h2 id="reactivity">Reactivity Model</h2>

      <div className="grid md:grid-cols-2 gap-4 my-6">
        <div>
          <h4 className="font-semibold mb-2">React (Virtual DOM)</h4>
          <CodeBlock
            code={`function Counter() {
  const [count, setCount] = useState(0);

  // Entire component re-renders when count changes
  console.log('Component rendered');

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
    </div>
  );
}`}
            language="typescript"
            showLineNumbers={false}
          />
        </div>

        <div>
          <h4 className="font-semibold mb-2">PhilJS (Fine-grained)</h4>
          <CodeBlock
            code={`function Counter() {
  const [count, setCount] = createSignal(0);

  // Only runs once - component doesn't re-render
  console.log('Component setup');

  return (
    <div>
      {/* Only this text node updates */}
      <p>Count: {count()}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
    </div>
  );
}`}
            language="typescript"
            showLineNumbers={false}
          />
        </div>
      </div>

      <Callout type="info" title="Key Difference">
        In React, state changes trigger component re-renders and Virtual DOM diffing.
        In PhilJS, state changes directly update only the affected DOM nodes.
      </Callout>

      <h2 id="state">State Management</h2>

      <h3>useState vs createSignal</h3>

      <div className="grid md:grid-cols-2 gap-4 my-6">
        <div>
          <h4 className="font-semibold mb-2">React</h4>
          <CodeBlock
            code={`const [user, setUser] = useState({
  name: 'Alice',
  age: 30
});

// Must spread to update
setUser({ ...user, age: 31 });

// Or use callback
setUser(prev => ({ ...prev, age: 31 }));`}
            language="typescript"
            showLineNumbers={false}
          />
        </div>

        <div>
          <h4 className="font-semibold mb-2">PhilJS</h4>
          <CodeBlock
            code={`const [user, setUser] = createSignal({
  name: 'Alice',
  age: 30
});

// Same pattern works
setUser({ ...user(), age: 31 });

// Or use callback
setUser(prev => ({ ...prev, age: 31 }));`}
            language="typescript"
            showLineNumbers={false}
          />
        </div>
      </div>

      <h3>useReducer vs createStore</h3>

      <div className="grid md:grid-cols-2 gap-4 my-6">
        <div>
          <h4 className="font-semibold mb-2">React</h4>
          <CodeBlock
            code={`const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_NAME':
      return { ...state, name: action.payload };
    case 'INCREMENT_AGE':
      return { ...state, age: state.age + 1 };
    default:
      return state;
  }
};

const [state, dispatch] = useReducer(reducer, {
  name: 'Alice',
  age: 30
});

dispatch({ type: 'SET_NAME', payload: 'Bob' });`}
            language="typescript"
            showLineNumbers={false}
          />
        </div>

        <div>
          <h4 className="font-semibold mb-2">PhilJS</h4>
          <CodeBlock
            code={`const [state, setState] = createStore({
  name: 'Alice',
  age: 30
});

// Direct path-based updates
setState('name', 'Bob');
setState('age', age => age + 1);

// Nested updates
setState('user', 'profile', 'bio', 'Updated');

// Array operations
setState('items', 0, 'done', true);`}
            language="typescript"
            showLineNumbers={false}
          />
        </div>
      </div>

      <h2 id="effects">Side Effects</h2>

      <div className="grid md:grid-cols-2 gap-4 my-6">
        <div>
          <h4 className="font-semibold mb-2">React useEffect</h4>
          <CodeBlock
            code={`useEffect(() => {
  console.log('Count:', count);

  return () => {
    console.log('Cleanup');
  };
}, [count]); // Manual dependency array`}
            language="typescript"
            showLineNumbers={false}
          />
        </div>

        <div>
          <h4 className="font-semibold mb-2">PhilJS createEffect</h4>
          <CodeBlock
            code={`createEffect(() => {
  console.log('Count:', count());
  // Dependencies tracked automatically!

  onCleanup(() => {
    console.log('Cleanup');
  });
});`}
            language="typescript"
            showLineNumbers={false}
          />
        </div>
      </div>

      <Callout type="success" title="No Dependency Arrays">
        PhilJS automatically tracks which signals are read inside effects.
        No more missing dependencies or stale closures!
      </Callout>

      <h2 id="memoization">Memoization</h2>

      <div className="grid md:grid-cols-2 gap-4 my-6">
        <div>
          <h4 className="font-semibold mb-2">React useMemo</h4>
          <CodeBlock
            code={`const fullName = useMemo(() => {
  return \`\${firstName} \${lastName}\`;
}, [firstName, lastName]);

const expensiveValue = useMemo(() => {
  return computeExpensive(data);
}, [data]);`}
            language="typescript"
            showLineNumbers={false}
          />
        </div>

        <div>
          <h4 className="font-semibold mb-2">PhilJS createMemo</h4>
          <CodeBlock
            code={`const fullName = createMemo(() => {
  return \`\${firstName()} \${lastName()}\`;
}); // Auto-tracked

const expensiveValue = createMemo(() => {
  return computeExpensive(data());
}); // Cached until data changes`}
            language="typescript"
            showLineNumbers={false}
          />
        </div>
      </div>

      <h2 id="conditional-rendering">Conditional Rendering</h2>

      <div className="grid md:grid-cols-2 gap-4 my-6">
        <div>
          <h4 className="font-semibold mb-2">React</h4>
          <CodeBlock
            code={`{isLoggedIn ? (
  <Dashboard />
) : (
  <Login />
)}

{items.length > 0 && (
  <ItemList items={items} />
)}`}
            language="tsx"
            showLineNumbers={false}
          />
        </div>

        <div>
          <h4 className="font-semibold mb-2">PhilJS</h4>
          <CodeBlock
            code={`<Show
  when={isLoggedIn()}
  fallback={<Login />}
>
  <Dashboard />
</Show>

<Show when={items().length > 0}>
  <ItemList items={items()} />
</Show>`}
            language="tsx"
            showLineNumbers={false}
          />
        </div>
      </div>

      <h2 id="list-rendering">List Rendering</h2>

      <div className="grid md:grid-cols-2 gap-4 my-6">
        <div>
          <h4 className="font-semibold mb-2">React</h4>
          <CodeBlock
            code={`{items.map(item => (
  <li key={item.id}>
    {item.name}
  </li>
))}

// With index
{items.map((item, index) => (
  <li key={item.id}>
    {index}: {item.name}
  </li>
))}`}
            language="tsx"
            showLineNumbers={false}
          />
        </div>

        <div>
          <h4 className="font-semibold mb-2">PhilJS</h4>
          <CodeBlock
            code={`<For each={items()}>
  {(item) => (
    <li>{item.name}</li>
  )}
</For>

// With index signal
<For each={items()}>
  {(item, index) => (
    <li>{index()}: {item.name}</li>
  )}
</For>`}
            language="tsx"
            showLineNumbers={false}
          />
        </div>
      </div>

      <Callout type="info" title="For vs map">
        PhilJS's <code>&lt;For&gt;</code> component only re-renders items that change,
        while React's map re-runs for every item on any list change.
      </Callout>

      <h2 id="context">Context API</h2>

      <div className="grid md:grid-cols-2 gap-4 my-6">
        <div>
          <h4 className="font-semibold mb-2">React</h4>
          <CodeBlock
            code={`const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Child />
    </ThemeContext.Provider>
  );
}

function Child() {
  const theme = useContext(ThemeContext);
  return <div className={theme}>...</div>;
}`}
            language="tsx"
            showLineNumbers={false}
          />
        </div>

        <div>
          <h4 className="font-semibold mb-2">PhilJS</h4>
          <CodeBlock
            code={`const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Child />
    </ThemeContext.Provider>
  );
}

function Child() {
  const theme = useContext(ThemeContext);
  return <div class={theme}>...</div>;
}`}
            language="tsx"
            showLineNumbers={false}
          />
        </div>
      </div>

      <h2 id="refs">Refs</h2>

      <div className="grid md:grid-cols-2 gap-4 my-6">
        <div>
          <h4 className="font-semibold mb-2">React</h4>
          <CodeBlock
            code={`function Input() {
  const inputRef = useRef<HTMLInputElement>(null);

  const focus = () => {
    inputRef.current?.focus();
  };

  return (
    <>
      <input ref={inputRef} />
      <button onClick={focus}>Focus</button>
    </>
  );
}`}
            language="tsx"
            showLineNumbers={false}
          />
        </div>

        <div>
          <h4 className="font-semibold mb-2">PhilJS</h4>
          <CodeBlock
            code={`function Input() {
  let inputRef: HTMLInputElement;

  const focus = () => {
    inputRef?.focus();
  };

  return (
    <>
      <input ref={inputRef!} />
      <button onClick={focus}>Focus</button>
    </>
  );
}`}
            language="tsx"
            showLineNumbers={false}
          />
        </div>
      </div>

      <h2 id="performance">Performance Comparison</h2>

      <table className="w-full my-6">
        <thead>
          <tr>
            <th className="text-left">Aspect</th>
            <th className="text-left">React</th>
            <th className="text-left">PhilJS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Update Mechanism</td>
            <td>Virtual DOM Diffing</td>
            <td>Direct DOM Updates</td>
          </tr>
          <tr>
            <td>Re-render Scope</td>
            <td>Entire Component Tree</td>
            <td>Specific DOM Nodes</td>
          </tr>
          <tr>
            <td>Bundle Size</td>
            <td>~45KB (min+gzip)</td>
            <td>~8KB (min+gzip)</td>
          </tr>
          <tr>
            <td>Memory Usage</td>
            <td>Higher (VDOM)</td>
            <td>Lower (No VDOM)</td>
          </tr>
          <tr>
            <td>Dependency Tracking</td>
            <td>Manual</td>
            <td>Automatic</td>
          </tr>
        </tbody>
      </table>

      <h2 id="migration-tips">Migration Tips</h2>

      <ol>
        <li><strong>Replace useState with createSignal:</strong> Remember to call the getter function</li>
        <li><strong>Remove dependency arrays:</strong> Effects track dependencies automatically</li>
        <li><strong>Use Show/For:</strong> Replace ternaries and map with components</li>
        <li><strong>Think in signals:</strong> State updates don't trigger re-renders</li>
        <li><strong>Check the migration guide:</strong> <Link href="/docs/tutorials/migration-from-react">Full migration tutorial</Link></li>
      </ol>

      <h2 id="next-steps">Next Steps</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/tutorials/migration-from-react"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Migration Guide</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Step-by-step React to PhilJS migration
          </p>
        </Link>

        <Link
          href="/docs/core-concepts/signals"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Learn Signals</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Deep dive into PhilJS reactivity
          </p>
        </Link>
      </div>
    </div>
  );
}
