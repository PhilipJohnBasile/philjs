import { html } from "../server/template";

export function Comparison() {
  const metrics = [
    {
      value: "~3.3 KB",
      label: "Core runtime",
      detail: "Signals runtime with JSX rendering"
    },
    {
      value: "~25 KB",
      label: "Full stack",
      detail: "Router, SSR, islands, and data layer"
    },
    {
      value: "2.5 ms",
      label: "100k updates",
      detail: "Signal update baseline"
    },
    {
      value: "13.12 ms",
      label: "SSR 10k nodes",
      detail: "Streaming render baseline"
    }
  ];

  const layers = [
    {
      title: "Routing and navigation",
      description: "Typed routes, loaders, and actions with file-based conventions.",
      packages: ["philjs-router", "philjs-router-typesafe"]
    },
    {
      title: "Rendering and islands",
      description: "SSR streaming, resumability, and selective hydration.",
      packages: ["philjs-ssr", "philjs-islands", "philjs-resumable"]
    },
    {
      title: "Data and APIs",
      description: "Typed API routes, GraphQL, and realtime messaging.",
      packages: ["philjs-api", "philjs-graphql", "philjs-realtime"]
    }
  ];

  return html`
    <section class="comparison" id="performance">
      <div class="section-header" data-animate>
        <h2>Performance and architecture</h2>
        <p>PhilJS stays fast by design, with a runtime built for minimal overhead.</p>
      </div>
      <div class="metrics-grid">
        ${metrics.map(
          (metric, index) => html`
            <div class="metric-card" data-animate style="--delay: ${index * 0.05}s">
              <div class="metric-value">${metric.value}</div>
              <div class="metric-label">${metric.label}</div>
              <p>${metric.detail}</p>
            </div>
          `
        )}
      </div>
      <div class="architecture-grid">
        ${layers.map(
          (layer, index) => html`
            <div class="architecture-card" data-animate style="--delay: ${index * 0.06}s">
              <h3>${layer.title}</h3>
              <p>${layer.description}</p>
              <div class="architecture-packages">
                ${layer.packages.map((pkg) => html`<span class="package-pill">${pkg}</span>`)}
              </div>
            </div>
          `
        )}
      </div>
      <div class="performance-notes" data-animate>
        <p>
          Benchmarks are drawn from PhilJS baseline tests in the repo.
          <a href="https://docs.philjs.dev/performance" target="_blank" rel="noopener noreferrer">View the performance docs</a>
          for methodology and updates.
        </p>
      </div>
    </section>
  `;
}
