# Charts, Graphics, and Diagrams

This chapter provides the visuals referenced throughout the book. Use them as anchors when reviewing routing flow, SSR pipelines, state graphs, and performance metrics.

## Architecture and routing

![Architecture overview](../../visuals/architecture-overview.svg "Router, loaders/actions, cache, SSR/islands, client hydration")

![Routing data flow](../../visuals/routing-data-flow.svg "Read path and mutation invalidation loop")

## SSR and state

![SSR streaming pipeline](../../visuals/ssr-streaming-pipeline.svg "Streaming SSR from edge to hydration")

![State graph](../../visuals/state-graph.svg "Signals, memos, effects, resources, and stores")

## Observability and deployment

![Observability pipeline](../../visuals/observability-pipeline.svg "Instrumentation to logs, metrics, traces, and alerts")

![Deployment topologies](../../visuals/deployment-topologies.svg "Static/ISR, edge, and regional layouts")

## Performance charts

![Performance metrics](../../visuals/performance-metrics.svg "TTFB and LCP trends over time")

## Appendix visuals

![Type narrowing flow](../../visuals/ts-narrowing-flow.svg "How narrowing proceeds through guards")

![Rust ownership](../../visuals/rust-ownership.svg "Ownership and borrowing rules")

## Notes

- All visuals are SVG for clarity in PDF and EPUB exports.
- Keep alt text in place for accessibility and searchability.
- Update diagrams in `docs/philjs-book/visuals` if any workflows change.

