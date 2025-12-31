import { html } from "../server/template";

export function UseCases() {
  const cases = [
    {
      title: "Marketing and content",
      description: "Ship fast landing pages with islands, SEO tooling, and image optimization.",
      packages: ["@philjs/islands", "@philjs/meta", "@philjs/image", "@philjs/plugin-seo"]
    },
    {
      title: "SaaS and dashboards",
      description: "Auth, forms, data pipelines, and charts for customer-facing apps.",
      packages: ["@philjs/auth", "@philjs/forms", "@philjs/db", "@philjs/charts"]
    },
    {
      title: "Commerce and payments",
      description: "SSR storefronts with performance budgets, caching, and APIs.",
      packages: ["@philjs/ssr", "@philjs/api", "@philjs/optimizer", "@philjs/payments"]
    },
    {
      title: "Realtime experiences",
      description: "Live data, multiplayer, and collaboration with reliable transport.",
      packages: ["@philjs/realtime", "@philjs/rpc", "@philjs/jobs", "@philjs/liveview"]
    }
  ];

  return html`
    <section class="use-cases" id="use-cases">
      <div class="section-header" data-animate>
        <h2>Built for real-world products</h2>
        <p>Pick a starting point and pull in the packages you need.</p>
      </div>
      <div class="use-cases-grid">
        ${cases.map(
          (item, index) => html`
            <div class="use-case-card" data-animate style="--delay: ${index * 0.05}s">
              <h3>${item.title}</h3>
              <p>${item.description}</p>
              <div class="use-case-packages">
                ${item.packages.map((pkg) => html`<span class="package-pill">${pkg}</span>`)}
              </div>
            </div>
          `
        )}
      </div>
    </section>
  `;
}
