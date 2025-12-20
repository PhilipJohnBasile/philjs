/**
 * Basic Google Analytics 4 Example
 */

import { createAnalyticsPlugin } from "philjs-plugin-analytics";

// Create the plugin
export const analyticsPlugin = createAnalyticsPlugin({
  provider: "ga4",
  trackingId: "G-XXXXXXXXXX",

  // Privacy settings
  privacy: {
    anonymizeIp: true,
    respectDnt: true,
  },

  // Auto-tracking
  customEvents: {
    pageViews: true,
    errors: true,
  },
});

// Use in PhilJS config
export default {
  plugins: [analyticsPlugin],
};
