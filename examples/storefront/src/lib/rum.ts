/**
 * Real User Monitoring (RUM) for Core Web Vitals.
 */

export type RUMMetric = {
  name: "LCP" | "INP" | "CLS" | "FCP" | "TTFB";
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  id: string;
};

/**
 * Send RUM metrics to an endpoint.
 */
export function sendRUMMetric(metric: RUMMetric, endpoint: string = "/api/metrics") {
  const body = JSON.stringify(metric);

  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, body);
  } else {
    fetch(endpoint, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true
    }).catch((err) => console.error("Failed to send RUM metric:", err));
  }
}

/**
 * Initialize RUM tracking for Core Web Vitals.
 */
export function initRUM(endpoint?: string) {
  // LCP (Largest Contentful Paint)
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1] as any;

    const metric: RUMMetric = {
      name: "LCP",
      value: lastEntry.renderTime || lastEntry.loadTime,
      rating: getRating(lastEntry.renderTime || lastEntry.loadTime, [2500, 4000]),
      delta: lastEntry.renderTime || lastEntry.loadTime,
      id: crypto.randomUUID()
    };

    sendRUMMetric(metric, endpoint);
  }).observe({ type: "largest-contentful-paint", buffered: true });

  // CLS (Cumulative Layout Shift)
  let clsValue = 0;
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as any[]) {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
      }
    }

    const metric: RUMMetric = {
      name: "CLS",
      value: clsValue,
      rating: getRating(clsValue, [0.1, 0.25]),
      delta: clsValue,
      id: crypto.randomUUID()
    };

    sendRUMMetric(metric, endpoint);
  }).observe({ type: "layout-shift", buffered: true });

  // INP (Interaction to Next Paint) - simplified
  new PerformanceObserver((list) => {
    const entries = list.getEntries() as any[];
    for (const entry of entries) {
      const metric: RUMMetric = {
        name: "INP",
        value: entry.duration,
        rating: getRating(entry.duration, [200, 500]),
        delta: entry.duration,
        id: crypto.randomUUID()
      };

      sendRUMMetric(metric, endpoint);
    }
  }).observe({ type: "first-input", buffered: true });
}

function getRating(value: number, thresholds: [number, number]): "good" | "needs-improvement" | "poor" {
  if (value <= thresholds[0]) return "good";
  if (value <= thresholds[1]) return "needs-improvement";
  return "poor";
}
