/**
 * Developer tools for PhilJS.
 * Shows hydration map, performance budgets, and AI cost panel.
 */

// Time-Travel Debugging
export {
  TimeTravelDebugger,
  initTimeTravel,
  getTimeTravelDebugger,
  debugSignal,
  diffState,
} from "./time-travel.js";
export type {
  StateSnapshot,
  TimelineNode,
  TimeTravelConfig,
  DiffType,
  StateDiff,
} from "./time-travel.js";

/**
 * Show the developer overlay.
 */
export function showOverlay() {
  // Only show in development
  if (typeof window !== 'undefined' && (window as any).__PHILJS_PROD__) return;

  const overlay = document.createElement("div");
  overlay.id = "philjs-devtools";
  overlay.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.9);
    color: #fff;
    padding: 16px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    z-index: 999999;
    max-width: 400px;
  `;

  overlay.innerHTML = `
    <h3 style="margin: 0 0 12px 0; font-size: 14px;">PhilJS DevTools</h3>
    <div id="philjs-devtools-content">
      <div>Islands: <span id="island-count">0</span></div>
      <div>Hydrated: <span id="hydrated-count">0</span></div>
      <div>Bundle size: <span id="bundle-size">--</span> KB</div>
      <div>AI calls: <span id="ai-calls">0</span></div>
      <div>AI cost: $<span id="ai-cost">0.00</span></div>
      <div>Route: <span id="route-path">/</span></div>
      <pre id="route-params" style="margin-top: 8px; white-space: pre-wrap; color: #a5b4fc; max-height: 80px; overflow: auto;"></pre>
      <pre id="route-error" style="margin-top: 8px; white-space: pre-wrap; color: #fca5a5; max-height: 80px; overflow: auto;"></pre>
    </div>
    <button id="close-devtools" style="margin-top: 8px; cursor: pointer;">Close</button>
  `;

  document.body.appendChild(overlay);

  // Update stats
  updateStats();

  // Close button
  document.getElementById("close-devtools")?.addEventListener("click", () => {
    overlay.remove();
  });
}

function updateStats() {
  const islands = document.querySelectorAll("[island]");
  const hydrated = document.querySelectorAll("[island][data-hydrated]");

  const islandCount = document.getElementById("island-count");
  const hydratedCount = document.getElementById("hydrated-count");
  const routePath = document.getElementById("route-path");
  const routeParams = document.getElementById("route-params");
  const routeError = document.getElementById("route-error");

  if (islandCount) islandCount.textContent = String(islands.length);
  if (hydratedCount) hydratedCount.textContent = String(hydrated.length);
  if (routePath && routeParams && routeError) {
    const info = (window as any).__PHILJS_ROUTE_INFO__?.current;
    routePath.textContent = info?.path ?? "(unknown)";
    routeParams.textContent = info?.params ? JSON.stringify(info.params, null, 2) : "{}";
    routeError.textContent = info?.error ? JSON.stringify(info.error, null, 2) : "";
  }

  // Re-check every second
  setTimeout(updateStats, 1000);
}
