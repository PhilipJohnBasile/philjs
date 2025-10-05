/**
 * Islands architecture for selective hydration.
 */

/**
 * Mount islands marked with the [island] attribute.
 * Loads component chunks on visibility or interaction.
 * @param {HTMLElement} root - Root element to search for islands
 */
export function mountIslands(root = document.body) {
  const islands = root.querySelectorAll("[island]");

  islands.forEach(el => {
    const componentName = el.getAttribute("island");

    // Use IntersectionObserver for lazy loading
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // In a real implementation, this would dynamically import the component
          // For now, just mark as hydrated
          el.setAttribute("data-hydrated", "true");
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
    element.setAttribute("data-hydrated", "true");
  }
}
