import { html } from "../server/template";

export function Features() {
  const features = [
    {
      icon: "⚡",
      title: "Fine-Grained Reactivity",
      description: "Signals-based reactivity system that only updates what changed. No virtual DOM diffing, no unnecessary re-renders."
    },
    {
      icon: "🎯",
      title: "TypeScript-First",
      description: "Built from the ground up with TypeScript. Get full type safety and autocompletion for your entire application."
    },
    {
      icon: "🚀",
      title: "Server-Side Rendering",
      description: "Stream HTML to users instantly with our SSR system. Support for streaming, resumability, and progressive enhancement."
    },
    {
      icon: "🏝️",
      title: "Islands Architecture",
      description: "Ship zero JavaScript by default. Hydrate only the interactive parts of your page with islands."
    },
    {
      icon: "📦",
      title: "Tiny Bundle Size",
      description: "Core runtime is under 3KB gzipped. Tree-shakeable modules mean you only ship what you use."
    },
    {
      icon: "🔧",
      title: "Developer Experience",
      description: "Hot module replacement, devtools extension, detailed error messages, and excellent documentation."
    },
    {
      icon: "⚙️",
      title: "Web Standards",
      description: "Built on web standards like Fetch API, Web Streams, and FormData. Works seamlessly with the platform."
    },
    {
      icon: "🎨",
      title: "Styling Freedom",
      description: "Use CSS, CSS Modules, Tailwind, CSS-in-JS, or any styling solution. PhilJS doesn't impose constraints."
    },
    {
      icon: "🔌",
      title: "Rich Ecosystem",
      description: "Router, SSR, islands, GraphQL, AI integration, and more. Everything you need to build production apps."
    }
  ];

  return html`
    <section class="features" id="features">
      <div class="section-header" data-animate>
        <h2>Why Choose PhilJS?</h2>
        <p>Everything you need to build modern web applications, without the bloat.</p>
      </div>
      <div class="features-grid">
        ${features.map(
          (feature) => html`
            <div class="feature-card" data-animate>
              <div class="feature-icon">${feature.icon}</div>
              <h3>${feature.title}</h3>
              <p>${feature.description}</p>
            </div>
          `
        )}
      </div>
    </section>
  `;
}
