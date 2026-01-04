
# @philjs/edge

Edge AI Runtime & Quantization.

## Features
- **Local Inference**: Run ONNX/TFLite models in-browser.
- **Quantizer**: Compress Float32 models to Int8.
- **WASM Bridge**: High-performance mock runtime.

## Usage
```typescript
import { EdgeModel } from '@philjs/edge';
const model = await EdgeModel.load('./model.onnx');
const result = await model.run(inputData);
```
