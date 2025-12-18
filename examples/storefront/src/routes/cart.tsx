import { defineLoader, defineAction } from "philjs-ssr";
import { html } from "../server/template";
import type { Product, Cart } from "../server/mock-db";

type CartItemWithProduct = {
  productId: string;
  quantity: number;
  product: Product;
};

type LoaderData = {
  cart: Cart | null;
  items: CartItemWithProduct[];
  subtotal: number;
  tax: number;
  total: number;
};

type ActionResult = {
  success: boolean;
  action: "update" | "remove" | "clear";
};

export const loader = defineLoader(async ({ db }) => {
  const cart = await db.cart.get("user-123");

  if (!cart || cart.items.length === 0) {
    return {
      cart: null,
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0
    } satisfies LoaderData;
  }

  // Enrich cart items with product details
  const items: CartItemWithProduct[] = [];
  for (const item of cart.items) {
    try {
      const product = await db.product.find(item.productId);
      items.push({
        productId: item.productId,
        quantity: item.quantity,
        product
      });
    } catch (error) {
      console.error(`Failed to load product ${item.productId}`, error);
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  return {
    cart,
    items,
    subtotal,
    tax,
    total
  } satisfies LoaderData;
});

export const action = defineAction<ActionResult>(async ({ formData, db }) => {
  const actionType = String(formData.get("action") ?? "");
  const productId = String(formData.get("productId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);

  if (actionType === "update" && productId) {
    await db.cart.update("user-123", productId, quantity);
    return { success: true, action: "update" };
  }

  if (actionType === "remove" && productId) {
    await db.cart.remove("user-123", productId);
    return { success: true, action: "remove" };
  }

  if (actionType === "clear") {
    await db.cart.clear("user-123");
    return { success: true, action: "clear" };
  }

  return { success: false, action: actionType as any };
});

export default function Cart({ data, actionData }: { data: LoaderData; actionData?: ActionResult | null }) {
  const { items, subtotal, tax, total } = data;

  return html`
    <main data-page="cart">
      <nav class="breadcrumb">
        <a href="/">← Continue shopping</a>
      </nav>

      <h1>Shopping Cart</h1>

      ${actionData?.success
        ? html`<p role="status" class="success-message">Cart updated successfully!</p>`
        : ""}

      ${items.length === 0
        ? html`
            <div class="empty-cart">
              <p>Your cart is empty.</p>
              <a href="/" class="btn btn-primary">Browse products</a>
            </div>
          `
        : html`
            <div class="cart-layout">
              <div class="cart-items" island="CartItems">
                ${items.map(
                  (item) =>
                    html`
                      <article class="cart-item" data-cart-item="${item.productId}">
                        <div class="cart-item-info">
                          <h3>
                            <a href="/products/${item.productId}">${item.product.title}</a>
                          </h3>
                          <p class="cart-item-category">${item.product.category}</p>
                          <p class="cart-item-price">$${item.product.price.toFixed(2)} each</p>
                        </div>

                        <div class="cart-item-actions">
                          <form method="post" class="cart-item-quantity" data-cart-update-form>
                            <input type="hidden" name="action" value="update" />
                            <input type="hidden" name="productId" value="${item.productId}" />
                            <label for="qty-${item.productId}">Quantity:</label>
                            <input
                              type="number"
                              id="qty-${item.productId}"
                              name="quantity"
                              min="1"
                              max="${item.product.stock}"
                              value="${item.quantity}"
                              data-cart-qty
                              data-price="${item.product.price}"
                            />
                            <button type="submit" class="btn-small">Update</button>
                          </form>

                          <form method="post" class="cart-item-remove">
                            <input type="hidden" name="action" value="remove" />
                            <input type="hidden" name="productId" value="${item.productId}" />
                            <button type="submit" class="btn-link">Remove</button>
                          </form>
                        </div>

                        <div class="cart-item-total">
                          <strong data-item-total data-price="${item.product.price}" data-quantity="${item.quantity}">
                            $${(item.product.price * item.quantity).toFixed(2)}
                          </strong>
                        </div>
                      </article>
                    `
                )}

                <div class="cart-actions">
                  <form method="post">
                    <input type="hidden" name="action" value="clear" />
                    <button type="submit" class="btn btn-secondary">Clear cart</button>
                  </form>
                </div>
              </div>

              <aside class="cart-summary">
                <h2>Order Summary</h2>

                <dl class="summary-details">
                  <dt>Subtotal</dt>
                  <dd data-subtotal>$${subtotal.toFixed(2)}</dd>

                  <dt>Tax (8%)</dt>
                  <dd data-tax>$${tax.toFixed(2)}</dd>

                  <dt class="summary-total">Total</dt>
                  <dd class="summary-total" data-total>$${total.toFixed(2)}</dd>
                </dl>

                <a href="/checkout" class="btn btn-primary btn-block">Proceed to checkout</a>

                <p class="shipping-note">Free shipping on orders over $100</p>
              </aside>
            </div>
          `}
    </main>
  `;
}
