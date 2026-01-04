# Research: AdonisJS Patterns

**Status**: Monitoring
**Ticket**: #78

## Overview
AdonisJS is a "batteries-included" Node.js framework inspired by Laravel. PhilJS aims to be the "Batteries-included" frontend/fullstack equivalent.

## Key Patterns to Adopt

1. **Service Providers**: Adonis (like Laravel) uses a clear Provider pattern for booting application state. PhilJS could use this for plugin initialization.
2. **REPL**: Adonis has `node ace repl`. PhilJS should have a runtime REPL for inspecting signals and state.
3. **Validator**: VineJS (Adonis validator) is fast. Check if `@philjs/forms` can perform similar compiled validation.

## Action Items
- Prototype a `philjs repl` command.
- Review `@philjs/di` to support "Boot" vs "Ready" lifecycle phases similar to Adonis Providers.
