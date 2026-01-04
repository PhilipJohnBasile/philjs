# Research: TanStack Start & React Server Components

**Status**: Monitoring / Research Phase
**Ticket**: #76

## Overview
TanStack Start is a new meta-framework pushing boundaries with standardized APIs. PhilJS should study its approach to **React Server Components (RSC)**.

## Key Findings

1. **RSC Protocol**: The wire format is complex but offers streaming capabilities PhilJS partially matches with its own serialization.
2. **Server Functions**: Similar to PhilJS "Server Actions", but deeply integrated into the module graph.
3. **Router Integration**: TanStack Router type-safety is best-in-class. PhilJS Router should emulate its search param validation.

## Recommendation for PhilJS
- **Do not adopt RSC wholesale yet**. The complexity cost is high.
- **Adopt "Server Functions" pattern**. Ensure our RPC mechanism is as seamless as simple function calls.
- **Study Streaming**: Improve `@philjs/ssr` to support fine-grained suspense boundaries similar to RSC streaming.
