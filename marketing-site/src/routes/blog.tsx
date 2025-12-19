import { defineLoader } from "philjs-ssr";
import { html } from "../server/template";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export const loader = defineLoader(async () => {
  return {
    title: "Blog - PhilJS"
  };
});

export default function BlogPage() {
  const posts = [
    {
      title: "Introducing PhilJS 1.0",
      date: "2025-01-15",
      author: "Phil Dev Team",
      excerpt: "After months of development and community feedback, we're excited to announce PhilJS 1.0. Learn about the journey and what's new.",
      tags: ["Release", "Announcement"],
      slug: "introducing-philjs-1-0"
    },
    {
      title: "Understanding Fine-Grained Reactivity",
      date: "2025-01-10",
      author: "Sarah Chen",
      excerpt: "Dive deep into how PhilJS signals work under the hood and why fine-grained reactivity matters for performance.",
      tags: ["Technical", "Reactivity"],
      slug: "understanding-fine-grained-reactivity"
    },
    {
      title: "Building a Real-Time Dashboard with PhilJS",
      date: "2025-01-05",
      author: "Michael Rodriguez",
      excerpt: "Step-by-step guide to building a production-ready analytics dashboard with real-time updates and chart visualizations.",
      tags: ["Tutorial", "Real-time"],
      slug: "building-realtime-dashboard"
    },
    {
      title: "Islands Architecture: Ship Less JavaScript",
      date: "2024-12-28",
      author: "Emma Johnson",
      excerpt: "Learn how to use PhilJS islands to progressively enhance your pages and ship zero JavaScript by default.",
      tags: ["Tutorial", "Performance"],
      slug: "islands-architecture"
    },
    {
      title: "Migrating from React to PhilJS",
      date: "2024-12-20",
      author: "David Park",
      excerpt: "A practical guide to migrating your React application to PhilJS, including common patterns and gotchas.",
      tags: ["Migration", "Tutorial"],
      slug: "migrating-from-react"
    },
    {
      title: "PhilJS vs Other Frameworks",
      date: "2024-12-15",
      author: "Phil Dev Team",
      excerpt: "An honest comparison of PhilJS with React, Vue, Svelte, and Solid. When should you choose PhilJS?",
      tags: ["Comparison", "Technical"],
      slug: "philjs-vs-other-frameworks"
    }
  ];

  return html`
    <div class="page">
      ${Header({ currentPath: "/blog" })}
      <main class="main-content">
        <section class="page-hero" data-animate>
          <h1>PhilJS Blog</h1>
          <p class="lead">
            News, tutorials, and insights from the PhilJS team and community.
          </p>
        </section>

        <section class="blog-grid">
          ${posts.map(
            (post) => html`
              <article class="blog-card" data-animate>
                <div class="blog-meta">
                  <time datetime="${post.date}">${new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</time>
                  <span class="blog-author">by ${post.author}</span>
                </div>
                <h2 class="blog-title">
                  <a href="/blog/${post.slug}" data-prefetch>${post.title}</a>
                </h2>
                <p class="blog-excerpt">${post.excerpt}</p>
                <div class="blog-tags">
                  ${post.tags.map((tag) => html`<span class="tag">${tag}</span>`)}
                </div>
                <a href="/blog/${post.slug}" class="blog-read-more" data-prefetch>
                  Read more →
                </a>
              </article>
            `
          )}
        </section>

        <section class="newsletter-section" data-animate>
          <div class="newsletter-content">
            <h2>Stay Updated</h2>
            <p>Get the latest PhilJS news, tutorials, and releases delivered to your inbox.</p>
            <form class="newsletter-form" action="https://philjs.dev/subscribe" method="post">
              <input
                type="email"
                name="email"
                placeholder="your@email.com"
                required
                class="newsletter-input"
              />
              <button type="submit" class="btn btn-primary">Subscribe</button>
            </form>
          </div>
        </section>
      </main>
      ${Footer()}
    </div>
  `;
}
