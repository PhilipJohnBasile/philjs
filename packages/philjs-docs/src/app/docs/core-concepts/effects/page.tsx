import { Metadata } from 'next';
import { CodeBlock } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Effects - Core Concepts',
  description: 'Master side effects, lifecycle management, and reactive computations in PhilJS.',
};

export default function EffectsPage() {
  return (
    <div className="mdx-content">
      <h1>Effects & Lifecycle</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        Effects let you perform side effects like data fetching, DOM manipulation, and subscriptions in response to reactive changes.
      </p>

      <h2 id="create-effect">createEffect</h2>

      <p>
        Effects run immediately and automatically re-run when their dependencies change:
      </p>

      <CodeBlock
        code={`import { createSignal, createEffect } from 'philjs-core';

const [count, setCount] = createSignal(0);

createEffect(() => {
  console.log('Count is:', count());
});

// Logs: "Count is: 0"

setCount(1);
// Logs: "Count is: 1"`}
        language="typescript"
      />

      <Callout type="info" title="Automatic Tracking">
        Effects automatically track all signals read inside them. No dependency array needed!
      </Callout>

      <h2 id="lifecycle-hooks">Lifecycle Hooks</h2>

      <h3>onMount</h3>

      <p>
        Runs once when the component is first created:
      </p>

      <CodeBlock
        code={`import { onMount } from 'philjs-core';

function DataComponent() {
  const [data, setData] = createSignal(null);

  onMount(async () => {
    console.log('Component mounted');
    const result = await fetchData();
    setData(result);
  });

  return <div>{data() || 'Loading...'}</div>;
}`}
        language="typescript"
      />

      <h3>onCleanup</h3>

      <p>
        Register cleanup functions for subscriptions, timers, and event listeners:
      </p>

      <CodeBlock
        code={`import { onMount, onCleanup } from 'philjs-core';

function Timer() {
  const [seconds, setSeconds] = createSignal(0);

  onMount(() => {
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    onCleanup(() => {
      console.log('Cleaning up timer');
      clearInterval(interval);
    });
  });

  return <div>Elapsed: {seconds()}s</div>;
}

// Cleanup also works in effects
createEffect(() => {
  const subscription = observable.subscribe(value => {
    console.log(value);
  });

  onCleanup(() => subscription.unsubscribe());
});`}
        language="typescript"
      />

      <h2 id="create-memo">createMemo</h2>

      <p>
        Memos are cached computed values that only recalculate when dependencies change:
      </p>

      <CodeBlock
        code={`import { createSignal, createMemo } from 'philjs-core';

const [firstName, setFirstName] = createSignal('John');
const [lastName, setLastName] = createSignal('Doe');

const fullName = createMemo(() => {
  console.log('Computing full name');
  return \`\${firstName()} \${lastName()}\`;
});

// First access - computes
console.log(fullName()); // Logs: "Computing full name", "John Doe"

// Second access - uses cache
console.log(fullName()); // Just "John Doe"

// Update dependency - recomputes
setFirstName('Jane');
console.log(fullName()); // Logs: "Computing full name", "Jane Doe"`}
        language="typescript"
      />

      <h3>When to Use Memos</h3>

      <ul>
        <li>Expensive computations that should be cached</li>
        <li>Derived state from multiple signals</li>
        <li>Filtering or transforming lists</li>
        <li>Complex calculations in JSX</li>
      </ul>

      <CodeBlock
        code={`const [todos, setTodos] = createSignal<Todo[]>([]);
const [filter, setFilter] = createSignal<'all' | 'active' | 'completed'>('all');

// Good: Expensive filtering is memoized
const filteredTodos = createMemo(() => {
  const allTodos = todos();
  const currentFilter = filter();

  return currentFilter === 'all'
    ? allTodos
    : allTodos.filter(t =>
        currentFilter === 'active' ? !t.completed : t.completed
      );
});

// Bad: Recomputes on every render
return (
  <For each={todos().filter(t => !t.completed)}>
    {/* ... */}
  </For>
);`}
        language="typescript"
      />

      <h2 id="effect-patterns">Effect Patterns</h2>

      <h3>Data Fetching</h3>

      <CodeBlock
        code={`function UserProfile(props: { userId: string }) {
  const [user, setUser] = createSignal<User | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<Error | null>(null);

  createEffect(() => {
    const id = props.userId; // Track userId changes

    setLoading(true);
    setError(null);

    fetch(\`/api/users/\${id}\`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  });

  return (
    <Show when={!loading()} fallback={<Spinner />}>
      <Show when={!error()} fallback={<Error error={error()!} />}>
        <div>{user()?.name}</div>
      </Show>
    </Show>
  );
}`}
        language="typescript"
      />

      <h3>Local Storage Sync</h3>

      <CodeBlock
        code={`function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = createSignal<T>(initial);

  // Load from localStorage on mount
  onMount(() => {
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setValue(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored value:', e);
      }
    }
  });

  // Save to localStorage on changes
  createEffect(() => {
    localStorage.setItem(key, JSON.stringify(value()));
  });

  return [value, setValue] as const;
}

// Usage
const [theme, setTheme] = useLocalStorage('theme', 'light');`}
        language="typescript"
      />

      <h3>Event Listeners</h3>

      <CodeBlock
        code={`function useWindowSize() {
  const [width, setWidth] = createSignal(window.innerWidth);
  const [height, setHeight] = createSignal(window.innerHeight);

  onMount(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    onCleanup(() => {
      window.removeEventListener('resize', handleResize);
    });
  });

  return { width, height };
}

// Usage
function ResponsiveComponent() {
  const { width, height } = useWindowSize();

  return <div>Window size: {width()} x {height()}</div>;
}`}
        language="typescript"
      />

      <h2 id="createResource">createResource</h2>

      <p>
        Resources simplify async data fetching with built-in loading and error states:
      </p>

      <CodeBlock
        code={`import { createResource } from 'philjs-core';

const [userId, setUserId] = createSignal(1);

const [user] = createResource(
  userId, // Source signal - refetches when this changes
  async (id) => {
    const res = await fetch(\`/api/users/\${id}\`);
    return res.json();
  }
);

return (
  <div>
    <Show when={!user.loading} fallback={<p>Loading...</p>}>
      <Show when={!user.error} fallback={<p>Error: {user.error.message}</p>}>
        <h1>{user()?.name}</h1>
      </Show>
    </Show>
  </div>
);`}
        language="typescript"
      />

      <h3>Resource Methods</h3>

      <CodeBlock
        code={`const [data, { refetch, mutate }] = createResource(fetcher);

// Refetch the data
refetch();

// Optimistically update
mutate(newValue);

// Check state
data.loading; // boolean
data.error; // Error | null
data.state; // 'pending' | 'ready' | 'refreshing' | 'errored'`}
        language="typescript"
      />

      <h2 id="batch">Batch Updates</h2>

      <CodeBlock
        code={`import { batch } from 'philjs-core';

const [firstName, setFirstName] = createSignal('John');
const [lastName, setLastName] = createSignal('Doe');

createEffect(() => {
  console.log(\`\${firstName()} \${lastName()}\`);
});

// Without batch: effect runs twice
setFirstName('Jane');
setLastName('Smith');
// Logs: "Jane Doe"
// Logs: "Jane Smith"

// With batch: effect runs once
batch(() => {
  setFirstName('Alice');
  setLastName('Johnson');
});
// Logs: "Alice Johnson"`}
        language="typescript"
      />

      <h2 id="untrack">Untracked Reads</h2>

      <CodeBlock
        code={`import { untrack } from 'philjs-core';

const [count, setCount] = createSignal(0);
const [multiplier, setMultiplier] = createSignal(2);

// Effect only tracks count, not multiplier
createEffect(() => {
  const currentCount = count();
  const currentMultiplier = untrack(multiplier);
  console.log(currentCount * currentMultiplier);
});

setCount(5); // Logs: 10
setMultiplier(3); // Doesn't log (not tracked)`}
        language="typescript"
      />

      <h2 id="on">on() - Explicit Dependencies</h2>

      <CodeBlock
        code={`import { on } from 'philjs-core';

const [a, setA] = createSignal(0);
const [b, setB] = createSignal(0);

// Only track 'a', even though we read 'b'
createEffect(
  on(a, (value) => {
    console.log('a changed to:', value);
    console.log('b is:', b()); // Read but don't track
  })
);

setA(1); // Logs
setB(2); // Doesn't log`}
        language="typescript"
      />

      <h2 id="createDeferred">createDeferred</h2>

      <p>
        Defer updates to reduce unnecessary work during rapid changes:
      </p>

      <CodeBlock
        code={`import { createDeferred } from 'philjs-core';

const [input, setInput] = createSignal('');
const deferredInput = createDeferred(input, { timeoutMs: 500 });

// deferredInput only updates after 500ms of no changes
createEffect(() => {
  // Expensive operation
  searchAPI(deferredInput());
});

// Rapid typing only triggers one search
setInput('h');
setInput('he');
setInput('hel');
setInput('hello'); // Search runs 500ms after this`}
        language="typescript"
      />

      <h2 id="best-practices">Best Practices</h2>

      <ol>
        <li><strong>Use memos for computations:</strong> Don't repeat expensive calculations</li>
        <li><strong>Clean up effects:</strong> Always use <code>onCleanup</code> for resources</li>
        <li><strong>Batch related updates:</strong> Prevent unnecessary effect runs</li>
        <li><strong>Use resources for async:</strong> Simpler than manual effect + state</li>
        <li><strong>Avoid conditional reads:</strong> Read signals at the top level of effects</li>
        <li><strong>Be careful with dependencies:</strong> Understand what triggers re-runs</li>
      </ol>

      <h2 id="common-pitfalls">Common Pitfalls</h2>

      <h3>Reading Signals Outside Effects</h3>

      <CodeBlock
        code={`// Bad: Read outside effect
const value = count();
createEffect(() => {
  console.log(value); // Won't update!
});

// Good: Read inside effect
createEffect(() => {
  console.log(count()); // Updates correctly
});`}
        language="typescript"
      />

      <h3>Infinite Loops</h3>

      <CodeBlock
        code={`// Bad: Creates infinite loop
const [count, setCount] = createSignal(0);
createEffect(() => {
  setCount(count() + 1); // Triggers effect again!
});

// Good: Guard condition or use different approach
createEffect(() => {
  if (count() < 10) {
    setCount(count() + 1);
  }
});`}
        language="typescript"
      />

      <h2 id="next-steps">Next Steps</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/core-concepts/stores"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Stores</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Learn about nested reactive state
          </p>
        </Link>

        <Link
          href="/docs/api/core"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">API Reference</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Complete philjs-core API docs
          </p>
        </Link>
      </div>
    </div>
  );
}
