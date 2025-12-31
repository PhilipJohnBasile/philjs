import { html } from "../server/template";

export function Features() {
  const features = [
    {
      label: "Signals",
      title: "Fine-grained reactivity that scales",
      description:
        "Signals, memos, and effects update only what changed. No virtual DOM diffing, no unnecessary work.",
      packages: ["@philjs/core", "@philjs/compiler"]
    },
    {
      label: "Routing",
      title: "Routing, loaders, and actions",
      description:
        "File-based routing with data loading, actions, and type-safe params built in.",
      packages: ["@philjs/router", "@philjs/router-typesafe", "@philjs/ssr"]
    },
    {
      label: "Rendering",
      title: "SSR, islands, and resumability",
      description:
        "Stream HTML fast, hydrate only where needed, and resume state without heavy client boot.",
      packages: ["@philjs/ssr", "@philjs/islands", "@philjs/resumable"]
    },
    {
      label: "Data",
      title: "Data, APIs, and GraphQL",
      description:
        "Typed API routes, session utilities, and a built-in GraphQL client with caching.",
      packages: ["@philjs/api", "@philjs/graphql", "@philjs/db"]
    },
    {
      label: "Security",
      title: "Auth, sessions, and protection",
      description:
        "First-party auth flows, CSRF protection, and security headers for production apps.",
      packages: ["@philjs/auth", "@philjs/api", "@philjs/errors"]
    },
    {
      label: "Tooling",
      title: "Developer experience and testing",
      description:
        "CLI generators, devtools, testing utilities, and editor support for fast iteration.",
      packages: ["@philjs/cli", "@philjs/devtools", "@philjs/testing"]
    }
  ];

  return html`
    <section class="features" id="features">
      <div class="section-header" data-animate>
        <h2>Everything you need, already integrated</h2>
        <p>PhilJS ships with a cohesive stack so you can build fast, secure, and scalable apps without assembling a toolchain from scratch.</p>
      </div>
      <div class="features-grid">
        ${features.map(
          (feature, index) => html`
            <div class="feature-card" data-animate style="--delay: ${index * 0.06}s">
              <div class="feature-label">${feature.label}</div>
              <h3>${feature.title}</h3>
              <p>${feature.description}</p>
              <div class="feature-tags">
                ${feature.packages.map((pkg) => html`<span class="package-pill">${pkg}</span>`)}
              </div>
            </div>
          `
        )}
      </div>
    </section>
  `;
}
