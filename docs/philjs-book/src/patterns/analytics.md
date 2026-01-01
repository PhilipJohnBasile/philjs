# Analytics and Instrumentation

Measure what matters while respecting performance and privacy.

## Principles

- Minimal, purposeful events; avoid noisy firehose.
- Sample where appropriate to limit cost and overhead.
- Respect user privacy and consent; avoid sensitive data.

## Events to capture

- Page/route views with route id and cache status.
- Key actions (sign-ups, conversions, feature use).
- Performance milestones (TTFB, hydration, LCP) if allowed by your APM.
- Experiment/feature flag assignments.

## Implementation

- Central analytics client; queue events and batch send.
- Ensure edge-safe API usage if sending from server/SSR.
- Avoid blocking navigation; sendBeacon/fetch with timeout.

## Privacy and compliance

- Honor consent (GDPR/CCPA); allow opt-out.
- Redact PII; avoid raw user content in events.
- Short retention for sensitive metrics; anonymize where possible.

## Testing

- Unit-test event builders for correct shape and redaction.
- Integration: assert key events fire on actions in jsdom/Playwright.
- Verify sampling works: e.g., 10% sample for heavy events.

## Checklist

- [ ] Event schema defined and versioned.
- [ ] Batching + backoff implemented; non-blocking.
- [ ] Consent/opt-out respected; PII redacted.
- [ ] Events include route/flag/variant context where relevant.
