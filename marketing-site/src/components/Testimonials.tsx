import { html } from "../server/template";

export function Testimonials() {
  const testimonials = [
    {
      quote: "PhilJS brings the best of signals to the web. The fine-grained reactivity is incredible and the DX is top-notch.",
      author: "Sarah Chen",
      role: "Senior Developer at TechCorp",
      avatar: "SC"
    },
    {
      quote: "We migrated our dashboard from React and saw a 60% reduction in bundle size and significantly improved load times.",
      author: "Michael Rodriguez",
      role: "CTO at DataViz",
      avatar: "MR"
    },
    {
      quote: "The islands architecture is a game-changer. We ship almost no JavaScript for our marketing pages while keeping interactivity where needed.",
      author: "Emma Johnson",
      role: "Lead Engineer at CloudStart",
      avatar: "EJ"
    },
    {
      quote: "Best framework I've used for building fast, modern web apps. The TypeScript support and DevTools make development a breeze.",
      author: "David Park",
      role: "Full Stack Developer",
      avatar: "DP"
    }
  ];

  return html`
    <section class="testimonials">
      <div class="section-header" data-animate>
        <h2>Loved by Developers</h2>
        <p>See what developers are saying about PhilJS.</p>
      </div>
      <div class="testimonials-grid">
        ${testimonials.map(
          (testimonial) => html`
            <div class="testimonial-card" data-animate>
              <div class="testimonial-content">
                <svg class="quote-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
                </svg>
                <p class="testimonial-quote">${testimonial.quote}</p>
              </div>
              <div class="testimonial-author">
                <div class="author-avatar">${testimonial.avatar}</div>
                <div class="author-info">
                  <div class="author-name">${testimonial.author}</div>
                  <div class="author-role">${testimonial.role}</div>
                </div>
              </div>
            </div>
          `
        )}
      </div>
    </section>
  `;
}
