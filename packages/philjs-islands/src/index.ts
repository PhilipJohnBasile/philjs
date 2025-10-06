/**
 * Islands architecture for selective hydration.
 */

export { registerIsland, loadIsland, initIslands, Island } from "./island-loader.js";
export type { IslandModule, IslandManifest } from "./island-loader.js";

/**
 * Mount islands marked with the [island] attribute.
 * Loads component chunks on visibility or interaction.
 * @param {HTMLElement} root - Root element to search for islands
 */
export function mountIslands(root = document.body) {
  const islands = root.querySelectorAll("[island]");

  islands.forEach((el) => {
    const componentName = el.getAttribute("island") ?? "anonymous";

    const hydrate = () => {
      if (el.hasAttribute("data-hydrated")) return;
      el.setAttribute("data-hydrated", "true");
      el.dispatchEvent(
        new CustomEvent("phil:island-hydrated", {
          bubbles: false,
          detail: { name: componentName, element: el }
        })
      );
    };

    if (!("IntersectionObserver" in window)) {
      hydrate();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          hydrate();
          observer.disconnect();
        }
      });
    });

    observer.observe(el);
  });
}

/**
 * Hydrate a specific island immediately.
 * @param {HTMLElement} element - Island element to hydrate
 */
export function hydrateIsland(element) {
  const componentName = element.getAttribute("island");
  if (componentName) {
    if (!element.hasAttribute("data-hydrated")) {
      element.setAttribute("data-hydrated", "true");
      element.dispatchEvent(
        new CustomEvent("phil:island-hydrated", {
          bubbles: false,
          detail: { name: componentName, element }
        })
      );
    }
  }
}
