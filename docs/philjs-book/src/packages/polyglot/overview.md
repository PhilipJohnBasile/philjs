# Polyglot Bridge (`@philjs/polyglot`)

The web is not an island. PhilJS recognizes that the best libraries for certain tasks (Machine Learning, Data Science, System Utilities) live in other languages.

The **Polyglot Bridge** breaks down the wall between Node.js and the rest of the world.

## The Python Bridge

Connect to a persistent Python shell with zero latency. Unlike calling `exec('python script.py')`, which spins up a new process every time, `PythonBridge` maintains a session with shared context.

### Usage

```typescript
import { PythonBridge } from '@philjs/polyglot';

const bridge = new PythonBridge();

// 1. Define functions in one go
await bridge.exec(\`
import numpy as np

def analyze(data):
    return np.std(data)
\`);

// 2. Call them repeatedly from TypeScript
const stdDev = await bridge.call("analyze", [1, 2, 3, 4, 100]);
console.log(stdDev);
```

### How it works

1.  **IPC Pipes**: Data is sent via standard input/output streams or named pipes.
2.  **JSON/MsgPack**: Arguments are serialized efficiently.
3.  **Shared Memory**: (Experimental) Zero-copy transfer for Tensors.

## Rust Bridge

For performance-critical tasks, use the Rust bridge via N-API (see `@philjs/rust`).
