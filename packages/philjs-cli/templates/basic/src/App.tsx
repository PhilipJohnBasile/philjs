/**
 * Root App Component
 */
import { signal } from 'philjs-core';
import './App.css';

export function App() {
  const count = signal(0);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Welcome to PhilJS</h1>
        <p className="tagline">The framework that thinks ahead</p>
      </header>
      <main className="app-main">
        <div className="counter">
          <h2>Counter Example</h2>
          <p className="count">{count}</p>
          <div className="controls">
            <button onClick={() => count.set((c) => c - 1)}>-</button>
            <button onClick={() => count.set(0)}>Reset</button>
            <button onClick={() => count.set((c) => c + 1)}>+</button>
          </div>
        </div>
        <div className="features">
          <h2>Features</h2>
          <ul>
            <li>Fast, reactive signals</li>
            <li>Smart preloading</li>
            <li>Built-in routing</li>
            <li>SSR & SSG support</li>
            <li>Time-travel debugging</li>
          </ul>
        </div>
      </main>
      <footer className="app-footer">
        <p>
          Edit <code>src/App.tsx</code> to get started
        </p>
      </footer>
    </div>
  );
}
