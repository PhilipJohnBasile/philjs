# PhilJS Collaborative Editor

A collaborative document editor demonstrating real-time synchronization with PhilJS.

## Features

- Real-time collaborative editing
- Conflict resolution with CRDTs
- User cursors and presence

## Prerequisites

- Node.js 24+ (Node 25 supported)
- pnpm

## Running the App

```bash
# From repository root
pnpm install
pnpm build

# From examples/collab-editor
cd examples/collab-editor
pnpm dev
```

The development server starts at `http://localhost:5173`.

## Build for Production

```bash
pnpm build
pnpm preview
```

## PhilJS Features Used

- `signal()` - Document state management
- `createStore()` - Deep reactive store for complex document structure
- WebSocket integration for real-time sync
