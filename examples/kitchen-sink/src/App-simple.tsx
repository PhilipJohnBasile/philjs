import { signal } from "@philjs/core";
import { SignalsDemo } from "./demos/SignalsDemo";

export function App() {
  const count = signal(0);

  return (
    <div style="min-height: 100vh; padding: 2rem 0;">
      <div class="container">
        <div style="background: white; border-radius: 12px; padding: 2rem; margin-bottom: 2rem; box-shadow: var(--shadow-lg);">
          <h1 style="margin: 0 0 0.5rem 0; font-size: 2.5rem; color: var(--primary);">
            PhilJS Kitchen Sink
          </h1>
          <p style="margin: 0; color: var(--text-secondary); font-size: 1.1rem;">
            Test: {count}
          </p>
          <button onClick={() => count.set(count() + 1)}>
            Click me: {count}
          </button>
        </div>

        <div style="background: white; border-radius: 12px; padding: 2rem; box-shadow: var(--shadow-lg);">
          <SignalsDemo />
        </div>
      </div>
    </div>
  );
}
