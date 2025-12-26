# @philjs/tokio

Tokio runtime integration for PhilJS applications. Connect async Rust backends powered by Tokio with PhilJS frontends for high-performance, concurrent applications.

## Installation

```bash
npm install @philjs/tokio
# or
yarn add @philjs/tokio
# or
pnpm add @philjs/tokio
```

**Rust (Cargo.toml):**
```toml
[dependencies]
philjs-tokio = "0.1"
tokio = { version = "1", features = ["full"] }
```

## Basic Usage

**TypeScript:**
```tsx
import { TokioClient, useTokioStream, useTokioTask } from '@philjs/tokio';

const client = new TokioClient('ws://localhost:9000');

function Dashboard() {
  // Subscribe to real-time data stream
  const { data: metrics } = useTokioStream('system_metrics');

  // Execute async task
  const { execute, isRunning } = useTokioTask('process_data');

  return (
    <div>
      <MetricsChart data={metrics} />
      <button onClick={() => execute({ batch: 1000 })} disabled={isRunning}>
        Process Data
      </button>
    </div>
  );
}
```

**Rust:**
```rust
use philjs_tokio::prelude::*;
use tokio::sync::broadcast;

#[philjs_stream]
async fn system_metrics(tx: broadcast::Sender<Metrics>) {
    loop {
        let metrics = collect_metrics().await;
        tx.send(metrics).unwrap();
        tokio::time::sleep(Duration::from_secs(1)).await;
    }
}

#[philjs_task]
async fn process_data(batch: usize) -> Result<ProcessResult, Error> {
    let data = fetch_batch(batch).await?;
    process_batch(data).await
}

#[tokio::main]
async fn main() {
    PhilJSRuntime::new()
        .stream("system_metrics", system_metrics)
        .task("process_data", process_data)
        .serve("0.0.0.0:9000")
        .await;
}
```

## Features

- **Async Streams** - Subscribe to real-time Tokio channels
- **Task Execution** - Run async tasks from the frontend
- **Connection Pool** - Efficient WebSocket connection management
- **Backpressure** - Handle fast producers gracefully
- **Reconnection** - Automatic reconnection with backoff
- **Type Safety** - Generated TypeScript types from Rust
- **Concurrency** - Leverage Tokio's async runtime
- **Cancellation** - Cancel running tasks from frontend
- **Progress** - Track long-running task progress
- **Batching** - Batch multiple requests efficiently

## Hooks

| Hook | Description |
|------|-------------|
| `useTokioStream` | Subscribe to async streams |
| `useTokioTask` | Execute async tasks |
| `useTokioState` | Shared state synchronization |
| `useTokioChannel` | Bidirectional channels |

## Macros

```rust
#[philjs_stream]  // Define a subscribable stream
#[philjs_task]    // Define an executable task
#[philjs_state]   // Define synchronized state
#[philjs_channel] // Define bidirectional channel
```

## License

MIT
