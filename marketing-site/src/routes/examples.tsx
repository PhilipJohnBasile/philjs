import { defineLoader } from "philjs-ssr";
import { html } from "../server/template";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export const loader = defineLoader(async () => {
  return {
    title: "Examples - PhilJS",
    description: "Explore PhilJS example applications across routing, SSR, realtime, and the broader ecosystem."
  };
});

export default function ExamplesPage() {
  const examples = [
    {
      title: "Todo App",
      description: "Signals, list rendering, and basic reactivity patterns.",
      complexity: "Beginner",
      features: ["Signals", "Lists", "Events"],
      github: "https://github.com/philjs/philjs/tree/main/examples/todo-app"
    },
    {
      title: "Tic Tac Toe",
      description: "Component composition and derived state with memos.",
      complexity: "Beginner",
      features: ["Signals", "Memos", "Game State"],
      github: "https://github.com/philjs/philjs/tree/main/examples/tic-tac-toe"
    },
    {
      title: "Blog SSG",
      description: "Static site generation with content pipelines.",
      complexity: "Intermediate",
      features: ["SSG", "Content", "Routing"],
      github: "https://github.com/philjs/philjs/tree/main/examples/blog-ssg"
    },
    {
      title: "Demo App",
      description: "Full framework showcase with core APIs and patterns.",
      complexity: "Intermediate",
      features: ["Routing", "Data", "SSR"],
      github: "https://github.com/philjs/philjs/tree/main/examples/demo-app"
    },
    {
      title: "Storefront",
      description: "Commerce flows with SSR, islands, and forms.",
      complexity: "Intermediate",
      features: ["SSR", "Islands", "Forms"],
      github: "https://github.com/philjs/philjs/tree/main/examples/storefront"
    },
    {
      title: "Docs Site",
      description: "Documentation site with themes, search, and navigation.",
      complexity: "Intermediate",
      features: ["Routing", "Theming", "Content"],
      github: "https://github.com/philjs/philjs/tree/main/examples/docs-site"
    },
    {
      title: "Chat App",
      description: "Realtime messaging with live updates.",
      complexity: "Advanced",
      features: ["Realtime", "Sockets", "Presence"],
      github: "https://github.com/philjs/philjs/tree/main/examples/chat-app"
    },
    {
      title: "Dashboard",
      description: "Analytics dashboards with charts and live data.",
      complexity: "Advanced",
      features: ["Charts", "Realtime", "Signals"],
      github: "https://github.com/philjs/philjs/tree/main/examples/dashboard"
    },
    {
      title: "Collaborative Editor",
      description: "Real-time collaboration with CRDTs and sync.",
      complexity: "Advanced",
      features: ["CRDT", "Collaboration", "Presence"],
      github: "https://github.com/philjs/philjs/tree/main/examples/collab-editor"
    },
    {
      title: "PWA App",
      description: "Offline-first app with service workers and sync.",
      complexity: "Advanced",
      features: ["PWA", "Offline", "Background Sync"],
      github: "https://github.com/philjs/philjs/tree/main/examples/pwa-app"
    },
    {
      title: "SaaS Starter",
      description: "Auth, billing, and admin flows wired together.",
      complexity: "Advanced",
      features: ["Auth", "Billing", "Admin"],
      github: "https://github.com/philjs/philjs/tree/main/examples/saas-starter"
    },
    {
      title: "Kitchen Sink",
      description: "Comprehensive feature coverage across the ecosystem.",
      complexity: "Advanced",
      features: ["Everything", "Patterns", "DX"],
      github: "https://github.com/philjs/philjs/tree/main/examples/kitchen-sink"
    }
  ];

  return html`
    <div class="page">
      ${Header({ currentPath: "/examples" })}
      <main class="main-content">
        <section class="page-hero" data-animate>
          <h1>Learn by example</h1>
          <p class="lead">
            Explore real PhilJS apps that showcase signals, routing, data, islands, and the broader ecosystem.
          </p>
        </section>

        <section class="examples-grid">
          ${examples.map(
            (example, index) => html`
              <div class="example-card" data-animate style="--delay: ${index * 0.04}s">
                <div class="example-header">
                  <h3>${example.title}</h3>
                  <span class="complexity-badge complexity-${example.complexity.toLowerCase()}">
                    ${example.complexity}
                  </span>
                </div>
                <p class="example-description">${example.description}</p>
                <div class="example-features">
                  ${example.features.map((feature) => html`<span class="feature-tag">${feature}</span>`)}
                </div>
                <div class="example-actions">
                  <a href="${example.github}" class="btn btn-outline" target="_blank" rel="noopener noreferrer">
                    View Code
                  </a>
                  <a
                    href="${example.github.replace("github.com", "codesandbox.io/s/github")}"
                    class="btn btn-secondary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Try Online
                  </a>
                </div>
              </div>
            `
          )}
        </section>

        <section class="cta-section" data-animate>
          <h2>Build your own</h2>
          <p>Start a new PhilJS project and pull in packages as you need them.</p>
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
