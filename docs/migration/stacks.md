# Migrating MEAN / MERN to PhilJS Stack

The MEAN (Mongo, Express, Angular, Node) and MERN (React) stacks have been industry standards. PhilJS offers a unified replacement that simplifies the entire chain.

## The PhilJS Stack

| Layer | MEAN/MERN | PhilJS Equivalent | Advantage |
|:------|:----------|:------------------|:----------|
| **Database** | MongoDB | `@philjs/mongodb` + Native Driver | Type-safe schema validation out of the box. |
| **Backend** | Express/Node | `@philjs/server` + `@philjs/express` | Unified build, shared types between front/back. |
| **Frontend** | Angular/React | PhilJS Core | Faster signals, smaller bundles, zero-config SSR. |
| **Language** | JS/TS | TypeScript (Strict) | End-to-end type safety. |

## Migration Steps

### 1. Database
Your MongoDB data stays the same.
- **Action**: Replace Mongoose/native driver with `@philjs/mongoose` or `@philjs/mongodb` for better signal integration.

### 2. Backend
- **Action**: Wrap your existing Express routes with `createPhilJSMiddleware()` to add SSR capabilities instantly.
- **Goal**: Move towards file-system based routing in `src/routes` over time.

### 3. Frontend
- **React**: Use the `Universal Component Protocol` to use your existing React components inside PhilJS pages while you refactor to signals.
- **Angular**: Use `@philjs/di` to keep your services architecture while replacing templates with JSX.

## Architecture

**MERN**:
Client (React) <--> JSON API <--> Express <--> Mongo

**PhilJS**:
Client <--> Server Actions (RPC) <--> Mongo
(No manual serialization/fetching needed)
