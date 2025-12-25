import { Metadata } from 'next';
import { CodeBlock } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Signals - Core Concepts',
  description: 'Learn about PhilJS\'s reactive signals system - the foundation of fine-grained reactivity.',
};

export default function SignalsPage() {
  return (
    <div className="mdx-content">
      <h1>Signals</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        Signals are the foundation of PhilJS's fine-grained reactivity system. They're simple, powerful primitives for managing state.
      </p>

      <h2 id="what-are-signals">What Are Signals?</h2>

      <p>
        A signal is a reactive primitive that holds a value and notifies subscribers when that value changes.
        Unlike React's useState, signals don't cause component re-renders. Instead, they update only the
        specific DOM nodes that depend on them.
      </p>

      <CodeBlock
        code={`import { createSignal } from 'philjs-core';

const [count, setCount] = createSignal(0);

// Read the value
console.log(count()); // 0

// Update the value
setCount(1);
console.log(count()); // 1

// Update based on previous value
setCount(prev => prev + 1);
console.log(count()); // 2`}
        language="typescript"
      />

      <Callout type="info" title="Getter Functions">
        Signals return a getter function. Always call <code>count()</code> to read the value,
        not just <code>count</code>.
      </Callout>

      <h2 id="creating-signals">Creating Signals</h2>

      <CodeBlock
        code={`// Simple value
const [name, setName] = createSignal('Alice');

// Object
const [user, setUser] = createSignal({
  id: 1,
  name: 'Alice',
  email: 'alice@example.com'
});

// Array
const [items, setItems] = createSignal<string[]>([]);

// With type annotation
const [count, setCount] = createSignal<number>(0);

// Optional initial value (undefined by default)
const [value, setValue] = createSignal<string>();
console.log(value()); // undefined`}
        language="typescript"
      />

      <h2 id="updating-signals">Updating Signals</h2>

      <h3>Direct Updates</h3>

      <CodeBlock
        code={`const [count, setCount] = createSignal(0);

// Set a new value
setCount(10);

// Update based on previous value
setCount(prev => prev + 1);`}
        language="typescript"
      />

      <h3>Object Updates</h3>

      <CodeBlock
        code={`const [user, setUser] = createSignal({
  name: 'Alice',
  age: 30
});

// Replace entire object
setUser({ name: 'Bob', age: 25 });

// Update specific properties (spread pattern)
setUser(prev => ({ ...prev, age: 31 }));

// Multiple updates
setUser(prev => ({
  ...prev,
  age: prev.age + 1,
  lastUpdated: Date.now()
}));`}
        language="typescript"
      />

      <h3>Array Updates</h3>

      <CodeBlock
        code={`const [items, setItems] = createSignal<string[]>([]);

// Add item
setItems(prev => [...prev, 'new item']);

// Remove item
setItems(prev => prev.filter(item => item !== 'removed'));

// Update item
setItems(prev => prev.map(item =>
  item === 'old' ? 'new' : item
));

// Clear array
setItems([]);`}
        language="typescript"
      />

      <h2 id="reading-signals">Reading Signals</h2>

      <Callout type="warning" title="Common Mistake">
        Always call the getter function to read signal values. Reading <code>count</code> instead
        of <code>count()</code> won't track the dependency in effects!
      </Callout>

      <CodeBlock
        code={`const [count, setCount] = createSignal(0);

// Correct: Read value
const value = count();

// Wrong: This just references the getter function
const wrong = count; // typeof wrong === 'function'

// In JSX
function Counter() {
  const [count, setCount] = createSignal(0);

  return (
    <div>
      {/* Correct: */}
      <p>Count: {count()}</p>

      {/* Wrong - will display [Function] */}
      <p>Count: {count}</p>
    </div>
  );
}`}
        language="typescript"
      />

      <h2 id="reactivity">How Reactivity Works</h2>

      <p>
        Signals automatically track where they're being read and update only those locations:
      </p>

      <CodeBlock
        code={`import { createSignal, createEffect } from 'philjs-core';

const [count, setCount] = createSignal(0);

// This effect automatically subscribes to count
createEffect(() => {
  console.log('Count changed:', count());
});

// Logs: "Count changed: 0"

setCount(1);
// Logs: "Count changed: 1"

setCount(2);
// Logs: "Count changed: 2"`}
        language="typescript"
      />

      <h2 id="derived-signals">Derived Values with Memos</h2>

      <p>
        Create computed signals that automatically update when dependencies change:
      </p>

      <CodeBlock
        code={`import { createSignal, createMemo } from 'philjs-core';

const [firstName, setFirstName] = createSignal('John');
const [lastName, setLastName] = createSignal('Doe');

// Memo automatically tracks dependencies
const fullName = createMemo(() => {
  return \`\${firstName()} \${lastName()}\`;
});

console.log(fullName()); // "John Doe"

setFirstName('Jane');
console.log(fullName()); // "Jane Doe"`}
        language="typescript"
      />

      <Callout type="info" title="Memos are Cached">
        Memos only recalculate when their dependencies change. Multiple reads return the cached value.
      </Callout>

      <h2 id="batch-updates">Batch Updates</h2>

      <p>
        Batch multiple signal updates to prevent unnecessary re-computations:
      </p>

      <CodeBlock
        code={`import { createSignal, batch, createEffect } from 'philjs-core';

const [firstName, setFirstName] = createSignal('John');
const [lastName, setLastName] = createSignal('Doe');

createEffect(() => {
  console.log(\`Name: \${firstName()} \${lastName()}\`);
});

// Without batching: effect runs twice
setFirstName('Jane');
setLastName('Smith');
// Logs:
// "Name: Jane Doe"
// "Name: Jane Smith"

// With batching: effect runs once
batch(() => {
  setFirstName('Alice');
  setLastName('Johnson');
});
// Logs only:
// "Name: Alice Johnson"`}
        language="typescript"
      />

      <h2 id="untracked">Untracked Reads</h2>

      <p>
        Sometimes you need to read a signal without creating a dependency:
      </p>

      <CodeBlock
        code={`import { createSignal, createEffect, untrack } from 'philjs-core';

const [count, setCount] = createSignal(0);
const [name, setName] = createSignal('Alice');

createEffect(() => {
  console.log('Count:', count());

  // Read name without subscribing to it
  const currentName = untrack(name);
  console.log('Name (untracked):', currentName);
});

setCount(1);
// Logs:
// "Count: 1"
// "Name (untracked): Alice"

setName('Bob');
// Nothing logged - effect doesn't subscribe to name`}
        language="typescript"
      />

      <h2 id="signal-options">Signal Options</h2>

      <CodeBlock
        code={`import { createSignal } from 'philjs-core';

// Custom equality function
const [value, setValue] = createSignal(
  { x: 0, y: 0 },
  {
    equals: (a, b) => a.x === b.x && a.y === b.y
  }
);

// This won't trigger updates (same values)
setValue({ x: 0, y: 0 });

// This will trigger updates (different values)
setValue({ x: 1, y: 1 });`}
        language="typescript"
      />

      <h2 id="advanced-patterns">Advanced Patterns</h2>

      <h3>Signal Factories</h3>

      <CodeBlock
        code={`function createToggle(initial = false) {
  const [value, setValue] = createSignal(initial);

  return {
    value,
    toggle: () => setValue(v => !v),
    setTrue: () => setValue(true),
    setFalse: () => setValue(false),
  };
}

// Usage
const darkMode = createToggle(false);

darkMode.toggle();
console.log(darkMode.value()); // true

darkMode.setFalse();
console.log(darkMode.value()); // false`}
        language="typescript"
      />

      <h3>Signal Arrays</h3>

      <CodeBlock
        code={`function createSignalArray<T>(initial: T[] = []) {
  const [items, setItems] = createSignal<T[]>(initial);

  return {
    items,
    push: (item: T) => setItems(prev => [...prev, item]),
    pop: () => setItems(prev => prev.slice(0, -1)),
    remove: (index: number) =>
      setItems(prev => prev.filter((_, i) => i !== index)),
    update: (index: number, value: T) =>
      setItems(prev => prev.map((item, i) => i === index ? value : item)),
    clear: () => setItems([]),
  };
}

// Usage
const todos = createSignalArray<string>();
todos.push('Learn PhilJS');
todos.push('Build app');
console.log(todos.items()); // ['Learn PhilJS', 'Build app']`}
        language="typescript"
      />

      <h2 id="performance">Performance Considerations</h2>

      <ul>
        <li><strong>Fine-grained updates:</strong> Only affected DOM nodes update, not entire components</li>
        <li><strong>No virtual DOM:</strong> Direct DOM updates eliminate diffing overhead</li>
        <li><strong>Automatic tracking:</strong> No manual dependency arrays to maintain</li>
        <li><strong>Lazy evaluation:</strong> Memos only compute when accessed</li>
        <li><strong>Structural sharing:</strong> Updates don't require deep cloning</li>
      </ul>

      <h2 id="best-practices">Best Practices</h2>

      <ol>
        <li><strong>Keep signals simple:</strong> Store primitive values when possible</li>
        <li><strong>Use memos for derived state:</strong> Don't duplicate state</li>
        <li><strong>Batch related updates:</strong> Use <code>batch()</code> for multiple changes</li>
        <li><strong>Avoid conditionally reading signals:</strong> Always read at the top level of effects</li>
        <li><strong>Use stores for complex state:</strong> See <Link href="/docs/core-concepts/stores">Stores</Link> for nested reactivity</li>
      </ol>

      <h2 id="next-steps">Next Steps</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/core-concepts/components"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Components</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Learn how to build reusable components
          </p>
        </Link>

        <Link
          href="/docs/core-concepts/effects"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Effects</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Handle side effects and lifecycle
          </p>
        </Link>
      </div>
    </div>
  );
}
