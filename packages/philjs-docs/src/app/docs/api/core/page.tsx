import { Metadata } from 'next';
import { APIReference } from '@/components/APIReference';

export const metadata: Metadata = {
  title: 'philjs-core API Reference',
  description: 'Complete API documentation for philjs-core - signals, effects, components, and more.',
};

export default function CoreAPIPage() {
  return (
    <APIReference
      title="philjs-core"
      description="The core reactivity system and component primitives for PhilJS."
      sourceLink="https://github.com/philjs/philjs/tree/main/packages/philjs-core"
      methods={[
        {
          name: 'createSignal',
          signature: 'function createSignal<T>(initialValue: T, options?: SignalOptions<T>): [Accessor<T>, Setter<T>]',
          description: 'Creates a reactive signal with a getter and setter.',
          parameters: [
            {
              name: 'initialValue',
              type: 'T',
              description: 'The initial value of the signal',
            },
            {
              name: 'options',
              type: 'SignalOptions<T>',
              description: 'Optional configuration for the signal',
              optional: true,
            },
          ],
          returns: {
            type: '[Accessor<T>, Setter<T>]',
            description: 'A tuple with getter and setter functions',
          },
          example: `const [count, setCount] = createSignal(0);

console.log(count()); // 0
setCount(5);
console.log(count()); // 5

// With updater function
setCount(prev => prev + 1);
console.log(count()); // 6

// With options
const [value, setValue] = createSignal(
  { x: 0, y: 0 },
  { equals: (a, b) => a.x === b.x && a.y === b.y }
);`,
          since: '1.0.0',
        },
        {
          name: 'createEffect',
          signature: 'function createEffect<T>(fn: (prev?: T) => T, value?: T): void',
          description: 'Creates a side effect that automatically tracks and re-runs when dependencies change.',
          parameters: [
            {
              name: 'fn',
              type: '(prev?: T) => T',
              description: 'The effect function to run',
            },
            {
              name: 'value',
              type: 'T',
              description: 'Optional initial value passed to the effect',
              optional: true,
            },
          ],
          example: `const [count, setCount] = createSignal(0);

createEffect(() => {
  console.log('Count changed:', count());
});

setCount(1); // Logs: "Count changed: 1"

// With previous value
createEffect((prev = 0) => {
  const current = count();
  console.log(\`Changed from \${prev} to \${current}\`);
  return current;
});`,
          since: '1.0.0',
        },
        {
          name: 'createMemo',
          signature: 'function createMemo<T>(fn: (prev?: T) => T, value?: T, options?: MemoOptions<T>): Accessor<T>',
          description: 'Creates a memoized computed value that only recalculates when dependencies change.',
          parameters: [
            {
              name: 'fn',
              type: '(prev?: T) => T',
              description: 'The computation function',
            },
            {
              name: 'value',
              type: 'T',
              description: 'Optional initial value',
              optional: true,
            },
            {
              name: 'options',
              type: 'MemoOptions<T>',
              description: 'Optional configuration',
              optional: true,
            },
          ],
          returns: {
            type: 'Accessor<T>',
            description: 'A getter function that returns the memoized value',
          },
          example: `const [firstName, setFirstName] = createSignal('John');
const [lastName, setLastName] = createSignal('Doe');

const fullName = createMemo(() => {
  console.log('Computing...');
  return \`\${firstName()} \${lastName()}\`;
});

console.log(fullName()); // "Computing...", "John Doe"
console.log(fullName()); // "John Doe" (cached)

setFirstName('Jane');
console.log(fullName()); // "Computing...", "Jane Doe"`,
          since: '1.0.0',
        },
        {
          name: 'createResource',
          signature: 'function createResource<T, S>(source: Accessor<S> | false | null | undefined, fetcher: (source: S, info: ResourceFetcherInfo) => T | Promise<T>): ResourceReturn<T>',
          description: 'Creates a resource for async data fetching with loading and error states.',
          parameters: [
            {
              name: 'source',
              type: 'Accessor<S>',
              description: 'Source signal that triggers refetching when it changes',
            },
            {
              name: 'fetcher',
              type: '(source: S) => T | Promise<T>',
              description: 'Async function that fetches the data',
            },
          ],
          returns: {
            type: 'ResourceReturn<T>',
            description: 'Resource accessor and control methods',
          },
          example: `const [userId, setUserId] = createSignal(1);

const [user, { refetch, mutate }] = createResource(
  userId,
  async (id) => {
    const res = await fetch(\`/api/users/\${id}\`);
    return res.json();
  }
);

// Access data
user(); // User | undefined
user.loading; // boolean
user.error; // Error | null
user.state; // 'pending' | 'ready' | 'refreshing' | 'errored'

// Refetch
refetch();

// Optimistic update
mutate(newUserData);`,
          since: '1.0.0',
        },
        {
          name: 'createStore',
          signature: 'function createStore<T extends object>(initial: T): [Store<T>, SetStoreFunction<T>]',
          description: 'Creates a reactive store for nested state with fine-grained updates.',
          parameters: [
            {
              name: 'initial',
              type: 'T',
              description: 'The initial state object',
            },
          ],
          returns: {
            type: '[Store<T>, SetStoreFunction<T>]',
            description: 'Store accessor and setter function',
          },
          example: `const [state, setState] = createStore({
  user: {
    name: 'Alice',
    age: 30,
  },
  todos: [
    { id: 1, text: 'Learn PhilJS', done: false },
  ],
});

// Read
console.log(state.user.name); // 'Alice'

// Update nested
setState('user', 'age', 31);

// Update with function
setState('user', 'age', age => age + 1);

// Array operations
setState('todos', 0, 'done', true);`,
          since: '1.0.0',
        },
        {
          name: 'onMount',
          signature: 'function onMount(fn: () => void): void',
          description: 'Runs a function once when the component is first created and inserted into the DOM.',
          parameters: [
            {
              name: 'fn',
              type: '() => void',
              description: 'The function to run on mount',
            },
          ],
          example: `function Component() {
  onMount(() => {
    console.log('Component mounted!');
    fetchData();
  });

  return <div>Hello</div>;
}`,
          since: '1.0.0',
        },
        {
          name: 'onCleanup',
          signature: 'function onCleanup(fn: () => void): void',
          description: 'Registers a cleanup function to run when the current scope is disposed.',
          parameters: [
            {
              name: 'fn',
              type: '() => void',
              description: 'The cleanup function',
            },
          ],
          example: `function Timer() {
  const [time, setTime] = createSignal(0);

  onMount(() => {
    const interval = setInterval(() => {
      setTime(t => t + 1);
    }, 1000);

    onCleanup(() => clearInterval(interval));
  });

  return <div>{time()}s</div>;
}`,
          since: '1.0.0',
        },
        {
          name: 'batch',
          signature: 'function batch<T>(fn: () => T): T',
          description: 'Batches multiple signal updates to prevent unnecessary re-computations.',
          parameters: [
            {
              name: 'fn',
              type: '() => T',
              description: 'Function containing the batched updates',
            },
          ],
          returns: {
            type: 'T',
            description: 'The return value of the function',
          },
          example: `const [first, setFirst] = createSignal('John');
const [last, setLast] = createSignal('Doe');

createEffect(() => {
  console.log(\`\${first()} \${last()}\`);
});

// Without batch: logs twice
setFirst('Jane');
setLast('Smith');

// With batch: logs once
batch(() => {
  setFirst('Alice');
  setLast('Johnson');
});`,
          since: '1.0.0',
        },
        {
          name: 'untrack',
          signature: 'function untrack<T>(fn: () => T): T',
          description: 'Reads signals without creating dependencies in the current tracking scope.',
          parameters: [
            {
              name: 'fn',
              type: '() => T',
              description: 'Function to run without tracking',
            },
          ],
          returns: {
            type: 'T',
            description: 'The return value of the function',
          },
          example: `const [count, setCount] = createSignal(0);
const [name, setName] = createSignal('Alice');

createEffect(() => {
  console.log('Count:', count());
  console.log('Name:', untrack(name)); // Won't track
});

setCount(1); // Logs
setName('Bob'); // Doesn't log`,
          since: '1.0.0',
        },
        {
          name: 'createContext',
          signature: 'function createContext<T>(defaultValue?: T): Context<T>',
          description: 'Creates a context object for passing data through the component tree.',
          parameters: [
            {
              name: 'defaultValue',
              type: 'T',
              description: 'Optional default value',
              optional: true,
            },
          ],
          returns: {
            type: 'Context<T>',
            description: 'Context object',
          },
          example: `const ThemeContext = createContext<'light' | 'dark'>('light');

function App() {
  const [theme, setTheme] = createSignal<'light' | 'dark'>('dark');

  return (
    <ThemeContext.Provider value={theme()}>
      <Child />
    </ThemeContext.Provider>
  );
}

function Child() {
  const theme = useContext(ThemeContext);
  return <div className={theme}>Content</div>;
}`,
          since: '1.0.0',
        },
        {
          name: 'useContext',
          signature: 'function useContext<T>(context: Context<T>): T',
          description: 'Retrieves the value from a context.',
          parameters: [
            {
              name: 'context',
              type: 'Context<T>',
              description: 'The context object',
            },
          ],
          returns: {
            type: 'T',
            description: 'The context value',
          },
          example: `const MyContext = createContext<string>();

function Child() {
  const value = useContext(MyContext);
  return <div>{value}</div>;
}`,
          since: '1.0.0',
        },
        {
          name: 'lazy',
          signature: 'function lazy<T extends Component<any>>(fn: () => Promise<{ default: T }>): T',
          description: 'Lazy loads a component for code splitting.',
          parameters: [
            {
              name: 'fn',
              type: '() => Promise<{ default: T }>',
              description: 'Function that returns a dynamic import',
            },
          ],
          returns: {
            type: 'T',
            description: 'The lazy-loaded component',
          },
          example: `const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyComponent />
    </Suspense>
  );
}`,
          since: '1.0.0',
        },
      ]}
      types={[
        {
          name: 'Accessor',
          kind: 'type',
          description: 'A function that returns the current value of a signal or memo.',
          example: `type Accessor<T> = () => T;

const count: Accessor<number> = createSignal(0)[0];
console.log(count()); // 0`,
        },
        {
          name: 'Setter',
          kind: 'type',
          description: 'A function that sets a new value for a signal.',
          example: `type Setter<T> = (value: T | ((prev: T) => T)) => T;

const setCount: Setter<number> = createSignal(0)[1];
setCount(5);
setCount(prev => prev + 1);`,
        },
        {
          name: 'SignalOptions',
          kind: 'interface',
          description: 'Options for configuring signal behavior.',
          properties: [
            {
              name: 'equals',
              type: '(prev: T, next: T) => boolean',
              description: 'Custom equality function',
              optional: true,
              default: 'Object.is',
            },
            {
              name: 'name',
              type: 'string',
              description: 'Debug name for the signal',
              optional: true,
            },
          ],
        },
        {
          name: 'ResourceReturn',
          kind: 'type',
          description: 'Return type of createResource with data accessor and control methods.',
          properties: [
            {
              name: 'loading',
              type: 'boolean',
              description: 'Whether the resource is currently loading',
            },
            {
              name: 'error',
              type: 'Error | null',
              description: 'Error if the fetch failed',
            },
            {
              name: 'state',
              type: "'pending' | 'ready' | 'refreshing' | 'errored'",
              description: 'Current state of the resource',
            },
          ],
        },
      ]}
    />
  );
}
