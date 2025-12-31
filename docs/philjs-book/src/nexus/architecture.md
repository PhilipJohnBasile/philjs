# Local-First and GenUI

PhilJS takes inspiration from the Nexus architecture: local-first data with agent-driven UI.

## Local-First Data

- Data lives in the client by default.
- Sync engines reconcile changes in the background.
- Signals subscribe to local queries instead of network fetches.

## Generative UI

- Agents compose UI layouts from a registry of components.
- The client validates schemas before rendering.
- Components are web-component compatible for portability.

## What This Means for PhilJS

- Signals remain the core reactive primitive.
- SSR and islands provide predictable performance.
- Tooling emphasizes schemas, registries, and strict validation.
