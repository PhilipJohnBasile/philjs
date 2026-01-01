# @philjs/analytics

Privacy-First Analytics for PhilJS Applications

[![Node.js 24+](https://img.shields.io/badge/Node.js-24%2B-339933?logo=node.js)](https://nodejs.org/)
[![TypeScript 6](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Built-in analytics that respect user privacy by default. No third-party scripts, no cookies, GDPR/CCPA compliant by design.

**Features:**
- No third-party scripts or cookies
- Client-side or edge processing
- GDPR/CCPA compliant by design
- Differential privacy for sensitive metrics
- HyperLogLog for unique visitor estimates
- Core Web Vitals tracking (LCP, FID, CLS, INP, TTFB, FCP)
- K-anonymity aggregation threshold
- Consent management built-in

## Installation

```bash
npm install @philjs/analytics
```

## Quick Start

```typescript
import { initAnalytics, useAnalytics } from '@philjs/analytics';

// Initialize analytics
const analytics = initAnalytics({
  enabled: true,
  respectDoNotTrack: true,
  trackWebVitals: true,
  trackPageViews: true
});

// Track custom events
analytics.track('button_click', { buttonId: 'signup' });

// Track page views
analytics.trackPageView('/dashboard');
```

## Usage

### Basic Configuration

```typescript
import { PrivacyFirstAnalytics } from '@philjs/analytics';

const analytics = new PrivacyFirstAnalytics({
  enabled: true,
  respectDoNotTrack: true,
  differentialPrivacy: true,
  privacyBudget: 1.0,
  aggregateFirst: true,
  minAggregationCount: 5,
  retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
  requireConsent: true,
  trackWebVitals: true,
  trackPageViews: true,
  trackClicks: true,
  trackScroll: true,
  trackErrors: true
});
```

### Consent Management

```typescript
import { useConsent } from '@philjs/analytics';

const { consent, setConsent, isConsentRequired } = useConsent();

// Set user consent
setConsent({
  analytics: true,
  performance: true,
  errors: true
});
```

### Get Aggregated Metrics

```typescript
const metrics = analytics.getMetrics();

console.log('Unique visitors:', metrics.uniqueVisitors);
console.log('Top pages:', metrics.topPages);
console.log('Web Vitals:', metrics.webVitals);
console.log('Bounce rate:', metrics.bounceRate);
```

### Hooks API

```typescript
import { useAnalytics } from '@philjs/analytics';

function MyComponent() {
  const { track, trackPageView, getMetrics } = useAnalytics();

  track('feature_used', { feature: 'export' });
  trackPageView('/reports');

  const metrics = getMetrics();
}
```

## API Reference

### Classes

#### `PrivacyFirstAnalytics`
Main analytics engine with privacy-preserving features.

**Methods:**
- `track(eventName, data?)` - Track custom events
- `trackPageView(page?)` - Track page views
- `setConsent(consent)` - Set user consent state
- `getConsent()` - Get current consent state
- `getMetrics()` - Get aggregated metrics
- `exportData()` - Export anonymized data as JSON
- `clearData()` - Clear all stored data
- `destroy()` - Cleanup and remove listeners

### Functions

- `initAnalytics(config?)` - Initialize global analytics instance
- `getAnalytics()` - Get the global analytics instance
- `resetAnalytics()` - Reset analytics (for testing)
- `useAnalytics()` - Hook for analytics operations
- `useConsent()` - Hook for consent management

### Types

```typescript
interface PrivacyConfig {
  enabled: boolean;
  respectDoNotTrack: boolean;
  differentialPrivacy: boolean;
  privacyBudget: number;
  aggregateFirst: boolean;
  minAggregationCount: number;
  retentionPeriod: number;
  requireConsent: boolean;
  storageKey: string;
  endpoint?: string;
  trackWebVitals: boolean;
  trackPageViews: boolean;
  trackClicks: boolean;
  trackScroll: boolean;
  trackErrors: boolean;
}

interface AggregatedMetrics {
  periodStart: number;
  periodEnd: number;
  pageViews: Map<string, number>;
  uniqueVisitors: number;
  avgSessionDuration: number;
  bounceRate: number;
  topPages: { page: string; count: number }[];
  webVitals: WebVitalsAggregate;
  errorCounts: Map<string, number>;
  devices: { mobile: number; tablet: number; desktop: number };
}

interface ConsentState {
  analytics: boolean;
  performance: boolean;
  errors: boolean;
  timestamp: number;
  version: number;
}
```

## Privacy Features

- **Differential Privacy**: Adds calibrated noise to protect individual contributions
- **K-Anonymity**: Only reports metrics meeting minimum aggregation thresholds
- **PII Sanitization**: Automatically removes emails, phone numbers from tracked data
- **Do Not Track**: Respects browser DNT and Global Privacy Control signals
- **Path Anonymization**: Removes IDs from URL paths (e.g., `/users/123` -> `/users/[id]`)
- **Timestamp Rounding**: Rounds timestamps to nearest minute

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./privacy-first
- Source files: packages/philjs-analytics/src/privacy-first.ts

### Public API
- Direct exports: AggregatedMetrics, AnalyticsEvent, ConsentState, EventType, PrivacyConfig, PrivacyFirstAnalytics, WebVitalsAggregate, getAnalytics, initAnalytics, resetAnalytics, useAnalytics, useConsent
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT
