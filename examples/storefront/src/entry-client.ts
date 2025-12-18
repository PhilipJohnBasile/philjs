import { signal } from "philjs-core";
import { mountIslands } from "philjs-islands";
import { showOverlay } from "philjs-devtools";
import { enableViewTransitions } from "./lib/view-transitions";
import { enableHoverPrefetch } from "./lib/speculation-rules";
import { initRUM } from "./lib/rum";

declare global {
  interface Window {
    __PHIL_STATE__?: string;
  }
}

type PhilState = {
  data?: any;
  actionData?: any;
  params?: Record<string, string>;
};

function readState(): PhilState {
  try {
    if (!window.__PHIL_STATE__) return {};
    return deserialize(window.__PHIL_STATE__);
  } catch (error) {
    console.warn("Failed to parse PhilJS state", error);
    return {};
  }
}

function deserialize(b64: string) {
  if (typeof atob === "function") {
    return JSON.parse(atob(b64));
  }

  if (typeof Buffer !== "undefined") {
    return JSON.parse(Buffer.from(b64, "base64").toString());
  }

  throw new Error("deserialize: base64 decoding not supported in this environment");
}

function enhanceProductForm() {
  const form = document.querySelector<HTMLFormElement>("[data-phil-product]");
  if (!form) return;

  const qtyInput = form.querySelector<HTMLInputElement>("[data-phil-qty]");
  const totalEl = form.querySelector<HTMLElement>("[data-phil-total]");
  const basePrice = Number(totalEl?.dataset.price ?? "0");

  if (!qtyInput || !totalEl || Number.isNaN(basePrice)) return;

  const qty = signal(Math.max(1, Number(qtyInput.value) || 1));

  const updateTotal = (value: number) => {
    totalEl.textContent = (basePrice * value).toFixed(2);
  };

  qty.subscribe(updateTotal);
  updateTotal(qty());

  qtyInput.addEventListener("input", (event) => {
    const next = Math.max(1, Number((event.target as HTMLInputElement).value) || 1);
    qty.set(next);
  });

  form.addEventListener("submit", () => {
    form.dataset.submitting = "true";
  });
}

function enhanceCartPage() {
  const cartItems = document.querySelectorAll<HTMLElement>("[data-cart-item]");
  if (cartItems.length === 0) return;

  const subtotalEl = document.querySelector<HTMLElement>("[data-subtotal]");
  const taxEl = document.querySelector<HTMLElement>("[data-tax]");
  const totalEl = document.querySelector<HTMLElement>("[data-total]");

  if (!subtotalEl || !taxEl || !totalEl) return;

  const itemTotals = new Map<string, ReturnType<typeof signal>>();

  cartItems.forEach((item) => {
    const itemId = item.dataset.cartItem ?? "";
    const qtyInput = item.querySelector<HTMLInputElement>("[data-cart-qty]");
    const itemTotalEl = item.querySelector<HTMLElement>("[data-item-total]");
    const basePrice = Number(qtyInput?.dataset.price ?? "0");
    const initialQty = Number(qtyInput?.value ?? "1");

    if (!qtyInput || !itemTotalEl || Number.isNaN(basePrice)) return;

    const qty = signal(initialQty);
    itemTotals.set(itemId, qty);

    const updateItemTotal = (value: number) => {
      itemTotalEl.textContent = `$${(basePrice * value).toFixed(2)}`;
      updateCartSummary();
    };

    qty.subscribe(updateItemTotal);
    updateItemTotal(qty());

    qtyInput.addEventListener("input", (event) => {
      const next = Math.max(1, Number((event.target as HTMLInputElement).value) || 1);
      qty.set(next);
    });
  });

  function updateCartSummary() {
    let subtotal = 0;
    cartItems.forEach((item) => {
      const itemTotalEl = item.querySelector<HTMLElement>("[data-item-total]");
      const price = Number(itemTotalEl?.dataset.price ?? "0");
      const qty = Number(itemTotalEl?.dataset.quantity ?? "1");
      subtotal += price * qty;
    });

    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    taxEl.textContent = `$${tax.toFixed(2)}`;
    totalEl.textContent = `$${total.toFixed(2)}`;
  }

  // Handle dynamic cart updates via forms
  const updateForms = document.querySelectorAll<HTMLFormElement>("[data-cart-update-form]");
  updateForms.forEach((form) => {
    form.addEventListener("submit", () => {
      form.dataset.submitting = "true";
    });
  });
}

function enhanceCheckoutPage() {
  const checkoutForm = document.querySelector<HTMLFormElement>("[data-checkout-form]");
  if (!checkoutForm) return;

  // Add form validation feedback
  checkoutForm.addEventListener("submit", (event) => {
    const requiredFields = checkoutForm.querySelectorAll<HTMLInputElement>("[required]");
    let isValid = true;

    requiredFields.forEach((field) => {
      if (!field.value.trim()) {
        isValid = false;
        field.classList.add("error");
      } else {
        field.classList.remove("error");
      }
    });

    if (!isValid) {
      event.preventDefault();
      alert("Please fill in all required fields.");
    }
  });

  // Payment method switching
  const paymentRadios = checkoutForm.querySelectorAll<HTMLInputElement>('input[name="paymentMethod"]');
  const creditCardForm = checkoutForm.querySelector<HTMLElement>("[data-credit-card-form]");

  if (creditCardForm) {
    paymentRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        if (radio.value === "credit-card") {
          creditCardForm.style.display = "block";
        } else {
          creditCardForm.style.display = "none";
        }
      });
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const state = readState();
  void state; // Placeholder for future resumability hooks.

  mountIslands();
  enhanceProductForm();

  enableViewTransitions();
  enableHoverPrefetch();
  initRUM("/api/metrics");

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }

  if (import.meta.env.DEV) {
    showOverlay();
  }
});
