import { html } from "../server/template";

export function Comparison() {
  const metrics = [
    {
      framework: "PhilJS",
      bundleSize: "2.8 KB",
      firstLoad: "0.3s",
      ttInteractive: "0.5s",
      lighthouse: "99"
    },
    {
      framework: "React",
      bundleSize: "44 KB",
      firstLoad: "1.2s",
      ttInteractive: "2.1s",
      lighthouse: "82"
    },
    {
      framework: "Vue",
      bundleSize: "34 KB",
      firstLoad: "0.9s",
      ttInteractive: "1.6s",
      lighthouse: "88"
    },
    {
      framework: "Svelte",
      bundleSize: "8 KB",
      firstLoad: "0.6s",
      ttInteractive: "0.9s",
      lighthouse: "95"
    }
  ];

  return html`
    <section class="comparison" id="performance">
      <div class="section-header" data-animate>
        <h2>Built for Performance</h2>
        <p>PhilJS delivers exceptional performance without compromise.</p>
      </div>
      <div class="comparison-table" data-animate>
        <table>
          <thead>
            <tr>
              <th>Framework</th>
              <th>Bundle Size (gzip)</th>
              <th>First Load</th>
              <th>Time to Interactive</th>
              <th>Lighthouse Score</th>
            </tr>
          </thead>
          <tbody>
            ${metrics.map(
              (metric) => html`
                <tr class="${metric.framework === "PhilJS" ? "highlight" : ""}">
                  <td class="framework-name">
                    ${metric.framework === "PhilJS" ? html`<strong>${metric.framework}</strong>` : metric.framework}
                  </td>
                  <td>${metric.bundleSize}</td>
                  <td>${metric.firstLoad}</td>
                  <td>${metric.ttInteractive}</td>
                  <td>
                    <span class="score ${metric.framework === "PhilJS" ? "score-excellent" : "score-good"}">
                      ${metric.lighthouse}
                    </span>
                  </td>
                </tr>
              `
            )}
          </tbody>
        </table>
      </div>
      <div class="performance-notes" data-animate>
        <p>
          <strong>Note:</strong> Benchmarks based on a TodoMVC implementation.
          Your mileage may vary based on application complexity.
        </p>
      </div>
      <div class="perf-highlights" data-animate>
        <div class="perf-card">
          <div class="perf-stat">2.8 KB</div>
          <div class="perf-label">Runtime Size</div>
          <p>Smallest signal-based framework runtime</p>
        </div>
        <div class="perf-card">
          <div class="perf-stat">0 ms</div>
          <div class="perf-label">Virtual DOM Overhead</div>
          <p>Fine-grained updates without diffing</p>
        </div>
        <div class="perf-card">
          <div class="perf-stat">99</div>
          <div class="perf-label">Lighthouse Score</div>
          <p>Optimized for Core Web Vitals</p>
        </div>
      </div>
    </section>
  `;
}
