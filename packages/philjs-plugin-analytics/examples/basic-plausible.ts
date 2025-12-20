/**
 * Basic Plausible Analytics Example
 */

import { createAnalyticsPlugin } from "philjs-plugin-analytics";

// Create the plugin
export const analyticsPlugin = createAnalyticsPlugin({
  provider: "plausible",
  trackingId: "yourdomain.com",

  // Plausible-specific options
  options: {
    domain: "yourdomain.com",
    apiHost: "https://plausible.io",
    hashMode: false, // Set to true for hash-based routing
  },

  // Privacy-first (Plausible is privacy-focused by default)
  privacy: {
    respectDnt: true,
  },
});

// Use in PhilJS config
export default {
  plugins: [analyticsPlugin],
};
