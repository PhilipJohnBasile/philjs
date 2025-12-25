import { html } from "../server/template";

export function Testimonials() {
  const testimonials = [
    {
      quote:
        "We shipped a full marketing site with islands and saw a sharp drop in JS payload without losing interactivity.",
      author: "Sarah Chen",
      role: "Lead Engineer",
      company: "Northwind",
      stat: "42% less JS"
    },
    {
      quote:
        "PhilJS let us consolidate routing, SSR, and API tooling into one stack. The ecosystem actually fits together.",
      author: "Michael Rodriguez",
      role: "CTO",
      company: "MetricWorks",
      stat: "1 stack, 1 toolchain"
    },
    {
      quote:
        "Signals + SSR gave us fast dashboards with live updates. The devtools are the best way to debug reactivity.",
      author: "Emma Johnson",
      role: "Staff Engineer",
      company: "Skygrid",
      stat: "99 Lighthouse"
    },
    {
      quote:
        "We adopted PhilJS for our SaaS starter and shipped auth, billing, and analytics in weeks instead of months.",
      author: "David Park",
      role: "Product Engineer",
      company: "Launchbay",
      stat: "4 weeks to MVP"
    }
  ];

  return html`
    <section class="testimonials">
      <div class="section-header" data-animate>
        <h2>Teams shipping with PhilJS</h2>
        <p>Signals-first architecture, backed by a complete ecosystem.</p>
      </div>
      <div class="testimonials-grid">
        ${testimonials.map(
          (testimonial, index) => html`
            <div class="testimonial-card" data-animate style="--delay: ${index * 0.05}s">
              <div class="testimonial-content">
                <svg class="quote-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
                </svg>
                <p class="testimonial-quote">${testimonial.quote}</p>
              </div>
              <div class="testimonial-meta">
                <div class="testimonial-stat">${testimonial.stat}</div>
                <div class="testimonial-author">
                  <div class="author-avatar">
                    ${testimonial.author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div class="author-info">
                    <div class="author-name">${testimonial.author}</div>
                    <div class="author-role">${testimonial.role} - ${testimonial.company}</div>
                  </div>
                </div>
              </div>
            </div>
          `
        )}
      </div>
    </section>
  `;
}
