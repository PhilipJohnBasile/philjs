# Chapter 6: The Compute Layer

For a long time, JavaScript was the language of UI, and Python was the language of Math. If you wanted to run a neural network or calculate a covariance matrix, you sent the data to a Python backend.

PhilJS challenges this split. With **Node 24** and the **V8 Sandbox**, JavaScript is now a systems language capable of high-performance numerics.

## The Tensor Primitive

The `@philjs/science` package brings a NumPy-compatible `Tensor` to the runtime.

```typescript
import { Tensor } from '@philjs/science';

// Create a 2D tensor (matrix)
const a = Tensor.from([[1, 2], [3, 4]]);
const b = Tensor.eye(2); // Identity matrix

// Operations are vectorized and executed in C++ via Node addons
const c = a.matmul(b).add(10);

console.log(c.toString());
// [[11, 12],
//  [13, 14]]
```

Why do this in Node? Because **Latency matters**. If you are building a recommendation engine, round-tripping to a Python microservice adds generic overhead. Calculating dot products directly in the application layer serves recommendations in microseconds, not milliseconds.

## Polyglot: Crossing the Bridge

Sometimes you simply *must* use Python. Maybe you need a specific SciPy function or a legacy library.

The `@philjs/polyglot` package provides a zero-latency bridge between the Node.js runtime and a sidecar Python process.

```typescript
import { PythonBridge } from '@philjs/polyglot';

const py = new PythonBridge();

// Define a Python function inline
await py.exec(\`
import numpy as np

def calculate_risk(data):
    arr = np.array(data)
    return float(np.std(arr))
\`);

// Call it from TypeScript
const data = [10, 12, 10, 11, 40, 10];
const risk = await py.call('calculate_risk', data);

console.log(\`Risk Factor: \${risk}\`);
```

This is not a simple HTTP request. PhilJS uses **Shared Memory** (where available) or high-speed IPC pipes to transfer data, minimizing serialization costs.

## Edge Inference

The ultimate goal of the Compute Layer is to run AI inference on the Edge.

PhilJS integrates with ONNX Runtime Web to load standard models.

```typescript
import { InferenceSession, Tensor } from '@philjs/ai';

const session = await InferenceSession.create('./mobilenet.onnx');
const input = Tensor.fromImage(imageBitmap);
const output = await session.run({ input });
```

This allows you to run computer vision and NLP tasks locally on the user's device or properly on the edge worker, preserving privacy and reducing cloud costs.
