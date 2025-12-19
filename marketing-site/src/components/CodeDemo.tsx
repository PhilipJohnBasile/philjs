import { html } from "../server/template";

export function CodeDemo() {
  return html`
    <section class="code-demo" id="get-started">
      <div class="section-header" data-animate>
        <h2>Get Started in Seconds</h2>
        <p>Start building with PhilJS in just a few commands.</p>
      </div>
      <div class="demo-steps" data-animate>
        <div class="demo-step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h3>Install PhilJS</h3>
            <div class="code-block">
              <pre><code>npm create philjs@latest my-app
cd my-app
npm install</code></pre>
              <button class="copy-btn" data-copy>Copy</button>
            </div>
          </div>
        </div>
        <div class="demo-step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>Create Your First Component</h3>
            <div class="code-block">
              <pre><code>import { signal } from "philjs-core";

export function App() {
  const name = signal("World");

  return (
    &lt;div&gt;
      &lt;h1&gt;Hello, {name}!&lt;/h1&gt;
      &lt;input
        value={name}
        onInput={(e) => name.set(e.target.value)}
      /&gt;
    &lt;/div&gt;
  );
}</code></pre>
              <button class="copy-btn" data-copy>Copy</button>
            </div>
          </div>
        </div>
        <div class="demo-step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>Run Your App</h3>
            <div class="code-block">
              <pre><code>npm run dev</code></pre>
              <button class="copy-btn" data-copy>Copy</button>
            </div>
            <p class="step-note">Your app is now running at <code>http://localhost:3000</code></p>
          </div>
        </div>
      </div>
      <div class="demo-features" data-animate>
        <div class="demo-feature">
          <span class="feature-badge">Hot Reload</span>
          <p>Changes appear instantly without losing state</p>
        </div>
        <div class="demo-feature">
          <span class="feature-badge">TypeScript</span>
          <p>Full type safety out of the box</p>
        </div>
        <div class="demo-feature">
          <span class="feature-badge">Fast Builds</span>
          <p>Powered by Vite for lightning-fast development</p>
        </div>
      </div>
    </section>
  `;
}
