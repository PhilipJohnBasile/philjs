import { html } from "../server/template";

export function Workflow() {
  const steps = [
    {
      title: "Scaffold",
      description: "Generate a project with routing, SSR, and tooling in minutes.",
      tools: ["create-philjs", "@philjs/cli", "@philjs/templates"]
    },
    {
      title: "Build",
      description: "Compose routes, loaders, and islands with a signals-first runtime.",
      tools: ["@philjs/core", "@philjs/router", "@philjs/ssr", "@philjs/islands"]
    },
    {
      title: "Data",
      description: "Connect APIs, GraphQL, and realtime updates with type-safe utilities.",
      tools: ["@philjs/api", "@philjs/graphql", "@philjs/realtime", "@philjs/rpc"]
    },
    {
      title: "Ship",
      description: "Deploy anywhere with adapters, observability, and optimization tools.",
      tools: ["@philjs/adapters", "@philjs/optimizer", "@philjs/errors"]
    }
  ];

  return html`
    <section class="workflow" id="workflow">
      <div class="section-header" data-animate>
        <h2>From idea to production, one workflow</h2>
        <p>PhilJS keeps the stack cohesive, so you can move faster without losing control.</p>
      </div>
      <div class="workflow-steps">
        ${steps.map(
          (step, index) => html`
            <div class="workflow-card" data-animate style="--delay: ${index * 0.06}s">
              <div class="workflow-index">0${index + 1}</div>
              <h3>${step.title}</h3>
              <p>${step.description}</p>
              <div class="workflow-tools">
                ${step.tools.map((tool) => html`<span class="package-pill">${tool}</span>`)}
              </div>
            </div>
          `
        )}
      </div>
    </section>
  `;
}
