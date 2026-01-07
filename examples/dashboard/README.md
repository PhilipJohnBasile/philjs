# PhilJS Dashboard

An admin dashboard showcasing charts, data tables, and real-time updates.

## Features

- Interactive charts and graphs
- Data tables with sorting and filtering
- Real-time data updates
- Responsive layout

## Prerequisites

- Node.js 24+ (Node 25 supported)
- pnpm

## Running the App

```bash
# From repository root
pnpm install
pnpm build

# From examples/dashboard
cd examples/dashboard
pnpm dev
```

The development server starts at `http://localhost:5173`.

## Build for Production

```bash
pnpm build
pnpm preview
```

## PhilJS Features Used

- `signal()` - Reactive metrics and filters
- `memo()` - Computed chart data
- `resource()` - Async data fetching
- Data visualization components
