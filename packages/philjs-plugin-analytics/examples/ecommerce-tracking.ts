/**
 * E-commerce Tracking Example (GA4 & Mixpanel)
 */

import { effect } from "@philjs/core";
import { trackEvent, trackTransaction } from "@philjs/plugin-analytics/client";
import type { EcommerceItem } from "@philjs/plugin-analytics";

// Track product view
export function trackProductView(product: {
  id: string;
  name: string;
  price: number;
  category: string;
}) {
  trackEvent("view_item", {
    item_id: product.id,
    item_name: product.name,
    price: product.price,
    item_category: product.category,
  });
}

// Track add to cart
export function trackAddToCart(product: {
  id: string;
  name: string;
  price: number;
  quantity: number;
}) {
  trackEvent("add_to_cart", {
    item_id: product.id,
    item_name: product.name,
    price: product.price,
    quantity: product.quantity,
    value: product.price * product.quantity,
  });
}

// Track remove from cart
export function trackRemoveFromCart(product: {
  id: string;
  name: string;
  price: number;
  quantity: number;
}) {
  trackEvent("remove_from_cart", {
    item_id: product.id,
    item_name: product.name,
    price: product.price,
    quantity: product.quantity,
  });
}

// Track begin checkout
export function trackBeginCheckout(items: EcommerceItem[], total: number) {
  trackEvent("begin_checkout", {
    value: total,
    currency: "USD",
    items: items,
  });
}

// Track purchase
export function trackPurchase(order: {
  orderId: string;
  total: number;
  tax: number;
  shipping: number;
  items: EcommerceItem[];
  coupon?: string;
}) {
  trackTransaction({
    transaction_id: order.orderId,
    value: order.total,
    currency: "USD",
    tax: order.tax,
    shipping: order.shipping,
    items: order.items,
    coupon: order.coupon,
  });
}

// Track refund
export function trackRefund(orderId: string, amount: number) {
  trackEvent("refund", {
    transaction_id: orderId,
    value: amount,
    currency: "USD",
  });
}

// Track search
export function trackSearch(searchTerm: string, resultCount: number) {
  trackEvent("search", {
    search_term: searchTerm,
    result_count: resultCount,
  });
}

// Example usage in a component
export function ProductPage({ product }: any) {
  // Track page view on mount
  effect(() => {
    trackProductView(product);
  });

  const handleAddToCart = () => {
    trackAddToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
  };

  return (
    <div>
      <h1>{product.name}</h1>
      <p>${product.price}</p>
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  );
}
