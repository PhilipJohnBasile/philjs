import { html } from "../server/template";

export function CodeDemo() {
  return html`
    <section class="code-demo" id="get-started">
      <div class="section-header" data-animate>
        <h2>Get started in minutes</h2>
        <p>Scaffold a project, add your first route, and run it locally.</p>
      </div>
      <div class="demo-steps" data-animate>
        <div class="demo-step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h3>Create a PhilJS app</h3>
            <div class="code-block">
              <pre><code>pnpm create philjs my-app
cd my-app
pnpm install</code></pre>
              <button class="copy-btn" data-copy>Copy</button>
            </div>
          </div>
        </div>
        <div class="demo-step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>Add data and routing</h3>
            <div class="code-block">
              <pre><code>import { defineLoader } from "@philjs/ssr";

export const loader = defineLoader(async () => {
  const res = await fetch("/api/products");
  return { products: await res.json() };
});

export default function Home({ data }) {
  return data.products.map((p) => <div>{p.name}</div>);
}</code></pre>
              <button class="copy-btn" data-copy>Copy</button>
            </div>
          </div>
        </div>
        <div class="demo-step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>Run the dev server</h3>
            <div class="code-block">
              <pre><code>pnpm dev</code></pre>
              <button class="copy-btn" data-copy>Copy</button>
            </div>
            <p class="step-note">Your app runs at <code>http://localhost:3000</code></p>
          </div>
        </div>
      </div>
      <div class="demo-features" data-animate>
        <div class="demo-feature">
          <span class="feature-badge">Hot Reload</span>
          <p>Changes appear instantly without losing state</p>
        </div>
        <div class="demo-feature">
          <span class="feature-badge">SSR + Islands</span>
          <p>Stream HTML and hydrate only where needed</p>
        </div>
        <div class="demo-feature">
          <span class="feature-badge">Full Stack</span>
          <p>API routes, auth, and data tooling in one repo</p>
        </div>
      </div>
    </section>
  `;
}
