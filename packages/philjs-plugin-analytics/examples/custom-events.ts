/**
 * Custom Event Tracking Example
 */

import { analytics, trackEvent, identifyUser, setUserProperties } from "philjs-plugin-analytics/client";

// Initialize analytics (usually done by the plugin)
analytics.init({
  provider: "ga4",
  trackingId: "G-XXXXXXXXXX",
});

// Track custom events
export function trackButtonClick(buttonName: string) {
  trackEvent("button_click", {
    button_name: buttonName,
    timestamp: Date.now(),
  });
}

// Track signup
export function trackSignup(method: string) {
  trackEvent("signup", {
    method, // "email", "google", "github", etc.
    timestamp: Date.now(),
  });
}

// Identify user after login
export function onUserLogin(userId: string, email: string, plan: string) {
  identifyUser(userId, {
    email,
    plan,
    signup_date: new Date().toISOString(),
  });
}

// Update user properties
export function onUserUpgrade(newPlan: string) {
  setUserProperties({
    plan: newPlan,
    upgrade_date: new Date().toISOString(),
  });

  trackEvent("plan_upgrade", {
    new_plan: newPlan,
  });
}

// Track feature usage
export function trackFeatureUsage(feature: string) {
  trackEvent("feature_used", {
    feature_name: feature,
    timestamp: Date.now(),
  });
}

// Track errors
export function trackCustomError(error: Error, context?: Record<string, any>) {
  trackEvent("custom_error", {
    error_message: error.message,
    error_stack: error.stack,
    ...context,
  });
}
