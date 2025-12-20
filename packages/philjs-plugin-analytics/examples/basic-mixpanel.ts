/**
 * Basic Mixpanel Example
 */

import { createAnalyticsPlugin } from "philjs-plugin-analytics";

// Create the plugin
export const analyticsPlugin = createAnalyticsPlugin({
  provider: "mixpanel",
  trackingId: "YOUR_PROJECT_TOKEN",

  // Mixpanel-specific options
  options: {
    persistence: "localStorage", // or "cookie"
    debug: false,
  },

  // Privacy settings
  privacy: {
    anonymizeIp: true,
    respectDnt: true,
  },

  // Custom event tracking
  customEvents: {
    pageViews: true,
    errors: true,
  },
});

// Use in PhilJS config
export default {
  plugins: [analyticsPlugin],
};
