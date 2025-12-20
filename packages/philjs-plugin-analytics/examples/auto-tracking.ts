/**
 * Auto-tracking Example
 * Demonstrates automatic click and form tracking
 */

import { createAnalyticsPlugin } from "philjs-plugin-analytics";

// Enable auto-tracking
export const analyticsPlugin = createAnalyticsPlugin({
  provider: "ga4",
  trackingId: "G-XXXXXXXXXX",

  customEvents: {
    pageViews: true,  // Auto-track page views
    clicks: true,     // Auto-track clicks
    forms: true,      // Auto-track form submissions
    errors: true,     // Auto-track JavaScript errors
    performance: true, // Auto-track performance metrics
  },
});

// Example HTML with trackable elements
export const exampleHTML = `
<!-- Trackable button with data attributes -->
<button
  data-track-click="signup_button"
  data-track-location="homepage"
  data-track-variant="primary"
>
  Sign Up Now
</button>

<!-- Trackable link -->
<a
  href="/pricing"
  data-track-click="pricing_link"
  data-track-source="navbar"
>
  View Pricing
</a>

<!-- Trackable form -->
<form
  name="newsletter_signup"
  data-track-submit="newsletter"
>
  <input type="email" name="email" placeholder="Enter email" />
  <button type="submit">Subscribe</button>
</form>

<!-- Custom tracking -->
<div
  data-track-click="card_click"
  data-track-card-id="123"
  data-track-card-title="Feature Card"
>
  <h3>Amazing Feature</h3>
  <p>Click to learn more</p>
</div>
`;

// Usage in React component
export function TrackableButton({
  onClick,
  eventName = "button_click",
  ...props
}: any) {
  return (
    <button
      onClick={onClick}
      data-track-click={eventName}
      data-track-component="trackable-button"
      {...props}
    >
      {props.children}
    </button>
  );
}

// Usage in forms
export function TrackableForm({ onSubmit, formName, ...props }: any) {
  return (
    <form
      onSubmit={onSubmit}
      name={formName}
      data-track-form={formName}
      {...props}
    >
      {props.children}
    </form>
  );
}
