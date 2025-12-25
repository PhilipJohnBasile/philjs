import { defineLoader } from "philjs-ssr";
import { html } from "../server/template";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { blogPosts, type BlogPost } from "../data/blog";

export const loader = defineLoader(async ({ params }) => {
  const post = blogPosts.find((item) => item.slug === params.slug) ?? null;

  if (!post) {
    return {
      title: "Post Not Found - PhilJS",
      description: "The requested blog post could not be found.",
      post: null
    };
  }

  return {
    title: `${post.title} - PhilJS`,
    description: post.excerpt,
    post
  };
});

export default function BlogPostPage({ data }: { data: { post: BlogPost | null } }) {
  const post = data?.post ?? null;

  if (!post) {
    return html`
      <div class="page">
        ${Header({ currentPath: "/blog" })}
        <main class="main-content">
          <section class="page-hero" data-animate>
            <h1>Post not found</h1>
            <p class="lead">We could not find the article you are looking for.</p>
            <div class="cta-actions">
              <a href="/blog" class="btn btn-primary" data-prefetch>Back to Blog</a>
              <a href="/" class="btn btn-secondary" data-prefetch>Go Home</a>
            </div>
          </section>
        </main>
        ${Footer()}
      </div>
    `;
  }

  return html`
    <div class="page">
      ${Header({ currentPath: "/blog" })}
      <main class="main-content">
        <section class="post-hero" data-animate>
          <a href="/blog" class="back-link" data-prefetch>Back to Blog</a>
          <h1>${post.title}</h1>
          <div class="post-meta">
            <time datetime="${post.date}">${new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</time>
            <span>by ${post.author}</span>
            <span>${post.readingTime}</span>
          </div>
          <p class="lead">${post.excerpt}</p>
        </section>

        <section class="post-body" data-animate>
          ${post.body.map((paragraph) => html`<p>${paragraph}</p>`)}
          <div class="post-highlights">
            <h3>Key takeaways</h3>
            <ul>
              ${post.highlights.map((item) => html`<li>${item}</li>`)}
            </ul>
          </div>
        </section>

        <section class="cta-section" data-animate>
          <h2>Explore the PhilJS ecosystem</h2>
          <p>Learn more about the packages and tools that power modern PhilJS apps.</p>
          <div class="cta-actions">
            <a href="/#ecosystem" class="btn btn-primary" data-prefetch>Browse Ecosystem</a>
            <a href="https://docs.philjs.dev" class="btn btn-secondary" target="_blank" rel="noopener noreferrer">View Docs</a>
          </div>
        </section>
      </main>
      ${Footer()}
    </div>
  `;
}
