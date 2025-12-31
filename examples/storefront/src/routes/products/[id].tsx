import { defineLoader, defineAction } from "@philjs/ssr";
import { html } from "../../server/template";
import { summarizeProduct } from "../../ai/summarize";

type LoaderData = {
  product: {
    id: string;
    title: string;
    description: string;
    price: number;
  };
  related: Array<{ id: string; title: string; price: number }>;
  summary: string;
};

type ActionResult = {
  ok: boolean;
};

export const loader = defineLoader(async ({ params, db, ai }) => {
  const product = await db.product.find(params.id);
  const related = await db.product.related(params.id);

  let summary = "";
  try {
    summary = await summarizeProduct(ai, product.description);
  } catch (error) {
    console.warn("AI summary failed", error);
    summary = "AI summary temporarily unavailable.";
  }

  return { product, related, summary } satisfies LoaderData;
});

export const action = defineAction<ActionResult>(async ({ formData, db }) => {
  const productId = String(formData.get("productId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1) || 1;

  await db.cart.add("user-123", productId, quantity);

  return { ok: true };
});

export default function Product({ data, actionData }: { data: LoaderData; actionData?: ActionResult | null }) {
  const { product, related, summary } = data;
  const actionMessage = actionData?.ok ? html`<p role="status" class="note">Added to cart. We will email you a receipt.</p>` : "";

  return html`
    <main data-page="product" data-product-id="${product.id}">
      <nav><a href="/">← Back to storefront</a></nav>

      <article class="product-detail">
        <h1>${product.title}</h1>
        <p class="lead">${product.description}</p>

        <section class="ai-summary" data-ai-summary>
          <h2>AI tl;dr</h2>
          <p>${summary}</p>
        </section>

        <form method="post" data-phil-product>
          <input type="hidden" name="productId" value="${product.id}" />
          <label>
            Quantity
            <input type="number" name="quantity" min="1" value="1" data-phil-qty />
          </label>
          <p class="price">
            Total: $<span data-phil-total data-price="${product.price}">${product.price.toFixed(2)}</span>
          </p>
          <button type="submit">Add to cart</button>
          ${actionMessage}
        </form>

        <aside island="Related" data-related>
          <h2>Related products</h2>
          <ul data-related-list>
            ${related.map((item) =>
              html`<li>
                <a href="/products/${item.id}" data-phil-prefetch>
                  ${item.title} · $${item.price.toFixed(2)}
                </a>
              </li>`
            )}
          </ul>
        </aside>
      </article>
    </main>
  `;
}
