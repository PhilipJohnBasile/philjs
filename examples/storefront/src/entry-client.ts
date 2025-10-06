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
