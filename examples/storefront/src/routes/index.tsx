import { defineLoader } from "philjs-ssr";
import { html } from "../server/template";

export const loader = defineLoader(async ({ db }) => {
  const featured = await db.product.all();
  return { featured };
});

export default function Home({ data }: { data: { featured: Array<{ id: string; title: string; price: number }> } }) {
  return html`
    <main>
      <header>
        <h1>PhilJS Storefront</h1>
        <p>Fast by default, HTML first, batteries included.</p>
        <p>Streaming SSR with islands and AI assisted experiences.</p>
      </header>

      <section>
        <h2>Featured Products</h2>
        <div class="product-grid">
          ${data.featured.map((product) =>
            html`
              <article class="product-card">
                <div>
                  <h3>${product.title}</h3>
                  <p style="font-size:1.25rem;font-weight:600;">$${product.price.toFixed(2)}</p>
                </div>
                <a href="/products/${product.id}" data-phil-prefetch>
                  View details
                </a>
              </article>
            `
          )}
        </div>
      </section>
    </main>
  `;
}
