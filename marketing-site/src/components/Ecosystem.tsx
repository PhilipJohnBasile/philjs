import { html } from "../server/template";

export function Ecosystem() {
  const categories = [
    {
      title: "Core and rendering",
      description: "Signals, compiler, SSR streaming, and islands for fast delivery.",
      packages: [
        "philjs-core",
        "philjs-compiler",
        "philjs-ssr",
        "philjs-islands",
        "philjs-resumable"
      ]
    },
    {
      title: "Data and API",
      description: "Typed routes, sessions, caching, and GraphQL out of the box.",
      packages: [
        "philjs-api",
        "philjs-graphql",
        "philjs-db",
        "philjs-rpc",
        "philjs-realtime"
      ]
    },
    {
      title: "Auth and security",
      description: "Auth providers, security helpers, and audit tooling.",
      packages: [
        "philjs-auth",
        "philjs-errors",
        "philjs-plugin-seo",
        "philjs-plugin-pwa",
        "philjs-plugin-i18n"
      ]
    },
    {
      title: "UI and styling",
      description: "Components, design systems, theming, and asset pipelines.",
      packages: [
        "philjs-ui",
        "philjs-styles",
        "philjs-tailwind",
        "philjs-image",
        "philjs-meta"
      ]
    },
    {
      title: "Tooling and DX",
      description: "CLI, devtools, testing utilities, and editor integrations.",
      packages: [
        "philjs-cli",
        "create-philjs",
        "philjs-devtools",
        "philjs-testing",
        "philjs-vscode"
      ]
    },
    {
      title: "Deployment",
      description: "Adapters and integrations across edge and server runtimes.",
      packages: [
        "philjs-adapters",
        "philjs-edge",
        "philjs-actix",
        "philjs-axum",
        "philjs-rocket"
      ]
    }
  ];

  return html`
    <section class="ecosystem" id="ecosystem">
      <div class="section-header" data-animate>
        <h2>The full PhilJS ecosystem</h2>
        <p>From core runtime to production tooling, every layer is designed to work together.</p>
      </div>
      <div class="ecosystem-grid">
        ${categories.map(
          (category, index) => html`
            <div class="ecosystem-card" data-animate style="--delay: ${index * 0.05}s">
              <h3>${category.title}</h3>
              <p>${category.description}</p>
              <div class="ecosystem-packages">
                ${category.packages.map((pkg) => html`<span class="package-pill">${pkg}</span>`)}
              </div>
            </div>
          `
        )}
      </div>
      <div class="ecosystem-footer" data-animate>
        <p>PhilJS includes 88 packages across core, integrations, and tooling.</p>
        <a
          href="https://github.com/philjs/philjs/tree/main/packages"
          class="btn btn-secondary"
          target="_blank"
          rel="noopener noreferrer"
        >
          Browse packages
        </a>
      </div>
    </section>
  `;
}
