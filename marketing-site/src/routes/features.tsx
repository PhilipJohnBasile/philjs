import { defineLoader } from "@philjs/ssr";
import { html } from "../server/template";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export const loader = defineLoader(async () => {
  return {
    title: "Features - PhilJS",
    description: "Explore the PhilJS ecosystem: signals, routing, SSR, data, auth, and production tooling."
  };
});

export default function FeaturesPage() {
  const pillars = [
    {
      category: "Signals and runtime",
      items: [
        {
          title: "Fine-grained signals",
          description: "Track dependencies automatically and update only what changed.",
          code: `import { signal, memo } from "@philjs/core";

const count = signal(0);
const doubled = memo(() => count() * 2);

count.set(5); // Updates only doubled` ,
          packages: ["@philjs/core", "@philjs/compiler"]
        },
        {
          title: "Scheduling and batching",
          description: "Group updates and keep reactive work efficient.",
          code: `import { signal, effect, batch } from "@philjs/core";

const count = signal(0);

effect(() => {
  console.log("Count:", count());
});

batch(() => {
  count.set(1);
  count.set(2);
});`,
          packages: ["@philjs/core"]
        }
      ]
    },
    {
      category: "Routing and rendering",
      items: [
        {
          title: "File-based routing",
          description: "Use routes, loaders, and actions with type-safe params.",
          code: `import { createAppRouter } from "@philjs/router";

createAppRouter({
  routes: [
    { path: "/", component: Home },
    { path: "/posts/:slug", component: Post }
  ]
});`,
          packages: ["@philjs/router", "@philjs/router-typesafe"]
        },
        {
          title: "SSR streaming and islands",
          description: "Stream HTML quickly and hydrate only where needed.",
          code: `import { renderToStream } from "@philjs/ssr";

const stream = renderToStream(<App />);
// send stream to client`,
          packages: ["@philjs/ssr", "@philjs/islands"]
        }
      ]
    },
    {
      category: "Data and APIs",
      items: [
        {
          title: "Typed API routes",
          description: "Define server handlers with built-in validation and helpers.",
          code: `import { defineAPIRoute, json } from "@philjs/api";

export default defineAPIRoute({
  handler: async () => json({ ok: true })
});`,
          packages: ["@philjs/api"]
        },
        {
          title: "GraphQL and realtime",
          description: "Use cached queries, subscriptions, and realtime streams.",
          code: `import { createGraphQLClient } from "@philjs/graphql";

const client = createGraphQLClient({
  endpoint: "/graphql"
});`,
          packages: ["@philjs/graphql", "@philjs/realtime"]
        }
      ]
    },
    {
      category: "DX and production",
      items: [
        {
          title: "Tooling and testing",
          description: "CLI generators, devtools, and testing utilities built in.",
          code: `pnpm dlx create-philjs my-app
pnpm add @philjs/testing @philjs/devtools`,
          packages: ["@philjs/cli", "@philjs/testing", "@philjs/devtools"]
        },
        {
          title: "Deploy everywhere",
          description: "Adapters for edge, server, and Rust environments.",
          code: `import { createAdapter } from "@philjs/adapters";

const adapter = createAdapter("cloudflare-pages");`,
          packages: ["@philjs/adapters", "@philjs/edge", "@philjs/rust"]
        }
      ]
    }
  ];

  const ecosystem = [
    {
      title: "UI and styling",
      description: "Components, theming, Tailwind, and image pipelines.",
      packages: ["@philjs/ui", "@philjs/styles", "@philjs/tailwind", "@philjs/image"]
    },
    {
      title: "Auth and sessions",
      description: "Auth providers, session utilities, and security tooling.",
      packages: ["@philjs/auth", "@philjs/api", "@philjs/errors"]
    },
    {
      title: "Content and docs",
      description: "Content pipelines and documentation tooling.",
      packages: ["@philjs/content", "@philjs/docs", "@philjs/meta"]
    },
    {
      title: "Automation and AI",
      description: "AI adapters, analytics, and automation helpers.",
      packages: ["@philjs/ai", "@philjs/plugin-analytics", "@philjs/optimizer"]
    }
  ];

  return html`
    <div class="page">
      ${Header({ currentPath: "/features" })}
      <main class="main-content">
        <section class="page-hero" data-animate>
          <h1>Everything in one ecosystem</h1>
          <p class="lead">
            PhilJS is more than a runtime. It is a full stack of packages designed to work together,
            from routing and SSR to auth, data, and deployment.
          </p>
        </section>

        ${pillars.map(
          (category, categoryIndex) => html`
            <section class="feature-category" data-animate>
              <h2 class="category-title">${category.category}</h2>
              <div class="feature-items">
                ${category.items.map(
                  (item, itemIndex) => html`
                    <div class="feature-detail" data-animate style="--delay: ${(categoryIndex + itemIndex) * 0.04}s">
                      <h3>${item.title}</h3>
                      <p>${item.description}</p>
                      <div class="code-block">
                        <pre><code>${item.code}</code></pre>
                      </div>
                      <div class="feature-tags">
                        ${item.packages.map((pkg) => html`<span class="package-pill">${pkg}</span>`)}
                      </div>
                    </div>
                  `
                )}
              </div>
            </section>
          `
        )}

        <section class="ecosystem" data-animate>
          <div class="section-header">
            <h2>Expanded package surface</h2>
            <p>Pick what you need from the wider ecosystem and keep the rest optional.</p>
          </div>
          <div class="ecosystem-grid">
            ${ecosystem.map(
              (item, index) => html`
                <div class="ecosystem-card" data-animate style="--delay: ${index * 0.05}s">
                  <h3>${item.title}</h3>
                  <p>${item.description}</p>
                  <div class="ecosystem-packages">
                    ${item.packages.map((pkg) => html`<span class="package-pill">${pkg}</span>`)}
                  </div>
                </div>
              `
            )}
          </div>
        </section>

        <section class="cta-section" data-animate>
          <h2>Ready to build on the full stack?</h2>
          <p>Start with the core runtime and pull in packages as you grow.</p>
          <div class="cta-actions">
            <a href="/#get-started" class="btn btn-primary" data-prefetch>Get Started</a>
            <a href="https://docs.philjs.dev" class="btn btn-secondary" target="_blank" rel="noopener noreferrer">View Docs</a>
          </div>
        </section>
      </main>
      ${Footer()}
    </div>
  `;
}
