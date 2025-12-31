import { defineLoader } from "@philjs/ssr";
import { html } from "../../server/template";
import type { Order } from "../../server/mock-db";

type LoaderData = {
  order: Order | null;
};

export const loader = defineLoader(async ({ params, db }) => {
  const order = await db.order.get(params.id);

  return {
    order
  } satisfies LoaderData;
});

export default function OrderConfirmation({ data }: { data: LoaderData }) {
  const { order } = data;

  if (!order) {
    return html`
      <main data-page="order-not-found">
        <div class="error-container">
          <h1>Order Not Found</h1>
          <p>We couldn't find an order with this ID.</p>
          <a href="/" class="btn btn-primary">Return to home</a>
        </div>
      </main>
    `;
  }

  const statusMessage = {
    pending: "Your order is being processed.",
    processing: "Your order is being prepared for shipment.",
    completed: "Your order has been completed!",
    failed: "There was an issue with your order."
  };

  return html`
    <main data-page="order-confirmation">
      <div class="order-success">
        <div class="success-icon">&#10003;</div>
        <h1>Order Confirmed!</h1>
        <p class="order-number">Order #${order.id}</p>
        <p class="order-status">${statusMessage[order.status]}</p>
      </div>

      <div class="order-details">
        <section class="order-section">
          <h2>Order Information</h2>
          <dl>
            <dt>Order ID:</dt>
            <dd>${order.id}</dd>

            <dt>Status:</dt>
            <dd class="status-${order.status}">${order.status}</dd>

            <dt>Date:</dt>
            <dd>${new Date(order.createdAt).toLocaleDateString()}</dd>

            <dt>Total:</dt>
            <dd class="order-total">$${order.total.toFixed(2)}</dd>
          </dl>
        </section>

        <section class="order-section">
          <h2>Items Ordered</h2>
          <div class="order-items">
            ${order.items.map(
              (item) =>
                html`
                  <div class="order-item">
                    <div class="order-item-info">
                      <h3>${item.title}</h3>
                      <p>Quantity: ${item.quantity}</p>
                    </div>
                    <div class="order-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                `
            )}
          </div>
        </section>

        ${order.shippingAddress
          ? html`
              <section class="order-section">
                <h2>Shipping Address</h2>
                <address>
                  ${order.shippingAddress.fullName}<br />
                  ${order.shippingAddress.address}<br />
                  ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br />
                  ${order.shippingAddress.country}
                </address>
              </section>
            `
          : ""}
        ${order.paymentMethod
          ? html`
              <section class="order-section">
                <h2>Payment Method</h2>
                <p>${order.paymentMethod === "credit-card" ? "Credit Card" : order.paymentMethod}</p>
              </section>
            `
          : ""}
      </div>

      <div class="order-actions">
        <a href="/" class="btn btn-primary">Continue shopping</a>
      </div>

      <div class="order-message">
        <p>Thank you for your order! A confirmation email has been sent to your email address.</p>
        <p>You can track your order status on this page.</p>
      </div>
    </main>
  `;
}
