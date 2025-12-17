/**
 * PhilJS Playground Examples
 */
export const exampleCode = {
    helloWorld: `// Hello World with PhilJS
const message = signal('Hello, PhilJS!');

function App() {
  return (
    <div>
      <h1>{message.get()}</h1>
      <input
        value={message.get()}
        onInput={(e) => message.set(e.target.value)}
      />
    </div>
  );
}

// Render to #app
document.getElementById('app').innerHTML = '<h1>' + message.get() + '</h1>';
`,
    counter: `// Counter Example
const count = signal(0);

function Counter() {
  return (
    <div>
      <h1>Count: {count.get()}</h1>
      <button onClick={() => count.set(count.get() - 1)}>-</button>
      <button onClick={() => count.set(count.get() + 1)}>+</button>
    </div>
  );
}

// Simple render
const app = document.getElementById('app');
app.innerHTML = \`
  <div style="text-align: center; padding: 20px;">
    <h1 id="count">Count: \${count.get()}</h1>
    <button id="dec">-</button>
    <button id="inc">+</button>
  </div>
\`;

count.subscribe(v => {
  document.getElementById('count').textContent = 'Count: ' + v;
});

document.getElementById('dec').onclick = () => count.set(count.get() - 1);
document.getElementById('inc').onclick = () => count.set(count.get() + 1);
`,
    todoList: `// Todo List Example
const todos = signal([
  { id: 1, text: 'Learn PhilJS', done: false },
  { id: 2, text: 'Build something', done: false },
]);
const newTodo = signal('');

function addTodo() {
  if (!newTodo.get().trim()) return;
  todos.set([
    ...todos.get(),
    { id: Date.now(), text: newTodo.get(), done: false }
  ]);
  newTodo.set('');
}

function toggleTodo(id) {
  todos.set(todos.get().map(t =>
    t.id === id ? { ...t, done: !t.done } : t
  ));
}

// Render
function render() {
  const app = document.getElementById('app');
  app.innerHTML = \`
    <div style="max-width: 400px; margin: 0 auto;">
      <h1>Todo List</h1>
      <div style="display: flex; gap: 8px; margin-bottom: 16px;">
        <input id="input" value="\${newTodo.get()}" placeholder="Add todo..." style="flex: 1; padding: 8px;">
        <button id="add">Add</button>
      </div>
      <ul style="list-style: none; padding: 0;">
        \${todos.get().map(t => \`
          <li data-id="\${t.id}" style="padding: 8px; cursor: pointer; text-decoration: \${t.done ? 'line-through' : 'none'}; opacity: \${t.done ? 0.5 : 1}">
            \${t.text}
          </li>
        \`).join('')}
      </ul>
    </div>
  \`;

  document.getElementById('input').oninput = (e) => newTodo.set(e.target.value);
  document.getElementById('add').onclick = addTodo;
  document.querySelectorAll('li').forEach(li => {
    li.onclick = () => toggleTodo(Number(li.dataset.id));
  });
}

todos.subscribe(render);
newTodo.subscribe(render);
render();
`,
    computed: `// Computed Values Example
const firstName = signal('John');
const lastName = signal('Doe');
const fullName = computed(() => firstName.get() + ' ' + lastName.get());

// Render
function render() {
  const app = document.getElementById('app');
  app.innerHTML = \`
    <div style="padding: 20px;">
      <h1>Hello, \${fullName.get()}!</h1>
      <div style="display: flex; flex-direction: column; gap: 8px; max-width: 300px;">
        <input id="first" value="\${firstName.get()}" placeholder="First name">
        <input id="last" value="\${lastName.get()}" placeholder="Last name">
      </div>
    </div>
  \`;

  document.getElementById('first').oninput = (e) => firstName.set(e.target.value);
  document.getElementById('last').oninput = (e) => lastName.set(e.target.value);
}

firstName.subscribe(render);
lastName.subscribe(render);
render();
`,
    effects: `// Effects Example
const query = signal('');
const results = signal([]);
const loading = signal(false);

// Debounced search effect
let timeout;
effect(() => {
  const q = query.get();
  clearTimeout(timeout);

  if (!q) {
    results.set([]);
    return;
  }

  loading.set(true);
  timeout = setTimeout(() => {
    // Simulate API call
    const mockResults = ['apple', 'banana', 'cherry', 'date', 'elderberry']
      .filter(f => f.includes(q.toLowerCase()));
    results.set(mockResults);
    loading.set(false);
  }, 300);
});

// Render
function render() {
  const app = document.getElementById('app');
  app.innerHTML = \`
    <div style="padding: 20px; max-width: 400px;">
      <h1>Search Fruits</h1>
      <input id="search" value="\${query.get()}" placeholder="Type to search..." style="width: 100%; padding: 8px;">
      <div style="margin-top: 16px;">
        \${loading.get() ? '<p>Loading...</p>' : results.get().length > 0
          ? '<ul>' + results.get().map(r => '<li>' + r + '</li>').join('') + '</ul>'
          : query.get() ? '<p>No results</p>' : ''
        }
      </div>
    </div>
  \`;

  document.getElementById('search').oninput = (e) => query.set(e.target.value);
}

query.subscribe(render);
results.subscribe(render);
loading.subscribe(render);
render();
`,
};
export const tutorialSteps = [
    {
        title: 'Welcome to PhilJS',
        description: 'Learn the basics of reactive programming with signals.',
        code: exampleCode.helloWorld,
    },
    {
        title: 'Counter Example',
        description: 'Build an interactive counter using signals.',
        code: exampleCode.counter,
    },
    {
        title: 'Todo List',
        description: 'Create a full todo list application.',
        code: exampleCode.todoList,
    },
    {
        title: 'Computed Values',
        description: 'Learn how to derive values from signals.',
        code: exampleCode.computed,
    },
    {
        title: 'Effects',
        description: 'React to signal changes with effects.',
        code: exampleCode.effects,
    },
];
//# sourceMappingURL=examples.js.map