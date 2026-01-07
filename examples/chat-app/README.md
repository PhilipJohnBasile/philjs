# PhilJS Chat App

A real-time chat application demonstrating PhilJS's reactivity and state management.

## Features

- Real-time messaging with signals
- User presence tracking
- Message history

## Prerequisites

- Node.js 24+ (Node 25 supported)
- pnpm

## Running the App

```bash
# From repository root
pnpm install
pnpm build

# From examples/chat-app
cd examples/chat-app
pnpm dev
```

The development server starts at `http://localhost:5173`.

## Build for Production

```bash
pnpm build
pnpm preview
```

## PhilJS Features Used

- `signal()` - Reactive state for messages and users
- `effect()` - Side effects for WebSocket connections
- JSX rendering with automatic updates
