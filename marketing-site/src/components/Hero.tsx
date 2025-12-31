import { html } from "../server/template";

export function Hero() {
  const badges = [
    "TypeScript 6-first",
    "Node 24+ baseline",
    "Signals-first runtime",
    "Zero hydration",
    "88 package ecosystem"
  ];
  const stats = [
    { value: "~3.3 KB", label: "Core runtime" },
    { value: "25 KB", label: "Full stack" },
    { value: "0 ms", label: "VDOM overhead" },
    { value: "500+", label: "Tests" }
  ];
  const stack = [
    {
      title: "Core runtime",
      description: "Signals, JSX runtime, compiler, and islands.",
      packages: ["@philjs/core", "@philjs/compiler", "@philjs/islands"]
    },
    {
      title: "Routing and rendering",
      description: "File-based routing with SSR and loaders.",
      packages: ["@philjs/router", "@philjs/ssr", "@philjs/router-typesafe"]
    },
    {
      title: "Data and auth",
      description: "Typed APIs, GraphQL, sessions, and auth flows.",
      packages: ["@philjs/api", "@philjs/graphql", "@philjs/auth"]
    },
    {
      title: "Production stack",
      description: "Adapters, testing, SEO, and observability.",
      packages: ["@philjs/adapters", "@philjs/testing", "@philjs/plugin-seo"]
    }
  ];

  return html`
    <section class="hero" data-animate>
      <div class="hero-content">
        <div class="hero-badges">
          ${badges.map((badge) => html`<span class="pill">${badge}</span>`)}
        </div>
        <h1 class="hero-title">
          Build web apps that ship less JavaScript and stay reactive at scale.
        </h1>
        <p class="hero-subtitle">
          PhilJS unifies signals, SSR, islands, and a full ecosystem of packages for
          data, auth, UI, and deployment. TypeScript 6-first with a Node 24+ baseline,
          it helps you build fast, production-ready experiences without duct-taping
          ten tools together.
        </p>
        <div class="hero-actions">
          <a href="#get-started" class="btn btn-primary" data-prefetch>
            Get Started
          </a>
          <a href="/features" class="btn btn-secondary" data-prefetch>
            Explore the Stack
          </a>
          <a
            href="https://github.com/philjs/philjs"
            class="btn btn-outline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View GitHub
          </a>
        </div>
        <div class="hero-stats">
          ${stats.map(
            (stat) => html`
              <div class="stat-card">
                <div class="stat-value">${stat.value}</div>
                <div class="stat-label">${stat.label}</div>
              </div>
            `
          )}
        </div>
      </div>
      <div class="hero-stack">
        ${stack.map(
          (item, index) => html`
            <div class="stack-card" data-animate style="--delay: ${index * 0.08}s">
              <div class="stack-title">${item.title}</div>
              <p>${item.description}</p>
              <div class="stack-packages">
                ${item.packages.map((pkg) => html`<span class="package-pill">${pkg}</span>`)}
              </div>
            </div>
          `
        )}
      </div>
    </section>
  `;
}
