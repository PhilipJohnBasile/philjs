# Logging and Tracing Deep Dive

Instrument PhilJS apps so you can pinpoint regressions and production issues quickly.

## Logging

- Use structured logs (JSON) with `event`, `ts`, `reqId`, `route`, `loader`, `status`, `ms`, and `cache` fields.
- Redact PII; never log secrets/tokens.
- Include build/version/hash to correlate with releases.
- For client logs, sample to avoid noise; ship only errors/warnings plus key breadcrumbs.

## Tracing

- Use OpenTelemetry where possible; wrap loaders/actions/SSR rendering in spans.
- Tag spans with `route`, `params`, `cacheHit`, and downstream API names.
- Propagate trace/req ids between client and server; include in logs for correlation.
- Record SSR TTFB, render duration, and hydration metrics as spans or metrics.

## Metrics

- Core: TTFB, LCP/FID/CLS (RUM), hydration time, cache hit ratio, error rates, cold starts.
- Business: conversion, drop-off per step, feature flag impact.
- Edge/serverless: cold start counts, memory/timeouts, tail latency.

## Pipelines

- Edge/serverless: send logs to platform drains (Vercel/Netlify/CF) or external log stores.
- Browsers: buffer and batch client logs; avoid blocking UX.
- Traces/metrics: export via OTLP/HTTP to your APM; minimize overhead in edge runtimes.

## Dashboards to build

- Performance: TTFB, LCP, hydration, cache hits/misses, bundle sizes.
- Reliability: error rates per route/loader/action, top stack traces, cold starts.
- Business: funnel conversion, feature flag outcomes, AI success/failure and cost (if using AI).

## Alerting

- Budget breaches: TTFB, LCP, bundle size, cache hit ratio.
- Error spikes: per route/loader/action.
- Cold start spikes (edge/serverless).
- AI failures/cost spikes (if applicable).

## Testing instrumentation

- In CI, assert presence of required headers (trace ids, cache headers) in Playwright tests.
- Add unit tests for log redaction and schema (e.g., log objects validate against a Zod schema).
- Use fixtures to ensure trace context propagates through loaders/actions.

## Checklist

- [ ] Structured logs with reqId/traceId/build.
- [ ] Spans for loaders/actions/SSR; tags for cache hit/miss.
- [ ] Core metrics emitted and dashboarded.
- [ ] Alerts for performance, errors, and cold starts.
- [ ] Log redaction and sampling in place.
