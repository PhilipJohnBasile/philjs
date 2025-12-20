/**
 * Basic usage example of PhilJS Optimizer
 */

import { $, $$ } from 'philjs-core/lazy-handlers';
import { signal } from 'philjs-core';

/**
 * Example 1: Basic lazy event handler
 */
function BasicExample() {
  const count = signal(0);

  return (
    <div>
      <h1>Count: {count()}</h1>
      {/* Handler is lazy-loaded only when clicked */}
      <button onClick={$(() => count.set(count() + 1))}>
        Increment
      </button>
    </div>
  );
}

/**
 * Example 2: Named lazy handler (reusable)
 */
const handleSubmit = $$('handleContactForm', async (event: Event) => {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const formData = new FormData(form);

  // Simulate API call
  await fetch('/api/contact', {
    method: 'POST',
    body: formData,
  });

  alert('Form submitted!');
});

function ContactForm() {
  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <textarea name="message" required />
      <button type="submit">Send</button>
    </form>
  );
}

/**
 * Example 3: Complex interactions
 */
function TodoApp() {
  const todos = signal<string[]>([]);
  const input = signal('');

  return (
    <div>
      <h1>Todo List</h1>
      <input
        value={input()}
        onInput={$((e: InputEvent) => {
          const target = e.target as HTMLInputElement;
          input.set(target.value);
        })}
      />
      <button
        onClick={$(() => {
          if (input().trim()) {
            todos.set([...todos(), input()]);
            input.set('');
          }
        })}
      >
        Add Todo
      </button>
      <ul>
        {todos().map((todo, index) => (
          <li>
            {todo}
            <button
              onClick={$(() => {
                todos.set(todos().filter((_, i) => i !== index));
              })}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Example 4: Prefetching handlers
 */
import { prefetchHandler } from 'philjs-core/lazy-handlers';

function OptimizedComponent() {
  // Prefetch handler on hover for better UX
  const handleClick = $$('expensiveOperation', async () => {
    // Some expensive operation
    const result = await heavyComputation();
    console.log(result);
  });

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => prefetchHandler('expensiveOperation')}
    >
      Run Expensive Operation
    </button>
  );
}

async function heavyComputation() {
  // Simulate heavy computation
  return new Promise((resolve) => setTimeout(() => resolve('Done!'), 1000));
}

export { BasicExample, ContactForm, TodoApp, OptimizedComponent };
