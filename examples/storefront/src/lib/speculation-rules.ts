/**
 * Speculation Rules API for prefetch and prerender.
 */

export type SpeculationRule = {
  source: "list" | "document";
  urls?: string[];
  where?: Record<string, any>;
};

/**
 * Add speculation rules for prefetching and prerendering.
 */
export function addSpeculationRules(rules: {
  prefetch?: SpeculationRule[];
  prerender?: SpeculationRule[];
}) {
  if (!HTMLScriptElement.supports || !HTMLScriptElement.supports("speculationrules")) {
    console.warn("Speculation Rules API not supported");
    return;
  }

  const script = document.createElement("script");
  script.type = "speculationrules";
  script.textContent = JSON.stringify(rules);
  document.head.appendChild(script);
}

/**
 * Prefetch same-origin links on hover.
 */
export function enableHoverPrefetch() {
  addSpeculationRules({
    prefetch: [
      {
        source: "document",
        where: { selector_matches: "a[data-phil-prefetch]" }
      }
    ]
  });
}

/**
 * Prerender specific URLs.
 */
export function prerenderUrls(urls: string[]) {
  addSpeculationRules({
    prerender: [
      {
        source: "list",
        urls
      }
    ]
  });
}
