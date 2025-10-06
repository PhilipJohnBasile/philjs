export function createDocContent(path: string, navigate: (path: string) => void, styles: Record<string, React.CSSProperties>) {
  const docs: Record<string, { title: string; content: JSX.Element }> = {
    // GETTING STARTED
    "/docs": {
      title: "Introduction to PhilJS",
      content: (
        <div>
          <h1>Welcome to PhilJS</h1>
          <p style={{ fontSize: "var(--text-lg)", color: "var(--color-text-secondary)", marginBottom: "var(--space-8)" }}>
            PhilJS is a revolutionary front-end framework that combines fine-grained reactivity with zero-hydration resumability and AI-powered intelligence features.
          </p>

          <h2>Why PhilJS?</h2>
          <p>Modern web frameworks face a fundamental trade-off: developer experience vs. runtime performance. PhilJS eliminates this trade-off by rethinking how frameworks should work from the ground up.</p>

          <div style={styles.featureGrid || {}}>
            <div style={styles.featureBox || {}}>
              <h3>⚡ Fine-Grained Reactivity</h3>
              <p>Updates only what changed. No virtual DOM diffing, no wasted renders.</p>
            </div>
            <div style={styles.featureBox || {}}>
              <h3>🎯 Zero-Hydration</h3>
              <p>Ship interactive apps with zero hydration cost.</p>
            </div>
            <div style={styles.featureBox || {}}>
              <h3>🧠 AI-Powered</h3>
              <p>Smart preloading, cost tracking, and usage analytics built-in.</p>
            </div>
            <div style={styles.featureBox || {}}>
              <h3>📦 12.8kb</h3>
              <p>Smaller than React, Vue, or any other major framework.</p>
            </div>
          </div>

          <h2>Quick Example</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { signal } from "philjs-core";

export function Counter() {
  const count = signal(0);

  return (
    <button onClick={() => count.set(count() + 1)}>
      Count: {count()}
    </button>
  );
}`}</code></pre>

          <h2>Next Steps</h2>
          <ul>
            <li><a href="/docs/installation" onClick={(e) => { e.preventDefault(); navigate("/docs/installation"); }}>Install PhilJS</a> and set up your first project</li>
            <li>Follow the <a href="/docs/tutorial" onClick={(e) => { e.preventDefault(); navigate("/docs/tutorial"); }}>step-by-step tutorial</a></li>
            <li>Try the <a href="/playground" onClick={(e) => { e.preventDefault(); navigate("/playground"); }}>interactive playground</a></li>
          </ul>
        </div>
      ),
    },

    "/docs/installation": {
      title: "Installation",
      content: (
        <div>
          <h1>Installation</h1>
          <p>Get started with PhilJS in less than a minute.</p>

          <h2>Create a New Project</h2>
          <p>The fastest way to start is with our CLI:</p>
          <pre style={styles.codeBlock || {}}><code>{`npm create philjs@latest my-app
cd my-app
npm install
npm run dev`}</code></pre>

          <h2>Manual Installation</h2>
          <p>Or install PhilJS packages manually:</p>
          <pre style={styles.codeBlock || {}}><code>{`npm install philjs-core philjs-router philjs-ssr`}</code></pre>

          <h2>What's Included</h2>
          <ul>
            <li><code>philjs-core</code> - Fine-grained reactivity system</li>
            <li><code>philjs-router</code> - File-based routing with smart preloading</li>
            <li><code>philjs-ssr</code> - Server-side rendering with streaming</li>
            <li><code>philjs-islands</code> - Islands architecture support</li>
            <li><code>philjs-devtools</code> - Time-travel debugging</li>
            <li><code>philjs-ai</code> - AI-powered intelligence features</li>
          </ul>

          <h2>TypeScript Support</h2>
          <p>PhilJS is written in TypeScript and has first-class support:</p>
          <pre style={styles.codeBlock || {}}><code>{`{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "philjs-core",
    "types": ["philjs-core"]
  }
}`}</code></pre>
        </div>
      ),
    },

    "/docs/quick-start": {
      title: "Quick Start",
      content: (
        <div>
          <h1>Quick Start</h1>
          <p>Build your first PhilJS app in 5 minutes.</p>

          <h2>1. Create a Component</h2>
          <pre style={styles.codeBlock || {}}><code>{`// src/Counter.tsx
import { signal } from "philjs-core";

export function Counter() {
  const count = signal(0);

  return (
    <div>
      <h1>Count: {count()}</h1>
      <button onClick={() => count.set(count() + 1)}>
        Increment
      </button>
    </div>
  );
}`}</code></pre>

          <h2>2. Render to the DOM</h2>
          <pre style={styles.codeBlock || {}}><code>{`// src/main.tsx
import { render } from "philjs-core";
import { Counter } from "./Counter";

render(<Counter />, document.getElementById("root"));`}</code></pre>

          <h2>3. Add Routing</h2>
          <pre style={styles.codeBlock || {}}><code>{`// src/App.tsx
import { route } from "philjs-router";
import { Home } from "./pages/Home";
import { About } from "./pages/About";

export const App = route({
  "/": Home,
  "/about": About
});`}</code></pre>

          <h2>4. Server-Side Rendering</h2>
          <pre style={styles.codeBlock || {}}><code>{`// server.ts
import { createServer } from "philjs-ssr";
import { App } from "./App";

createServer({
  render: () => <App />,
  port: 3000
});`}</code></pre>
        </div>
      ),
    },

    "/docs/tutorial": {
      title: "Tutorial",
      content: (
        <div>
          <h1>Build a Todo App with PhilJS</h1>
          <p>Learn PhilJS by building a complete todo application with routing, forms, and data persistence.</p>

          <h2>Step 1: Setup</h2>
          <pre style={styles.codeBlock || {}}><code>{`npm create philjs@latest todo-app
cd todo-app
npm install
npm run dev`}</code></pre>

          <h2>Step 2: Create the Todo Model</h2>
          <pre style={styles.codeBlock || {}}><code>{`// src/models/todo.ts
export interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export function createTodo(text: string): Todo {
  return {
    id: Date.now(),
    text,
    completed: false
  };
}`}</code></pre>

          <h2>Step 3: Build the Todo List</h2>
          <pre style={styles.codeBlock || {}}><code>{`// src/components/TodoList.tsx
import { signal } from "philjs-core";
import { Todo, createTodo } from "../models/todo";

export function TodoList() {
  const todos = signal<Todo[]>([]);
  const input = signal("");

  const addTodo = () => {
    if (input().trim()) {
      todos.set([...todos(), createTodo(input())]);
      input.set("");
    }
  };

  const toggleTodo = (id: number) => {
    todos.set(
      todos().map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    );
  };

  return (
    <div>
      <h1>My Todos</h1>
      <input
        value={input()}
        onInput={(e) => input.set(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && addTodo()}
      />
      <button onClick={addTodo}>Add</button>

      <ul>
        {todos().map(todo => (
          <li
            key={todo.id}
            onClick={() => toggleTodo(todo.id)}
            style={{
              textDecoration: todo.completed ? "line-through" : "none"
            }}
          >
            {todo.text}
          </li>
        ))}
      </ul>
    </div>
  );
}`}</code></pre>

          <h2>Next Steps</h2>
          <ul>
            <li>Add <a href="/docs/routing" onClick={(e) => { e.preventDefault(); navigate("/docs/routing"); }}>routing</a> for different views</li>
            <li>Implement <a href="/docs/data-layer" onClick={(e) => { e.preventDefault(); navigate("/docs/data-layer"); }}>data persistence</a></li>
            <li>Add <a href="/docs/animations" onClick={(e) => { e.preventDefault(); navigate("/docs/animations"); }}>animations</a></li>
          </ul>
        </div>
      ),
    },

    // CORE CONCEPTS
    "/docs/components": {
      title: "Components",
      content: (
        <div>
          <h1>Components</h1>
          <p>Components are the building blocks of PhilJS applications. They're just functions that return JSX.</p>

          <h2>Defining Components</h2>
          <pre style={styles.codeBlock || {}}><code>{`function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>;
}`}</code></pre>

          <h2>Props</h2>
          <p>Components accept props as their first argument:</p>
          <pre style={styles.codeBlock || {}}><code>{`interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

function Button({ label, onClick, variant = "primary" }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      class={\`button button-\${variant}\`}
    >
      {label}
    </button>
  );
}`}</code></pre>

          <h2>Children</h2>
          <pre style={styles.codeBlock || {}}><code>{`function Card({ children }: { children: JSX.Element }) {
  return (
    <div class="card">
      {children}
    </div>
  );
}

// Usage
<Card>
  <h2>Title</h2>
  <p>Content here</p>
</Card>`}</code></pre>

          <h2>Composition</h2>
          <p>Build complex UIs by composing small, reusable components:</p>
          <pre style={styles.codeBlock || {}}><code>{`function UserCard({ user }: { user: User }) {
  return (
    <Card>
      <Avatar src={user.avatar} />
      <UserInfo name={user.name} email={user.email} />
      <Button label="Follow" onClick={() => follow(user.id)} />
    </Card>
  );
}`}</code></pre>
        </div>
      ),
    },

    "/docs/signals": {
      title: "Signals",
      content: (
        <div>
          <h1>Signals</h1>
          <p>Signals are the foundation of PhilJS's fine-grained reactivity system.</p>

          <h2>Creating Signals</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { signal } from "philjs-core";

const count = signal(0);
const name = signal("Alice");
const user = signal({ id: 1, name: "Bob" });`}</code></pre>

          <h2>Reading Signals</h2>
          <pre style={styles.codeBlock || {}}><code>{`// Call the signal to read its value
console.log(count()); // 0
console.log(name()); // "Alice"`}</code></pre>

          <h2>Updating Signals</h2>
          <pre style={styles.codeBlock || {}}><code>{`// Use .set() to update
count.set(1);
name.set("Charlie");

// Update based on previous value
count.set(count() + 1);`}</code></pre>

          <h2>Computed Signals</h2>
          <pre style={styles.codeBlock || {}}><code>{`const count = signal(5);
const doubled = () => count() * 2;

console.log(doubled()); // 10
count.set(10);
console.log(doubled()); // 20`}</code></pre>

          <h2>Fine-Grained Updates</h2>
          <p>PhilJS only updates the DOM elements that depend on changed signals:</p>
          <pre style={styles.codeBlock || {}}><code>{`const firstName = signal("Alice");
const lastName = signal("Smith");

// Only updates the first name element
<div>
  <span>{firstName()}</span> {/* ← Updates */}
  <span>{lastName()}</span>  {/* ← Doesn't update */}
</div>`}</code></pre>
        </div>
      ),
    },

    "/docs/effects": {
      title: "Effects",
      content: (
        <div>
          <h1>Effects</h1>
          <p>Effects run side effects when signals change. Perfect for logging, API calls, and subscriptions.</p>

          <h2>Basic Effects</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { signal, effect } from "philjs-core";

const count = signal(0);

effect(() => {
  console.log("Count changed:", count());
});

count.set(1); // Logs: "Count changed: 1"`}</code></pre>

          <h2>Cleanup</h2>
          <p>Effects can return a cleanup function:</p>
          <pre style={styles.codeBlock || {}}><code>{`effect(() => {
  const interval = setInterval(() => {
    console.log("Tick");
  }, 1000);

  // Cleanup when effect re-runs or component unmounts
  return () => clearInterval(interval);
});`}</code></pre>

          <h2>Async Effects</h2>
          <pre style={styles.codeBlock || {}}><code>{`const userId = signal(1);
const user = signal(null);

effect(async () => {
  const response = await fetch(\`/api/users/\${userId()}\`);
  const data = await response.json();
  user.set(data);
});`}</code></pre>

          <h2>Multiple Dependencies</h2>
          <pre style={styles.codeBlock || {}}><code>{`const firstName = signal("Alice");
const lastName = signal("Smith");

effect(() => {
  // Runs when either firstName or lastName changes
  console.log(\`Full name: \${firstName()} \${lastName()}\`);
});`}</code></pre>
        </div>
      ),
    },

    "/docs/context": {
      title: "Context",
      content: (
        <div>
          <h1>Context</h1>
          <p>Context provides a way to pass data through the component tree without having to pass props manually at every level.</p>

          <h2>Creating Context</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { createContext } from "philjs-core";

const ThemeContext = createContext("light");`}</code></pre>

          <h2>Providing Context</h2>
          <pre style={styles.codeBlock || {}}><code>{`function App() {
  const theme = signal("dark");

  return (
    <ThemeContext.Provider value={theme()}>
      <Header />
      <Main />
      <Footer />
    </ThemeContext.Provider>
  );
}`}</code></pre>

          <h2>Consuming Context</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { useContext } from "philjs-core";

function ThemedButton() {
  const theme = useContext(ThemeContext);

  return (
    <button class={\`button button-\${theme}\`}>
      Click me
    </button>
  );
}`}</code></pre>

          <h2>Signal Context</h2>
          <p>Create reactive context with signals:</p>
          <pre style={styles.codeBlock || {}}><code>{`import { createSignalContext } from "philjs-core";

const [ThemeProvider, useTheme] = createSignalContext("light");

function App() {
  return (
    <ThemeProvider>
      <ThemedButton />
    </ThemeProvider>
  );
}

function ThemedButton() {
  const [theme, setTheme] = useTheme();

  return (
    <button onClick={() => setTheme(theme() === "light" ? "dark" : "light")}>
      Current: {theme()}
    </button>
  );
}`}</code></pre>
        </div>
      ),
    },

    "/docs/jsx": {
      title: "JSX & Templates",
      content: (
        <div>
          <h1>JSX & Templates</h1>
          <p>PhilJS uses JSX for templating. JSX is a syntax extension that lets you write HTML-like code in JavaScript.</p>

          <h2>Basic JSX</h2>
          <pre style={styles.codeBlock || {}}><code>{`function Welcome() {
  return <h1>Hello, PhilJS!</h1>;
}`}</code></pre>

          <h2>Expressions in JSX</h2>
          <pre style={styles.codeBlock || {}}><code>{`function Greeting({ name }: { name: string }) {
  const message = \`Hello, \${name}!\`;

  return (
    <div>
      <h1>{message}</h1>
      <p>2 + 2 = {2 + 2}</p>
    </div>
  );
}`}</code></pre>

          <h2>Attributes</h2>
          <pre style={styles.codeBlock || {}}><code>{`<input
  type="text"
  value={inputValue()}
  placeholder="Enter text..."
  disabled={isDisabled()}
/>`}</code></pre>

          <h2>Event Handlers</h2>
          <pre style={styles.codeBlock || {}}><code>{`<button onClick={() => handleClick()}>
  Click me
</button>

<input onInput={(e) => setValue(e.target.value)} />`}</code></pre>

          <h2>Conditional Rendering</h2>
          <pre style={styles.codeBlock || {}}><code>{`function Status({ isOnline }: { isOnline: boolean }) {
  return (
    <div>
      {isOnline ? (
        <span class="online">Online</span>
      ) : (
        <span class="offline">Offline</span>
      )}
    </div>
  );
}`}</code></pre>

          <h2>Lists</h2>
          <pre style={styles.codeBlock || {}}><code>{`function UserList({ users }: { users: User[] }) {
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          {user.name}
        </li>
      ))}
    </ul>
  );
}`}</code></pre>
        </div>
      ),
    },

    // ROUTING
    "/docs/routing": {
      title: "File-based Routing",
      content: (
        <div>
          <h1>File-based Routing</h1>
          <p>PhilJS uses file-based routing inspired by Next.js and SvelteKit. Pages are automatically routed based on their file structure.</p>

          <h2>Basic Routing</h2>
          <pre style={styles.codeBlock || {}}><code>{`// File: src/pages/index.tsx
export default function Home() {
  return <h1>Home Page</h1>;
}

// File: src/pages/about.tsx
export default function About() {
  return <h1>About Page</h1>;
}

// Routes created automatically:
// / → Home
// /about → About`}</code></pre>

          <h2>Dynamic Routes</h2>
          <pre style={styles.codeBlock || {}}><code>{`// File: src/pages/blog/[slug].tsx
export default function BlogPost({ params }: { params: { slug: string } }) {
  return <h1>Post: {params.slug}</h1>;
}

// Matches:
// /blog/hello-world → params.slug = "hello-world"
// /blog/my-post → params.slug = "my-post"`}</code></pre>

          <h2>Catch-all Routes</h2>
          <pre style={styles.codeBlock || {}}><code>{`// File: src/pages/docs/[...slug].tsx
export default function Docs({ params }: { params: { slug: string[] } }) {
  return <h1>Docs: {params.slug.join('/')}</h1>;
}

// Matches:
// /docs/getting-started → ["getting-started"]
// /docs/api/core → ["api", "core"]`}</code></pre>

          <h2>Route Groups</h2>
          <pre style={styles.codeBlock || {}}><code>{`// Use (group) folders to organize without affecting URL
src/pages/
  (marketing)/
    about.tsx    → /about
    contact.tsx  → /contact
  (app)/
    dashboard.tsx → /dashboard
    settings.tsx  → /settings`}</code></pre>
        </div>
      ),
    },

    "/docs/navigation": {
      title: "Navigation",
      content: (
        <div>
          <h1>Navigation</h1>
          <p>PhilJS provides multiple ways to navigate between pages in your application.</p>

          <h2>Link Component</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { Link } from "philjs-router";

export function Nav() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href="/blog">Blog</Link>
    </nav>
  );
}`}</code></pre>

          <h2>Programmatic Navigation</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { useRouter } from "philjs-router";

export function LoginButton() {
  const router = useRouter();

  const handleLogin = async () => {
    await login();
    router.push('/dashboard');
  };

  return <button onClick={handleLogin}>Login</button>;
}`}</code></pre>

          <h2>Navigation Methods</h2>
          <pre style={styles.codeBlock || {}}><code>{`const router = useRouter();

// Push a new route
router.push('/about');

// Replace current route
router.replace('/login');

// Go back
router.back();

// Go forward
router.forward();

// Navigate with query params
router.push('/search?q=philjs');`}</code></pre>

          <h2>Active Links</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { Link, useRoute } from "philjs-router";

export function NavLink({ href, children }: { href: string; children: any }) {
  const route = useRoute();
  const isActive = route.path === href;

  return (
    <Link
      href={href}
      class={isActive ? "active" : ""}
    >
      {children}
    </Link>
  );
}`}</code></pre>
        </div>
      ),
    },

    "/docs/layouts": {
      title: "Layouts",
      content: (
        <div>
          <h1>Layouts</h1>
          <p>Layouts let you share UI between multiple pages while preserving state and avoiding re-renders.</p>

          <h2>Root Layout</h2>
          <pre style={styles.codeBlock || {}}><code>{`// File: src/layouts/RootLayout.tsx
export default function RootLayout({ children }: { children: JSX.Element }) {
  return (
    <html>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}`}</code></pre>

          <h2>Nested Layouts</h2>
          <pre style={styles.codeBlock || {}}><code>{`// File: src/layouts/DashboardLayout.tsx
export default function DashboardLayout({ children }: { children: JSX.Element }) {
  return (
    <div class="dashboard">
      <Sidebar />
      <div class="content">
        {children}
      </div>
    </div>
  );
}

// File: src/pages/dashboard/layout.tsx
import DashboardLayout from "@/layouts/DashboardLayout";
export default DashboardLayout;`}</code></pre>

          <h2>Layout Groups</h2>
          <pre style={styles.codeBlock || {}}><code>{`// Different layouts for different sections
src/
  (marketing)/
    layout.tsx  // Marketing layout
    page.tsx
  (app)/
    layout.tsx  // App layout
    dashboard/
      page.tsx`}</code></pre>

          <h2>Template vs Layout</h2>
          <pre style={styles.codeBlock || {}}><code>{`// Layout: Persists and doesn't re-render
export default function Layout({ children }) {
  const [state] = useState(0); // Preserved
  return <div>{children}</div>;
}

// Template: Re-renders on navigation
export default function Template({ children }) {
  const [state] = useState(0); // Reset each time
  return <div>{children}</div>;
}`}</code></pre>
        </div>
      ),
    },

    "/docs/smart-preloading": {
      title: "Smart Preloading",
      content: (
        <div>
          <h1>Smart Preloading</h1>
          <p>PhilJS uses ML-powered predictions to preload pages users are likely to visit next, making navigation feel instant.</p>

          <h2>How It Works</h2>
          <p>The router tracks user behavior and predicts which links they'll click:</p>
          <ul>
            <li>Analyzes hover time, cursor movement, and scroll position</li>
            <li>Uses machine learning to predict click probability</li>
            <li>Preloads routes with high probability</li>
            <li>Adapts to user patterns over time</li>
          </ul>

          <h2>Automatic Preloading</h2>
          <pre style={styles.codeBlock || {}}><code>{`// PhilJS automatically preloads on:
// - Link hover (>100ms)
// - Viewport intersection
// - Idle time

<Link href="/blog">Blog</Link>
// Preloads when user hovers`}</code></pre>

          <h2>Manual Preloading</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { preload } from "philjs-router";

// Preload programmatically
preload('/dashboard');

// Preload multiple routes
preload(['/profile', '/settings', '/notifications']);

// Preload with priority
preload('/critical-page', { priority: 'high' });`}</code></pre>

          <h2>Configuration</h2>
          <pre style={styles.codeBlock || {}}><code>{`// philjs.config.ts
export default {
  router: {
    preload: {
      enabled: true,
      strategy: 'smart', // 'smart' | 'hover' | 'visible' | 'none'
      threshold: 0.7, // Prediction confidence threshold
      maxConcurrent: 3, // Max parallel preloads
      timeout: 5000, // Preload timeout
    }
  }
}`}</code></pre>

          <h2>Preload Analytics</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { getPreloadStats } from "philjs-router";

const stats = getPreloadStats();
console.log({
  accuracy: stats.accuracy, // Prediction accuracy
  hits: stats.cacheHits, // Successful preloads used
  misses: stats.cacheMisses, // Unused preloads
  savings: stats.timeSaved // Total time saved (ms)
});`}</code></pre>
        </div>
      ),
    },

    // DATA FETCHING
    "/docs/server-functions": {
      title: "Server Functions",
      content: (
        <div>
          <h1>Server Functions</h1>
          <p>Server functions let you call server-side code from client components with full type safety.</p>

          <h2>Creating Server Functions</h2>
          <pre style={styles.codeBlock || {}}><code>{`// File: src/server/users.ts
import { serverFunction } from "philjs-ssr";

export const getUser = serverFunction(async (id: number) => {
  const user = await db.users.findById(id);
  return user;
});

export const createUser = serverFunction(async (data: UserInput) => {
  const user = await db.users.create(data);
  return user;
});`}</code></pre>

          <h2>Using in Components</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { getUser } from "@/server/users";

export function UserProfile({ userId }: { userId: number }) {
  const [user, setUser] = useState(null);

  useEffect(async () => {
    const data = await getUser(userId); // Type-safe!
    setUser(data);
  });

  return <div>{user?.name}</div>;
}`}</code></pre>

          <h2>With Data Layer</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { createQuery } from "philjs-core";
import { getUser } from "@/server/users";

export function UserProfile({ userId }: { userId: number }) {
  const user = createQuery(() => getUser(userId));

  return (
    <div>
      {user.loading && <div>Loading...</div>}
      {user.error && <div>Error: {user.error.message}</div>}
      {user.data && <div>{user.data.name}</div>}
    </div>
  );
}`}</code></pre>

          <h2>Security</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { serverFunction, requireAuth } from "philjs-ssr";

// Protected server function
export const deleteUser = serverFunction(
  requireAuth(async (id: number, ctx) => {
    // ctx.user available from auth
    if (ctx.user.role !== 'admin') {
      throw new Error('Unauthorized');
    }
    await db.users.delete(id);
  })
);`}</code></pre>
        </div>
      ),
    },

    "/docs/data-layer": {
      title: "Data Layer",
      content: (
        <div>
          <h1>Data Layer</h1>
          <p>PhilJS provides a powerful data layer for fetching, caching, and synchronizing server state.</p>

          <h2>Queries</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { createQuery } from "philjs-core";

export function Posts() {
  const posts = createQuery(async () => {
    const res = await fetch('/api/posts');
    return res.json();
  });

  if (posts.loading) return <div>Loading...</div>;
  if (posts.error) return <div>Error!</div>;

  return (
    <ul>
      {posts.data.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}`}</code></pre>

          <h2>Query Options</h2>
          <pre style={styles.codeBlock || {}}><code>{`const posts = createQuery(
  async () => fetch('/api/posts').then(r => r.json()),
  {
    staleTime: 30000, // Fresh for 30s
    cacheTime: 300000, // Keep in cache for 5min
    retry: 3, // Retry failed requests 3x
    refetchOnFocus: true, // Refetch when window focused
    refetchInterval: 60000, // Poll every minute
  }
);`}</code></pre>

          <h2>Dependent Queries</h2>
          <pre style={styles.codeBlock || {}}><code>{`export function UserPosts({ userId }: { userId: number }) {
  const user = createQuery(() => fetchUser(userId));

  const posts = createQuery(
    () => fetchUserPosts(user.data.id),
    { enabled: !!user.data } // Only run when user loaded
  );

  return <div>...</div>;
}`}</code></pre>

          <h2>Pagination</h2>
          <pre style={styles.codeBlock || {}}><code>{`export function PaginatedPosts() {
  const [page, setPage] = useState(1);

  const posts = createQuery(
    () => fetchPosts({ page, limit: 10 }),
    {
      keepPreviousData: true, // Show old data while loading new
    }
  );

  return (
    <div>
      {posts.data?.map(post => <div key={post.id}>{post.title}</div>)}
      <button onClick={() => setPage(p => p - 1)}>Previous</button>
      <button onClick={() => setPage(p => p + 1)}>Next</button>
    </div>
  );
}`}</code></pre>
        </div>
      ),
    },

    "/docs/caching": {
      title: "Caching",
      content: (
        <div>
          <h1>Caching</h1>
          <p>PhilJS provides intelligent caching to minimize network requests and improve performance.</p>

          <h2>Query Cache</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { queryCache } from "philjs-core";

// Get cached data
const data = queryCache.get(['posts']);

// Set cache manually
queryCache.set(['posts'], data);

// Invalidate cache
queryCache.invalidate(['posts']);

// Clear all cache
queryCache.clear();`}</code></pre>

          <h2>Cache Keys</h2>
          <pre style={styles.codeBlock || {}}><code>{`// Simple key
createQuery(['posts'], () => fetchPosts());

// With variables
createQuery(['post', id], () => fetchPost(id));

// Multiple params
createQuery(['posts', { page, limit }], () =>
  fetchPosts({ page, limit })
);`}</code></pre>

          <h2>Cache Time & Stale Time</h2>
          <pre style={styles.codeBlock || {}}><code>{`createQuery(
  ['posts'],
  () => fetchPosts(),
  {
    // Fresh for 5 minutes
    staleTime: 5 * 60 * 1000,

    // Keep in cache for 30 minutes after last use
    cacheTime: 30 * 60 * 1000,
  }
);

// staleTime: How long data is considered fresh
// cacheTime: How long unused data stays in cache`}</code></pre>

          <h2>Prefetching</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { prefetchQuery } from "philjs-core";

// Prefetch on hover
<Link
  href="/post/123"
  onMouseEnter={() => prefetchQuery(['post', 123], () => fetchPost(123))}
>
  Read More
</Link>

// Prefetch on mount
useEffect(() => {
  prefetchQuery(['next-page'], () => fetchNextPage());
}, []);`}</code></pre>

          <h2>Optimistic Updates</h2>
          <pre style={styles.codeBlock || {}}><code>{`const mutation = createMutation(
  (newPost) => createPost(newPost),
  {
    onMutate: async (newPost) => {
      // Cancel outgoing refetches
      await queryCache.cancelQueries(['posts']);

      // Snapshot previous value
      const previous = queryCache.get(['posts']);

      // Optimistically update
      queryCache.set(['posts'], old => [...old, newPost]);

      return { previous };
    },
    onError: (err, newPost, context) => {
      // Rollback on error
      queryCache.set(['posts'], context.previous);
    },
  }
);`}</code></pre>
        </div>
      ),
    },

    "/docs/mutations": {
      title: "Mutations",
      content: (
        <div>
          <h1>Mutations</h1>
          <p>Mutations handle data updates, sending changes to the server and updating local cache.</p>

          <h2>Basic Mutation</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { createMutation } from "philjs-core";

export function CreatePost() {
  const mutation = createMutation(async (newPost) => {
    const res = await fetch('/api/posts', {
      method: 'POST',
      body: JSON.stringify(newPost)
    });
    return res.json();
  });

  const handleSubmit = () => {
    mutation.mutate({ title: 'New Post', body: 'Content' });
  };

  return (
    <div>
      <button onClick={handleSubmit} disabled={mutation.loading}>
        {mutation.loading ? 'Creating...' : 'Create Post'}
      </button>
      {mutation.error && <div>Error: {mutation.error.message}</div>}
    </div>
  );
}`}</code></pre>

          <h2>Invalidating Queries</h2>
          <pre style={styles.codeBlock || {}}><code>{`const mutation = createMutation(
  (newPost) => createPost(newPost),
  {
    onSuccess: () => {
      // Invalidate and refetch
      queryCache.invalidateQueries(['posts']);
    }
  }
);`}</code></pre>

          <h2>Optimistic Updates</h2>
          <pre style={styles.codeBlock || {}}><code>{`const updatePost = createMutation(
  (updates) => fetch(\`/api/posts/\${updates.id}\`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  }),
  {
    onMutate: async (updates) => {
      await queryCache.cancelQueries(['post', updates.id]);

      const previous = queryCache.get(['post', updates.id]);

      queryCache.set(['post', updates.id], old => ({
        ...old,
        ...updates
      }));

      return { previous, id: updates.id };
    },
    onError: (err, variables, context) => {
      queryCache.set(
        ['post', context.id],
        context.previous
      );
    },
    onSettled: (data, error, variables) => {
      queryCache.invalidateQueries(['post', variables.id]);
    }
  }
);`}</code></pre>

          <h2>Sequential Mutations</h2>
          <pre style={styles.codeBlock || {}}><code>{`const createPost = createMutation((post) => api.createPost(post));
const publishPost = createMutation((id) => api.publishPost(id));

const handlePublish = async () => {
  const newPost = await createPost.mutateAsync({ title: 'Draft' });
  await publishPost.mutateAsync(newPost.id);
};`}</code></pre>
        </div>
      ),
    },

    // RENDERING
    "/docs/ssr": {
      title: "Server-Side Rendering",
      content: (
        <div>
          <h1>Server-Side Rendering (SSR)</h1>
          <p>PhilJS provides powerful SSR capabilities for SEO, performance, and user experience.</p>

          <h2>Basic SSR</h2>
          <pre style={styles.codeBlock || {}}><code>{`// server.ts
import { createServer } from "philjs-ssr";
import { App } from "./App";

createServer({
  render: () => <App />,
  port: 3000
});`}</code></pre>

          <h2>Data Fetching</h2>
          <pre style={styles.codeBlock || {}}><code>{`// Page with server data
export async function getServerData() {
  const posts = await db.posts.findAll();
  return { posts };
}

export default function Posts({ posts }: { posts: Post[] }) {
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}`}</code></pre>

          <h2>Request Context</h2>
          <pre style={styles.codeBlock || {}}><code>{`export async function getServerData({ req, res }: ServerContext) {
  // Access request
  const userId = req.headers.get('x-user-id');
  const cookies = req.cookies;

  // Set response headers
  res.headers.set('Cache-Control', 'public, max-age=3600');

  return { userId };
}`}</code></pre>

          <h2>Error Handling</h2>
          <pre style={styles.codeBlock || {}}><code>{`export async function getServerData() {
  try {
    const data = await fetchData();
    return { data };
  } catch (error) {
    return {
      error: error.message,
      status: 500
    };
  }
}

export default function Page({ data, error }: { data?: any; error?: string }) {
  if (error) return <ErrorPage message={error} />;
  return <div>{data}</div>;
}`}</code></pre>

          <h2>Redirects</h2>
          <pre style={styles.codeBlock || {}}><code>{`export async function getServerData({ req }: ServerContext) {
  const user = await getUser(req);

  if (!user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false
      }
    };
  }

  return { user };
}`}</code></pre>
        </div>
      ),
    },

    "/docs/streaming": {
      title: "Streaming SSR",
      content: (
        <div>
          <h1>Streaming SSR</h1>
          <p>Stream HTML to the browser as it's generated for faster Time to First Byte (TTFB).</p>

          <h2>Enable Streaming</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { renderToStream } from "philjs-core";

const stream = renderToStream(<App />);

// Send to client
response.setHeader('Content-Type', 'text/html');
stream.pipe(response);`}</code></pre>

          <h2>Suspense Boundaries</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { Suspense } from "philjs-core";

export function Page() {
  return (
    <div>
      <h1>My Page</h1>

      <Suspense fallback={<div>Loading...</div>}>
        <SlowComponent />
      </Suspense>

      <Footer />
    </div>
  );
}

// HTML streams:
// 1. <div><h1>My Page</h1><div>Loading...</div></div>
// 2. Script to replace loading with <SlowComponent />
// 3. <Footer />`}</code></pre>

          <h2>Async Components</h2>
          <pre style={styles.codeBlock || {}}><code>{`export async function UserPosts({ userId }: { userId: number }) {
  const posts = await fetchPosts(userId);

  return (
    <ul>
      {posts.map(post => <li key={post.id}>{post.title}</li>)}
    </ul>
  );
}

// Wrap in Suspense
<Suspense fallback={<PostsSkeleton />}>
  <UserPosts userId={123} />
</Suspense>`}</code></pre>

          <h2>Priority Streaming</h2>
          <pre style={styles.codeBlock || {}}><code>{`// High priority - stream first
<Suspense fallback={<div>Loading...</div>} priority="high">
  <CriticalContent />
</Suspense>

// Low priority - stream last
<Suspense fallback={<div>Loading...</div>} priority="low">
  <AdditionalContent />
</Suspense>`}</code></pre>

          <h2>Nested Suspense</h2>
          <pre style={styles.codeBlock || {}}><code>{`<Suspense fallback={<PageLoader />}>
  <Header />

  <Suspense fallback={<PostsLoader />}>
    <Posts />
  </Suspense>

  <Suspense fallback={<CommentsLoader />}>
    <Comments />
  </Suspense>
</Suspense>`}</code></pre>
        </div>
      ),
    },

    "/docs/resumability": {
      title: "Resumability",
      content: (
        <div>
          <h1>Resumability</h1>
          <p>Zero-hydration resumability means interactive apps with no hydration cost. PhilJS resumes exactly where the server left off.</p>

          <h2>How It Works</h2>
          <p>Traditional frameworks:</p>
          <ul>
            <li>Server renders HTML</li>
            <li>Client downloads and executes all JavaScript</li>
            <li>Re-renders entire app to attach event handlers (hydration)</li>
          </ul>

          <p>PhilJS resumability:</p>
          <ul>
            <li>Server renders HTML with serialized state</li>
            <li>Client only loads code for interactive elements</li>
            <li>Resumes from serialized state - no re-execution needed!</li>
          </ul>

          <h2>Resumable Components</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { resumable } from "philjs-core";

export const Counter = resumable(() => {
  const count = signal(0);

  return (
    <button onClick={() => count.set(count() + 1)}>
      Count: {count()}
    </button>
  );
});

// Server renders:
// <button data-phil-id="1" data-phil-state="0">Count: 0</button>

// Client resumes from serialized state - no re-render!`}</code></pre>

          <h2>Serialization</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { getResumableState, serializeResumableState } from "philjs-core";

// Get current state
const state = getResumableState();

// Serialize for transfer
const serialized = serializeResumableState(state);

// Inject into HTML
const html = \`
  <div id="app">\${appHtml}</div>
  <script>
    window.__PHIL_STATE__ = \${JSON.stringify(serialized)};
  </script>
\`;`}</code></pre>

          <h2>Selective Hydration</h2>
          <pre style={styles.codeBlock || {}}><code>{`// Static component - never loads JS
export function StaticHeader() {
  return <header>Welcome</header>;
}

// Interactive component - loads on demand
export const InteractiveButton = resumable(() => {
  return <button onClick={() => alert('Hi')}>Click</button>;
});

// Only InteractiveButton JS is loaded when user interacts!`}</code></pre>

          <h2>State Snapshots</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { createSnapshot, restoreSnapshot } from "philjs-core";

// Take snapshot
const snapshot = createSnapshot();

// Save to server/localStorage
localStorage.setItem('state', JSON.stringify(snapshot));

// Restore later
const saved = JSON.parse(localStorage.getItem('state'));
restoreSnapshot(saved);

// App resumes exactly where it was!`}</code></pre>
        </div>
      ),
    },

    "/docs/islands": {
      title: "Islands Architecture",
      content: (
        <div>
          <h1>Islands Architecture</h1>
          <p>Islands architecture hydrates only the interactive parts of your page, keeping the rest static and fast.</p>

          <h2>What Are Islands?</h2>
          <p>Think of your page as an ocean of static HTML with islands of interactivity. Only the islands need JavaScript!</p>

          <h2>Creating Islands</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { island } from "philjs-islands";

// Interactive island
export const SearchBox = island(() => {
  const query = signal("");

  return (
    <input
      type="text"
      value={query()}
      onInput={(e) => query.set(e.target.value)}
    />
  );
});

// Static content (no JS)
export function Article() {
  return (
    <article>
      <h1>My Article</h1>
      <p>Static content here...</p>

      {/* Only this loads JS */}
      <SearchBox />

      <p>More static content...</p>
    </article>
  );
}`}</code></pre>

          <h2>Island Loading Strategies</h2>
          <pre style={styles.codeBlock || {}}><code>{`// Load on page load
export const EagerIsland = island(() => <div>...</div>, {
  load: 'eager'
});

// Load when visible
export const LazyIsland = island(() => <div>...</div>, {
  load: 'visible'
});

// Load on interaction
export const InteractiveIsland = island(() => <div>...</div>, {
  load: 'interaction'
});

// Load when idle
export const IdleIsland = island(() => <div>...</div>, {
  load: 'idle'
});`}</code></pre>

          <h2>Island Communication</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { createIslandBridge } from "philjs-islands";

// Shared state between islands
const bridge = createIslandBridge({
  cart: signal([])
});

// Island 1: Add to cart
export const ProductCard = island(() => {
  const { cart } = bridge.use();

  const addToCart = (item) => {
    cart.set([...cart(), item]);
  };

  return <button onClick={() => addToCart(product)}>Add</button>;
});

// Island 2: Show cart
export const CartIcon = island(() => {
  const { cart } = bridge.use();

  return <div>Cart ({cart().length})</div>;
});`}</code></pre>

          <h2>Partial Hydration</h2>
          <pre style={styles.codeBlock || {}}><code>{`export function Page() {
  return (
    <div>
      {/* Static - no JS */}
      <Header title="Welcome" />

      {/* Island 1 */}
      <SearchIsland />

      {/* Static - no JS */}
      <ArticleContent />

      {/* Island 2 */}
      <CommentsIsland />

      {/* Static - no JS */}
      <Footer />
    </div>
  );
}

// Total JS: Only SearchIsland + CommentsIsland
// Everything else: Pure HTML/CSS`}</code></pre>
        </div>
      ),
    },

    "/docs/ssg": {
      title: "Static Site Generation",
      content: (
        <div>
          <h1>Static Site Generation (SSG)</h1>
          <p>Generate static HTML at build time for maximum performance and SEO.</p>

          <h2>Basic SSG</h2>
          <pre style={styles.codeBlock || {}}><code>{`// Page component
export default function BlogPost({ post }: { post: Post }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}

// Generate at build time
export async function getStaticProps() {
  const post = await fetchPost();
  return { props: { post } };
}`}</code></pre>

          <h2>Dynamic Paths</h2>
          <pre style={styles.codeBlock || {}}><code>{`// pages/blog/[slug].tsx
export async function getStaticPaths() {
  const posts = await fetchAllPosts();

  return {
    paths: posts.map(post => ({
      params: { slug: post.slug }
    })),
    fallback: false // 404 for unknown paths
  };
}

export async function getStaticProps({ params }) {
  const post = await fetchPost(params.slug);
  return { props: { post } };
}`}</code></pre>

          <h2>Incremental Static Regeneration (ISR)</h2>
          <pre style={styles.codeBlock || {}}><code>{`export async function getStaticProps() {
  const posts = await fetchPosts();

  return {
    props: { posts },
    revalidate: 60 // Regenerate every 60 seconds
  };
}

// How it works:
// 1. Initial request: Serve static page
// 2. After 60s: Next request triggers background regeneration
// 3. Regeneration completes: New static page served to future requests`}</code></pre>

          <h2>On-Demand Revalidation</h2>
          <pre style={styles.codeBlock || {}}><code>{`// API route: pages/api/revalidate.ts
export async function POST(req) {
  const { path } = await req.json();

  // Trigger revalidation
  await res.revalidate(path);

  return { revalidated: true };
}

// Webhook handler
export async function onPostPublish(post) {
  await fetch('/api/revalidate', {
    method: 'POST',
    body: JSON.stringify({
      path: \`/blog/\${post.slug}\`
    })
  });
}`}</code></pre>

          <h2>Fallback Pages</h2>
          <pre style={styles.codeBlock || {}}><code>{`export async function getStaticPaths() {
  // Only pre-render popular posts
  const popularPosts = await fetchPopularPosts(10);

  return {
    paths: popularPosts.map(post => ({
      params: { slug: post.slug }
    })),
    fallback: 'blocking' // SSR on-demand for other posts
  };
}

// fallback options:
// - false: 404 for unknown paths
// - true: Show fallback UI, fetch data client-side
// - 'blocking': SSR on first request, then cache`}</code></pre>
        </div>
      ),
    },

    // INTELLIGENCE
    "/docs/cost-tracking": {
      title: "Cost Tracking",
      content: (
        <div>
          <h1>Cost Tracking</h1>
          <p>PhilJS includes built-in cost tracking for cloud services, allowing you to monitor and optimize infrastructure costs at the component level.</p>

          <h2>Basic Setup</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { trackCosts, getCostReport } from "philjs-core";

// Enable cost tracking
trackCosts({
  enabled: true,
  providers: ["aws", "vercel", "cloudflare"],
  interval: 60000, // Update every minute
});`}</code></pre>

          <h2>Component-Level Tracking</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { useCosts } from "philjs-core";

export function Dashboard() {
  const costs = useCosts({
    component: "Dashboard",
    trackRenders: true,
    trackData: true,
  });

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Total cost: {costs.total}</p>
      <p>Renders: {costs.renders} @ {costs.renderCost}</p>
      <p>Data: {costs.dataTransfer} @ {costs.dataCost}</p>
    </div>
  );
}`}</code></pre>

          <h2>Server Function Costs</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { serverFn } from "philjs-core";

const fetchProducts = serverFn(async () => {
  // Automatically tracks:
  // - Lambda/Function execution time
  // - Database queries
  // - API calls
  // - Data transfer

  const products = await db.products.findMany();
  return products;
}, {
  costs: {
    track: true,
    budget: 0.05, // Alert if > $0.05 per call
  }
});`}</code></pre>

          <h2>Cost Budgets</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { setCostBudget } from "philjs-core";

// Set daily budget
setCostBudget({
  daily: 50.00,
  weekly: 300.00,
  monthly: 1000.00,

  alerts: {
    threshold: 0.8, // Alert at 80%
    email: "team@example.com",
    webhook: "https://api.example.com/alerts",
  },

  actions: {
    onExceeded: "throttle", // or "block", "log"
    throttleRate: 0.5, // Reduce to 50% capacity
  },
});`}</code></pre>

          <h2>Cost Reports</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { getCostReport } from "philjs-core";

const report = await getCostReport({
  period: "last-7-days",
  groupBy: "component",
  breakdown: true,
});

console.log(report);
// {
//   total: 42.35,
//   components: {
//     Dashboard: 12.40,
//     ProductList: 8.20,
//     UserProfile: 6.15,
//   },
//   providers: {
//     aws: 30.20,
//     vercel: 8.15,
//     cloudflare: 4.00,
//   },
// }`}</code></pre>

          <h2>Optimization Suggestions</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { getCostOptimizations } from "philjs-core";

const suggestions = await getCostOptimizations();

suggestions.forEach(opt => {
  console.log(\`\${opt.component}: \${opt.suggestion}\`);
  console.log(\`  Potential savings: $\${opt.savings}/month\`);
});

// Output:
// Dashboard: Cache API response for 5 minutes
//   Potential savings: $12.40/month
// ProductList: Use ISR instead of SSR
//   Potential savings: $8.20/month`}</code></pre>

          <h2>Real-time Monitoring</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { onCostUpdate } from "philjs-core";

onCostUpdate((update) => {
  console.log("Current spend:", update.current);
  console.log("Projected monthly:", update.projected);

  if (update.projected > budget.monthly) {
    alert("Warning: Projected to exceed monthly budget!");
  }
});`}</code></pre>
        </div>
      ),
    },

    "/docs/usage-analytics": {
      title: "Usage Analytics",
      content: (
        <div>
          <h1>Usage Analytics</h1>
          <p>Built-in privacy-focused analytics to understand how users interact with your application.</p>

          <h2>Enable Analytics</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { enableAnalytics } from "philjs-core";

enableAnalytics({
  enabled: true,

  // Privacy-first: No PII collected
  privacy: {
    anonymize: true,
    respectDNT: true,
    cookieless: true,
  },

  // Track performance metrics
  performance: true,

  // Track feature usage
  features: true,
});`}</code></pre>

          <h2>Track Custom Events</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { track } from "philjs-core";

export function ProductPage({ id }) {
  const buyProduct = () => {
    // Track user action
    track("product_purchased", {
      productId: id,
      price: product.price,
      category: product.category,
    });
  };

  return (
    <button onClick={buyProduct}>
      Buy Now
    </button>
  );
}`}</code></pre>

          <h2>Page Views</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { trackPageView } from "philjs-core";

// Automatically tracked with router
// Manual tracking:
trackPageView({
  path: "/products/123",
  title: "Product Name",
  referrer: document.referrer,
});`}</code></pre>

          <h2>Feature Flags</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { useFeature, track } from "philjs-core";

export function Dashboard() {
  const newUI = useFeature("new-dashboard-ui");

  // Automatically tracks feature exposure

  if (newUI) {
    track("new_ui_seen");
    return <NewDashboard />;
  }

  return <OldDashboard />;
}`}</code></pre>

          <h2>User Sessions</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { trackSession } from "philjs-core";

// Session tracking
trackSession({
  sessionId: generateId(),

  // Track session metrics
  metrics: {
    duration: true,
    interactions: true,
    engagement: true,
  },

  // Session replay (privacy-safe)
  replay: {
    enabled: true,
    maskInputs: true,
    ignoreClasses: ["sensitive", "private"],
  },
});`}</code></pre>

          <h2>Conversion Funnels</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { trackFunnel } from "philjs-core";

// Define conversion funnel
const checkoutFunnel = trackFunnel({
  name: "checkout",
  steps: [
    "view_cart",
    "enter_shipping",
    "enter_payment",
    "confirm_order",
    "purchase_complete",
  ],
});

// Track step completion
checkoutFunnel.track("enter_shipping", {
  cartValue: 149.99,
  items: 3,
});`}</code></pre>

          <h2>A/B Testing</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { useExperiment } from "philjs-core";

export function ProductList() {
  const variant = useExperiment("product-layout", {
    variants: ["grid", "list"],
    weights: [0.5, 0.5],
  });

  // Automatically tracks:
  // - Exposure (user saw variant)
  // - Conversion (user completed goal)
  // - Statistical significance

  return variant === "grid"
    ? <GridLayout />
    : <ListLayout />;
}`}</code></pre>

          <h2>Analytics Dashboard</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { getAnalytics } from "philjs-core";

const analytics = await getAnalytics({
  period: "last-30-days",
  metrics: ["pageviews", "users", "sessions"],
});

console.log(analytics);
// {
//   pageviews: 125340,
//   users: 42150,
//   sessions: 68920,
//   avgSessionDuration: "4:32",
//   bounceRate: 0.42,
//   topPages: [
//     { path: "/", views: 42350 },
//     { path: "/products", views: 28640 },
//   ],
// }`}</code></pre>
        </div>
      ),
    },

    "/docs/performance-budgets": {
      title: "Performance Budgets",
      content: (
        <div>
          <h1>Performance Budgets</h1>
          <p>Set and enforce performance constraints to ensure your application stays fast.</p>

          <h2>Define Budgets</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { setPerformanceBudget } from "philjs-core";

setPerformanceBudget({
  // Bundle size limits
  javascript: {
    initial: 50, // KB
    total: 150,
  },

  css: {
    initial: 20,
    total: 40,
  },

  // Core Web Vitals
  lcp: 2.5, // Largest Contentful Paint (seconds)
  fid: 100, // First Input Delay (ms)
  cls: 0.1, // Cumulative Layout Shift

  // Custom metrics
  tti: 3.5, // Time to Interactive
  fcp: 1.8, // First Contentful Paint
});`}</code></pre>

          <h2>Component Budgets</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { withBudget } from "philjs-core";

export const ProductList = withBudget({
  // Size budget
  size: 25, // KB

  // Render budget
  renderTime: 16, // ms (60fps)

  // Network budget
  requests: 5,
  bandwidth: 100, // KB
}, () => {
  // Component implementation
  return <div>Products...</div>;
});`}</code></pre>

          <h2>Build-time Enforcement</h2>
          <pre style={styles.codeBlock || {}}><code>{`// philjs.config.ts
export default {
  performance: {
    budgets: {
      javascript: { max: 150 },
      css: { max: 40 },
      images: { max: 500 },
    },

    // Fail build if exceeded
    enforce: true,

    // Or just warn
    warnOnly: false,
  },
};`}</code></pre>

          <h2>Runtime Monitoring</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { monitorPerformance } from "philjs-core";

monitorPerformance({
  // Real User Monitoring (RUM)
  rum: true,

  // Sample rate (0-1)
  sampleRate: 0.1,

  // Report violations
  onViolation: (metric, value, budget) => {
    console.warn(\`\${metric} exceeded: \${value} > \${budget}\`);

    // Send to analytics
    track("performance_violation", {
      metric,
      value,
      budget,
      page: window.location.pathname,
    });
  },
});`}</code></pre>

          <h2>Progressive Enhancement</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { useConnection } from "philjs-core";

export function ImageGallery() {
  const connection = useConnection();

  // Adapt to network conditions
  const quality = connection.saveData
    ? "low"
    : connection.effectiveType === "4g"
      ? "high"
      : "medium";

  return (
    <img
      src={\`/image-\${quality}.jpg\`}
      loading="lazy"
    />
  );
}`}</code></pre>

          <h2>Budget Reports</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { getPerformanceReport } from "philjs-core";

const report = await getPerformanceReport();

console.log(report);
// {
//   budgets: {
//     javascript: { budget: 150, actual: 142, status: "ok" },
//     lcp: { budget: 2.5, actual: 1.8, status: "ok" },
//     cls: { budget: 0.1, actual: 0.15, status: "exceeded" },
//   },
//
//   suggestions: [
//     "Reduce layout shift in Header component",
//     "Lazy load ProductGrid images",
//   ],
// }`}</code></pre>

          <h2>Resource Hints</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { preload, prefetch } from "philjs-core";

// Preload critical resources
preload("/critical.css", { as: "style" });
preload("/hero.jpg", { as: "image" });

// Prefetch next page
prefetch("/products");

// Preconnect to API
preconnect("https://api.example.com");`}</code></pre>
        </div>
      ),
    },

    "/docs/time-travel": {
      title: "Time Travel Debugging",
      content: (
        <div>
          <h1>Time Travel Debugging</h1>
          <p>PhilJS DevTools includes powerful time-travel debugging to step through state changes and replay user interactions.</p>

          <h2>Enable Time Travel</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { enableDevTools } from "philjs-devtools";

enableDevTools({
  timeTravel: {
    enabled: true,

    // Record all state changes
    recordState: true,

    // Record user interactions
    recordEvents: true,

    // Max history size
    maxHistory: 100,
  },
});`}</code></pre>

          <h2>Basic Usage</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { timeTravel } from "philjs-devtools";

// Go back 5 states
timeTravel.back(5);

// Go forward 2 states
timeTravel.forward(2);

// Jump to specific state
timeTravel.jumpTo(42);

// Reset to initial state
timeTravel.reset();`}</code></pre>

          <h2>State Snapshots</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { createSnapshot, restoreSnapshot } from "philjs-devtools";

// Save current state
const snapshot = createSnapshot({
  name: "Before checkout",
  include: ["cart", "user", "products"],
});

// Later, restore it
restoreSnapshot(snapshot);`}</code></pre>

          <h2>Action History</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { getActionHistory } from "philjs-devtools";

const history = getActionHistory();

history.forEach((action, index) => {
  console.log(\`\${index}: \${action.type}\`, action.payload);
});

// Output:
// 0: SET_COUNT { value: 0 }
// 1: INCREMENT {}
// 2: INCREMENT {}
// 3: SET_USER { name: "Alice" }
// 4: ADD_TO_CART { productId: 123 }`}</code></pre>

          <h2>Record and Replay</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { startRecording, stopRecording, replay } from "philjs-devtools";

// Start recording session
const recording = startRecording({
  captureEvents: true,
  captureState: true,
  captureNetwork: true,
});

// ... user interacts with app ...

// Stop recording
const session = stopRecording(recording);

// Export session
const sessionData = session.export();

// Later, replay it
replay(sessionData, {
  speed: 1.0, // Normal speed
  pauseOnError: true,
});`}</code></pre>

          <h2>Time-Travel UI</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { TimeTravelPanel } from "philjs-devtools";

export function DevApp() {
  return (
    <>
      <App />

      {import.meta.env.DEV && (
        <TimeTravelPanel
          position="bottom"
          showState={true}
          showActions={true}
          showTimeline={true}
        />
      )}
    </>
  );
}`}</code></pre>

          <h2>Conditional Breakpoints</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { addBreakpoint } from "philjs-devtools";

// Pause when condition is met
addBreakpoint((state) => {
  return state.cart.total > 1000;
}, {
  message: "Cart total exceeded $1000",
  capture: true,
});`}</code></pre>

          <h2>State Diff</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { getStateDiff } from "philjs-devtools";

const diff = getStateDiff(
  stateAtStep(10),
  stateAtStep(15)
);

console.log(diff);
// {
//   added: { "user.preferences": {...} },
//   modified: { "cart.items": [1, 2, 3] → [1, 2] },
//   removed: { "temp.data": undefined },
// }`}</code></pre>

          <h2>Hot Reload State</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { preserveState } from "philjs-devtools";

// Preserve state across hot reloads
preserveState({
  include: ["user", "cart", "session"],
  exclude: ["temp"],
});

// State persists during development
// No need to re-login or rebuild cart!`}</code></pre>
        </div>
      ),
    },

    // ADVANCED
    "/docs/forms": {
      title: "Forms",
      content: (
        <div>
          <h1>Forms</h1>
          <p>PhilJS provides a powerful forms system with validation, error handling, and optimistic updates.</p>

          <h2>Basic Form</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { signal } from "philjs-core";

export function ContactForm() {
  const name = signal("");
  const email = signal("");

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    console.log({ name: name(), email: email() });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name()}
        onInput={(e) => name.set(e.target.value)}
        placeholder="Name"
      />

      <input
        type="email"
        value={email()}
        onInput={(e) => email.set(e.target.value)}
        placeholder="Email"
      />

      <button type="submit">Submit</button>
    </form>
  );
}`}</code></pre>

          <h2>Form Validation</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { signal, memo } from "philjs-core";

export function SignupForm() {
  const email = signal("");
  const password = signal("");

  const emailError = memo(() => {
    const value = email();
    if (!value) return "Email is required";
    if (!value.includes("@")) return "Invalid email";
    return null;
  });

  const passwordError = memo(() => {
    const value = password();
    if (!value) return "Password is required";
    if (value.length < 8) return "Password must be 8+ characters";
    return null;
  });

  const isValid = memo(() => {
    return !emailError() && !passwordError();
  });

  return (
    <form>
      <div>
        <input type="email" value={email()}
          onInput={(e) => email.set(e.target.value)} />
        {emailError() && <span class="error">{emailError()}</span>}
      </div>

      <div>
        <input type="password" value={password()}
          onInput={(e) => password.set(e.target.value)} />
        {passwordError() && <span class="error">{passwordError()}</span>}
      </div>

      <button type="submit" disabled={!isValid()}>
        Sign Up
      </button>
    </form>
  );
}`}</code></pre>

          <h2>Server Actions</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { serverFn, signal } from "philjs-core";

const createUser = serverFn(async (data: { name: string; email: string }) => {
  const user = await db.users.create({ data });
  return user;
});

export function SignupForm() {
  const name = signal("");
  const email = signal("");
  const loading = signal(false);
  const error = signal<string | null>(null);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    loading.set(true);
    error.set(null);

    try {
      const user = await createUser({
        name: name(),
        email: email(),
      });

      console.log("User created:", user);
      // Redirect or show success
    } catch (err) {
      error.set(err.message);
    } finally {
      loading.set(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... form fields ... */}

      {error() && <div class="error">{error()}</div>}

      <button type="submit" disabled={loading()}>
        {loading() ? "Creating..." : "Sign Up"}
      </button>
    </form>
  );
}`}</code></pre>

          <h2>Form State Management</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { createForm } from "philjs-core";

const form = createForm({
  initialValues: {
    name: "",
    email: "",
    age: 0,
  },

  validate: (values) => {
    const errors: any = {};
    if (!values.name) errors.name = "Required";
    if (!values.email) errors.email = "Required";
    if (values.age < 18) errors.age = "Must be 18+";
    return errors;
  },

  onSubmit: async (values) => {
    await createUser(values);
  },
});

export function Form() {
  return (
    <form onSubmit={form.handleSubmit}>
      <input {...form.field("name")} />
      {form.errors.name && <span>{form.errors.name}</span>}

      <input {...form.field("email")} type="email" />
      {form.errors.email && <span>{form.errors.email}</span>}

      <input {...form.field("age")} type="number" />
      {form.errors.age && <span>{form.errors.age}</span>}

      <button type="submit" disabled={!form.isValid || form.isSubmitting}>
        Submit
      </button>
    </form>
  );
}`}</code></pre>

          <h2>File Uploads</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { signal, serverFn } from "philjs-core";

const uploadFile = serverFn(async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  return response.json();
});

export function FileUpload() {
  const file = signal<File | null>(null);
  const progress = signal(0);
  const uploading = signal(false);

  const handleUpload = async () => {
    const f = file();
    if (!f) return;

    uploading.set(true);

    try {
      const result = await uploadFile(f);
      console.log("Uploaded:", result);
    } finally {
      uploading.set(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => file.set(e.target.files?.[0] || null)}
      />

      <button onClick={handleUpload} disabled={!file() || uploading()}>
        {uploading() ? \`Uploading... \${progress()}%\` : "Upload"}
      </button>
    </div>
  );
}`}</code></pre>
        </div>
      ),
    },

    "/docs/animations": {
      title: "Animations",
      content: (
        <div>
          <h1>Animations</h1>
          <p>Create smooth, performant animations with PhilJS's animation system.</p>

          <h2>Basic Animation</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { signal, animate } from "philjs-core";

export function AnimatedBox() {
  const x = signal(0);

  const moveRight = () => {
    animate(x, 300, {
      duration: 500,
      easing: "ease-out",
    });
  };

  return (
    <>
      <div style={{ transform: \`translateX(\${x()}px)\` }}>
        Box
      </div>
      <button onClick={moveRight}>Move</button>
    </>
  );
}`}</code></pre>

          <h2>Spring Animations</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { signal, spring } from "philjs-core";

export function BouncyButton() {
  const scale = signal(1);

  const handlePress = () => {
    spring(scale, 0.9, {
      stiffness: 300,
      damping: 10,
    });
  };

  const handleRelease = () => {
    spring(scale, 1, {
      stiffness: 200,
      damping: 15,
    });
  };

  return (
    <button
      onMouseDown={handlePress}
      onMouseUp={handleRelease}
      style={{ transform: \`scale(\${scale()})\` }}
    >
      Click me!
    </button>
  );
}`}</code></pre>

          <h2>Keyframe Animations</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { signal, keyframes } from "philjs-core";

export function Pulse() {
  const opacity = signal(1);
  const scale = signal(1);

  keyframes({
    opacity: [1, 0.5, 1],
    scale: [1, 1.1, 1],
  }, {
    duration: 2000,
    iterations: Infinity,
    targets: { opacity, scale },
  });

  return (
    <div style={{
      opacity: opacity(),
      transform: \`scale(\${scale()})\`
    }}>
      Pulsing
    </div>
  );
}`}</code></pre>

          <h2>Transition Groups</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { signal, TransitionGroup } from "philjs-core";

export function TodoList() {
  const todos = signal([
    { id: 1, text: "Buy milk" },
    { id: 2, text: "Walk dog" },
  ]);

  return (
    <TransitionGroup
      enter={{ opacity: 0, y: -20 }}
      enterActive={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 100 }}
      duration={300}
    >
      {todos().map(todo => (
        <div key={todo.id}>{todo.text}</div>
      ))}
    </TransitionGroup>
  );
}`}</code></pre>

          <h2>Scroll Animations</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { useScrollProgress } from "philjs-core";

export function ParallaxHero() {
  const progress = useScrollProgress();

  const y = () => progress() * 100;
  const opacity = () => 1 - progress();

  return (
    <div style={{
      transform: \`translateY(\${y()}px)\`,
      opacity: opacity(),
    }}>
      <h1>Parallax Hero</h1>
    </div>
  );
}`}</code></pre>

          <h2>View Transitions</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { navigate } from "philjs-router";

// Enable view transitions
export function NavLink({ href, children }) {
  const handleClick = async (e) => {
    e.preventDefault();

    if (document.startViewTransition) {
      await document.startViewTransition(() => {
        navigate(href);
      });
    } else {
      navigate(href);
    }
  };

  return <a href={href} onClick={handleClick}>{children}</a>;
}`}</code></pre>

          <h2>Gesture Animations</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { signal, useDrag } from "philjs-core";

export function DraggableCard() {
  const x = signal(0);
  const y = signal(0);

  const drag = useDrag({
    onDrag: ({ deltaX, deltaY }) => {
      x.set(x() + deltaX);
      y.set(y() + deltaY);
    },
    onDragEnd: () => {
      // Snap back or complete action
      spring(x, 0);
      spring(y, 0);
    },
  });

  return (
    <div
      {...drag.handlers}
      style={{
        transform: \`translate(\${x()}px, \${y()}px)\`,
        cursor: drag.isDragging() ? "grabbing" : "grab",
      }}
    >
      Drag me!
    </div>
  );
}`}</code></pre>
        </div>
      ),
    },

    "/docs/error-boundaries": {
      title: "Error Boundaries",
      content: (
        <div>
          <h1>Error Boundaries</h1>
          <p>Catch and handle errors gracefully in your PhilJS applications.</p>

          <h2>Basic Error Boundary</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { ErrorBoundary } from "philjs-core";

export function App() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div>
          <h1>Something went wrong</h1>
          <pre>{error.message}</pre>
          <button onClick={reset}>Try again</button>
        </div>
      )}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}`}</code></pre>

          <h2>Multiple Boundaries</h2>
          <pre style={styles.codeBlock || {}}><code>{`export function Dashboard() {
  return (
    <div>
      <ErrorBoundary fallback={<HeaderError />}>
        <Header />
      </ErrorBoundary>

      <ErrorBoundary fallback={<SidebarError />}>
        <Sidebar />
      </ErrorBoundary>

      <ErrorBoundary fallback={<ContentError />}>
        <MainContent />
      </ErrorBoundary>
    </div>
  );
}`}</code></pre>

          <h2>Error Reporting</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { ErrorBoundary } from "philjs-core";

export function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to error tracking service
        console.error("Error caught:", error);
        console.error("Component stack:", errorInfo.componentStack);

        // Send to Sentry, LogRocket, etc.
        trackError(error, {
          componentStack: errorInfo.componentStack,
          user: getCurrentUser(),
          context: getErrorContext(),
        });
      }}
      fallback={(error) => <ErrorPage error={error} />}
    >
      <App />
    </ErrorBoundary>
  );
}`}</code></pre>

          <h2>Async Error Handling</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { Suspense, ErrorBoundary } from "philjs-core";

export function UserProfile({ userId }) {
  return (
    <ErrorBoundary fallback={<ProfileError />}>
      <Suspense fallback={<ProfileLoading />}>
        <AsyncUserProfile userId={userId} />
      </Suspense>
    </ErrorBoundary>
  );
}

async function AsyncUserProfile({ userId }) {
  const user = await fetchUser(userId);

  if (!user) {
    throw new Error("User not found");
  }

  return <div>{user.name}</div>;
}`}</code></pre>

          <h2>Recovery Strategies</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { signal } from "philjs-core";

export function ResilientComponent() {
  const retryCount = signal(0);
  const maxRetries = 3;

  return (
    <ErrorBoundary
      fallback={(error, reset) => {
        const count = retryCount();

        if (count < maxRetries) {
          // Auto-retry
          setTimeout(() => {
            retryCount.set(count + 1);
            reset();
          }, 1000 * Math.pow(2, count)); // Exponential backoff

          return <div>Retrying... (attempt {count + 1})</div>;
        }

        return (
          <div>
            <h1>Failed after {maxRetries} attempts</h1>
            <button onClick={() => {
              retryCount.set(0);
              reset();
            }}>
              Try again
            </button>
          </div>
        );
      }}
    >
      <DataComponent />
    </ErrorBoundary>
  );
}`}</code></pre>

          <h2>Custom Error Types</h2>
          <pre style={styles.codeBlock || {}}><code>{`class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = "NetworkError";
  }
}

class AuthError extends Error {
  constructor(message) {
    super(message);
    this.name = "AuthError";
  }
}

export function App() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => {
        if (error instanceof AuthError) {
          return <LoginPrompt />;
        }

        if (error instanceof NetworkError) {
          return (
            <div>
              <h1>Network Error</h1>
              <button onClick={reset}>Retry</button>
            </div>
          );
        }

        return <GenericError error={error} />;
      }}
    >
      <App />
    </ErrorBoundary>
  );
}`}</code></pre>
        </div>
      ),
    },

    "/docs/i18n": {
      title: "Internationalization",
      content: (
        <div>
          <h1>Internationalization (i18n)</h1>
          <p>Build multi-language applications with PhilJS's built-in i18n support.</p>

          <h2>Setup</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { createI18n } from "philjs-core";

const i18n = createI18n({
  defaultLocale: "en",
  locales: ["en", "es", "fr", "de"],

  messages: {
    en: {
      welcome: "Welcome",
      goodbye: "Goodbye",
      greeting: "Hello, {name}!",
    },
    es: {
      welcome: "Bienvenido",
      goodbye: "Adiós",
      greeting: "¡Hola, {name}!",
    },
  },
});

export default i18n;`}</code></pre>

          <h2>Using Translations</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { useI18n } from "philjs-core";
import i18n from "./i18n";

export function Greeting({ name }) {
  const { t, locale } = useI18n(i18n);

  return (
    <div>
      <h1>{t("greeting", { name })}</h1>
      <p>Current locale: {locale()}</p>
    </div>
  );
}`}</code></pre>

          <h2>Locale Switching</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { useI18n } from "philjs-core";

export function LocaleSwitcher() {
  const { locale, setLocale, locales } = useI18n();

  return (
    <select
      value={locale()}
      onChange={(e) => setLocale(e.target.value)}
    >
      {locales.map(loc => (
        <option value={loc}>{loc.toUpperCase()}</option>
      ))}
    </select>
  );
}`}</code></pre>

          <h2>Pluralization</h2>
          <pre style={styles.codeBlock || {}}><code>{`const messages = {
  en: {
    items: {
      zero: "No items",
      one: "One item",
      other: "{count} items",
    },
  },
};

export function ItemCount({ count }) {
  const { t } = useI18n();

  return <p>{t("items", { count })}</p>;
}

// <ItemCount count={0} /> → "No items"
// <ItemCount count={1} /> → "One item"
// <ItemCount count={5} /> → "5 items"`}</code></pre>

          <h2>Date and Number Formatting</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { useI18n } from "philjs-core";

export function ProductPrice({ price }) {
  const { formatNumber, formatDate, locale } = useI18n();

  const now = new Date();

  return (
    <div>
      <p>Price: {formatNumber(price, {
        style: "currency",
        currency: locale() === "en" ? "USD" : "EUR"
      })}</p>

      <p>Date: {formatDate(now, {
        dateStyle: "medium",
        timeStyle: "short",
      })}</p>
    </div>
  );
}

// en-US: $99.99, Dec 15, 2023, 3:30 PM
// de-DE: 99,99 €, 15. Dez. 2023, 15:30`}</code></pre>

          <h2>Lazy Loading Translations</h2>
          <pre style={styles.codeBlock || {}}><code>{`const i18n = createI18n({
  defaultLocale: "en",
  locales: ["en", "es", "fr"],

  // Load translations on demand
  loadLocale: async (locale) => {
    const messages = await import(\`./locales/\${locale}.json\`);
    return messages.default;
  },
});

// Translations loaded when locale is first used
const { t } = useI18n(i18n);`}</code></pre>

          <h2>RTL Support</h2>
          <pre style={styles.codeBlock || {}}><code>{`const i18n = createI18n({
  locales: ["en", "ar", "he"],

  rtlLocales: ["ar", "he"],
});

export function App() {
  const { locale, isRTL } = useI18n(i18n);

  return (
    <div dir={isRTL() ? "rtl" : "ltr"}>
      <App />
    </div>
  );
}`}</code></pre>

          <h2>SEO and Meta Tags</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { useI18n, Head } from "philjs-core";

export function ProductPage() {
  const { t, locale } = useI18n();

  return (
    <>
      <Head>
        <title>{t("product.title")}</title>
        <meta name="description" content={t("product.description")} />
        <meta property="og:locale" content={locale()} />
      </Head>

      <h1>{t("product.title")}</h1>
    </>
  );
}`}</code></pre>
        </div>
      ),
    },

    "/docs/testing": {
      title: "Testing",
      content: (
        <div>
          <h1>Testing</h1>
          <p>Test PhilJS applications with confidence using modern testing tools.</p>

          <h2>Setup</h2>
          <pre style={styles.codeBlock || {}}><code>{`// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
  },
});

// test/setup.ts
import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});`}</code></pre>

          <h2>Component Testing</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { Counter } from "./Counter";

test("renders counter", () => {
  render(<Counter />);

  expect(screen.getByText("Count: 0")).toBeInTheDocument();
});

test("increments counter", async () => {
  const { user } = render(<Counter />);

  const button = screen.getByText("Increment");
  await user.click(button);

  expect(screen.getByText("Count: 1")).toBeInTheDocument();
});`}</code></pre>

          <h2>Testing Signals</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { signal } from "philjs-core";
import { expect, test } from "vitest";

test("signal updates value", () => {
  const count = signal(0);

  expect(count()).toBe(0);

  count.set(5);
  expect(count()).toBe(5);

  count.set(prev => prev + 1);
  expect(count()).toBe(6);
});

test("memo recomputes on dependency change", () => {
  const a = signal(2);
  const b = signal(3);
  const sum = memo(() => a() + b());

  expect(sum()).toBe(5);

  a.set(10);
  expect(sum()).toBe(13);
});`}</code></pre>

          <h2>Testing Server Functions</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { serverFn } from "philjs-core";
import { expect, test, vi } from "vitest";

const fetchUser = serverFn(async (id: number) => {
  const response = await fetch(\`/api/users/\${id}\`);
  return response.json();
});

test("fetches user data", async () => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ id: 1, name: "Alice" }),
    })
  );

  const user = await fetchUser(1);

  expect(user).toEqual({ id: 1, name: "Alice" });
  expect(fetch).toHaveBeenCalledWith("/api/users/1");
});`}</code></pre>

          <h2>Integration Tests</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { App } from "./App";

test("user can create todo", async () => {
  const { user } = render(<App />);

  // Type in input
  const input = screen.getByPlaceholderText("New todo");
  await user.type(input, "Buy milk");

  // Submit form
  const button = screen.getByText("Add");
  await user.click(button);

  // Verify todo appears
  expect(screen.getByText("Buy milk")).toBeInTheDocument();

  // Verify input is cleared
  expect(input).toHaveValue("");
});`}</code></pre>

          <h2>Snapshot Testing</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { render } from "@testing-library/react";
import { expect, test } from "vitest";
import { ProductCard } from "./ProductCard";

test("matches snapshot", () => {
  const { container } = render(
    <ProductCard
      name="Widget"
      price={29.99}
      image="/widget.jpg"
    />
  );

  expect(container).toMatchSnapshot();
});`}</code></pre>

          <h2>E2E Testing</h2>
          <pre style={styles.codeBlock || {}}><code>{`// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:3000",
  },
});

// e2e/checkout.spec.ts
import { test, expect } from "@playwright/test";

test("user can complete checkout", async ({ page }) => {
  await page.goto("/products");

  // Add to cart
  await page.click('button:has-text("Add to Cart")');
  await expect(page.locator(".cart-count")).toHaveText("1");

  // Go to checkout
  await page.click('a:has-text("Cart")');
  await page.click('button:has-text("Checkout")');

  // Fill form
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="card"]', "4242424242424242");

  // Complete purchase
  await page.click('button:has-text("Pay")');

  // Verify success
  await expect(page.locator("h1")).toHaveText("Order Complete");
});`}</code></pre>

          <h2>Testing Custom Hooks</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { renderHook } from "@testing-library/react";
import { expect, test } from "vitest";
import { useCounter } from "./useCounter";

test("useCounter hook", () => {
  const { result } = renderHook(() => useCounter(0));

  expect(result.current.count()).toBe(0);

  result.current.increment();
  expect(result.current.count()).toBe(1);

  result.current.decrement();
  expect(result.current.count()).toBe(0);
});`}</code></pre>
        </div>
      ),
    },

    // API REFERENCE
    "/docs/api/core": {
      title: "Core API",
      content: (
        <div>
          <h1>Core API Reference</h1>
          <p>Complete API reference for <code>philjs-core</code> package.</p>

          <h2>signal()</h2>
          <pre style={styles.codeBlock || {}}><code>{`function signal<T>(initialValue: T): Signal<T>

// Create a reactive signal
const count = signal(0);

// Methods:
count()           // Get value
count.set(5)      // Set value
count.set(x => x + 1)  // Update with function
count.subscribe(fn)    // Subscribe to changes
count.unsubscribe(fn)  // Unsubscribe`}</code></pre>

          <h2>memo()</h2>
          <pre style={styles.codeBlock || {}}><code>{`function memo<T>(fn: () => T): Memo<T>

// Create computed value
const doubled = memo(() => count() * 2);

// Automatically updates when dependencies change
console.log(doubled()); // 0
count.set(5);
console.log(doubled()); // 10`}</code></pre>

          <h2>effect()</h2>
          <pre style={styles.codeBlock || {}}><code>{`function effect(fn: () => void | (() => void)): () => void

// Run side effects
const cleanup = effect(() => {
  console.log("Count is:", count());

  // Optional cleanup
  return () => {
    console.log("Cleaning up");
  };
});

// Stop effect
cleanup();`}</code></pre>

          <h2>resource()</h2>
          <pre style={styles.codeBlock || {}}><code>{`function resource<T>(fetcher: () => Promise<T>): Resource<T>

// Create async resource
const user = resource(() => fetchUser(userId()));

// Properties:
user.data       // Signal<T | undefined>
user.loading    // Signal<boolean>
user.error      // Signal<Error | undefined>
user.refetch()  // Refetch data`}</code></pre>

          <h2>render()</h2>
          <pre style={styles.codeBlock || {}}><code>{`function render(vnode: VNode, container: HTMLElement): void

// Render component to DOM
render(<App />, document.getElementById("root"));`}</code></pre>

          <h2>createContext()</h2>
          <pre style={styles.codeBlock || {}}><code>{`function createContext<T>(defaultValue?: T): Context<T>

const ThemeContext = createContext("light");

// Provider
<ThemeContext.Provider value="dark">
  <App />
</ThemeContext.Provider>

// Consumer
const theme = useContext(ThemeContext);`}</code></pre>

          <h2>Suspense</h2>
          <pre style={styles.codeBlock || {}}><code>{`<Suspense fallback={<Loading />}>
  <AsyncComponent />
</Suspense>

// Shows fallback while async components load`}</code></pre>

          <h2>ErrorBoundary</h2>
          <pre style={styles.codeBlock || {}}><code>{`<ErrorBoundary
  fallback={(error, reset) => <ErrorUI />}
  onError={(error, info) => logError(error)}
>
  <App />
</ErrorBoundary>`}</code></pre>

          <h2>JSX Types</h2>
          <pre style={styles.codeBlock || {}}><code>{`interface VNode {
  type: string | Function;
  props: Record<string, any>;
  children: VNode[];
}

type JSXElement = VNode;

type Component<P = {}> = (props: P) => JSXElement;`}</code></pre>
        </div>
      ),
    },

    "/docs/api/router": {
      title: "Router API",
      content: (
        <div>
          <h1>Router API Reference</h1>
          <p>Complete API reference for <code>philjs-router</code> package.</p>

          <h2>Router</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { Router } from "philjs-router";

<Router>
  <Route path="/" component={Home} />
  <Route path="/about" component={About} />
  <Route path="/users/:id" component={User} />
</Router>`}</code></pre>

          <h2>Route</h2>
          <pre style={styles.codeBlock || {}}><code>{`<Route
  path="/products/:id"
  component={ProductPage}
  preload={true}
  fallback={<Loading />}
/>`}</code></pre>

          <h2>Link</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { Link } from "philjs-router";

<Link
  href="/products/123"
  preload="hover"
  activeClass="active"
>
  Product
</Link>

// Props:
// - href: string
// - preload: "hover" | "visible" | false
// - activeClass: string
// - replace: boolean`}</code></pre>

          <h2>navigate()</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { navigate } from "philjs-router";

// Navigate programmatically
navigate("/products");

// With options
navigate("/products", {
  replace: true,
  state: { from: "/home" },
  scroll: false,
});`}</code></pre>

          <h2>useRouter()</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { useRouter } from "philjs-router";

const router = useRouter();

router.pathname    // Signal<string>
router.params      // Signal<Record<string, string>>
router.query       // Signal<URLSearchParams>
router.navigate(path)
router.back()
router.forward()`}</code></pre>

          <h2>useParams()</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { useParams } from "philjs-router";

// Route: /users/:id
const params = useParams();
const userId = params.id; // Signal<string>`}</code></pre>

          <h2>useSearchParams()</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { useSearchParams } from "philjs-router";

const [searchParams, setSearchParams] = useSearchParams();

// Get param
const page = searchParams.get("page");

// Set param
setSearchParams({ page: "2", sort: "name" });`}</code></pre>

          <h2>preload()</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { preload } from "philjs-router";

// Preload route
await preload("/products");

// Preload with data
await preload("/products", {
  prefetchData: true,
});`}</code></pre>

          <h2>Layout</h2>
          <pre style={styles.codeBlock || {}}><code>{`// src/routes/layout.tsx
export default function Layout({ children }) {
  return (
    <div>
      <Header />
      {children}
      <Footer />
    </div>
  );
}

// Applied to all routes in directory`}</code></pre>
        </div>
      ),
    },

    "/docs/api/ssr": {
      title: "SSR API",
      content: (
        <div>
          <h1>SSR API Reference</h1>
          <p>Complete API reference for <code>philjs-ssr</code> package.</p>

          <h2>renderToString()</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { renderToString } from "philjs-ssr";

const html = await renderToString(<App />);

// Returns complete HTML string
// Waits for all async resources`}</code></pre>

          <h2>renderToStream()</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { renderToStream } from "philjs-ssr";

const stream = renderToStream(<App />);

// Returns ReadableStream
// Streams HTML as it's generated
// Supports out-of-order streaming`}</code></pre>

          <h2>createHandler()</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { createHandler } from "philjs-ssr";

const handler = createHandler({
  render: (req) => <App url={req.url} />,

  onRequest: async (req) => {
    // Middleware
  },

  onError: (error, req) => {
    // Error handling
  },
});

export default handler;`}</code></pre>

          <h2>serverFn()</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { serverFn } from "philjs-ssr";

const getUser = serverFn(async (id: number) => {
  // Only runs on server
  const user = await db.users.findById(id);
  return user;
});

// Use in component
const user = await getUser(123);`}</code></pre>

          <h2>useRequest()</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { useRequest } from "philjs-ssr";

export function Page() {
  const request = useRequest();

  request.url
  request.method
  request.headers
  request.cookies
  request.ip
}`}</code></pre>

          <h2>redirect()</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { redirect } from "philjs-ssr";

// In server function or component
redirect("/login", {
  status: 302,
  headers: {
    "Set-Cookie": "...",
  },
});`}</code></pre>

          <h2>setHeaders()</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { setHeaders } from "philjs-ssr";

export function API() {
  setHeaders({
    "Content-Type": "application/json",
    "Cache-Control": "max-age=3600",
  });

  return { data: "..." };
}`}</code></pre>

          <h2>generateStaticParams()</h2>
          <pre style={styles.codeBlock || {}}><code>{`// src/routes/posts/[id]/page.tsx
export async function generateStaticParams() {
  const posts = await db.posts.findAll();

  return posts.map(post => ({
    id: post.id.toString(),
  }));
}

// Generates static pages at build time`}</code></pre>
        </div>
      ),
    },

    "/docs/api/islands": {
      title: "Islands API",
      content: (
        <div>
          <h1>Islands API Reference</h1>
          <p>Complete API reference for <code>philjs-islands</code> package.</p>

          <h2>island()</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { island } from "philjs-islands";

const Counter = island(() => {
  const count = signal(0);
  return <button onClick={() => count.set(c => c + 1)}>{count()}</button>;
}, {
  // Island options
  load: "visible",  // "visible" | "idle" | "media" | "eager"
  media: "(max-width: 768px)",
});

export default Counter;`}</code></pre>

          <h2>Island Options</h2>
          <pre style={styles.codeBlock || {}}><code>{`interface IslandOptions {
  // When to load the island
  load?: "visible" | "idle" | "media" | "eager";

  // Media query for "media" load strategy
  media?: string;

  // Delay before loading (ms)
  delay?: number;

  // Fallback while loading
  fallback?: JSXElement;

  // Props to pass to island
  props?: Record<string, any>;
}`}</code></pre>

          <h2>createIsland()</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { createIsland } from "philjs-islands";

const MyIsland = createIsland({
  component: () => import("./MyComponent"),
  load: "visible",

  // Server-side placeholder
  placeholder: <div>Loading...</div>,
});`}</code></pre>

          <h2>useIslandState()</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { useIslandState } from "philjs-islands";

export default island(() => {
  // State shared between server and client
  const [count, setCount] = useIslandState("count", 0);

  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
});`}</code></pre>

          <h2>islandBridge()</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { islandBridge } from "philjs-islands";

// Share state between islands
const bridge = islandBridge();

// Island A
const IslandA = island(() => {
  const count = bridge.use("count", 0);
  return <button onClick={() => count.set(c => c + 1)}>{count()}</button>;
});

// Island B
const IslandB = island(() => {
  const count = bridge.use("count", 0);
  return <div>Count: {count()}</div>;
});`}</code></pre>

          <h2>Island Attributes</h2>
          <pre style={styles.codeBlock || {}}><code>{`<Counter
  client:load="visible"
  client:media="(max-width: 768px)"
  client:delay={1000}
  data-island="counter"
/>`}</code></pre>
        </div>
      ),
    },

    "/docs/api/devtools": {
      title: "DevTools API",
      content: (
        <div>
          <h1>DevTools API Reference</h1>
          <p>Complete API reference for <code>philjs-devtools</code> package.</p>

          <h2>enableDevTools()</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { enableDevTools } from "philjs-devtools";

enableDevTools({
  // Time travel debugging
  timeTravel: true,

  // Performance monitoring
  performance: true,

  // Component inspector
  inspector: true,

  // Network inspector
  network: true,
});`}</code></pre>

          <h2>timeTravel</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { timeTravel } from "philjs-devtools";

// Navigation
timeTravel.back(n)
timeTravel.forward(n)
timeTravel.jumpTo(index)
timeTravel.reset()

// State
timeTravel.getHistory()
timeTravel.getCurrentIndex()
timeTravel.getState(index)

// Recording
timeTravel.startRecording()
timeTravel.stopRecording()
timeTravel.export()
timeTravel.import(data)`}</code></pre>

          <h2>performance</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { performance } from "philjs-devtools";

// Metrics
performance.measure("component-render")
performance.mark("start")
performance.getMetrics()

// Profiling
performance.startProfiling()
const profile = performance.stopProfiling()

// Flame chart
performance.getFlameChart()`}</code></pre>

          <h2>inspector</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { inspector } from "philjs-devtools";

// Component tree
inspector.getTree()
inspector.selectComponent(id)
inspector.getComponent(id)

// Props and state
inspector.getProps(id)
inspector.getState(id)
inspector.updateState(id, newState)

// Highlight
inspector.highlight(id)
inspector.unhighlight()`}</code></pre>

          <h2>logger</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { logger } from "philjs-devtools";

// Logging
logger.log("message", data)
logger.warn("warning")
logger.error("error")

// Filtering
logger.filter({ level: "error", component: "App" })

// Export
logger.export()`}</code></pre>

          <h2>DevToolsPanel</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { DevToolsPanel } from "philjs-devtools";

<DevToolsPanel
  position="bottom"
  defaultOpen={false}
  tabs={["inspector", "performance", "network", "logger"]}
/>`}</code></pre>
        </div>
      ),
    },

    "/docs/api/ai": {
      title: "AI API",
      content: (
        <div>
          <h1>AI API Reference</h1>
          <p>Complete API reference for <code>philjs-ai</code> package.</p>

          <h2>useChat()</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { useChat } from "philjs-ai";

const chat = useChat({
  model: "gpt-4",
  apiKey: process.env.OPENAI_KEY,
});

// Properties
chat.messages     // Signal<Message[]>
chat.input        // Signal<string>
chat.isLoading    // Signal<boolean>

// Methods
chat.sendMessage(text)
chat.clear()
chat.regenerate()`}</code></pre>

          <h2>useCompletion()</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { useCompletion } from "philjs-ai";

const completion = useCompletion({
  model: "gpt-4",
  prompt: "Write a story about",
});

// Properties
completion.text         // Signal<string>
completion.isLoading    // Signal<boolean>

// Methods
completion.complete(prompt)
completion.stop()`}</code></pre>

          <h2>useEmbedding()</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { useEmbedding } from "philjs-ai";

const embedding = useEmbedding({
  model: "text-embedding-ada-002",
});

const vector = await embedding.embed("Hello world");
// Returns: number[] (1536 dimensions)`}</code></pre>

          <h2>useSimilaritySearch()</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { useSimilaritySearch } from "philjs-ai";

const search = useSimilaritySearch({
  documents: [
    { id: "1", text: "..." },
    { id: "2", text: "..." },
  ],
});

const results = await search.query("search query");
// Returns: { id: string, score: number }[]`}</code></pre>

          <h2>useRAG()</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { useRAG } from "philjs-ai";

const rag = useRAG({
  model: "gpt-4",
  documents: [...],
  embeddings: true,
});

const answer = await rag.ask("What is PhilJS?");
// Uses retrieval-augmented generation`}</code></pre>

          <h2>AI Providers</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { OpenAI, Anthropic, Cohere } from "philjs-ai";

// OpenAI
const openai = new OpenAI({ apiKey: "..." });

// Anthropic
const anthropic = new Anthropic({ apiKey: "..." });

// Cohere
const cohere = new Cohere({ apiKey: "..." });`}</code></pre>

          <h2>Streaming</h2>
          <pre style={styles.codeBlock || {}}><code>{`import { useChat } from "philjs-ai";

const chat = useChat({
  model: "gpt-4",
  stream: true,
});

// Messages stream in token by token
chat.sendMessage("Tell me a story");`}</code></pre>
        </div>
      ),
    },
  };

  return docs[path] || {
    title: "Documentation",
    content: (
      <div>
        <h1>Documentation</h1>
        <p>This page is currently being written. Check out these pages:</p>
        <ul>
          <li><a href="/docs" onClick={(e) => { e.preventDefault(); navigate("/docs"); }}>Introduction</a></li>
          <li><a href="/docs/signals" onClick={(e) => { e.preventDefault(); navigate("/docs/signals"); }}>Signals</a></li>
          <li><a href="/docs/routing" onClick={(e) => { e.preventDefault(); navigate("/docs/routing"); }}>Routing</a></li>
        </ul>
      </div>
    ),
  };
}
