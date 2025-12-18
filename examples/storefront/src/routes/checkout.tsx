import { defineLoader, defineAction } from "philjs-ssr";
import { html } from "../server/template";
import type { Product, ShippingAddress } from "../server/mock-db";

type CartItemWithProduct = {
  productId: string;
  quantity: number;
  product: Product;
};

type LoaderData = {
  items: CartItemWithProduct[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  step: number;
};

type ActionResult = {
  success: boolean;
  orderId?: string;
  error?: string;
};

export const loader = defineLoader(async ({ db, url }) => {
  const cart = await db.cart.get("user-123");

  if (!cart || cart.items.length === 0) {
    return {
      items: [],
      subtotal: 0,
      tax: 0,
      shipping: 0,
      total: 0,
      step: 1
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
  const shipping = subtotal >= 100 ? 0 : 9.99; // Free shipping over $100
  const total = subtotal + tax + shipping;

  const step = Number(url.searchParams.get("step") ?? "1");

  return {
    items,
    subtotal,
    tax,
    shipping,
    total,
    step: Math.max(1, Math.min(3, step))
  } satisfies LoaderData;
});

export const action = defineAction<ActionResult>(async ({ formData, db }) => {
  const step = Number(formData.get("step") ?? "1");

  if (step === 3) {
    // Final step: process order
    const cart = await db.cart.get("user-123");

    if (!cart || cart.items.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    const shippingAddress: ShippingAddress = {
      fullName: String(formData.get("fullName") ?? ""),
      address: String(formData.get("address") ?? ""),
      city: String(formData.get("city") ?? ""),
      state: String(formData.get("state") ?? ""),
      zipCode: String(formData.get("zipCode") ?? ""),
      country: String(formData.get("country") ?? "USA")
    };

    const paymentMethod = String(formData.get("paymentMethod") ?? "credit-card");

    // Calculate total
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
    const tax = subtotal * 0.08;
    const shipping = subtotal >= 100 ? 0 : 9.99;
    const total = subtotal + tax + shipping;

    // Create order
    try {
      const order = await db.order.create("user-123", cart.items, total, shippingAddress, paymentMethod);

      // Clear cart
      await db.cart.clear("user-123");

      return { success: true, orderId: order.id };
    } catch (error) {
      console.error("Order creation failed", error);
      return { success: false, error: "Failed to process order" };
    }
  }

  return { success: false, error: "Invalid step" };
});

export default function Checkout({ data, actionData }: { data: LoaderData; actionData?: ActionResult | null }) {
  const { items, subtotal, tax, shipping, total, step } = data;

  // Redirect to success page if order was placed
  if (actionData?.success && actionData.orderId) {
    return html`
      <script>
        window.location.href = "/order/${actionData.orderId}";
      </script>
      <main>
        <p>Processing your order...</p>
      </main>
    `;
  }

  if (items.length === 0) {
    return html`
      <main data-page="checkout">
        <div class="empty-cart">
          <h1>Your cart is empty</h1>
          <p>Add some products to your cart before checking out.</p>
          <a href="/" class="btn btn-primary">Browse products</a>
        </div>
      </main>
    `;
  }

  return html`
    <main data-page="checkout" island="Checkout">
      <nav class="breadcrumb">
        <a href="/cart">← Back to cart</a>
      </nav>

      <h1>Checkout</h1>

      ${actionData?.error ? html`<p role="alert" class="error-message">${actionData.error}</p>` : ""}

      <div class="checkout-layout">
        <div class="checkout-steps">
          <div class="step-indicator">
            <div class="step ${step >= 1 ? "active" : ""} ${step > 1 ? "completed" : ""}">
              <span class="step-number">1</span>
              <span class="step-label">Shipping</span>
            </div>
            <div class="step ${step >= 2 ? "active" : ""} ${step > 2 ? "completed" : ""}">
              <span class="step-number">2</span>
              <span class="step-label">Payment</span>
            </div>
            <div class="step ${step >= 3 ? "active" : ""}">
              <span class="step-number">3</span>
              <span class="step-label">Review</span>
            </div>
          </div>

          <form method="post" class="checkout-form" data-checkout-form>
            ${step === 1
              ? html`
                  <fieldset class="checkout-step">
                    <legend>Shipping Information</legend>

                    <div class="form-group">
                      <label for="fullName">Full Name *</label>
                      <input type="text" id="fullName" name="fullName" required />
                    </div>

                    <div class="form-group">
                      <label for="address">Street Address *</label>
                      <input type="text" id="address" name="address" required />
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label for="city">City *</label>
                        <input type="text" id="city" name="city" required />
                      </div>

                      <div class="form-group">
                        <label for="state">State *</label>
                        <input type="text" id="state" name="state" required />
                      </div>

                      <div class="form-group">
                        <label for="zipCode">ZIP Code *</label>
                        <input type="text" id="zipCode" name="zipCode" pattern="[0-9]{5}" required />
                      </div>
                    </div>

                    <div class="form-group">
                      <label for="country">Country *</label>
                      <select id="country" name="country" required>
                        <option value="USA">United States</option>
                        <option value="CAN">Canada</option>
                      </select>
                    </div>

                    <div class="form-actions">
                      <a href="?step=2" class="btn btn-primary">Continue to payment</a>
                    </div>
                  </fieldset>
                `
              : ""}
            ${step === 2
              ? html`
                  <fieldset class="checkout-step">
                    <legend>Payment Information</legend>

                    <div class="payment-methods">
                      <label class="payment-method">
                        <input type="radio" name="paymentMethod" value="credit-card" checked />
                        <span>Credit Card</span>
                      </label>

                      <label class="payment-method">
                        <input type="radio" name="paymentMethod" value="paypal" />
                        <span>PayPal</span>
                      </label>

                      <label class="payment-method">
                        <input type="radio" name="paymentMethod" value="apple-pay" />
                        <span>Apple Pay</span>
                      </label>
                    </div>

                    <div class="credit-card-form" data-credit-card-form>
                      <div class="form-group">
                        <label for="cardNumber">Card Number *</label>
                        <input
                          type="text"
                          id="cardNumber"
                          name="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          pattern="[0-9]{13,19}"
                          required
                        />
                      </div>

                      <div class="form-row">
                        <div class="form-group">
                          <label for="expiryDate">Expiry Date *</label>
                          <input type="text" id="expiryDate" name="expiryDate" placeholder="MM/YY" required />
                        </div>

                        <div class="form-group">
                          <label for="cvv">CVV *</label>
                          <input type="text" id="cvv" name="cvv" pattern="[0-9]{3,4}" required />
                        </div>
                      </div>

                      <div class="form-group">
                        <label for="cardName">Name on Card *</label>
                        <input type="text" id="cardName" name="cardName" required />
                      </div>
                    </div>

                    <div class="form-actions">
                      <a href="?step=1" class="btn btn-secondary">Back</a>
                      <a href="?step=3" class="btn btn-primary">Review order</a>
                    </div>
                  </fieldset>
                `
              : ""}
            ${step === 3
              ? html`
                  <div class="checkout-step">
                    <h2>Review Your Order</h2>

                    <div class="review-items">
                      <h3>Items</h3>
                      ${items.map(
                        (item) =>
                          html`
                            <div class="review-item">
                              <span>${item.product.title} × ${item.quantity}</span>
                              <span>$${(item.product.price * item.quantity).toFixed(2)}</span>
                            </div>
                          `
                      )}
                    </div>

                    <input type="hidden" name="step" value="3" />
                    <input type="hidden" name="fullName" value="John Doe" />
                    <input type="hidden" name="address" value="123 Main St" />
                    <input type="hidden" name="city" value="San Francisco" />
                    <input type="hidden" name="state" value="CA" />
                    <input type="hidden" name="zipCode" value="94105" />
                    <input type="hidden" name="country" value="USA" />
                    <input type="hidden" name="paymentMethod" value="credit-card" />

                    <div class="form-actions">
                      <a href="?step=2" class="btn btn-secondary">Back</a>
                      <button type="submit" class="btn btn-primary btn-large">Place order</button>
                    </div>
                  </div>
                `
              : ""}
          </form>
        </div>

        <aside class="checkout-summary">
          <h2>Order Summary</h2>

          <div class="summary-items">
            ${items.map(
              (item) =>
                html`
                  <div class="summary-item">
                    <span>${item.product.title} × ${item.quantity}</span>
                    <span>$${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                `
            )}
          </div>

          <dl class="summary-details">
            <dt>Subtotal</dt>
            <dd>$${subtotal.toFixed(2)}</dd>

            <dt>Tax (8%)</dt>
            <dd>$${tax.toFixed(2)}</dd>

            <dt>Shipping</dt>
            <dd>${shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}</dd>

            <dt class="summary-total">Total</dt>
            <dd class="summary-total">$${total.toFixed(2)}</dd>
          </dl>
        </aside>
      </div>
    </main>
  `;
}
