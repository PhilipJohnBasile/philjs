import { defineLoader } from "@philjs/ssr";
import { html } from "../server/template";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { blogPosts } from "../data/blog";

export const loader = defineLoader(async () => {
  return {
    title: "Blog - PhilJS",
    description: "News, tutorials, and ecosystem deep dives from the PhilJS team."
  };
});

export default function BlogPage() {
  const posts = blogPosts;

  return html`
    <div class="page">
      ${Header({ currentPath: "/blog" })}
      <main class="main-content">
        <section class="page-hero" data-animate>
          <h1>PhilJS Blog</h1>
          <p class="lead">
            News, tutorials, and ecosystem deep dives from the PhilJS team and community.
          </p>
        </section>

        <section class="blog-grid">
          ${posts.map(
            (post, index) => html`
              <article class="blog-card" data-animate style="--delay: ${index * 0.04}s">
                <div class="blog-meta">
                  <time datetime="${post.date}">${new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</time>
                  <span class="blog-author">by ${post.author}</span>
                  <span class="blog-read-time">${post.readingTime}</span>
                </div>
                <h2 class="blog-title">
                  <a href="/blog/${post.slug}" data-prefetch>${post.title}</a>
                </h2>
                <p class="blog-excerpt">${post.excerpt}</p>
                <div class="blog-tags">
                  ${post.tags.map((tag) => html`<span class="tag">${tag}</span>`)}
                </div>
                <a href="/blog/${post.slug}" class="blog-read-more" data-prefetch>
                  Read more ->
                </a>
              </article>
            `
          )}
        </section>

        <section class="newsletter-section" data-animate>
          <div class="newsletter-content">
            <h2>Stay updated</h2>
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
