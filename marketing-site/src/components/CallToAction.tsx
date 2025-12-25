import { html } from "../server/template";

export function CallToAction() {
  return html`
    <section class="cta-banner" data-animate>
      <div class="cta-content">
        <h2>Start shipping with PhilJS</h2>
        <p>Move from prototype to production with a full ecosystem of packages and tooling.</p>
      </div>
      <div class="cta-actions">
        <a href="#get-started" class="btn btn-primary" data-prefetch>Get Started</a>
        <a href="https://docs.philjs.dev" class="btn btn-outline" target="_blank" rel="noopener noreferrer">
          View Docs
        </a>
      </div>
    </section>
  `;
}
