# Local-First and GenUI

Nexus architecture combines local-first data with generative UI. PhilJS is built to support both without sacrificing performance or control.

## Local-first foundation

- Treat the client as the source of truth.
- Use embedded storage (SQLite, CRDTs) and sync engines.
- Render from local data, not round-trips.

## Generative UI readiness

- UI can be composed dynamically from a registry of components.
- Agent output must be validated against schemas.
- Interactive components must be allow-listed.

## PhilJS alignment

- Signals for fine-grained updates
- Web Components for interoperable primitives
- SSR + islands to keep payloads small

## Nexus checklist

- Local data reads are synchronous and reactive
- AI-generated layouts are schema-validated
- Security boundaries prevent UI injection
- Accessibility is enforced at render time
