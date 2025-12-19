import { defineLoader } from "philjs-ssr";
import { html } from "../server/template";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export const loader = defineLoader(async () => {
  return {
    title: "Features - PhilJS"
  };
});

export default function FeaturesPage() {
  const detailedFeatures = [
    {
      category: "Reactivity",
      items: [
        {
          title: "Fine-Grained Signals",
          description: "Update only what changed with surgical precision. No virtual DOM diffing, no wasted re-renders.",
          code: `const count = signal(0);
const doubled = computed(() => count() * 2);

count.set(5); // Only doubled updates`
        },
        {
          title: "Computed Values",
          description: "Derive state automatically with memoized computed signals that track dependencies.",
          code: `const firstName = signal("John");
const lastName = signal("Doe");
const fullName = computed(() =>
  \`\${firstName()} \${lastName()}\`
);`
        },
        {
          title: "Effects",
          description: "Run side effects when signals change, with automatic dependency tracking.",
          code: `effect(() => {
  console.log("Count is:", count());
  // Automatically re-runs when count changes
});`
        }
      ]
    },
    {
      category: "Performance",
      items: [
        {
          title: "Tiny Bundle Size",
          description: "Core runtime is under 3KB gzipped. Every byte matters for fast page loads.",
          code: `// Runtime size breakdown
philjs-core:    2.8 KB
philjs-router:  1.2 KB
philjs-ssr:     2.1 KB`
        },
        {
          title: "Tree Shaking",
          description: "Only ship the code you use. Dead code elimination removes unused features.",
          code: `import { signal } from "philjs-core";
// computed, effect, etc. not included
// in final bundle if unused`
        },
        {
          title: "Zero Runtime Overhead",
          description: "No virtual DOM, no reconciliation. Direct DOM updates for maximum speed.",
          code: `// Direct DOM update
element.textContent = count();
// Not: reconcile(oldVNode, newVNode)`
        }
      ]
    },
    {
      category: "Developer Experience",
      items: [
        {
          title: "TypeScript First",
          description: "Full type inference and safety throughout your application.",
          code: `interface User {
  name: string;
  age: number;
}
const user = signal<User>({
  name: "Alice",
  age: 30
});`
        },
        {
          title: "Hot Module Replacement",
          description: "See changes instantly without losing application state.",
          code: `// Edit your components
// Changes appear immediately
// State preserved automatically`
        },
        {
          title: "DevTools",
          description: "Debug signals, inspect component trees, and monitor performance.",
          code: `import { showOverlay } from "philjs-devtools";

showOverlay(); // Enable dev panel`
        }
      ]
    }
  ];

  return html`
    <div class="page">
      ${Header({ currentPath: "/features" })}
      <main class="main-content">
        <section class="page-hero" data-animate>
          <h1>Everything You Need to Build Modern Web Apps</h1>
          <p class="lead">
            PhilJS provides a complete toolkit for building fast, reactive applications
            with fine-grained reactivity, excellent DX, and tiny bundle sizes.
          </p>
        </section>

        ${detailedFeatures.map(
          (category) => html`
            <section class="feature-category" data-animate>
              <h2 class="category-title">${category.category}</h2>
              <div class="feature-items">
                ${category.items.map(
                  (item) => html`
                    <div class="feature-detail" data-animate>
                      <h3>${item.title}</h3>
                      <p>${item.description}</p>
                      <div class="code-block">
                        <pre><code>${item.code}</code></pre>
                      </div>
                    </div>
                  `
                )}
              </div>
            </section>
          `
        )}

        <section class="cta-section" data-animate>
          <h2>Ready to Get Started?</h2>
          <p>Start building with PhilJS today and experience the difference.</p>
          <div class="cta-actions">
            <a href="/#get-started" class="btn btn-primary" data-prefetch>Get Started</a>
            <a href="/examples" class="btn btn-secondary" data-prefetch>View Examples</a>
          </div>
        </section>
      </main>
      ${Footer()}
    </div>
  `;
}
