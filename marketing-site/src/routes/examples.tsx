import { defineLoader } from "philjs-ssr";
import { html } from "../server/template";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export const loader = defineLoader(async () => {
  return {
    title: "Examples - PhilJS"
  };
});

export default function ExamplesPage() {
  const examples = [
    {
      title: "Counter",
      description: "Simple counter demonstrating basic signal usage and reactivity.",
      complexity: "Beginner",
      features: ["Signals", "Event Handlers"],
      github: "https://github.com/philjs/philjs/tree/main/examples/counter"
    },
    {
      title: "Todo App",
      description: "Classic todo list with add, complete, and delete functionality.",
      complexity: "Beginner",
      features: ["Signals", "Arrays", "Computed Values"],
      github: "https://github.com/philjs/philjs/tree/main/examples/todo-app"
    },
    {
      title: "E-Commerce Storefront",
      description: "Full-featured online store with products, cart, and checkout.",
      complexity: "Intermediate",
      features: ["SSR", "Router", "Islands", "Forms"],
      github: "https://github.com/philjs/philjs/tree/main/examples/storefront"
    },
    {
      title: "Real-Time Chat",
      description: "WebSocket-powered chat application with typing indicators.",
      complexity: "Intermediate",
      features: ["WebSockets", "Real-time Updates", "Islands"],
      github: "https://github.com/philjs/philjs/tree/main/examples/chat-app"
    },
    {
      title: "Analytics Dashboard",
      description: "Data visualization dashboard with charts and real-time metrics.",
      complexity: "Intermediate",
      features: ["Charts", "Real-time Data", "Computed Signals"],
      github: "https://github.com/philjs/philjs/tree/main/examples/dashboard"
    },
    {
      title: "Collaborative Editor",
      description: "Google Docs-style editor with real-time collaboration.",
      complexity: "Advanced",
      features: ["CRDTs", "WebSockets", "Operational Transform"],
      github: "https://github.com/philjs/philjs/tree/main/examples/collab-editor"
    },
    {
      title: "SaaS Starter",
      description: "Production-ready SaaS template with auth, billing, and admin.",
      complexity: "Advanced",
      features: ["Auth", "Database", "Stripe", "Admin Panel"],
      github: "https://github.com/philjs/philjs/tree/main/examples/saas-starter"
    },
    {
      title: "Progressive Web App",
      description: "Offline-first PWA with service worker and background sync.",
      complexity: "Advanced",
      features: ["Service Worker", "Offline Mode", "Push Notifications"],
      github: "https://github.com/philjs/philjs/tree/main/examples/pwa-app"
    }
  ];

  return html`
    <div class="page">
      ${Header({ currentPath: "/examples" })}
      <main class="main-content">
        <section class="page-hero" data-animate>
          <h1>Learn by Example</h1>
          <p class="lead">
            Explore our collection of example applications to learn PhilJS patterns
            and best practices. From simple counters to production-ready apps.
          </p>
        </section>

        <section class="examples-grid">
          ${examples.map(
            (example) => html`
              <div class="example-card" data-animate>
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
          <h2>Build Your Own</h2>
          <p>Ready to start your own project? Get started with PhilJS in minutes.</p>
          <div class="cta-actions">
            <a href="/#get-started" class="btn btn-primary" data-prefetch>Get Started</a>
            <a href="https://docs.philjs.dev" class="btn btn-secondary" target="_blank">View Docs</a>
          </div>
        </section>
      </main>
      ${Footer()}
    </div>
  `;
}
